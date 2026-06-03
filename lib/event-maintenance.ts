import { prisma } from "@/lib/prisma";
import { isAfterAutoClose } from "@/lib/event-window";

type OpenEventTiming = {
  id: string;
  status: string;
  endAt: Date | string;
};

export async function closeExpiredOpenEvents() {
  const openEvents = await prisma.event.findMany({
    where: { status: "OPEN" },
    select: { id: true, endAt: true },
  });

  const expiredEventIds = openEvents
    .filter((event) => isAfterAutoClose({ status: "OPEN", endAt: event.endAt }))
    .map((event) => event.id);

  if (expiredEventIds.length === 0) return 0;

  const result = await prisma.event.updateMany({
    where: { id: { in: expiredEventIds }, status: "OPEN" },
    data: { status: "CLOSED" },
  });

  return result.count;
}

export async function closeExpiredOpenEventIfNeeded<T extends OpenEventTiming>(event: T) {
  if (event.status !== "OPEN" || !isAfterAutoClose(event)) return event;

  await prisma.event.update({
    where: { id: event.id },
    data: { status: "CLOSED" },
  });

  return { ...event, status: "CLOSED" as const };
}
