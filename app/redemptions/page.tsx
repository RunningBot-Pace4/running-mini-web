import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getUserPointWallet, redemptionStatusClass } from "@/lib/redemptions";
import { redeemRewardAction } from "@/app/redemptions/actions";
import { RewardRedeemButton } from "@/components/RewardRedeemButton";
import { formatDateTime } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function RedemptionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, rewards, redemptions] = await Promise.all([
    getUserPointWallet(user.id),
    prisma.reward.findMany({
      where: { isActive: true },
      orderBy: [{ costPoints: "asc" }, { createdAt: "desc" }],
    }),
    prisma.redemption.findMany({
      where: { userId: user.id },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <section className="redeem-hero account-summary-hero">
        <div className="account-summary-copy">
          <span className="eyebrow">Points redemption</span>
          <h1>Reward store</h1>
          <p>Use your approved running points to redeem club items or vouchers.</p>
        </div>
        <div className="account-summary-score wallet-card-safe">
          <span>Available points</span>
          <strong>{wallet.availablePoints}</strong>
          <small>{wallet.totalEarned} earned · {wallet.spentOrReserved} reserved/spent</small>
        </div>
      </section>

      <section className="card redemption-info-card">
        <span className="eyebrow">How it works</span>
        <div className="redemption-steps">
          <article><strong>01</strong><span>Earn points from approved runs.</span></article>
          <article><strong>02</strong><span>Choose an item or voucher.</span></article>
          <article><strong>03</strong><span>Admin approves and prepares collection.</span></article>
        </div>
      </section>

      <section className="redemption-grid" aria-label="Available rewards">
        {rewards.map((reward) => {
          const outOfStock = reward.stockQuantity !== null && reward.stockQuantity <= 0;
          const notEnoughPoints = wallet.availablePoints < reward.costPoints;
          return (
            <article className="reward-card" key={reward.id}>
              <div className={reward.type === "VOUCHER" ? "reward-icon voucher" : "reward-icon"}>
                {reward.type === "VOUCHER" ? "🎟️" : "🎁"}
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
                <RewardRedeemButton
                  rewardId={reward.id}
                  disabled={outOfStock || notEnoughPoints}
                  action={redeemRewardAction}
                />
              </div>
              {outOfStock && <p className="error">Out of stock.</p>}
              {!outOfStock && notEnoughPoints && <p className="muted">Need {reward.costPoints - wallet.availablePoints} more points.</p>}
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
