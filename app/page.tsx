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
import { CLUB_EVENT_TYPES, eventTypeClass, getClubEventType } from "@/lib/event-types";

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
        <div className="performance-phone-card" aria-label="App preview">
          <div className="phone-topline"><span>Performance pass</span><strong>LIVE</strong></div>
          <div className="phone-tier-meter">
            <span>Bronze</span><span>Silver</span><span>Gold</span><span>Platinum</span>
            <i />
          </div>
          <div className="phone-score-bubble"><strong>Vote · Train · Score</strong><small>Earn points from club events, unlock badges and redeem rewards.</small></div>
          <div className="phone-tile-grid">
            <span>HYROX</span><span>Redline</span><span>Marathon</span><span>Training</span>
          </div>
        </div>
      </section>

      <section className="performance-category-grid" aria-label="Club event categories">
        {CLUB_EVENT_TYPES.slice(1, 6).map((type) => (
          <article key={type.key} className={`performance-category-card type-${type.key.toLowerCase()}`}>
            <span>{type.icon}</span>
            <strong>{type.label}</strong>
            <p>{type.description}</p>
          </article>
        ))}
      </section>

      <section className="performance-how-card">
        <div><span>01</span><strong>Vote attendance</strong><p>Members confirm ATTEND or NOT ATTEND for each club session.</p></div>
        <div><span>02</span><strong>Submit result</strong><p>Use Strava or manual KM entry depending on admin settings and event rules.</p></div>
        <div><span>03</span><strong>Level up</strong><p>Points build badges, tiers and redemption power for items or vouchers.</p></div>
      </section>
    </>
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

  const [myVoteCount, mySubmissions, wallet, myRedemptionCount, recentApproved] = await Promise.all([
    prisma.eventVote.count({ where: { userId: user.id, status: "ATTEND" } }),
    prisma.submission.findMany({ where: { userId: user.id, status: "APPROVED" }, select: { distanceKm: true, totalPoints: true } }),
    getUserPointWallet(user.id),
    prisma.redemption.count({ where: { userId: user.id } }),
    prisma.submission.findMany({
      where: { userId: user.id, status: "APPROVED" },
      include: { event: true },
      orderBy: { createdAt: "desc" },
      take: 4,
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
  const typeCounts = CLUB_EVENT_TYPES.map((type) => ({
    ...type,
    count: events.filter((event) => event.type === type.key).length,
  }));

  return (
    <>
      <section className="app-dashboard-shell" aria-label="Member app dashboard">
        <div className="app-dashboard-topbar">
          <div>
            <span className="eyebrow">Performance club</span>
            <h1>Hi, {user.name}</h1>
          </div>
          <span className="app-live-pill">LIVE</span>
        </div>

        <div className="app-tier-journey-card">
          <div className="tier-arc-panel" style={{ "--progress": `${myTier.progress}%`, "--tier-color": myTier.current.color } as CSSProperties}>
            <div className="tier-arc-labels">
              {tierDefinitions.map((tier) => (
                <span key={tier.key}>{tier.name}<small>{tier.minPoints} pts</small></span>
              ))}
            </div>
            <div className="tier-arc-display">
              <strong>{myPoints}</strong>
              <span>Total points</span>
            </div>
          </div>
          <div className="tier-journey-bottom">
            <span>{myTier.current.emoji} {myTier.current.name}</span>
            <strong>{myTier.next ? `${myTier.pointsToNext} pts to ${myTier.next.name}` : "Max tier unlocked"}</strong>
          </div>
        </div>

        <div className="app-reward-banner">
          <div>
            <span>Reward wallet</span>
            <strong>{wallet.availablePoints} pts available</strong>
            <small>Redeem items, vouchers and club perks.</small>
          </div>
          <LoadingLink className="button" href="/redemptions">View rewards</LoadingLink>
        </div>

        <div className="app-tile-grid">
          <LoadingLink className="app-tile hyrox" href="#events"><span>🏋️</span><strong>HYROX</strong><small>Hybrid sessions</small></LoadingLink>
          <LoadingLink className="app-tile redline" href="#events"><span>⚡</span><strong>Redline</strong><small>Team relay</small></LoadingLink>
          <LoadingLink className="app-tile marathon" href="#events"><span>🏃</span><strong>Marathon</strong><small>Road race</small></LoadingLink>
          <LoadingLink className="app-tile training" href="#events"><span>🎽</span><strong>Training</strong><small>Club workout</small></LoadingLink>
        </div>

        <div className="app-metric-grid">
          <article><span>Total KM</span><strong>{myDistanceKm.toFixed(1)}</strong><small>approved</small></article>
          <article><span>Joined</span><strong>{myVoteCount}</strong><small>attend votes</small></article>
          <article><span>Badges</span><strong>{badgeCount}/{badges.length}</strong><small>earned</small></article>
          <article><span>Missions</span><strong>{openEvents}</strong><small>open</small></article>
        </div>

        <div className="app-next-event-card">
          <div>
            <span className="eyebrow">Next focus</span>
            <h2>{nextEvent?.title || "Create the first club event"}</h2>
            <p>{nextEvent ? formatDateTimeRange(nextEvent.startAt, nextEvent.endAt) : "Admin can add your first club event."}</p>
            {nextEvent && <span className={eventTypeClass(nextEvent.type)}>{getClubEventType(nextEvent.type).icon} {getClubEventType(nextEvent.type).label}</span>}
          </div>
          {nextEvent && <LoadingLink className="button" href={`/events/${nextEvent.slug}`}>Open</LoadingLink>}
        </div>

        <div className="app-challenge-board">
          <div className="section-title-row compact">
            <div><span className="eyebrow">Challenges</span><h2>Keep moving</h2></div>
            <LoadingLink className="button ghost" href="/account">Full dashboard</LoadingLink>
          </div>
          {challenges.slice(0, 4).map((challenge) => (
            <article className={challenge.completed ? "app-challenge completed" : "app-challenge"} key={challenge.key}>
              <div><strong>{challenge.title}</strong><small>{challenge.description}</small></div>
              <span>{challenge.current}/{challenge.target} {challenge.unit}</span>
              <i><b style={{ width: `${challenge.progress}%` }} /></i>
            </article>
          ))}
        </div>

        {recentApproved.length > 0 && (
          <div className="app-recent-list">
            <div className="section-title-row compact"><div><span className="eyebrow">Recent effort</span><h2>Approved sessions</h2></div></div>
            {recentApproved.map((submission) => (
              <article key={submission.id}>
                <span className={eventTypeClass(submission.event.type)}>{getClubEventType(submission.event.type).icon}</span>
                <div><strong>{submission.event.title}</strong><small>{Number(submission.distanceKm).toFixed(2)}km · {submission.totalPoints} pts</small></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="events" className="activ-section-title">
        <span className="eyebrow">Event board</span>
        <h2>Choose your next mission</h2>
        <p>Vote, train, submit KM, and share your result.</p>
      </section>

      <div className="performance-event-list">
        {events.map((event) => {
          const displayStatus = eventDisplayStatus(event);
          const type = getClubEventType(event.type);
          return (
            <article className="performance-event-card" key={event.id}>
              <div className="event-card-icon"><span>{type.icon}</span></div>
              <div className="performance-event-body">
                <div className="performance-event-meta">
                  <span className={statusClass(displayStatus)}>{displayStatus}</span>
                  <span className={eventTypeClass(event.type)}>{type.label}</span>
                  <small>{event._count.votes} votes · {event._count.submissions} results</small>
                </div>
                <h2>{event.title}</h2>
                <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
                {event.description && <div className="workout-preview performance-workout-preview"><EventDescription text={event.description} compact fullHref={`/events/${event.slug}`} /></div>}
              </div>
              <LoadingLink className="button ghost" href={`/events/${event.slug}`}>Enter</LoadingLink>
            </article>
          );
        })}
        {events.length === 0 && <div className="empty-card"><h2>No events yet</h2><p className="muted">Ask an admin to create the first club event.</p></div>}
      </div>
    </>
  );
}
