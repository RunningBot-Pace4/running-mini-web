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
import { eventDisplayStatus, isEventAcceptingResponses } from "@/lib/event-window";
import { closeExpiredOpenEventIfNeeded } from "@/lib/event-maintenance";
import { eventTypeClass, getClubEventType } from "@/lib/event-types";

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

  const rawEvent = await prisma.event.findUnique({
    where: { slug },
    include: {
      submissions: {
        include: { user: true, activity: true },
        orderBy: { totalPoints: "desc" },
      },
    },
  });

  if (!rawEvent) redirect("/");

  const event = await closeExpiredOpenEventIfNeeded(rawEvent);

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

  const approvedSubmissions = event.submissions.filter((submission) => submission.status === "APPROVED");

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

  const totalDistance = approvedSubmissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const totalPoints = approvedSubmissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const eventType = getClubEventType(event.type);

  return (
    <>
      <section className="cn-event-detail-hero">
        <div className="cn-event-hero-copy">
          <span className={statusClass(displayStatus)}>{displayStatus}</span>
          <span className={eventTypeClass(event.type)}>{eventType.icon} {eventType.label}</span>
          <h1>{event.title}</h1>
          <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
          <div className="cn-event-chips">
            <span>🧾 {approvedSubmissions.length} approved</span>
            <span>📏 {totalDistance.toFixed(1)}km total</span>
            <span>🏆 {totalPoints} points</span>
          </div>
        </div>

        <div className="cn-event-score-ticket premium-score-ticket">
          <span>Points rule</span>
          <div className="score-ticket-grid">
            <strong>{scoreSettings.attendancePoints}</strong>
            <small>Attend</small>
            <strong>{scoreSettings.perKmPoints}</strong>
            <small>Per km</small>
          </div>
          <p>{scoringDescription(scoreSettings)}</p>
        </div>
      </section>

      <section className="cn-workout-board">
        <div className="cn-board-header">
          <div>
            <span className="eyebrow">Workout plan</span>
            <h2>Session mission</h2>
          </div>
          <span className="cn-board-badge">WORKOUT</span>
        </div>
        {event.description ? (
          <EventDescription text={event.description} />
        ) : (
          <p className="muted">No event description yet.</p>
        )}
        <div className="score-note">
          {scoringDescription(scoreSettings)}
          {scoreSettings.requireSubmissionApproval ? " · Admin approval required before points count." : ""}
        </div>
      </section>

      {(stravaError || syncError || stravaConnected) && (
        <div className="card cn-alert-card">
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
        <div className="cn-locked-panel">
          <div>
            <span className="eyebrow">Member action locked</span>
            <h2>Login to vote, submit distance and join the leaderboard.</h2>
            <p>Register your runner pass to unlock attendance voting, Strava sync, manual distance and result sharing.</p>
          </div>
          <div className="row">
            <LoadingLink className="button cn-main-cta" href="/register">
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
          <section className="cn-action-flow" aria-label="Event action flow">
            <div className="cn-flow-card vote-flow">
              <div className="cn-flow-step">01</div>
              <h2>Attendance vote</h2>
              <p className="muted">
                Current vote: <strong>{vote?.status || "No vote yet"}</strong>
              </p>
              {!isOpen && <p className="error">This event is closed. New votes are disabled.</p>}
              <VoteButtons eventId={event.id} currentStatus={vote?.status} action={voteAction} disabled={!isOpen} />
            </div>

            <div className="cn-flow-card strava-flow">
              <div className="cn-flow-step">02</div>
              <h2>Connect and sync</h2>
              {stravaToken ? (
                <>
                  <p className="success-text">Strava connected.</p>
                  <LoadingLink className="button cn-main-cta" href={`/api/strava/sync?eventId=${event.id}`}>
                    Sync event runs
                  </LoadingLink>
                </>
              ) : (
                <>
                  <p className="muted">Connect Strava to fetch activities, or submit manual distance after voting ATTEND.</p>
                  <LoadingLink className="button cn-main-cta" href={`/api/strava/connect?next=/events/${event.slug}`}>
                    Connect Strava
                  </LoadingLink>
                </>
              )}
            </div>

            <div className="cn-flow-card submit-flow">
              <div className="cn-flow-step">03</div>
              <h2>Submit distance</h2>
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
          </section>

          {mySubmissions.length > 0 && (
            <section className="cn-submission-wallet">
              <div>
                <span className="eyebrow">My result wallet</span>
                <h2>Your submissions</h2>
              </div>
              <div className="cn-submission-grid">
                {mySubmissions.map((submission) => (
                  <article className="cn-submission-card" key={submission.id}>
                    <span className={submission.status === "APPROVED" ? "success-text" : submission.status === "PENDING" ? "pending-text" : "error"}>
                      {submission.status}
                    </span>
                    <strong>{submission.status === "APPROVED" ? `${submission.totalPoints} pts` : "Waiting review"}</strong>
                    <p>
                      {submission.activity.name} · {submission.distanceKm.toString()}km
                    </p>
                    {submission.status === "APPROVED" ? (
                      <LoadingLink className="button full" href={`/share/${submission.id}`}>
                        Share result
                      </LoadingLink>
                    ) : (
                      <p className="muted">Admin approval is required before points count and sharing unlocks.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="cn-leaderboard-card">
        <div className="cn-board-header">
          <div>
            <span className="eyebrow">Leaderboard</span>
            <h2>Club ranking</h2>
          </div>
          <span className="cn-board-badge">RANKING</span>
        </div>
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
              {approvedSubmissions.map((submission, index) => (
                <tr key={submission.id}>
                  <td><strong>#{index + 1}</strong> {submission.user.name}</td>
                  <td>{submission.activity.name}</td>
                  <td>{submission.distanceKm.toString()}km</td>
                  <td>{submission.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {approvedSubmissions.length === 0 && <p className="muted">No approved submissions yet.</p>}
      </section>

      <LoadingLink className="button ghost full" href="/">
        Back to home
      </LoadingLink>
    </>
  );
}
