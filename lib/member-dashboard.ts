import { prisma } from "@/lib/prisma";
import { buildBadges, buildChallenges, getMemberTier, getTierDefinitions } from "@/lib/member-progress";
import { getUserPointWallet } from "@/lib/redemptions";

export async function getMemberDashboardData(userId: string) {
  const tierDefinitions = await getTierDefinitions();

  const [votes, submissions, redemptions, wallet, stravaToken] = await Promise.all([
    prisma.eventVote.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { userId },
      include: { event: true, activity: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.redemption.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
    getUserPointWallet(userId),
    prisma.stravaToken.findUnique({ where: { userId } }),
  ]);

  const approvedSubmissions = submissions.filter((submission) => submission.status === "APPROVED");
  const totalPoints = approvedSubmissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const totalDistance = approvedSubmissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const attendVotes = votes.filter((vote) => vote.status === "ATTEND").length;
  const tierProgress = getMemberTier(totalPoints, tierDefinitions);
  const badges = buildBadges({
    attendVotes,
    approvedRuns: approvedSubmissions.length,
    totalDistance,
    totalPoints,
    redemptionCount: redemptions.length,
  });
  const challenges = buildChallenges({
    attendVotes,
    approvedRuns: approvedSubmissions.length,
    totalDistance,
    totalPoints,
    redemptionCount: redemptions.length,
  });

  return {
    votes,
    submissions,
    approvedSubmissions,
    redemptions,
    wallet,
    stravaToken,
    tierDefinitions,
    totalPoints,
    totalDistance,
    attendVotes,
    tierProgress,
    badges,
    challenges,
  };
}

export async function getClubLeaderboard(limit = 100) {
  const submissions = await prisma.submission.findMany({
    where: { status: "APPROVED" },
    include: { user: true, event: true, activity: true },
    orderBy: [{ totalPoints: "desc" }, { distanceKm: "desc" }, { createdAt: "asc" }],
  });

  const rows = new Map<string, {
    userId: string;
    name: string;
    totalPoints: number;
    totalDistance: number;
    approvedRuns: number;
    lastEventTitle: string;
  }>();

  for (const submission of submissions) {
    const existing = rows.get(submission.userId);
    if (existing) {
      existing.totalPoints += submission.totalPoints;
      existing.totalDistance += Number(submission.distanceKm);
      existing.approvedRuns += 1;
      if (!existing.lastEventTitle) existing.lastEventTitle = submission.event.title;
    } else {
      rows.set(submission.userId, {
        userId: submission.userId,
        name: submission.user.name,
        totalPoints: submission.totalPoints,
        totalDistance: Number(submission.distanceKm),
        approvedRuns: 1,
        lastEventTitle: submission.event.title,
      });
    }
  }

  return [...rows.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalDistance - a.totalDistance || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
