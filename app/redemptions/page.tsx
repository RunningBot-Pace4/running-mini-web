import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getUserPointWallet, redemptionStatusClass } from "@/lib/redemptions";
import { redeemRewardAction } from "@/app/redemptions/actions";
import { RewardRedeemButton } from "@/components/RewardRedeemButton";
import { formatDateTime } from "@/lib/datetime";
import { canAccessTierReward, getMemberTier, getTierDefinitions } from "@/lib/member-progress";

export const dynamic = "force-dynamic";

function rewardVisual(reward: { name: string; type: string }) {
  const name = reward.name.toLowerCase();
  if (name.includes("shirt") || name.includes("tee")) return "👕";
  if (name.includes("sticker")) return "🌟";
  if (name.includes("coffee")) return "☕";
  if (name.includes("discount") || name.includes("voucher")) return "🎟️";
  if (name.includes("training") || name.includes("pass")) return "🏋️";
  if (name.includes("bottle")) return "🥤";
  if (name.includes("cap")) return "🧢";
  if (name.includes("medal")) return "🏅";
  if (name.includes("sock")) return "🧦";
  return reward.type === "VOUCHER" ? "🎟️" : "🎁";
}

export default async function RedemptionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tierDefinitions = await getTierDefinitions();

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

  const tierProgress = getMemberTier(approvedPoints._sum.totalPoints || 0, tierDefinitions);
  const nextLabel = tierProgress.next ? `${tierProgress.pointsToNext} pts to ${tierProgress.next.name}` : "Highest tier";

  return (
    <>
      <section className="redeem-store-shell">
        <div className="redeem-page-head">
          <div>
            <span className="eyebrow">Reward store</span>
            <h1>Rewards / Redeem 🎁</h1>
            <p>Use your points to get club items, discount vouchers, training perks and partner rewards.</p>
          </div>
        </div>

        <div className="redeem-wallet-panel">
          <article>
            <span>Available points</span>
            <strong>{wallet.availablePoints} pts</strong>
            <small>{wallet.totalEarned} earned · {wallet.spentOrReserved} used/reserved</small>
          </article>
          <article>
            <span>Current tier</span>
            <strong>{tierProgress.current.emoji} {tierProgress.current.name} Member</strong>
            <small>{tierProgress.current.discount}</small>
          </article>
          <article>
            <span>Next tier</span>
            <strong>{tierProgress.next ? tierProgress.next.name : "Completed"}</strong>
            <small>{nextLabel}</small>
            <div className="redeem-mini-progress"><i style={{ width: `${tierProgress.progress}%` }} /></div>
          </article>
          <div className="redeem-mascot" aria-hidden="true">⭐</div>
        </div>

        <div className="reward-filter-row" aria-label="Reward filters">
          <span className="active">All</span>
          <span>Items</span>
          <span>Vouchers</span>
          <span>Bronze</span>
          <span>Silver</span>
          <span>Gold</span>
          <span>Platinum</span>
        </div>

        <section className="redeem-catalog-grid" aria-label="Available rewards">
          {rewards.map((reward) => {
            const outOfStock = reward.stockQuantity !== null && reward.stockQuantity <= 0;
            const notEnoughPoints = wallet.availablePoints < reward.costPoints;
            const tierLocked = !canAccessTierReward(tierProgress.current.key, reward.minTier);
            const disabled = outOfStock || notEnoughPoints || tierLocked;
            const visual = rewardVisual(reward);

            return (
              <article className={tierLocked ? "redeem-product-card locked" : "redeem-product-card"} key={reward.id}>
                <div className="redeem-product-art">
                  <span>{visual}</span>
                  <i />
                </div>
                <div className="redeem-product-body">
                  <span className="reward-type">{reward.type === "VOUCHER" ? "Voucher" : "Item"}</span>
                  <h2>{reward.name}</h2>
                  {reward.description && <p>{reward.description}</p>}
                  <div className="redeem-product-meta">
                    <span>⭐ {reward.costPoints} pts</span>
                    <small>Min. {reward.minTier}</small>
                    <small>{reward.stockQuantity === null ? "Unlimited" : `Stock: ${reward.stockQuantity}`}</small>
                  </div>
                </div>
                <RewardRedeemButton rewardId={reward.id} disabled={disabled} action={redeemRewardAction} />
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

        <section className="redeem-history-card">
          <div className="section-title-row compact">
            <div>
              <span className="eyebrow">My requests</span>
              <h2>Redemption history</h2>
              <p className="muted">Track collection, voucher delivery and admin approval status.</p>
            </div>
          </div>
          <div className="redeem-history-list">
            {redemptions.map((redemption) => (
              <article key={redemption.id}>
                <div className="redeem-history-icon">{rewardVisual(redemption.reward)}</div>
                <div>
                  <strong>{redemption.reward.name}</strong>
                  <small>{redemption.pointsCost} pts · {formatDateTime(redemption.createdAt)}</small>
                </div>
                <span className={redemptionStatusClass(redemption.status)}>{redemption.status}</span>
              </article>
            ))}
          </div>
          {redemptions.length === 0 && <p className="muted">No redemption requests yet.</p>}
        </section>
      </section>
    </>
  );
}
