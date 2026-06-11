import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoadingLink } from "@/components/LoadingLink";
import { prisma } from "@/lib/prisma";
import { ShareButtons } from "@/components/ShareButtons";
import { SharePosterActions } from "@/components/SharePosterActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}): Promise<Metadata> {
  const { submissionId } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { user: true, event: true, activity: true },
  });

  if (!submission || submission.status !== "APPROVED") return {};

  const title = `${submission.user.name} scored ${submission.totalPoints} points`;
  const description = `${submission.activity.name} · ${submission.distanceKm.toString()}km · ${submission.event.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { user: true, event: true, activity: true },
  });

  if (!submission || submission.status !== "APPROVED") notFound();

  const distanceKm = Number(submission.distanceKm).toFixed(2).replace(/\.00$/, "");
  const shareText = `${submission.user.name} scored ${submission.totalPoints} points in ${submission.event.title}: ${distanceKm}km run!`;

  return (
    <>
      <section className="share-hero-section">
        <div className="share-story-preview" aria-label="Instagram story result preview">
          <div className="story-sky" aria-hidden="true">
            <span className="story-sun" />
            <span className="story-wave one" />
            <span className="story-wave two" />
          </div>

          <div className="story-header">
            <span className="story-logo">🏃</span>
            <div>
              <strong>Run Mini</strong>
              <small>Sweat • Run • Score</small>
            </div>
          </div>

          <div className="story-metric-card">
            <span>FINISH RESULT</span>
            <strong>{distanceKm}km</strong>
            <em>{submission.totalPoints} pts</em>
          </div>

          <div className="story-route" aria-hidden="true">
            <span className="route-dot start" />
            <span className="route-dot mid" />
            <span className="route-dot end" />
            <span className="route-runner">🏃‍♂️</span>
          </div>

          <div className="story-runner-card">
            <span>RUNNER</span>
            <strong>{submission.user.name}</strong>
            <small>{submission.event.title}</small>
          </div>

          <div className="story-points-row">
            <div>
              <strong>{submission.attendancePoints}</strong>
              <span>Attend</span>
            </div>
            <div>
              <strong>{submission.distancePoints}</strong>
              <span>Distance</span>
            </div>
            <div>
              <strong>{submission.totalPoints}</strong>
              <span>Total</span>
            </div>
          </div>
        </div>

        <div className="share-control-card">
          <span className="eyebrow">Share card</span>
          <h1>Ready for Instagram Story.</h1>
          <p className="muted">
            The card is designed in 9:16 story style with large distance, points, route line and runner details.
          </p>
          <SharePosterActions
            userName={submission.user.name}
            eventTitle={submission.event.title}
            activityName={submission.activity.name}
            distanceKm={distanceKm}
            totalPoints={submission.totalPoints}
            attendancePoints={submission.attendancePoints}
            distancePoints={submission.distancePoints}
            shareText={shareText}
          />
        </div>
      </section>

      <div className="card">
        <h2>Share link</h2>
        <ShareButtons text={shareText} />
      </div>

      <LoadingLink className="button ghost full" href={`/events/${submission.event.slug}`}>
        Back to event
      </LoadingLink>
    </>
  );
}
