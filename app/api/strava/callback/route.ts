import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { exchangeCodeForToken } from "@/lib/strava";

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function redirectBack(appUrl: string, nextPath: string, key: string, value: string) {
  const url = new URL(nextPath, appUrl);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || request.nextUrl.origin;
  const user = await getCurrentUser();

  const store = await cookies();
  const expectedState = store.get("strava_oauth_state")?.value;
  const nextPath = safeNext(store.get("strava_oauth_next")?.value);
  store.delete("strava_oauth_state");
  store.delete("strava_oauth_next");

  if (!user) return NextResponse.redirect(new URL("/login", appUrl));

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return redirectBack(appUrl, nextPath, "strava_error", error);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectBack(appUrl, nextPath, "strava_error", "invalid_state");
  }

  try {
    const token = await exchangeCodeForToken(code);
    if (!token.athlete?.id) {
      return redirectBack(appUrl, nextPath, "strava_error", "no_athlete");
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

    return redirectBack(appUrl, nextPath, "strava_connected", "1");
  } catch (error) {
    const message = error instanceof Error ? error.message : "token_exchange_failed";
    return redirectBack(appUrl, nextPath, "strava_error", message);
  }
}
