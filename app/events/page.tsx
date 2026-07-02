import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatDateTimeRange } from "@/lib/datetime";
import { LoadingLink } from "@/components/LoadingLink";
import { EventDescription } from "@/components/EventDescription";
import { eventDisplayStatus, isEventAcceptingResponses } from "@/lib/event-window";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";
import { eventTypeClass, getClubEventType } from "@/lib/event-types";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "OPEN") return "badge success";
  if (status === "CLOSED") return "badge danger";
  return "badge";
}

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await closeExpiredOpenEvents();

  const events = await prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED", "ARCHIVED"] } },
    orderBy: { startAt: "desc" },
    include: { _count: { select: { votes: true, submissions: true } } },
  });

  const upcoming = events.filter((event) => isEventAcceptingResponses(event));
  const history = events.filter((event) => !isEventAcceptingResponses(event));

  const renderEvent = (event: typeof events[number]) => {
    const displayStatus = eventDisplayStatus(event);
    const type = getClubEventType(event.type);
    return (
      <article className="loyalty-event-card" key={event.id}>
        <div className="loyalty-event-date">
          <strong>{event.startAt.getDate().toString().padStart(2, "0")}</strong>
          <span>{event.startAt.toLocaleString("en-US", { month: "short" })}</span>
        </div>
        <div className="loyalty-event-main">
          <div className="performance-event-meta">
            <span className={statusClass(displayStatus)}>{displayStatus}</span>
            <span className={eventTypeClass(event.type)}>{type.icon} {type.label}</span>
            <small>{event._count.votes} votes · {event._count.submissions} results</small>
          </div>
          <h2>{event.title}</h2>
          <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
          {event.description && <div className="workout-preview performance-workout-preview"><EventDescription text={event.description} compact fullHref={`/events/${event.slug}`} /></div>}
        </div>
        <LoadingLink className="button ghost" href={`/events/${event.slug}`}>{isEventAcceptingResponses(event) ? "Enter" : "View"}</LoadingLink>
      </article>
    );
  };

  return (
    <>
      <section className="page-hero-card loyalty-page-hero">
        <div>
          <span className="eyebrow">Event center</span>
          <h1>Club events</h1>
          <p>Upcoming events are shown first. History events stay here, away from the member dashboard.</p>
        </div>
        <div className="page-hero-stats">
          <article><strong>{upcoming.length}</strong><span>Upcoming</span></article>
          <article><strong>{history.length}</strong><span>History</span></article>
        </div>
      </section>

      <section className="event-center-section">
        <div className="section-title-row">
          <div><span className="eyebrow">Upcoming</span><h2>Open missions</h2></div>
        </div>
        <div className="loyalty-event-list">
          {upcoming.map(renderEvent)}
          {upcoming.length === 0 && <div className="empty-card"><h2>No upcoming events</h2><p className="muted">Please check again after admin opens the next event.</p></div>}
        </div>
      </section>

      <section className="event-center-section">
        <div className="section-title-row">
          <div><span className="eyebrow">History</span><h2>Past events</h2></div>
        </div>
        <div className="loyalty-event-list history">
          {history.map(renderEvent)}
          {history.length === 0 && <div className="empty-card"><h2>No history yet</h2><p className="muted">Closed events will appear here.</p></div>}
        </div>
      </section>
    </>
  );
}
