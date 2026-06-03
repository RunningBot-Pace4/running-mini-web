import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeRange } from "@/lib/datetime";
import { EventDescription } from "@/components/EventDescription";
import { LoadingLink } from "@/components/LoadingLink";
import { getHomeContent } from "@/lib/site-content";
import { getScoreSettings, scoringDescription, scoringFormulaLabel } from "@/lib/scoring";
import { eventDisplayStatus, isEventAcceptingResponses } from "@/lib/event-window";

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
  const cultureCards = [
    { icon: "🟢", title: "WeChat style flow", text: "Simple tap cards, fast actions, and no confusing navigation." },
    { icon: "🧧", title: "Reward energy", text: "Points, badges, and challenge progress make every session feel valuable." },
    { icon: "📌", title: "Mini app board", text: "Members see tasks, votes, runs, and leaderboard in one mobile-first screen." },
  ];

  return (
    <>
      <section className="cn-app-hero guest-cn-app-hero" aria-label="Running club introduction">
        <div className="cn-hero-noise" aria-hidden="true" />
        <div className="cn-hero-left">
          <div className="cn-live-pill">
            <span className="pulse-dot" />
            {homeContent.heroEyebrow || "Mobile running challenge"}
          </div>

          <h1>{homeContent.heroTitle}</h1>

          <div className="cn-hero-rich">
            <EventDescription text={homeContent.heroDescription} />
          </div>

          <div className="cn-hero-actions">
            <LoadingLink className="button cn-main-cta" href="/register" loadingLabel="Opening registration...">
              Join challenge
            </LoadingLink>
            <LoadingLink className="button cn-glass-cta" href="/login" loadingLabel="Opening login...">
              Member login
            </LoadingLink>
          </div>

          <div className="cn-proof-strip" aria-label="Club features">
            <span>🏃 Club sessions</span>
            <span>✅ Attendance vote</span>
            <span>🔥 Points race</span>
            <span>📣 Share result</span>
          </div>
        </div>

        <div className="cn-miniapp-phone" aria-label="Mini app preview">
          <div className="cn-phone-header">
            <span className="phone-avatar">跑</span>
            <div>
              <strong>Run Mini</strong>
              <small>Club challenge board</small>
            </div>
            <span className="cn-phone-pill">LIVE</span>
          </div>

          <div className="cn-redpacket-card">
            <span>Today unlock</span>
            <strong>Vote · Run · Score</strong>
            <small>Complete missions and climb the club board.</small>
          </div>

          <div className="cn-task-wallet">
            <div><span>01</span><strong>Register</strong><small>Create runner pass</small></div>
            <div><span>02</span><strong>Vote</strong><small>Attend or not attend</small></div>
            <div><span>03</span><strong>Submit</strong><small>Strava or manual</small></div>
          </div>

          <div className="cn-phone-runner" aria-hidden="true">🏃‍♂️</div>
          <div className="cn-orbit-ring" aria-hidden="true" />
        </div>
      </section>

      <section className="cn-marquee" aria-label="Running club motto">
        <span>加油</span>
        <strong>Sweat · Push · Repeat · Champion</strong>
        <span>一起跑</span>
      </section>

      <section className="cn-section-title">
        <span className="eyebrow">China mini-app direction</span>
        <h2>Built like a challenge app, not a normal event page.</h2>
        <p>Designed for mobile members: quick decisions, visual rewards, clear tasks, and strong running-club identity.</p>
      </section>

      <div className="cn-culture-grid">
        {cultureCards.map((card) => (
          <article className="cn-culture-card" key={card.title}>
            <span>{card.icon}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>

      <section className="cn-join-panel">
        <div>
          <span className="eyebrow">Members only</span>
          <h2>Login unlocks the live race board.</h2>
          <p>Events, attendance status, distance submission, points, and account progress are shown after login.</p>
        </div>
        <div className="cn-feed-stack" aria-hidden="true">
          <span>New workout opened</span>
          <span>Attendance vote updated</span>
          <span>Leaderboard refreshed</span>
        </div>
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

  const scoreSettings = await getScoreSettings();
  const events = await prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { startAt: "desc" },
    include: {
      _count: { select: { votes: true, submissions: true } },
    },
  });

  const openEvents = events.filter((event) => isEventAcceptingResponses(event)).length;
  const totalVotes = events.reduce((sum, event) => sum + event._count.votes, 0);
  const totalRuns = events.reduce((sum, event) => sum + event._count.submissions, 0);

  const [myVoteCount, mySubmissions] = await Promise.all([
    prisma.eventVote.count({ where: { userId: user.id } }),
    prisma.submission.findMany({
      where: { userId: user.id, status: "APPROVED" },
      select: { distanceKm: true, totalPoints: true },
    }),
  ]);

  const myDistanceKm = mySubmissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const myPoints = mySubmissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const momentum = Math.min(100, Math.max(16, openEvents * 22 + totalVotes * 6 + totalRuns * 12));
  const nextEvent = events.find((event) => isEventAcceptingResponses(event)) || events[0];

  return (
    <>
      <section className="cn-app-hero member-cn-app-hero">
        <div className="cn-hero-noise" aria-hidden="true" />
        <div className="cn-hero-left">
          <div className="cn-live-pill"><span className="pulse-dot" />{homeContent.heroEyebrow}</div>
          <h1>{homeContent.heroTitle}</h1>
          <div className="cn-hero-rich">
            <EventDescription text={homeContent.heroDescription} />
          </div>

          <div className="cn-hero-actions">
            <LoadingLink className="button cn-main-cta" href="#events">
              View events
            </LoadingLink>
            <LoadingLink className="button cn-glass-cta" href="/account" loadingLabel="Opening account...">
              My account
            </LoadingLink>
          </div>

          <div className="cn-proof-strip">
            <span>{myPoints} pts</span>
            <span>{myDistanceKm.toFixed(1)} km</span>
            <span>{myVoteCount} votes</span>
          </div>
        </div>

        <div className="cn-miniapp-phone member-cn-phone">
          <div className="cn-phone-header">
            <span className="phone-avatar">跑</span>
            <div>
              <strong>{user.name}</strong>
              <small>Runner pass active</small>
            </div>
            <span className="cn-phone-pill">LIVE</span>
          </div>

          <div className="cn-redpacket-card">
            <span>My score wallet</span>
            <strong>{myPoints} pts</strong>
            <small>{myDistanceKm.toFixed(1)}km submitted · {myVoteCount} votes</small>
          </div>

          <div className="cn-mini-progress">
            <div><strong>{openEvents}</strong><span>Open</span></div>
            <div><strong>{totalVotes}</strong><span>Votes</span></div>
            <div><strong>{totalRuns}</strong><span>Runs</span></div>
          </div>

          <div className="cn-next-focus">
            <span>Next focus</span>
            <strong>{nextEvent?.title || "Create your first event"}</strong>
            <small>{nextEvent ? formatDateTimeRange(nextEvent.startAt, nextEvent.endAt) : "Admin can add one from the dashboard."}</small>
          </div>
        </div>
      </section>

      <section className="cn-dashboard-row" aria-label="Runner dashboard">
        <div className="cn-dashboard-card hot">
          <span>Club momentum</span>
          <strong>{momentum}%</strong>
          <div className="momentum-meter" aria-label={`Club momentum ${momentum}%`}>
            <span style={{ width: `${momentum}%` }} />
          </div>
        </div>
        <div className="cn-dashboard-card">
          <span>Scoring</span>
          <strong>{scoringFormulaLabel(scoreSettings)}</strong>
          <small>{scoringDescription(scoreSettings)}</small>
        </div>
        <div className="cn-dashboard-card">
          <span>Flow</span>
          <strong>Vote → Run → Submit</strong>
          <small>Strava or manual distance accepted after ATTEND vote.</small>
        </div>
      </section>

      <section className="cn-mission-map" aria-label="How the challenge works">
        <article>
          <span>01</span>
          <strong>Vote</strong>
          <small>Green attend, red not attend.</small>
        </article>
        <article>
          <span>02</span>
          <strong>Run</strong>
          <small>Complete the workout session.</small>
        </article>
        <article>
          <span>03</span>
          <strong>Submit</strong>
          <small>Sync Strava or key in distance.</small>
        </article>
        <article>
          <span>04</span>
          <strong>Share</strong>
          <small>Post result and motivate the club.</small>
        </article>
      </section>

      <section id="events" className="cn-section-title">
        <span className="eyebrow">Member event board</span>
        <h2>Choose your next mission.</h2>
        <p>Tap an event to vote, submit distance, view leaderboard, and share your result.</p>
      </section>

      <div className="cn-event-grid">
        {events.map((event, index) => {
          const displayStatus = eventDisplayStatus(event);

          return (
            <article className="cn-event-card" key={event.id}>
              <div className="cn-event-rank">#{String(index + 1).padStart(2, "0")}</div>
              <div className="cn-event-top">
                <span className={statusClass(displayStatus)}>{displayStatus}</span>
                <span className="event-meta">{event._count.votes} votes · {event._count.submissions} runs</span>
              </div>

              <h2>{event.title}</h2>
              <p className="date-pill">{formatDateTimeRange(event.startAt, event.endAt)}</p>

              {event.description && (
                <div className="workout-preview">
                  <EventDescription text={event.description} compact fullHref={`/events/${event.slug}`} />
                </div>
              )}

              <div className="cn-event-footer">
                <div>
                  <strong>{event._count.submissions}</strong>
                  <span>runs submitted</span>
                </div>
                <LoadingLink className="button full cn-main-cta" href={`/events/${event.slug}`}>
                  Enter workout →
                </LoadingLink>
              </div>
            </article>
          );
        })}

        {events.length === 0 && (
          <div className="card empty-card">
            <div className="runner-badge">🏁</div>
            <h2>No events yet</h2>
            <p className="muted">Ask an admin to create the first running event.</p>
          </div>
        )}
      </div>
    </>
  );
}
