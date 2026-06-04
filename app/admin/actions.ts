"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { parseDateTimeLocal } from "@/lib/datetime";
import { HOME_CONTENT_KEY } from "@/lib/site-content";
import { getThemePreset, isThemePresetKey } from "@/lib/theme-presets";
import { SCORE_SETTING_KEY } from "@/lib/score-config";
import { calculateScore, getScoreSettings } from "@/lib/scoring";

const createEventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]).default("OPEN"),
});

export async function createEventAction(_: unknown, formData: FormData) {
  const admin = await requireAdmin();

  const parsed = createEventSchema.safeParse({
    title: formData.get("title"),
    description: String(formData.get("description") || ""),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    status: formData.get("status") || "OPEN",
  });

  if (!parsed.success) return { error: "Please enter valid event details." };

  const startAt = parseDateTimeLocal(parsed.data.startAt);
  const endAt = parseDateTimeLocal(parsed.data.endAt);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
    return { error: "End date must be after start date." };
  }

  const now = new Date();
  const manualOpenAt = parsed.data.status === "OPEN" ? now : null;

  const baseSlug = slugify(parsed.data.title);
  let slug = baseSlug;
  let counter = 2;

  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  await prisma.event.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      startAt,
      endAt,
      status: parsed.data.status,
      manualOpenAt,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: "Event created." };
}


const updateHomeContentSchema = z.object({
  brandName: z.string().min(2).max(40),
  brandMark: z.string().min(1).max(4),
  logoImageDataUrl: z.string().max(800000).optional(),
  removeLogoImage: z.coerce.boolean().default(false),
  themePreset: z.string().refine(isThemePresetKey, "Please choose one of the fixed themes."),
  heroEyebrow: z.string().min(2).max(80),
  heroTitle: z.string().min(3).max(180),
  heroDescription: z.string().min(3).max(3000),
});

export async function updateHomeContentAction(_: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = updateHomeContentSchema.safeParse({
    brandName: formData.get("brandName"),
    brandMark: formData.get("brandMark"),
    logoImageDataUrl: String(formData.get("logoImageDataUrl") || ""),
    removeLogoImage: formData.get("removeLogoImage") === "on",
    themePreset: formData.get("themePreset"),
    heroEyebrow: formData.get("heroEyebrow"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
  });

  if (!parsed.success) return { error: "Please enter valid home content. Choose one of the 10 themes and use a small PNG/JPG/WebP logo under about 500KB." };

  const selectedTheme = getThemePreset(parsed.data.themePreset);
  const logoImageDataUrl = parsed.data.removeLogoImage
    ? null
    : parsed.data.logoImageDataUrl || null;

  await prisma.siteContent.upsert({
    where: { key: HOME_CONTENT_KEY },
    update: {
      brandName: parsed.data.brandName,
      brandMark: parsed.data.brandMark,
      logoImageDataUrl,
      themePreset: selectedTheme.key,
      themePrimary: selectedTheme.primary,
      themeSecondary: selectedTheme.secondary,
      themeBackground: selectedTheme.background,
      themeDark: selectedTheme.dark,
      heroEyebrow: parsed.data.heroEyebrow,
      heroTitle: parsed.data.heroTitle,
      heroDescription: parsed.data.heroDescription,
    },
    create: {
      key: HOME_CONTENT_KEY,
      brandName: parsed.data.brandName,
      brandMark: parsed.data.brandMark,
      logoImageDataUrl,
      themePreset: selectedTheme.key,
      themePrimary: selectedTheme.primary,
      themeSecondary: selectedTheme.secondary,
      themeBackground: selectedTheme.background,
      themeDark: selectedTheme.dark,
      heroEyebrow: parsed.data.heroEyebrow,
      heroTitle: parsed.data.heroTitle,
      heroDescription: parsed.data.heroDescription,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Home content updated." };
}


const updateScoreSettingsSchema = z.object({
  attendancePoints: z.coerce.number().int().min(0).max(100),
  perKmPoints: z.coerce.number().int().min(0).max(100),
  requireSubmissionApproval: z.coerce.boolean().default(false),
});

export async function updateScoreSettingsAction(_: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = updateScoreSettingsSchema.safeParse({
    attendancePoints: formData.get("attendancePoints"),
    perKmPoints: formData.get("perKmPoints"),
    requireSubmissionApproval: formData.get("requireSubmissionApproval") === "on",
  });

  if (!parsed.success) return { error: "Please enter valid scoring values from 0 to 100." };

  await prisma.scoreSetting.upsert({
    where: { key: SCORE_SETTING_KEY },
    update: {
      attendancePoints: parsed.data.attendancePoints,
      perKmPoints: parsed.data.perKmPoints,
      requireSubmissionApproval: parsed.data.requireSubmissionApproval,
    },
    create: {
      key: SCORE_SETTING_KEY,
      attendancePoints: parsed.data.attendancePoints,
      perKmPoints: parsed.data.perKmPoints,
      requireSubmissionApproval: parsed.data.requireSubmissionApproval,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/events/[slug]", "page");
  return { success: "Scoring rules updated." };
}


const updateEventDetailsSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]),
});

export async function updateEventDetailsAction(_: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = updateEventDetailsSchema.safeParse({
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    description: String(formData.get("description") || ""),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Please enter valid event details." };

  const startAt = parseDateTimeLocal(parsed.data.startAt);
  const endAt = parseDateTimeLocal(parsed.data.endAt);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
    return { error: "End date must be after start date." };
  }

  const manualOpenAt = parsed.data.status === "OPEN" ? new Date() : null;

  const event = await prisma.event.update({
    where: { id: parsed.data.eventId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      startAt,
      endAt,
      status: parsed.data.status,
      manualOpenAt,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${event.id}`);
  revalidatePath(`/events/${event.slug}`);
  return { success: "Event updated." };
}


const updateEventStatusSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]),
});

export async function updateEventStatusAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateEventStatusSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  });

  if (!parsed.success) throw new Error("Invalid event status.");

  const currentEvent = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    select: { id: true, slug: true, endAt: true },
  });

  if (!currentEvent) throw new Error("Event not found.");

  const event = await prisma.event.update({
    where: { id: parsed.data.eventId },
    data: {
      status: parsed.data.status,
      manualOpenAt: parsed.data.status === "OPEN" ? new Date() : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${event.id}`);
  revalidatePath(`/events/${currentEvent.slug}`);
}



const updateSubmissionStatusSchema = z.object({
  submissionId: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export async function updateSubmissionStatusAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateSubmissionStatusSchema.safeParse({
    submissionId: formData.get("submissionId"),
    status: formData.get("status"),
  });

  if (!parsed.success) throw new Error("Invalid submission status.");

  const submission = await prisma.submission.findUnique({
    where: { id: parsed.data.submissionId },
    include: { activity: true, event: true },
  });

  if (!submission) throw new Error("Submission not found.");

  if (parsed.data.status === "APPROVED") {
    const scoreSettings = await getScoreSettings();
    const score = calculateScore(submission.activity.distanceMeters, scoreSettings);

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        distanceKm: score.distanceKm,
        attendancePoints: score.attendancePoints,
        distancePoints: score.distancePoints,
        totalPoints: score.totalPoints,
        status: "APPROVED",
      },
    });
  } else {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: parsed.data.status },
    });
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${submission.eventId}`);
  revalidatePath(`/events/${submission.event.slug}`);
}
