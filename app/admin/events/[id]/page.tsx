import { LoadingLink } from "@/components/LoadingLink";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { updateEventDetailsAction, updateEventStatusAction, updateSubmissionStatusAction } from "@/app/admin/actions";
import { formatDateTime, formatDateTimeLocalInput, formatDateTimeRange } from "@/lib/datetime";
import { EventDescription } from "@/components/EventDescription";
import { EditEventForm } from "@/components/EditEventForm";
import { closeExpiredOpenEvents } from "@/lib/event-maintenance";
import { eventDisplayStatus } from "@/lib/event-window";
import { getClubEventType, eventTypeClass } from "@/lib/event-types";

export const dynamic = "force-dynamic";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  await closeExpiredOpenEvents();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      votes: {
        include: { user: true },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      },
      submissions: {
        include: { user: true, activity: true },
        orderBy: { totalPoints: "desc" },
      },
      _count: {
        select: { votes: true, submissions: true },
      },
    },
  });

  if (!event) redirect("/admin");

  const attendCount = event.votes.filter((vote) => vote.status === "ATTEND").length;
  const notAttendCount = event.votes.filter((vote) => vote.status === "NOT_ATTEND").length;
  const pendingSubmissionCount = event.submissions.filter((submission) => submission.status === "PENDING").length;
  const approvedSubmissionCount = event.submissions.filter((submission) => submission.status === "APPROVED").length;
  const rejectedSubmissionCount = event.submissions.filter((submission) => submission.status === "REJECTED").length;
  const eventTypeMeta = getClubEventType(event.type);
  const displayStatus = eventDisplayStatus(event);

  return (
    <>
      <section className="hero admin-hero">
        <LoadingLink className="button ghost" href="/admin">
          ← Back to admin
        </LoadingLink>
        <p className="muted" style={{ marginTop: 16 }}>Admin event management</p>
        <h1>{event.title}</h1>
        <p>{formatDateTimeRange(event.startAt, event.endAt)}</p>
      </section>

      <div className="card">
        <div className="row">
          <span className={displayStatus === "OPEN" ? "badge success" : displayStatus === "CLOSED" ? "badge danger" : "badge"}>
            {displayStatus}
          </span>
          <span className={eventTypeClass(event.type)}>{eventTypeMeta.icon} {eventTypeMeta.label}</span>
          <LoadingLink className="button ghost" href={`/events/${event.slug}`}>
            View public event
          </LoadingLink>
        </div>

        <h2>Change event status</h2>
        <p className="muted">
          Admin can open or close this event anytime. Auto-close still closes normal expired events, but manually reopening lets members key in Event KM again.
        </p>

        <div className="row">
          {["DRAFT", "OPEN", "CLOSED", "ARCHIVED"].map((status) => (
            <form key={status} action={updateEventStatusAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="status" value={status} />
              <FormSubmitButton
                className={event.status === status ? "secondary" : "ghost"}
                pendingLabel="Updating status..."
                disabled={event.status === status}
              >
                {status}
              </FormSubmitButton>
            </form>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Edit event details</h2>
        <p className="muted">
          Update draft descriptions, event date/time, title, or status. The public event link remains the same.
        </p>
        <EditEventForm
          key={`${event.id}-${event.status}-${event.updatedAt.getTime()}`}
          action={updateEventDetailsAction}
          event={{
            id: event.id,
            title: event.title,
            description: event.description || "",
            type: event.type,
            startAtInput: formatDateTimeLocalInput(event.startAt),
            endAtInput: formatDateTimeLocalInput(event.endAt),
            status: event.status,
          }}
        />
      </div>

      {event.description && (
        <div className="card">
          <h2>Description preview</h2>
          <EventDescription text={event.description} />
        </div>
      )}

      <div className="grid grid-3">
        <div className="card">
          <h2>{attendCount}</h2>
          <p className="muted">Attend votes</p>
        </div>
        <div className="card">
          <h2>{notAttendCount}</h2>
          <p className="muted">Not attend votes</p>
        </div>
        <div className="card">
          <h2>{pendingSubmissionCount}</h2>
          <p className="muted">Pending approvals</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>{approvedSubmissionCount}</h2>
          <p className="muted">Approved submissions</p>
        </div>
        <div className="card">
          <h2>{rejectedSubmissionCount}</h2>
          <p className="muted">Rejected submissions</p>
        </div>
      </div>

      <div className="card">
        <h2>Votes</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Vote</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {event.votes.map((vote) => (
                <tr key={vote.id}>
                  <td>{vote.user.name}</td>
                  <td>{vote.user.email}</td>
                  <td>
                    <span className={vote.status === "ATTEND" ? "badge success" : "badge danger"}>
                      {vote.status}
                    </span>
                  </td>
                  <td>{formatDateTime(vote.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {event.votes.length === 0 && <p className="muted">No votes yet.</p>}
      </div>

      <div className="card">
        <h2>Submitted runs</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Runner</th>
                <th>Email</th>
                <th>Run</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Points</th>
                <th>Submitted</th>
                <th>Approval</th>
              </tr>
            </thead>
            <tbody>
              {event.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.user.name}</td>
                  <td>{submission.user.email}</td>
                  <td>{submission.activity.name}</td>
                  <td>{submission.distanceKm.toString()}km</td>
                  <td>
                    <span className={submission.status === "APPROVED" ? "badge success" : submission.status === "PENDING" ? "badge warning" : "badge danger"}>
                      {submission.status}
                    </span>
                  </td>
                  <td>{submission.status === "APPROVED" ? submission.totalPoints : "—"}</td>
                  <td>{formatDateTime(submission.createdAt)}</td>
                  <td>
                    <div className="row compact-actions">
                      {submission.status !== "APPROVED" && (
                        <form action={updateSubmissionStatusAction}>
                          <input type="hidden" name="submissionId" value={submission.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <FormSubmitButton className="secondary" pendingLabel="Approving...">
                            Approve
                          </FormSubmitButton>
                        </form>
                      )}
                      {submission.status !== "REJECTED" && (
                        <form action={updateSubmissionStatusAction}>
                          <input type="hidden" name="submissionId" value={submission.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <FormSubmitButton className="ghost danger-action" pendingLabel="Rejecting...">
                            Reject
                          </FormSubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {event.submissions.length === 0 && <p className="muted">No submitted runs yet.</p>}
      </div>
    </>
  );
}
