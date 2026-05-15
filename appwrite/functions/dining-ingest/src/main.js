import {
  DATABASE_ID,
  buildCampusCache,
  createServices,
} from '../_shared/campus-cache.js';
import { ID, Query } from 'node-appwrite';
import * as cheerio from 'cheerio';

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu';
const UCLA_DINING_TIME_ZONE = 'America/Los_Angeles';
const USER_AGENT = 'BruinGainsDiningIngest/2.0 (+https://sfo.cloud.appwrite.io)';
const FETCH_TIMEOUT_MS = 15000;
const HALL_FETCH_CONCURRENCY = 2;
const MENU_ITEM_BATCH_SIZE = 100;

const PERIOD_CONFIG = [
  { key: 'breakfast', anchorId: 'breakfastmenu', heading: 'BREAKFAST' },
  { key: 'lunch', anchorId: 'lunchmenu', heading: 'LUNCH' },
  { key: 'dinner', anchorId: 'dinnermenu', heading: 'DINNER' },
  { key: 'lateNight', anchorId: 'latenightmenu', heading: 'Late Night' },
];

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

async function listAllRows(tables, tableId, queries = []) {
  const rows = [];
  let offset = 0;

  for (;;) {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries: [...queries, Query.limit(500), Query.offset(offset)],
      total: false,
    });

    rows.push(...result.rows);

    if (result.rows.length < 500) {
      break;
    }

    offset += 500;
  }

  return rows;
}

function getOpenMealPeriodsForHall(hall, selectedMealPeriods) {
  const candidatePeriods = selectedMealPeriods?.length
    ? selectedMealPeriods
    : PERIOD_CONFIG.map((period) => period.key);

  return candidatePeriods.filter((mealPeriod) => {
    if (mealPeriod === 'breakfast') {
      return Boolean(hall.breakfast_hours);
    }

    if (mealPeriod === 'lunch') {
      return Boolean(hall.lunch_hours);
    }

    if (mealPeriod === 'dinner') {
      return Boolean(hall.dinner_hours);
    }

    return Boolean(hall.late_night_hours);
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

async function findExistingSnapshot(tables, hallId, serviceDate, mealPeriod) {
  const result = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: 'menu_snapshots',
    queries: [
      Query.equal('hall_id', hallId),
      Query.equal('service_date', serviceDate),
      Query.equal('meal_period', mealPeriod),
      Query.limit(1),
    ],
  });

  return result.rows[0] ?? null;
}

async function deleteMenuItemsForSnapshot(tables, snapshotId) {
  const rows = await listAllRows(tables, 'menu_items', [
    Query.equal('snapshot_id', snapshotId),
  ]);

  await Promise.all(
    rows.map((row) =>
      tables.deleteRow({
        databaseId: DATABASE_ID,
        tableId: 'menu_items',
        rowId: row.$id,
      }),
    ),
  );
}

async function upsertSnapshot(tables, hall, parsedHall, section, targetDate, fetchedAt) {
  const existing = await findExistingSnapshot(
    tables,
    hall.$id,
    targetDate,
    section.mealPeriod,
  );
  const data = {
    fetched_at: fetchedAt,
    hall_id: hall.$id,
    meal_period: section.mealPeriod,
    service_date: targetDate,
    source_url: parsedHall.sourceUrl,
    status: 'processing',
  };

  if (existing) {
    await deleteMenuItemsForSnapshot(tables, existing.$id);
    await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: 'menu_snapshots',
      rowId: existing.$id,
      data,
    });
    return existing.$id;
  }

  const created = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: 'menu_snapshots',
    rowId: ID.unique(),
    data,
    permissions: [],
  });

  return created.$id;
}

function buildMenuRows(snapshotId, section) {
  return section.items.map((item) => ({
    $id: ID.unique(),
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
    itemCount += menuRows.length;
    snapshotCount += 1;
  }

  return {
    hallId: hall.$id,
    hallName: hall.name,
    itemCount,
    mealPeriods: parsedHall.sections.map((section) => section.mealPeriod),
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

async function loadTargetHalls(tables, hallIds) {
  const rows = await listAllRows(tables, 'dining_halls', [
    Query.equal('is_active', true),
    Query.orderAsc('sort_order'),
  ]);

  if (hallIds?.length) {
    const selectedIds = new Set(hallIds);
    return rows.filter((hall) => selectedIds.has(hall.$id));
  }

  return rows;
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
  const shouldBuildCache = body.buildCache === true;

  try {
    const services = createServices(req);
    const dateResults = [];

    for (const targetDate of targetDates) {
      const targetOptions = {
        ...options,
        targetDate,
      };
      const run = await createRun(services.tables, targetOptions);
      const halls = await loadTargetHalls(services.tables, targetOptions.hallIds);
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
      const itemCount = hallResults.reduce((total, result) => total + result.itemCount, 0);
      const snapshotCount = hallResults.reduce((total, result) => total + result.snapshotCount, 0);
      const summary = {
        errorCount,
        hallResults,
        itemCount,
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
    const cache = ok && shouldBuildCache ? await buildCampusCache(services) : null;

    return res.json(
      {
        cache,
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
