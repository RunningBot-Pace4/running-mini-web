import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { voteAction, submitActivityAction, submitManualDistanceAction } from "@/app/events/actions";
import { SubmitRunForm } from "@/components/SubmitRunForm";
import { EventDescription } from "@/components/EventDescription";
import { VoteButtons } from "@/components/VoteButtons";
import { LoadingLink } from "@/components/LoadingLink";
import { formatDateTimeRange } from "@/lib/datetime";
import { getScoreSettings, scoringDescription } from "@/lib/scoring";
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
  const myApprovedPoints = mySubmissions
    .filter((submission) => submission.status === "APPROVED")
    .reduce((sum, submission) => sum + submission.totalPoints, 0);

  return (
    <section className="event-mobile-shell">
      <div className="event-compact-hero">
        <div className="event-compact-hero-main">
          <div className="event-chip-row">
            <span className={statusClass(displayStatus)}>{displayStatus}</span>
            <span className={eventTypeClass(event.type)}>{eventType.icon} {eventType.label}</span>
          </div>
          <h1>{event.title}</h1>
          <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
        </div>

        <div className="event-compact-stats" aria-label="Event summary">
          <article><strong>{approvedSubmissions.length}</strong><span>approved</span></article>
          <article><strong>{totalDistance.toFixed(1)}</strong><span>km</span></article>
          <article><strong>{totalPoints}</strong><span>points</span></article>
        </div>
      </div>

      {(stravaError || syncError || stravaConnected) && (
        <div className="event-compact-alert">
          {stravaConnected && <p className="success-text">Strava connected successfully.</p>}
          {stravaError && (
            <p className="error">
              Strava link failed: {stravaError}. Please check the Strava callback domain and Vercel environment variables.
            </p>
          )}
          {syncError && <p className="error">Strava sync failed: {syncError}</p>}
        </div>
      )}

      <div className="event-compact-layout">
        <article className="event-compact-card event-summary-card">
          <div className="event-compact-card-head">
            <span className="eyebrow">Summary</span>
            <strong>{isOpen ? "Open for members" : "Closed"}</strong>
          </div>
          <div className="event-summary-list">
            <div><span>Attendance</span><strong>{vote?.status || "No vote yet"}</strong></div>
            <div><span>Your points here</span><strong>{myApprovedPoints} pts</strong></div>
            <div><span>Scoring</span><strong>{scoreSettings.attendancePoints} attend + {scoreSettings.perKmPoints}/km</strong></div>
          </div>
          <p className="muted">{scoringDescription(scoreSettings)}{scoreSettings.requireSubmissionApproval ? " Admin approval required." : ""}</p>
        </article>

        <article className="event-compact-card workout-card">
          <div className="event-compact-card-head">
            <span className="eyebrow">Workout plan</span>
            <strong>Mission</strong>
          </div>
          {event.description ? (
            <EventDescription text={event.description} />
          ) : (
            <p className="muted">No event description yet.</p>
          )}
        </article>

        {!user && (
          <article className="event-compact-card event-login-card">
            <div>
              <span className="eyebrow">Member action locked</span>
              <h2>Login to vote, submit distance and join the leaderboard.</h2>
              <p>Register your runner pass to unlock attendance voting, Strava sync, manual distance and result sharing.</p>
            </div>
            <div className="row">
              <LoadingLink className="button" href="/register" loadingLabel="Opening registration...">
                Register
              </LoadingLink>
              <LoadingLink className="button ghost" href="/login" loadingLabel="Opening login...">
                Login
              </LoadingLink>
            </div>
          </article>
        )}

        {user && (
          <>
            <article className="event-compact-card attendance-card">
              <div className="event-compact-card-head">
                <span className="eyebrow">Attendance</span>
                <strong>{vote?.status || "Choose one"}</strong>
              </div>
              {!isOpen && <p className="error">This event is closed. New votes are disabled.</p>}
              <VoteButtons eventId={event.id} currentStatus={vote?.status} action={voteAction} disabled={!isOpen} />
            </article>

            <article className="event-compact-card submit-distance-card">
              <div className="event-compact-card-head">
                <span className="eyebrow">Submit distance</span>
                <strong>{canSubmitRun ? "Ready" : "Locked"}</strong>
              </div>

              <div className="strava-mini-panel">
                {stravaToken ? (
                  <>
                    <span className="success-text">Strava connected</span>
                    <LoadingLink className="button ghost" href={`/api/strava/sync?eventId=${event.id}`} loadingLabel="Syncing event runs...">
                      Sync runs
                    </LoadingLink>
                  </>
                ) : (
                  <>
                    <span className="muted">Connect Strava, or submit manual distance after voting ATTEND.</span>
                    <LoadingLink className="button ghost" href={`/api/strava/connect?next=/events/${event.slug}`} loadingLabel="Opening Strava...">
                      Connect Strava
                    </LoadingLink>
                  </>
                )}
              </div>

              <SubmitRunForm
                eventId={event.id}
                activities={activities}
                stravaAction={submitActivityAction}
                manualAction={submitManualDistanceAction}
                disabled={!isOpen}
                canSubmit={canSubmitRun}
                blockedReason={submitBlockedReason}
              />
            </article>

            {mySubmissions.length > 0 && (
              <article className="event-compact-card my-results-card">
                <div className="event-compact-card-head">
                  <span className="eyebrow">My results</span>
                  <strong>{mySubmissions.length} submitted</strong>
                </div>
                <div className="event-mini-result-list">
                  {mySubmissions.map((submission) => (
                    <div key={submission.id}>
                      <span className={submission.status === "APPROVED" ? "success-text" : submission.status === "PENDING" ? "pending-text" : "error"}>
                        {submission.status}
                      </span>
                      <strong>{submission.distanceKm.toString()}km · {submission.status === "APPROVED" ? `${submission.totalPoints} pts` : "Waiting review"}</strong>
                      {submission.status === "APPROVED" && (
                        <LoadingLink className="button ghost" href={`/share/${submission.id}`} loadingLabel="Opening share card...">
                          Share
                        </LoadingLink>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            )}
          </>
        )}

        <article className="event-compact-card leaderboard-card">
          <div className="event-compact-card-head">
            <span className="eyebrow">Leaderboard</span>
            <strong>{approvedSubmissions.length} ranked</strong>
          </div>
          <div className="event-leaderboard-list">
            {approvedSubmissions.map((submission, index) => (
              <div key={submission.id}>
                <span>#{index + 1}</span>
                <div>
                  <strong>{submission.user.name}</strong>
                  <small>{submission.activity.name}</small>
                </div>
                <em>{submission.distanceKm.toString()}km</em>
                <b>{submission.totalPoints} pts</b>
              </div>
            ))}
          </div>
          {approvedSubmissions.length === 0 && <p className="muted">No approved submissions yet.</p>}
        </article>
      </div>

      <LoadingLink className="button ghost full" href="/events" loadingLabel="Opening events...">
        Back to events
      </LoadingLink>
    </section>
  );
}
