import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu'
const UCLA_DINING_ACTIVITY_PATH = '/wp-content/plugins/activity-meter/activity_ajax.php'
const UCLA_TIME_ZONE = 'America/Los_Angeles'
const GOBOARD_API_URL =
  'https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=73829a91-48cb-4b7b-bd0b-8cf4134c04cd'
const USER_AGENT = 'BruinGainsCampusActivitySync/1.0 (+https://afxptjzzctiowrqqcyzh.supabase.co)'
const FETCH_TIMEOUT_MS = 15000
const DINING_FETCH_CONCURRENCY = 3

const GYM_TARGETS = [
  {
    facilityId: 802,
    facilityName: 'John Wooden Center - FITWELL',
    gymLocationId: 'wooden',
  },
  {
    facilityId: 803,
    facilityName: 'Bruin Fitness Center - FITWELL',
    gymLocationId: 'bfit',
  },
] as const

const GYM_WEEKLY_HOURS = {
  wooden: {
    Monday: '5:15 AM - 1:00 AM',
    Tuesday: '5:15 AM - 1:00 AM',
    Wednesday: '5:15 AM - 1:00 AM',
    Thursday: '5:15 AM - 1:00 AM',
    Friday: '5:15 AM - 10:00 PM',
    Saturday: '8:00 AM - 8:00 PM',
    Sunday: '8:00 AM - 11:00 PM',
  },
  bfit: {
    Monday: '6:00 AM - 12:00 AM',
    Tuesday: '6:00 AM - 12:00 AM',
    Wednesday: '6:00 AM - 12:00 AM',
    Thursday: '6:00 AM - 12:00 AM',
    Friday: '6:00 AM - 9:00 PM',
    Saturday: '9:00 AM - 6:00 PM',
    Sunday: '9:00 AM - 9:00 PM',
  },
} as const

type SyncRequest = {
  includeDining?: boolean
  includeGyms?: boolean
  trigger?: string
}

type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'lateNight'

type DiningHallRow = {
  breakfast_hours: string | null
  dinner_hours: string | null
  fit_percent: number | null
  id: string
  late_night_hours: string | null
  lunch_hours: string | null
  name: string
  source_path: string | null
}

type GymSourceLocation = {
  FacilityId: number
  FacilityName: string
  IsClosed: boolean
  LastCount: number
  LastUpdatedDateAndTime: string | null
  LocationId: number
  LocationName: string
  TotalCapacity: number
}

type DiningSyncResult = {
  fitPercent: number | null
  hallId: string
  locationId: string | null
  openNow: boolean
  status: 'updated' | 'cleared' | 'preserved_on_error'
}

type GymSyncResult = {
  hours: string
  isClosed: boolean
  locationId: string
  percent: number
  status: 'inserted'
  zoneName: string
}

type GymZoneBreakdown = {
  capacity: number
  count: number
  name: string
  percent: number
}

type SyncSummary = {
  dining: DiningSyncResult[]
  errors?: {
    dining?: string
    gyms?: string
  }
  gyms: GymSyncResult[]
  status: 'success' | 'partial_failure' | 'failure'
  trigger: string
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function createAdminClient() {
  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeComparableValue(value: string | null | undefined) {
  return cleanText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} for ${url}`)
  }

  return await response.text()
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} for ${url}`)
  }

  return (await response.json()) as T
}

async function mapLimit<TInput, TOutput>(
  values: TInput[],
  limit: number,
  mapper: (value: TInput, index: number) => Promise<TOutput>,
) {
  const results: TOutput[] = new Array(values.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const currentIndex = nextIndex
      nextIndex += 1

      if (currentIndex >= values.length) {
        break
      }

      results[currentIndex] = await mapper(values[currentIndex], currentIndex)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  )

  return results
}

function getLosAngelesCurrentMinutes() {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: UCLA_TIME_ZONE,
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return Number.parseInt(values.hour, 10) * 60 + Number.parseInt(values.minute, 10)
}

function getLosAngelesWeekday() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: UCLA_TIME_ZONE,
    weekday: 'long',
  }).format(new Date())
}

function getPreviousWeekday(weekday: string) {
  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]
  const currentIndex = weekdays.indexOf(weekday)
  return weekdays[(currentIndex + weekdays.length - 1) % weekdays.length]
}

function parseClockMinutes(value: string) {
  const match = cleanText(value).match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i)

  if (!match) {
    return null
  }

  const hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)
  const marker = match[3].toLowerCase()
  let normalizedHour = hour % 12

  if (marker === 'p') {
    normalizedHour += 12
  }

  return normalizedHour * 60 + minute
}

function parseTimeRange(range: string) {
  const [startValue, endValue] = cleanText(range).split(/\s*-\s*/)

  if (!startValue || !endValue) {
    return null
  }

  const startMinutes = parseClockMinutes(startValue)
  const endMinutes = parseClockMinutes(endValue)

  if (startMinutes === null || endMinutes === null) {
    return null
  }

  return {
    crossesMidnight: startMinutes >= endMinutes,
    endMinutes,
    startMinutes,
  }
}

function getCurrentDiningActivityPeriod(currentMinutes: number): MealPeriod | null {
  if (currentMinutes >= 5 * 60 && currentMinutes < 11 * 60) {
    return 'breakfast'
  }

  if (currentMinutes >= 11 * 60 && currentMinutes < 17 * 60) {
    return 'lunch'
  }

  if (currentMinutes >= 17 * 60 && currentMinutes < 22 * 60) {
    return 'dinner'
  }

  if (currentMinutes >= 22 * 60 && currentMinutes < 24 * 60) {
    return 'lateNight'
  }

  return null
}

function hasHoursForPeriod(hall: DiningHallRow, mealPeriod: MealPeriod) {
  if (mealPeriod === 'breakfast') {
    return Boolean(hall.breakfast_hours)
  }

  if (mealPeriod === 'lunch') {
    return Boolean(hall.lunch_hours)
  }

  if (mealPeriod === 'dinner') {
    return Boolean(hall.dinner_hours)
  }

  return Boolean(hall.late_night_hours)
}

function parseDiningActivityLocationId(pageHtml: string) {
  const candidatePayloads = [pageHtml]

  for (const match of pageHtml.matchAll(
    /<script[^>]+src=["']data:text\/javascript;base64,([A-Za-z0-9+/=]+)["']/g,
  )) {
    try {
      candidatePayloads.push(atob(match[1]))
    } catch {
      // Ignore malformed embedded scripts and continue scanning.
    }
  }

  for (const payload of candidatePayloads) {
    const locationIdMatch = payload.match(
      /(?:location_id["']?\s*[:=]\s*["']?)(\d+)/i,
    )

    if (locationIdMatch?.[1]) {
      return locationIdMatch[1]
    }
  }

  return null
}

async function fetchDiningActivityPercent(locationId: string) {
  const html = await fetchText(
    `${UCLA_DINING_BASE_URL}${UCLA_DINING_ACTIVITY_PATH}?location_id=${locationId}`,
  )
  const match = html.match(/id="activity-level">\s*(\d+)%/i)

  return match ? Number.parseInt(match[1], 10) : null
}

function clampLoad(value: number) {
  return Math.max(0, Math.min(1, value))
}

function getGymHoursForWeekday(
  gymLocationId: (typeof GYM_TARGETS)[number]['gymLocationId'],
  weekday: string,
) {
  return GYM_WEEKLY_HOURS[gymLocationId][weekday as keyof (typeof GYM_WEEKLY_HOURS)[typeof gymLocationId]] ?? null
}

function getEffectiveGymHours(
  gymLocationId: (typeof GYM_TARGETS)[number]['gymLocationId'],
  currentMinutes: number,
  weekday: string,
) {
  const todaysHours = getGymHoursForWeekday(gymLocationId, weekday)
  const todaysRange = todaysHours ? parseTimeRange(todaysHours) : null

  if (todaysRange) {
    const isOpenToday = todaysRange.crossesMidnight
      ? currentMinutes >= todaysRange.startMinutes || currentMinutes < todaysRange.endMinutes
      : currentMinutes >= todaysRange.startMinutes && currentMinutes < todaysRange.endMinutes

    if (isOpenToday) {
      return {
        hours: todaysHours,
        isOpenNow: true,
      }
    }
  }

  const previousHours = getGymHoursForWeekday(gymLocationId, getPreviousWeekday(weekday))
  const previousRange = previousHours ? parseTimeRange(previousHours) : null

  if (previousRange?.crossesMidnight && currentMinutes < 4 * 60) {
    return {
      hours: todaysHours ?? previousHours,
      isOpenNow:
        previousRange.endMinutes > 0 && currentMinutes < previousRange.endMinutes,
    }
  }

  return {
    hours: todaysHours ?? 'Closed',
    isOpenNow: false,
  }
}

async function syncDiningActivity(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('dining_halls')
    .select(
      'id,name,source_path,fit_percent,breakfast_hours,lunch_hours,dinner_hours,late_night_hours',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    throw error ?? new Error('Unable to load dining halls')
  }

  const halls = data as DiningHallRow[]
  const currentMinutes = getLosAngelesCurrentMinutes()
  const activeMealPeriod = getCurrentDiningActivityPeriod(currentMinutes)
  const syncedAt = new Date().toISOString()
  return await mapLimit(halls, DINING_FETCH_CONCURRENCY, async (hall) => {
    const openNow = activeMealPeriod !== null && hasHoursForPeriod(hall, activeMealPeriod)
    let nextFitPercent = hall.fit_percent
    let locationId: string | null = null
    let status: DiningSyncResult['status'] = 'updated'

    if (!openNow || !hall.source_path) {
      nextFitPercent = null
      status = 'cleared'
    } else {
      try {
        const pageHtml = await fetchText(`${UCLA_DINING_BASE_URL}${hall.source_path}/`)
        locationId = parseDiningActivityLocationId(pageHtml)

        if (!locationId) {
          status = 'preserved_on_error'
        } else {
          const fetchedFitPercent = await fetchDiningActivityPercent(locationId)

          if (fetchedFitPercent === null) {
            status = 'preserved_on_error'
          } else {
            nextFitPercent = fetchedFitPercent
            status = 'updated'
          }
        }
      } catch (error) {
        console.error('Failed to sync dining activity', {
          hallId: hall.id,
          error: error instanceof Error ? error.message : String(error),
        })
        status = 'preserved_on_error'
      }
    }

    const { error: updateError } = await admin
      .from('dining_halls')
      .update({
        fit_percent: nextFitPercent,
        updated_at: syncedAt,
      })
      .eq('id', hall.id)

    if (updateError) {
      throw updateError
    }

    return {
      fitPercent: nextFitPercent,
      hallId: hall.id,
      locationId,
      openNow,
      status,
    }
  })
}

function selectGymSourceLocations(
  locations: GymSourceLocation[],
  target: (typeof GYM_TARGETS)[number],
) {
  const facilityMatches = locations.filter((location) =>
    location.FacilityId === target.facilityId ||
    normalizeComparableValue(location.FacilityName) ===
      normalizeComparableValue(target.facilityName),
  )

  if (facilityMatches.length > 0) {
    return facilityMatches
  }

  return locations.filter((location) =>
    normalizeComparableValue(location.FacilityName).includes(
      normalizeComparableValue(target.facilityName),
    ),
  )
}

function getWeightedGymPercent(locations: GymSourceLocation[]) {
  const totals = locations.reduce(
    (accumulator, location) => {
      const capacity = Math.max(0, location.TotalCapacity || 0)
      const count = Math.max(0, location.LastCount || 0)

      return {
        capacity: accumulator.capacity + capacity,
        count: accumulator.count + Math.min(count, capacity || count),
      }
    },
    {
      capacity: 0,
      count: 0,
    },
  )

  if (totals.capacity <= 0) {
    return 0
  }

  return Math.round(clampLoad(totals.count / totals.capacity) * 100)
}

function buildGymZoneBreakdown(locations: GymSourceLocation[]): GymZoneBreakdown[] {
  return locations
    .map((location) => {
      const capacity = Math.max(0, location.TotalCapacity || 0)
      const count = Math.max(0, location.LastCount || 0)

      return {
        capacity,
        count,
        name: location.LocationName,
        percent:
          capacity > 0 ? Math.round(clampLoad(count / capacity) * 100) : 0,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function syncGymCapacities(admin: ReturnType<typeof createAdminClient>) {
  const sourceLocations = await fetchJson<GymSourceLocation[]>(GOBOARD_API_URL)
  const capturedAt = new Date().toISOString()
  const currentMinutes = getLosAngelesCurrentMinutes()
  const weekday = getLosAngelesWeekday()
  const results: GymSyncResult[] = []

  for (const target of GYM_TARGETS) {
    const sourceLocationsForGym = selectGymSourceLocations(sourceLocations, target)

    if (!sourceLocationsForGym.length) {
      throw new Error(`Unable to locate gym source rows for ${target.facilityName}`)
    }

    const effectiveHours = getEffectiveGymHours(target.gymLocationId, currentMinutes, weekday)
    const isClosed = !effectiveHours.isOpenNow
    const percent = isClosed ? 0 : getWeightedGymPercent(sourceLocationsForGym)
    const zoneBreakdown = buildGymZoneBreakdown(sourceLocationsForGym)

    const { error: updateGymError } = await admin
      .from('gym_locations')
      .update({
        hours: effectiveHours.hours,
        updated_at: capturedAt,
      })
      .eq('id', target.gymLocationId)

    if (updateGymError) {
      throw updateGymError
    }

    const { error } = await admin
      .from('gym_capacity_snapshots')
      .insert({
        captured_at: capturedAt,
        is_closed: isClosed,
        load: clampLoad(percent / 100),
        location_id: target.gymLocationId,
        source: `module-6-campus-activity-sync:${target.facilityName}`,
        zone_breakdown: zoneBreakdown,
        zone_name: target.facilityName,
      })

    if (error) {
      throw error
    }

    results.push({
      hours: effectiveHours.hours,
      isClosed: isClosed,
      locationId: target.gymLocationId,
      percent,
      status: 'inserted',
      zoneName: target.facilityName,
    })
  }

  return results
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const body = (await req.json().catch(() => ({}))) as SyncRequest
  const includeDining = body.includeDining ?? true
  const includeGyms = body.includeGyms ?? true
  const trigger = body.trigger ?? 'manual'

  try {
    const admin = createAdminClient()
    const errors: SyncSummary['errors'] = {}
    let dining: DiningSyncResult[] = []
    let gyms: GymSyncResult[] = []

    if (includeDining) {
      try {
        dining = await syncDiningActivity(admin)
      } catch (error) {
        errors.dining = error instanceof Error ? error.message : String(error)
        console.error('Dining activity sync failed', error)
      }
    }

    if (includeGyms) {
      try {
        gyms = await syncGymCapacities(admin)
      } catch (error) {
        errors.gyms = error instanceof Error ? error.message : String(error)
        console.error('Gym capacity sync failed', error)
      }
    }

    const requestedSyncCount = Number(includeDining) + Number(includeGyms)
    const errorCount = Number(Boolean(errors.dining)) + Number(Boolean(errors.gyms))
    const status: SyncSummary['status'] =
      errorCount === 0
        ? 'success'
        : errorCount === requestedSyncCount
          ? 'failure'
          : 'partial_failure'

    const summary: SyncSummary = {
      dining,
      errors: Object.keys(errors).length ? errors : undefined,
      gyms,
      status,
      trigger,
    }

    return jsonResponse(status === 'failure' ? 500 : 200, summary)
  } catch (error) {
    console.error('Campus activity sync failed', error)

    return jsonResponse(500, {
      error: error instanceof Error ? error.message : String(error),
      trigger,
    })
  }
})
