import { createHash } from 'node:crypto';

import {
  CACHE_FILES,
  DATABASE_ID,
  createCacheVersion,
  createServices,
  readOptionalCacheFile,
  replaceJsonFile,
  updateCacheManifest,
} from '../_shared/campus-cache.js';
import { fetchUclaDiningHours } from '../_shared/ucla-hours.js';
import { ID } from 'node-appwrite';
import * as cheerio from 'cheerio';

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu';
const UCLA_DINING_TIME_ZONE = 'America/Los_Angeles';
const USER_AGENT = 'BruinGainsDiningIngest/2.0 (+https://sfo.cloud.appwrite.io)';
const FETCH_TIMEOUT_MS = 15000;
const HALL_FETCH_CONCURRENCY = 2;
const MENU_ITEM_BATCH_SIZE = 100;

const DINING_HALL_DEFAULTS = [
  {
    $id: 'bruin-plate',
    name: 'Bruin Plate',
    sort_order: 1,
    breakfast_hours: '7:00 AM - 9:00 AM',
    lunch_hours: '11:00 AM - 2:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/bruin-plate',
  },
  {
    $id: 'de-neve',
    name: 'De Neve',
    sort_order: 2,
    breakfast_hours: '7:00 AM - 10:00 AM',
    lunch_hours: '11:00 AM - 2:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: '10:00 PM - 12:00 AM',
    source_path: '/de-neve-dining',
  },
  {
    $id: 'epicuria-covel',
    name: 'Epicuria at Covel',
    sort_order: 3,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/epicuria-at-covel',
  },
  {
    $id: 'feast-rieber',
    name: 'Feast at Rieber',
    sort_order: 4,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 2:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: '9:00 PM - 11:00 PM',
    source_path: '/spice-kitchen',
  },
  {
    $id: 'bruin-cafe',
    name: 'Bruin Cafe',
    sort_order: 5,
    breakfast_hours: '7:00 AM - 10:00 AM',
    lunch_hours: '11:00 AM - 4:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/bruin-cafe',
  },
  {
    $id: 'cafe-1919',
    name: 'Cafe 1919',
    sort_order: 6,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 4:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/cafe-1919',
  },
  {
    $id: 'study-hedrick',
    name: 'The Study',
    sort_order: 7,
    breakfast_hours: '7:00 AM - 10:00 AM',
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: '9:00 PM - 12:00 AM',
    source_path: '/the-study-at-hedrick',
  },
  {
    $id: 'the-drey',
    name: 'The Drey',
    sort_order: 8,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/the-drey',
  },
  {
    $id: 'rendezvous',
    name: 'Rendezvous',
    sort_order: 9,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 3:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/rendezvous',
  },
  {
    $id: 'bruin-bowl',
    name: 'Bruin Bowl',
    sort_order: 10,
    breakfast_hours: null,
    lunch_hours: null,
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/bruin-bowl',
  },
  {
    $id: 'epicuria-ackerman',
    name: 'Epicuria at Ackerman',
    sort_order: 11,
    breakfast_hours: null,
    lunch_hours: '11:00 AM - 4:00 PM',
    dinner_hours: '5:00 PM - 9:00 PM',
    late_night_hours: null,
    source_path: '/epicuria-at-ackerman',
  },
];

const PERIOD_CONFIG = [
  { key: 'breakfast', anchorId: 'breakfastmenu', heading: 'BREAKFAST' },
  { key: 'lunch', anchorId: 'lunchmenu', heading: 'LUNCH' },
  { key: 'dinner', anchorId: 'dinnermenu', heading: 'DINNER' },
  { key: 'lateNight', anchorId: 'latenightmenu', heading: 'Late Night' },
];
const DINING_HALL_IDS = new Set(DINING_HALL_DEFAULTS.map((hall) => hall.$id));

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

function getLosAngelesToday() {
  return formatDateInTimeZone(new Date(), UCLA_DINING_TIME_ZONE);
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

function normalizeComparableValue(value) {
  return cleanText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function createDeterministicRowId(prefix, parts) {
  return `${prefix}_${createHash('sha256')
    .update(JSON.stringify(parts))
    .digest('base64url')
    .slice(0, 32)}`;
}

function getHallHours(hall, mealPeriod) {
  const hours = hall.hours ?? {};

  if (mealPeriod === 'breakfast') {
    return hall.breakfast_hours ?? hours.breakfast ?? null;
  }

  if (mealPeriod === 'lunch') {
    return hall.lunch_hours ?? hours.lunch ?? null;
  }

  if (mealPeriod === 'dinner') {
    return hall.dinner_hours ?? hours.dinner ?? null;
  }

  return hall.late_night_hours ?? hours.lateNight ?? null;
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

function extractRecipeIdFromHref(href) {
  if (!href) {
    return null;
  }

  const match = href.match(/[?&]recipe=(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function extractDateLabel(value) {
  if (!value) {
    return null;
  }

  const match = value.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/);
  return match?.[0] ?? null;
}

function isExpectedPageDate(pageDateLabel, targetDate) {
  if (!pageDateLabel) {
    return true;
  }

  const expectedLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: UCLA_DINING_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${targetDate}T12:00:00Z`));

  return pageDateLabel.includes(expectedLabel);
}

function buildHallUrl(sourcePath, targetDate) {
  const normalizedPath = sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`;
  return `${UCLA_DINING_BASE_URL}${normalizedPath.replace(/\/$/, '')}/?date=${targetDate}`;
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

function getOpenMealPeriodsForHall(hall, selectedMealPeriods) {
  const candidatePeriods = selectedMealPeriods?.length
    ? selectedMealPeriods
    : PERIOD_CONFIG.map((period) => period.key);

  return candidatePeriods.filter((mealPeriod) => {
    return Boolean(getHallHours(hall, mealPeriod));
  });
}

function parseRecipeCards($, root, startingOrder = 0) {
  const items = [];
  let itemOrder = startingOrder;

  root.find('section.recipe-card, .recipe-card').each((_, recipeCard) => {
    const itemName = cleanText($(recipeCard).find('.menu-item-title h3').first().text());
    const recipeId = extractRecipeIdFromHref(
      $(recipeCard).find('.recipe-detail-link').attr('href'),
    );

    if (!itemName || recipeId === null) {
      return;
    }

    const stationName = cleanText(
      $(recipeCard).closest('.meal-station').find('.category-heading h2').first().text(),
    ) || 'Station';
    const badgeLabels = $(recipeCard)
      .find('.menu-item-meta-data img')
      .map((__, badgeImage) =>
        normalizeBadgeLabel($(badgeImage).attr('title') ?? $(badgeImage).attr('alt')),
      )
      .get()
      .filter(Boolean);

    items.push({
      badgeLabels: [...new Set(badgeLabels)],
      itemName,
      itemOrder,
      recipeId,
      stationName,
    });
    itemOrder += 1;
  });

  return items;
}

function parseAnchoredMealSections($, selectedMealPeriods) {
  const sections = [];

  for (const period of PERIOD_CONFIG) {
    if (selectedMealPeriods?.length && !selectedMealPeriods.includes(period.key)) {
      continue;
    }

    const anchor = $(`#${period.anchorId}`);

    if (!anchor.length) {
      continue;
    }

    const sectionContainer = anchor.nextAll('div').first();
    const items = parseRecipeCards($, sectionContainer);

    if (items.length > 0) {
      sections.push({
        items,
        mealPeriod: period.key,
      });
    }
  }

  return sections;
}

function parseHeadingFallbackSections($, openMealPeriods, selectedMealPeriods, knownPeriods) {
  const sections = [];
  const knownPeriodSet = new Set(knownPeriods);

  $('.anchor-title-button h2').each((_, headingElement) => {
    const heading = cleanText($(headingElement).text()).toLowerCase();
    const fallbackPeriod = PERIOD_CONFIG.find((period) =>
      heading.includes(period.heading.toLowerCase()),
    )?.key;

    if (!fallbackPeriod || knownPeriodSet.has(fallbackPeriod)) {
      return;
    }

    if (selectedMealPeriods?.length && !selectedMealPeriods.includes(fallbackPeriod)) {
      return;
    }

    if (!selectedMealPeriods?.length && !openMealPeriods.includes(fallbackPeriod)) {
      return;
    }

    const sectionContainer = $(headingElement)
      .closest('.anchor-title-button')
      .nextAll('div')
      .first();
    const items = parseRecipeCards($, sectionContainer);

    if (items.length > 0) {
      sections.push({
        items,
        mealPeriod: fallbackPeriod,
      });
      knownPeriodSet.add(fallbackPeriod);
    }
  });

  return sections;
}

function parseAllDaySections($, hall, openMealPeriods) {
  const allDayAnchor = $('#alldaymenu, #all-day-menu').first();

  if (!allDayAnchor.length) {
    return [];
  }

  const sectionContainer = allDayAnchor.nextAll('div').first();
  const stations = sectionContainer.find('.meal-station');
  const itemsByMealPeriod = new Map(openMealPeriods.map((period) => [period, []]));

  stations.each((_, stationElement) => {
    const station = $(stationElement);
    const stationName = cleanText(station.find('.category-heading h2').first().text()) || 'Station';
    const normalizedStationName = normalizeComparableValue(stationName);
    const stationItems = parseRecipeCards($, station);
    const breakfastPeriods = openMealPeriods.filter((period) => period === 'breakfast');
    const lunchDinnerPeriods = openMealPeriods.filter(
      (period) => period === 'lunch' || period === 'dinner',
    );
    let stationPeriods = openMealPeriods;

    if (hall.$id === 'bruin-cafe' || hall.$id === 'epicuria-ackerman') {
      stationPeriods = normalizedStationName.includes('breakfast')
        ? breakfastPeriods
        : lunchDinnerPeriods;
    }

    if (hall.$id === 'rendezvous') {
      stationPeriods = normalizedStationName.includes('lunch special')
        ? openMealPeriods.filter((period) => period === 'lunch')
        : lunchDinnerPeriods;
    }

    if (hall.$id === 'the-drey') {
      if (normalizedStationName.includes('lunch')) {
        stationPeriods = openMealPeriods.filter((period) => period === 'lunch');
      } else if (normalizedStationName.includes('dinner')) {
        stationPeriods = openMealPeriods.filter((period) => period === 'dinner');
      } else {
        stationPeriods = lunchDinnerPeriods;
      }
    }

    for (const mealPeriod of stationPeriods) {
      const periodItems = itemsByMealPeriod.get(mealPeriod) ?? [];
      periodItems.push(
        ...stationItems.map((item) => ({
          ...item,
          itemOrder: periodItems.length + item.itemOrder,
        })),
      );
      itemsByMealPeriod.set(mealPeriod, periodItems);
    }
  });

  return PERIOD_CONFIG.flatMap((period) => {
    const items = itemsByMealPeriod.get(period.key);
    return items?.length ? [{ items, mealPeriod: period.key }] : [];
  });
}

function parseHallMenuPage(html, hall, targetDate, selectedMealPeriods) {
  const $ = cheerio.load(html);
  const pageDateLabel = extractDateLabel(
    cleanText($('p.at-a-glance-page-title').first().text()),
  );

  if (!isExpectedPageDate(pageDateLabel, targetDate)) {
    throw new Error(
      `Menu page date mismatch for ${hall.$id}: expected ${targetDate}, received ${pageDateLabel ?? 'unknown'}`,
    );
  }

  const openMealPeriods = getOpenMealPeriodsForHall(hall, selectedMealPeriods);
  const anchoredSections = parseAnchoredMealSections($, selectedMealPeriods)
    .filter((section) => openMealPeriods.includes(section.mealPeriod));
  const fallbackSections = parseHeadingFallbackSections(
    $,
    openMealPeriods,
    selectedMealPeriods,
    anchoredSections.map((section) => section.mealPeriod),
  );
  const knownPeriods = new Set(
    [...anchoredSections, ...fallbackSections].map((section) => section.mealPeriod),
  );
  const allDaySections = parseAllDaySections($, hall, openMealPeriods)
    .filter((section) => !knownPeriods.has(section.mealPeriod));

  return {
    hallId: hall.$id,
    hallName: hall.name,
    pageDateLabel,
    sourceUrl: buildHallUrl(hall.source_path ?? hall.$id, targetDate),
    sections: [...anchoredSections, ...fallbackSections, ...allDaySections],
  };
}

async function upsertSnapshot(tables, hall, parsedHall, section, targetDate, fetchedAt) {
  const snapshotId = createDeterministicRowId('ms', [
    hall.$id,
    targetDate,
    section.mealPeriod,
  ]);
  const data = {
    $id: snapshotId,
    fetched_at: fetchedAt,
    hall_id: hall.$id,
    meal_period: section.mealPeriod,
    service_date: targetDate,
    source_url: parsedHall.sourceUrl,
    status: 'processing',
  };

  await tables.upsertRows({
    databaseId: DATABASE_ID,
    tableId: 'menu_snapshots',
    rows: [data],
  });

  return snapshotId;
}

function buildMenuRows(snapshotId, section) {
  return section.items.map((item) => ({
    $id: createDeterministicRowId('mi', [snapshotId, item.itemOrder]),
    allergen_labels: JSON.stringify([]),
    badge_labels: JSON.stringify(item.badgeLabels),
    carbs_g: null,
    calories: null,
    customization_options: JSON.stringify([]),
    fats_g: null,
    ingredients: JSON.stringify([]),
    item_name: item.itemName,
    item_order: item.itemOrder,
    nutrition_error: null,
    nutrition_fetched_at: null,
    nutrition_facts: JSON.stringify([]),
    nutrition_status: item.recipeId === null ? 'unavailable' : 'pending',
    protein_g: null,
    recipe_id: item.recipeId,
    serving_size: null,
    snapshot_id: snapshotId,
    station_name: item.stationName,
  }));
}

function buildNutritionQueueItems(hall, targetDate, section, rows, fetchedAt) {
  return rows
    .map((row) => ({
      allergenLabels: [],
      attempts: 0,
      badgeLabels: JSON.parse(row.badge_labels || '[]'),
      calories: null,
      carbsG: null,
      customizationOptions: [],
      fatsG: null,
      fetchedAt,
      hallId: hall.$id,
      hallName: hall.name,
      hallSortOrder: hall.sort_order ?? 999,
      ingredients: [],
      itemName: row.item_name,
      itemOrder: row.item_order,
      mealPeriod: section.mealPeriod,
      nutritionFacts: [],
      proteinG: null,
      recipeId: row.recipe_id,
      rowId: row.$id,
      serviceDate: targetDate,
      servingSize: null,
      snapshotId: row.snapshot_id,
      status: typeof row.recipe_id === 'number' ? 'pending' : 'unavailable',
      stationName: row.station_name ?? 'Station',
      updatedAt: null,
    }));
}

async function upsertMenuRows(tables, rows) {
  for (let index = 0; index < rows.length; index += MENU_ITEM_BATCH_SIZE) {
    await tables.upsertRows({
      databaseId: DATABASE_ID,
      tableId: 'menu_items',
      rows: rows.slice(index, index + MENU_ITEM_BATCH_SIZE),
    });
  }
}

async function ingestHall(tables, hall, options) {
  const url = buildHallUrl(hall.source_path ?? hall.$id, options.targetDate);
  const html = await fetchHtml(url);
  const parsedHall = parseHallMenuPage(
    html,
    hall,
    options.targetDate,
    options.mealPeriods,
  );
  const fetchedAt = new Date().toISOString();
  let itemCount = 0;
  const nutritionQueueItems = [];
  let snapshotCount = 0;

  for (const section of parsedHall.sections) {
    const snapshotId = await upsertSnapshot(
      tables,
      hall,
      parsedHall,
      section,
      options.targetDate,
      fetchedAt,
    );
    const menuRows = buildMenuRows(snapshotId, section);

    await upsertMenuRows(tables, menuRows);
    nutritionQueueItems.push(
      ...buildNutritionQueueItems(hall, options.targetDate, section, menuRows, fetchedAt),
    );
    itemCount += menuRows.length;
    snapshotCount += 1;
  }

  return {
    hallId: hall.$id,
    hallName: hall.name,
    itemCount,
    mealPeriods: parsedHall.sections.map((section) => section.mealPeriod),
    nutritionQueueItems,
    snapshotCount,
    sourceUrl: parsedHall.sourceUrl,
    status: 'success',
  };
}

async function createRun(tables, options) {
  const now = new Date().toISOString();

  return tables.createRow({
    databaseId: DATABASE_ID,
    tableId: 'dining_ingestion_runs',
    rowId: ID.unique(),
    data: {
      completed_at: null,
      error_count: 0,
      error_message: null,
      hall_count: 0,
      item_count: 0,
      notes: JSON.stringify({ hallIds: options.hallIds ?? null, mealPeriods: options.mealPeriods ?? null }),
      requested_at: now,
      snapshot_count: 0,
      started_at: now,
      status: 'running',
      target_date: options.targetDate,
      trigger_source: options.trigger,
    },
    permissions: [],
  });
}

async function updateRun(tables, runId, summary) {
  await tables.updateRow({
    databaseId: DATABASE_ID,
    tableId: 'dining_ingestion_runs',
    rowId: runId,
    data: {
      completed_at: new Date().toISOString(),
      error_count: summary.errorCount,
      error_message: summary.errorCount > 0 ? 'One or more halls failed to ingest' : null,
      hall_count: summary.hallResults.length,
      item_count: summary.itemCount,
      notes: JSON.stringify({ hallResults: summary.hallResults }),
      snapshot_count: summary.snapshotCount,
      status: summary.status,
    },
  });
}

function normalizeHallForIngest(hall, liveHoursByHallId = new Map()) {
  const hallId = hall.$id ?? hall.id;
  const fallback = DINING_HALL_DEFAULTS.find((candidate) => candidate.$id === hallId);
  const liveHours = liveHoursByHallId.get(hallId);
  const getHours = (mealPeriod, fallbackValue) =>
    liveHours && Object.hasOwn(liveHours, mealPeriod)
      ? liveHours[mealPeriod]
      : getHallHours(hall, mealPeriod) ?? fallbackValue ?? null;

  return {
    $id: hallId,
    name: hall.name ?? fallback?.name ?? hallId,
    sort_order: hall.sort_order ?? fallback?.sort_order ?? 999,
    breakfast_hours: getHours('breakfast', fallback?.breakfast_hours),
    lunch_hours: getHours('lunch', fallback?.lunch_hours),
    dinner_hours: getHours('dinner', fallback?.dinner_hours),
    late_night_hours: getHours('lateNight', fallback?.late_night_hours),
    source_path: hall.source_path ?? fallback?.source_path ?? `/${hallId}`,
  };
}

async function loadTargetHalls(storage, hallIds, liveHoursByHallId = new Map()) {
  const summary = await readOptionalCacheFile(storage, CACHE_FILES.summary);
  const rows = summary?.diningHalls?.length
    ? summary.diningHalls
        .filter((hall) => DINING_HALL_IDS.has(hall.id ?? hall.$id))
        .map((hall) => normalizeHallForIngest(hall, liveHoursByHallId))
    : DINING_HALL_DEFAULTS.map((hall) => normalizeHallForIngest(hall, liveHoursByHallId));

  if (hallIds?.length) {
    const selectedIds = new Set(hallIds);
    return rows.filter((hall) => selectedIds.has(hall.$id));
  }

  return rows.toSorted((left, right) => left.sort_order - right.sort_order);
}

async function updateSummaryHours(storage, halls) {
  const summary = await readOptionalCacheFile(storage, CACHE_FILES.summary);

  if (!summary?.diningHalls?.length) {
    return null;
  }

  const hallsById = new Map(halls.map((hall) => [hall.$id, hall]));
  const diningHalls = summary.diningHalls.map((hall) => {
    const liveHall = hallsById.get(hall.id);

    if (!liveHall) {
      return hall;
    }

    return {
      ...hall,
      hours: {
        breakfast: liveHall.breakfast_hours,
        lunch: liveHall.lunch_hours,
        dinner: liveHall.dinner_hours,
        lateNight: liveHall.late_night_hours,
      },
    };
  });
  const generatedAt = new Date().toISOString();
  const diningHallsVersion = createCacheVersion({ diningHalls });
  const payload = {
    ...summary,
    diningHalls,
    diningHallsVersion,
    generatedAt,
    version: createCacheVersion({
      diningHalls,
      gymCapacities: summary.gymCapacities ?? [],
    }),
  };

  await replaceJsonFile(storage, CACHE_FILES.summary, 'campus-summary.json', payload);
  const manifest = await updateCacheManifest(
    storage,
    {
      diningHalls: {
        fileId: CACHE_FILES.summary,
        generatedAt,
        version: diningHallsVersion,
      },
      summary: {
        fileId: CACHE_FILES.summary,
        generatedAt,
        version: payload.version,
      },
    },
    generatedAt,
  );

  return {
    diningHalls: diningHalls.length,
    diningHallsVersion,
    manifestVersion: manifest.version,
    version: payload.version,
  };
}

async function writeNutritionQueue(storage, targetDates, newItems, options) {
  const existing = await readOptionalCacheFile(
    storage,
    CACHE_FILES.nutritionQueue,
    { items: [] },
  );
  const replacementDates = new Set(targetDates);
  const replacementHallIds = options.hallIds?.length ? new Set(options.hallIds) : null;
  const replacementMealPeriods = options.mealPeriods?.length ? new Set(options.mealPeriods) : null;
  const retainedItems = (existing.items ?? []).filter((item) =>
    !replacementDates.has(item.serviceDate) ||
    (replacementHallIds !== null && !replacementHallIds.has(item.hallId)) ||
    (replacementMealPeriods !== null && !replacementMealPeriods.has(item.mealPeriod)),
  );
  const items = [...retainedItems, ...newItems];
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

  return {
    pendingItems: items.filter((item) => !['ready', 'unavailable'].includes(item.status)).length,
    queuedItems: items.length,
    targetDateItems: newItems.length,
    version: payload.version,
  };
}

function normalizeMealPeriods(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const allowed = new Set(PERIOD_CONFIG.map((period) => period.key));
  const selected = value.filter((entry) => allowed.has(entry));

  return selected.length ? selected : undefined;
}

export default async ({ req, res, error }) => {
  const body = parseRequestBody(req);
  const targetDates =
    Array.isArray(body.targetDates)
      ? body.targetDates.filter((entry) => typeof entry === 'string')
      : typeof body.targetDate === 'string'
        ? [body.targetDate]
        : [getLosAngelesDateOffset(0), getLosAngelesDateOffset(1)];
  const options = {
    hallIds: Array.isArray(body.hallIds)
      ? body.hallIds.filter((entry) => typeof entry === 'string')
      : undefined,
    mealPeriods: normalizeMealPeriods(body.mealPeriods),
    trigger: typeof body.trigger === 'string' ? body.trigger : 'scheduled',
  };

  try {
    const services = createServices(req);
    const dateResults = [];
    const hoursByDate = new Map();
    const nutritionQueueItems = [];
    const getHoursForDate = async (targetDate) => {
      if (hoursByDate.has(targetDate)) {
        return hoursByDate.get(targetDate);
      }

      try {
        const hours = await fetchUclaDiningHours(
          fetchHtml,
          UCLA_DINING_BASE_URL,
          targetDate,
        );
        hoursByDate.set(targetDate, hours);
        return hours;
      } catch (exception) {
        error(`Dining hours sync failed for ${targetDate}: ${exception?.message ?? exception}`);
        hoursByDate.set(targetDate, new Map());
        return hoursByDate.get(targetDate);
      }
    };
    const currentDate = getLosAngelesDateOffset(0);
    const currentHours = await getHoursForDate(currentDate);
    const allCurrentHalls = await loadTargetHalls(
      services.storage,
      undefined,
      currentHours,
    );
    const hoursCache = await updateSummaryHours(services.storage, allCurrentHalls);

    for (const targetDate of targetDates) {
      const targetOptions = {
        ...options,
        targetDate,
      };
      const targetHours = await getHoursForDate(targetDate);
      const run = await createRun(services.tables, targetOptions);
      const halls = await loadTargetHalls(
        services.storage,
        targetOptions.hallIds,
        targetHours,
      );
      const hallResults = await mapLimit(
        halls,
        HALL_FETCH_CONCURRENCY,
        async (hall) => {
          try {
            return await ingestHall(services.tables, hall, targetOptions);
          } catch (exception) {
            error(`Dining ingest failed for ${hall.$id}: ${exception?.message ?? exception}`);
            return {
              error: exception?.message ?? String(exception),
              hallId: hall.$id,
              hallName: hall.name,
              itemCount: 0,
              mealPeriods: [],
              snapshotCount: 0,
              status: 'failure',
            };
          }
        },
      );
      const errorCount = hallResults.filter((result) => result.status === 'failure').length;
      nutritionQueueItems.push(
        ...hallResults.flatMap((result) => result.nutritionQueueItems ?? []),
      );
      const publicHallResults = hallResults.map((result) => {
        const { nutritionQueueItems: _nutritionQueueItems, ...publicResult } = result;

        return publicResult;
      });
      const itemCount = hallResults.reduce((total, result) => total + result.itemCount, 0);
      const snapshotCount = hallResults.reduce((total, result) => total + result.snapshotCount, 0);
      const summary = {
        errorCount,
        hallResults: publicHallResults,
        itemCount,
        nutritionQueueItems: hallResults.reduce(
          (total, result) => total + (result.nutritionQueueItems?.length ?? 0),
          0,
        ),
        snapshotCount,
        status:
          errorCount === 0
            ? 'success'
            : errorCount === hallResults.length
              ? 'failure'
              : 'partial_failure',
        targetDate,
      };

      await updateRun(services.tables, run.$id, summary);
      dateResults.push(summary);
    }

    const nutritionQueue = await writeNutritionQueue(
      services.storage,
      targetDates,
      nutritionQueueItems,
      options,
    );

    const totalFailures = dateResults.filter((result) => result.status === 'failure').length;
    const ok = totalFailures < dateResults.length;
    const summary = {
      dateResults,
      errorCount: dateResults.reduce((total, result) => total + result.errorCount, 0),
      itemCount: dateResults.reduce((total, result) => total + result.itemCount, 0),
      snapshotCount: dateResults.reduce((total, result) => total + result.snapshotCount, 0),
      status:
        totalFailures === 0
          ? 'success'
          : totalFailures === dateResults.length
            ? 'failure'
            : 'partial_failure',
    };
    return res.json(
      {
        cache: hoursCache,
        nutritionQueue,
        ok,
        ...summary,
      },
      ok ? 200 : 500,
    );
  } catch (exception) {
    error(`Dining ingest failed: ${exception?.message ?? exception}`);
    return res.json({ ok: false, error: 'Dining ingest failed' }, 500);
  }
};
