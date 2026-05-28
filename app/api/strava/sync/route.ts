import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { syncStravaActivities } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl));

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.redirect(new URL("/", appUrl));

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.redirect(new URL("/", appUrl));

  try {
    await syncStravaActivities(user.id, event.startAt, event.endAt);
    return NextResponse.redirect(new URL(`/events/${event.slug}`, appUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync_failed";
    return NextResponse.redirect(new URL(`/events/${event.slug}?sync_error=${encodeURIComponent(message)}`, appUrl));
  }
}
