export const DEFAULT_AUTO_CLOSE_AFTER_HOURS = 8;

type EventTiming = {
  status: string;
  endAt: Date | string;
  manualOpenAt?: Date | string | null;
};

export function autoCloseAfterHours() {
  const raw = Number(process.env.EVENT_AUTO_CLOSE_AFTER_HOURS || DEFAULT_AUTO_CLOSE_AFTER_HOURS);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_AUTO_CLOSE_AFTER_HOURS;
  return raw;
}

function addHours(date: Date | string, hours: number) {
  return new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);
}

export function eventAutoCloseAt(event: Pick<EventTiming, "endAt">) {
  return addHours(event.endAt, autoCloseAfterHours());
}

export function eventManualReopenExpiresAt(event: { manualOpenAt: Date | string }) {
  return addHours(event.manualOpenAt, autoCloseAfterHours());
}

export function isAfterAutoClose(event: Pick<EventTiming, "endAt">, now = new Date()) {
  return now.getTime() > eventAutoCloseAt(event).getTime();
}

export function wasManuallyOpenedAfterAutoClose(event: EventTiming) {
  if (!event.manualOpenAt) return false;
  return new Date(event.manualOpenAt).getTime() >= eventAutoCloseAt(event).getTime();
}

export function isManualReopenStillActive(event: EventTiming, now = new Date()) {
  if (!wasManuallyOpenedAfterAutoClose(event) || !event.manualOpenAt) return false;
  return now.getTime() <= eventManualReopenExpiresAt({ manualOpenAt: event.manualOpenAt }).getTime();
}

export function shouldAutoCloseEvent(event: EventTiming, now = new Date()) {
  if (event.status !== "OPEN") return false;
  if (!isAfterAutoClose(event, now)) return false;

  // Admin can reopen an expired event, but the reopen window is temporary.
  // This prevents old events from staying OPEN forever.
  return !isManualReopenStillActive(event, now);
}

export function statusAfterAutoClose<TStatus extends string>(
  status: TStatus,
  endAt: Date | string,
  now = new Date(),
  manualOpenAt?: Date | string | null,
): TStatus | "CLOSED" {
  if (shouldAutoCloseEvent({ status, endAt, manualOpenAt }, now)) return "CLOSED";
  return status;
}

export function isEventAcceptingResponses(event: EventTiming, now = new Date()) {
  if (event.status !== "OPEN") return false;
  if (!isAfterAutoClose(event, now)) return true;
  return isManualReopenStillActive(event, now);
}

export function eventDisplayStatus(event: EventTiming, now = new Date()) {
  return statusAfterAutoClose(event.status, event.endAt, now, event.manualOpenAt);
}

export function autoCloseNotice(_event: EventTiming) {
  return `Attendance voting and run submissions close automatically ${autoCloseAfterHours()} hours after event end time. If admin reopens an expired event, it stays open for another ${autoCloseAfterHours()} hours.`;
}
