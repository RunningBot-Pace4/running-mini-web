import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { voteAction, submitActivityAction } from "@/app/events/actions";
import { SubmitRunForm } from "@/components/SubmitRunForm";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();

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

  return (
    <>
      <section className="hero">
        <span className={event.status === "OPEN" ? "badge success" : "badge"}>{event.status}</span>
        <h1>{event.title}</h1>
        <p>
          {event.startAt.toLocaleString()} – {event.endAt.toLocaleString()}
        </p>
      </section>

      <div className="card">
        {event.description && <p>{event.description}</p>}
        <p className="muted">Scoring: Attend = 1 point, each completed 1km = 2 points.</p>
      </div>

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
            <div className="row">
              <form action={voteAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="status" value="ATTEND" />
                <button type="submit">Attend</button>
              </form>
              <form action={voteAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="status" value="NOT_ATTEND" />
                <button className="ghost" type="submit">
                  Not attend
                </button>
              </form>
            </div>
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
                <a className="button" href="/api/strava/connect">
                  Connect Strava
                </a>
              </>
            )}
          </div>

          <div className="card">
            <h2>3. Submit run</h2>
            <p className="muted">Only Strava runs inside this event date range can be submitted.</p>
            <SubmitRunForm eventId={event.id} activities={activities} action={submitActivityAction} />
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
