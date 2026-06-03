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
  return (
    <>
      <section className="china-hero guest-china-hero" aria-label="Running club introduction">
        <div className="china-hero-glow" aria-hidden="true" />
        <div className="china-hero-copy">
          <span className="china-badge">
            <span className="pulse-dot" />
            {homeContent.heroEyebrow || "Mobile running challenge"}
          </span>
          <h1>{homeContent.heroTitle}</h1>
          <div className="china-hero-description">
            <EventDescription text={homeContent.heroDescription} />
          </div>

          <div className="china-action-row">
            <LoadingLink className="button china-primary" href="/register" loadingLabel="Opening registration...">
              Join challenge
            </LoadingLink>
            <LoadingLink className="button china-secondary" href="/login" loadingLabel="Opening login...">
              Member login
            </LoadingLink>
          </div>

          <div className="china-trust-row" aria-label="Club highlights">
            <span>🏃 Club sessions</span>
            <span>🧾 Attendance vote</span>
            <span>🔥 Points race</span>
          </div>
        </div>

        <div className="china-phone-stage" aria-label="Mini app preview">
          <div className="phone-card">
            <div className="phone-top">
              <span className="phone-avatar">跑</span>
              <div>
                <strong>Run Mini Club</strong>
                <small>Challenge board live</small>
              </div>
              <span className="phone-status">LIVE</span>
            </div>
            <div className="mini-route-card">
              <span className="route-runner">🏃‍♂️</span>
              <div className="route-line">
                <span />
              </div>
              <div className="route-stats">
                <strong>Vote</strong>
                <strong>Run</strong>
                <strong>Score</strong>
              </div>
            </div>
            <div className="phone-task-list">
              <div><span>01</span><strong>Register account</strong><small>Unlock event board</small></div>
              <div><span>02</span><strong>Vote attendance</strong><small>Commit to the session</small></div>
              <div><span>03</span><strong>Submit distance</strong><small>Strava or manual</small></div>
            </div>
          </div>

          <div className="floating-medal">🏆</div>
          <div className="floating-redpacket">+2/km</div>
        </div>
      </section>

      <section className="china-section-heading">
        <div>
          <span className="eyebrow">Mini program flow</span>
          <h2>One tap path from interest to attendance.</h2>
        </div>
      </section>

      <div className="china-feature-grid">
        <article className="china-feature-card">
          <span className="feature-icon">🎯</span>
          <h3>Mission-based events</h3>
          <p>Each workout feels like a challenge, not just a plain announcement.</p>
        </article>
        <article className="china-feature-card">
          <span className="feature-icon">🧧</span>
          <h3>Reward feeling</h3>
          <p>Attendance and distance become instant progress, points, and motivation.</p>
        </article>
        <article className="china-feature-card">
          <span className="feature-icon">📣</span>
          <h3>Share-ready result</h3>
          <p>Members can share their progress and bring more runners into the club.</p>
        </article>
      </div>

      <section className="china-feed-preview" aria-label="Member-only preview">
        <div>
          <span className="eyebrow">Members only</span>
          <h2>Login to unlock the live board.</h2>
          <p>Voting, event details, distance submission, leaderboard, and account progress are shown after login.</p>
        </div>
        <div className="feed-stack" aria-hidden="true">
          <span>New event opened</span>
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
  const momentum = Math.min(100, Math.max(12, openEvents * 22 + totalVotes * 7 + totalRuns * 11));
  const nextEvent = events.find((event) => isEventAcceptingResponses(event)) || events[0];

  return (
    <>
      <section className="china-hero member-china-hero">
        <div className="china-hero-glow" aria-hidden="true" />
        <div className="china-hero-copy">
          <span className="china-badge"><span className="pulse-dot" />{homeContent.heroEyebrow}</span>
          <h1>{homeContent.heroTitle}</h1>
          <div className="china-hero-description">
            <EventDescription text={homeContent.heroDescription} />
          </div>

          <div className="china-action-row">
            <LoadingLink className="button china-primary" href="#events">
              View events
            </LoadingLink>
            <LoadingLink className="button china-secondary" href="/account" loadingLabel="Opening account...">
              My account
            </LoadingLink>
          </div>

          <div className="hero-mini-stats" aria-label="Your progress">
            <div>
              <strong>{myPoints}</strong>
              <span>my points</span>
            </div>
            <div>
              <strong>{myDistanceKm.toFixed(1)}</strong>
              <span>km</span>
            </div>
            <div>
              <strong>{myVoteCount}</strong>
              <span>votes</span>
            </div>
          </div>
        </div>

        <div className="china-phone-stage member-phone-stage" aria-label="Challenge status">
          <div className="phone-card member-phone-card">
            <div className="phone-top">
              <span className="phone-avatar">跑</span>
              <div>
                <strong>Race board live</strong>
                <small>{user.name}'s challenge pass</small>
              </div>
              <span className="phone-status">LIVE</span>
            </div>

            <div className="score-ticket-cn">
              <span>Scoring rule</span>
              <strong>{scoringFormulaLabel(scoreSettings)}</strong>
              <small>{scoringDescription(scoreSettings)}</small>
            </div>

            <div className="next-focus-cn">
              <span>Next focus</span>
              <strong>{nextEvent?.title || "Create your first event"}</strong>
              <small>{nextEvent ? formatDateTimeRange(nextEvent.startAt, nextEvent.endAt) : "Admin can add one from the dashboard."}</small>
            </div>

            <div className="mini-progress-grid">
              <div><strong>{myPoints}</strong><span>points</span></div>
              <div><strong>{myDistanceKm.toFixed(1)}</strong><span>km</span></div>
              <div><strong>{myVoteCount}</strong><span>votes</span></div>
            </div>
          </div>
          <div className="floating-medal">🏅</div>
          <div className="floating-redpacket">{momentum}% active</div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Event statistics">
        <div>
          <strong>{openEvents}</strong>
          <span>open events</span>
        </div>
        <div>
          <strong>{totalVotes}</strong>
          <span>attendance votes</span>
        </div>
        <div>
          <strong>{totalRuns}</strong>
          <span>submitted runs</span>
        </div>
      </section>

      <section className="china-engagement-board" aria-label="Interactive club board">
        <div className="engage-card main-engage">
          <span className="eyebrow">Club energy</span>
          <h2>Make the web feel alive before the run starts.</h2>
          <p>Members see points, missions, next focus and board movement without digging through menus.</p>
          <div className="energy-orbit" aria-hidden="true">
            <span>🏃</span>
            <span>🔥</span>
            <span>🏁</span>
          </div>
        </div>
        <div className="engage-card">
          <strong>Today task</strong>
          <span>Vote attendance</span>
          <small>Green = attend · Red = not attend</small>
        </div>
        <div className="engage-card">
          <strong>Submission mode</strong>
          <span>Strava / Manual</span>
          <small>Let every runner complete the flow.</small>
        </div>
        <div className="engage-card">
          <strong>Auto control</strong>
          <span>Smart close</span>
          <small>Event locks after the allowed window.</small>
        </div>
      </section>


      <section className="challenge-control-room" aria-label="Challenge control room">
        <div className="control-main">
          <span className="eyebrow">Challenge cockpit</span>
          <h2>Vote fast. Run strong. Make every session count.</h2>
          <p>
            Your members get one clear flow: choose an event, confirm attendance, submit Strava or manual distance,
            then watch the leaderboard move.
          </p>
          <div className="momentum-meter" aria-label={`Club momentum ${momentum}%`}>
            <span style={{ width: `${momentum}%` }} />
          </div>
          <small>Club momentum · {momentum}% active</small>
        </div>

        <div className="control-stack">
          <div className="control-card hot">
            <span>Next focus</span>
            <strong>{nextEvent?.title || "Create your first event"}</strong>
            <small>{nextEvent ? formatDateTimeRange(nextEvent.startAt, nextEvent.endAt) : "Admin can add one from the dashboard."}</small>
          </div>
          <div className="control-card">
            <span>Input modes</span>
            <strong>Strava + Manual</strong>
            <small>Flexible for members who forget to sync.</small>
          </div>
          <div className="control-card">
            <span>Auto control</span>
            <strong>Vote window managed</strong>
            <small>Events close automatically after the configured window.</small>
          </div>
        </div>
      </section>

      <section className="runner-dashboard" aria-label="Your runner dashboard">
        <div className="runner-pass">
          <span className="eyebrow">Runner pass</span>
          <h2>Welcome back, {user.name}</h2>
          <p>Pick your next session, lock in your attendance, and submit your run after the workout.</p>
          <div className="runner-pass-actions">
            <LoadingLink className="button" href="/account">
              View my progress
            </LoadingLink>
            <LoadingLink className="button ghost" href="#events">
              Choose event
            </LoadingLink>
          </div>
        </div>
        <div className="runner-metrics">
          <div>
            <strong>{myPoints}</strong>
            <span>my points</span>
          </div>
          <div>
            <strong>{myDistanceKm.toFixed(1)}</strong>
            <span>km submitted</span>
          </div>
          <div>
            <strong>{myVoteCount}</strong>
            <span>votes made</span>
          </div>
        </div>
      </section>

      <section className="mission-strip" aria-label="How to score">
        <div className="mission-card">
          <span>1</span>
          <strong>Vote</strong>
          <small>Commit Attend or Not attend</small>
        </div>
        <div className="mission-card">
          <span>2</span>
          <strong>Run</strong>
          <small>Complete the workout session</small>
        </div>
        <div className="mission-card">
          <span>3</span>
          <strong>Submit</strong>
          <small>Use Strava or manual distance</small>
        </div>
        <div className="mission-card">
          <span>4</span>
          <strong>Share</strong>
          <small>Post your result and motivate the crew</small>
        </div>
      </section>

      <section id="events" className="section-heading">
        <div>
          <span className="eyebrow">Member event board</span>
          <h2>Training sessions</h2>
        </div>
        <p className="muted">Tap an event to vote, sync Strava, submit manual distance and view leaderboard.</p>
      </section>

      <div className="event-grid">
        {events.map((event) => {
          const displayStatus = eventDisplayStatus(event);

          return (
            <article className="event-card" key={event.id}>
              <div className="event-card-glow" aria-hidden="true" />
              <div className="event-card-top">
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

              <LoadingLink className="button full" href={`/events/${event.slug}`}>
                Enter workout →
              </LoadingLink>
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
