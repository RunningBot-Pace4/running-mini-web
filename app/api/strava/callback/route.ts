import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { exchangeCodeForToken } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const user = await getCurrentUser();

  if (!user) return NextResponse.redirect(new URL("/login", appUrl));

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return NextResponse.redirect(new URL(`/?strava_error=${encodeURIComponent(error)}`, appUrl));

  const store = await cookies();
  const expectedState = store.get("strava_oauth_state")?.value;
  store.delete("strava_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/?strava_error=invalid_state", appUrl));
  }

  const token = await exchangeCodeForToken(code);
  if (!token.athlete?.id) {
    return NextResponse.redirect(new URL("/?strava_error=no_athlete", appUrl));
  }

  await prisma.$transaction([
    prisma.stravaToken.upsert({
      where: { userId: user.id },
      update: {
        athleteId: BigInt(token.athlete.id),
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: token.scope || "read,activity:read_all",
      },
      create: {
        userId: user.id,
        athleteId: BigInt(token.athlete.id),
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: token.scope || "read,activity:read_all",
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { stravaAthleteId: BigInt(token.athlete.id) },
    }),
  ]);

  return NextResponse.redirect(new URL("/", appUrl));
}
