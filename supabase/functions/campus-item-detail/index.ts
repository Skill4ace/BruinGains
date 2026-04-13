import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu'
const FETCH_TIMEOUT_MS = 15000
const USER_REQUEST_LIMIT = 24
const IP_REQUEST_LIMIT = 120
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

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
  proteinG: number | null
  recipeId: number | null
  servingSize: string | null
}

type ItemDetailPayload = {
  allergenLabels: string[]
  calories: number | null
  carbsG: number | null
  customizationOptions: DiningCustomizationOption[]
  fatsG: number | null
  ingredients: string[]
  itemName: string | null
  nutritionFacts: DiningNutritionFact[]
  proteinG: number | null
  servingSize: string | null
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

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
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

  return forwardedFor.split(',')[0]?.trim() ?? null
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

  return { allowed: true, error: null }
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

function parseIntegerValue(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Math.round(Number.parseFloat(match[0])) : null
}

function parseNumericValue(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number.parseFloat(match[0]) : null
}

function isZeroNutritionPlaceholder(
  calories: number | null,
  nutritionFacts: DiningNutritionFact[],
) {
  return (
    calories === 0 &&
    nutritionFacts.length > 0 &&
    nutritionFacts.every((fact) => {
      const numericValue = parseNumericValue(fact.value)

      return (
        (numericValue === null || numericValue === 0) &&
        (fact.dailyValuePercent === null || fact.dailyValuePercent === 0)
      )
    })
  )
}

function splitLabelList(value: string | null | undefined) {
  return (value ?? '')
    .split(/[,/;]+/)
    .map((entry) => cleanText(entry))
    .filter(Boolean)
}

function normalizeBadgeLabel(value: string | null | undefined) {
  const label = cleanText(value)

  if (!label) {
    return null
  }

  return label
    .replace(/^Contains\s+/i, '')
    .replace(/\s+food item$/i, '')
    .replace(/\s+menu option$/i, '')
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

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'BruinGainsCampusItemDetail/1.0 (+https://afxptjzzctiowrqqcyzh.supabase.co)',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} for ${url}`)
  }

  return await response.text()
}

function parseNutritionPage(html: string): ItemDetailPayload {
  const $ = cheerio.load(html)
  const nutritionRoot = $('#nutrition')
  const ingredientRoot = $('#ingredient_list')
  const complexIngredientRoot = $('.single-complex-ingredients')
  const labelToValue = new Map<string, string>()
  const nutritionFacts: DiningNutritionFact[] = []
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
  const customizationOptions: DiningCustomizationOption[] = []

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
        fatsG: null,
        ingredients: [],
        itemName: optionName,
        nutritionFacts: [],
        proteinG: null,
        recipeId,
        servingSize: null,
      })
    })
  const parsedCalories = parseIntegerValue(cleanText($('.single-calories').first().text()))
  const hasCustomizationCalculator =
    customizationOptions.length > 0 &&
    (
      nutritionRoot.find('#selected-items').length > 0 ||
      isZeroNutritionPlaceholder(parsedCalories, nutritionFacts)
    )

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
    calories: hasCustomizationCalculator ? null : parsedCalories,
    fatsG: hasCustomizationCalculator ? null : parseIntegerValue(labelToValue.get('total fat')),
    carbsG: hasCustomizationCalculator
      ? null
      : parseIntegerValue(labelToValue.get('total carbohydrate')),
    customizationOptions,
    ingredients: [...new Set(ingredients)],
    nutritionFacts,
    proteinG: hasCustomizationCalculator ? null : parseIntegerValue(labelToValue.get('protein')),
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const authResult = await authenticateRequest(req)

    if (authResult.error || !authResult.userId) {
      return jsonResponse(401, { error: authResult.error ?? 'Unauthorized' })
    }

    const body = await req.json().catch(() => ({})) as { recipeId?: number }
    const recipeId = typeof body.recipeId === 'number' ? body.recipeId : null

    if (!recipeId) {
      return jsonResponse(400, { error: 'recipeId is required' })
    }

    const admin = createAdminClient()
    const rateLimit = await enforceRateLimit(admin, authResult.userId, getClientIp(req))

    if (!rateLimit.allowed) {
      return jsonResponse(429, { error: rateLimit.error })
    }

    const detailHtml = await fetchHtml(`${UCLA_DINING_BASE_URL}/menu-item/?recipe=${recipeId}`)
    const detail = parseNutritionPage(detailHtml)
    return jsonResponse(200, detail)
  } catch (error) {
    console.error('Campus item detail request failed', error)
    return jsonResponse(500, { error: 'Campus item detail request failed' })
  }
})\n"},{"name":"deno.json","content":"{\n  \"imports\": {\n    \"@supabase/supabase-js\": \"npm:@supabase/supabase-js@2\",\n    \"cheerio\": \"npm:cheerio@1.0.0\"\n  }\n}\n"}]}期六合 to=functions.apply_patch code ***!
