import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminEventForm } from "@/components/AdminEventForm";
import { createEventAction } from "@/app/admin/actions";

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
                  <td>{event.status}</td>
                  <td>{event._count.votes}</td>
                  <td>{event._count.submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
