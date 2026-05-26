const { createHash } = require('node:crypto');

const { Client, Query, Storage, TablesDB } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');

const { getAppwriteConfig } = require('./appwrite-env.cjs');
const { CACHE_BUCKET_ID, CACHE_FILES, DATABASE_ID } = require('./schema.cjs');

const PAGE_SIZE = 500;

function createServices() {
  const { endpoint, projectId, apiKey } = getAppwriteConfig();
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return {
    storage: new Storage(client),
    tables: new TablesDB(client),
  };
}

function parseJson(value, fallback) {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

function currentLosAngelesDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function mapDiningHall(row) {
  return {
    id: row.$id,
    name: row.name,
    fitPercent: row.fit_percent ?? null,
    hours: {
      breakfast: row.breakfast_hours ?? null,
      lunch: row.lunch_hours ?? null,
      dinner: row.dinner_hours ?? null,
      lateNight: row.late_night_hours ?? null,
    },
  };
}

function mapGymCapacity(row, locationsById) {
  const location = locationsById.get(row.location_id);

  if (!location) {
    return null;
  }

  return {
    id: row.location_id,
    name: location.name,
    hours: location.hours,
    isClosed: Boolean(row.is_closed),
    load: row.load,
    percent: row.percent_full ?? Math.round(row.load * 100),
    zones: parseJson(row.zone_breakdown, []),
    zoneName: row.zone_name ?? null,
    capturedAt: row.captured_at,
  };
}

function mapMenuItem(row, snapshot, hall) {
  return {
    hallId: snapshot.hall_id,
    hallName: hall.name,
    hallSortOrder: hall.sort_order,
    serviceDate: snapshot.service_date,
    mealPeriod: snapshot.meal_period,
    snapshotStatus: snapshot.status,
    fetchedAt: snapshot.fetched_at,
    recipeId: row.recipe_id ?? null,
    stationName: row.station_name ?? 'Station',
    itemName: row.item_name,
    servingSize: row.serving_size ?? null,
    calories: row.calories ?? null,
    proteinG: row.protein_g ?? null,
    carbsG: row.carbs_g ?? null,
    fatsG: row.fats_g ?? null,
    itemOrder: row.item_order,
    badgeLabels: parseJson(row.badge_labels, []),
    allergenLabels: parseJson(row.allergen_labels, []),
    ingredients: parseJson(row.ingredients, []),
    nutritionFacts: parseJson(row.nutrition_facts, []),
    customizationOptions: parseJson(row.customization_options, []),
  };
}

function selectLatestSnapshots(snapshots) {
  const today = currentLosAngelesDate();
  const latest = new Map();

  for (const snapshot of snapshots) {
    if (!['ready', 'stale'].includes(snapshot.status) || snapshot.service_date > today) {
      continue;
    }

    const key = `${snapshot.hall_id}:${snapshot.meal_period}`;
    const existing = latest.get(key);

    if (
      !existing ||
      snapshot.service_date > existing.service_date ||
      (snapshot.service_date === existing.service_date &&
        snapshot.fetched_at > existing.fetched_at)
    ) {
      latest.set(key, snapshot);
    }
  }

  return [...latest.values()];
}

function createCacheVersion(payload) {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('base64url');
}

async function replaceFile(storage, fileId, filename, body) {
  try {
    await storage.deleteFile({ bucketId: CACHE_BUCKET_ID, fileId });
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }
  }

  await storage.createFile({
    bucketId: CACHE_BUCKET_ID,
    fileId,
    file: InputFile.fromPlainText(body, filename),
    permissions: [],
  });
}

async function replaceJsonFile(storage, fileId, filename, payload) {
  await replaceFile(storage, fileId, filename, JSON.stringify(payload));
}

function fileRef(fileId, version, generatedAt) {
  return {
    fileId,
    generatedAt,
    version,
  };
}

function createCampusManifest({ diningLatest, full, generatedAt, gymsCurrent, summary }) {
  const files = {
    summary: fileRef(CACHE_FILES.summary, summary.version, summary.generatedAt ?? generatedAt),
    full: fileRef(CACHE_FILES.full, full.version, full.generatedAt ?? generatedAt),
    diningLatest: fileRef(
      CACHE_FILES.diningLatest,
      diningLatest.version,
      diningLatest.generatedAt ?? generatedAt,
    ),
    gymsCurrent: fileRef(
      CACHE_FILES.gymsCurrent,
      gymsCurrent.version,
      gymsCurrent.generatedAt ?? generatedAt,
    ),
  };

  return {
    generatedAt,
    version: createCacheVersion({
      diningLatest: files.diningLatest.version,
      gymsCurrent: files.gymsCurrent.version,
      summary: files.summary.version,
    }),
    files,
  };
}

async function buildCampusCache({ tables, storage }) {
  const generatedAt = new Date().toISOString();
  const diningHallRows = await listAllRows(tables, 'dining_halls', [
    Query.equal('is_active', true),
    Query.orderAsc('sort_order'),
  ]);
  const gymLocationRows = await listAllRows(tables, 'gym_locations', [
    Query.equal('is_active', true),
    Query.orderAsc('sort_order'),
  ]);
  const gymRows = await listAllRows(tables, 'gym_capacity_snapshots', [
    Query.orderDesc('captured_at'),
    Query.limit(100),
  ]);
  const snapshotRows = await listAllRows(tables, 'menu_snapshots');

  const diningHalls = diningHallRows.map(mapDiningHall);
  const hallsById = new Map(diningHallRows.map((hall) => [hall.$id, hall]));
  const locationsById = new Map(gymLocationRows.map((location) => [location.$id, location]));
  const latestGymByLocation = new Map();

  for (const row of gymRows) {
    if (!latestGymByLocation.has(row.location_id)) {
      const mapped = mapGymCapacity(row, locationsById);
      if (mapped) {
        latestGymByLocation.set(row.location_id, mapped);
      }
    }
  }

  const latestSnapshots = selectLatestSnapshots(snapshotRows);
  const latestSnapshotIds = latestSnapshots.map((snapshot) => snapshot.$id);
  const menuRows =
    latestSnapshotIds.length > 0
      ? await listAllRows(tables, 'menu_items', [
          Query.equal('snapshot_id', latestSnapshotIds),
          Query.orderAsc('snapshot_id'),
          Query.orderAsc('item_order'),
        ])
      : [];
  const snapshotsById = new Map(latestSnapshots.map((snapshot) => [snapshot.$id, snapshot]));
  const diningMenuItems = menuRows
    .flatMap((row) => {
      const snapshot = snapshotsById.get(row.snapshot_id);
      const hall = snapshot ? hallsById.get(snapshot.hall_id) : null;
      return snapshot && hall ? [mapMenuItem(row, snapshot, hall)] : [];
    })
    .sort(
      (left, right) =>
        left.hallSortOrder - right.hallSortOrder ||
        left.mealPeriod.localeCompare(right.mealPeriod) ||
        left.itemOrder - right.itemOrder,
    );

  const gymCapacities = [...latestGymByLocation.values()];
  const summaryVersion = createCacheVersion({
    diningHalls,
    gymCapacities,
  });
  const diningVersion = createCacheVersion({ diningMenuItems });
  const gymsVersion = createCacheVersion({ gymCapacities });
  const fullVersion = diningVersion;
  const summary = {
    version: summaryVersion,
    generatedAt,
    diningHalls,
    diningMenuItems: [],
    gymCapacities,
  };
  const full = {
    version: fullVersion,
    generatedAt,
    diningHalls,
    diningMenuItems,
    gymCapacities,
  };
  const diningLatest = {
    version: diningVersion,
    generatedAt,
    diningMenuItems,
  };
  const gymsCurrent = {
    version: gymsVersion,
    generatedAt,
    gymCapacities: full.gymCapacities,
  };

  await replaceJsonFile(storage, CACHE_FILES.summary, 'campus-summary.json', summary);
  await replaceJsonFile(storage, CACHE_FILES.full, 'campus-full.json', full);
  await replaceJsonFile(storage, CACHE_FILES.diningLatest, 'dining-latest.json', diningLatest);
  await replaceJsonFile(storage, CACHE_FILES.gymsCurrent, 'gyms-current.json', gymsCurrent);
  await replaceJsonFile(
    storage,
    CACHE_FILES.manifest,
    'campus-manifest.json',
    createCampusManifest({
      diningLatest,
      full,
      generatedAt,
      gymsCurrent,
      summary,
    }),
  );

  return {
    diningHalls: diningHalls.length,
    diningMenuItems: diningMenuItems.length,
    gymCapacities: full.gymCapacities.length,
    version: fullVersion,
  };
}

async function main() {
  const result = await buildCampusCache(createServices());
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  buildCampusCache,
};
