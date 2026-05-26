import {
  CACHE_FILES,
  DATABASE_ID,
  createCacheVersion,
  createServices,
  parseJson,
  readOptionalCacheFile,
  replaceJsonFile,
  updateCacheManifest,
} from '../_shared/campus-cache.js';
import * as cheerio from 'cheerio';

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu';
const UCLA_DINING_TIME_ZONE = 'America/Los_Angeles';
const USER_AGENT = 'BruinGainsDiningNutritionBackfill/2.0 (+https://sfo.cloud.appwrite.io)';
const FETCH_TIMEOUT_MS = 15000;
const DEFAULT_RECIPE_BATCH_SIZE = 40;
const MAX_RECIPE_BATCH_SIZE = 160;
const DETAIL_FETCH_CONCURRENCY = 5;
const ROW_UPDATE_CONCURRENCY = 10;

function parseRequestBody(req) {
  try {
    return req.bodyJson && typeof req.bodyJson === 'object' ? req.bodyJson : {};
  } catch {
    return {};
  }
}

function formatDateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getLosAngelesDateOffset(dayOffset) {
  return formatDateInTimeZone(
    new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000),
    UCLA_DINING_TIME_ZONE,
  );
}

function cleanText(value) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeNutritionFactId(label) {
  const words = cleanText(label)
    .replace(/[%*]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  if (!words.length) {
    return 'fact';
  }

  return words
    .map((word, index) =>
      index === 0
        ? word.slice(0, 1).toLowerCase() + word.slice(1)
        : word.slice(0, 1).toUpperCase() + word.slice(1),
    )
    .join('');
}

function parseIntegerValue(value) {
  if (!value) {
    return null;
  }

  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Math.round(Number.parseFloat(match[0])) : null;
}

function parseNumericValue(value) {
  if (!value) {
    return null;
  }

  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

function isZeroNutritionPlaceholder(calories, nutritionFacts) {
  return (
    calories === 0 &&
    nutritionFacts.length > 0 &&
    nutritionFacts.every((fact) => {
      const numericValue = parseNumericValue(fact.value);

      return (
        (numericValue === null || numericValue === 0) &&
        (fact.dailyValuePercent === null || fact.dailyValuePercent === 0)
      );
    })
  );
}

function splitLabelList(value) {
  return (value ?? '')
    .split(/[,/;]+/)
    .map((entry) => cleanText(entry))
    .filter(Boolean);
}

function normalizeBadgeLabel(value) {
  const label = cleanText(value);

  if (!label) {
    return null;
  }

  return label
    .replace(/^Contains\s+/i, '')
    .replace(/\s+food item$/i, '')
    .replace(/\s+menu option$/i, '');
}

function isAllergenBadgeLabel(label) {
  const normalizedLabel = label.toLowerCase();

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
  );
}

function buildRecipeDetailPath(recipeId) {
  return `/menu-item/?recipe=${recipeId}`;
}

function buildIngredientDetailPath(ingredientId) {
  return `/menu-item/?ingredient=${ingredientId}`;
}

function extractRecipeIdFromHref(href) {
  if (!href) {
    return null;
  }

  const match = href.match(/[?&]recipe=(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function normalizeMenuItemDetailPath(value) {
  const cleanedValue = cleanText(value);

  if (!cleanedValue) {
    return null;
  }

  if (cleanedValue.startsWith('http://') || cleanedValue.startsWith('https://')) {
    const url = new URL(cleanedValue);
    return `${url.pathname}${url.search}`;
  }

  return cleanedValue.startsWith('/') ? cleanedValue : `/${cleanedValue}`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} for ${url}`);
  }

  return response.text();
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= values.length) {
        break;
      }

      results[currentIndex] = await mapper(values[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );

  return results;
}

function parseNutritionPage(html) {
  const $ = cheerio.load(html);
  const nutritionRoot = $('#nutrition');
  const ingredientRoot = $('#ingredient_list');
  const complexIngredientRoot = $('.single-complex-ingredients');
  const labelToValue = new Map();
  const nutritionFacts = [];
  const seenFactIds = new Set();

  nutritionRoot.find('table tbody tr').each((_, row) => {
    const cells = $(row).children('td');

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 2) {
      const factCell = cells.eq(cellIndex).clone();
      const dailyValueCell = cells.eq(cellIndex + 1);
      const labelElement = factCell.find('span').first();
      const label = cleanText(labelElement.text());

      if (!label) {
        continue;
      }

      labelElement.remove();
      const value = cleanText(factCell.text());
      const factId = normalizeNutritionFactId(label);

      labelToValue.set(label.toLowerCase(), value);

      if (!value || seenFactIds.has(factId)) {
        continue;
      }

      nutritionFacts.push({
        dailyValuePercent: parseIntegerValue(cleanText(dailyValueCell.text())),
        id: factId,
        label,
        value,
      });
      seenFactIds.add(factId);
    }
  });

  const servingText = cleanText(nutritionRoot.text());
  const servingMatch = servingText.match(/Serving Size:\s*([^\n]+)/i);
  const ingredientHtml = ingredientRoot.html() ?? '';
  const allergenMatch = ingredientHtml.match(/<strong>Allergens\*:<\/strong>\s*([^<]+)/i);
  const tabIngredients = ingredientRoot
    .find('ul.nolispace li')
    .map((_, ingredient) => cleanText($(ingredient).text()))
    .get()
    .filter(Boolean);
  const complexIngredients = complexIngredientRoot
    .find('.single-ingredient-link')
    .map((_, ingredientLink) => cleanText($(ingredientLink).text()))
    .get()
    .filter(Boolean);
  const complexAllergenLabels = complexIngredientRoot
    .find('img')
    .map((_, badgeImage) =>
      normalizeBadgeLabel($(badgeImage).attr('title') ?? $(badgeImage).attr('alt')),
    )
    .get()
    .filter(Boolean)
    .filter(isAllergenBadgeLabel);
  const customizationOptions = [];

  complexIngredientRoot
    .find('input.toggle_nutrition_value')
    .each((_, optionInput) => {
      const optionLabel = $(optionInput).closest('label');
      const optionName = cleanText(optionLabel.find('.single-ingredient-link').first().text());
      const optionHref = normalizeMenuItemDetailPath(
        optionLabel.find('.single-ingredient-link').first().attr('href'),
      );
      const optionIdentifier = parseIntegerValue($(optionInput).attr('value'));
      const optionType = cleanText($(optionInput).attr('ingredient_type')).toLowerCase();
      const detailPath =
        optionHref ??
        (
          optionIdentifier !== null
            ? optionType === 'ingredient'
              ? buildIngredientDetailPath(optionIdentifier)
              : buildRecipeDetailPath(optionIdentifier)
            : null
        );
      const recipeId = detailPath?.includes('?recipe=')
        ? extractRecipeIdFromHref(detailPath)
        : optionType === 'subrecipe'
          ? optionIdentifier
          : null;

      if (!optionName) {
        return;
      }

      const quantityInput = $(optionInput)
        .closest('li')
        .nextAll('div.multiplier_input')
        .first()
        .find('input.item-mutliplier')
        .first();
      const defaultQuantity =
        parseIntegerValue(quantityInput.attr('value') ?? undefined) ?? 1;
      const optionBadgeLabels = optionLabel
        .find('img')
        .map((__, badgeImage) =>
          normalizeBadgeLabel($(badgeImage).attr('title') ?? $(badgeImage).attr('alt')),
        )
        .get()
        .filter(Boolean);

      customizationOptions.push({
        allergenLabels: [...new Set(optionBadgeLabels.filter(isAllergenBadgeLabel))],
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
      });
    });

  const parsedCalories = parseIntegerValue(cleanText($('.single-calories').first().text()));
  const hasCustomizationCalculator =
    customizationOptions.length > 0 &&
    (
      nutritionRoot.find('#selected-items').length > 0 ||
      isZeroNutritionPlaceholder(parsedCalories, nutritionFacts)
    );
  const ingredients =
    tabIngredients.length > 0
      ? tabIngredients
      : hasCustomizationCalculator
        ? []
        : complexIngredients;

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
  };
}

function hasNutritionContent(detail) {
  if (!detail) {
    return false;
  }

  const hasDirectContent =
    Boolean(detail.servingSize) ||
    detail.calories !== null ||
    detail.proteinG !== null ||
    detail.carbsG !== null ||
    detail.fatsG !== null ||
    detail.allergenLabels.length > 0 ||
    detail.ingredients.length > 0 ||
    detail.nutritionFacts.length > 0;
  const hasOptionContent = detail.customizationOptions.some((option) =>
    Boolean(option.servingSize) ||
    option.calories !== null ||
    option.proteinG !== null ||
    option.carbsG !== null ||
    option.fatsG !== null ||
    option.allergenLabels.length > 0 ||
    option.ingredients.length > 0 ||
    option.nutritionFacts.length > 0,
  );

  return hasDirectContent || hasOptionContent;
}

async function fetchNutritionDetailByPath(detailPath) {
  const normalizedPath = normalizeMenuItemDetailPath(detailPath);
  const html = await fetchHtml(`${UCLA_DINING_BASE_URL}${normalizedPath}`);

  return parseNutritionPage(html);
}

async function populateRecipeNutritionCache(cache, errors, recipeIds) {
  const missingRecipeIds = [...new Set(recipeIds)].filter((recipeId) =>
    !cache.has(buildRecipeDetailPath(recipeId)),
  );
  const entries = await mapLimit(missingRecipeIds, DETAIL_FETCH_CONCURRENCY, async (recipeId) => {
    const detailPath = buildRecipeDetailPath(recipeId);

    try {
      return [detailPath, await fetchNutritionDetailByPath(detailPath), null];
    } catch (exception) {
      return [detailPath, null, exception?.message ?? String(exception)];
    }
  });

  for (const [detailPath, detail, error] of entries) {
    cache.set(detailPath, detail);

    if (error) {
      errors.set(detailPath, error);
    }
  }
}

async function populateDetailNutritionCache(cache, errors, detailPaths) {
  const missingDetailPaths = [...new Set(
    detailPaths
      .map((detailPath) => normalizeMenuItemDetailPath(detailPath))
      .filter(Boolean),
  )].filter((detailPath) => !cache.has(detailPath));
  const entries = await mapLimit(
    missingDetailPaths,
    DETAIL_FETCH_CONCURRENCY,
    async (detailPath) => {
      try {
        return [detailPath, await fetchNutritionDetailByPath(detailPath), null];
      } catch (exception) {
        return [detailPath, null, exception?.message ?? String(exception)];
      }
    },
  );

  for (const [detailPath, detail, error] of entries) {
    cache.set(detailPath, detail);

    if (error) {
      errors.set(detailPath, error);
    }
  }
}

function normalizeTargetDates(body) {
  if (Array.isArray(body.targetDates)) {
    const targetDates = body.targetDates.filter((entry) => typeof entry === 'string');

    if (targetDates.length > 0) {
      return [...new Set(targetDates)];
    }
  }

  if (typeof body.targetDate === 'string') {
    return [body.targetDate];
  }

  return [getLosAngelesDateOffset(0), getLosAngelesDateOffset(1)];
}

function normalizeBatchSize(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_RECIPE_BATCH_SIZE;
  }

  return Math.max(1, Math.min(MAX_RECIPE_BATCH_SIZE, Math.round(value)));
}

function buildOptionWithDetail(option, cache) {
  const optionDetailPath =
    normalizeMenuItemDetailPath(option.detailPath) ??
    (option.recipeId !== null ? buildRecipeDetailPath(option.recipeId) : null);
  const optionNutrition = optionDetailPath ? cache.get(optionDetailPath) : null;
  const optionAllergenLabels =
    optionNutrition?.allergenLabels && optionNutrition.allergenLabels.length > 0
      ? optionNutrition.allergenLabels
      : option.allergenLabels;

  return {
    allergenLabels: optionAllergenLabels,
    badgeLabels: option.badgeLabels,
    calories: optionNutrition?.calories ?? option.calories,
    carbsG: optionNutrition?.carbsG ?? option.carbsG,
    defaultQuantity: option.defaultQuantity,
    detailPath: optionDetailPath,
    fatsG: optionNutrition?.fatsG ?? option.fatsG,
    ingredients:
      optionNutrition?.ingredients && optionNutrition.ingredients.length > 0
        ? optionNutrition.ingredients
        : option.ingredients,
    itemName: optionNutrition?.itemName ?? option.itemName,
    nutritionFacts:
      optionNutrition?.nutritionFacts && optionNutrition.nutritionFacts.length > 0
        ? optionNutrition.nutritionFacts
        : option.nutritionFacts,
    proteinG: optionNutrition?.proteinG ?? option.proteinG,
    recipeId: option.recipeId,
    servingSize: optionNutrition?.servingSize ?? option.servingSize,
  };
}

function buildNutritionUpdateData(row, detail, cache, status, errorMessage) {
  const badgeLabels = parseJson(
    row.badge_labels,
    Array.isArray(row.badgeLabels) ? row.badgeLabels : [],
  );
  const allergenLabels =
    detail?.allergenLabels && detail.allergenLabels.length > 0
      ? detail.allergenLabels
      : badgeLabels.filter(isAllergenBadgeLabel);
  const customizationOptions = detail?.customizationOptions.map((option) =>
    buildOptionWithDetail(option, cache),
  ) ?? [];

  if (status === 'failed') {
    return {
      nutrition_error: errorMessage ?? 'Nutrition detail fetch failed',
      nutrition_fetched_at: new Date().toISOString(),
      nutrition_status: 'failed',
    };
  }

  return {
    allergen_labels: JSON.stringify(allergenLabels),
    calories: detail?.calories ?? null,
    carbs_g: detail?.carbsG ?? null,
    customization_options: JSON.stringify(customizationOptions),
    fats_g: detail?.fatsG ?? null,
    ingredients: JSON.stringify(detail?.ingredients ?? []),
    item_name: detail?.itemName ?? row.item_name ?? row.itemName,
    nutrition_error: errorMessage ?? null,
    nutrition_fetched_at: new Date().toISOString(),
    nutrition_facts: JSON.stringify(detail?.nutritionFacts ?? []),
    nutrition_status: status,
    protein_g: detail?.proteinG ?? null,
    serving_size: detail?.servingSize ?? null,
  };
}

async function updateRowsForRecipe(tables, rows, recipeId, cache, errors) {
  const detailPath = buildRecipeDetailPath(recipeId);
  const detail = cache.get(detailPath) ?? null;
  const errorMessage = errors.get(detailPath) ?? null;
  const status = errorMessage
    ? 'failed'
    : hasNutritionContent(detail)
      ? 'ready'
      : 'unavailable';

  await mapLimit(
    rows.filter((row) => row.recipe_id === recipeId),
    ROW_UPDATE_CONCURRENCY,
    (row) =>
      tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: 'menu_items',
        rowId: row.$id,
        data: buildNutritionUpdateData(row, detail, cache, status, errorMessage),
      }),
  );

  return status;
}

async function readNutritionQueue(storage) {
  const queue = await readOptionalCacheFile(
    storage,
    CACHE_FILES.nutritionQueue,
    { items: [] },
  );

  return {
    generatedAt: queue.generatedAt ?? null,
    items: Array.isArray(queue.items) ? queue.items : [],
    version: queue.version ?? null,
  };
}

async function writeNutritionQueue(storage, items) {
  const generatedAt = new Date().toISOString();
  const payload = {
    generatedAt,
    items,
    version: createCacheVersion({ items }),
  };

  await replaceJsonFile(
    storage,
    CACHE_FILES.nutritionQueue,
    'dining-nutrition-queue.json',
    payload,
  );

  return payload;
}

function isTerminalNutritionStatus(status) {
  return status === 'ready' || status === 'unavailable';
}

function isTargetQueueItem(item, targetDateSet) {
  return targetDateSet.size === 0 || targetDateSet.has(item.serviceDate);
}

function isPendingQueueItem(item, targetDateSet, force) {
  return (
    isTargetQueueItem(item, targetDateSet) &&
    typeof item.recipeId === 'number' &&
    (force || !isTerminalNutritionStatus(item.status))
  );
}

function getQueuePendingRecipeIds(items, targetDateSet, force) {
  return [...new Set(
    items
      .filter((item) => isPendingQueueItem(item, targetDateSet, force))
      .map((item) => item.recipeId),
  )];
}

function getSelectedQueueRecipeIds(items, targetDateSet, batchSize, force) {
  return getQueuePendingRecipeIds(items, targetDateSet, force).slice(0, batchSize);
}

function queueItemToMenuRow(item) {
  return {
    $id: item.rowId,
    badgeLabels: item.badgeLabels ?? [],
    badge_labels: JSON.stringify(item.badgeLabels ?? []),
    itemName: item.itemName,
    item_name: item.itemName,
    nutrition_status: item.status,
    recipe_id: item.recipeId,
    snapshot_id: item.snapshotId,
  };
}

function buildQueueItemWithNutrition(item, detail, cache, status, errorMessage) {
  const badgeLabels = item.badgeLabels ?? [];
  const allergenLabels =
    detail?.allergenLabels && detail.allergenLabels.length > 0
      ? detail.allergenLabels
      : badgeLabels.filter(isAllergenBadgeLabel);
  const customizationOptions = detail?.customizationOptions.map((option) =>
    buildOptionWithDetail(option, cache),
  ) ?? [];

  if (status === 'failed') {
    return {
      ...item,
      attempts: (item.attempts ?? 0) + 1,
      error: errorMessage ?? 'Nutrition detail fetch failed',
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...item,
    allergenLabels,
    attempts: (item.attempts ?? 0) + 1,
    calories: detail?.calories ?? null,
    carbsG: detail?.carbsG ?? null,
    customizationOptions,
    error: errorMessage ?? null,
    fatsG: detail?.fatsG ?? null,
    ingredients: detail?.ingredients ?? [],
    itemName: detail?.itemName ?? item.itemName,
    nutritionFacts: detail?.nutritionFacts ?? [],
    proteinG: detail?.proteinG ?? null,
    servingSize: detail?.servingSize ?? null,
    status,
    updatedAt: new Date().toISOString(),
  };
}

function updateQueueItems(items, targetDateSet, selectedRecipeIds, statusByRecipeId, cache, errors) {
  const selectedRecipeIdSet = new Set(selectedRecipeIds);

  return items.map((item) => {
    if (
      !isTargetQueueItem(item, targetDateSet) ||
      !selectedRecipeIdSet.has(item.recipeId)
    ) {
      return item;
    }

    const detailPath = buildRecipeDetailPath(item.recipeId);
    const status = statusByRecipeId.get(item.recipeId) ?? item.status;
    const nutritionError = errors.get(detailPath) ?? null;
    const detail = cache.get(detailPath) ?? null;

    return buildQueueItemWithNutrition(item, detail, cache, status, nutritionError);
  });
}

function getReadySnapshotIds(items, targetDateSet, affectedRecipeIds) {
  const affectedRecipeIdSet = new Set(affectedRecipeIds);
  const itemsBySnapshotId = new Map();
  const affectedSnapshotIds = new Set();

  for (const item of items) {
    if (!isTargetQueueItem(item, targetDateSet)) {
      continue;
    }

    const snapshotItems = itemsBySnapshotId.get(item.snapshotId) ?? [];
    snapshotItems.push(item);
    itemsBySnapshotId.set(item.snapshotId, snapshotItems);

    if (affectedRecipeIdSet.has(item.recipeId)) {
      affectedSnapshotIds.add(item.snapshotId);
    }
  }

  return [...affectedSnapshotIds].filter((snapshotId) => {
    const snapshotItems = itemsBySnapshotId.get(snapshotId) ?? [];

    return (
      snapshotItems.length > 0 &&
      snapshotItems.every((item) => isTerminalNutritionStatus(item.status))
    );
  });
}

async function markQueueSnapshotsReady(tables, snapshotIds) {
  await mapLimit(snapshotIds, ROW_UPDATE_CONCURRENCY, (snapshotId) =>
    tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: 'menu_snapshots',
      rowId: snapshotId,
      data: {
        status: 'ready',
      },
    }),
  );

  return snapshotIds.length;
}

function mapQueueItemToDiningMenuItem(item) {
  return {
    allergenLabels: item.allergenLabels ?? [],
    badgeLabels: item.badgeLabels ?? [],
    calories: item.calories ?? null,
    carbsG: item.carbsG ?? null,
    customizationOptions: item.customizationOptions ?? [],
    fatsG: item.fatsG ?? null,
    fetchedAt: item.fetchedAt ?? item.updatedAt ?? null,
    hallId: item.hallId,
    hallName: item.hallName,
    hallSortOrder: item.hallSortOrder ?? 999,
    ingredients: item.ingredients ?? [],
    itemName: item.itemName,
    itemOrder: item.itemOrder ?? 0,
    mealPeriod: item.mealPeriod,
    nutritionFacts: item.nutritionFacts ?? [],
    proteinG: item.proteinG ?? null,
    recipeId: item.recipeId ?? null,
    serviceDate: item.serviceDate,
    servingSize: item.servingSize ?? null,
    snapshotStatus: isTerminalNutritionStatus(item.status) ? 'ready' : 'processing',
    stationName: item.stationName ?? 'Station',
  };
}

function selectLatestQueueMenuItems(items) {
  const today = getLosAngelesDateOffset(0);
  const latestSnapshots = new Map();

  for (const item of items) {
    if (!item.snapshotId || !item.hallId || !item.mealPeriod || item.serviceDate > today) {
      continue;
    }

    const key = `${item.hallId}:${item.mealPeriod}`;
    const existing = latestSnapshots.get(key);

    if (
      !existing ||
      item.serviceDate > existing.serviceDate ||
      (
        item.serviceDate === existing.serviceDate &&
        (item.fetchedAt ?? '') > (existing.fetchedAt ?? '')
      )
    ) {
      latestSnapshots.set(key, {
        fetchedAt: item.fetchedAt ?? '',
        serviceDate: item.serviceDate,
        snapshotId: item.snapshotId,
      });
    }
  }

  const selectedSnapshotIds = new Set(
    [...latestSnapshots.values()].map((snapshot) => snapshot.snapshotId),
  );

  return items
    .filter((item) => selectedSnapshotIds.has(item.snapshotId))
    .map(mapQueueItemToDiningMenuItem)
    .sort(
      (left, right) =>
        left.hallSortOrder - right.hallSortOrder ||
        left.mealPeriod.localeCompare(right.mealPeriod) ||
        left.itemOrder - right.itemOrder,
    );
}

function buildDiningHallsFromQueue(items) {
  const hallsById = new Map();

  for (const item of items) {
    if (!item.hallId || hallsById.has(item.hallId)) {
      continue;
    }

    hallsById.set(item.hallId, {
      fitPercent: null,
      hours: {
        breakfast: null,
        lunch: null,
        dinner: null,
        lateNight: null,
      },
      id: item.hallId,
      name: item.hallName,
    });
  }

  return [...hallsById.values()];
}

async function buildStorageDiningCacheFromQueue(storage, items) {
  const generatedAt = new Date().toISOString();
  const summary = await readOptionalCacheFile(storage, CACHE_FILES.summary);
  const gymsCurrent = await readOptionalCacheFile(storage, CACHE_FILES.gymsCurrent);
  const diningMenuItems = selectLatestQueueMenuItems(items);
  const diningHalls = summary?.diningHalls?.length
    ? summary.diningHalls
    : buildDiningHallsFromQueue(items);
  const gymCapacities = gymsCurrent?.gymCapacities ?? summary?.gymCapacities ?? [];
  const version = createCacheVersion({ diningMenuItems });
  const diningLatest = {
    diningMenuItems,
    generatedAt,
    version,
  };
  const full = {
    diningHalls,
    diningMenuItems,
    generatedAt,
    gymCapacities,
    version,
  };

  await replaceJsonFile(storage, CACHE_FILES.diningLatest, 'dining-latest.json', diningLatest);
  await replaceJsonFile(storage, CACHE_FILES.full, 'campus-full.json', full);
  const manifest = await updateCacheManifest(
    storage,
    {
      diningLatest: {
        fileId: CACHE_FILES.diningLatest,
        generatedAt,
        version,
      },
      full: {
        fileId: CACHE_FILES.full,
        generatedAt,
        version,
      },
    },
    generatedAt,
  );

  return {
    diningMenuItems: diningMenuItems.length,
    manifestVersion: manifest.version,
    version,
  };
}

export default async ({ req, res, error }) => {
  const body = parseRequestBody(req);
  const targetDates = normalizeTargetDates(body);
  const batchSize = normalizeBatchSize(body.batchSize);
  const force = body.force === true;

  try {
    const services = createServices(req);
    const targetDateSet = new Set(targetDates);
    const queue = await readNutritionQueue(services.storage);
    const pendingRecipeIds = getQueuePendingRecipeIds(queue.items, targetDateSet, force);
    const selectedRecipeIds = getSelectedQueueRecipeIds(
      queue.items,
      targetDateSet,
      batchSize,
      force,
    );

    if (selectedRecipeIds.length === 0) {
      const cacheResult = body.buildCache === true
        ? await buildStorageDiningCacheFromQueue(services.storage, queue.items)
        : null;

      return res.json({
        ok: true,
        batchSize,
        cache: cacheResult,
        complete: pendingRecipeIds.length === 0,
        dates: targetDates,
        pendingRecipeIds: pendingRecipeIds.length,
        processedRecipeIds: 0,
        queueItems: queue.items.length,
        remainingRecipeIds: pendingRecipeIds.length,
        readySnapshots: 0,
        statusCounts: {
          failed: 0,
          ready: 0,
          unavailable: 0,
        },
      });
    }

    const menuRows = queue.items
      .filter((item) =>
        isTargetQueueItem(item, targetDateSet) &&
        selectedRecipeIds.includes(item.recipeId),
      )
      .map(queueItemToMenuRow);
    const cache = new Map();
    const errors = new Map();

    await populateRecipeNutritionCache(cache, errors, selectedRecipeIds);

    const customizationDetailPaths = selectedRecipeIds.flatMap((recipeId) => {
      const detail = cache.get(buildRecipeDetailPath(recipeId));

      return detail?.customizationOptions
        .map((option) => option.detailPath)
        .filter(Boolean) ?? [];
    });

    await populateDetailNutritionCache(cache, errors, customizationDetailPaths);

    const statusCounts = {
      failed: 0,
      ready: 0,
      unavailable: 0,
    };
    const statusByRecipeId = new Map();

    for (const recipeId of selectedRecipeIds) {
      const status = await updateRowsForRecipe(
        services.tables,
        menuRows,
        recipeId,
        cache,
        errors,
      );
      statusByRecipeId.set(recipeId, status);
      statusCounts[status] += 1;
    }
    const nextQueueItems = updateQueueItems(
      queue.items,
      targetDateSet,
      selectedRecipeIds,
      statusByRecipeId,
      cache,
      errors,
    );
    const nextPendingRecipeIds = getQueuePendingRecipeIds(nextQueueItems, targetDateSet, force);
    const shouldBuildCache =
      body.buildCache === true ||
      (
        body.buildCache !== false &&
        nextPendingRecipeIds.length === 0
      );
    const readySnapshotIds = getReadySnapshotIds(
      nextQueueItems,
      targetDateSet,
      selectedRecipeIds,
    );
    const readySnapshots = await markQueueSnapshotsReady(
      services.tables,
      readySnapshotIds,
    );
    const nextQueue = await writeNutritionQueue(services.storage, nextQueueItems);

    let cacheResult = null;
    let cacheError = null;

    if (shouldBuildCache) {
      try {
        cacheResult = await buildStorageDiningCacheFromQueue(
          services.storage,
          nextQueue.items,
        );
      } catch (exception) {
        cacheError = exception?.message ?? String(exception);
        error(`Storage dining cache rebuild failed after nutrition backfill: ${cacheError}`);
      }
    }

    return res.json({
      ok: cacheError === null,
      batchSize,
      cache: cacheResult,
      cacheError,
      complete: nextPendingRecipeIds.length === 0,
      dates: targetDates,
      pendingRecipeIds: pendingRecipeIds.length,
      processedRecipeIds: selectedRecipeIds.length,
      queueItems: nextQueue.items.length,
      queueVersion: nextQueue.version,
      readySnapshots,
      remainingRecipeIds: nextPendingRecipeIds.length,
      statusCounts,
      targetRows: menuRows.length,
    }, cacheError === null ? 200 : 500);
  } catch (exception) {
    error(`Dining nutrition backfill failed: ${exception?.message ?? exception}`);
    return res.json(
      {
        ok: false,
        error: 'Dining nutrition backfill failed',
        detail: exception?.message ?? String(exception),
      },
      500,
    );
  }
};
