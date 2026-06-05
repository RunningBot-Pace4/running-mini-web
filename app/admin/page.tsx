import { redirect } from "next/navigation";
import { LoadingLink } from "@/components/LoadingLink";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminEventForm } from "@/components/AdminEventForm";
import { HomeContentForm } from "@/components/HomeContentForm";
import { ScoreSettingsForm } from "@/components/ScoreSettingsForm";
import { createEventAction, updateEventStatusAction, updateHomeContentAction, updateScoreSettingsAction } from "@/app/admin/actions";
import { formatDateTimeRange } from "@/lib/datetime";
import { getHomeContent } from "@/lib/site-content";
import { getScoreSettings, scoringDescription, scoringFormulaLabel } from "@/lib/scoring";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";
import { stravaConfigStatus } from "@/lib/strava-config";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  await closeExpiredOpenEvents();

  const homeContent = await getHomeContent();
  const scoreSettings = await getScoreSettings();
  const stravaConfig = stravaConfigStatus();

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { votes: true, submissions: true } },
    },
  });

  const openEvents = events.filter((event) => event.status === "OPEN").length;
  const draftEvents = events.filter((event) => event.status === "DRAFT").length;
  const closedEvents = events.filter((event) => event.status === "CLOSED").length;
  const totalVotes = events.reduce((sum, event) => sum + event._count.votes, 0);
  const totalRuns = events.reduce((sum, event) => sum + event._count.submissions, 0);

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
        </div>
      </section>

      <nav className="admin-step-nav" aria-label="Admin sections">
        <a href="#admin-events">01 Events</a>
        <a href="#admin-design">02 Design</a>
        <a href="#admin-scoring">03 Scoring</a>
        <a href="#admin-strava">04 Strava</a>
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

        <details className="admin-panel" open>
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

        <details className="admin-panel" open>
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

        <details className="admin-panel" open>
          <summary>
            <span>Point rules</span>
            <small>{scoringDescription(scoreSettings)}</small>
          </summary>
          <div className="admin-panel-body">
            <ScoreSettingsForm settings={scoreSettings} action={updateScoreSettingsAction} />
          </div>
        </details>
      </section>

      <section id="admin-strava" className="admin-section-card">
        <div className="admin-section-head">
          <div>
            <span className="admin-section-number">04</span>
            <h2>Strava connection</h2>
            <p>Check whether the Vercel environment variables and callback domain are ready.</p>
          </div>
          <div className="admin-section-status">
            <span className={stravaConfig.ready ? "status-ok" : "status-warning"}>{stravaConfig.ready ? "Ready" : "Check needed"}</span>
          </div>
        </div>

        <details className="admin-panel" open>
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
