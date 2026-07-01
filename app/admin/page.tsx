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

  const [events, rewards, redemptionRequests, totalMembers, pendingSubmissions] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { votes: true, submissions: true } },
      },
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
  const draftEvents = events.filter((event) => event.status === "DRAFT").length;
  const closedEvents = events.filter((event) => event.status === "CLOSED").length;
  const totalVotes = events.reduce((sum, event) => sum + event._count.votes, 0);
  const totalRuns = events.reduce((sum, event) => sum + event._count.submissions, 0);
  const pendingRedemptions = redemptionRequests.filter((item) => item.status === "PENDING").length;
  const activeRewards = rewards.filter((reward) => reward.isActive).length;
  const needAttention = pendingSubmissions + pendingRedemptions;

  return (
    <>
      <section className="admin-home-v2">
        <div className="admin-home-copy">
          <span className="eyebrow">Admin Center</span>
          <h1>Club settings</h1>
          <p>Create events, approve results, manage rewards and update your website from one clean control center.</p>
        </div>
        <div className="admin-home-action-card">
          <span>Need attention</span>
          <strong>{needAttention}</strong>
          <small>{pendingSubmissions} KM approvals · {pendingRedemptions} redemptions</small>
        </div>
      </section>

      <section className="admin-kpi-grid-v2" aria-label="Admin overview">
        <article><span>Events</span><strong>{events.length}</strong><small>{openEvents} open · {draftEvents} draft</small></article>
        <article><span>Members</span><strong>{totalMembers}</strong><small>registered users</small></article>
        <article><span>Votes</span><strong>{totalVotes}</strong><small>{totalRuns} submitted results</small></article>
        <article><span>Rewards</span><strong>{activeRewards}</strong><small>{rewards.length} total rewards</small></article>
        <article><span>Pending</span><strong>{needAttention}</strong><small>actions to review</small></article>
      </section>

      <nav className="admin-tabs-v2" aria-label="Admin sections">
        <a href="#admin-events">📅 Events</a>
        <a href="#admin-approvals">✅ Approvals</a>
        <a href="#admin-rewards">🎁 Rewards</a>
        <a href="#admin-website">🎨 Website</a>
        <a href="#admin-strava">🔶 Strava</a>
      </nav>

      <section className="admin-workbench-v2">
        <details id="admin-events" className="admin-module-card" open>
          <summary>
            <span className="admin-module-icon">📅</span>
            <div>
              <strong>Events</strong>
              <small>Create sessions, manage event status, and check votes or runs.</small>
            </div>
            <em>{openEvents} open</em>
          </summary>
          <div className="admin-module-body">
            <div className="admin-split-grid">
              <section className="admin-inner-card">
                <div className="admin-inner-head">
                  <div><h3>Create event</h3><p>Add HYROX, Redline, marathon, training or recovery sessions.</p></div>
                </div>
                <AdminEventForm action={createEventAction} />
              </section>

              <section className="admin-inner-card">
                <div className="admin-inner-head">
                  <div><h3>Event board</h3><p>Open Manage to view voters, submissions and edit event details.</p></div>
                  <span className="badge">{events.length} events</span>
                </div>
                <div className="admin-event-stack-v2">
                  {events.map((event) => {
                    const type = getClubEventType(event.type);
                    return (
                      <article className="admin-event-card-v2" key={event.id}>
                        <div className="admin-event-date-pill">
                          <span>{event.startAt.toLocaleDateString("en-GB", { day: "2-digit" })}</span>
                          <small>{event.startAt.toLocaleDateString("en-GB", { month: "short" })}</small>
                        </div>
                        <div className="admin-event-card-main">
                          <LoadingLink className="admin-event-title" href={`/events/${event.slug}`}>{event.title}</LoadingLink>
                          <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
                          <div className="admin-chip-row">
                            <span className={eventTypeClass(event.type)}>{type.icon} {type.label}</span>
                            <span className={event.status === "OPEN" ? "badge success" : event.status === "CLOSED" ? "badge danger" : "badge"}>{event.status}</span>
                            <span className="badge">{event._count.votes} votes</span>
                            <span className="badge">{event._count.submissions} runs</span>
                          </div>
                        </div>
                        <div className="admin-event-card-actions">
                          <LoadingLink className="button ghost" href={`/admin/events/${event.id}`}>Manage</LoadingLink>
                          {event.status !== "CLOSED" && (
                            <form action={updateEventStatusAction}>
                              <input type="hidden" name="eventId" value={event.id} />
                              <input type="hidden" name="status" value="CLOSED" />
                              <FormSubmitButton className="ghost" pendingLabel="Closing event...">Close</FormSubmitButton>
                            </form>
                          )}
                          {event.status !== "OPEN" && (
                            <form action={updateEventStatusAction}>
                              <input type="hidden" name="eventId" value={event.id} />
                              <input type="hidden" name="status" value="OPEN" />
                              <FormSubmitButton className="ghost" pendingLabel="Opening event...">Open</FormSubmitButton>
                            </form>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {events.length === 0 && <div className="empty-card"><h3>No events yet</h3><p className="muted">Create your first session using the form.</p></div>}
                </div>
              </section>
            </div>
          </div>
        </details>

        <details id="admin-approvals" className="admin-module-card">
          <summary>
            <span className="admin-module-icon">✅</span>
            <div>
              <strong>Points & approval</strong>
              <small>Set scoring rules and decide whether submitted KM needs approval.</small>
            </div>
            <em>{scoringFormulaLabel(scoreSettings)}</em>
          </summary>
          <div className="admin-module-body">
            <section className="admin-inner-card">
              <div className="admin-inner-head"><div><h3>Point rules</h3><p>{scoringDescription(scoreSettings)}</p></div></div>
              <ScoreSettingsForm settings={scoreSettings} action={updateScoreSettingsAction} />
            </section>
          </div>
        </details>

        <details id="admin-rewards" className="admin-module-card">
          <summary>
            <span className="admin-module-icon">🎁</span>
            <div>
              <strong>Rewards</strong>
              <small>Create items or vouchers, set tier benefits and handle redemption requests.</small>
            </div>
            <em>{pendingRedemptions} pending</em>
          </summary>
          <div className="admin-module-body admin-rewards-layout-v2">
            <section className="admin-inner-card">
              <div className="admin-inner-head"><div><h3>Create reward</h3><p>Add item or voucher rewards and set the minimum member tier required.</p></div></div>
              <RewardForm action={createRewardAction} />
            </section>

            <section className="admin-inner-card">
              <div className="admin-inner-head"><div><h3>Reward catalog</h3><p>Edit cost, stock, minimum tier, active status and voucher notes.</p></div><span className="badge">{rewards.length} rewards</span></div>
              <div className="reward-admin-list-v2">
                {rewards.map((reward) => (
                  <details className="reward-admin-card-v2" key={reward.id}>
                    <summary>
                      <div>
                        <strong>{reward.name}</strong>
                        <small>{reward.type} · {reward.costPoints} pts · {reward.minTier}+ · {reward.stockQuantity === null ? "Unlimited" : `${reward.stockQuantity} stock`} · {reward._count.redemptions} requests</small>
                      </div>
                      <span className={reward.isActive ? "badge success" : "badge"}>{reward.isActive ? "ACTIVE" : "HIDDEN"}</span>
                    </summary>
                    <div className="reward-admin-card-body"><RewardForm reward={reward} action={updateRewardAction} /></div>
                  </details>
                ))}
                {rewards.length === 0 && <p className="muted">No rewards created yet.</p>}
              </div>
            </section>

            <section className="admin-inner-card">
              <div className="admin-inner-head"><div><h3>Tier benefits</h3><p>Set Bronze, Silver, Gold and Platinum thresholds, benefits and discount labels.</p></div></div>
              <TierBenefitsForm tiers={tierDefinitions} action={updateTierBenefitsAction} />
            </section>

            <section className="admin-inner-card">
              <div className="admin-inner-head"><div><h3>Redemption requests</h3><p>Approve, reject or mark rewards as fulfilled after collection or voucher delivery.</p></div><span className="badge warning">{pendingRedemptions} pending</span></div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr><th>Member</th><th>Reward</th><th>Points</th><th>Status</th><th>Admin note</th><th>Action</th></tr>
                  </thead>
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
                            <FormSubmitButton className="ghost" pendingLabel="Updating redemption...">Update</FormSubmitButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {redemptionRequests.length === 0 && <p className="muted">No redemption requests yet.</p>}
            </section>
          </div>
        </details>

        <details id="admin-website" className="admin-module-card">
          <summary>
            <span className="admin-module-icon">🎨</span>
            <div>
              <strong>Website design</strong>
              <small>Upload logo, update home wording and choose a ready-made theme.</small>
            </div>
            <em>Branding</em>
          </summary>
          <div className="admin-module-body">
            <section className="admin-inner-card">
              <HomeContentForm content={homeContent} action={updateHomeContentAction} />
            </section>
          </div>
        </details>

        <details id="admin-strava" className="admin-module-card">
          <summary>
            <span className="admin-module-icon">🔶</span>
            <div>
              <strong>Strava connection</strong>
              <small>Check whether Vercel variables and callback domain are ready.</small>
            </div>
            <em>{stravaConfig.ready ? "Ready" : "Check needed"}</em>
          </summary>
          <div className="admin-module-body">
            <section className="admin-inner-card">
              <div className="profile-list">
                <div><span>Client ID</span><strong>{stravaConfig.hasClientId ? "Set" : "Missing"}</strong></div>
                <div><span>Client Secret</span><strong>{stravaConfig.hasClientSecret ? "Set" : "Missing"}</strong></div>
                <div><span>Redirect URI</span><strong>{stravaConfig.redirectUri}</strong></div>
                <div><span>Strava callback domain</span><strong>{stravaConfig.callbackDomain || "Missing"}</strong></div>
              </div>
              {!stravaConfig.ready && <p className="error">Strava is not ready. Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, APP_URL, and STRAVA_REDIRECT_URI in Vercel.</p>}
            </section>
          </div>
        </details>
      </section>
    </>
  );
}
