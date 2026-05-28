import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { updateEventStatusAction } from "@/app/admin/actions";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

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

  return (
    <>
      <section className="hero">
        <Link className="button ghost" href="/admin">
          ← Back to admin
        </Link>
        <p className="muted" style={{ marginTop: 16 }}>Admin event management</p>
        <h1>{event.title}</h1>
        <p>
          {event.startAt.toLocaleString()} – {event.endAt.toLocaleString()}
        </p>
      </section>

      <div className="card">
        <div className="row">
          <span className={event.status === "OPEN" ? "badge success" : event.status === "CLOSED" ? "badge danger" : "badge"}>
            {event.status}
          </span>
          <Link className="button ghost" href={`/events/${event.slug}`}>
            View public event
          </Link>
        </div>

        <h2>Change event status</h2>
        <p className="muted">
          Closing an event prevents users from voting and submitting new runs. Existing votes and submissions remain visible.
        </p>

        <div className="row">
          {["DRAFT", "OPEN", "CLOSED", "ARCHIVED"].map((status) => (
            <form key={status} action={updateEventStatusAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="status" value={status} />
              <button
                className={event.status === status ? "secondary" : "ghost"}
                type="submit"
                disabled={event.status === status}
              >
                {status}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>{attendCount}</h2>
          <p className="muted">Attend votes</p>
        </div>
        <div className="card">
          <h2>{notAttendCount}</h2>
          <p className="muted">Not attend votes</p>
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
                  <td>{vote.updatedAt.toLocaleString()}</td>
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
                <th>Points</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {event.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.user.name}</td>
                  <td>{submission.user.email}</td>
                  <td>{submission.activity.name}</td>
                  <td>{submission.distanceKm.toString()}km</td>
                  <td>{submission.totalPoints}</td>
                  <td>{submission.createdAt.toLocaleString()}</td>
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
