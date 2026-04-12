export function formatDurationMinutes(value: number | null | undefined) {
  const safeValue = Math.max(0, Number.isFinite(value ?? NaN) ? Number(value) : 0);
  const totalSeconds = Math.round(safeValue * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  const seconds = digitsOnly.slice(-2).padStart(2, '0');
  const minutesDigits = digitsOnly.slice(0, -2);
  const minutes = minutesDigits ? String(Number.parseInt(minutesDigits, 10)) : '0';

  return `${minutes}:${seconds}`;
}

export function parseDurationMinutesInput(value: string, fallbackMinutes: number) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return fallbackMinutes;
  }

  if (trimmedValue.includes(':')) {
    const [minutesPart, secondsPart = '0'] = trimmedValue.split(':');
    const minutes = Number.parseInt(minutesPart, 10);
    const seconds = Number.parseInt(secondsPart, 10);

    if (
      Number.isFinite(minutes) &&
      Number.isFinite(seconds) &&
      minutes >= 0 &&
      seconds >= 0
    ) {
      return minutes + seconds / 60;
    }

    return null;
  }

  if (/^\d+$/.test(trimmedValue)) {
    return parseDurationMinutesInput(formatDurationInput(trimmedValue), fallbackMinutes);
  }

  const numericValue = Number.parseFloat(trimmedValue);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
}
