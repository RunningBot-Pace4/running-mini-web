import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeRange } from "@/lib/datetime";
import { EventDescription } from "@/components/EventDescription";
import { LoadingLink } from "@/components/LoadingLink";
import { getHomeContent } from "@/lib/site-content";
import { eventDisplayStatus, isEventAcceptingResponses } from "@/lib/event-window";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";
import { getUserPointWallet } from "@/lib/redemptions";
import { buildBadges, buildChallenges, getMemberTier, getTierDefinitions } from "@/lib/member-progress";
import { eventTypeClass, getClubEventType } from "@/lib/event-types";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "OPEN") return "badge success";
  if (status === "CLOSED") return "badge danger";
  return "badge";
}

function GuestIntro({ homeContent }: { homeContent: { heroEyebrow: string; heroTitle: string; heroDescription: string } }) {
  return (
    <>
      <section className="performance-guest-hero" aria-label="Club introduction">
        <div className="performance-guest-copy">
          <span className="eyebrow">{homeContent.heroEyebrow || "SPRC Performance Club Hub"}</span>
          <h1>{homeContent.heroTitle || "Train for every race format."}</h1>
          <div className="performance-guest-description">
            <EventDescription text={homeContent.heroDescription} />
          </div>
          <div className="performance-action-row">
            <LoadingLink className="button" href="/register" loadingLabel="Opening registration...">Join the club</LoadingLink>
            <LoadingLink className="button ghost" href="/login" loadingLabel="Opening login...">Member login</LoadingLink>
          </div>
        </div>
        <div className="performance-phone-card simple-preview-card" aria-label="App preview">
          <div className="phone-topline"><span>Club hub</span><strong>LIVE</strong></div>
          <div className="phone-score-bubble"><strong>Vote · Train · Redeem</strong><small>Track HYROX, redline, marathon and training sessions in one clean member hub.</small></div>
          <div className="phone-loyalty-preview">
            <div><span>Tier</span><strong>Bronze → Silver</strong></div>
            <div><span>Rewards</span><strong>Items & vouchers</strong></div>
            <div><span>Challenges</span><strong>Badges & missions</strong></div>
          </div>
        </div>
      </section>

      <section className="performance-how-card">
        <div><span>01</span><strong>Vote attendance</strong><p>Members confirm ATTEND or NOT ATTEND for each club session.</p></div>
        <div><span>02</span><strong>Submit result</strong><p>Use Strava or manual KM entry depending on admin settings and event rules.</p></div>
        <div><span>03</span><strong>Level up</strong><p>Points build badges, tiers and redemption power for items or vouchers.</p></div>
      </section>
    </>
  );
}

function TierGauge({
  totalPoints,
  tierDefinitions,
  currentTier,
  nextTier,
  pointsToNext,
}: {
  totalPoints: number;
  tierDefinitions: Awaited<ReturnType<typeof getTierDefinitions>>;
  currentTier: Awaited<ReturnType<typeof getMemberTier>>["current"];
  nextTier: Awaited<ReturnType<typeof getMemberTier>>["next"];
  pointsToNext: number;
}) {
  const ordered = [...tierDefinitions].sort((a, b) => a.minPoints - b.minPoints);
  const currentIndex = Math.max(0, ordered.findIndex((tier) => tier.key === currentTier.key));
  const segmentCount = Math.max(1, ordered.length - 1);
  const localProgress = nextTier
    ? Math.max(0, Math.min(1, (totalPoints - currentTier.minPoints) / Math.max(1, nextTier.minPoints - currentTier.minPoints)))
    : 1;
  const overallProgress = nextTier ? ((currentIndex + localProgress) / segmentCount) * 100 : 100;
  const labelPositions = ordered.map((_, index) =>
    ordered.length === 1 ? 50 : 6 + (index / (ordered.length - 1)) * 88
  );
  const nextTargetPoints = nextTier?.minPoints ?? totalPoints;
  const centerPointsLabel = nextTier ? `${totalPoints} / ${nextTargetPoints}` : `${totalPoints}`;

  return (
    <article className="cute-tier-card">
      <div className="cute-tier-head">
        <div>
          <span className="eyebrow">Tier journey</span>
          <h2>{currentTier.name} member pass</h2>
        </div>
        <strong>{nextTier ? `${pointsToNext} pts to ${nextTier.name}` : "Max tier unlocked"}</strong>
      </div>

      <div className="cute-tier-gauge-wrap">
        <div className="cute-tier-label-row" aria-hidden="true">
          {ordered.map((tier, index) => (
            <span
              key={tier.key}
              className={tier.key === currentTier.key ? "is-current" : ""}
              style={{ left: `${labelPositions[index] ?? 100}%` } as CSSProperties}
            >
              <strong>{tier.name}</strong>
              <small>{tier.minPoints} pts</small>
            </span>
          ))}
        </div>

        <svg viewBox="0 0 220 138" className="cute-tier-gauge" aria-hidden="true">
          <path d="M 20 118 A 90 90 0 0 1 200 118" pathLength="100" className="gauge-track" />
          <path d="M 20 118 A 90 90 0 0 1 200 118" pathLength="100" className="gauge-progress" style={{ strokeDasharray: `${overallProgress} 100` } as CSSProperties} />
          <circle cx="20" cy="118" r="6" className="gauge-node" />
          <circle cx="85" cy="46" r="6" className="gauge-node" />
          <circle cx="135" cy="46" r="6" className="gauge-node" />
          <circle cx="200" cy="118" r="6" className="gauge-node" />
        </svg>

        <div className="cute-tier-center">
          <strong>{centerPointsLabel}</strong>
          <span>{nextTier ? "points" : "Total points"}</span>
        </div>
      </div>

      <div className="cute-tier-foot">
        <span>{currentTier.emoji} {currentTier.discount}</span>
        <small>{currentTier.benefit}</small>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const homeContent = await getHomeContent();

  if (!user) return <GuestIntro homeContent={homeContent} />;

  await closeExpiredOpenEvents();

  const tierDefinitions = await getTierDefinitions();
  const events = await prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { startAt: "desc" },
    include: { _count: { select: { votes: true, submissions: true } } },
  });

  const [myVoteCount, mySubmissions, wallet, myRedemptionCount, leaderboardSubmissions] = await Promise.all([
    prisma.eventVote.count({ where: { userId: user.id, status: "ATTEND" } }),
    prisma.submission.findMany({ where: { userId: user.id, status: "APPROVED" }, select: { distanceKm: true, totalPoints: true } }),
    getUserPointWallet(user.id),
    prisma.redemption.count({ where: { userId: user.id } }),
    prisma.submission.findMany({
      where: { status: "APPROVED" },
      select: { userId: true, totalPoints: true, user: { select: { name: true } } },
    }),
  ]);

  const myDistanceKm = mySubmissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const myPoints = mySubmissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const myTier = getMemberTier(myPoints, tierDefinitions);
  const badges = buildBadges({ attendVotes: myVoteCount, approvedRuns: mySubmissions.length, totalDistance: myDistanceKm, totalPoints: myPoints, redemptionCount: myRedemptionCount });
  const badgeCount = badges.filter((badge) => badge.earned).length;
  const challenges = buildChallenges({ attendVotes: myVoteCount, approvedRuns: mySubmissions.length, totalDistance: myDistanceKm, totalPoints: myPoints, redemptionCount: myRedemptionCount }).slice(0, 4);
  const openEvents = events.filter((event) => isEventAcceptingResponses(event)).length;
  const upcomingEvents = events.filter((event) => isEventAcceptingResponses(event));
  const nextEvent = upcomingEvents[0] || events[0];
  const featuredChallenge = challenges.find((challenge) => !challenge.completed) || challenges[0];
  const latestBadge = [...badges].reverse().find((badge) => badge.earned) || badges[0];
  const leaderboardMap = new Map<string, { userId: string; name: string; points: number }>();
  for (const submission of leaderboardSubmissions) {
    const current = leaderboardMap.get(submission.userId) || {
      userId: submission.userId,
      name: submission.user.name,
      points: 0,
    };
    current.points += submission.totalPoints;
    leaderboardMap.set(submission.userId, current);
  }
  const leaderboardTotals = Array.from(leaderboardMap.values()).sort((a, b) => b.points - a.points);
  const rankIndex = leaderboardTotals.findIndex((row) => row.userId === user.id);
  const myRank = rankIndex >= 0 ? rankIndex + 1 : null;
  const rankingPreview = leaderboardTotals.slice(0, 3);

  return (
    <>
      <section className="club-dashboard-v2" aria-label="Member dashboard">
        <article className="club-hero-card">
          <div className="club-hero-copy">
            <span className="eyebrow">Member dashboard</span>
            <h1>{user.name}</h1>
            <p>Welcome back. Track club points, rewards, events and challenges in one cute loyalty-style hub.</p>
          </div>
          <div className="club-hero-pills">
            <span>{wallet.availablePoints} pts available</span>
            <span>{openEvents} open missions</span>
          </div>
        </article>

        <div className="club-dashboard-grid-v2">
          <TierGauge
            totalPoints={myPoints}
            tierDefinitions={tierDefinitions}
            currentTier={myTier.current}
            nextTier={myTier.next}
            pointsToNext={myTier.pointsToNext}
          />

          <article className="cute-reward-card">
            <span className="eyebrow">Reward wallet</span>
            <h2>{wallet.availablePoints} pts ready</h2>
            <p>Use your points for club items, partner vouchers and future member perks.</p>
            <div className="cute-reward-stats">
              <div><strong>{wallet.totalEarned}</strong><small>earned</small></div>
              <div><strong>{wallet.spentOrReserved}</strong><small>used</small></div>
              <div><strong>{myRedemptionCount}</strong><small>redeems</small></div>
            </div>
            <div className="cute-button-row">
              <LoadingLink className="button" href="/redemptions">View rewards</LoadingLink>
              <LoadingLink className="button ghost" href="/account">My account</LoadingLink>
            </div>
          </article>
        </div>

        <div className="cute-stat-grid">
          <article className="cute-stat-card"><span>Total KM</span><strong>{myDistanceKm.toFixed(1)}</strong><small>approved distance</small></article>
          <article className="cute-stat-card"><span>Attend votes</span><strong>{myVoteCount}</strong><small>club check-ins</small></article>
          <article className="cute-stat-card"><span>Badges</span><strong>{badgeCount}/{badges.length}</strong><small>earned now</small></article>
          <article className="cute-stat-card"><span>Approved runs</span><strong>{mySubmissions.length}</strong><small>results counted</small></article>
        </div>

        <div className="cute-focus-grid dashboard-summary-grid">
          <article className="cute-focus-card">
            <div className="section-title-row compact">
              <div>
                <span className="eyebrow">Next event</span>
                <h2>{nextEvent?.title || "Create the first club event"}</h2>
              </div>
            </div>
            <p>{nextEvent ? formatDateTimeRange(nextEvent.startAt, nextEvent.endAt) : "Admin can add your first club event."}</p>
            {nextEvent && <span className={eventTypeClass(nextEvent.type)}>{getClubEventType(nextEvent.type).icon} {getClubEventType(nextEvent.type).label}</span>}
            <div className="cute-button-row single">
              {nextEvent ? (
                <LoadingLink className="button" href={`/events/${nextEvent.slug}`} loadingLabel="Opening event...">Open event</LoadingLink>
              ) : (
                <LoadingLink className="button ghost" href="/events" loadingLabel="Opening events...">All events</LoadingLink>
              )}
            </div>
          </article>

          <article className="cute-focus-card challenge">
            <div className="section-title-row compact">
              <div>
                <span className="eyebrow">Current challenge</span>
                <h2>{featuredChallenge?.title || "Stay active"}</h2>
              </div>
            </div>
            <p>{featuredChallenge?.description || "Unlock more badges and points by completing more sessions."}</p>
            {featuredChallenge && (
              <>
                <div className="cute-progress-pill">
                  <strong>{featuredChallenge.current}/{featuredChallenge.target} {featuredChallenge.unit}</strong>
                  <small>{featuredChallenge.progress}%</small>
                </div>
                <div className="cute-progress-bar"><i style={{ width: `${featuredChallenge.progress}%` }} /></div>
              </>
            )}
          </article>

          <article className="cute-focus-card badge-preview">
            <div className="section-title-row compact">
              <div>
                <span className="eyebrow">Latest badge</span>
                <h2>{latestBadge ? `${latestBadge.icon} ${latestBadge.name}` : "No badge yet"}</h2>
              </div>
            </div>
            <p>{latestBadge?.description || "Vote, attend and submit distance to unlock your first badge."}</p>
            <div className="cute-progress-pill">
              <strong>{badgeCount}/{badges.length} earned</strong>
              <small>{latestBadge?.earned ? "Unlocked" : `${latestBadge?.progress || 0}%`}</small>
            </div>
          </article>

          <article className="cute-focus-card leaderboard-preview">
            <div className="section-title-row compact">
              <div>
                <span className="eyebrow">Ranking preview</span>
                <h2>{myRank ? `You are #${myRank}` : "No ranking yet"}</h2>
              </div>
            </div>
            <div className="mini-leaderboard-list">
              {rankingPreview.map((row, index) => (
                <div key={row.userId}>
                  <span>#{index + 1}</span>
                  <strong>{row.userId === user.id ? "You" : row.name}</strong>
                  <small>{row.points} pts</small>
                </div>
              ))}
            </div>
            {rankingPreview.length === 0 && <p className="muted">Submit an approved result to enter the leaderboard.</p>}
          </article>
        </div>
      </section>

    </>
  );
}
