import type { CSSProperties } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime } from "@/lib/datetime";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { getUserPointWallet, redemptionStatusClass } from "@/lib/redemptions";
import { buildBadges, buildChallenges, getMemberTier, getTierDefinitions } from "@/lib/member-progress";
import { CLUB_EVENT_TYPES, eventTypeClass, getClubEventType } from "@/lib/event-types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tierDefinitions = await getTierDefinitions();

  const [votes, submissions, stravaToken, wallet, redemptions] = await Promise.all([
    prisma.eventVote.findMany({ where: { userId: user.id }, include: { event: true }, orderBy: { updatedAt: "desc" } }),
    prisma.submission.findMany({ where: { userId: user.id }, include: { event: true, activity: true }, orderBy: { createdAt: "desc" } }),
    prisma.stravaToken.findUnique({ where: { userId: user.id } }),
    getUserPointWallet(user.id),
    prisma.redemption.findMany({ where: { userId: user.id }, include: { reward: true }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const approvedSubmissions = submissions.filter((submission) => submission.status === "APPROVED");
  const totalPoints = approvedSubmissions.reduce((sum, submission) => sum + submission.totalPoints, 0);
  const totalDistance = approvedSubmissions.reduce((sum, submission) => sum + Number(submission.distanceKm), 0);
  const attendVotes = votes.filter((vote) => vote.status === "ATTEND").length;
  const tierProgress = getMemberTier(totalPoints, tierDefinitions);
  const badges = buildBadges({ attendVotes, approvedRuns: approvedSubmissions.length, totalDistance, totalPoints, redemptionCount: redemptions.length });
  const challenges = buildChallenges({ attendVotes, approvedRuns: approvedSubmissions.length, totalDistance, totalPoints, redemptionCount: redemptions.length });
  const earnedBadgeCount = badges.filter((badge) => badge.earned).length;
  const activityMix = CLUB_EVENT_TYPES.map((type) => ({
    ...type,
    count: approvedSubmissions.filter((submission) => submission.event.type === type.key).length,
  })).filter((type) => ["HYROX", "REDLINE", "MARATHON", "TRAINING", "RUNNING", "RECOVERY"].includes(type.key));

  return (
    <>
      <section className="account-mobile-pass">
        <div className="account-pass-top">
          <div className="account-avatar premium">{user.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <span className="eyebrow">My account</span>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
          <span className="app-live-pill">{user.role}</span>
        </div>

        <div className="account-pass-wallet">
          <div>
            <span>{tierProgress.current.emoji} {tierProgress.current.name} tier</span>
            <strong>{wallet.availablePoints} pts</strong>
            <small>{totalPoints} earned · {wallet.spentOrReserved} used/reserved</small>
          </div>
          <LoadingLink className="button" href="/redemptions">Rewards</LoadingLink>
        </div>

        <div className="account-tier-rail" style={{ "--progress": `${tierProgress.progress}%`, "--tier-color": tierProgress.current.color } as CSSProperties}>
          <div className="account-tier-rail-head">
            <strong>{tierProgress.current.name} journey</strong>
            <span>{tierProgress.next ? `${tierProgress.pointsToNext} pts to ${tierProgress.next.name}` : "Highest tier"}</span>
          </div>
          <div className="account-meter-bar"><i style={{ width: `${tierProgress.progress}%` }} /></div>
          <p>{tierProgress.current.benefit}</p>
        </div>

        <div className="account-pass-status-row">
          <span className={stravaToken ? "account-status-pill connected" : "account-status-pill"}>{stravaToken ? "Strava connected" : "Strava not connected"}</span>
          <span className="account-status-pill">{tierProgress.current.discount}</span>
        </div>
      </section>

      <section className="account-stat-grid modern" aria-label="Performance stats">
        <article><span>Total points</span><strong>{totalPoints}</strong><small>Approved score</small></article>
        <article><span>Total distance</span><strong>{totalDistance.toFixed(2)}km</strong><small>Approved distance</small></article>
        <article><span>Attend votes</span><strong>{attendVotes}</strong><small>Club check-ins</small></article>
        <article><span>Badges</span><strong>{earnedBadgeCount}/{badges.length}</strong><small>Achievement collection</small></article>
      </section>

      <section className="account-section-card">
        <div className="section-title-row">
          <div><span className="eyebrow">Challenge board</span><h2>Current missions</h2><p className="muted">Simple progress cards to keep members active across sessions and distance goals.</p></div>
          <LoadingLink className="button ghost" href="/">Join events</LoadingLink>
        </div>
        <div className="account-challenge-grid">
          {challenges.map((challenge) => (
            <article className={challenge.completed ? "account-challenge-card completed" : "account-challenge-card"} key={challenge.key}>
              <div><strong>{challenge.title}</strong><p>{challenge.description}</p></div>
              <span>{challenge.current}/{challenge.target} {challenge.unit}</span>
              <div className="account-progress"><i style={{ width: `${challenge.progress}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="account-section-card">
        <div className="section-title-row"><div><span className="eyebrow">Badges</span><h2>Achievement collection</h2></div></div>
        <div className="account-badge-grid">
          {badges.map((badge) => (
            <article className={badge.earned ? "account-badge-card earned" : "account-badge-card locked"} key={badge.key}>
              <span>{badge.icon}</span>
              <strong>{badge.name}</strong>
              <p>{badge.description}</p>
              <div className="account-progress"><i style={{ width: `${badge.progress}%` }} /></div>
              <small>{badge.earned ? "Earned" : `${badge.progress}% progress`}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="account-section-card">
        <div className="section-title-row"><div><span className="eyebrow">Tier benefits</span><h2>What each tier unlocks</h2></div></div>
        <div className="account-tier-list">
          {tierDefinitions.map((tier) => (
            <article className={tier.key === tierProgress.current.key ? "account-tier-item active" : "account-tier-item"} key={tier.key}>
              <span style={{ "--tier-color": tier.color } as CSSProperties}>{tier.emoji}</span>
              <div><strong>{tier.name}</strong><small>{tier.minPoints} pts minimum</small></div>
              <p>{tier.benefit}</p>
              <em>{tier.discount}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="account-section-card">
        <div className="section-title-row"><div><span className="eyebrow">Reward wallet</span><h2>Items, vouchers and club perks</h2><p className="muted">Higher tiers can unlock better rewards and discounts.</p></div><LoadingLink className="button" href="/redemptions">Open reward store</LoadingLink></div>
        <div className="account-wallet-grid">
          <article><span>Available</span><strong>{wallet.availablePoints}</strong></article>
          <article><span>Earned</span><strong>{wallet.totalEarned}</strong></article>
          <article><span>Reserved / spent</span><strong>{wallet.spentOrReserved}</strong></article>
        </div>
        {redemptions.length > 0 && (
          <div className="account-redemption-strip">
            {redemptions.slice(0, 3).map((redemption) => (
              <div key={redemption.id}><span className={redemptionStatusClass(redemption.status)}>{redemption.status}</span><strong>{redemption.reward.name}</strong><small>{redemption.pointsCost} pts</small></div>
            ))}
          </div>
        )}
      </section>

      <section className="account-section-card">
        <div className="section-title-row"><div><span className="eyebrow">Security</span><h2>Change password</h2><p className="muted">Enter your old password, new password, and confirm new password.</p></div></div>
        <ChangePasswordForm />
      </section>

      <section className="account-history-grid">
        <div className="account-section-card">
          <h2>My votes</h2>
          <div className="table-scroll"><table><thead><tr><th>Event</th><th>Type</th><th>Vote</th><th>Updated</th></tr></thead><tbody>
            {votes.map((vote) => {
              const type = getClubEventType(vote.event.type);
              return <tr key={vote.id}><td><LoadingLink href={`/events/${vote.event.slug}`}>{vote.event.title}</LoadingLink></td><td><span className={eventTypeClass(vote.event.type)}>{type.icon} {type.label}</span></td><td><span className={vote.status === "ATTEND" ? "badge success" : "badge danger"}>{vote.status}</span></td><td>{formatDateTime(vote.updatedAt)}</td></tr>;
            })}
          </tbody></table></div>
          {votes.length === 0 && <p className="muted">No attendance votes yet.</p>}
        </div>

        <div className="account-section-card">
          <h2>My submissions</h2>
          <div className="table-scroll"><table><thead><tr><th>Event</th><th>Run</th><th>Distance</th><th>Status</th><th>Points</th></tr></thead><tbody>
            {submissions.map((submission) => (
              <tr key={submission.id}><td><LoadingLink href={`/events/${submission.event.slug}`}>{submission.event.title}</LoadingLink></td><td>{submission.activity.name}</td><td>{submission.distanceKm.toString()}km</td><td><span className={submission.status === "APPROVED" ? "badge success" : submission.status === "PENDING" ? "badge warning" : "badge danger"}>{submission.status}</span></td><td>{submission.status === "APPROVED" ? submission.totalPoints : "—"}</td></tr>
            ))}
          </tbody></table></div>
          {submissions.length === 0 && <p className="muted">No run submissions yet.</p>}
        </div>
      </section>
    </>
  );
}
