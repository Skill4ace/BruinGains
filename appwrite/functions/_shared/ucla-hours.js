export const UCLA_DINING_HOURS_PATH = '/hours/';

const SOURCE_PATH_TO_HALL_ID = new Map([
  ['/bruin-bowl', 'bruin-bowl'],
  ['/bruin-cafe', 'bruin-cafe'],
  ['/bruin-plate', 'bruin-plate'],
  ['/cafe-1919', 'cafe-1919'],
  ['/de-neve-dining', 'de-neve'],
  ['/epicuria-at-ackerman', 'epicuria-ackerman'],
  ['/epicuria-at-covel', 'epicuria-covel'],
  ['/rendezvous', 'rendezvous'],
  ['/spice-kitchen', 'feast-rieber'],
  ['/the-drey', 'the-drey'],
  ['/the-study-at-hedrick', 'study-hedrick'],
]);

function decodeHtmlEntities(value) {
  return value
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&eacute;|&#233;/g, 'e')
    .replace(/&Eacute;|&#201;/g, 'E');
}

function stripHtml(value) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePath(value) {
  try {
    const url = value.startsWith('http')
      ? new URL(value)
      : new URL(value, 'https://dining.ucla.edu');

    return url.pathname.replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
}

function parseCells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map((match) => match[1]);
}

function parseHallIdFromLocationCell(cellHtml) {
  const href = cellHtml.match(/<a[^>]+href=["']([^"']+)["']/i)?.[1];

  if (href) {
    return SOURCE_PATH_TO_HALL_ID.get(normalizePath(href)) ?? null;
  }

  const label = stripHtml(cellHtml).toLowerCase();

  for (const [sourcePath, hallId] of SOURCE_PATH_TO_HALL_ID) {
    if (label.includes(sourcePath.slice(1).replace(/-/g, ' '))) {
      return hallId;
    }
  }

  return null;
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

export function normalizeUclaHoursValue(value) {
  const cleaned = stripHtml(value);

  if (!cleaned || /^closed$/i.test(cleaned)) {
    return null;
  }

  const parts = cleaned.split(/\s*-\s*/);

  if (parts.length >= 2) {
    const start = normalizeTimeToken(parts[0]);
    const end = normalizeTimeToken(parts.slice(1).join(' - '));

    if (start && end) {
      return `${start} - ${end}`;
    }
  }

  return cleaned;
}

function headerToMealPeriod(header) {
  const normalized = stripHtml(header).toLowerCase();

  if (normalized.includes('breakfast')) {
    return 'breakfast';
  }

  if (normalized.includes('lunch')) {
    return 'lunch';
  }

  if (normalized.includes('extended') || normalized.includes('late')) {
    return 'lateNight';
  }

  if (normalized.includes('dinner')) {
    return 'dinner';
  }

  return null;
}

export function parseUclaDiningHoursPage(html) {
  const tables = [...html.matchAll(/<table[^>]*class=["'][^"']*dining-hours-table[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi)];
  const hoursByHallId = new Map();

  for (const tableMatch of tables) {
    const tableHtml = tableMatch[1];
    const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((match) => parseCells(match[1]))
      .filter((cells) => cells.length > 0);
    const headerCells = rows[0] ?? [];
    const columnMealPeriods = headerCells.map(headerToMealPeriod);

    for (const cells of rows.slice(1)) {
      const hallId = parseHallIdFromLocationCell(cells[0] ?? '');

      if (!hallId) {
        continue;
      }

      const hours = {
        breakfast: null,
        lunch: null,
        dinner: null,
        lateNight: null,
      };

      for (let index = 1; index < cells.length; index += 1) {
        const mealPeriod = columnMealPeriods[index];

        if (!mealPeriod) {
          continue;
        }

        hours[mealPeriod] = normalizeUclaHoursValue(cells[index]);
      }

      hoursByHallId.set(hallId, hours);
    }
  }

  return hoursByHallId;
}

export async function fetchUclaDiningHours(
  fetchText,
  baseUrl = 'https://dining.ucla.edu',
  targetDate = null,
) {
  const url = new URL(UCLA_DINING_HOURS_PATH, baseUrl);

  if (targetDate) {
    url.searchParams.set('date', targetDate);
  }

  const html = await fetchText(url.toString());

  return parseUclaDiningHoursPage(html);
}
