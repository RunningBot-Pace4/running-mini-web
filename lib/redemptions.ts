import { prisma } from "./prisma";

export const ACTIVE_REDEMPTION_STATUSES = ["PENDING", "APPROVED", "FULFILLED"] as const;

export async function getUserPointWallet(userId: string) {
  const [earned, reserved] = await Promise.all([
    prisma.submission.aggregate({
      where: { userId, status: "APPROVED" },
      _sum: { totalPoints: true },
    }),
    prisma.redemption.aggregate({
      where: { userId, status: { in: [...ACTIVE_REDEMPTION_STATUSES] } },
      _sum: { pointsCost: true },
    }),
  ]);

  const totalEarned = earned._sum.totalPoints || 0;
  const spentOrReserved = reserved._sum.pointsCost || 0;

  return {
    totalEarned,
    spentOrReserved,
    availablePoints: Math.max(0, totalEarned - spentOrReserved),
  };
}

export function redemptionStatusClass(status: string) {
  if (status === "PENDING") return "badge warning";
  if (status === "APPROVED") return "badge success";
  if (status === "FULFILLED") return "badge success";
  if (status === "REJECTED") return "badge danger";
  return "badge";
}
