import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminEventForm } from "@/components/AdminEventForm";
import { createEventAction, updateEventStatusAction } from "@/app/admin/actions";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { votes: true, submissions: true } },
    },
  });

  return (
    <>
      <section className="hero">
        <h1>Admin</h1>
        <p>Create events that users can vote for and submit Strava activities to.</p>
      </section>

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
                    <Link href={`/events/${event.slug}`}>{event.title}</Link>
                    <br />
                    <span className="muted">
                      {event.startAt.toLocaleDateString()} – {event.endAt.toLocaleDateString()}
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
                      <Link className="button ghost" href={`/admin/events/${event.id}`}>
                        Manage
                      </Link>
                      {event.status !== "CLOSED" && (
                        <form action={updateEventStatusAction}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="CLOSED" />
                          <button className="ghost" type="submit">Close</button>
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
