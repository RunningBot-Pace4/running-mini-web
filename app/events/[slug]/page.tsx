import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { voteAction, submitActivityAction, submitManualDistanceAction } from "@/app/events/actions";
import { SubmitRunForm } from "@/components/SubmitRunForm";
import { EventDescription } from "@/components/EventDescription";
import { VoteButtons } from "@/components/VoteButtons";
import { LoadingLink } from "@/components/LoadingLink";
import { formatDateTimeRange } from "@/lib/datetime";
import { getScoreSettings, scoringDescription, scoringFormulaLabel } from "@/lib/scoring";
import { autoCloseNotice, eventDisplayStatus, isEventAcceptingResponses } from "@/lib/event-window";

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
          type: { not: "Manual" },
          startDate: { gte: event.startAt, lte: event.endAt },
        },
        orderBy: { startDate: "desc" },
      })
    : [];

  const mySubmissions = user
    ? event.submissions.filter((submission) => submission.userId === user.id)
    : [];
  const isOpen = isEventAcceptingResponses(event);
  const displayStatus = eventDisplayStatus(event);
  const canSubmitRun = isOpen && vote?.status === "ATTEND";
  const submitBlockedReason = !isOpen
    ? "This event is closed. You cannot submit distance now."
    : vote?.status === "NOT_ATTEND"
      ? "You selected NOT_ATTEND, so distance submission is disabled."
      : "Please vote ATTEND before submitting your distance.";

  return (
    <>
      <section className="hero event-hero-detail">
        <div>
          <span className={statusClass(displayStatus)}>{displayStatus}</span>
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
          <p className="muted">Register or login to vote, connect Strava, or submit manual/Strava distance.</p>
          <div className="row">
            <LoadingLink className="button" href="/register">
              Register
            </LoadingLink>
            <LoadingLink className="button ghost" href="/login">
              Login
            </LoadingLink>
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
            <p className="field-help">{autoCloseNotice(event)}</p>
            {!isOpen && <p className="error">This event is closed. New votes are disabled.</p>}
            <VoteButtons eventId={event.id} currentStatus={vote?.status} action={voteAction} disabled={!isOpen} />
          </div>

          <div className="card">
            <h2>2. Connect and sync Strava</h2>
            {stravaToken ? (
              <>
                <p className="success-text">Strava connected.</p>
                <LoadingLink className="button" href={`/api/strava/sync?eventId=${event.id}`}>
                  Sync event runs
                </LoadingLink>
              </>
            ) : (
              <>
                <p className="muted">Connect Strava to fetch your running activities for this event, or use manual distance below.</p>
                <LoadingLink className="button" href={`/api/strava/connect?next=/events/${event.slug}`}>
                  Connect Strava
                </LoadingLink>
              </>
            )}
          </div>

          <div className="card">
            <h2>3. Submit run distance</h2>
            <p className="muted">Choose Strava activity or manually key in distance. Manual distance is allowed only after voting ATTEND.</p>
            <SubmitRunForm
              eventId={event.id}
              activities={activities}
              stravaAction={submitActivityAction}
              manualAction={submitManualDistanceAction}
              disabled={!isOpen}
              canSubmit={canSubmitRun}
              blockedReason={submitBlockedReason}
            />
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
                  <LoadingLink className="button full" href={`/share/${submission.id}`}>
                    Share result
                  </LoadingLink>
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

      <LoadingLink className="button ghost full" href="/">
        Back to home
      </LoadingLink>
    </>
  );
}
