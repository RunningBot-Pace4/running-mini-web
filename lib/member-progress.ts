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

export const MEMBER_TIERS: MemberTier[] = [
  {
    key: "BRONZE",
    name: "Bronze",
    emoji: "🥉",
    minPoints: 0,
    color: "#B87333",
    benefit: "Starter rewards, basic item redemption, community badge.",
    discount: "Member vouchers",
  },
  {
    key: "SILVER",
    name: "Silver",
    emoji: "🥈",
    minPoints: 100,
    color: "#94A3B8",
    benefit: "Better voucher access, priority redemption queue, Silver badge.",
    discount: "Up to 5% club partner discount",
  },
  {
    key: "GOLD",
    name: "Gold",
    emoji: "🥇",
    minPoints: 250,
    color: "#F59E0B",
    benefit: "Premium vouchers, event priority, Gold achievement badge.",
    discount: "Up to 10% club partner discount",
  },
  {
    key: "PLATINUM",
    name: "Platinum",
    emoji: "💎",
    minPoints: 500,
    color: "#7C3AED",
    benefit: "Top-tier rewards, exclusive items, first access to club campaigns.",
    discount: "Up to 15% club partner discount",
  },
];

export function tierRank(tier: string | null | undefined) {
  const index = MEMBER_TIERS.findIndex((item) => item.key === tier);
  return index < 0 ? 0 : index;
}

export function getMemberTier(totalPoints: number) {
  let current = MEMBER_TIERS[0];
  for (const tier of MEMBER_TIERS) {
    if (totalPoints >= tier.minPoints) current = tier;
  }

  const next = MEMBER_TIERS.find((tier) => tier.minPoints > totalPoints) || null;
  const previousMin = current.minPoints;
  const nextMin = next?.minPoints ?? current.minPoints;
  const progress = next
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
  const badges = [
    {
      key: "first-vote",
      icon: "✅",
      name: "First Check-In",
      description: "Vote ATTEND for your first club session.",
      earned: input.attendVotes >= 1,
      progress: Math.min(100, input.attendVotes * 100),
    },
    {
      key: "first-run",
      icon: "🏃",
      name: "First Run Logged",
      description: "Submit your first approved run.",
      earned: input.approvedRuns >= 1,
      progress: Math.min(100, input.approvedRuns * 100),
    },
    {
      key: "ten-km",
      icon: "🔥",
      name: "10KM Starter",
      description: "Collect 10KM approved distance.",
      earned: input.totalDistance >= 10,
      progress: Math.min(100, Math.round((input.totalDistance / 10) * 100)),
    },
    {
      key: "fifty-km",
      icon: "🌊",
      name: "50KM Builder",
      description: "Build a 50KM total distance base.",
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

  return badges;
}

export function buildChallenges(input: BadgeInput) {
  return [
    {
      key: "weekly-vote",
      title: "Start Strong",
      description: "Vote attend for a club workout.",
      current: Math.min(input.attendVotes, 1),
      target: 1,
      unit: "vote",
    },
    {
      key: "ten-km-challenge",
      title: "10KM Club",
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
      description: "Earn 100 approved running points.",
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
