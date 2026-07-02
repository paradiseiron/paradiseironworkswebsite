export const WASHINGTON_TIME_ZONE = "America/New_York";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: WASHINGTON_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: WASHINGTON_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: WASHINGTON_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function asDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatWashingtonDate(value: string | number | Date) {
  return dateFormatter.format(asDate(value));
}

export function formatWashingtonDateTime(value: string | number | Date) {
  return dateTimeFormatter.format(asDate(value));
}

export function getWashingtonDateKey(value: string | number | Date) {
  const parts = dateKeyFormatter.formatToParts(asDate(value));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function formatCalendarDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return formatWashingtonDate(value);

  return `${Number(match[2])}/${Number(match[3])}/${match[1]}`;
}
