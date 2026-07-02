"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { ACTIVE_REDEMPTION_STATUSES } from "@/lib/redemptions";
import { canAccessTierReward, getMemberTier } from "@/lib/member-progress";

const redeemRewardSchema = z.object({
  rewardId: z.string().min(1),
});

type ActionState = { error?: string; success?: string } | undefined;

function parseStock(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999999) return undefined;
  return parsed;
}

export async function redeemRewardAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = redeemRewardSchema.safeParse({ rewardId: formData.get("rewardId") });
  if (!parsed.success) return { error: "Please choose a valid reward." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reward = await tx.reward.findUnique({ where: { id: parsed.data.rewardId } });
      if (!reward || !reward.isActive) return { error: "This reward is not available anymore." };
      if (reward.stockQuantity !== null && reward.stockQuantity <= 0) return { error: "This reward is out of stock." };

      const [earned, reserved] = await Promise.all([
        tx.submission.aggregate({
          where: { userId: user.id, status: "APPROVED" },
          _sum: { totalPoints: true },
        }),
        tx.redemption.aggregate({
          where: { userId: user.id, status: { in: [...ACTIVE_REDEMPTION_STATUSES] } },
          _sum: { pointsCost: true },
        }),
      ]);

      const totalEarned = earned._sum.totalPoints || 0;
      const spentOrReserved = reserved._sum.pointsCost || 0;
      const availablePoints = totalEarned - spentOrReserved;
      const tier = getMemberTier(totalEarned).current;

      if (!canAccessTierReward(tier.key, reward.minTier)) {
        return { error: `This reward requires ${String(reward.minTier).toLowerCase()} tier or above.` };
      }

      if (availablePoints < reward.costPoints) {
        return { error: `Not enough points. You need ${reward.costPoints} points, but only have ${Math.max(0, availablePoints)} available.` };
      }

      if (reward.stockQuantity !== null) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { stockQuantity: { decrement: 1 } },
        });
      }

      await tx.redemption.create({
        data: {
          userId: user.id,
          rewardId: reward.id,
          pointsCost: reward.costPoints,
          quantity: 1,
          status: "PENDING",
        },
      });

      return { success: "Redemption submitted. Points are reserved while waiting for admin approval." };
    });

    revalidatePath("/redemptions");
    revalidatePath("/account");
    revalidatePath("/badges");
    revalidatePath("/challenges");
    revalidatePath("/admin");
    return result;
  } catch (error) {
    return { error: "Unable to submit redemption. Please try again." };
  }
}

const createRewardSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["ITEM", "VOUCHER"]),
  description: z.string().trim().max(500).optional(),
  costPoints: z.coerce.number().int().min(1).max(100000),
  minTier: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]).default("BRONZE"),
  stockQuantity: z.string().optional(),
  voucherCode: z.string().trim().max(120).optional(),
  isActive: z.coerce.boolean().default(false),
});

export async function createRewardAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = createRewardSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description") || "",
    costPoints: formData.get("costPoints"),
    minTier: formData.get("minTier") || "BRONZE",
    stockQuantity: formData.get("stockQuantity") || "",
    voucherCode: formData.get("voucherCode") || "",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) return { error: "Please enter valid redemption reward details." };

  const stockQuantity = parseStock(parsed.data.stockQuantity);
  if (stockQuantity === undefined) return { error: "Stock must be blank, 0, or a positive whole number." };

  await prisma.reward.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description || null,
      costPoints: parsed.data.costPoints,
      minTier: parsed.data.minTier,
      stockQuantity,
      voucherCode: parsed.data.voucherCode || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/redemptions");
  return { success: "Reward created." };
}

const updateRewardSchema = z.object({
  rewardId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  type: z.enum(["ITEM", "VOUCHER"]),
  description: z.string().trim().max(500).optional(),
  costPoints: z.coerce.number().int().min(1).max(100000),
  minTier: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]).default("BRONZE"),
  stockQuantity: z.string().optional(),
  voucherCode: z.string().trim().max(120).optional(),
  isActive: z.coerce.boolean().default(false),
});

export async function updateRewardAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = updateRewardSchema.safeParse({
    rewardId: formData.get("rewardId"),
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description") || "",
    costPoints: formData.get("costPoints"),
    minTier: formData.get("minTier") || "BRONZE",
    stockQuantity: formData.get("stockQuantity") || "",
    voucherCode: formData.get("voucherCode") || "",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) return { error: "Please enter valid reward details." };

  const stockQuantity = parseStock(parsed.data.stockQuantity);
  if (stockQuantity === undefined) return { error: "Stock must be blank, 0, or a positive whole number." };

  await prisma.reward.update({
    where: { id: parsed.data.rewardId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description || null,
      costPoints: parsed.data.costPoints,
      minTier: parsed.data.minTier,
      stockQuantity,
      voucherCode: parsed.data.voucherCode || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/redemptions");
  return { success: "Reward updated." };
}

const updateRedemptionStatusSchema = z.object({
  redemptionId: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "FULFILLED", "CANCELLED"]),
  adminNote: z.string().trim().max(500).optional(),
});

export async function updateRedemptionStatusAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateRedemptionStatusSchema.safeParse({
    redemptionId: formData.get("redemptionId"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote") || "",
  });

  if (!parsed.success) throw new Error("Invalid redemption update.");

  await prisma.$transaction(async (tx) => {
    const redemption = await tx.redemption.findUnique({
      where: { id: parsed.data.redemptionId },
      include: { reward: true },
    });

    if (!redemption) throw new Error("Redemption not found.");

    const wasReserved = ACTIVE_REDEMPTION_STATUSES.includes(redemption.status as any);
    const willReserve = ACTIVE_REDEMPTION_STATUSES.includes(parsed.data.status as any);

    if (wasReserved && !willReserve && redemption.reward.stockQuantity !== null) {
      await tx.reward.update({
        where: { id: redemption.rewardId },
        data: { stockQuantity: { increment: redemption.quantity } },
      });
    }

    await tx.redemption.update({
      where: { id: redemption.id },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote || null,
        approvedAt: parsed.data.status === "APPROVED" ? new Date() : redemption.approvedAt,
        fulfilledAt: parsed.data.status === "FULFILLED" ? new Date() : redemption.fulfilledAt,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/redemptions");
  revalidatePath("/account");
  revalidatePath("/badges");
  revalidatePath("/challenges");
}
