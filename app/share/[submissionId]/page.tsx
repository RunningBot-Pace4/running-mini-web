import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ShareButtons } from "@/components/ShareButtons";

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

  if (!submission) return {};

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

  if (!submission) notFound();

  const shareText = `${submission.user.name} scored ${submission.totalPoints} points in ${submission.event.title}: ${submission.distanceKm.toString()}km run!`;

  return (
    <>
      <div className="share-card">
        <p className="muted">{submission.event.title}</p>
        <h1>{submission.user.name}</h1>
        <div className="score">{submission.totalPoints} pts</div>
        <p>
          {submission.activity.name} · {submission.distanceKm.toString()}km
        </p>
        <p className="muted">
          {submission.attendancePoints} attendance point{submission.attendancePoints === 1 ? "" : "s"} + {submission.distancePoints} distance points
        </p>
      </div>

      <div className="card">
        <h2>Share your result</h2>
        <ShareButtons text={shareText} />
      </div>

      <Link className="button ghost full" href={`/events/${submission.event.slug}`}>
        Back to event
      </Link>
    </>
  );
}
