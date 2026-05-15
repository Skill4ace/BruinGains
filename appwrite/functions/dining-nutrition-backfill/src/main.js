import {
  DATABASE_ID,
  buildCampusCache,
  createServices,
  parseJson,
} from '../_shared/campus-cache.js';
import { Query } from 'node-appwrite';
import * as cheerio from 'cheerio';

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu';
const UCLA_DINING_TIME_ZONE = 'America/Los_Angeles';
const USER_AGENT = 'BruinGainsDiningNutritionBackfill/2.0 (+https://sfo.cloud.appwrite.io)';
const FETCH_TIMEOUT_MS = 15000;
const PAGE_SIZE = 500;
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

async function listAllRows(tables, tableId, queries = []) {
  const rows = [];
  let offset = 0;

  for (;;) {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries: [...queries, Query.limit(PAGE_SIZE), Query.offset(offset)],
      total: false,
    });

    rows.push(...result.rows);

    if (result.rows.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
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

function detailFromReadyRow(row) {
  return {
    allergenLabels: parseJson(row.allergen_labels, []),
    calories: row.calories ?? null,
    carbsG: row.carbs_g ?? null,
    customizationOptions: parseJson(row.customization_options, []),
    fatsG: row.fats_g ?? null,
    ingredients: parseJson(row.ingredients, []),
    itemName: row.item_name ?? null,
    nutritionFacts: parseJson(row.nutrition_facts, []),
    proteinG: row.protein_g ?? null,
    servingSize: row.serving_size ?? null,
  };
}

function isReadyNutritionRow(row) {
  const detail = detailFromReadyRow(row);
  return row.nutrition_status === 'ready' || hasNutritionContent(detail);
}

async function hydrateRecipeNutritionCacheFromDatabase(tables, cache, recipeIds) {
  const recipeIdsToLoad = [...new Set(recipeIds)].filter((recipeId) =>
    !cache.has(buildRecipeDetailPath(recipeId)),
  );

  for (let index = 0; index < recipeIdsToLoad.length; index += 50) {
    const chunk = recipeIdsToLoad.slice(index, index + 50);
    const rows = await listAllRows(tables, 'menu_items', [
      Query.equal('recipe_id', chunk),
    ]);

    for (const row of rows) {
      if (typeof row.recipe_id !== 'number') {
        continue;
      }

      const cacheKey = buildRecipeDetailPath(row.recipe_id);

      if (cache.has(cacheKey) || !isReadyNutritionRow(row)) {
        continue;
      }

      cache.set(cacheKey, detailFromReadyRow(row));
    }
  }
}

async function fetchNutritionDetailByPath(detailPath) {
  const normalizedPath = normalizeMenuItemDetailPath(detailPath);
  const html = await fetchHtml(`${UCLA_DINING_BASE_URL}${normalizedPath}`);

  return parseNutritionPage(html);
}

async function populateRecipeNutritionCache(tables, cache, errors, recipeIds) {
  await hydrateRecipeNutritionCacheFromDatabase(tables, cache, recipeIds);

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

async function loadTargetSnapshots(tables, targetDates) {
  const snapshots = await listAllRows(tables, 'menu_snapshots', [
    Query.equal('service_date', targetDates),
  ]);

  return snapshots.filter((snapshot) =>
    ['ready', 'stale', 'processing'].includes(snapshot.status),
  );
}

async function loadMenuRowsForSnapshots(tables, snapshots) {
  const snapshotIds = snapshots.map((snapshot) => snapshot.$id);

  if (snapshotIds.length === 0) {
    return [];
  }

  const rows = [];

  for (let index = 0; index < snapshotIds.length; index += 50) {
    rows.push(
      ...(await listAllRows(tables, 'menu_items', [
        Query.equal('snapshot_id', snapshotIds.slice(index, index + 50)),
        Query.orderAsc('snapshot_id'),
        Query.orderAsc('item_order'),
      ])),
    );
  }

  return rows;
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

function isPendingNutritionRow(row, force) {
  if (typeof row.recipe_id !== 'number') {
    return false;
  }

  if (force) {
    return true;
  }

  return !['ready', 'unavailable'].includes(row.nutrition_status);
}

function sortMenuRowsBySnapshotDate(rows, snapshotsById, targetDates) {
  const dateRank = new Map(targetDates.map((targetDate, index) => [targetDate, index]));

  return rows.toSorted((left, right) => {
    const leftSnapshot = snapshotsById.get(left.snapshot_id);
    const rightSnapshot = snapshotsById.get(right.snapshot_id);
    const leftDateRank = dateRank.get(leftSnapshot?.service_date) ?? Number.MAX_SAFE_INTEGER;
    const rightDateRank = dateRank.get(rightSnapshot?.service_date) ?? Number.MAX_SAFE_INTEGER;

    return (
      leftDateRank - rightDateRank ||
      String(left.snapshot_id).localeCompare(String(right.snapshot_id)) ||
      left.item_order - right.item_order
    );
  });
}

function getSelectedRecipeIds(rows, batchSize) {
  const selected = [];
  const seen = new Set();

  for (const row of rows) {
    if (typeof row.recipe_id !== 'number' || seen.has(row.recipe_id)) {
      continue;
    }

    seen.add(row.recipe_id);
    selected.push(row.recipe_id);

    if (selected.length >= batchSize) {
      break;
    }
  }

  return selected;
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
  const badgeLabels = parseJson(row.badge_labels, []);
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
    item_name: detail?.itemName ?? row.item_name,
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

async function markCompleteSnapshotsReady(tables, snapshots, menuRows, statusByRecipeId) {
  const rowsBySnapshotId = new Map();

  for (const row of menuRows) {
    const rows = rowsBySnapshotId.get(row.snapshot_id) ?? [];

    rows.push(row);
    rowsBySnapshotId.set(row.snapshot_id, rows);
  }

  const completeSnapshots = snapshots.filter((snapshot) => {
    const rows = rowsBySnapshotId.get(snapshot.$id) ?? [];

    return (
      rows.length > 0 &&
      rows.every((row) => {
        if (row.recipe_id === null) {
          return true;
        }

        const status = statusByRecipeId.get(row.recipe_id) ?? row.nutrition_status;

        return ['ready', 'unavailable'].includes(status);
      })
    );
  });

  await mapLimit(
    completeSnapshots.filter((snapshot) => snapshot.status !== 'ready'),
    ROW_UPDATE_CONCURRENCY,
    (snapshot) =>
      tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: 'menu_snapshots',
        rowId: snapshot.$id,
        data: {
          status: 'ready',
        },
      }),
  );

  return completeSnapshots.length;
}

async function markRowsWithoutRecipeUnavailable(tables, rows) {
  const rowsToMark = rows.filter((row) =>
    row.recipe_id === null && row.nutrition_status !== 'unavailable',
  );

  await mapLimit(rowsToMark, ROW_UPDATE_CONCURRENCY, (row) =>
    tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: 'menu_items',
      rowId: row.$id,
      data: {
        nutrition_error: 'No UCLA recipe ID available',
        nutrition_fetched_at: new Date().toISOString(),
        nutrition_status: 'unavailable',
      },
    }),
  );

  return rowsToMark.length;
}

export default async ({ req, res, error }) => {
  const body = parseRequestBody(req);
  const targetDates = normalizeTargetDates(body);
  const batchSize = normalizeBatchSize(body.batchSize);
  const force = body.force === true;

  try {
    const services = createServices(req);
    const snapshots = await loadTargetSnapshots(services.tables, targetDates);
    const snapshotsById = new Map(snapshots.map((snapshot) => [snapshot.$id, snapshot]));
    const menuRows = sortMenuRowsBySnapshotDate(
      await loadMenuRowsForSnapshots(services.tables, snapshots),
      snapshotsById,
      targetDates,
    );
    const markedUnavailable = await markRowsWithoutRecipeUnavailable(services.tables, menuRows);
    const pendingRows = menuRows.filter((row) => isPendingNutritionRow(row, force));
    const pendingRecipeIds = [...new Set(
      pendingRows.map((row) => row.recipe_id).filter((recipeId) => typeof recipeId === 'number'),
    )];
    const selectedRecipeIds = getSelectedRecipeIds(pendingRows, batchSize);
    const shouldBuildCache =
      body.buildCache === true ||
      (
        body.buildCache !== false &&
        selectedRecipeIds.length > 0 &&
        pendingRecipeIds.length <= selectedRecipeIds.length
      );
    const cache = new Map();
    const errors = new Map();

    await populateRecipeNutritionCache(services.tables, cache, errors, selectedRecipeIds);

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
    const readySnapshots = await markCompleteSnapshotsReady(
      services.tables,
      snapshots,
      menuRows,
      statusByRecipeId,
    );

    const cacheResult =
      shouldBuildCache && (selectedRecipeIds.length > 0 || markedUnavailable > 0)
        ? await buildCampusCache(services)
        : null;

    return res.json({
      ok: true,
      batchSize,
      cache: cacheResult,
      complete: pendingRecipeIds.length <= selectedRecipeIds.length,
      dates: targetDates,
      markedUnavailable,
      pendingRecipeIds: pendingRecipeIds.length,
      processedRecipeIds: selectedRecipeIds.length,
      readySnapshots,
      remainingRecipeIds: Math.max(0, pendingRecipeIds.length - selectedRecipeIds.length),
      snapshots: snapshots.length,
      statusCounts,
      targetRows: menuRows.length,
    });
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
