"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/slug";

const createEventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
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

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);

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
