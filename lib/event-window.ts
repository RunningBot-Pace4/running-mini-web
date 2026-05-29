export const DEFAULT_AUTO_CLOSE_AFTER_HOURS = 8;

type EventTiming = {
  status: string;
  endAt: Date | string;
};

export function autoCloseAfterHours() {
  const raw = Number(process.env.EVENT_AUTO_CLOSE_AFTER_HOURS || DEFAULT_AUTO_CLOSE_AFTER_HOURS);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_AUTO_CLOSE_AFTER_HOURS;
  return raw;
}

export function eventAutoCloseAt(event: EventTiming) {
  return new Date(new Date(event.endAt).getTime() + autoCloseAfterHours() * 60 * 60 * 1000);
}

export function isAfterAutoClose(event: EventTiming, now = new Date()) {
  return now.getTime() > eventAutoCloseAt(event).getTime();
}

export function isEventAcceptingResponses(event: EventTiming, now = new Date()) {
  return event.status === "OPEN" && !isAfterAutoClose(event, now);
}

export function eventDisplayStatus(event: EventTiming, now = new Date()) {
  if (event.status === "OPEN" && isAfterAutoClose(event, now)) return "CLOSED";
  return event.status;
}

export function autoCloseNotice(event: EventTiming) {
  return `Attendance voting and run submissions close automatically ${autoCloseAfterHours()} hours after event end time (${eventAutoCloseAt(event).toLocaleString("en-GB")}).`;
}
