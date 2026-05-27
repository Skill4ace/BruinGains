import { createHash } from 'node:crypto';

import {
  Client,
  ID,
  Query,
  Storage,
  TablesDB,
} from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

export const DATABASE_ID = 'bruingains_campus';
export const CACHE_BUCKET_ID = 'campus-cache';
export const CACHE_FILES = {
  manifest: 'campus-manifest-json',
  summary: 'campus-summary-json',
  full: 'campus-full-json',
  diningLatest: 'dining-latest-json',
  gymsCurrent: 'gyms-current-json',
  nutritionQueue: 'dining-nutrition-queue-json',
};

const PAGE_SIZE = 500;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const USER_REQUEST_LIMIT = 12;
const IP_REQUEST_LIMIT = 60;

export function createServices(req) {
  const endpoint =
    process.env.APPWRITE_FUNCTION_API_ENDPOINT ??
    process.env.APPWRITE_ENDPOINT ??
    'https://sfo.cloud.appwrite.io/v1';
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID ??
    process.env.APPWRITE_PROJECT_ID ??
    '6a067d46002856bc7794';
  const apiKey = req?.headers?.['x-appwrite-key'] ?? process.env.APPWRITE_API_KEY;

  if (!apiKey) {
    throw new Error('Missing Appwrite function API key');
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  return {
    storage: new Storage(client),
    tables: new TablesDB(client),
  };
}

export function parseJson(value, fallback) {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function arrayBufferToText(buffer) {
  return new TextDecoder().decode(buffer);
}

export async function readCacheFile(storage, fileId) {
  const buffer = await storage.getFileView({
    bucketId: CACHE_BUCKET_ID,
    fileId,
  });

  return JSON.parse(arrayBufferToText(buffer));
}

export async function readOptionalCacheFile(storage, fileId, fallback = null) {
  try {
    return await readCacheFile(storage, fileId);
  } catch (error) {
    if (error?.code === 404) {
      return fallback;
    }

    throw error;
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

export function createCacheVersion(payload) {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('base64url');
}

export async function replaceFile(storage, fileId, filename, body) {
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

export async function replaceJsonFile(storage, fileId, filename, payload) {
  await replaceFile(storage, fileId, filename, JSON.stringify(payload));
}

function fileRef(fileId, version, generatedAt) {
  return {
    fileId,
    generatedAt,
    version,
  };
}

export function createCampusManifest({
  diningHalls,
  diningLatest,
  full,
  generatedAt = new Date().toISOString(),
  gymsCurrent,
  summary,
}) {
  const files = {
    summary: fileRef(CACHE_FILES.summary, summary?.version ?? null, summary?.generatedAt ?? generatedAt),
    diningHalls: fileRef(
      CACHE_FILES.summary,
      diningHalls?.version ?? summary?.diningHallsVersion ?? null,
      diningHalls?.generatedAt ?? summary?.generatedAt ?? generatedAt,
    ),
    full: fileRef(CACHE_FILES.full, full?.version ?? null, full?.generatedAt ?? generatedAt),
    diningLatest: fileRef(
      CACHE_FILES.diningLatest,
      diningLatest?.version ?? full?.version ?? null,
      diningLatest?.generatedAt ?? full?.generatedAt ?? generatedAt,
    ),
    gymsCurrent: fileRef(
      CACHE_FILES.gymsCurrent,
      gymsCurrent?.version ?? summary?.version ?? null,
      gymsCurrent?.generatedAt ?? summary?.generatedAt ?? generatedAt,
    ),
  };

  return {
    generatedAt,
    version: createCacheVersion({
      diningLatest: files.diningLatest.version,
      diningHalls: files.diningHalls.version,
      gymsCurrent: files.gymsCurrent.version,
      summary: files.summary.version,
    }),
    files,
  };
}

export async function writeCacheManifest(storage, manifest) {
  await replaceJsonFile(storage, CACHE_FILES.manifest, 'campus-manifest.json', manifest);
  return manifest;
}

export async function updateCacheManifest(storage, updates, generatedAt = new Date().toISOString()) {
  let manifest = await readOptionalCacheFile(storage, CACHE_FILES.manifest);

  if (!manifest) {
    manifest = await buildManifestFromCacheFiles(storage);
  }

  const files = {
    ...manifest.files,
    ...updates,
  };
  const nextManifest = {
    generatedAt,
    version: createCacheVersion({
      diningLatest: files.diningLatest?.version ?? null,
      diningHalls: files.diningHalls?.version ?? null,
      gymsCurrent: files.gymsCurrent?.version ?? null,
      summary: files.summary?.version ?? null,
    }),
    files,
  };

  return writeCacheManifest(storage, nextManifest);
}

export async function buildManifestFromCacheFiles(storage) {
  const generatedAt = new Date().toISOString();
  const full = await readOptionalCacheFile(storage, CACHE_FILES.full);
  const summary = await readOptionalCacheFile(storage, CACHE_FILES.summary) ??
    (full
      ? {
          diningHalls: full.diningHalls ?? [],
          diningMenuItems: [],
          generatedAt: full.generatedAt ?? generatedAt,
          gymCapacities: full.gymCapacities ?? [],
          version: createCacheVersion({
            diningHalls: full.diningHalls ?? [],
            gymCapacities: full.gymCapacities ?? [],
          }),
        }
      : null);
  const diningLatest = await readOptionalCacheFile(storage, CACHE_FILES.diningLatest) ??
    (full
      ? {
          diningMenuItems: full.diningMenuItems ?? [],
          generatedAt: full.generatedAt ?? generatedAt,
          version: full.version ?? createCacheVersion({
            diningMenuItems: full.diningMenuItems ?? [],
          }),
        }
      : null);
  const gymsCurrent = await readOptionalCacheFile(storage, CACHE_FILES.gymsCurrent) ??
    (summary
      ? {
          generatedAt: summary.generatedAt ?? generatedAt,
          gymCapacities: summary.gymCapacities ?? [],
          version: createCacheVersion({
            gymCapacities: summary.gymCapacities ?? [],
          }),
        }
      : null);
  const manifest = createCampusManifest({
    diningHalls: summary
      ? {
          generatedAt: summary.generatedAt ?? generatedAt,
          version: summary.diningHallsVersion ?? createCacheVersion({
            diningHalls: summary.diningHalls ?? [],
          }),
        }
      : null,
    diningLatest,
    full,
    generatedAt,
    gymsCurrent,
    summary,
  });

  return writeCacheManifest(storage, manifest);
}

export async function buildCampusCache({ tables, storage }) {
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
  const diningHallsVersion = createCacheVersion({
    diningHalls,
  });
  const diningVersion = createCacheVersion({
    diningMenuItems,
  });
  const gymsVersion = createCacheVersion({
    gymCapacities,
  });
  const fullVersion = diningVersion;
  const summary = {
    version: summaryVersion,
    diningHallsVersion,
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
  await writeCacheManifest(
    storage,
    createCampusManifest({
      diningHalls: {
        generatedAt,
        version: diningHallsVersion,
      },
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

export async function enforceCampusDataRateLimit(tables, userId, ipAddress) {
  const thresholdIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const userCount = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: 'campus_data_request_log',
    queries: [
      Query.equal('user_id', userId),
      Query.greaterThanEqual('requested_at', thresholdIso),
      Query.limit(1),
    ],
    total: true,
  });

  if ((userCount.total ?? 0) >= USER_REQUEST_LIMIT) {
    return { allowed: false, error: 'Too many requests' };
  }

  if (ipAddress) {
    const ipCount = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: 'campus_data_request_log',
      queries: [
        Query.equal('ip_address', ipAddress),
        Query.greaterThanEqual('requested_at', thresholdIso),
        Query.limit(1),
      ],
      total: true,
    });

    if ((ipCount.total ?? 0) >= IP_REQUEST_LIMIT) {
      return { allowed: false, error: 'Too many requests' };
    }
  }

  await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: 'campus_data_request_log',
    rowId: ID.unique(),
    data: {
      user_id: userId,
      ip_address: ipAddress || null,
      requested_at: new Date().toISOString(),
    },
    permissions: [],
  });

  return { allowed: true };
}
