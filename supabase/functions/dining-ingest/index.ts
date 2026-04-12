import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu'
const UCLA_DINING_TIME_ZONE = 'America/Los_Angeles'
const USER_AGENT = 'BruinGainsDiningIngest/1.0 (+https://afxptjzzctiowrqqcyzh.supabase.co)'
const DINING_MENU_AGLANCE_PATH = '/menus-at-a-glance'
const FETCH_TIMEOUT_MS = 15000
const DETAIL_FETCH_CONCURRENCY = 2
const ITEM_PROCESSING_CHUNK_SIZE = 5
const RUN_STALE_AFTER_MINUTES = 20
const PERIOD_CONFIG = [
  { key: 'breakfast', anchorId: 'breakfastmenu', heading: 'BREAKFAST' },
  { key: 'lunch', anchorId: 'lunchmenu', heading: 'LUNCH' },
  { key: 'dinner', anchorId: 'dinnermenu', heading: 'DINNER' },
  { key: 'lateNight', anchorId: 'latenightmenu', heading: 'Late Night' },
] as const

type MealPeriod = (typeof PERIOD_CONFIG)[number]['key']

type SyncRequest = {
  force?: boolean
  hallIds?: string[]
  itemNames?: string[]
  mealPeriods?: MealPeriod[]
  replaceExistingSnapshot?: boolean
  skipNutritionFetch?: boolean
  stationNames?: string[]
  targetDate?: string
  trigger?: string
}

type JwtPayload = {
  role?: string
}

type DiningHallRow = {
  breakfast_hours?: string | null
  dinner_hours?: string | null
  id: string
  late_night_hours?: string | null
  lunch_hours?: string | null
  name: string
  source_path: string | null
}

type DiningHallHours = Pick<
  DiningHallRow,
  'breakfast_hours' | 'lunch_hours' | 'dinner_hours' | 'late_night_hours'
>

type MenuSnapshotRow = {
  fetched_at: string
  hall_id: string
  id: number
  meal_period: string
  service_date: string
  status: string
}

type ParsedHallMenu = {
  hallId: string
  hallName: string
  pageDateLabel: string | null
  sourceUrl: string
  sections: ParsedMealSection[]
}

type ParsedMealSection = {
  items: ParsedMenuItem[]
  mealPeriod: MealPeriod
}

type ParsedAllDayStation = {
  items: ParsedMenuItem[]
  stationName: string
}

type ParsedMenuItem = {
  badgeLabels: string[]
  itemName: string
  itemOrder: number
  recipeId: number | null
  stationName: string
}

type ParsedNutritionFact = {
  dailyValuePercent: number | null
  id: string
  label: string
  value: string
}

type ParsedCustomizationOption = {
  allergenLabels: string[]
  badgeLabels: string[]
  calories: number | null
  carbsG: number | null
  defaultQuantity: number
  detailPath: string | null
  fatsG: number | null
  ingredients: string[]
  itemName: string
  nutritionFacts: ParsedNutritionFact[]
  proteinG: number | null
  recipeId: number | null
  servingSize: string | null
}

type NutritionDetail = {
  allergenLabels: string[]
  calories: number | null
  carbsG: number | null
  customizationOptions: ParsedCustomizationOption[]
  fatsG: number | null
  ingredients: string[]
  itemName: string | null
  nutritionFacts: ParsedNutritionFact[]
  proteinG: number | null
  servingSize: string | null
}

type SyncHallResult = {
  error?: string
  hallId: string
  hallName: string
  itemCount: number
  mealPeriods: MealPeriod[]
  sourceUrl?: string
  status: 'success' | 'failure'
}

type SyncRunSummary = {
  errorCount: number
  hallResults: SyncHallResult[]
  itemCount: number
  snapshotCount: number
  status: 'success' | 'partial_failure' | 'failure'
}

function hasMeaningfulCustomizationOptionDetail(option: ParsedCustomizationOption) {
  return (
    option.calories !== null &&
    option.proteinG !== null &&
    option.carbsG !== null &&
    option.fatsG !== null &&
    option.nutritionFacts.length > 0 &&
    option.ingredients.length > 0
  )
}

function hasMeaningfulNutritionDetail(detail: NutritionDetail | null | undefined) {
  if (!detail) {
    return false
  }

  if (detail.customizationOptions.length > 0) {
    return detail.customizationOptions.every(hasMeaningfulCustomizationOptionDetail)
  }

  return (
    detail.servingSize !== null &&
    detail.calories !== null &&
    detail.proteinG !== null &&
    detail.carbsG !== null &&
    detail.fatsG !== null &&
    detail.nutritionFacts.length > 0 &&
    detail.ingredients.length > 0
  )
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

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')

    return JSON.parse(atob(normalized)) as JwtPayload
  } catch {
    return null
  }
}

// These jobs are backend-only and should only accept verified service-role JWTs.
function hasServiceRoleToken(req: Request) {
  const token = getBearerToken(req)

  if (!token) {
    return false
  }

  return decodeJwtPayload(token)?.role === 'service_role'
}

function formatDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function getLosAngelesToday() {
  return formatDateInTimeZone(new Date(), UCLA_DINING_TIME_ZONE)
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

function parseNumericValue(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number.parseFloat(match[0]) : null
}

function parseIntegerValue(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const numeric = parseNumericValue(value)
  return numeric === null ? null : Math.round(numeric)
}

function normalizeNutritionFactId(label: string) {
  const words = cleanText(label)
    .replace(/[%*]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)

  if (!words.length) {
    return 'fact'
  }

  return words
    .map((word, index) =>
      index === 0
        ? word.slice(0, 1).toLowerCase() + word.slice(1)
        : word.slice(0, 1).toUpperCase() + word.slice(1),
    )
    .join('')
}

function splitLabelList(value: string | null | undefined) {
  return (value ?? '')
    .split(/[,/;]+/)
    .map((entry) => cleanText(entry))
    .filter(Boolean)
}

function isAllergenBadgeLabel(label: string) {
  const normalizedLabel = label.toLowerCase()

  return (
    normalizedLabel.includes('soy') ||
    normalizedLabel.includes('gluten') ||
    normalizedLabel.includes('wheat') ||
    normalizedLabel.includes('dairy') ||
    normalizedLabel.includes('milk') ||
    normalizedLabel.includes('egg') ||
    normalizedLabel.includes('fish') ||
    normalizedLabel.includes('shellfish') ||
    normalizedLabel.includes('peanut') ||
    normalizedLabel.includes('tree-nut') ||
    normalizedLabel.includes('tree nut') ||
    normalizedLabel.includes('sesame')
  )
}

function buildHallUrl(sourcePath: string, targetDate: string) {
  const normalizedPath = sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`
  return `${UCLA_DINING_BASE_URL}${normalizedPath.replace(/\/$/, '')}/?date=${targetDate}`
}

function buildAtAGlanceUrl(targetDate: string) {
  return `${UCLA_DINING_BASE_URL}${DINING_MENU_AGLANCE_PATH}/?date=${targetDate}`
}

function buildHoursUrl() {
  return `${UCLA_DINING_BASE_URL}/hours/`
}

function normalizeMenuItemDetailPath(value: string | null | undefined) {
  const cleanedValue = cleanText(value)

  if (!cleanedValue) {
    return null
  }

  if (cleanedValue.startsWith('http://') || cleanedValue.startsWith('https://')) {
    const url = new URL(cleanedValue)
    return `${url.pathname}${url.search}`
  }

  return cleanedValue.startsWith('/') ? cleanedValue : `/${cleanedValue}`
}

function buildRecipeDetailPath(recipeId: number) {
  return `/menu-item/?recipe=${recipeId}`
}

function buildIngredientDetailPath(ingredientId: number) {
  return `/menu-item/?ingredient=${ingredientId}`
}

function extractRecipeIdFromHref(href: string | undefined) {
  if (!href) {
    return null
  }

  const match = href.match(/[?&]recipe=(\d+)/)
  return match ? Number.parseInt(match[1], 10) : null
}

function normalizeBadgeLabel(value: string | undefined) {
  const label = cleanText(value)

  if (!label) {
    return null
  }

  return label
    .replace(/^Contains\s+/i, '')
    .replace(/\s+food item$/i, '')
    .replace(/\s+menu option$/i, '')
}

function extractDateLabel(value: string | null) {
  if (!value) {
    return null
  }

  const match = value.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/)
  return match?.[0] ?? null
}

function isExpectedPageDate(pageDateLabel: string | null, targetDate: string) {
  if (!pageDateLabel) {
    return true
  }

  const expectedLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: UCLA_DINING_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${targetDate}T12:00:00Z`))

  return pageDateLabel.includes(expectedLabel)
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} for ${url}`)
  }

  return await response.text()
}

function parseHallMenuPage(
  html: string,
  hall: DiningHallRow,
  targetDate: string,
  selectedMealPeriods: MealPeriod[] | undefined,
): ParsedHallMenu {
  const $ = cheerio.load(html)
  const pageDateLabel = extractDateLabel(
    cleanText($('p.at-a-glance-page-title').first().text()),
  )

  if (!isExpectedPageDate(pageDateLabel, targetDate)) {
    throw new Error(
      `Menu page date mismatch for ${hall.id}: expected ${targetDate}, received ${pageDateLabel ?? 'unknown'}`,
    )
  }

  const openMealPeriods = getOpenMealPeriodsForHall(hall, selectedMealPeriods)
  const combinedServiceRoot = $('#dinnermenu').length ? $('#dinnermenu').nextAll('div').first() : null
  const combinedServiceLabel = cleanText(
    combinedServiceRoot?.find('.category-heading h2').first().text(),
  )

  if (
    combinedServiceRoot &&
    !$('#lunchmenu').length &&
    combinedServiceLabel.toLowerCase().includes('lunch / dinner')
  ) {
    const combinedItems: ParsedMenuItem[] = []
    let combinedItemOrder = 0

    combinedServiceRoot.find('.meal-station').each((_, stationElement) => {
      const stationName = cleanText(
        $(stationElement).find('.category-heading h2').first().text(),
      ) || 'Station'

      $(stationElement)
        .find('section.recipe-card, .recipe-card')
        .each((__, recipeCard) => {
          const itemName = cleanText($(recipeCard).find('.menu-item-title h3').first().text())
          const recipeId = extractRecipeIdFromHref(
            $(recipeCard).find('.recipe-detail-link').attr('href'),
          )

          if (!itemName || recipeId === null) {
            return
          }

          const badgeLabels = $(recipeCard)
            .find('.menu-item-meta-data img')
            .map((___, badgeImage) =>
              normalizeBadgeLabel(
                $(badgeImage).attr('title') ?? $(badgeImage).attr('alt'),
              ),
            )
            .get()
            .filter((badge): badge is string => Boolean(badge))

          combinedItems.push({
            badgeLabels: [...new Set(badgeLabels)],
            itemName,
            itemOrder: combinedItemOrder,
            recipeId,
            stationName,
          })
          combinedItemOrder += 1
        })
    })

    return {
      hallId: hall.id,
      hallName: hall.name,
      pageDateLabel,
      sourceUrl: buildHallUrl(hall.source_path ?? hall.id, targetDate),
      sections: openMealPeriods
        .filter((mealPeriod) => mealPeriod !== 'breakfast')
        .map((mealPeriod) => ({
          items: combinedItems,
          mealPeriod,
        })),
    }
  }

  const sections: ParsedMealSection[] = []

  for (const period of PERIOD_CONFIG) {
    if (selectedMealPeriods?.length && !selectedMealPeriods.includes(period.key)) {
      continue
    }

    const anchor = $(`#${period.anchorId}`)

    if (!anchor.length) {
      continue
    }

    const sectionContainer = anchor.nextAll('div').first()
    const stations = sectionContainer.find('.meal-station')

    if (!stations.length) {
      continue
    }

    const items: ParsedMenuItem[] = []
    let itemOrder = 0

    stations.each((_, stationElement) => {
      const stationName = cleanText(
        $(stationElement).find('.category-heading h2').first().text(),
      )

      $(stationElement)
        .find('.recipe-card')
        .each((_, recipeCard) => {
          const itemName = cleanText(
            $(recipeCard).find('.menu-item-title h3').first().text(),
          )
          const recipeId = extractRecipeIdFromHref(
            $(recipeCard).find('.recipe-detail-link').attr('href'),
          )

          if (!itemName || recipeId === null) {
            return
          }

          const badgeLabels = $(recipeCard)
            .find('.menu-item-meta-data img')
            .map((__, badgeImage) => {
              const badge = normalizeBadgeLabel(
                $(badgeImage).attr('title') ?? $(badgeImage).attr('alt'),
              )
              return badge
            })
            .get()
            .filter((badge): badge is string => Boolean(badge))

          items.push({
            badgeLabels: [...new Set(badgeLabels)],
            itemName,
            itemOrder,
            recipeId,
            stationName: stationName || 'Station',
          })
          itemOrder += 1
        })
    })

    if (items.length > 0) {
      sections.push({
        mealPeriod: period.key,
        items,
      })
    }
  }

  return {
    hallId: hall.id,
    hallName: hall.name,
    pageDateLabel,
    sourceUrl: buildHallUrl(hall.source_path ?? hall.id, targetDate),
    sections,
  }
}

function getOpenMealPeriodsForHall(
  hall: DiningHallRow,
  selectedMealPeriods: MealPeriod[] | undefined,
) {
  const candidatePeriods = selectedMealPeriods?.length
    ? selectedMealPeriods
    : PERIOD_CONFIG.map((period) => period.key)

  return candidatePeriods.filter((mealPeriod) => {
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
  })
}

function filterParsedHallSectionsByOpenMealPeriods(
  parsedHall: ParsedHallMenu,
  openMealPeriods: MealPeriod[],
) {
  const openMealPeriodSet = new Set(openMealPeriods)

  return {
    ...parsedHall,
    sections: parsedHall.sections.filter((section) =>
      openMealPeriodSet.has(section.mealPeriod),
    ),
  }
}

function normalizeStationName(value: string) {
  const cleanedValue = cleanText(value)
  return cleanedValue.replace(/[.\s]+/g, '') ? cleanedValue : 'Station'
}

function getStudyAllDayMealPeriods(
  stationName: string,
  openMealPeriods: MealPeriod[],
) {
  const normalizedStationName = normalizeComparableValue(stationName)
  const breakfastPeriods = openMealPeriods.filter(
    (mealPeriod) => mealPeriod === 'breakfast',
  )
  const nonBreakfastPeriods = openMealPeriods.filter(
    (mealPeriod) => mealPeriod !== 'breakfast',
  )

  if (
    normalizedStationName.includes('breakfast') ||
    normalizedStationName.includes('tartines') ||
    normalizedStationName.includes('crepes') ||
    normalizedStationName.includes('waffles') ||
    normalizedStationName.includes('oatmeal') ||
    normalizedStationName.includes('bagel croissant bar')
  ) {
    return breakfastPeriods
  }

  if (
    normalizedStationName.includes('cakes tarts') ||
    normalizedStationName.includes('pastries verrines') ||
    normalizedStationName.includes('coffee tea') ||
    normalizedStationName.includes('espresso nitro') ||
    normalizedStationName.includes('handcraft beverages') ||
    normalizedStationName.includes('frozen yogurt') ||
    normalizedStationName.includes('market entrees') ||
    normalizedStationName.includes('market sandwiches') ||
    normalizedStationName.includes('market salads') ||
    normalizedStationName.includes('market beverages') ||
    normalizedStationName === 'sides'
  ) {
    return openMealPeriods
  }

  return nonBreakfastPeriods
}

function getAllDayMealPeriodsForStation(
  hall: DiningHallRow,
  stationName: string,
  openMealPeriods: MealPeriod[],
) {
  const normalizedStationName = normalizeComparableValue(stationName)
  const breakfastPeriods = openMealPeriods.filter(
    (mealPeriod) => mealPeriod === 'breakfast',
  )
  const lunchAndDinnerPeriods = openMealPeriods.filter(
    (mealPeriod) => mealPeriod === 'lunch' || mealPeriod === 'dinner',
  )

  if (hall.id === 'study-hedrick') {
    return getStudyAllDayMealPeriods(stationName, openMealPeriods)
  }

  if (hall.id === 'bruin-cafe' || hall.id === 'epicuria-ackerman') {
    if (normalizedStationName.includes('breakfast')) {
      return breakfastPeriods
    }

    return lunchAndDinnerPeriods
  }

  if (hall.id === 'rendezvous') {
    if (normalizedStationName.includes('lunch special')) {
      return openMealPeriods.filter((mealPeriod) => mealPeriod === 'lunch')
    }

    return lunchAndDinnerPeriods
  }

  if (hall.id === 'the-drey') {
    if (normalizedStationName.includes('lunch')) {
      return openMealPeriods.filter((mealPeriod) => mealPeriod === 'lunch')
    }

    if (normalizedStationName.includes('dinner')) {
      return openMealPeriods.filter((mealPeriod) => mealPeriod === 'dinner')
    }

    return lunchAndDinnerPeriods
  }

  return openMealPeriods
}

function buildAllDaySections(
  hall: DiningHallRow,
  stations: ParsedAllDayStation[],
  openMealPeriods: MealPeriod[],
) {
  const itemsByMealPeriod = new Map<MealPeriod, ParsedMenuItem[]>(
    openMealPeriods.map((mealPeriod) => [mealPeriod, []]),
  )

  stations.forEach((station) => {
    const stationMealPeriods = getAllDayMealPeriodsForStation(
      hall,
      station.stationName,
      openMealPeriods,
    )

    stationMealPeriods.forEach((mealPeriod) => {
      const periodItems = itemsByMealPeriod.get(mealPeriod) ?? []

      station.items.forEach((item) => {
        periodItems.push({
          ...item,
          itemOrder: periodItems.length,
        })
      })

      itemsByMealPeriod.set(mealPeriod, periodItems)
    })
  })

  return PERIOD_CONFIG.flatMap((period) => {
    const items = itemsByMealPeriod.get(period.key)

    return items?.length
      ? [
          {
            items,
            mealPeriod: period.key,
          },
        ]
      : []
  })
}

function mergeParsedHallSections(
  primary: ParsedHallMenu | null,
  supplement: ParsedHallMenu | null,
  mealPeriodsToSupplement: MealPeriod[],
) {
  if (!primary) {
    return supplement
  }

  if (!supplement || !mealPeriodsToSupplement.length) {
    return primary
  }

  const missingMealPeriods = new Set(mealPeriodsToSupplement)
  const supplementalSections = supplement.sections.filter((section) =>
    missingMealPeriods.has(section.mealPeriod),
  )

  if (!supplementalSections.length) {
    return primary
  }

  return {
    ...primary,
    sections: [...primary.sections, ...supplementalSections],
  }
}

function parseAllDayMenuPage(
  html: string,
  hall: DiningHallRow,
  targetDate: string,
  selectedMealPeriods: MealPeriod[] | undefined,
) {
  const $ = cheerio.load(html)
  const pageDateLabel = extractDateLabel(
    cleanText($('p.at-a-glance-page-title').first().text()),
  )

  if (!isExpectedPageDate(pageDateLabel, targetDate)) {
    throw new Error(
      `All-day page date mismatch for ${hall.id}: expected ${targetDate}, received ${pageDateLabel ?? 'unknown'}`,
    )
  }

  const allDayAnchor = $("#alldaymenu, #all-day-menu").first()

  if (!allDayAnchor.length) {
    return null
  }

  const openMealPeriods = getOpenMealPeriodsForHall(hall, selectedMealPeriods)

  if (!openMealPeriods.length) {
    return null
  }

  const sectionContainer = allDayAnchor.nextAll('div').first()
  const stationRoots =
    sectionContainer.find('div.force-left-full-width.meal-station').length > 0
      ? sectionContainer.find('div.force-left-full-width.meal-station')
      : sectionContainer.find('.meal-station')

  if (!stationRoots.length) {
    return null
  }

  const stations: ParsedAllDayStation[] = []

  stationRoots.each((_, stationElement) => {
    const stationName = normalizeStationName(
      $(stationElement).find('.category-heading h2').first().text(),
    )
    const items: ParsedMenuItem[] = []

    $(stationElement)
      .find('section.recipe-card')
      .each((__, recipeCard) => {
        const itemName = cleanText($(recipeCard).find('.menu-item-title h3').first().text())
        const recipeId = extractRecipeIdFromHref(
          $(recipeCard).find('.recipe-detail-link').attr('href'),
        )

        if (!itemName || recipeId === null) {
          return
        }

        const badgeLabels = $(recipeCard)
          .find('.menu-item-meta-data img')
          .map((___, badgeImage) =>
            normalizeBadgeLabel(
              $(badgeImage).attr('title') ?? $(badgeImage).attr('alt'),
            ),
          )
          .get()
          .filter((badge): badge is string => Boolean(badge))

        items.push({
          badgeLabels: [...new Set(badgeLabels)],
          itemName,
          itemOrder: items.length,
          recipeId,
          stationName,
        })
      })

    if (items.length > 0) {
      stations.push({
        items,
        stationName,
      })
    }
  })

  if (!stations.length) {
    return null
  }

  return {
    hallId: hall.id,
    hallName: hall.name,
    pageDateLabel,
    sourceUrl: buildHallUrl(hall.source_path ?? hall.id, targetDate),
    sections: buildAllDaySections(hall, stations, openMealPeriods),
  }
}

function buildHallLookup(halls: DiningHallRow[]) {
  const byName = new Map<string, DiningHallRow>()
  const bySourcePath = new Map<string, DiningHallRow>()

  halls.forEach((hall) => {
    byName.set(normalizeComparableValue(hall.name), hall)

    if (hall.source_path) {
      bySourcePath.set(
        normalizeComparableValue(hall.source_path.replace(/^\//, '')),
        hall,
      )
      bySourcePath.set(normalizeComparableValue(hall.source_path), hall)
    }
  })

  const deNeveHall = halls.find((hall) => hall.id === 'de-neve')
  const studyHedrickHall = halls.find((hall) => hall.id === 'study-hedrick')

  if (deNeveHall) {
    byName.set(normalizeComparableValue('De Neve Dining'), deNeveHall)
  }

  if (studyHedrickHall) {
    byName.set(
      normalizeComparableValue('The Study at Hedrick'),
      studyHedrickHall,
    )
  }

  return { byName, bySourcePath }
}

function findSectionStartIndex(html: string, anchorId: string) {
  const singleQuoteIndex = html.indexOf(`<div id='${anchorId}'`)
  const doubleQuoteIndex = html.indexOf(`<div id="${anchorId}"`)

  if (singleQuoteIndex === -1) {
    return doubleQuoteIndex
  }

  if (doubleQuoteIndex === -1) {
    return singleQuoteIndex
  }

  return Math.min(singleQuoteIndex, doubleQuoteIndex)
}

function extractAtAGlanceSectionHtml(html: string, anchorId: string) {
  const sectionStart = findSectionStartIndex(html, anchorId)

  if (sectionStart === -1) {
    return null
  }

  const nextBoundaryIndexes = [
    ...PERIOD_CONFIG.map((period) => period.anchorId)
      .filter((candidateAnchorId) => candidateAnchorId !== anchorId)
      .map((candidateAnchorId) => findSectionStartIndex(html, candidateAnchorId))
      .filter((index) => index > sectionStart),
    html.indexOf("<div class='at-a-glance-menu'><h2>Icon Legend"),
    html.indexOf('<div class="at-a-glance-menu"><h2>Icon Legend'),
  ].filter((index) => index > sectionStart)

  const sectionEnd =
    nextBoundaryIndexes.length > 0 ? Math.min(...nextBoundaryIndexes) : html.length

  return html.slice(sectionStart, sectionEnd)
}

function extractHallBlocks(sectionHtml: string) {
  const hallBlockPattern =
    /<div class=['"][^'"]*at-a-glance-menu__dining-location[^'"]*['"][^>]*>/g
  const matches = [...sectionHtml.matchAll(hallBlockPattern)]

  return matches.map((match, index) => {
    const startIndex = match.index ?? 0
    const endIndex =
      index < matches.length - 1
        ? matches[index + 1].index ?? sectionHtml.length
        : sectionHtml.length

    return sectionHtml.slice(startIndex, endIndex)
  })
}

function extractFragmentText(fragment: string | null | undefined) {
  if (!fragment) {
    return ''
  }

  return cleanText(cheerio.load(`<div>${fragment}</div>`).text())
}

function extractStationBlocks(hallBlockHtml: string) {
  const stationBlockPattern = /<div class=['"]at-a-glance-menu__meal-station['"]>/g
  const matches = [...hallBlockHtml.matchAll(stationBlockPattern)]

  return matches.map((match, index) => {
    const startIndex = match.index ?? 0
    const endIndex =
      index < matches.length - 1
        ? matches[index + 1].index ?? hallBlockHtml.length
        : hallBlockHtml.length

    return hallBlockHtml.slice(startIndex, endIndex)
  })
}

function parseAtAGlanceHallBlock(
  hallBlockHtml: string,
  lookup: ReturnType<typeof buildHallLookup>,
  mealPeriod: MealPeriod,
  pageDateLabel: string | null,
  targetDate: string,
) {
  // Use cheerio to parse the entire hall block — handles both the old and new
  // at-a-glance HTML structure that UCLA dining rolled out in 2025-26.
  const $ = cheerio.load(hallBlockHtml)

  // New structure: <h3 class="dining-location__title">Hall Name</h3>
  // Old structure: plain <h3>Hall Name</h3>
  const hallName = cleanText($('h3').first().text())

  // New structure: <a class="dining-location__link" href="/dining/menus/locations/…">
  // Boutique halls: <a class="dining-location__detailed-menu" href="#">  (href is "#", useless)
  const rawDetailHref = $(
    'a.dining-location__link, a.dining-location__detailed-menu',
  )
    .first()
    .attr('href')
  const detailHref =
    rawDetailHref && rawDetailHref !== '#' ? rawDetailHref : undefined

  const hall =
    (detailHref
      ? lookup.bySourcePath.get(normalizeComparableValue(detailHref.replace(/\/$/, '')))
      : null) ??
    lookup.byName.get(normalizeComparableValue(hallName))

  if (!hall) {
    return null
  }

  const noServiceMessage = cleanText($('p').first().text())

  if (noServiceMessage.toLowerCase().includes('there is no')) {
    return {
      hallId: hall.id,
      hallName: hall.name,
      pageDateLabel,
      sourceUrl: detailHref
        ? `${UCLA_DINING_BASE_URL}${detailHref}`
        : buildAtAGlanceUrl(targetDate),
      sections: [] as ParsedMealSection[],
    }
  }

  const items: ParsedMenuItem[] = []
  let itemOrder = 0

  // Station group selectors cover all known at-a-glance HTML variants:
  //   Old:      div.at-a-glance-menu__meal-station
  //   New main: div.dining-location__menu-item-group  (h5 for station name)
  //   New café: div.dining-location__menu-section     (h4 for station name)
  const stationGroups = $(
    'div.dining-location__menu-item-group, div.dining-location__menu-section, div.at-a-glance-menu__meal-station',
  )

  stationGroups.each((_, stationEl) => {
    const rawStationName = cleanText($(stationEl).find('h4, h5').first().text())
    const stationName = rawStationName && rawStationName !== '.' ? rawStationName : 'Station'

    $(stationEl)
      .find('li')
      .each((__, itemEl) => {
        const link = $(itemEl).find('a').first()
        const itemName = cleanText(link.text())

        if (!itemName) {
          return
        }

        const href = link.attr('href') ?? ''
        // recipeId is null for boutique halls whose items link to href="#" or slug-only URLs;
        // nutrition fields will be left null per spec — do not fabricate data.
        const recipeId = extractRecipeIdFromHref(href)

        const badgeLabels = $(itemEl)
          .find('img')
          .map((___, badgeImage) =>
            normalizeBadgeLabel($(badgeImage).attr('title') ?? $(badgeImage).attr('alt')),
          )
          .get()
          .filter((badge): badge is string => Boolean(badge))

        items.push({
          badgeLabels: [...new Set(badgeLabels)],
          itemName,
          itemOrder,
          recipeId,
          stationName,
        })
        itemOrder += 1
      })
  })

  return {
    hallId: hall.id,
    hallName: hall.name,
    pageDateLabel,
    sourceUrl: detailHref
      ? `${UCLA_DINING_BASE_URL}${detailHref}`
      : buildAtAGlanceUrl(targetDate),
    sections:
      items.length > 0
        ? [
            {
              items,
              mealPeriod,
            },
          ]
        : [],
  }
}

function parseAtAGlancePage(
  html: string,
  halls: DiningHallRow[],
  targetDate: string,
  selectedMealPeriods: MealPeriod[] | undefined,
) {
  const $ = cheerio.load(html)
  const pageDateLabel = extractDateLabel(
    cleanText($('h1.at-a-glance-page-title').first().text()),
  )

  if (!isExpectedPageDate(pageDateLabel, targetDate)) {
    throw new Error(
      `At-a-glance page date mismatch: expected ${targetDate}, received ${pageDateLabel ?? 'unknown'}`,
    )
  }

  const lookup = buildHallLookup(halls)
  const parsedHalls = new Map<string, ParsedHallMenu>()

  for (const period of PERIOD_CONFIG) {
    if (selectedMealPeriods?.length && !selectedMealPeriods.includes(period.key)) {
      continue
    }

    const sectionHtml = extractAtAGlanceSectionHtml(html, period.anchorId)

    if (!sectionHtml) {
      continue
    }

    for (const hallBlockHtml of extractHallBlocks(sectionHtml)) {
      const parsedHall = parseAtAGlanceHallBlock(
        hallBlockHtml,
        lookup,
        period.key,
        pageDateLabel,
        targetDate,
      )

      if (!parsedHall) {
        continue
      }

      const existing = parsedHalls.get(parsedHall.hallId)

      parsedHalls.set(parsedHall.hallId, {
        ...parsedHall,
        sections: existing
          ? [...existing.sections, ...parsedHall.sections]
          : parsedHall.sections,
      })
    }
  }

  return parsedHalls
}

function normalizeHoursValue(value: string) {
  const cleanedValue = cleanText(value)

  if (!cleanedValue || cleanedValue.toLowerCase() === 'closed') {
    return null
  }

  return cleanedValue
}

function applyHallHoursOverrides(
  hallId: string,
  hours: Pick<
    DiningHallRow,
    'breakfast_hours' | 'lunch_hours' | 'dinner_hours' | 'late_night_hours'
  >,
) {
  if (hallId === 'feast-rieber') {
    return {
      breakfast_hours: null,
      lunch_hours: null,
      dinner_hours: hours.dinner_hours,
      late_night_hours: null,
    }
  }

  if (hallId === 'cafe-1919') {
    return {
      ...hours,
      late_night_hours: null,
    }
  }

  return hours
}

async function syncDiningHallHours(
  admin: ReturnType<typeof createAdminClient>,
  halls: DiningHallRow[],
) {
  const html = await fetchHtml(buildHoursUrl())
  const $ = cheerio.load(html)
  const lookup = buildHallLookup(halls)
  const updates: Array<{ id: string } & DiningHallHours> = []

  $('.dining-hours-table tbody tr').each((_, row) => {
    const cells = $(row).find('td')

    if (cells.length < 5) {
      return
    }

    const locationLink = cells.eq(0).find("a[href^='http'], a[href^='/']").first()
    const locationHref = locationLink.attr('href')
    const locationName = cleanText(locationLink.text()) || cleanText(cells.eq(0).text())
    const hall =
      (locationHref
        ? lookup.bySourcePath.get(normalizeComparableValue(locationHref.replace(/\/$/, '')))
        : null) ??
      lookup.byName.get(normalizeComparableValue(locationName))

    if (!hall) {
      return
    }

    const normalizedHours = applyHallHoursOverrides(hall.id, {
      breakfast_hours: normalizeHoursValue(cells.eq(1).text()),
      lunch_hours: normalizeHoursValue(cells.eq(2).text()),
      dinner_hours: normalizeHoursValue(cells.eq(3).text()),
      late_night_hours: normalizeHoursValue(cells.eq(4).text()),
    })

    updates.push({
      id: hall.id,
      breakfast_hours: normalizedHours.breakfast_hours,
      lunch_hours: normalizedHours.lunch_hours,
      dinner_hours: normalizedHours.dinner_hours,
      late_night_hours: normalizedHours.late_night_hours,
    })
  })

  if (!updates.length) {
    throw new Error('Unable to parse daily dining hours from UCLA hours page')
  }

  for (const update of updates) {
    const { error } = await admin
      .from('dining_halls')
      .update({
        breakfast_hours: update.breakfast_hours ?? null,
        lunch_hours: update.lunch_hours ?? null,
        dinner_hours: update.dinner_hours ?? null,
        late_night_hours: update.late_night_hours ?? null,
      })
      .eq('id', update.id as string)

    if (error) {
      throw error
    }
  }

  return new Map<string, DiningHallHours>(
    updates.map((update) => [
      update.id,
      {
        breakfast_hours: update.breakfast_hours,
        lunch_hours: update.lunch_hours,
        dinner_hours: update.dinner_hours,
        late_night_hours: update.late_night_hours,
      },
    ]),
  )
}

function parseNutritionPage(html: string): NutritionDetail {
  const $ = cheerio.load(html)
  const nutritionRoot = $('#nutrition')
  const ingredientRoot = $('#ingredient_list')
  const complexIngredientRoot = $('.single-complex-ingredients')
  const labelToValue = new Map<string, string>()
  const nutritionFacts: ParsedNutritionFact[] = []
  const seenFactIds = new Set<string>()

  nutritionRoot.find('table tbody tr').each((_, row) => {
    const cells = $(row).children('td')

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 2) {
      const factCell = cells.eq(cellIndex).clone()
      const dailyValueCell = cells.eq(cellIndex + 1)
      const labelElement = factCell.find('span').first()
      const label = cleanText(labelElement.text())

      if (!label) {
        continue
      }

      labelElement.remove()
      const value = cleanText(factCell.text())
      const factId = normalizeNutritionFactId(label)

      labelToValue.set(label.toLowerCase(), value)

      if (!value || seenFactIds.has(factId)) {
        continue
      }

      nutritionFacts.push({
        dailyValuePercent: parseIntegerValue(cleanText(dailyValueCell.text())),
        id: factId,
        label,
        value,
      })
      seenFactIds.add(factId)
    }
  })

  const servingText = cleanText(nutritionRoot.text())
  const servingMatch = servingText.match(/Serving Size:\s*([^\n]+)/i)
  const ingredientHtml = ingredientRoot.html() ?? ''
  const allergenMatch = ingredientHtml.match(/<strong>Allergens\*:<\/strong>\s*([^<]+)/i)
  const tabIngredients = ingredientRoot
    .find('ul.nolispace li')
    .map((_, ingredient) => cleanText($(ingredient).text()))
    .get()
    .filter(Boolean)
  const complexIngredients = complexIngredientRoot
    .find('.single-ingredient-link')
    .map((_, ingredientLink) => cleanText($(ingredientLink).text()))
    .get()
    .filter(Boolean)
  const complexAllergenLabels = complexIngredientRoot
    .find('img')
    .map((_, badgeImage) =>
      normalizeBadgeLabel($(badgeImage).attr('title') ?? $(badgeImage).attr('alt')),
    )
    .get()
    .filter((label): label is string => Boolean(label))
    .filter(isAllergenBadgeLabel)
  const customizationOptions: ParsedCustomizationOption[] = []

  complexIngredientRoot
    .find('input.toggle_nutrition_value')
    .each((_, optionInput) => {
      const optionLabel = $(optionInput).closest('label')
      const optionName = cleanText(optionLabel.find('.single-ingredient-link').first().text())
      const optionHref = normalizeMenuItemDetailPath(
        optionLabel.find('.single-ingredient-link').first().attr('href'),
      )
      const optionIdentifier = parseIntegerValue($(optionInput).attr('value'))
      const optionType = cleanText($(optionInput).attr('ingredient_type')).toLowerCase()
      const detailPath =
        optionHref ??
        (
          optionIdentifier !== null
            ? optionType === 'ingredient'
              ? buildIngredientDetailPath(optionIdentifier)
              : buildRecipeDetailPath(optionIdentifier)
            : null
        )
      const recipeId = detailPath?.includes('?recipe=')
        ? extractRecipeIdFromHref(detailPath)
        : optionType === 'subrecipe'
          ? optionIdentifier
          : null

      if (!optionName) {
        return
      }

      const quantityInput = $(optionInput)
        .closest('li')
        .nextAll('div.multiplier_input')
        .first()
        .find('input.item-mutliplier')
        .first()
      const defaultQuantity =
        parseIntegerValue(quantityInput.attr('value') ?? undefined) ?? 1
      const optionBadgeLabels = optionLabel
        .find('img')
        .map((__, badgeImage) =>
          normalizeBadgeLabel($(badgeImage).attr('title') ?? $(badgeImage).attr('alt')),
        )
        .get()
        .filter((label): label is string => Boolean(label))
      const optionAllergenLabels = optionBadgeLabels.filter(isAllergenBadgeLabel)

      customizationOptions.push({
        allergenLabels: [...new Set(optionAllergenLabels)],
        badgeLabels: [...new Set(optionBadgeLabels)],
        calories: null,
        carbsG: null,
        defaultQuantity,
        detailPath,
        fatsG: null,
        ingredients: [],
        itemName: optionName,
        nutritionFacts: [],
        proteinG: null,
        recipeId,
        servingSize: null,
      })
    })
  const hasCustomizationCalculator =
    customizationOptions.length > 0 && nutritionRoot.find('#selected-items').length > 0
  const ingredients =
    tabIngredients.length > 0
      ? tabIngredients
      : hasCustomizationCalculator
        ? []
        : complexIngredients

  return {
    allergenLabels: [
      ...new Set([
        ...splitLabelList(allergenMatch?.[1]),
        ...complexAllergenLabels,
      ]),
    ],
    itemName: cleanText($('.single-name').first().text()) || null,
    servingSize: hasCustomizationCalculator
      ? null
      : servingMatch?.[1]?.split('Calories')[0]?.trim() ?? null,
    calories: hasCustomizationCalculator
      ? null
      : parseIntegerValue(cleanText($('.single-calories').first().text())),
    fatsG: hasCustomizationCalculator
      ? null
      : parseIntegerValue(labelToValue.get('total fat')),
    carbsG: hasCustomizationCalculator
      ? null
      : parseIntegerValue(labelToValue.get('total carbohydrate')),
    customizationOptions,
    ingredients: [...new Set(ingredients)],
    nutritionFacts,
    proteinG: hasCustomizationCalculator
      ? null
      : parseIntegerValue(labelToValue.get('protein')),
  }
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

async function hydrateRecipeNutritionCacheFromDatabase(
  admin: ReturnType<typeof createAdminClient>,
  cache: Map<string, NutritionDetail | null>,
  recipeIds: number[],
) {
  const recipeIdsToLoad = [...new Set(recipeIds)].filter((recipeId) =>
    !cache.has(buildRecipeDetailPath(recipeId)),
  )

  if (!recipeIdsToLoad.length) {
    return
  }

  const { data, error } = await admin
    .from('menu_items_expanded')
    .select(
      'recipe_id,item_name,serving_size,calories,protein_g,carbs_g,fats_g,ingredients,nutrition_facts,allergen_labels,customization_options,fetched_at',
    )
    .in('recipe_id', recipeIdsToLoad)
    .order('fetched_at', { ascending: false })

  if (error || !data) {
    throw error ?? new Error('Unable to load cached nutrition from database')
  }

  for (const row of data) {
    const recipeId = row.recipe_id
    const cacheKey =
      typeof recipeId === 'number' ? buildRecipeDetailPath(recipeId) : null

    if (!cacheKey || cache.has(cacheKey)) {
      continue
    }

    const detail = {
      allergenLabels: Array.isArray(row.allergen_labels)
        ? row.allergen_labels.filter((label): label is string => typeof label === 'string')
        : [],
      calories: row.calories,
      carbsG: row.carbs_g,
      customizationOptions: Array.isArray(row.customization_options)
        ? (row.customization_options as ParsedCustomizationOption[])
        : [],
      fatsG: row.fats_g,
      ingredients: Array.isArray(row.ingredients)
        ? row.ingredients.filter((ingredient): ingredient is string => typeof ingredient === 'string')
        : [],
      itemName: row.item_name,
      nutritionFacts: Array.isArray(row.nutrition_facts)
        ? (row.nutrition_facts as ParsedNutritionFact[])
        : [],
      proteinG: row.protein_g,
      servingSize: row.serving_size,
    }

    if (hasMeaningfulNutritionDetail(detail)) {
      cache.set(cacheKey, detail)
    }
  }
}

async function populateRecipeNutritionCache(
  admin: ReturnType<typeof createAdminClient>,
  cache: Map<string, NutritionDetail | null>,
  recipeIds: number[],
  options?: {
    skipNetworkFetch?: boolean
  },
) {
  await hydrateRecipeNutritionCacheFromDatabase(admin, cache, recipeIds)

  const missingRecipeIds = [...new Set(recipeIds)].filter((recipeId) =>
    !cache.has(buildRecipeDetailPath(recipeId)),
  )

  if (options?.skipNetworkFetch) {
    missingRecipeIds.forEach((recipeId) => {
      cache.set(buildRecipeDetailPath(recipeId), null)
    })
    return
  }

  const entries = await mapLimit(missingRecipeIds, DETAIL_FETCH_CONCURRENCY, async (recipeId) => {
    try {
      const html = await fetchHtml(`${UCLA_DINING_BASE_URL}/menu-item/?recipe=${recipeId}`)
      return [recipeId, parseNutritionPage(html)] as const
    } catch (error) {
      console.error('Failed to fetch recipe detail', {
        recipeId,
        error: error instanceof Error ? error.message : String(error),
      })
      return [recipeId, null] as const
    }
  })

  entries.forEach(([recipeId, detail]) => {
    cache.set(buildRecipeDetailPath(recipeId), detail)
  })
}

async function populateDetailNutritionCache(
  cache: Map<string, NutritionDetail | null>,
  detailPaths: string[],
  options?: {
    skipNetworkFetch?: boolean
  },
) {
  const normalizedDetailPaths = [...new Set(
    detailPaths
      .map((detailPath) => normalizeMenuItemDetailPath(detailPath))
      .filter((detailPath): detailPath is string => Boolean(detailPath)),
  )]
  const missingDetailPaths = normalizedDetailPaths.filter((detailPath) => !cache.has(detailPath))

  if (options?.skipNetworkFetch) {
    missingDetailPaths.forEach((detailPath) => {
      cache.set(detailPath, null)
    })
    return
  }

  const entries = await mapLimit(missingDetailPaths, DETAIL_FETCH_CONCURRENCY, async (detailPath) => {
    try {
      const html = await fetchHtml(`${UCLA_DINING_BASE_URL}${detailPath}`)
      return [detailPath, parseNutritionPage(html)] as const
    } catch (error) {
      console.error('Failed to fetch customization detail', {
        detailPath,
        error: error instanceof Error ? error.message : String(error),
      })
      return [detailPath, null] as const
    }
  })

  entries.forEach(([detailPath, detail]) => {
    cache.set(detailPath, detail)
  })
}

async function startRunRecord(
  admin: ReturnType<typeof createAdminClient>,
  targetDate: string,
  triggerSource: string,
) {
  const { data, error } = await admin
    .from('dining_ingestion_runs')
    .insert({
      target_date: targetDate,
      trigger_source: triggerSource,
      status: 'running',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw error ?? new Error('Unable to create ingestion run record')
  }

  return data.id as number
}

async function markAbandonedRunRecords(
  admin: ReturnType<typeof createAdminClient>,
) {
  const cutoffIso = new Date(
    Date.now() - RUN_STALE_AFTER_MINUTES * 60 * 1000,
  ).toISOString()

  const { error } = await admin
    .from('dining_ingestion_runs')
    .update({
      completed_at: new Date().toISOString(),
      error_message: 'Marked failed after exceeding runtime without completion',
      status: 'failure',
    })
    .eq('status', 'running')
    .is('completed_at', null)
    .lt('started_at', cutoffIso)

  if (error) {
    throw error
  }
}

async function finishRunRecord(
  admin: ReturnType<typeof createAdminClient>,
  runId: number,
  summary: SyncRunSummary,
) {
  const { error } = await admin
    .from('dining_ingestion_runs')
    .update({
      completed_at: new Date().toISOString(),
      error_count: summary.errorCount,
      hall_count: summary.hallResults.length,
      item_count: summary.itemCount,
      snapshot_count: summary.snapshotCount,
      notes: {
        hall_results: summary.hallResults,
      },
      status: summary.status,
      error_message:
        summary.status === 'failure'
          ? 'Dining ingestion failed for all halls'
          : null,
    })
    .eq('id', runId)

  if (error) {
    throw error
  }
}

async function clearSnapshotItemsForPeriod(
  admin: ReturnType<typeof createAdminClient>,
  hallId: string,
  mealPeriod: MealPeriod,
  sourceUrl: string,
  targetDate: string,
) {
  const { data: snapshot, error: snapshotError } = await admin
    .from('menu_snapshots')
    .upsert(
      {
        fetched_at: new Date().toISOString(),
        hall_id: hallId,
        meal_period: mealPeriod,
        service_date: targetDate,
        source_url: sourceUrl,
        status: 'ready',
      },
      {
        onConflict: 'hall_id,service_date,meal_period',
      },
    )
    .select('id')
    .single()

  if (snapshotError || !snapshot) {
    throw snapshotError ?? new Error('Snapshot upsert failed while clearing items')
  }

  const { error: deleteError } = await admin
    .from('menu_items')
    .delete()
    .eq('snapshot_id', snapshot.id)

  if (deleteError) {
    throw deleteError
  }
}

async function deleteSnapshotForPeriod(
  admin: ReturnType<typeof createAdminClient>,
  hallId: string,
  mealPeriod: MealPeriod,
  targetDate: string,
) {
  const { data: snapshots, error: snapshotError } = await admin
    .from('menu_snapshots')
    .select('id')
    .eq('hall_id', hallId)
    .eq('meal_period', mealPeriod)
    .eq('service_date', targetDate)

  if (snapshotError) {
    throw snapshotError
  }

  if (!snapshots?.length) {
    return
  }

  for (const snapshot of snapshots) {
    const { error: deleteItemsError } = await admin
      .from('menu_items')
      .delete()
      .eq('snapshot_id', snapshot.id)

    if (deleteItemsError) {
      throw deleteItemsError
    }
  }

  const { error: deleteSnapshotError } = await admin
    .from('menu_snapshots')
    .delete()
    .eq('hall_id', hallId)
    .eq('meal_period', mealPeriod)
    .eq('service_date', targetDate)

  if (deleteSnapshotError) {
    throw deleteSnapshotError
  }
}

async function syncDiningMenus(
  admin: ReturnType<typeof createAdminClient>,
  targetDate: string,
  selectedHallIds: string[] | undefined,
  selectedItemNames: string[] | undefined,
  selectedMealPeriods: MealPeriod[] | undefined,
  selectedStationNames: string[] | undefined,
  triggerSource: string,
  options?: {
    replaceExistingSnapshot?: boolean
    skipNutritionFetch?: boolean
  },
) {
  async function loadActiveHalls() {
    const { data, error } = await admin
      .from('dining_halls')
      .select('id,name,source_path,breakfast_hours,lunch_hours,dinner_hours,late_night_hours')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data) {
      throw error ?? new Error('Unable to load dining halls')
    }

    return data as DiningHallRow[]
  }

  let halls = await loadActiveHalls()

  if (targetDate === getLosAngelesToday()) {
    const syncedHoursByHallId = await syncDiningHallHours(admin, halls)
    halls = halls.map((hall) => ({
      ...hall,
      ...(syncedHoursByHallId.get(hall.id) ?? {}),
    }))
  }

  const filteredHalls = halls.filter((hall) =>
    selectedHallIds?.length ? selectedHallIds.includes(hall.id) : true,
  )

  await markAbandonedRunRecords(admin)
  const runId = await startRunRecord(admin, targetDate, triggerSource)
  const hallResults: SyncHallResult[] = []
  let snapshotCount = 0
  let itemCount = 0
  let errorCount = 0
  const nutritionCache = new Map<string, NutritionDetail | null>()
  let atAGlanceMenus: Map<string, ParsedHallMenu> | null = null

  async function getAtAGlanceMenus() {
    if (atAGlanceMenus) {
      return atAGlanceMenus
    }

    const html = await fetchHtml(buildAtAGlanceUrl(targetDate))
    atAGlanceMenus = parseAtAGlancePage(html, filteredHalls, targetDate, selectedMealPeriods)
    return atAGlanceMenus
  }

  try {
    for (const hall of filteredHalls) {
      if (!hall.source_path) {
        hallResults.push({
          error: 'Missing source path',
          hallId: hall.id,
          hallName: hall.name,
          itemCount: 0,
          mealPeriods: [],
          status: 'failure',
        })
        errorCount += 1
        continue
      }

      const sourceUrl = buildHallUrl(hall.source_path ?? hall.id, targetDate)
      const openMealPeriods = getOpenMealPeriodsForHall(hall, selectedMealPeriods)
      const closedMealPeriods = PERIOD_CONFIG.map((period) => period.key).filter(
        (mealPeriod) =>
          !getOpenMealPeriodsForHall(hall, undefined).includes(mealPeriod),
      )

      try {
        const sourceHtml = await fetchHtml(sourceUrl)
        const allDayHall = parseAllDayMenuPage(
          sourceHtml,
          hall,
          targetDate,
          selectedMealPeriods,
        )
        const hallMenuPage =
          !allDayHall
            ? parseHallMenuPage(
                sourceHtml,
                hall,
                targetDate,
                selectedMealPeriods,
              )
            : null
        const primaryHall =
          allDayHall ?? (hallMenuPage?.sections.length ? hallMenuPage : null)
        const missingMealPeriods = openMealPeriods.filter(
          (mealPeriod) =>
            !primaryHall?.sections.some((section) => section.mealPeriod === mealPeriod),
        )
        const atAGlanceHall =
          !primaryHall || missingMealPeriods.length > 0
            ? (await getAtAGlanceMenus()).get(hall.id) ?? null
            : null
        let parsedHall =
          mergeParsedHallSections(primaryHall, atAGlanceHall, missingMealPeriods) ??
          primaryHall ??
          atAGlanceHall ?? {
          hallId: hall.id,
          hallName: hall.name,
          pageDateLabel: null,
          sourceUrl: buildAtAGlanceUrl(targetDate),
          sections: [] as ParsedMealSection[],
        }

        parsedHall = filterParsedHallSectionsByOpenMealPeriods(
          parsedHall,
          openMealPeriods,
        )

        if (selectedStationNames?.length) {
          const selectedStationNameSet = new Set(selectedStationNames)
          parsedHall = {
            ...parsedHall,
            sections: parsedHall.sections
              .map((section) => ({
                ...section,
                items: section.items.filter((item) =>
                  selectedStationNameSet.has(item.stationName),
                ),
              }))
              .filter((section) => section.items.length > 0),
          }
        }
        if (selectedItemNames?.length) {
          const selectedItemNameSet = new Set(selectedItemNames)
          parsedHall = {
            ...parsedHall,
            sections: parsedHall.sections
              .map((section) => ({
                ...section,
                items: section.items.filter((item) =>
                  selectedItemNameSet.has(item.itemName),
                ),
              }))
              .filter((section) => section.items.length > 0),
          }
        }

        for (const mealPeriod of closedMealPeriods) {
          await deleteSnapshotForPeriod(admin, hall.id, mealPeriod, targetDate)
        }

        const periodsToClear = openMealPeriods.filter(
          (mealPeriod) =>
            !parsedHall.sections.some((section) => section.mealPeriod === mealPeriod),
        )

        for (const mealPeriod of periodsToClear) {
          await clearSnapshotItemsForPeriod(
            admin,
            hall.id,
            mealPeriod,
            parsedHall.sourceUrl,
            targetDate,
          )
          snapshotCount += 1
        }

        for (const section of parsedHall.sections) {
          const { data: snapshot, error: snapshotError } = await admin
            .from('menu_snapshots')
            .upsert(
              {
                fetched_at: new Date().toISOString(),
                hall_id: hall.id,
                meal_period: section.mealPeriod,
                service_date: targetDate,
                source_url: parsedHall.sourceUrl,
                status: 'ready',
              },
              {
                onConflict: 'hall_id,service_date,meal_period',
              },
            )
            .select('id')
            .single()

          if (snapshotError || !snapshot) {
            throw snapshotError ?? new Error('Snapshot upsert failed')
          }

          snapshotCount += 1

          if (options?.replaceExistingSnapshot ?? true) {
            const { error: deleteError } = await admin
              .from('menu_items')
              .delete()
              .eq('snapshot_id', snapshot.id)

            if (deleteError) {
              throw deleteError
            }
          }

          for (let itemIndex = 0; itemIndex < section.items.length; itemIndex += ITEM_PROCESSING_CHUNK_SIZE) {
            const itemChunk = section.items.slice(itemIndex, itemIndex + ITEM_PROCESSING_CHUNK_SIZE)
            const recipeIds = itemChunk
              .map((item) => item.recipeId)
              .filter((id): id is number => id !== null)
            await populateRecipeNutritionCache(admin, nutritionCache, recipeIds, {
              skipNetworkFetch: options?.skipNutritionFetch,
            })
            const customizationDetailPaths = recipeIds.flatMap((recipeId) => {
              const detail = nutritionCache.get(buildRecipeDetailPath(recipeId))

              return detail?.customizationOptions
                .map((option) => option.detailPath)
                .filter((detailPath): detailPath is string => Boolean(detailPath)) ?? []
            })
            await populateDetailNutritionCache(nutritionCache, customizationDetailPaths, {
              skipNetworkFetch: options?.skipNutritionFetch,
            })

            const rows = itemChunk.map((item) => {
              const nutrition = item.recipeId !== null
                ? nutritionCache.get(buildRecipeDetailPath(item.recipeId))
                : null
              const allergenLabels =
                nutrition?.allergenLabels && nutrition.allergenLabels.length > 0
                  ? nutrition.allergenLabels
                  : item.badgeLabels.filter(isAllergenBadgeLabel)
              const customizationOptions =
                nutrition?.customizationOptions.map((option) => {
                  const optionDetailPath =
                    normalizeMenuItemDetailPath(option.detailPath) ??
                    (option.recipeId !== null ? buildRecipeDetailPath(option.recipeId) : null)
                  const optionNutrition =
                    optionDetailPath ? nutritionCache.get(optionDetailPath) : null
                  const optionAllergenLabels =
                    optionNutrition?.allergenLabels && optionNutrition.allergenLabels.length > 0
                      ? optionNutrition.allergenLabels
                      : option.allergenLabels

                  return {
                    allergenLabels: optionAllergenLabels,
                    badgeLabels: option.badgeLabels,
                    calories: optionNutrition?.calories ?? option.calories,
                    carbsG: optionNutrition?.carbsG ?? option.carbsG,
                    defaultQuantity: option.defaultQuantity,
                    detailPath: optionDetailPath,
                    fatsG: optionNutrition?.fatsG ?? option.fatsG,
                    ingredients: optionNutrition?.ingredients ?? option.ingredients,
                    itemName: optionNutrition?.itemName ?? option.itemName,
                    nutritionFacts: optionNutrition?.nutritionFacts ?? option.nutritionFacts,
                    proteinG: optionNutrition?.proteinG ?? option.proteinG,
                    recipeId: option.recipeId,
                    servingSize: optionNutrition?.servingSize ?? option.servingSize,
                  }
                }) ?? []

              return {
                allergen_labels: allergenLabels,
                badge_labels: item.badgeLabels,
                snapshot_id: snapshot.id,
                recipe_id: item.recipeId,
                station_name: item.stationName,
                item_name: nutrition?.itemName ?? item.itemName,
                serving_size: nutrition?.servingSize ?? null,
                calories: nutrition?.calories ?? null,
                protein_g: nutrition?.proteinG ?? null,
                carbs_g: nutrition?.carbsG ?? null,
                fats_g: nutrition?.fatsG ?? null,
                customization_options: customizationOptions,
                ingredients: nutrition?.ingredients ?? [],
                item_order: item.itemOrder,
                nutrition_facts: nutrition?.nutritionFacts ?? [],
              }
            })

            if (rows.length > 0) {
              const { error: insertError } = await admin.from('menu_items').insert(rows)

              if (insertError) {
                throw insertError
              }
            }

            itemCount += rows.length
          }
        }

        hallResults.push({
          hallId: hall.id,
          hallName: hall.name,
          itemCount: parsedHall.sections.reduce(
            (total, section) => total + section.items.length,
            0,
          ),
          mealPeriods: parsedHall.sections.map((section) => section.mealPeriod),
          sourceUrl: parsedHall.sourceUrl,
          status: 'success',
        })
      } catch (error) {
        hallResults.push({
          error: error instanceof Error ? error.message : String(error),
          hallId: hall.id,
          hallName: hall.name,
          itemCount: 0,
          mealPeriods: [],
          sourceUrl,
          status: 'failure',
        })
        errorCount += 1
      }
    }

    const status: SyncRunSummary['status'] =
      hallResults.length === 0
        ? 'failure'
        : errorCount === 0
          ? 'success'
          : errorCount === hallResults.length
            ? 'failure'
            : 'partial_failure'

    const summary: SyncRunSummary = {
      errorCount,
      hallResults,
      itemCount,
      snapshotCount,
      status,
    }

    await finishRunRecord(admin, runId, summary)
    return summary
  } catch (error) {
    const summary: SyncRunSummary = {
      errorCount: hallResults.length || 1,
      hallResults,
      itemCount,
      snapshotCount,
      status: 'failure',
    }
    await finishRunRecord(admin, runId, summary)
    throw error
  }
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
    return jsonResponse(405, {
      error: 'Method not allowed',
    })
  }

  if (!hasServiceRoleToken(req)) {
    return jsonResponse(401, {
      error: 'Unauthorized',
    })
  }

  const body = (await req.json().catch(() => ({}))) as SyncRequest
  const targetDate = body.targetDate ?? getLosAngelesToday()
  const triggerSource = body.trigger ?? 'manual'

  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return jsonResponse(400, {
      error: 'targetDate must be YYYY-MM-DD',
    })
  }

  try {
    const admin = createAdminClient()
    const summary = await syncDiningMenus(
      admin,
      targetDate,
      body.hallIds,
      body.itemNames,
      body.mealPeriods,
      body.stationNames,
      triggerSource,
      {
        replaceExistingSnapshot: body.replaceExistingSnapshot,
        skipNutritionFetch: body.skipNutritionFetch,
      },
    )

    return jsonResponse(200, {
      ...summary,
      targetDate,
    })
  } catch (error) {
    console.error('Dining ingestion failed', error)
    return jsonResponse(500, {
      error: 'Dining ingestion failed',
      targetDate,
    })
  }
})
