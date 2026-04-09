import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu'
const UCLA_DINING_TIME_ZONE = 'America/Los_Angeles'
const USER_AGENT = 'BruinGainsDiningIngest/1.0 (+https://afxptjzzctiowrqqcyzh.supabase.co)'
const DINING_MENU_AGLANCE_PATH = '/menus-at-a-glance'
const BOUTIQUE_HALL_IDS = [
  'feast-rieber',
  'bruin-cafe',
  'cafe-1919',
  'study-hedrick',
  'the-drey',
  'rendezvous',
  'bruin-bowl',
  'epicuria-ackerman',
] as const

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
  mealPeriods?: MealPeriod[]
  targetDate?: string
  trigger?: string
}

type DiningHallRow = {
  id: string
  name: string
  source_path: string | null
}

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

type ParsedMenuItem = {
  badgeLabels: string[]
  itemName: string
  itemOrder: number
  recipeId: number
  stationName: string
}

type ParsedNutritionFact = {
  dailyValuePercent: number | null
  id: string
  label: string
  value: string
}

type NutritionDetail = {
  allergenLabels: string[]
  calories: number | null
  carbsG: number | null
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

  byName.set(normalizeComparableValue('De Neve Dining'), halls.find((hall) => hall.id === 'de-neve') ?? halls[0])
  byName.set(
    normalizeComparableValue('The Study at Hedrick'),
    halls.find((hall) => hall.id === 'study-hedrick') ?? halls[0],
  )

  return { byName, bySourcePath }
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

    const sectionRoot = $(`#${period.anchorId}`)

    if (!sectionRoot.length) {
      continue
    }

    sectionRoot
      .children('.wp-block-columns')
      .first()
      .find('.at-a-glance-menu__dining-location')
      .each((_, locationElement) => {
        const hallName = cleanText($(locationElement).find('h3').first().text())
        const detailHref = $(locationElement)
          .children("a[href^='/']")
          .first()
          .attr('href')
        const hall =
          (detailHref
            ? lookup.bySourcePath.get(
                normalizeComparableValue(detailHref.replace(/\/$/, '')),
              )
            : null) ??
          lookup.byName.get(normalizeComparableValue(hallName))

        if (!hall) {
          return
        }

        const noServiceMessage = cleanText($(locationElement).children('p').first().text())

        if (noServiceMessage.toLowerCase().includes('there is no')) {
          return
        }

        const items: ParsedMenuItem[] = []
        let itemOrder = 0

        $(locationElement)
          .children('.at-a-glance-menu__meal-station')
          .each((__, stationElement) => {
            const rawStationName = cleanText($(stationElement).find('h4').first().text())
            const stationName = rawStationName && rawStationName !== '.' ? rawStationName : 'Station'

            $(stationElement)
              .find('li')
              .each((___, itemElement) => {
                const recipeLink = $(itemElement).find("a[href*='recipe=']").first()
                const itemName = cleanText(recipeLink.text())
                const recipeId = extractRecipeIdFromHref(recipeLink.attr('href'))

                if (!itemName || recipeId === null) {
                  return
                }

                const badgeLabels = $(itemElement)
                  .find('img')
                  .map((____, badgeImage) =>
                    normalizeBadgeLabel(
                      $(badgeImage).attr('title') ?? $(badgeImage).attr('alt'),
                    ),
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

        if (!items.length) {
          return
        }

        const existing = parsedHalls.get(hall.id)
        const nextSection = {
          items,
          mealPeriod: period.key,
        }

        parsedHalls.set(hall.id, {
          hallId: hall.id,
          hallName: hall.name,
          pageDateLabel,
          sourceUrl: detailHref
            ? `${UCLA_DINING_BASE_URL}${detailHref}`
            : buildAtAGlanceUrl(targetDate),
          sections: existing ? [...existing.sections, nextSection] : [nextSection],
        })
      })
  }

  return parsedHalls
}

function parseNutritionPage(html: string): NutritionDetail {
  const $ = cheerio.load(html)
  const nutritionRoot = $('#nutrition')
  const ingredientRoot = $('#ingredient_list')
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
  const ingredients = ingredientRoot
    .find('ul.nolispace li')
    .map((_, ingredient) => cleanText($(ingredient).text()))
    .get()
    .filter(Boolean)

  return {
    allergenLabels: [...new Set(splitLabelList(allergenMatch?.[1]))],
    itemName: cleanText($('.single-name').first().text()) || null,
    servingSize: servingMatch?.[1]?.split('Calories')[0]?.trim() ?? null,
    calories: parseIntegerValue(cleanText($('.single-calories').first().text())),
    fatsG: parseIntegerValue(labelToValue.get('total fat')),
    carbsG: parseIntegerValue(labelToValue.get('total carbohydrate')),
    ingredients: [...new Set(ingredients)],
    nutritionFacts,
    proteinG: parseIntegerValue(labelToValue.get('protein')),
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

async function populateRecipeNutritionCache(
  cache: Map<number, NutritionDetail | null>,
  recipeIds: number[],
) {
  const missingRecipeIds = [...new Set(recipeIds)].filter((recipeId) => !cache.has(recipeId))

  const entries = await mapLimit(missingRecipeIds, 4, async (recipeId) => {
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
    cache.set(recipeId, detail)
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

async function syncDiningMenus(
  admin: ReturnType<typeof createAdminClient>,
  targetDate: string,
  selectedHallIds: string[] | undefined,
  selectedMealPeriods: MealPeriod[] | undefined,
  triggerSource: string,
) {
  const { data: halls, error: hallsError } = await admin
    .from('dining_halls')
    .select('id,name,source_path')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (hallsError || !halls) {
    throw hallsError ?? new Error('Unable to load dining halls')
  }

  const filteredHalls = halls.filter((hall) =>
    selectedHallIds?.length ? selectedHallIds.includes(hall.id) : true,
  ) as DiningHallRow[]

  const runId = await startRunRecord(admin, targetDate, triggerSource)
  const hallResults: SyncHallResult[] = []
  let snapshotCount = 0
  let itemCount = 0
  let errorCount = 0
  const nutritionCache = new Map<number, NutritionDetail | null>()
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

      const sourceUrl = buildHallUrl(hall.source_path, targetDate)

      try {
        const html = await fetchHtml(sourceUrl)
        let parsedHall = parseHallMenuPage(
          html,
          hall,
          targetDate,
          selectedMealPeriods,
        )
        const isBoutiqueHall = BOUTIQUE_HALL_IDS.includes(
          hall.id as (typeof BOUTIQUE_HALL_IDS)[number],
        )

        if (parsedHall.sections.length === 0 || isBoutiqueHall) {
          const atAGlanceHall = (await getAtAGlanceMenus()).get(hall.id)

          if (atAGlanceHall) {
            parsedHall = atAGlanceHall
          } else if (isBoutiqueHall) {
            parsedHall = {
              hallId: hall.id,
              hallName: hall.name,
              pageDateLabel: null,
              sourceUrl: buildAtAGlanceUrl(targetDate),
              sections: [],
            }
          }
        }

        const expectedMealPeriods =
          selectedMealPeriods?.length
            ? selectedMealPeriods
            : PERIOD_CONFIG.map((period) => period.key)
        const periodsToClear = expectedMealPeriods.filter(
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

        const recipeIds = parsedHall.sections.flatMap((section) =>
          section.items.map((item) => item.recipeId),
        )
        await populateRecipeNutritionCache(nutritionCache, recipeIds)

        for (const section of parsedHall.sections) {
          const { data: snapshot, error: snapshotError } = await admin
            .from('menu_snapshots')
            .upsert(
              {
                fetched_at: new Date().toISOString(),
                hall_id: hall.id,
                meal_period: section.mealPeriod,
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
            throw snapshotError ?? new Error('Snapshot upsert failed')
          }

          snapshotCount += 1

          const { error: deleteError } = await admin
            .from('menu_items')
            .delete()
            .eq('snapshot_id', snapshot.id)

          if (deleteError) {
            throw deleteError
          }

          const rows = section.items.map((item) => {
            const nutrition = nutritionCache.get(item.recipeId)
            const allergenLabels =
              nutrition?.allergenLabels && nutrition.allergenLabels.length > 0
                ? nutrition.allergenLabels
                : item.badgeLabels.filter(isAllergenBadgeLabel)

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

        hallResults.push({
          hallId: hall.id,
          hallName: hall.name,
          itemCount: parsedHall.sections.reduce(
            (total, section) => total + section.items.length,
            0,
          ),
          mealPeriods: parsedHall.sections.map((section) => section.mealPeriod),
          sourceUrl,
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
      body.mealPeriods,
      triggerSource,
    )

    return jsonResponse(200, {
      ...summary,
      targetDate,
    })
  } catch (error) {
    console.error('Dining ingestion failed', error)
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : String(error),
      targetDate,
    })
  }
})
