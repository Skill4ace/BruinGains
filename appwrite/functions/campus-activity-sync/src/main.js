import {
  DATABASE_ID,
  buildCampusCache,
  createServices,
} from '../_shared/campus-cache.js';
import { ID, Query } from 'node-appwrite';

const UCLA_DINING_BASE_URL = 'https://dining.ucla.edu';
const UCLA_DINING_ACTIVITY_PATH = '/wp-content/plugins/activity-meter/activity_ajax.php';
const UCLA_TIME_ZONE = 'America/Los_Angeles';
const GOBOARD_API_BASE_URL =
  'https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount';
const USER_AGENT = 'BruinGainsCampusActivitySync/2.0 (+https://sfo.cloud.appwrite.io)';
const FETCH_TIMEOUT_MS = 15000;
const DINING_FETCH_CONCURRENCY = 3;

const GYM_TARGETS = [
  {
    facilityId: 802,
    facilityName: 'John Wooden Center - FITWELL',
    gymLocationId: 'wooden',
  },
  {
    facilityId: 803,
    facilityName: 'Bruin Fitness Center - FITWELL',
    gymLocationId: 'bfit',
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

function getCurrentDiningActivityPeriod(currentMinutes) {
  if (currentMinutes >= 5 * 60 && currentMinutes < 11 * 60) {
    return 'breakfast';
  }

  if (currentMinutes >= 11 * 60 && currentMinutes < 17 * 60) {
    return 'lunch';
  }

  if (currentMinutes >= 17 * 60 && currentMinutes < 22 * 60) {
    return 'dinner';
  }

  if (currentMinutes >= 22 * 60 && currentMinutes < 24 * 60) {
    return 'lateNight';
  }

  return null;
}

function hasHoursForPeriod(hall, mealPeriod) {
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

async function syncDiningActivity(tables) {
  const diningHallResult = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: 'dining_halls',
    queries: [Query.equal('is_active', true), Query.orderAsc('sort_order')],
  });
  const currentMinutes = getLosAngelesCurrentMinutes();
  const activeMealPeriod = getCurrentDiningActivityPeriod(currentMinutes);
  const syncedAt = new Date().toISOString();

  return mapLimit(diningHallResult.rows, DINING_FETCH_CONCURRENCY, async (hall) => {
    const openNow = activeMealPeriod !== null && hasHoursForPeriod(hall, activeMealPeriod);
    let nextFitPercent = hall.fit_percent ?? null;
    let locationId = null;
    let status = 'updated';

    if (!openNow || !hall.source_path) {
      nextFitPercent = null;
      status = 'cleared';
    } else {
      try {
        const pageHtml = await fetchText(`${UCLA_DINING_BASE_URL}${hall.source_path}/`);
        locationId = parseDiningActivityLocationId(pageHtml);

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
          hallId: hall.$id,
          error: exception instanceof Error ? exception.message : String(exception),
        });
        status = 'preserved_on_error';
      }
    }

    await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: 'dining_halls',
      rowId: hall.$id,
      data: {
        fit_percent: nextFitPercent,
        updated_at: syncedAt,
      },
    });

    return {
      fitPercent: nextFitPercent,
      hallId: hall.$id,
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

    results.push({
      hours: effectiveHours.hours,
      isClosed,
      locationId: target.gymLocationId,
      percent,
      status: 'inserted',
      zoneName: target.facilityName,
    });
  }

  return results;
}

export default async ({ req, res, error }) => {
  const body = parseRequestBody(req);
  const includeDining = body.includeDining ?? true;
  const includeGyms = body.includeGyms ?? true;
  const trigger = body.trigger ?? 'manual';

  try {
    const services = createServices(req);
    const errors = {};
    let dining = [];
    let gyms = [];

    if (includeDining) {
      try {
        dining = await syncDiningActivity(services.tables);
      } catch (exception) {
        error(`Dining activity sync failed: ${exception?.message ?? exception}`);
        errors.dining = 'Dining activity sync failed';
      }
    }

    if (includeGyms) {
      try {
        gyms = await syncGymCapacities(services.tables);
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
      : await buildCampusCache(services);

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
