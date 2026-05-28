const DEFAULT_TIME_ZONE = "Asia/Kuala_Lumpur";
const DEFAULT_TIME_ZONE_OFFSET = "+08:00";

export function appTimeZone() {
  return process.env.APP_TIME_ZONE || DEFAULT_TIME_ZONE;
}

export function parseDateTimeLocal(value: string) {
  const trimmed = value.trim();

  // datetime-local inputs submit without timezone, e.g. 2026-01-06T05:30.
  // Interpret it using the configured event timezone offset so hosted servers
  // do not accidentally treat the event time as UTC/local server timezone.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const offset = process.env.EVENT_TIME_ZONE_OFFSET || DEFAULT_TIME_ZONE_OFFSET;
    return new Date(`${trimmed}:00${offset}`);
  }

  return new Date(trimmed);
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: appTimeZone(),
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: appTimeZone(),
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatDateTimeRange(startAt: Date | string, endAt: Date | string) {
  return `${formatDateTime(startAt)} – ${formatDateTime(endAt)}`;
}


export function formatDateTimeLocalInput(value: Date | string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: appTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
