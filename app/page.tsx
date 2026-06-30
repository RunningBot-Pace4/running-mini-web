import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeRange } from "@/lib/datetime";
import { EventDescription } from "@/components/EventDescription";
import { LoadingLink } from "@/components/LoadingLink";
import { getHomeContent } from "@/lib/site-content";
import { getScoreSettings, scoringDescription } from "@/lib/scoring";
import { eventDisplayStatus, isEventAcceptingResponses } from "@/lib/event-window";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";
import { getUserPointWallet } from "@/lib/redemptions";
import { buildBadges, buildChallenges, getMemberTier } from "@/lib/member-progress";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "OPEN") return "badge success";
  if (status === "CLOSED") return "badge danger";
  return "badge";
}

function GuestIntro({
  homeContent,
}: {
  homeContent: {
    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;
  };
}) {
  return (
    <>
      <section className="activ-clean-hero" aria-label="Running club introduction">
        <div className="activ-hero-copy">
          <span className="eyebrow">{homeContent.heroEyebrow || "Run. Level up. Get rewarded."}</span>
          <h1>{homeContent.heroTitle || "Run. Earn. Redeem."}</h1>
          <div className="activ-hero-description">
            <EventDescription text={homeContent.heroDescription} />
          </div>
          <div className="activ-hero-actions">
            <LoadingLink className="button" href="/register" loadingLabel="Opening registration...">Get started free</LoadingLink>
            <LoadingLink className="button ghost" href="/login" loadingLabel="Opening login...">Member login</LoadingLink>
          </div>
        </div>
        <div className="activ-phone-preview" aria-label="Member app preview">
          <div className="activ-phone-head"><span>🏃</span><strong>Run Mini</strong><em>LIVE</em></div>
          <div className="activ-phone-score"><span>Today’s mission</span><strong>Vote → Run → Submit</strong><small>Earn points and unlock better rewards.</small></div>
          <div className="activ-phone-steps">
            <i />
            <b>01</b><b>02</b><b>03</b>
          </div>
          <div className="activ-phone-reward"><span>Tier</span><strong>Bronze → Silver → Gold → Platinum</strong></div>
        </div>
      </section>

      <section className="activ-feature-grid" aria-label="Key benefits">
        <article><span>01</span><h2>Make every KM count</h2><p>Members submit Strava or manual distance and collect points from approved runs.</p></article>
        <article><span>02</span><h2>Level up by tiers</h2><p>Bronze, Silver, Gold and Platinum tiers can unlock better club benefits.</p></article>
        <article><span>03</span><h2>Redeem rewards</h2><p>Use available points to redeem items, vouchers, discounts and club privileges.</p></article>
        <article><span>04</span><h2>Join challenges</h2><p>Badges and missions help keep the club motivated every week.</p></article>
      </section>
    </>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const homeContent = await getHomeContent();

  if (!user) {
    return <GuestIntro homeContent={homeContent} />;
  }

  await closeExpiredOpenEvents();

  const scoreSettings = await getScoreSettings();
  const events = await prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { startAt: "desc" },
    include: { _count: { select: { votes: true, submissions: true } } },
  });

  const [myVoteCount, mySubmissions, wallet, myRedemptionCount] = await Promise.all([
    prisma.eventVote.count({ where: { userId: user.id } }),
    prisma.submission.findMany({
      where: { userId: user.id, status: "APPROVED" },
      select: { distanceKm: true, totalPoints: true },
    }),
    getUserPointWallet(user.id),
    prisma.redemption.count({ where: { userId: user.id } }),
  ]);

  const myDistanceKm = mySubmissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const myPoints = mySubmissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const myTier = getMemberTier(myPoints);
  const badgeCount = buildBadges({ attendVotes: myVoteCount, approvedRuns: mySubmissions.length, totalDistance: myDistanceKm, totalPoints: myPoints, redemptionCount: myRedemptionCount }).filter((badge) => badge.earned).length;
  const challenges = buildChallenges({ attendVotes: myVoteCount, approvedRuns: mySubmissions.length, totalDistance: myDistanceKm, totalPoints: myPoints, redemptionCount: myRedemptionCount }).slice(0, 3);
  const openEvents = events.filter((event) => isEventAcceptingResponses(event)).length;
  const nextEvent = events.find((event) => isEventAcceptingResponses(event)) || events[0];

  return (
    <>
      <section className="activ-member-hero" aria-label="Member dashboard">
        <div className="activ-member-copy">
          <span className="eyebrow">Welcome back</span>
          <h1>Hi, {user.name}</h1>
          <p>Track your club sessions, collect points, unlock tiers and redeem rewards.</p>
          <div className="activ-hero-actions">
            <LoadingLink className="button" href="#events">View events</LoadingLink>
            <LoadingLink className="button ghost" href="/account">My dashboard</LoadingLink>
          </div>
        </div>
        <div className="activ-member-wallet">
          <span>{myTier.current.emoji} {myTier.current.name} tier</span>
          <strong>{wallet.availablePoints}</strong>
          <small>available points</small>
          <LoadingLink className="button ghost mini" href="/redemptions">Redeem</LoadingLink>
        </div>
      </section>

      <section className="activ-dashboard-strip" aria-label="Member summary">
        <article><span>Points</span><strong>{myPoints}</strong><small>{scoringDescription(scoreSettings)}</small></article>
        <article><span>Distance</span><strong>{myDistanceKm.toFixed(1)}km</strong><small>{mySubmissions.length} approved runs</small></article>
        <article><span>Badges</span><strong>{badgeCount}</strong><small>earned achievements</small></article>
        <article><span>Open events</span><strong>{openEvents}</strong><small>available missions</small></article>
      </section>

      <section className="activ-home-panel">
        <div>
          <span className="eyebrow">Next focus</span>
          <h2>{nextEvent?.title || "Create your first event"}</h2>
          <p>{nextEvent ? formatDateTimeRange(nextEvent.startAt, nextEvent.endAt) : "Admin can add the first event from the dashboard."}</p>
        </div>
        {nextEvent && <LoadingLink className="button" href={`/events/${nextEvent.slug}`}>Open event</LoadingLink>}
      </section>

      <section className="activ-section-card">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">Active challenges</span>
            <h2>Keep the streak moving</h2>
          </div>
          <LoadingLink className="button ghost" href="/account">View badges</LoadingLink>
        </div>
        <div className="activ-challenge-grid compact">
          {challenges.map((challenge) => (
            <article className={challenge.completed ? "activ-challenge-card completed" : "activ-challenge-card"} key={challenge.key}>
              <div><strong>{challenge.title}</strong><p>{challenge.description}</p></div>
              <span>{challenge.current}/{challenge.target} {challenge.unit}</span>
              <div className="activ-mini-progress"><i style={{ width: `${challenge.progress}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <section id="events" className="activ-section-title">
        <span className="eyebrow">Event board</span>
        <h2>Choose your next mission</h2>
        <p>Vote, run, submit KM, and share your result.</p>
      </section>

      <div className="activ-event-list">
        {events.map((event) => {
          const displayStatus = eventDisplayStatus(event);
          return (
            <article className="activ-event-item" key={event.id}>
              <div className="activ-event-date"><span>{event.startAt.getDate().toString().padStart(2, "0")}</span><small>{event.startAt.toLocaleString("en-US", { month: "short" })}</small></div>
              <div className="activ-event-body">
                <div className="activ-event-topline"><span className={statusClass(displayStatus)}>{displayStatus}</span><small>{event._count.votes} votes · {event._count.submissions} runs</small></div>
                <h2>{event.title}</h2>
                <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
                {event.description && <div className="workout-preview activ-workout-preview"><EventDescription text={event.description} compact fullHref={`/events/${event.slug}`} /></div>}
              </div>
              <LoadingLink className="button ghost" href={`/events/${event.slug}`}>Enter</LoadingLink>
            </article>
          );
        })}
        {events.length === 0 && <div className="empty-card"><h2>No events yet</h2><p className="muted">Ask an admin to create the first running event.</p></div>}
      </div>
    </>
  );
}
