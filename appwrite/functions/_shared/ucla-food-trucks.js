export const UCLA_FOOD_TRUCKS_PATH = '/meal-swipe-exchange/';

const MEAL_PERIODS = ['breakfast', 'lunch', 'dinner', 'lateNight'];
const MONTH_INDEX = new Map([
  ['jan', 0],
  ['january', 0],
  ['feb', 1],
  ['february', 1],
  ['mar', 2],
  ['march', 2],
  ['apr', 3],
  ['april', 3],
  ['may', 4],
  ['jun', 5],
  ['june', 5],
  ['jul', 6],
  ['july', 6],
  ['aug', 7],
  ['august', 7],
  ['sep', 8],
  ['sept', 8],
  ['september', 8],
  ['oct', 9],
  ['october', 9],
  ['nov', 10],
  ['november', 10],
  ['dec', 11],
  ['december', 11],
]);

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&ndash;|&mdash;/g, '-')
    .replace(/&eacute;|&#233;/g, 'e')
    .replace(/&Eacute;|&#201;/g, 'E');
}

function stripHtml(value) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map((match) => match[1]);
}

function slugify(value) {
  return stripHtml(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeTimeToken(value) {
  const match = value
    .replace(/\s+/g, ' ')
    .trim()
    .match(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/i);

  if (!match) {
    return null;
  }

  return `${Number.parseInt(match[1], 10)}:${match[2] ?? '00'} ${match[3].toUpperCase()}M`;
}

function parseClockMinutes(value) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*([AP])M/i);

  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10) % 12;
  const minute = Number.parseInt(match[2] ?? '00', 10);
  const marker = match[3].toUpperCase();

  return (marker === 'P' ? hour + 12 : hour) * 60 + minute;
}

function normalizeTimeRange(value) {
  const cleaned = stripHtml(value).replace(/[–—]/g, '-');
  const parts = cleaned.split(/\s*-\s*/);

  if (parts.length < 2) {
    return null;
  }

  const start = normalizeTimeToken(parts[0]);
  const end = normalizeTimeToken(parts.slice(1).join(' - '));

  return start && end ? `${start} - ${end}` : cleaned;
}

function mealPeriodForTimeRange(range) {
  const start = parseClockMinutes(range.split(/\s*-\s*/)[0] ?? '');

  return start !== null && start >= 20 * 60 ? 'lateNight' : 'dinner';
}

function mealPeriodSlug(mealPeriod) {
  return mealPeriod === 'lateNight' ? 'late-night' : mealPeriod;
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

function parseScheduleDate(cellHtml, targetDate) {
  const label = stripHtml(cellHtml);
  const match = label.match(/\[([A-Za-z]+)\s+(\d{1,2})\]/);

  if (!match) {
    return null;
  }

  const month = MONTH_INDEX.get(match[1].toLowerCase());

  if (typeof month !== 'number') {
    return null;
  }

  const targetTime = new Date(`${targetDate}T12:00:00Z`).getTime();
  const targetYear = Number.parseInt(targetDate.slice(0, 4), 10);
  const day = Number.parseInt(match[2], 10);
  const candidates = [targetYear - 1, targetYear, targetYear + 1]
    .map((year) => new Date(Date.UTC(year, month, day, 12)))
    .sort((left, right) =>
      Math.abs(left.getTime() - targetTime) - Math.abs(right.getTime() - targetTime),
    );

  return formatDateInTimeZone(candidates[0], 'UTC');
}

function isTruckCellAvailable(value) {
  const cleaned = stripHtml(value);

  return Boolean(cleaned) && !/^closed$/i.test(cleaned);
}

export function parseUclaFoodTruckSchedulePage(html, targetDate) {
  const scheduleStart = html.indexOf('UCLA Food Truck Schedule');
  const scheduleHtml = scheduleStart >= 0 ? html.slice(scheduleStart) : html;
  const sections = [
    ...scheduleHtml.matchAll(
      /<h3[^>]*>([\s\S]*?)<\/h3>\s*<figure[^>]*>\s*<table[^>]*>([\s\S]*?)<\/table>/gi,
    ),
  ];
  const trucks = [];

  sections.forEach((section, sectionIndex) => {
    const locationName = stripHtml(section[1]);
    const tableHtml = section[2];
    const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((match) => parseCells(match[1]))
      .filter((cells) => cells.length > 0);
    const headers = rows[0] ?? [];
    const timeRanges = headers.map((header) => normalizeTimeRange(header));

    rows.slice(1).forEach((cells) => {
      const rowDate = parseScheduleDate(cells[0] ?? '', targetDate);

      if (rowDate !== targetDate) {
        return;
      }

      for (let index = 1; index < cells.length; index += 1) {
        if (!isTruckCellAvailable(cells[index])) {
          continue;
        }

        const hours = timeRanges[index];
        const truckName = stripHtml(cells[index]);

        if (!hours || !truckName) {
          continue;
        }

        const mealPeriod = mealPeriodForTimeRange(hours);
        const periodHours = Object.fromEntries(
          MEAL_PERIODS.map((period) => [
            period,
            period === mealPeriod ? `${hours} • ${locationName}` : null,
          ]),
        );

        trucks.push({
          fitPercent: null,
          hours: periodHours,
          id: `food-truck-${slugify(locationName)}-${mealPeriodSlug(mealPeriod)}`,
          isInteractive: false,
          kind: 'foodTruck',
          locationName,
          name: truckName,
          sortOrder: 1000 + sectionIndex * 10 + index,
          source: 'ucla-meal-swipe-exchange',
        });
      }
    });
  });

  return trucks;
}

export async function fetchUclaFoodTrucks(
  fetchText,
  baseUrl = 'https://dining.ucla.edu',
  targetDate = formatDateInTimeZone(new Date(), 'America/Los_Angeles'),
) {
  const html = await fetchText(`${baseUrl}${UCLA_FOOD_TRUCKS_PATH}`);

  return parseUclaFoodTruckSchedulePage(html, targetDate);
}
