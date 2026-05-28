import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  const events = await prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { startAt: "desc" },
    include: {
      _count: { select: { votes: true, submissions: true } },
    },
  });

  return (
    <>
      <section className="hero">
        <h1>Mobile running events with Strava scoring.</h1>
        <p>
          Register, vote attendance, submit event activities, earn points and share your result.
        </p>
      </section>

      {!user && (
        <div className="card">
          <h2>Join the run</h2>
          <p className="muted">Create an account before voting and submitting Strava runs.</p>
          <div className="row">
            <Link className="button" href="/register">
              Register
            </Link>
            <Link className="button ghost" href="/login">
              Login
            </Link>
          </div>
        </div>
      )}

      <div className="grid">
        {events.map((event) => (
          <article className="card" key={event.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className={event.status === "OPEN" ? "badge success" : "badge"}>
                {event.status}
              </span>
              <span className="muted">{event._count.votes} votes · {event._count.submissions} runs</span>
            </div>
            <h2>{event.title}</h2>
            <p className="muted">
              {event.startAt.toLocaleDateString()} – {event.endAt.toLocaleDateString()}
            </p>
            {event.description && <p>{event.description}</p>}
            <Link className="button full" href={`/events/${event.slug}`}>
              View event
            </Link>
          </article>
        ))}

        {events.length === 0 && (
          <div className="card">
            <h2>No events yet</h2>
            <p className="muted">Ask an admin to create the first running event.</p>
          </div>
        )}
      </div>
    </>
  );
}
