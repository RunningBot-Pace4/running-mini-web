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

  return (
    <>
      <section className="hero admin-hero">
        <span className="eyebrow">Race control</span>
        <h1>Admin dashboard</h1>
        <p>Create sessions, edit workout descriptions, view votes, and manually open or close events.</p>
      </section>

      <div className="card">
        <h2>Edit home page hero</h2>
        <p className="muted">
          Upload the logo image, update the public home title, intro text, and sky/sea/sunrise theme colors. The description supports the toolbar formatting.
        </p>
        <HomeContentForm content={homeContent} action={updateHomeContentAction} />
      </div>


      <div className="card strava-config-card">
        <h2>Strava connection check</h2>
        <p className="muted">Use this to verify why users cannot connect Strava.</p>
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
        {!stravaConfig.ready && <p className="error">Strava is not ready. Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, APP_URL, and STRAVA_REDIRECT_URI in Vercel.</p>}
      </div>

      <div className="card">
        <h2>Edit scoring rules</h2>
        <p className="muted">
          Current formula: <strong>{scoringFormulaLabel(scoreSettings)}</strong>. {scoringDescription(scoreSettings)}.
        </p>
        <ScoreSettingsForm settings={scoreSettings} action={updateScoreSettingsAction} />
      </div>

      <div className="card">
        <h2>Create event</h2>
        <AdminEventForm action={createEventAction} />
      </div>

      <div className="card">
        <h2>Events</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Votes</th>
                <th>Runs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <LoadingLink href={`/events/${event.slug}`}>{event.title}</LoadingLink>
                    <br />
                    <span className="muted">
                      {formatDateTimeRange(event.startAt, event.endAt)}
                    </span>
                  </td>
                  <td>
                    <span className={event.status === "OPEN" ? "badge success" : event.status === "CLOSED" ? "badge danger" : "badge"}>
                      {event.status}
                    </span>
                  </td>
                  <td>{event._count.votes}</td>
                  <td>{event._count.submissions}</td>
                  <td>
                    <div className="row">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
