import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeRange } from "@/lib/datetime";
import { EventDescription } from "@/components/EventDescription";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "OPEN") return "badge success";
  if (status === "CLOSED") return "badge danger";
  return "badge";
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const events = await prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { startAt: "desc" },
    include: {
      _count: { select: { votes: true, submissions: true } },
    },
  });

  const openEvents = events.filter((event) => event.status === "OPEN").length;
  const totalVotes = events.reduce((sum, event) => sum + event._count.votes, 0);
  const totalRuns = events.reduce((sum, event) => sum + event._count.submissions, 0);

  return (
    <>
      <section className="hero run-hero">
        <div className="hero-copy">
          <span className="eyebrow">Mobile running challenge</span>
          <h1>Run. Vote. Sync. Score.</h1>
          <p>
            Join club sessions, confirm attendance, submit Strava runs, climb the leaderboard,
            and share your finish with the team.
          </p>
          <div className="hero-actions">
            <Link className="button" href={user ? "#events" : "/register"}>
              {user ? "View events" : "Join the run"}
            </Link>
            <Link className="button ghost dark-ghost" href="/login">
              {user ? "My account" : "Login"}
            </Link>
          </div>
        </div>

        <div className="hero-panel" aria-label="Scoring summary">
          <div className="track-lines" />
          <div className="runner-badge">🏃</div>
          <p className="panel-label">Scoring</p>
          <div className="panel-score">1 + 2/km</div>
          <p className="panel-note">Attend = 1 point · Every completed 1km = 2 points</p>
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

      {!user && (
        <div className="card callout-card">
          <div>
            <span className="eyebrow">New runner?</span>
            <h2>Register before your next session.</h2>
            <p className="muted">Create an account to vote, connect Strava and submit event runs.</p>
          </div>
          <div className="row">
            <Link className="button" href="/register">
              Register
            </Link>
            <Link className="button ghost" href="/login">
              Login
            </Link>
          </div>
        </div>
      )}

      <section id="events" className="section-heading">
        <div>
          <span className="eyebrow">Upcoming sessions</span>
          <h2>Event board</h2>
        </div>
        <p className="muted">Tap an event to vote, sync Strava and submit your run.</p>
      </section>

      <div className="event-grid">
        {events.map((event) => (
          <article className="event-card" key={event.id}>
            <div className="event-card-top">
              <span className={statusClass(event.status)}>{event.status}</span>
              <span className="event-meta">{event._count.votes} votes · {event._count.submissions} runs</span>
            </div>

            <h2>{event.title}</h2>
            <p className="date-pill">{formatDateTimeRange(event.startAt, event.endAt)}</p>

            {event.description && (
              <div className="workout-preview">
                <EventDescription text={event.description} compact />
              </div>
            )}

            <Link className="button full" href={`/events/${event.slug}`}>
              View event
            </Link>
          </article>
        ))}

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
