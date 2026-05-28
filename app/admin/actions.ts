"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { parseDateTimeLocal } from "@/lib/datetime";
import { HOME_CONTENT_KEY } from "@/lib/site-content";

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
      createdById: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: "Event created." };
}


const updateHomeContentSchema = z.object({
  heroEyebrow: z.string().min(2).max(80),
  heroTitle: z.string().min(3).max(160),
  heroDescription: z.string().min(3).max(2000),
});

export async function updateHomeContentAction(_: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = updateHomeContentSchema.safeParse({
    heroEyebrow: formData.get("heroEyebrow"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
  });

  if (!parsed.success) return { error: "Please enter valid home content." };

  await prisma.siteContent.upsert({
    where: { key: HOME_CONTENT_KEY },
    update: {
      heroEyebrow: parsed.data.heroEyebrow,
      heroTitle: parsed.data.heroTitle,
      heroDescription: parsed.data.heroDescription,
    },
    create: {
      key: HOME_CONTENT_KEY,
      heroEyebrow: parsed.data.heroEyebrow,
      heroTitle: parsed.data.heroTitle,
      heroDescription: parsed.data.heroDescription,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Home content updated." };
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

  const event = await prisma.event.update({
    where: { id: parsed.data.eventId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      startAt,
      endAt,
      status: parsed.data.status,
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

  const event = await prisma.event.update({
    where: { id: parsed.data.eventId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${event.id}`);
  revalidatePath(`/events/${event.slug}`);
}

