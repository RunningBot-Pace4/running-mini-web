import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { voteAction, submitActivityAction } from "@/app/events/actions";
import { SubmitRunForm } from "@/components/SubmitRunForm";
import { EventDescription } from "@/components/EventDescription";
import { VoteButtons } from "@/components/VoteButtons";
import { formatDateTimeRange } from "@/lib/datetime";
import { getScoreSettings, scoringDescription, scoringFormulaLabel } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "OPEN") return "badge success";
  if (status === "CLOSED") return "badge danger";
  return "badge";
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const stravaError = typeof query.strava_error === "string" ? query.strava_error : "";
  const syncError = typeof query.sync_error === "string" ? query.sync_error : "";
  const stravaConnected = query.strava_connected === "1";
  const user = await getCurrentUser();
  const scoreSettings = await getScoreSettings();

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      submissions: {
        where: { status: "APPROVED" },
        include: { user: true, activity: true },
        orderBy: { totalPoints: "desc" },
      },
    },
  });

  if (!event) redirect("/");

  const vote = user
    ? await prisma.eventVote.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: user.id } },
      })
    : null;

  const stravaToken = user
    ? await prisma.stravaToken.findUnique({ where: { userId: user.id } })
    : null;

  const activities = user
    ? await prisma.stravaActivity.findMany({
        where: {
          userId: user.id,
          startDate: { gte: event.startAt, lte: event.endAt },
        },
        orderBy: { startDate: "desc" },
      })
    : [];

  const mySubmissions = user
    ? event.submissions.filter((submission) => submission.userId === user.id)
    : [];
  const isOpen = event.status === "OPEN";

  return (
    <>
      <section className="hero event-hero-detail">
        <div>
          <span className={statusClass(event.status)}>{event.status}</span>
          <h1>{event.title}</h1>
          <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
        </div>
        <div className="mini-score-card">
          <span>Scoring</span>
          <strong>{scoringFormulaLabel(scoreSettings)}</strong>
          <small>Attendance + completed kilometres</small>
        </div>
      </section>

      <div className="card workout-card">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Workout plan</span>
            <h2>Session details</h2>
          </div>
        </div>
        {event.description ? (
          <EventDescription text={event.description} />
        ) : (
          <p className="muted">No event description yet.</p>
        )}
        <div className="score-note">{scoringDescription(scoreSettings)}</div>
      </div>

      {(stravaError || syncError || stravaConnected) && (
        <div className="card">
          {stravaConnected && <p className="success-text">Strava connected successfully.</p>}
          {stravaError && (
            <p className="error">
              Strava link failed: {stravaError}. Please check the Strava callback domain and Vercel environment variables.
            </p>
          )}
          {syncError && <p className="error">Strava sync failed: {syncError}</p>}
        </div>
      )}

      {!user && (
        <div className="card">
          <h2>Login required</h2>
          <p className="muted">Register or login to vote, connect Strava and submit your run.</p>
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

      {user && (
        <>
          <div className="card">
            <h2>1. Attendance vote</h2>
            <p className="muted">
              Current vote: <strong>{vote?.status || "No vote yet"}</strong>
            </p>
            {!isOpen && <p className="error">This event is closed. New votes are disabled.</p>}
            <VoteButtons eventId={event.id} action={voteAction} disabled={!isOpen} />
          </div>

          <div className="card">
            <h2>2. Connect and sync Strava</h2>
            {stravaToken ? (
              <>
                <p className="success-text">Strava connected.</p>
                <a className="button" href={`/api/strava/sync?eventId=${event.id}`}>
                  Sync event runs
                </a>
              </>
            ) : (
              <>
                <p className="muted">Connect Strava to fetch your running activities for this event.</p>
                <a className="button" href={`/api/strava/connect?next=/events/${event.slug}`}>
                  Connect Strava
                </a>
              </>
            )}
          </div>

          <div className="card">
            <h2>3. Submit run</h2>
            <p className="muted">Only Strava runs inside this event date range can be submitted.</p>
            <SubmitRunForm eventId={event.id} activities={activities} action={submitActivityAction} disabled={!isOpen} />
          </div>

          {mySubmissions.length > 0 && (
            <div className="card">
              <h2>Your submissions</h2>
              {mySubmissions.map((submission) => (
                <div className="card" key={submission.id}>
                  <div className="score">{submission.totalPoints} pts</div>
                  <p>
                    {submission.activity.name} · {submission.distanceKm.toString()}km
                  </p>
                  <Link className="button full" href={`/share/${submission.id}`}>
                    Share result
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="card">
        <h2>Leaderboard</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Runner</th>
                <th>Run</th>
                <th>Distance</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {event.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.user.name}</td>
                  <td>{submission.activity.name}</td>
                  <td>{submission.distanceKm.toString()}km</td>
                  <td>{submission.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {event.submissions.length === 0 && <p className="muted">No approved submissions yet.</p>}
      </div>
    </>
  );
}
