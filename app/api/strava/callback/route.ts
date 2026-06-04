import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignedOAuthState } from "@/lib/oauth-state";
import { exchangeCodeForToken } from "@/lib/strava";
import { appBaseUrl } from "@/lib/strava-config";

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
  const appUrl = appBaseUrl(request.nextUrl.origin);

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const verifiedState = verifySignedOAuthState(state);
  const nextPath = safeNext(verifiedState?.nextPath);

  if (error) return redirectBack(appUrl, nextPath, "strava_error", error);

  if (!code || !verifiedState) {
    return redirectBack(appUrl, nextPath, "strava_error", "invalid_state");
  }

  const user = await prisma.user.findUnique({ where: { id: verifiedState.userId } });
  if (!user) return NextResponse.redirect(new URL("/login", appUrl));

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
