import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu'
const UCLA_DINING_ACTIVITY_PATH = '/wp-content/plugins/activity-meter/activity_ajax.php'
const UCLA_TIME_ZONE = 'America/Los_Angeles'
const GOBOARD_API_URL =
  'https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=73829a91-48cb-4b7b-bd0b-8cf4134c04cd'
const USER_AGENT = 'BruinGainsCampusActivitySync/1.0 (+https://afxptjzzctiowrqqcyzh.supabase.co)'
const FETCH_TIMEOUT_MS = 15000

const GYM_TARGETS = [
  {
    facilityId: 802,
    gymLocationId: 'wooden',
    zoneName: 'Pardee Gym',
  },
  {
    facilityId: 803,
    gymLocationId: 'bfit',
    zoneName: 'Free Weight & Squat Zones',
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

type SyncSummary = {
  dining: DiningSyncResult[]
  gyms: GymSyncResult[]
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
  for (const match of pageHtml.matchAll(
    /<script[^>]+src=["']data:text\/javascript;base64,([A-Za-z0-9+/=]+)["']/g,
  )) {
    const decodedScript = atob(match[1])
    const locationIdMatch = decodedScript.match(
      /var ajaxParams = \{"location_id":"(\d+)"/,
    )

    if (locationIdMatch) {
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
  const results: DiningSyncResult[] = []

  for (const hall of halls) {
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
          nextFitPercent = null
          status = 'cleared'
        } else {
          nextFitPercent = await fetchDiningActivityPercent(locationId)
          status = nextFitPercent === null ? 'cleared' : 'updated'
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

    results.push({
      fitPercent: nextFitPercent,
      hallId: hall.id,
      locationId,
      openNow,
      status,
    })
  }

  return results
}

function selectGymSourceLocation(
  locations: GymSourceLocation[],
  target: (typeof GYM_TARGETS)[number],
) {
  return locations.find((location) =>
    location.FacilityId === target.facilityId &&
    normalizeComparableValue(location.LocationName) ===
      normalizeComparableValue(target.zoneName),
  )
}

async function syncGymCapacities(admin: ReturnType<typeof createAdminClient>) {
  const sourceLocations = await fetchJson<GymSourceLocation[]>(GOBOARD_API_URL)
  const capturedAt = new Date().toISOString()
  const currentMinutes = getLosAngelesCurrentMinutes()
  const weekday = getLosAngelesWeekday()
  const results: GymSyncResult[] = []

  for (const target of GYM_TARGETS) {
    const sourceLocation = selectGymSourceLocation(sourceLocations, target)

    if (!sourceLocation) {
      throw new Error(`Unable to locate gym source row for ${target.zoneName}`)
    }

    const effectiveHours = getEffectiveGymHours(target.gymLocationId, currentMinutes, weekday)
    const isClosed = sourceLocation.IsClosed || !effectiveHours.isOpenNow
    const percent = isClosed
      ? 0
      : Math.round((sourceLocation.LastCount / sourceLocation.TotalCapacity) * 100)

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
        source: `module-6-campus-activity-sync:${sourceLocation.LocationName}`,
        zone_name: sourceLocation.LocationName,
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
      zoneName: sourceLocation.LocationName,
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
    const summary: SyncSummary = {
      dining: includeDining ? await syncDiningActivity(admin) : [],
      gyms: includeGyms ? await syncGymCapacities(admin) : [],
      trigger,
    }

    return jsonResponse(200, summary)
  } catch (error) {
    console.error('Campus activity sync failed', error)

    return jsonResponse(500, {
      error: error instanceof Error ? error.message : String(error),
      trigger,
    })
  }
})
