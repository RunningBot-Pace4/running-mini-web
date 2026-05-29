"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { calculateScore, getScoreSettings } from "@/lib/scoring";
import { isAfterAutoClose, isEventAcceptingResponses } from "@/lib/event-window";

const voteSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["ATTEND", "NOT_ATTEND"]),
});

async function autoCloseEventIfNeeded(event: { id: string; status: string; endAt: Date }) {
  if (event.status === "OPEN" && isAfterAutoClose(event)) {
    await prisma.event.update({
      where: { id: event.id },
      data: { status: "CLOSED" },
    });
    return { ...event, status: "CLOSED" };
  }

  return event;
}

export async function voteAction(formData: FormData) {
  const user = await requireUser();

  const parsed = voteSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  });

  if (!parsed.success) throw new Error("Invalid vote.");

  const rawEvent = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!rawEvent) throw new Error("Event not found.");

  const event = await autoCloseEventIfNeeded(rawEvent);
  if (!isEventAcceptingResponses(event)) throw new Error("Event voting is closed.");

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

  revalidatePath(`/events/${rawEvent.slug}`);
}

const submitSchema = z.object({
  eventId: z.string().min(1),
  activityId: z.string().min(1),
});

const manualDistanceSchema = z.object({
  eventId: z.string().min(1),
  distanceKm: z.coerce.number().positive().max(200),
});

async function getOpenAttendContext(userId: string, eventId: string) {
  const [rawEvent, vote] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.eventVote.findUnique({
      where: { eventId_userId: { eventId, userId } },
    }),
  ]);

  if (!rawEvent) return { error: "Event not found." as const };

  const event = await autoCloseEventIfNeeded(rawEvent);

  if (!isEventAcceptingResponses(event)) {
    return { error: "Event is closed. Voting and run submissions are disabled." as const, event: rawEvent };
  }

  if (!vote || vote.status !== "ATTEND") {
    return { error: "Please vote ATTEND before submitting your distance." as const, event: rawEvent };
  }

  return { event: rawEvent, vote };
}

export async function submitActivityAction(_: unknown, formData: FormData) {
  const user = await requireUser();

  const parsed = submitSchema.safeParse({
    eventId: formData.get("eventId"),
    activityId: formData.get("activityId"),
  });

  if (!parsed.success) return { error: "Choose a valid activity." };

  const context = await getOpenAttendContext(user.id, parsed.data.eventId);
  if ("error" in context) return { error: context.error };

  const activity = await prisma.stravaActivity.findFirst({
    where: { id: parsed.data.activityId, userId: user.id },
  });

  if (!activity) return { error: "Activity not found." };
  if (activity.type === "Manual") return { error: "Please use the manual distance form for manual submissions." };

  if (activity.startDate < context.event.startAt || activity.startDate > context.event.endAt) {
    return { error: "This activity is outside the event date range." };
  }

  const scoreSettings = await getScoreSettings();
  const score = calculateScore(activity.distanceMeters, scoreSettings);

  await prisma.submission.upsert({
    where: {
      eventId_userId_activityId: {
        eventId: context.event.id,
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
      eventId: context.event.id,
      userId: user.id,
      activityId: activity.id,
      distanceKm: score.distanceKm,
      attendancePoints: score.attendancePoints,
      distancePoints: score.distancePoints,
      totalPoints: score.totalPoints,
      status: "APPROVED",
    },
  });

  revalidatePath(`/events/${context.event.slug}`);
  revalidatePath("/account");
  return { success: "Strava run submitted and scored." };
}

export async function submitManualDistanceAction(_: unknown, formData: FormData) {
  const user = await requireUser();

  const parsed = manualDistanceSchema.safeParse({
    eventId: formData.get("eventId"),
    distanceKm: formData.get("distanceKm"),
  });

  if (!parsed.success) return { error: "Please enter a valid distance between 0.01km and 200km." };

  const context = await getOpenAttendContext(user.id, parsed.data.eventId);
  if ("error" in context) return { error: context.error };

  const distanceMeters = Math.round(parsed.data.distanceKm * 1000);
  const scoreSettings = await getScoreSettings();
  const score = calculateScore(distanceMeters, scoreSettings);

  const existingManualSubmission = await prisma.submission.findFirst({
    where: {
      eventId: context.event.id,
      userId: user.id,
      activity: { is: { type: "Manual" } },
    },
    include: { activity: true },
  });

  if (existingManualSubmission) {
    await prisma.$transaction([
      prisma.stravaActivity.update({
        where: { id: existingManualSubmission.activityId },
        data: {
          name: "Manual distance",
          distanceMeters,
          movingTimeSec: 0,
          elapsedTimeSec: 0,
          startDate: new Date(),
          type: "Manual",
          sportType: "Run",
          rawJson: {
            source: "manual",
            distanceKm: parsed.data.distanceKm,
          },
        },
      }),
      prisma.submission.update({
        where: { id: existingManualSubmission.id },
        data: {
          distanceKm: score.distanceKm,
          attendancePoints: score.attendancePoints,
          distancePoints: score.distancePoints,
          totalPoints: score.totalPoints,
          status: "APPROVED",
        },
      }),
    ]);
  } else {
    const manualId = BigInt(`-${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`);

    const manualActivity = await prisma.stravaActivity.create({
      data: {
        userId: user.id,
        stravaId: manualId,
        name: "Manual distance",
        type: "Manual",
        sportType: "Run",
        distanceMeters,
        movingTimeSec: 0,
        elapsedTimeSec: 0,
        startDate: new Date(),
        rawJson: {
          source: "manual",
          distanceKm: parsed.data.distanceKm,
        },
      },
    });

    await prisma.submission.create({
      data: {
        eventId: context.event.id,
        userId: user.id,
        activityId: manualActivity.id,
        distanceKm: score.distanceKm,
        attendancePoints: score.attendancePoints,
        distancePoints: score.distancePoints,
        totalPoints: score.totalPoints,
        status: "APPROVED",
      },
    });
  }

  revalidatePath(`/events/${context.event.slug}`);
  revalidatePath("/account");
  return { success: "Manual distance submitted and scored." };
}
