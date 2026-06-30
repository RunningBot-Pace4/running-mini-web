import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoadingLink } from "@/components/LoadingLink";
import { prisma } from "@/lib/prisma";
import { SharePosterActions } from "@/components/SharePosterActions";
import { getHomeContent } from "@/lib/site-content";
import { formatDateTimeRange } from "@/lib/datetime";

export const dynamic = "force-dynamic";

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
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharePage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const [submission, siteContent] = await Promise.all([
    prisma.submission.findUnique({
      where: { id: submissionId },
      include: { user: true, event: true, activity: true },
    }),
    getHomeContent(),
  ]);

  if (!submission || submission.status !== "APPROVED") notFound();

  const distanceKm = Number(submission.distanceKm).toFixed(2).replace(/\.00$/, "");
  const brandName = (siteContent.brandName || "Run Mini").trim() || "Run Mini";
  const shareText = `${submission.user.name} finished ${distanceKm}km and scored ${submission.totalPoints} points in ${submission.event.title}.`;

  return (
    <>
      <section className="ig-share-layout">
        <div className="ig-story-card" aria-label="Instagram story result preview">
          <div className="ig-story-bg" aria-hidden="true">
            <span className="ig-sun" />
            <span className="ig-wave one" />
            <span className="ig-wave two" />
          </div>

          <header className="ig-story-header">
            <span className="ig-logo-mark">
              {siteContent.logoImageDataUrl ? <img src={siteContent.logoImageDataUrl} alt="" /> : "🏃"}
            </span>
            <div>
              <strong>{brandName}</strong>
              <small>Sweat • Run • Score</small>
            </div>
          </header>

          <main className="ig-story-main">
            <span className="eyebrow">Finish result</span>
            <h1>{distanceKm}<small>km</small></h1>
            <div className="ig-points-pill">{submission.totalPoints} pts earned</div>
            <h2>{submission.event.title}</h2>
            <p>{formatDateTimeRange(submission.event.startAt, submission.event.endAt)}</p>
          </main>

          <div className="ig-route-line" aria-hidden="true">
            <span className="route-node start" />
            <span className="route-node mid" />
            <span className="route-node end" />
            <span className="route-runner">🏃‍♂️</span>
          </div>

          <footer className="ig-story-footer">
            <div>
              <span>Runner</span>
              <strong>{submission.user.name}</strong>
            </div>
            <div className="ig-stat-row">
              <article><strong>{submission.attendancePoints}</strong><span>Attend</span></article>
              <article><strong>{submission.distancePoints}</strong><span>Distance</span></article>
              <article><strong>{submission.totalPoints}</strong><span>Total</span></article>
            </div>
          </footer>
        </div>

        <aside className="ig-share-actions-card">
          <span className="eyebrow">Clean premium story</span>
          <h1>Share your finish.</h1>
          <p className="muted">
            This 9:16 result card is designed for Instagram Story and Xiaohongshu. Use one action only: share, download, or copy caption.
          </p>
          <SharePosterActions
            brandName={brandName}
            userName={submission.user.name}
            eventTitle={submission.event.title}
            activityName={submission.activity.name}
            eventDate={formatDateTimeRange(submission.event.startAt, submission.event.endAt)}
            distanceKm={distanceKm}
            totalPoints={submission.totalPoints}
            attendancePoints={submission.attendancePoints}
            distancePoints={submission.distancePoints}
            shareText={shareText}
          />
        </aside>
      </section>

      <LoadingLink className="button ghost full" href={`/events/${submission.event.slug}`}>
        Back to event
      </LoadingLink>
    </>
  );
}
