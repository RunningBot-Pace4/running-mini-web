import { prisma } from "@/lib/prisma";
import { shouldAutoCloseEvent } from "@/lib/event-window";

type OpenEventTiming = {
  id: string;
  status: string;
  endAt: Date | string;
  manualOpenAt?: Date | string | null;
};

export async function closeExpiredOpenEvents() {
  const openEvents = await prisma.event.findMany({
    where: { status: "OPEN" },
    select: { id: true, status: true, endAt: true, manualOpenAt: true },
  });

  const expiredEventIds = openEvents
    .filter((event) => shouldAutoCloseEvent(event))
    .map((event) => event.id);

  if (expiredEventIds.length === 0) return 0;

  const result = await prisma.event.updateMany({
    where: { id: { in: expiredEventIds }, status: "OPEN" },
    data: { status: "CLOSED", manualOpenAt: null },
  });

  return result.count;
}

export async function closeExpiredOpenEventIfNeeded<T extends OpenEventTiming>(event: T) {
  if (!shouldAutoCloseEvent(event)) return event;

  await prisma.event.update({
    where: { id: event.id },
    data: { status: "CLOSED", manualOpenAt: null },
  });

  return { ...event, status: "CLOSED" as const, manualOpenAt: null };
}
