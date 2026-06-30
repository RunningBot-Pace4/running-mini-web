import { prisma } from "@/lib/prisma";

export type TierKey = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type MemberTier = {
  key: TierKey;
  name: string;
  emoji: string;
  minPoints: number;
  color: string;
  benefit: string;
  discount: string;
};

export const DEFAULT_MEMBER_TIERS: MemberTier[] = [
  {
    key: "BRONZE",
    name: "Bronze",
    emoji: "🥉",
    minPoints: 0,
    color: "#B87333",
    benefit: "Access starter rewards, community badges and member-only event tracking.",
    discount: "Basic club rewards",
  },
  {
    key: "SILVER",
    name: "Silver",
    emoji: "🥈",
    minPoints: 100,
    color: "#94A3B8",
    benefit: "Unlock selected vouchers, better reward access and Silver recognition.",
    discount: "Small discount / voucher perks",
  },
  {
    key: "GOLD",
    name: "Gold",
    emoji: "🥇",
    minPoints: 250,
    color: "#F59E0B",
    benefit: "Unlock premium vouchers, priority reward access and event perk eligibility.",
    discount: "Better partner discounts / vouchers",
  },
  {
    key: "PLATINUM",
    name: "Platinum",
    emoji: "💎",
    minPoints: 500,
    color: "#7C3AED",
    benefit: "Unlock exclusive items, VIP recognition and first access to limited campaigns.",
    discount: "Best discounts / exclusive vouchers",
  },
];

// Backward-compatible export used by existing pages/components.
export const MEMBER_TIERS = DEFAULT_MEMBER_TIERS;

export async function getTierDefinitions(): Promise<MemberTier[]> {
  try {
    const rows = await prisma.tierBenefit.findMany({ orderBy: { minPoints: "asc" } });
    if (rows.length === 0) return DEFAULT_MEMBER_TIERS;

    return DEFAULT_MEMBER_TIERS.map((fallback) => {
      const saved = rows.find((row) => row.tier === fallback.key);
      return saved
        ? {
            ...fallback,
            minPoints: saved.minPoints,
            benefit: saved.benefit,
            discount: saved.discount,
          }
        : fallback;
    }).sort((a, b) => a.minPoints - b.minPoints);
  } catch {
    // This keeps old deployments alive before prisma db push creates the table.
    return DEFAULT_MEMBER_TIERS;
  }
}

export function tierRank(tier: string | null | undefined) {
  const index = DEFAULT_MEMBER_TIERS.findIndex((item) => item.key === tier);
  return index < 0 ? 0 : index;
}

export function getMemberTier(totalPoints: number, tiers: MemberTier[] = DEFAULT_MEMBER_TIERS) {
  const orderedTiers = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = orderedTiers[0] || DEFAULT_MEMBER_TIERS[0];
  for (const tier of orderedTiers) {
    if (totalPoints >= tier.minPoints) current = tier;
  }

  const next = orderedTiers.find((tier) => tier.minPoints > totalPoints) || null;
  const previousMin = current.minPoints;
  const nextMin = next?.minPoints ?? current.minPoints;
  const progress = next && nextMin > previousMin
    ? Math.min(100, Math.max(0, Math.round(((totalPoints - previousMin) / (nextMin - previousMin)) * 100)))
    : 100;

  return {
    current,
    next,
    progress,
    pointsToNext: next ? Math.max(0, next.minPoints - totalPoints) : 0,
  };
}

export function canAccessTierReward(memberTier: TierKey, rewardMinTier: TierKey | string | null | undefined) {
  return tierRank(memberTier) >= tierRank(rewardMinTier || "BRONZE");
}

export type BadgeInput = {
  attendVotes: number;
  approvedRuns: number;
  totalDistance: number;
  totalPoints: number;
  redemptionCount: number;
};

export function buildBadges(input: BadgeInput) {
  return [
    {
      key: "club-rookie",
      icon: "✅",
      name: "Club Rookie",
      description: "Vote ATTEND for your first club session.",
      earned: input.attendVotes >= 1,
      progress: Math.min(100, input.attendVotes * 100),
    },
    {
      key: "performance-starter",
      icon: "🎽",
      name: "Performance Starter",
      description: "Submit your first approved result from any club event.",
      earned: input.approvedRuns >= 1,
      progress: Math.min(100, input.approvedRuns * 100),
    },
    {
      key: "ten-km-base",
      icon: "🏃",
      name: "10KM Base",
      description: "Collect 10KM approved distance from running or training sessions.",
      earned: input.totalDistance >= 10,
      progress: Math.min(100, Math.round((input.totalDistance / 10) * 100)),
    },
    {
      key: "hybrid-engine",
      icon: "🔥",
      name: "Hybrid Engine",
      description: "Complete 3 approved sessions to build a HYROX / Redline-ready engine.",
      earned: input.approvedRuns >= 3,
      progress: Math.min(100, Math.round((input.approvedRuns / 3) * 100)),
    },
    {
      key: "fifty-km-builder",
      icon: "🏅",
      name: "50KM Builder",
      description: "Build a 50KM approved club distance base.",
      earned: input.totalDistance >= 50,
      progress: Math.min(100, Math.round((input.totalDistance / 50) * 100)),
    },
    {
      key: "points-hunter",
      icon: "🎯",
      name: "100 Point Hunter",
      description: "Earn your first 100 approved points.",
      earned: input.totalPoints >= 100,
      progress: Math.min(100, Math.round((input.totalPoints / 100) * 100)),
    },
    {
      key: "reward-redeemer",
      icon: "🎁",
      name: "Reward Redeemer",
      description: "Submit your first redemption request.",
      earned: input.redemptionCount >= 1,
      progress: Math.min(100, input.redemptionCount * 100),
    },
  ];
}

export function buildChallenges(input: BadgeInput) {
  return [
    {
      key: "vote-session",
      title: "Check In",
      description: "Vote attend for one club session.",
      current: Math.min(input.attendVotes, 1),
      target: 1,
      unit: "vote",
    },
    {
      key: "three-session-engine",
      title: "Hybrid Engine",
      description: "Complete 3 approved sessions.",
      current: Math.min(input.approvedRuns, 3),
      target: 3,
      unit: "sessions",
    },
    {
      key: "ten-km-challenge",
      title: "10KM Base",
      description: "Reach 10KM approved distance.",
      current: Math.min(Number(input.totalDistance.toFixed(2)), 10),
      target: 10,
      unit: "km",
    },
    {
      key: "thirty-km-challenge",
      title: "30KM Builder",
      description: "Reach 30KM approved distance.",
      current: Math.min(Number(input.totalDistance.toFixed(2)), 30),
      target: 30,
      unit: "km",
    },
    {
      key: "hundred-points",
      title: "100 Point Mission",
      description: "Earn 100 approved club points.",
      current: Math.min(input.totalPoints, 100),
      target: 100,
      unit: "pts",
    },
  ].map((challenge) => ({
    ...challenge,
    progress: Math.min(100, Math.round((Number(challenge.current) / challenge.target) * 100)),
    completed: Number(challenge.current) >= challenge.target,
  }));
}
