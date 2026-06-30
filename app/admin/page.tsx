import { redirect } from "next/navigation";
import { LoadingLink } from "@/components/LoadingLink";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminEventForm } from "@/components/AdminEventForm";
import { HomeContentForm } from "@/components/HomeContentForm";
import { ScoreSettingsForm } from "@/components/ScoreSettingsForm";
import { RewardForm } from "@/components/RewardForm";
import { createEventAction, updateEventStatusAction, updateHomeContentAction, updateScoreSettingsAction } from "@/app/admin/actions";
import { createRewardAction, updateRewardAction, updateRedemptionStatusAction } from "@/app/redemptions/actions";
import { formatDateTimeRange } from "@/lib/datetime";
import { getHomeContent } from "@/lib/site-content";
import { getScoreSettings, scoringDescription, scoringFormulaLabel } from "@/lib/scoring";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";
import { stravaConfigStatus } from "@/lib/strava-config";
import { redemptionStatusClass } from "@/lib/redemptions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  await closeExpiredOpenEvents();

  const homeContent = await getHomeContent();
  const scoreSettings = await getScoreSettings();
  const stravaConfig = stravaConfigStatus();

  const [events, rewards, redemptionRequests] = await Promise.all([
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
  ]);

  const openEvents = events.filter((event) => event.status === "OPEN").length;
  const draftEvents = events.filter((event) => event.status === "DRAFT").length;
  const closedEvents = events.filter((event) => event.status === "CLOSED").length;
  const totalVotes = events.reduce((sum, event) => sum + event._count.votes, 0);
  const totalRuns = events.reduce((sum, event) => sum + event._count.submissions, 0);
  const pendingRedemptions = redemptionRequests.filter((item) => item.status === "PENDING").length;

  return (
    <>
      <section className="admin-control-hero">
        <div>
          <span className="eyebrow">Race control</span>
          <h1>Admin cockpit</h1>
          <p>Manage the website step by step: event board, brand design, scoring rules, and Strava health check.</p>
        </div>

        <div className="admin-quick-stats" aria-label="Admin overview">
          <article>
            <span>Events</span>
            <strong>{events.length}</strong>
          </article>
          <article>
            <span>Open</span>
            <strong>{openEvents}</strong>
          </article>
          <article>
            <span>Votes</span>
            <strong>{totalVotes}</strong>
          </article>
          <article>
            <span>Runs</span>
            <strong>{totalRuns}</strong>
          </article>
          <article>
            <span>Redeem</span>
            <strong>{pendingRedemptions}</strong>
          </article>
        </div>
      </section>

      <nav className="admin-step-nav" aria-label="Admin sections">
        <a href="#admin-events">01 Events</a>
        <a href="#admin-design">02 Design</a>
        <a href="#admin-scoring">03 Scoring</a>
        <a href="#admin-redemptions">04 Redemptions</a>
        <a href="#admin-strava">05 Strava</a>
      </nav>

      <section id="admin-events" className="admin-section-card is-primary">
        <div className="admin-section-head">
          <div>
            <span className="admin-section-number">01</span>
            <h2>Events</h2>
            <p>Create workouts, check votes/runs, and manually open or close each event.</p>
          </div>
          <div className="admin-section-status">
            <span>{openEvents} open</span>
            <span>{draftEvents} draft</span>
            <span>{closedEvents} closed</span>
          </div>
        </div>

        <details className="admin-panel">
          <summary>
            <span>Create new event</span>
            <small>Add title, rich workout plan, start/end date and status.</small>
          </summary>
          <div className="admin-panel-body">
            <AdminEventForm action={createEventAction} />
          </div>
        </details>

        <details className="admin-panel">
          <summary>
            <span>Event list</span>
            <small>Open Manage to view voters, submissions, and edit event details.</small>
          </summary>
          <div className="admin-panel-body">
            <div className="admin-event-list">
              {events.map((event) => (
                <article className="admin-event-row" key={event.id}>
                  <div>
                    <LoadingLink className="admin-event-title" href={`/events/${event.slug}`}>
                      {event.title}
                    </LoadingLink>
                    <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
                  </div>

                  <div className="admin-event-metrics">
                    <span className={event.status === "OPEN" ? "badge success" : event.status === "CLOSED" ? "badge danger" : "badge"}>
                      {event.status}
                    </span>
                    <span>{event._count.votes} votes</span>
                    <span>{event._count.submissions} runs</span>
                  </div>

                  <div className="admin-event-actions">
                    <LoadingLink className="button ghost" href={`/admin/events/${event.id}`}>
                      Manage
                    </LoadingLink>
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
              ))}

              {events.length === 0 && (
                <div className="empty-card">
                  <h3>No events yet</h3>
                  <p className="muted">Open “Create new event” above to start your first session.</p>
                </div>
              )}
            </div>
          </div>
        </details>
      </section>

      <section id="admin-design" className="admin-section-card">
        <div className="admin-section-head">
          <div>
            <span className="admin-section-number">02</span>
            <h2>Brand & design</h2>
            <p>Upload logo, update home page wording, and select a ready-made full design theme.</p>
          </div>
        </div>

        <details className="admin-panel">
          <summary>
            <span>Website appearance</span>
            <small>Theme changes layout mood, artwork, buttons, cards, and loading screen style.</small>
          </summary>
          <div className="admin-panel-body">
            <HomeContentForm content={homeContent} action={updateHomeContentAction} />
          </div>
        </details>
      </section>

      <section id="admin-scoring" className="admin-section-card">
        <div className="admin-section-head">
          <div>
            <span className="admin-section-number">03</span>
            <h2>Scoring & approval</h2>
            <p>Decide how points are calculated and whether submissions need admin approval.</p>
          </div>
          <div className="admin-section-status">
            <span>{scoringFormulaLabel(scoreSettings)}</span>
          </div>
        </div>

        <details className="admin-panel">
          <summary>
            <span>Point rules</span>
            <small>{scoringDescription(scoreSettings)}</small>
          </summary>
          <div className="admin-panel-body">
            <ScoreSettingsForm settings={scoreSettings} action={updateScoreSettingsAction} />
          </div>
        </details>
      </section>

      <section id="admin-redemptions" className="admin-section-card">
        <div className="admin-section-head">
          <div>
            <span className="admin-section-number">04</span>
            <h2>Redemptions</h2>
            <p>Create tier-based point rewards, manage item/voucher stock, and approve member redemption requests.</p>
          </div>
          <div className="admin-section-status">
            <span>{rewards.length} rewards</span>
            <span>{pendingRedemptions} pending</span>
          </div>
        </div>

        <details className="admin-panel">
          <summary>
            <span>Create reward</span>
            <small>Add item or voucher rewards and set the minimum member tier required.</small>
          </summary>
          <div className="admin-panel-body">
            <RewardForm action={createRewardAction} />
          </div>
        </details>

        <details className="admin-panel">
          <summary>
            <span>Reward catalog</span>
            <small>Edit point cost, minimum tier, stock, type, active status, and voucher notes.</small>
          </summary>
          <div className="admin-panel-body reward-admin-list">
            {rewards.map((reward) => (
              <details className="reward-admin-card" key={reward.id}>
                <summary>
                  <div>
                    <strong>{reward.name}</strong>
                    <small>{reward.type} · {reward.costPoints} pts · {reward.minTier}+ · {reward.stockQuantity === null ? "Unlimited" : `${reward.stockQuantity} stock`} · {reward._count.redemptions} requests</small>
                  </div>
                  <span className={reward.isActive ? "badge success" : "badge"}>{reward.isActive ? "ACTIVE" : "HIDDEN"}</span>
                </summary>
                <div className="admin-panel-body">
                  <RewardForm reward={reward} action={updateRewardAction} />
                </div>
              </details>
            ))}
            {rewards.length === 0 && <p className="muted">No rewards created yet.</p>}
          </div>
        </details>

        <details className="admin-panel">
          <summary>
            <span>Redemption requests</span>
            <small>Approve, reject, or mark rewards as fulfilled after collection or voucher delivery.</small>
          </summary>
          <div className="admin-panel-body">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Reward</th>
                    <th>Points</th>
                    <th>Status</th>
                    <th>Admin note</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptionRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <strong>{request.user.name}</strong>
                        <br />
                        <small>{request.user.email}</small>
                      </td>
                      <td>
                        {request.reward.name}
                        <br />
                        <small>{request.reward.type}</small>
                      </td>
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
          </div>
        </details>
      </section>

      <section id="admin-strava" className="admin-section-card">
        <div className="admin-section-head">
          <div>
            <span className="admin-section-number">05</span>
            <h2>Strava connection</h2>
            <p>Check whether the Vercel environment variables and callback domain are ready.</p>
          </div>
          <div className="admin-section-status">
            <span className={stravaConfig.ready ? "status-ok" : "status-warning"}>{stravaConfig.ready ? "Ready" : "Check needed"}</span>
          </div>
        </div>

        <details className="admin-panel">
          <summary>
            <span>Connection health check</span>
            <small>Use this when members cannot connect Strava.</small>
          </summary>
          <div className="admin-panel-body">
            <div className="profile-list">
              <div>
                <span>Client ID</span>
                <strong>{stravaConfig.hasClientId ? "Set" : "Missing"}</strong>
              </div>
              <div>
                <span>Client Secret</span>
                <strong>{stravaConfig.hasClientSecret ? "Set" : "Missing"}</strong>
              </div>
              <div>
                <span>Redirect URI</span>
                <strong>{stravaConfig.redirectUri}</strong>
              </div>
              <div>
                <span>Strava callback domain</span>
                <strong>{stravaConfig.callbackDomain || "Missing"}</strong>
              </div>
            </div>
            {!stravaConfig.ready && (
              <p className="error">Strava is not ready. Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, APP_URL, and STRAVA_REDIRECT_URI in Vercel.</p>
            )}
          </div>
        </details>
      </section>
    </>
  );
}
