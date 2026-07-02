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

export function eventAutoCloseAt(event: Pick<EventTiming, "endAt">) {
  return new Date(new Date(event.endAt).getTime() + autoCloseAfterHours() * 60 * 60 * 1000);
}

export function isAfterAutoClose(event: Pick<EventTiming, "endAt">, now = new Date()) {
  return now.getTime() >= eventAutoCloseAt(event).getTime();
}

export function wasManuallyOpenedAfterAutoClose(event: EventTiming) {
  if (!event.manualOpenAt) return false;
  return new Date(event.manualOpenAt).getTime() >= eventAutoCloseAt(event).getTime();
}

export function shouldAutoCloseEvent(event: EventTiming, now = new Date()) {
  return (
    event.status === "OPEN" &&
    isAfterAutoClose(event, now) &&
    !wasManuallyOpenedAfterAutoClose(event)
  );
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
  if (wasManuallyOpenedAfterAutoClose(event)) return true;
  return !isAfterAutoClose(event, now);
}

export function eventDisplayStatus(event: EventTiming, now = new Date()) {
  return statusAfterAutoClose(event.status, event.endAt, now, event.manualOpenAt);
}

export function autoCloseNotice(event: EventTiming) {
  return `Attendance voting and run submissions close automatically ${autoCloseAfterHours()} hours after event end time. Admin can reopen the event manually when members need to key in Event KM.`;
}
