import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime } from "@/lib/datetime";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [votes, submissions, stravaToken] = await Promise.all([
    prisma.eventVote.findMany({
      where: { userId: user.id },
      include: { event: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { userId: user.id, status: "APPROVED" },
      include: { event: true, activity: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stravaToken.findUnique({ where: { userId: user.id } }),
  ]);

  const totalPoints = submissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const totalDistance = submissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const attendVotes = votes.filter((vote) => vote.status === "ATTEND").length;

  return (
    <>
      <section className="hero account-hero">
        <div>
          <span className="eyebrow">My account</span>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="mini-score-card">
          <span>Total points</span>
          <strong>{totalPoints}</strong>
          <small>{totalDistance.toFixed(2)}km submitted</small>
        </div>
      </section>

      <div className="grid grid-3">
        <div className="card stat-card">
          <span className="eyebrow">Points</span>
          <h2>{totalPoints}</h2>
          <p className="muted">Approved submission points</p>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Runs</span>
          <h2>{submissions.length}</h2>
          <p className="muted">{totalDistance.toFixed(2)}km total distance</p>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Attendance</span>
          <h2>{attendVotes}</h2>
          <p className="muted">Attend votes submitted</p>
        </div>
      </div>

      <div className="card">
        <h2>Profile details</h2>
        <div className="profile-list">
          <div>
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>
          <div>
            <span>Strava</span>
            <strong>{stravaToken ? "Connected" : "Not connected"}</strong>
          </div>
        </div>
      </div>


      <div className="card">
        <h2>Change password</h2>
        <p className="muted">Enter your old password, new password, and confirm new password.</p>
        <ChangePasswordForm />
      </div>

      <div className="card">
        <h2>My votes</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Vote</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((vote) => (
                <tr key={vote.id}>
                  <td>
                    <Link href={`/events/${vote.event.slug}`}>{vote.event.title}</Link>
                  </td>
                  <td>
                    <span className={vote.status === "ATTEND" ? "badge success" : "badge danger"}>
                      {vote.status}
                    </span>
                  </td>
                  <td>{formatDateTime(vote.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {votes.length === 0 && <p className="muted">No attendance votes yet.</p>}
      </div>

      <div className="card">
        <h2>My run submissions</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Run</th>
                <th>Distance</th>
                <th>Points</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <Link href={`/events/${submission.event.slug}`}>{submission.event.title}</Link>
                  </td>
                  <td>{submission.activity.name}</td>
                  <td>{submission.distanceKm.toString()}km</td>
                  <td>{submission.totalPoints}</td>
                  <td>{formatDateTime(submission.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {submissions.length === 0 && <p className="muted">No approved run submissions yet.</p>}
      </div>
    </>
  );
}
