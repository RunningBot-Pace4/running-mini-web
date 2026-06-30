import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getUserPointWallet, redemptionStatusClass } from "@/lib/redemptions";
import { redeemRewardAction } from "@/app/redemptions/actions";
import { RewardRedeemButton } from "@/components/RewardRedeemButton";
import { formatDateTime } from "@/lib/datetime";
import { canAccessTierReward, getMemberTier } from "@/lib/member-progress";

export const dynamic = "force-dynamic";

export default async function RedemptionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, rewards, redemptions, approvedPoints] = await Promise.all([
    getUserPointWallet(user.id),
    prisma.reward.findMany({
      where: { isActive: true },
      orderBy: [{ minTier: "asc" }, { costPoints: "asc" }, { createdAt: "desc" }],
    }),
    prisma.redemption.findMany({
      where: { userId: user.id },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.aggregate({
      where: { userId: user.id, status: "APPROVED" },
      _sum: { totalPoints: true },
    }),
  ]);

  const tierProgress = getMemberTier(approvedPoints._sum.totalPoints || 0);

  return (
    <>
      <section className="activ-store-hero">
        <div>
          <span className="eyebrow">Points redemption</span>
          <h1>Reward store</h1>
          <p>Use approved running points to redeem club items, discounts, and vouchers. Higher tiers unlock better rewards.</p>
        </div>
        <div className="activ-store-wallet">
          <span>{tierProgress.current.emoji} {tierProgress.current.name} tier</span>
          <strong>{wallet.availablePoints}</strong>
          <small>available points</small>
        </div>
      </section>

      <section className="activ-section-card">
        <span className="eyebrow">How it works</span>
        <div className="activ-store-steps">
          <article><strong>01</strong><span>Earn points from approved runs.</span></article>
          <article><strong>02</strong><span>Level up from Bronze to Platinum.</span></article>
          <article><strong>03</strong><span>Redeem eligible items or vouchers.</span></article>
          <article><strong>04</strong><span>Admin approves and prepares collection.</span></article>
        </div>
      </section>

      <section className="redemption-grid activ-reward-grid" aria-label="Available rewards">
        {rewards.map((reward) => {
          const outOfStock = reward.stockQuantity !== null && reward.stockQuantity <= 0;
          const notEnoughPoints = wallet.availablePoints < reward.costPoints;
          const tierLocked = !canAccessTierReward(tierProgress.current.key, reward.minTier);
          const disabled = outOfStock || notEnoughPoints || tierLocked;

          return (
            <article className={tierLocked ? "reward-card activ-reward-card locked" : "reward-card activ-reward-card"} key={reward.id}>
              <div className="activ-reward-topline">
                <div className={reward.type === "VOUCHER" ? "reward-icon voucher" : "reward-icon"}>{reward.type === "VOUCHER" ? "🎟️" : "🎁"}</div>
                <span className="activ-tier-lock">{reward.minTier}+</span>
              </div>
              <div className="reward-card-main">
                <span className="reward-type">{reward.type === "VOUCHER" ? "Voucher" : "Item"}</span>
                <h2>{reward.name}</h2>
                {reward.description && <p>{reward.description}</p>}
              </div>
              <div className="reward-card-footer">
                <div>
                  <strong>{reward.costPoints} pts</strong>
                  <small>{reward.stockQuantity === null ? "Unlimited" : `${reward.stockQuantity} left`}</small>
                </div>
                <RewardRedeemButton rewardId={reward.id} disabled={disabled} action={redeemRewardAction} />
              </div>
              {tierLocked && <p className="muted">Unlocks at {reward.minTier} tier.</p>}
              {outOfStock && <p className="error">Out of stock.</p>}
              {!outOfStock && !tierLocked && notEnoughPoints && <p className="muted">Need {reward.costPoints - wallet.availablePoints} more points.</p>}
            </article>
          );
        })}
      </section>

      {rewards.length === 0 && (
        <div className="empty-card">
          <h2>No rewards available yet</h2>
          <p className="muted">Please check again after admin creates the first redemption item or voucher.</p>
        </div>
      )}

      <section className="card">
        <h2>My redemption history</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Reward</th>
                <th>Type</th>
                <th>Points</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Admin note</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((redemption) => (
                <tr key={redemption.id}>
                  <td>{redemption.reward.name}</td>
                  <td>{redemption.reward.type}</td>
                  <td>{redemption.pointsCost}</td>
                  <td><span className={redemptionStatusClass(redemption.status)}>{redemption.status}</span></td>
                  <td>{formatDateTime(redemption.createdAt)}</td>
                  <td>{redemption.adminNote || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {redemptions.length === 0 && <p className="muted">No redemption requests yet.</p>}
      </section>
    </>
  );
}
