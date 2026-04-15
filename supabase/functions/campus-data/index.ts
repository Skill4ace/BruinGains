import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const USER_REQUEST_LIMIT = 12
const IP_REQUEST_LIMIT = 60
const MENU_PAGE_SIZE = 500
const MENU_MAX_PAGES = 10

type CampusDataBundle = {
  diningHalls: PublicDiningHall[]
  diningMenuItems: DiningMenuItem[]
  gymCapacities: GymCapacitySnapshot[]
}

type CampusDataRequest = {
  includeDiningMenuItems?: boolean
}

type DiningHallRow = {
  breakfast_hours: string | null
  dinner_hours: string | null
  fit_percent: number | null
  id: string
  late_night_hours: string | null
  lunch_hours: string | null
  name: string
}

type GymLocationRow = {
  hours: string
  id: string
  name: string
}

type GymCapacitySnapshotRow = {
  captured_at: string
  gym_locations: GymLocationRow | null
  is_closed: boolean
  load: number
  location_id: string
  percent_full: number | null
  zone_breakdown: unknown
  zone_name: string | null
}

type LatestDiningMenuItemRow = {
  allergen_labels: unknown
  badge_labels: unknown
  calories: number | null
  carbs_g: number | null
  customization_options: unknown
  fats_g: number | null
  fetched_at: string
  hall_id: string
  hall_name: string
  hall_sort_order: number
  ingredients: unknown
  item_name: string
  item_order: number
  meal_period: DiningMenuItem['mealPeriod']
  nutrition_facts: unknown
  protein_g: number | null
  recipe_id: number | null
  service_date: string
  serving_size: string | null
  snapshot_status: string
  station_name: string | null
}

type PublicDiningHall = {
  fitPercent: number | null
  hours: {
    breakfast: string | null
    dinner: string | null
    lateNight: string | null
    lunch: string | null
  }
  id: string
  name: string
}

type DiningNutritionFact = {
  dailyValuePercent: number | null
  id: string
  label: string
  value: string
}

type DiningCustomizationOption = {
  allergenLabels: string[]
  badgeLabels: string[]
  calories: number | null
  carbsG: number | null
  defaultQuantity: number
  fatsG: number | null
  ingredients: string[]
  itemName: string
  nutritionFacts: DiningNutritionFact[]
  productG?: never
  proteinG: number | null
  recipeId: number | null
  servingSize: string | null
}

type DiningMenuItem = {
  allergenLabels: string[]
  badgeLabels: string[]
  calories: number | null
  carbsG: number | null
  customizationOptions: DiningCustomizationOption[]
  fatsG: number | null
  fetchedAt: string
  hallId: string
  hallName: string
  hallSortOrder: number
  ingredients: string[]
  itemName: string
  itemOrder: number
  mealPeriod: 'breakfast' | 'lunch' | 'dinner' | 'lateNight'
  nutritionFacts: DiningNutritionFact[]
  proteinG: number | null
  recipeId: number | null
  servingSize: string | null
  serviceDate: string
  snapshotStatus: string
  stationName: string
}

type GymCapacityZone = {
  capacity: number
  count: number
  name: string
  percent: number
}

type GymCapacitySnapshot = {
  capturedAt: string
  hours: string
  id: string
  isClosed: boolean
  load: number
  name: string
  percent: number
  zoneName: string | null
  zones: readonly GymCapacityZone[]
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

function createAuthClient() {
  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_ANON_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  })
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization')

  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(/\s+/, 2)

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')

  if (!forwardedFor) {
    return null
  }

  const candidate = forwardedFor.split(',')[0]?.trim()
  return candidate || null
}

function parseJsonStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}

function parseNutritionFacts(value: unknown): DiningNutritionFact[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const candidate = entry as Record<string, unknown>

    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.label !== 'string' ||
      typeof candidate.value !== 'string'
    ) {
      return []
    }

    return [
      {
        id: candidate.id,
        label: candidate.label,
        value: candidate.value,
        dailyValuePercent:
          typeof candidate.dailyValuePercent === 'number'
            ? candidate.dailyValuePercent
            : null,
      },
    ]
  })
}

function parseCustomizationOptions(value: unknown): DiningCustomizationOption[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const candidate = entry as Record<string, unknown>

    if (typeof candidate.itemName !== 'string') {
      return []
    }

    return [
      {
        recipeId: typeof candidate.recipeId === 'number' ? candidate.recipeId : null,
        itemName: candidate.itemName,
        defaultQuantity:
          typeof candidate.defaultQuantity === 'number' && candidate.defaultQuantity > 0
            ? Math.round(candidate.defaultQuantity)
            : 1,
        servingSize:
          typeof candidate.servingSize === 'string' ? candidate.servingSize : null,
        calories: typeof candidate.calories === 'number' ? candidate.calories : null,
        proteinG: typeof candidate.proteinG === 'number' ? candidate.proteinG : null,
        carbsG: typeof candidate.carbsG === 'number' ? candidate.carbsG : null,
        fatsG: typeof candidate.fatsG === 'number' ? candidate.fatsG : null,
        badgeLabels: parseJsonStringArray(candidate.badgeLabels),
        allergenLabels: parseJsonStringArray(candidate.allergenLabels),
        ingredients: parseJsonStringArray(candidate.ingredients),
        nutritionFacts: parseNutritionFacts(candidate.nutritionFacts),
      },
    ]
  })
}

function parseGymCapacityZones(value: unknown): GymCapacityZone[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const candidate = entry as Record<string, unknown>

    if (typeof candidate.name !== 'string') {
      return []
    }

    return [
      {
        name: candidate.name,
        count: typeof candidate.count === 'number' ? candidate.count : 0,
        capacity: typeof candidate.capacity === 'number' ? candidate.capacity : 0,
        percent: typeof candidate.percent === 'number' ? candidate.percent : 0,
      },
    ]
  })
}

function mapDiningHallRow(row: DiningHallRow): PublicDiningHall {
  return {
    id: row.id,
    name: row.name,
    fitPercent: row.fit_percent,
    hours: {
      breakfast: row.breakfast_hours,
      lunch: row.lunch_hours,
      dinner: row.dinner_hours,
      lateNight: row.late_night_hours,
    },
  }
}

function mapGymCapacityRow(row: GymCapacitySnapshotRow): GymCapacitySnapshot | null {
  if (!row.gym_locations) {
    return null
  }

  return {
    id: row.location_id,
    isClosed: row.is_closed,
    name: row.gym_locations.name,
    hours: row.gym_locations.hours,
    load: row.load,
    percent: row.percent_full ?? Math.round(row.load * 100),
    zones: parseGymCapacityZones(row.zone_breakdown),
    zoneName: row.zone_name,
    capturedAt: row.captured_at,
  }
}

function mapLatestDiningMenuItemRow(row: LatestDiningMenuItemRow): DiningMenuItem {
  return {
    allergenLabels: parseJsonStringArray(row.allergen_labels),
    badgeLabels: parseJsonStringArray(row.badge_labels),
    hallId: row.hall_id,
    hallName: row.hall_name,
    hallSortOrder: row.hall_sort_order,
    serviceDate: row.service_date,
    mealPeriod: row.meal_period,
    snapshotStatus: row.snapshot_status,
    fetchedAt: row.fetched_at,
    recipeId: row.recipe_id,
    stationName: row.station_name ?? 'Station',
    itemName: row.item_name,
    servingSize: row.serving_size,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatsG: row.fats_g,
    ingredients: parseJsonStringArray(row.ingredients),
    itemOrder: row.item_order,
    nutritionFacts: parseNutritionFacts(row.nutrition_facts),
    customizationOptions: parseCustomizationOptions(row.customization_options),
  }
}

async function parseCampusDataRequest(req: Request): Promise<CampusDataRequest> {
  try {
    const requestBody = await req.json()

    if (!requestBody || typeof requestBody !== 'object') {
      return {}
    }

    return requestBody as CampusDataRequest
  } catch {
    return {}
  }
}

async function authenticateRequest(req: Request) {
  const token = getBearerToken(req)

  if (!token) {
    return { error: 'Missing authorization header', userId: null }
  }

  const authClient = createAuthClient()
  const { data, error } = await authClient.auth.getUser(token)

  if (error || !data.user) {
    return { error: 'Unauthorized', userId: null }
  }

  return { error: null, userId: data.user.id }
}

async function enforceRateLimit(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  ipAddress: string | null,
) {
  const thresholdIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

  const { count: userCount, error: userCountError } = await admin
    .from('campus_data_request_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('requested_at', thresholdIso)

  if (userCountError) {
    throw userCountError
  }

  if ((userCount ?? 0) >= USER_REQUEST_LIMIT) {
    return { allowed: false, error: 'Too many requests' }
  }

  if (ipAddress) {
    const { count: ipCount, error: ipCountError } = await admin
      .from('campus_data_request_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('requested_at', thresholdIso)

    if (ipCountError) {
      throw ipCountError
    }

    if ((ipCount ?? 0) >= IP_REQUEST_LIMIT) {
      return { allowed: false, error: 'Too many requests' }
    }
  }

  const { error: insertError } = await admin.from('campus_data_request_log').insert({
    ip_address: ipAddress,
    requested_at: new Date().toISOString(),
    user_id: userId,
  })

  if (insertError) {
    throw insertError
  }

  return { allowed: true, error: null }
}

async function loadDiningHalls(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('dining_halls')
    .select(
      'id,name,fit_percent,breakfast_hours,lunch_hours,dinner_hours,late_night_hours,sort_order',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    throw error ?? new Error('Unable to load dining halls')
  }

  return (data as DiningHallRow[]).map(mapDiningHallRow)
}

async function loadGymCapacities(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('gym_capacity_snapshots')
    .select(
      'id,location_id,load,percent_full,captured_at,is_closed,zone_name,zone_breakdown,gym_locations!inner(id,name,hours,sort_order)',
    )
    .order('captured_at', { ascending: false })
    .limit(10)

  if (error || !data) {
    throw error ?? new Error('Unable to load gym capacities')
  }

  const deduped = new Map<string, GymCapacitySnapshot>()

  ;(data as GymCapacitySnapshotRow[]).forEach((row) => {
    const mapped = mapGymCapacityRow(row)

    if (mapped && !deduped.has(mapped.id)) {
      deduped.set(mapped.id, mapped)
    }
  })

  return [...deduped.values()]
}

async function loadDiningMenuItems(admin: ReturnType<typeof createAdminClient>) {
  const rows: LatestDiningMenuItemRow[] = []
  let pageStart = 0

  for (let page = 0; page < MENU_MAX_PAGES; page += 1) {
    const pageEnd = pageStart + MENU_PAGE_SIZE - 1
    const { data, error } = await admin
      .from('latest_menu_items')
      .select(
        'allergen_labels,badge_labels,hall_id,hall_name,hall_sort_order,service_date,meal_period,snapshot_status,fetched_at,recipe_id,station_name,item_name,serving_size,calories,protein_g,carbs_g,fats_g,customization_options,ingredients,item_order,nutrition_facts',
      )
      .order('hall_sort_order', { ascending: true })
      .order('meal_period', { ascending: true })
      .order('item_order', { ascending: true })
      .range(pageStart, pageEnd)

    if (error || !data) {
      throw error ?? new Error('Unable to load dining menu items')
    }

    if (data.length === 0) {
      break
    }

    rows.push(...(data as LatestDiningMenuItemRow[]))

    if (data.length < MENU_PAGE_SIZE) {
      break
    }

    pageStart += MENU_PAGE_SIZE
  }

  return rows.map(mapLatestDiningMenuItemRow)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const requestBody = await parseCampusDataRequest(req)
    const authResult = await authenticateRequest(req)

    if (authResult.error || !authResult.userId) {
      return jsonResponse(401, { error: authResult.error ?? 'Unauthorized' })
    }

    const admin = createAdminClient()
    const ipAddress = getClientIp(req)
    const rateLimit = await enforceRateLimit(admin, authResult.userId, ipAddress)

    if (!rateLimit.allowed) {
      return jsonResponse(429, { error: rateLimit.error })
    }

    const includeDiningMenuItems = requestBody.includeDiningMenuItems ?? true

    const [diningHalls, diningMenuItems, gymCapacities] = await Promise.all([
      loadDiningHalls(admin),
      includeDiningMenuItems ? loadDiningMenuItems(admin) : Promise.resolve([]),
      loadGymCapacities(admin),
    ])

    const payload: CampusDataBundle = {
      diningHalls,
      diningMenuItems,
      gymCapacities,
    }

    return jsonResponse(200, payload)
  } catch (error) {
    console.error('Campus data request failed', error)
    return jsonResponse(500, { error: 'Campus data request failed' })
  }
})
