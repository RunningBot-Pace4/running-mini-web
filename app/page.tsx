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
      <section className="hero run-hero intro-hero">
        <div className="hero-copy">
          <span className="eyebrow">{homeContent.heroEyebrow}</span>
          <h1>{homeContent.heroTitle}</h1>
          <div className="hero-description">
            <EventDescription text={homeContent.heroDescription} />
          </div>
          <div className="hero-actions">
            <LoadingLink className="button" href="/register">
              Join the club
            </LoadingLink>
            <LoadingLink className="button ghost dark-ghost" href="/login">
              Member login
            </LoadingLink>
          </div>
        </div>

        <div className="hero-panel intro-panel" aria-label="Running club">
          <div className="track-lines" />
          <div className="runner-badge">🏃</div>
          <p className="panel-label">Running club</p>
          <div className="panel-score">Train</div>
          <p className="panel-note">Vote attendance, submit your run, collect points, and grow stronger with the team.</p>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <span className="eyebrow">How it works</span>
          <h2>Simple flow for every runner</h2>
        </div>
      </section>

      <div className="grid grid-3">
        <div className="card stat-card">
          <span className="eyebrow">01</span>
          <h2>Register</h2>
          <p className="muted">Create your member account before joining event voting and scoring.</p>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">02</span>
          <h2>Attend</h2>
          <p className="muted">Vote Attend or Not Attend for each training event.</p>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">03</span>
          <h2>Score</h2>
          <p className="muted">Submit Strava or manual distance after attending to earn points.</p>
        </div>
      </div>

      <div className="card callout-card">
        <div>
          <span className="eyebrow">Members only</span>
          <h2>Login to view event details and submit results.</h2>
          <p className="muted">The event board, voting, distance submission, and leaderboard are shown after login.</p>
        </div>
        <div className="row">
          <LoadingLink className="button" href="/register">
            Register
          </LoadingLink>
          <LoadingLink className="button ghost" href="/login">
            Login
          </LoadingLink>
        </div>
      </div>
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

  return (
    <>
      <section className="hero run-hero">
        <div className="hero-copy">
          <span className="eyebrow">{homeContent.heroEyebrow}</span>
          <h1>{homeContent.heroTitle}</h1>
          <div className="hero-description">
            <EventDescription text={homeContent.heroDescription} />
          </div>
          <div className="hero-actions">
            <LoadingLink className="button" href="#events">
              View events
            </LoadingLink>
            <LoadingLink className="button ghost dark-ghost" href="/account">
              My account
            </LoadingLink>
          </div>
        </div>

        <div className="hero-panel" aria-label="Scoring summary">
          <div className="track-lines" />
          <div className="runner-badge">🏃</div>
          <p className="panel-label">Scoring</p>
          <div className="panel-score">{scoringFormulaLabel(scoreSettings)}</div>
          <p className="panel-note">{scoringDescription(scoreSettings)}</p>
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
                View event
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
