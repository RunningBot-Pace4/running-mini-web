import { redirect } from "next/navigation";
import { LoadingLink } from "@/components/LoadingLink";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminEventForm } from "@/components/AdminEventForm";
import { HomeContentForm } from "@/components/HomeContentForm";
import { ScoreSettingsForm } from "@/components/ScoreSettingsForm";
import { TierBenefitsForm } from "@/components/TierBenefitsForm";
import { RewardForm } from "@/components/RewardForm";
import { createEventAction, updateEventStatusAction, updateHomeContentAction, updateScoreSettingsAction, updateTierBenefitsAction } from "@/app/admin/actions";
import { createRewardAction, updateRewardAction, updateRedemptionStatusAction } from "@/app/redemptions/actions";
import { formatDateTimeRange } from "@/lib/datetime";
import { getHomeContent } from "@/lib/site-content";
import { getScoreSettings, scoringDescription, scoringFormulaLabel } from "@/lib/scoring";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";
import { stravaConfigStatus } from "@/lib/strava-config";
import { redemptionStatusClass } from "@/lib/redemptions";
import { eventTypeClass, getClubEventType } from "@/lib/event-types";
import { getTierDefinitions } from "@/lib/member-progress";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  await closeExpiredOpenEvents();

  const homeContent = await getHomeContent();
  const scoreSettings = await getScoreSettings();
  const tierDefinitions = await getTierDefinitions();
  const stravaConfig = stravaConfigStatus();

  const [events, rewards, redemptionRequests, memberCount, pendingSubmissions] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { votes: true, submissions: true } } },
    }),
    prisma.reward.findMany({
      orderBy: [{ isActive: "desc" }, { costPoints: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { redemptions: true } } },
    }),
    prisma.redemption.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: true, reward: true },
    }),
    prisma.user.count(),
    prisma.submission.count({ where: { status: "PENDING" } }),
  ]);

  const openEvents = events.filter((event) => event.status === "OPEN").length;
  const totalVotes = events.reduce((sum, event) => sum + event._count.votes, 0);
  const totalRuns = events.reduce((sum, event) => sum + event._count.submissions, 0);
  const pendingRedemptions = redemptionRequests.filter((item) => item.status === "PENDING").length;
  const pendingActions = pendingRedemptions + pendingSubmissions;
  const upcomingEvents = events.filter((event) => event.status !== "ARCHIVED").slice(0, 5);

  return (
    <section className="admin-center-v2">
      <div className="admin-v2-header">
        <div>
          <span className="eyebrow">Admin center</span>
          <h1>Club settings 👋</h1>
          <p>Create events, approve results, manage rewards and update your website from one clean control center.</p>
        </div>
      </div>

      <div className="admin-v2-kpis" aria-label="Admin overview">
        <article><span>📅</span><small>Total events</small><strong>{events.length}</strong><em>View all events</em></article>
        <article><span>✅</span><small>Open events</small><strong>{openEvents}</strong><em>Currently open</em></article>
        <article><span>👥</span><small>Members</small><strong>{memberCount}</strong><em>Total members</em></article>
        <article><span>🧾</span><small>Pending actions</small><strong>{pendingActions}</strong><em>Need review</em></article>
        <article><span>🎁</span><small>Rewards</small><strong>{rewards.length}</strong><em>Catalog items</em></article>
        <article><span>⭐</span><small>Redemptions</small><strong>{pendingRedemptions}</strong><em>Pending requests</em></article>
      </div>

      <nav className="admin-v2-tabs" aria-label="Admin sections">
        <a className="active" href="#admin-events">📅 Events</a>
        <a href="#admin-approvals">🧾 Approvals</a>
        <a href="#admin-rewards">🎁 Rewards</a>
        <a href="#admin-tiers">⭐ Tiers</a>
        <a href="#admin-website">🎨 Website</a>
        <a href="#admin-strava">🔺 Strava</a>
      </nav>

      <section id="admin-events" className="admin-v2-card">
        <div className="admin-v2-section-title">
          <div><span>📅</span><div><h2>Events management</h2><p>Create and manage club events.</p></div></div>
          <a className="button" href="#create-event">+ Create Event</a>
        </div>

        <div className="admin-v2-event-board">
          <div className="admin-v2-event-head">
            <strong>Upcoming events</strong>
            <span>{totalVotes} votes · {totalRuns} results</span>
          </div>

          <div className="admin-v2-event-list">
            {upcomingEvents.map((event) => {
              const type = getClubEventType(event.type);
              return (
                <article key={event.id} className="admin-v2-event-row">
                  <div className="admin-v2-date">
                    <strong>{event.startAt.getDate().toString().padStart(2, "0")}</strong>
                    <span>{event.startAt.toLocaleString("en", { month: "short" })}</span>
                  </div>
                  <div className="admin-v2-event-info">
                    <LoadingLink href={`/events/${event.slug}`}>{event.title}</LoadingLink>
                    <small>{formatDateTimeRange(event.startAt, event.endAt)}</small>
                    <span className={eventTypeClass(event.type)}>{type.icon} {type.label}</span>
                  </div>
                  <span className={event.status === "OPEN" ? "badge success" : event.status === "CLOSED" ? "badge danger" : "badge"}>{event.status}</span>
                  <div className="admin-v2-event-number"><strong>{event._count.votes}</strong><small>votes</small></div>
                  <div className="admin-v2-event-number"><strong>{event._count.submissions}</strong><small>runs</small></div>
                  <div className="admin-v2-actions">
                    <LoadingLink className="button ghost" href={`/admin/events/${event.id}`}>Manage</LoadingLink>
                    {event.status !== "CLOSED" && (
                      <form action={updateEventStatusAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value="CLOSED" />
                        <FormSubmitButton className="ghost" pendingLabel="Closing...">Close</FormSubmitButton>
                      </form>
                    )}
                    {event.status !== "OPEN" && (
                      <form action={updateEventStatusAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value="OPEN" />
                        <FormSubmitButton className="ghost" pendingLabel="Opening...">Open</FormSubmitButton>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
            {upcomingEvents.length === 0 && <p className="muted">No events yet. Open Create event below to start.</p>}
          </div>
        </div>

        <details id="create-event" className="admin-v2-accordion">
          <summary><span>➕ Create event</span><small>Add title, type, rich workout plan, start/end date and status.</small></summary>
          <div className="admin-panel-body"><AdminEventForm action={createEventAction} /></div>
        </details>
      </section>

      <section id="admin-approvals" className="admin-v2-card">
        <div className="admin-v2-section-title">
          <div><span>🧾</span><div><h2>Points & approval</h2><p>Control how points are calculated and whether submissions require approval.</p></div></div>
          <span className="badge success">{scoringFormulaLabel(scoreSettings)}</span>
        </div>
        <details className="admin-v2-accordion">
          <summary><span>Scoring configuration</span><small>{scoringDescription(scoreSettings)}</small></summary>
          <div className="admin-panel-body"><ScoreSettingsForm settings={scoreSettings} action={updateScoreSettingsAction} /></div>
        </details>
      </section>

      <section id="admin-rewards" className="admin-v2-card">
        <div className="admin-v2-section-title">
          <div><span>🎁</span><div><h2>Rewards management</h2><p>Create rewards, manage stock and review redemption requests.</p></div></div>
          <span className="badge">{rewards.length} rewards</span>
        </div>

        <details className="admin-v2-accordion">
          <summary><span>Create reward</span><small>Add item or voucher rewards and set the minimum tier required.</small></summary>
          <div className="admin-panel-body"><RewardForm action={createRewardAction} /></div>
        </details>

        <details className="admin-v2-accordion">
          <summary><span>Reward catalog</span><small>Edit cost, tier, stock, type and active status.</small></summary>
          <div className="admin-panel-body reward-admin-list">
            {rewards.map((reward) => (
              <details className="reward-admin-card" key={reward.id}>
                <summary>
                  <div className="reward-admin-summary-main">
                    <strong>{reward.name}</strong>
                    <small>{reward.type} · {reward.costPoints} pts · {reward.minTier}+ · {reward.stockQuantity === null ? "Unlimited" : `${reward.stockQuantity} stock`} · {reward._count.redemptions} requests</small>
                  </div>
                  <div className="reward-admin-summary-side">
                    <span className={reward.isActive ? "badge success" : "badge"}>{reward.isActive ? "ACTIVE" : "HIDDEN"}</span>
                    <span className="collapse-chevron" aria-hidden="true">⌄</span>
                  </div>
                </summary>
                <div className="admin-panel-body"><RewardForm reward={reward} action={updateRewardAction} /></div>
              </details>
            ))}
            {rewards.length === 0 && <p className="muted">No rewards created yet.</p>}
          </div>
        </details>

        <details className="admin-v2-accordion">
          <summary><span>Redemption requests</span><small>Approve, reject, or mark rewards as fulfilled after collection or voucher delivery.</small></summary>
          <div className="admin-panel-body">
            <div className="table-scroll">
              <table>
                <thead><tr><th>Member</th><th>Reward</th><th>Points</th><th>Status</th><th>Admin note</th><th>Action</th></tr></thead>
                <tbody>
                  {redemptionRequests.map((request) => (
                    <tr key={request.id}>
                      <td><strong>{request.user.name}</strong><br /><small>{request.user.email}</small></td>
                      <td>{request.reward.name}<br /><small>{request.reward.type}</small></td>
                      <td>{request.pointsCost}</td>
                      <td><span className={redemptionStatusClass(request.status)}>{request.status}</span></td>
                      <td>{request.adminNote || "—"}</td>
                      <td>
                        <form className="inline-status-form" action={updateRedemptionStatusAction}>
                          <input type="hidden" name="redemptionId" value={request.id} />
                          <select name="status" defaultValue={request.status}>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="FULFILLED">Fulfilled</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                          <input name="adminNote" placeholder="Optional note" defaultValue={request.adminNote || ""} />
                          <FormSubmitButton className="ghost" pendingLabel="Updating...">Update</FormSubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {redemptionRequests.length === 0 && <p className="muted">No redemption requests yet.</p>}
          </div>
        </details>
      </section>

      <section id="admin-tiers" className="admin-v2-card">
        <div className="admin-v2-section-title">
          <div><span>⭐</span><div><h2>Tier benefits</h2><p>Set Bronze, Silver, Gold and Platinum thresholds, benefits and discount labels.</p></div></div>
          <span className="badge">4 tiers</span>
        </div>
        <details className="admin-v2-accordion">
          <summary><span>Configure tier benefits</span><small>Update unlocks, point thresholds and reward labels.</small></summary>
          <div className="admin-panel-body"><TierBenefitsForm tiers={tierDefinitions} action={updateTierBenefitsAction} /></div>
        </details>
      </section>

      <section id="admin-website" className="admin-v2-card">
        <div className="admin-v2-section-title">
          <div><span>🎨</span><div><h2>Design & branding</h2><p>Upload logo, update home wording and select a ready-made theme.</p></div></div>
          <span className="badge">Customize</span>
        </div>
        <details className="admin-v2-accordion">
          <summary><span>Website appearance</span><small>Logo, club name, home content and theme selection.</small></summary>
          <div className="admin-panel-body"><HomeContentForm content={homeContent} action={updateHomeContentAction} /></div>
        </details>
      </section>

      <section id="admin-strava" className="admin-v2-card">
        <div className="admin-v2-section-title">
          <div><span>🔺</span><div><h2>Strava integration</h2><p>Check whether Vercel variables and callback domain are ready.</p></div></div>
          <span className={stravaConfig.ready ? "badge success" : "badge warning"}>{stravaConfig.ready ? "Connected" : "Check needed"}</span>
        </div>
        <details className="admin-v2-accordion">
          <summary><span>Connection health check</span><small>Use this when members cannot connect Strava.</small></summary>
          <div className="admin-panel-body">
            <div className="profile-list">
              <div><span>Client ID</span><strong>{stravaConfig.hasClientId ? "Set" : "Missing"}</strong></div>
              <div><span>Client Secret</span><strong>{stravaConfig.hasClientSecret ? "Set" : "Missing"}</strong></div>
              <div><span>Redirect URI</span><strong>{stravaConfig.redirectUri}</strong></div>
              <div><span>Strava callback domain</span><strong>{stravaConfig.callbackDomain || "Missing"}</strong></div>
            </div>
            {!stravaConfig.ready && <p className="error">Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, APP_URL and STRAVA_REDIRECT_URI in Vercel.</p>}
          </div>
        </details>
      </section>
    </section>
  );
}
