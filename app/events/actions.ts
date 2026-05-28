"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { calculateScore, getScoreSettings } from "@/lib/scoring";

const voteSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["ATTEND", "NOT_ATTEND"]),
});

export async function voteAction(formData: FormData) {
  const user = await requireUser();

  const parsed = voteSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  });

  if (!parsed.success) throw new Error("Invalid vote.");

  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event || event.status !== "OPEN") throw new Error("Event is not open.");

  await prisma.eventVote.upsert({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: user.id,
      },
    },
    update: { status: parsed.data.status },
    create: { eventId: event.id, userId: user.id, status: parsed.data.status },
  });

  revalidatePath(`/events/${event.slug}`);
}

const submitSchema = z.object({
  eventId: z.string().min(1),
  activityId: z.string().min(1),
});

export async function submitActivityAction(_: unknown, formData: FormData) {
  const user = await requireUser();

  const parsed = submitSchema.safeParse({
    eventId: formData.get("eventId"),
    activityId: formData.get("activityId"),
  });

  if (!parsed.success) return { error: "Choose a valid activity." };

  const [event, vote, activity] = await Promise.all([
    prisma.event.findUnique({ where: { id: parsed.data.eventId } }),
    prisma.eventVote.findUnique({
      where: { eventId_userId: { eventId: parsed.data.eventId, userId: user.id } },
    }),
    prisma.stravaActivity.findFirst({
      where: { id: parsed.data.activityId, userId: user.id },
    }),
  ]);

  if (!event || event.status !== "OPEN") return { error: "Event is not open." };
  if (!vote || vote.status !== "ATTEND") return { error: "Please vote ATTEND before submitting." };
  if (!activity) return { error: "Activity not found." };

  if (activity.startDate < event.startAt || activity.startDate > event.endAt) {
    return { error: "This activity is outside the event date range." };
  }

  const scoreSettings = await getScoreSettings();
  const score = calculateScore(activity.distanceMeters, scoreSettings);

  await prisma.submission.upsert({
    where: {
      eventId_userId_activityId: {
        eventId: event.id,
        userId: user.id,
        activityId: activity.id,
      },
    },
    update: {
      distanceKm: score.distanceKm,
      attendancePoints: score.attendancePoints,
      distancePoints: score.distancePoints,
      totalPoints: score.totalPoints,
      status: "APPROVED",
    },
    create: {
      eventId: event.id,
      userId: user.id,
      activityId: activity.id,
      distanceKm: score.distanceKm,
      attendancePoints: score.attendancePoints,
      distancePoints: score.distancePoints,
      totalPoints: score.totalPoints,
      status: "APPROVED",
    },
  });

  revalidatePath(`/events/${event.slug}`);
  return { success: "Run submitted and scored." };
}
