import { LoadingLink } from "@/components/LoadingLink";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime } from "@/lib/datetime";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { getUserPointWallet, redemptionStatusClass } from "@/lib/redemptions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [votes, submissions, stravaToken, wallet, redemptions] = await Promise.all([
    prisma.eventVote.findMany({
      where: { userId: user.id },
      include: { event: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { userId: user.id },
      include: { event: true, activity: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stravaToken.findUnique({ where: { userId: user.id } }),
    getUserPointWallet(user.id),
    prisma.redemption.findMany({
      where: { userId: user.id },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const approvedSubmissions = submissions.filter((submission) => submission.status === "APPROVED");
  const totalPoints = approvedSubmissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const totalDistance = approvedSubmissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const attendVotes = votes.filter((vote) => vote.status === "ATTEND").length;

  return (
    <>
      <section className="account-summary-hero" aria-label="Account summary">
        <div className="account-summary-copy">
          <span className="eyebrow">My account</span>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="account-summary-score wallet-card-safe" aria-label="Available redemption points">
          <span>Available points</span>
          <strong>{wallet.availablePoints}</strong>
          <small>{totalPoints} earned · {wallet.spentOrReserved} reserved/spent</small>
          <LoadingLink className="button ghost mini" href="/redemptions">Redeem points</LoadingLink>
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
          <h2>{approvedSubmissions.length}</h2>
          <p className="muted">{totalDistance.toFixed(2)}km total distance</p>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Attendance</span>
          <h2>{attendVotes}</h2>
          <p className="muted">Attend votes submitted</p>
        </div>
      </div>

      <section className="account-profile-card" aria-labelledby="profile-details-title">
        <div className="account-profile-glow" aria-hidden="true" />
        <div className="account-profile-header">
          <div className="account-avatar" aria-hidden="true">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="account-profile-copy">
            <span className="eyebrow">Profile details</span>
            <h2 id="profile-details-title">{user.name}</h2>
            <p>{user.email}</p>
          </div>
          <div className="account-badge-stack">
            <span className="account-role-badge">{user.role}</span>
            <span className={stravaToken ? "account-strava-badge connected" : "account-strava-badge"}>
              {stravaToken ? "Strava connected" : "Strava not connected"}
            </span>
          </div>
        </div>

        <div className="account-profile-metrics" aria-label="Runner summary">
          <div>
            <span>Available points</span>
            <strong>{wallet.availablePoints}</strong>
            <small>Ready to redeem</small>
          </div>
          <div>
            <span>Total points</span>
            <strong>{totalPoints}</strong>
            <small>Approved score</small>
          </div>
          <div>
            <span>Total distance</span>
            <strong>{totalDistance.toFixed(2)}km</strong>
            <small>Submitted runs</small>
          </div>
          <div>
            <span>Attend votes</span>
            <strong>{attendVotes}</strong>
            <small>Club sessions</small>
          </div>
          <div>
            <span>Run records</span>
            <strong>{approvedSubmissions.length}</strong>
            <small>Approved entries</small>
          </div>
        </div>
      </section>


      <div className="card redemption-mini-card">
        <div className="section-title-row">
          <div>
            <h2>Redemption wallet</h2>
            <p className="muted">Redeem items or vouchers using your available points.</p>
          </div>
          <LoadingLink className="button" href="/redemptions">Open reward store</LoadingLink>
        </div>
        <div className="grid grid-3">
          <div className="mini-wallet-stat"><span>Available</span><strong>{wallet.availablePoints}</strong></div>
          <div className="mini-wallet-stat"><span>Earned</span><strong>{wallet.totalEarned}</strong></div>
          <div className="mini-wallet-stat"><span>Reserved / spent</span><strong>{wallet.spentOrReserved}</strong></div>
        </div>
        {redemptions.length > 0 && (
          <div className="redemption-history-strip">
            {redemptions.slice(0, 3).map((redemption) => (
              <div key={redemption.id}>
                <span className={redemptionStatusClass(redemption.status)}>{redemption.status}</span>
                <strong>{redemption.reward.name}</strong>
                <small>{redemption.pointsCost} pts</small>
              </div>
            ))}
          </div>
        )}
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
                    <LoadingLink href={`/events/${vote.event.slug}`}>{vote.event.title}</LoadingLink>
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
                <th>Status</th>
                <th>Points</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <LoadingLink href={`/events/${submission.event.slug}`}>{submission.event.title}</LoadingLink>
                  </td>
                  <td>{submission.activity.name}</td>
                  <td>{submission.distanceKm.toString()}km</td>
                  <td>
                    <span className={submission.status === "APPROVED" ? "badge success" : submission.status === "PENDING" ? "badge warning" : "badge danger"}>
                      {submission.status}
                    </span>
                  </td>
                  <td>{submission.status === "APPROVED" ? submission.totalPoints : "—"}</td>
                  <td>{formatDateTime(submission.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {submissions.length === 0 && <p className="muted">No run submissions yet.</p>}
      </div>
    </>
  );
}
