import type { CSSProperties } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime } from "@/lib/datetime";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { getUserPointWallet, redemptionStatusClass } from "@/lib/redemptions";
import { buildBadges, buildChallenges, getMemberTier, MEMBER_TIERS } from "@/lib/member-progress";

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
  const tierProgress = getMemberTier(totalPoints);
  const badges = buildBadges({
    attendVotes,
    approvedRuns: approvedSubmissions.length,
    totalDistance,
    totalPoints,
    redemptionCount: redemptions.length,
  });
  const challenges = buildChallenges({
    attendVotes,
    approvedRuns: approvedSubmissions.length,
    totalDistance,
    totalPoints,
    redemptionCount: redemptions.length,
  });
  const earnedBadgeCount = badges.filter((badge) => badge.earned).length;

  return (
    <>
      <section className="activ-dashboard-hero" aria-label="Member dashboard summary">
        <div className="activ-dashboard-main">
          <span className="eyebrow">Member dashboard</span>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <div className="activ-member-pills">
            <span className="activ-tier-pill" style={{ "--tier-color": tierProgress.current.color } as CSSProperties}>
              {tierProgress.current.emoji} {tierProgress.current.name} tier
            </span>
            <span className={stravaToken ? "activ-status-pill connected" : "activ-status-pill"}>
              {stravaToken ? "Strava connected" : "Strava not connected"}
            </span>
          </div>
        </div>

        <div className="activ-wallet-panel">
          <span>Available points</span>
          <strong>{wallet.availablePoints}</strong>
          <small>{totalPoints} earned · {wallet.spentOrReserved} reserved/spent</small>
          <LoadingLink className="button" href="/redemptions">Redeem rewards</LoadingLink>
        </div>
      </section>

      <section className="activ-tier-card" aria-label="Member tier progress">
        <div>
          <span className="eyebrow">Tier progress</span>
          <h2>{tierProgress.current.emoji} {tierProgress.current.name}</h2>
          <p>{tierProgress.current.benefit}</p>
          <strong className="activ-tier-benefit">{tierProgress.current.discount}</strong>
        </div>
        <div className="activ-tier-progress-box">
          <div className="activ-progress-head">
            <span>{tierProgress.current.name}</span>
            <span>{tierProgress.next ? tierProgress.next.name : "Max tier"}</span>
          </div>
          <div className="activ-progress-bar"><span style={{ width: `${tierProgress.progress}%` }} /></div>
          <p>{tierProgress.next ? `${tierProgress.pointsToNext} pts to unlock ${tierProgress.next.name}` : "Highest tier unlocked. Keep defending your rank."}</p>
        </div>
      </section>

      <div className="activ-stat-grid">
        <article><span>Total points</span><strong>{totalPoints}</strong><small>Approved score</small></article>
        <article><span>Total distance</span><strong>{totalDistance.toFixed(2)}km</strong><small>Submitted runs</small></article>
        <article><span>Attend votes</span><strong>{attendVotes}</strong><small>Club sessions</small></article>
        <article><span>Badges</span><strong>{earnedBadgeCount}/{badges.length}</strong><small>Achievements earned</small></article>
      </div>

      <section className="activ-section-card">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">Monthly style challenges</span>
            <h2>Challenge board</h2>
            <p className="muted">Complete missions to earn badges, climb tiers, and unlock better rewards.</p>
          </div>
          <LoadingLink className="button ghost" href="/">Join events</LoadingLink>
        </div>
        <div className="activ-challenge-grid">
          {challenges.map((challenge) => (
            <article className={challenge.completed ? "activ-challenge-card completed" : "activ-challenge-card"} key={challenge.key}>
              <div>
                <strong>{challenge.title}</strong>
                <p>{challenge.description}</p>
              </div>
              <span>{challenge.current}/{challenge.target} {challenge.unit}</span>
              <div className="activ-mini-progress"><i style={{ width: `${challenge.progress}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="activ-section-card">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">Achievements</span>
            <h2>Badge collection</h2>
            <p className="muted">Badges are earned automatically from attendance, approved distance, points and redemptions.</p>
          </div>
        </div>
        <div className="activ-badge-grid">
          {badges.map((badge) => (
            <article className={badge.earned ? "activ-badge-card earned" : "activ-badge-card locked"} key={badge.key}>
              <span>{badge.icon}</span>
              <strong>{badge.name}</strong>
              <p>{badge.description}</p>
              <div className="activ-mini-progress"><i style={{ width: `${badge.progress}%` }} /></div>
              <small>{badge.earned ? "Earned" : `${badge.progress}% progress`}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="activ-section-card">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">Tier benefits</span>
            <h2>What each tier unlocks</h2>
          </div>
        </div>
        <div className="activ-tier-list">
          {MEMBER_TIERS.map((tier) => (
            <article className={tier.key === tierProgress.current.key ? "activ-tier-item active" : "activ-tier-item"} key={tier.key}>
              <span style={{ "--tier-color": tier.color } as CSSProperties}>{tier.emoji}</span>
              <div>
                <strong>{tier.name}</strong>
                <small>{tier.minPoints} pts minimum</small>
              </div>
              <p>{tier.benefit}</p>
              <em>{tier.discount}</em>
            </article>
          ))}
        </div>
      </section>

      <div className="card redemption-mini-card">
        <div className="section-title-row">
          <div>
            <h2>Reward wallet</h2>
            <p className="muted">Redeem items or vouchers using your available points. Higher tiers can unlock better deals.</p>
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
                  <td><LoadingLink href={`/events/${vote.event.slug}`}>{vote.event.title}</LoadingLink></td>
                  <td><span className={vote.status === "ATTEND" ? "badge success" : "badge danger"}>{vote.status}</span></td>
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
                  <td><LoadingLink href={`/events/${submission.event.slug}`}>{submission.event.title}</LoadingLink></td>
                  <td>{submission.activity.name}</td>
                  <td>{submission.distanceKm.toString()}km</td>
                  <td><span className={submission.status === "APPROVED" ? "badge success" : submission.status === "PENDING" ? "badge warning" : "badge danger"}>{submission.status}</span></td>
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
