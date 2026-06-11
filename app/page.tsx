import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeRange } from "@/lib/datetime";
import { EventDescription } from "@/components/EventDescription";
import { LoadingLink } from "@/components/LoadingLink";
import { getHomeContent } from "@/lib/site-content";
import { getScoreSettings, scoringDescription } from "@/lib/scoring";
import { eventDisplayStatus, isEventAcceptingResponses } from "@/lib/event-window";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";

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
  const lifestyleCards = [
    {
      icon: "💧",
      title: "Sweat with purpose",
      text: "Every vote, run, and kilometre feeds the club scoreboard.",
    },
    {
      icon: "🌤️",
      title: "Sunrise discipline",
      text: "Turn scheduled workouts into a simple mobile mission flow.",
    },
    {
      icon: "🌊",
      title: "Sea-level calm",
      text: "Clean cards, fast actions, and clear progress keep members focused.",
    },
  ];

  return (
    <>
      <section className="coastal-hero guest-coastal-hero" aria-label="Running club introduction">
        <div className="coastal-sky" aria-hidden="true">
          <span className="coastal-sun" />
          <span className="coastal-cloud cloud-one" />
          <span className="coastal-cloud cloud-two" />
          <span className="coastal-wave wave-one" />
          <span className="coastal-wave wave-two" />
        </div>

        <div className="coastal-hero-copy">
          <div className="coastal-live-chip">
            <span className="pulse-dot" />
            {homeContent.heroEyebrow || "Coastal running challenge"}
          </div>

          <h1>{homeContent.heroTitle}</h1>

          <div className="coastal-rich-copy">
            <EventDescription text={homeContent.heroDescription} />
          </div>

          <div className="coastal-hero-actions">
            <LoadingLink className="button coastal-primary-btn" href="/register" loadingLabel="Opening registration...">
              Join the club
            </LoadingLink>
            <LoadingLink className="button coastal-secondary-btn" href="/login" loadingLabel="Opening login...">
              Member login
            </LoadingLink>
          </div>

          <div className="coastal-proof-strip" aria-label="Club features">
            <span>Morning sessions</span>
            <span>Attendance vote</span>
            <span>KM scoring</span>
            <span>Share results</span>
          </div>
        </div>

        <div className="coastal-phone-card" aria-label="Mobile challenge preview">
          <div className="coastal-phone-top">
            <span className="coastal-avatar">🏃</span>
            <div>
              <strong>Run Mini</strong>
            </div>
            <em>LIVE</em>
          </div>

          <div className="coastal-ticket">
            <span>Today’s focus</span>
            <strong>Sweat · Run · Score</strong>
            <small>Complete missions and climb the club board.</small>
          </div>

          <div className="coastal-mini-route" aria-hidden="true">
            <span className="route-dot start" />
            <span className="route-dot mid" />
            <span className="route-dot end" />
            <span className="route-runner">🏃‍♂️</span>
          </div>

          <div className="coastal-task-list">
            <div><strong>01</strong><span>Register</span></div>
            <div><strong>02</strong><span>Vote</span></div>
            <div><strong>03</strong><span>Submit KM</span></div>
          </div>
        </div>
      </section>

      <section className="coastal-motto" aria-label="Running club motto">
        <span>Sweat</span>
        <strong>Sky energy. Sea rhythm. Team effort.</strong>
        <span>Repeat</span>
      </section>

      <section className="coastal-section-title">
        <span className="eyebrow">Premium mobile running club</span>
        <h2>A website that feels like a fitness app.</h2>
        <p>Designed for mobile members with strong visuals, fast actions, reward scoring, and a club-first experience.</p>
      </section>

      <div className="coastal-lifestyle-grid">
        {lifestyleCards.map((card) => (
          <article className="coastal-lifestyle-card" key={card.title}>
            <span>{card.icon}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>

      <section className="coastal-join-panel">
        <div>
          <span className="eyebrow">Members only</span>
          <h2>Login unlocks the live event board.</h2>
          <p>Members can vote attendance, connect Strava or submit manual KM, track points, and share results.</p>
        </div>
        <div className="coastal-feed-stack" aria-hidden="true">
          <span>Workout opened</span>
          <span>Attendance updated</span>
          <span>Distance submitted</span>
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

  await closeExpiredOpenEvents();

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
  const momentum = Math.min(100, Math.max(18, openEvents * 22 + totalVotes * 6 + totalRuns * 12));
  const nextEvent = events.find((event) => isEventAcceptingResponses(event)) || events[0];

  return (
    <>
      <section className="coastal-hero member-coastal-hero">
        <div className="coastal-sky" aria-hidden="true">
          <span className="coastal-sun" />
          <span className="coastal-cloud cloud-one" />
          <span className="coastal-cloud cloud-two" />
          <span className="coastal-wave wave-one" />
          <span className="coastal-wave wave-two" />
        </div>

        <div className="coastal-hero-copy">
          <div className="coastal-live-chip"><span className="pulse-dot" />{homeContent.heroEyebrow}</div>
          <h1>{homeContent.heroTitle}</h1>
          <div className="coastal-rich-copy">
            <EventDescription text={homeContent.heroDescription} />
          </div>

          <div className="coastal-hero-actions">
            <LoadingLink className="button coastal-primary-btn" href="#events">
              View events
            </LoadingLink>
            <LoadingLink className="button coastal-secondary-btn" href="/account" loadingLabel="Opening account...">
              My account
            </LoadingLink>
          </div>

          <div className="coastal-proof-strip">
            <span>{myPoints} pts</span>
            <span>{myDistanceKm.toFixed(1)} km</span>
            <span>{myVoteCount} votes</span>
          </div>
        </div>

        <div className="coastal-phone-card member-coastal-card">
          <div className="coastal-phone-top">
            <span className="coastal-avatar">🏃</span>
            <div>
              <strong>{user.name}</strong>
            </div>
            <em>LIVE</em>
          </div>

          <div className="coastal-ticket">
            <span>My score wallet</span>
            <strong>{myPoints} pts</strong>
            <small>{myDistanceKm.toFixed(1)}km submitted · {myVoteCount} votes</small>
          </div>

          <div className="coastal-stat-row">
            <div><strong>{openEvents}</strong><span>Open</span></div>
            <div><strong>{totalVotes}</strong><span>Votes</span></div>
            <div><strong>{totalRuns}</strong><span>Runs</span></div>
          </div>

          <div className="coastal-next-focus">
            <span>Next tide</span>
            <strong>{nextEvent?.title || "Create your first event"}</strong>
            <small>{nextEvent ? formatDateTimeRange(nextEvent.startAt, nextEvent.endAt) : "Admin can add one from the dashboard."}</small>
          </div>
        </div>
      </section>

      <section className="coastal-dashboard-row" aria-label="Runner dashboard">
        <div className="coastal-dashboard-card hot">
          <span>Club momentum</span>
          <strong>{momentum}%</strong>
          <div className="coastal-meter" aria-label={`Club momentum ${momentum}%`}>
            <span style={{ width: `${momentum}%` }} />
          </div>
        </div>

        <div className="coastal-dashboard-card score-rule-card">
          <div className="score-rule-top">
            <span>Points rule</span>
            <em>Admin editable</em>
          </div>
          <div className="score-rule-main">
            <strong>{scoreSettings.attendancePoints}</strong>
            <span>Attend</span>
            <strong>{scoreSettings.perKmPoints}</strong>
            <span>Per km</span>
          </div>
          <small>{scoringDescription(scoreSettings)}</small>
        </div>

        <div className="coastal-dashboard-card">
          <span>Flow</span>
          <strong>Vote → Run → Submit</strong>
          <small>Strava or manual distance accepted after ATTEND vote.</small>
        </div>
      </section>

      <section className="coastal-mission-map" aria-label="How the challenge works">
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

      <section id="events" className="coastal-section-title">
        <span className="eyebrow">Member event board</span>
        <h2>Choose your next coastal mission.</h2>
        <p>Tap an event to vote, submit distance, view leaderboard, and share your result.</p>
      </section>

      <div className="coastal-event-grid">
        {events.map((event, index) => {
          const displayStatus = eventDisplayStatus(event);

          return (
            <article className="coastal-event-card" key={event.id}>
              <div className="coastal-event-scenery" aria-hidden="true">
                <span className="coastal-event-sun" />
                <span className="coastal-event-wave one" />
                <span className="coastal-event-wave two" />
              </div>

              <div className="coastal-event-top">
                <span className="coastal-event-rank">#{String(index + 1).padStart(2, "0")}</span>
                <span className={statusClass(displayStatus)}>{displayStatus}</span>
              </div>

              <h2>{event.title}</h2>
              <p className="date-pill">{formatDateTimeRange(event.startAt, event.endAt)}</p>

              {event.description && (
                <div className="workout-preview coastal-workout-preview">
                  <EventDescription text={event.description} compact fullHref={`/events/${event.slug}`} />
                </div>
              )}

              <div className="coastal-event-footer">
                <div>
                  <strong>{event._count.votes}</strong>
                  <span>votes</span>
                </div>
                <div>
                  <strong>{event._count.submissions}</strong>
                  <span>runs</span>
                </div>
              </div>

              <LoadingLink className="button full coastal-primary-btn" href={`/events/${event.slug}`}>
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
