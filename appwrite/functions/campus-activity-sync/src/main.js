import {
  CACHE_FILES,
  DATABASE_ID,
  createCacheVersion,
  createServices,
  readOptionalCacheFile,
  replaceJsonFile,
  updateCacheManifest,
} from '../_shared/campus-cache.js';
import { ID } from 'node-appwrite';

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu';
const UCLA_DINING_ACTIVITY_PATH = '/wp-content/plugins/activity-meter/activity_ajax.php';
const UCLA_TIME_ZONE = 'America/Los_Angeles';
const GOBOARD_API_BASE_URL =
  'https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount';
const USER_AGENT = 'BruinGainsCampusActivitySync/2.0 (+https://sfo.cloud.appwrite.io)';
const FETCH_TIMEOUT_MS = 15000;
const DINING_FETCH_CONCURRENCY = 3;

const DINING_ACTIVITY_TARGETS = [
  {
    activityLocationId: '865',
    id: 'bruin-plate',
    name: 'Bruin Plate',
    sortOrder: 1,
    sourcePath: '/bruin-plate',
    hours: {
      breakfast: '7:00 AM - 9:00 AM',
      lunch: '11:00 AM - 2:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
  {
    activityLocationId: '866',
    id: 'de-neve',
    name: 'De Neve',
    sortOrder: 2,
    sourcePath: '/de-neve-dining',
    hours: {
      breakfast: '7:00 AM - 10:00 AM',
      lunch: '11:00 AM - 2:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: '10:00 PM - 12:00 AM',
    },
  },
  {
    activityLocationId: '864',
    id: 'epicuria-covel',
    name: 'Epicuria at Covel',
    sortOrder: 3,
    sourcePath: '/epicuria-at-covel',
    hours: {
      breakfast: null,
      lunch: '11:00 AM - 3:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
  {
    activityLocationId: '872',
    id: 'feast-rieber',
    name: 'Feast at Rieber',
    sortOrder: 4,
    sourcePath: '/spice-kitchen',
    hours: {
      breakfast: null,
      lunch: '11:00 AM - 2:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: '9:00 PM - 11:00 PM',
    },
  },
  {
    activityLocationId: '867',
    id: 'bruin-cafe',
    name: 'Bruin Cafe',
    sortOrder: 5,
    sourcePath: '/bruin-cafe',
    hours: {
      breakfast: '7:00 AM - 10:00 AM',
      lunch: '11:00 AM - 4:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
  {
    activityLocationId: '873',
    id: 'cafe-1919',
    name: 'Cafe 1919',
    sortOrder: 6,
    sourcePath: '/cafe-1919',
    hours: {
      breakfast: null,
      lunch: '11:00 AM - 4:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
  {
    activityLocationId: '871',
    id: 'study-hedrick',
    name: 'The Study',
    sortOrder: 7,
    sourcePath: '/the-study-at-hedrick',
    hours: {
      breakfast: '7:00 AM - 10:00 AM',
      lunch: '11:00 AM - 3:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: '9:00 PM - 12:00 AM',
    },
  },
  {
    activityLocationId: '869',
    id: 'the-drey',
    name: 'The Drey',
    sortOrder: 8,
    sourcePath: '/the-drey',
    hours: {
      breakfast: null,
      lunch: '11:00 AM - 3:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
  {
    activityLocationId: '870',
    id: 'rendezvous',
    name: 'Rendezvous',
    sortOrder: 9,
    sourcePath: '/rendezvous',
    hours: {
      breakfast: null,
      lunch: '11:00 AM - 3:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
  {
    activityLocationId: '868',
    id: 'bruin-bowl',
    name: 'Bruin Bowl',
    sortOrder: 10,
    sourcePath: '/bruin-bowl',
    hours: {
      breakfast: null,
      lunch: null,
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
  {
    activityLocationId: '874',
    id: 'epicuria-ackerman',
    name: 'Epicuria at Ackerman',
    sortOrder: 11,
    sourcePath: '/epicuria-at-ackerman',
    hours: {
      breakfast: null,
      lunch: '11:00 AM - 4:00 PM',
      dinner: '5:00 PM - 9:00 PM',
      lateNight: null,
    },
  },
];

const GYM_TARGETS = [
  {
    facilityId: 802,
    facilityName: 'John Wooden Center - FITWELL',
    gymLocationId: 'wooden',
    name: 'Wooden Center',
  },
  {
    facilityId: 803,
    facilityName: 'Bruin Fitness Center - FITWELL',
    gymLocationId: 'bfit',
    name: 'BFit Gym',
  },
];

const GYM_WEEKLY_HOURS = {
  wooden: {
    Monday: '5:15 AM - 1:00 AM',
    Tuesday: '5:15 AM - 1:00 AM',
    Wednesday: '5:15 AM - 1:00 AM',
    Thursday: '5:15 AM - 1:00 AM',
    Friday: '5:15 AM - 10:00 PM',
    Saturday: '8:00 AM - 8:00 PM',
    Sunday: '8:00 AM - 11:00 PM',
  },
  bfit: {
    Monday: '6:00 AM - 12:00 AM',
    Tuesday: '6:00 AM - 12:00 AM',
    Wednesday: '6:00 AM - 12:00 AM',
    Thursday: '6:00 AM - 12:00 AM',
    Friday: '6:00 AM - 9:00 PM',
    Saturday: '9:00 AM - 6:00 PM',
    Sunday: '9:00 AM - 9:00 PM',
  },
};

function parseRequestBody(req) {
  try {
    return req.bodyJson && typeof req.bodyJson === 'object' ? req.bodyJson : {};
  } catch {
    return {};
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getGoBoardApiUrl() {
  const url = new URL(GOBOARD_API_BASE_URL);
  url.searchParams.set('AccountAPIKey', getRequiredEnv('GOBOARD_API_KEY'));
  return url.toString();
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

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} for ${url}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} for ${url}`);
  }

  return response.json();
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

function getLosAngelesCurrentMinutes() {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: UCLA_TIME_ZONE,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return Number.parseInt(values.hour, 10) * 60 + Number.parseInt(values.minute, 10);
}

function getLosAngelesWeekday() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: UCLA_TIME_ZONE,
    weekday: 'long',
  }).format(new Date());
}

function getPreviousWeekday(weekday) {
  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const currentIndex = weekdays.indexOf(weekday);
  return weekdays[(currentIndex + weekdays.length - 1) % weekdays.length];
}

function parseClockMinutes(value) {
  const match = cleanText(value).match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i);

  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const marker = match[3].toLowerCase();
  let normalizedHour = hour % 12;

  if (marker === 'p') {
    normalizedHour += 12;
  }

  return normalizedHour * 60 + minute;
}

function parseTimeRange(range) {
  const [startValue, endValue] = cleanText(range).split(/\s*-\s*/);

  if (!startValue || !endValue) {
    return null;
  }

  const startMinutes = parseClockMinutes(startValue);
  const endMinutes = parseClockMinutes(endValue);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  return {
    crossesMidnight: startMinutes >= endMinutes,
    endMinutes,
    startMinutes,
  };
}

function getHallId(hall) {
  return hall.id ?? hall.$id;
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

function hasHoursForPeriod(hall, mealPeriod) {
  return Boolean(getHallHours(hall, mealPeriod));
}

function isCurrentTimeInRange(range, currentMinutes) {
  if (!range) {
    return false;
  }

  if (range.crossesMidnight) {
    return currentMinutes >= range.startMinutes || currentMinutes < range.endMinutes;
  }

  return currentMinutes >= range.startMinutes && currentMinutes < range.endMinutes;
}

function getActiveMealPeriodForHall(hall, currentMinutes) {
  for (const mealPeriod of ['breakfast', 'lunch', 'dinner', 'lateNight']) {
    const hours = getHallHours(hall, mealPeriod);

    if (isCurrentTimeInRange(parseTimeRange(hours), currentMinutes)) {
      return mealPeriod;
    }
  }

  return null;
}

function parseDiningActivityLocationId(pageHtml) {
  const candidatePayloads = [pageHtml];

  for (const match of pageHtml.matchAll(
    /<script[^>]+src=["']data:text\/javascript;base64,([A-Za-z0-9+/=]+)["']/g,
  )) {
    try {
      candidatePayloads.push(Buffer.from(match[1], 'base64').toString('utf8'));
    } catch {
      // Ignore malformed embedded scripts and continue scanning.
    }
  }

  for (const payload of candidatePayloads) {
    const locationIdMatch = payload.match(
      /(?:location_id["']?\s*[:=]\s*["']?)(\d+)/i,
    );

    if (locationIdMatch?.[1]) {
      return locationIdMatch[1];
    }
  }

  return null;
}

async function fetchDiningActivityPercent(locationId) {
  const html = await fetchText(
    `${UCLA_DINING_BASE_URL}${UCLA_DINING_ACTIVITY_PATH}?location_id=${locationId}`,
  );
  const match = html.match(/id="activity-level">\s*(\d+)%/i);

  return match ? Number.parseInt(match[1], 10) : null;
}

function clampLoad(value) {
  return Math.max(0, Math.min(1, value));
}

function getGymHoursForWeekday(gymLocationId, weekday) {
  return GYM_WEEKLY_HOURS[gymLocationId]?.[weekday] ?? null;
}

function getEffectiveGymHours(gymLocationId, currentMinutes, weekday) {
  const todaysHours = getGymHoursForWeekday(gymLocationId, weekday);
  const todaysRange = todaysHours ? parseTimeRange(todaysHours) : null;

  if (todaysRange) {
    const isOpenToday = todaysRange.crossesMidnight
      ? currentMinutes >= todaysRange.startMinutes || currentMinutes < todaysRange.endMinutes
      : currentMinutes >= todaysRange.startMinutes && currentMinutes < todaysRange.endMinutes;

    if (isOpenToday) {
      return {
        hours: todaysHours,
        isOpenNow: true,
      };
    }
  }

  const previousHours = getGymHoursForWeekday(gymLocationId, getPreviousWeekday(weekday));
  const previousRange = previousHours ? parseTimeRange(previousHours) : null;

  if (previousRange?.crossesMidnight && currentMinutes < 4 * 60) {
    const isOpenFromPreviousDay =
      previousRange.endMinutes > 0 && currentMinutes < previousRange.endMinutes;

    return {
      hours: isOpenFromPreviousDay ? (previousHours ?? todaysHours ?? 'Closed') : (todaysHours ?? previousHours ?? 'Closed'),
      isOpenNow: isOpenFromPreviousDay,
    };
  }

  return {
    hours: todaysHours ?? 'Closed',
    isOpenNow: false,
  };
}

async function syncDiningActivity(tables, diningHalls) {
  const targetsById = new Map(DINING_ACTIVITY_TARGETS.map((target) => [target.id, target]));
  const currentMinutes = getLosAngelesCurrentMinutes();
  const syncedAt = new Date().toISOString();

  return mapLimit(diningHalls, DINING_FETCH_CONCURRENCY, async (hall) => {
    const hallId = getHallId(hall);
    const target = targetsById.get(hallId);
    const sourcePath = hall.source_path ?? target?.sourcePath ?? null;
    const activeMealPeriod = getActiveMealPeriodForHall(hall, currentMinutes);
    const openNow = activeMealPeriod !== null && hasHoursForPeriod(hall, activeMealPeriod);
    let nextFitPercent = hall.fit_percent ?? null;
    let locationId = target?.activityLocationId ?? null;
    let status = 'updated';

    if (!openNow || (!sourcePath && !locationId)) {
      nextFitPercent = null;
      status = 'cleared';
    } else {
      try {
        if (!locationId) {
          const pageHtml = await fetchText(`${UCLA_DINING_BASE_URL}${sourcePath}/`);
          locationId = parseDiningActivityLocationId(pageHtml);
        }

        if (!locationId) {
          status = 'preserved_on_error';
        } else {
          const fetchedFitPercent = await fetchDiningActivityPercent(locationId);

          if (fetchedFitPercent === null) {
            status = 'preserved_on_error';
          } else {
            nextFitPercent = fetchedFitPercent;
            status = 'updated';
          }
        }
      } catch (exception) {
        console.error('Failed to sync dining activity', {
          hallId,
          error: exception instanceof Error ? exception.message : String(exception),
        });
        status = 'preserved_on_error';
      }
    }

    try {
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: 'dining_halls',
        rowId: hallId,
        data: {
          fit_percent: nextFitPercent,
          updated_at: syncedAt,
        },
      });
    } catch (exception) {
      console.error('Failed to write dining activity row', {
        hallId,
        error: exception instanceof Error ? exception.message : String(exception),
      });
    }

    return {
      fitPercent: nextFitPercent,
      hallId,
      locationId,
      openNow,
      status,
    };
  });
}

function selectGymSourceLocations(locations, target) {
  const facilityMatches = locations.filter((location) =>
    location.FacilityId === target.facilityId ||
    normalizeComparableValue(location.FacilityName) ===
      normalizeComparableValue(target.facilityName),
  );

  if (facilityMatches.length > 0) {
    return facilityMatches;
  }

  return locations.filter((location) =>
    normalizeComparableValue(location.FacilityName).includes(
      normalizeComparableValue(target.facilityName),
    ),
  );
}

function getWeightedGymPercent(locations) {
  const totals = locations.reduce(
    (accumulator, location) => {
      const capacity = Math.max(0, location.TotalCapacity || 0);
      const count = Math.max(0, location.LastCount || 0);

      return {
        capacity: accumulator.capacity + capacity,
        count: accumulator.count + Math.min(count, capacity || count),
      };
    },
    {
      capacity: 0,
      count: 0,
    },
  );

  if (totals.capacity <= 0) {
    return 0;
  }

  return Math.round(clampLoad(totals.count / totals.capacity) * 100);
}

function buildGymZoneBreakdown(locations) {
  return locations
    .map((location) => {
      const capacity = Math.max(0, location.TotalCapacity || 0);
      const count = Math.max(0, location.LastCount || 0);

      return {
        capacity,
        count,
        name: location.LocationName,
        percent:
          capacity > 0 ? Math.round(clampLoad(count / capacity) * 100) : 0,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function syncGymCapacities(tables) {
  const sourceLocations = await fetchJson(getGoBoardApiUrl());
  const capturedAt = new Date().toISOString();
  const currentMinutes = getLosAngelesCurrentMinutes();
  const weekday = getLosAngelesWeekday();
  const results = [];

  for (const target of GYM_TARGETS) {
    const sourceLocationsForGym = selectGymSourceLocations(sourceLocations, target);

    if (!sourceLocationsForGym.length) {
      throw new Error(`Unable to locate gym source rows for ${target.facilityName}`);
    }

    const effectiveHours = getEffectiveGymHours(target.gymLocationId, currentMinutes, weekday);
    const isClosed = !effectiveHours.isOpenNow;
    const percent = isClosed ? 0 : getWeightedGymPercent(sourceLocationsForGym);
    const zoneBreakdown = buildGymZoneBreakdown(sourceLocationsForGym);

    try {
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: 'gym_locations',
        rowId: target.gymLocationId,
        data: {
          hours: effectiveHours.hours,
          updated_at: capturedAt,
        },
      });

      await tables.createRow({
        databaseId: DATABASE_ID,
        tableId: 'gym_capacity_snapshots',
        rowId: ID.unique(),
        data: {
          captured_at: capturedAt,
          is_closed: isClosed,
          load: clampLoad(percent / 100),
          location_id: target.gymLocationId,
          percent_full: percent,
          source: `appwrite-campus-activity-sync:${target.facilityName}`,
          zone_breakdown: JSON.stringify(zoneBreakdown),
          zone_name: target.facilityName,
        },
        permissions: [],
      });
    } catch (exception) {
      console.error('Failed to write gym capacity rows', {
        gymLocationId: target.gymLocationId,
        error: exception instanceof Error ? exception.message : String(exception),
      });
    }

    results.push({
      capturedAt,
      hours: effectiveHours.hours,
      id: target.gymLocationId,
      isClosed,
      load: clampLoad(percent / 100),
      locationId: target.gymLocationId,
      name: target.name,
      percent,
      status: 'inserted',
      zoneBreakdown,
      zoneName: target.facilityName,
      zones: zoneBreakdown,
    });
  }

  return results;
}

function buildFallbackDiningHalls() {
  return DINING_ACTIVITY_TARGETS
    .toSorted((left, right) => left.sortOrder - right.sortOrder)
    .map((target) => ({
      fitPercent: null,
      hours: target.hours,
      id: target.id,
      name: target.name,
    }));
}

async function readCampusSummary(storage) {
  const summary = await readOptionalCacheFile(storage, CACHE_FILES.summary);

  if (summary) {
    return summary;
  }

  const full = await readOptionalCacheFile(storage, CACHE_FILES.full);

  if (full) {
    return {
      diningHalls: full.diningHalls ?? [],
      diningMenuItems: [],
      generatedAt: full.generatedAt,
      gymCapacities: full.gymCapacities ?? [],
      version: full.version,
    };
  }

  return {
    diningHalls: buildFallbackDiningHalls(),
    diningMenuItems: [],
    generatedAt: new Date().toISOString(),
    gymCapacities: [],
    version: null,
  };
}

function mergeDiningActivity(diningHalls, diningResults) {
  const resultsByHallId = new Map(diningResults.map((result) => [result.hallId, result]));

  return diningHalls.map((hall) => {
    const hallId = getHallId(hall);
    const result = resultsByHallId.get(hallId);

    if (!result) {
      return hall;
    }

    return {
      ...hall,
      fitPercent: result.fitPercent,
    };
  });
}

async function writeActivityCache(storage, summary, gymCapacities, wroteGyms) {
  const generatedAt = new Date().toISOString();
  const nextSummary = {
    diningHalls: summary.diningHalls ?? [],
    diningMenuItems: [],
    generatedAt,
    gymCapacities,
    version: createCacheVersion({
      diningHalls: summary.diningHalls ?? [],
      gymCapacities,
    }),
  };
  const updates = {
    summary: {
      fileId: CACHE_FILES.summary,
      generatedAt,
      version: nextSummary.version,
    },
  };
  let gymsCurrent = null;

  await replaceJsonFile(storage, CACHE_FILES.summary, 'campus-summary.json', nextSummary);

  if (wroteGyms) {
    gymsCurrent = {
      generatedAt,
      gymCapacities,
      version: createCacheVersion({ gymCapacities }),
    };
    updates.gymsCurrent = {
      fileId: CACHE_FILES.gymsCurrent,
      generatedAt,
      version: gymsCurrent.version,
    };
    await replaceJsonFile(storage, CACHE_FILES.gymsCurrent, 'gyms-current.json', gymsCurrent);
  }

  const manifest = await updateCacheManifest(storage, updates, generatedAt);

  return {
    gymCapacities: gymCapacities.length,
    manifestVersion: manifest.version,
    summaryVersion: nextSummary.version,
    gymsVersion: gymsCurrent?.version ?? manifest.files?.gymsCurrent?.version ?? null,
  };
}

export default async ({ req, res, error }) => {
  const body = parseRequestBody(req);
  const includeDining = body.includeDining ?? true;
  const includeGyms = body.includeGyms ?? true;
  const trigger = body.trigger ?? 'manual';

  try {
    const services = createServices(req);
    const currentSummary = await readCampusSummary(services.storage);
    let nextSummary = {
      ...currentSummary,
      diningHalls: currentSummary.diningHalls?.length
        ? currentSummary.diningHalls
        : buildFallbackDiningHalls(),
      gymCapacities: currentSummary.gymCapacities ?? [],
    };
    const errors = {};
    let dining = [];
    let gyms = [];
    let wroteGyms = false;

    if (includeDining) {
      try {
        dining = await syncDiningActivity(services.tables, nextSummary.diningHalls);
        nextSummary = {
          ...nextSummary,
          diningHalls: mergeDiningActivity(nextSummary.diningHalls, dining),
        };
      } catch (exception) {
        error(`Dining activity sync failed: ${exception?.message ?? exception}`);
        errors.dining = 'Dining activity sync failed';
      }
    }

    if (includeGyms) {
      try {
        gyms = await syncGymCapacities(services.tables);
        nextSummary = {
          ...nextSummary,
          gymCapacities: gyms.map((gym) => ({
            capturedAt: gym.capturedAt,
            hours: gym.hours,
            id: gym.id,
            isClosed: gym.isClosed,
            load: gym.load,
            name: gym.name,
            percent: gym.percent,
            zoneName: gym.zoneName,
            zones: gym.zones,
          })),
        };
        wroteGyms = true;
      } catch (exception) {
        error(`Gym capacity sync failed: ${exception?.message ?? exception}`);
        errors.gyms = 'Gym capacity sync failed';
      }
    }

    const requestedSyncCount = Number(includeDining) + Number(includeGyms);
    const errorCount = Number(Boolean(errors.dining)) + Number(Boolean(errors.gyms));
    const status =
      errorCount === 0
        ? 'success'
        : errorCount === requestedSyncCount
          ? 'failure'
          : 'partial_failure';
    const cache = status === 'failure'
      ? null
      : await writeActivityCache(
          services.storage,
          nextSummary,
          nextSummary.gymCapacities,
          wroteGyms,
        );

    return res.json(
      {
        cache,
        dining,
        errors: Object.keys(errors).length ? errors : undefined,
        gyms,
        status,
        trigger,
      },
      status === 'failure' ? 500 : 200,
    );
  } catch (exception) {
    error(`Campus activity sync failed: ${exception?.message ?? exception}`);

    return res.json(
      {
        error: 'Campus activity sync failed',
        trigger,
      },
      500,
    );
  }
};
