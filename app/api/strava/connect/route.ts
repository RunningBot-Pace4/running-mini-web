import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getStravaAuthorizeUrl } from "@/lib/strava";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function withError(appUrl: string, nextPath: string, message: string) {
  const url = new URL(nextPath, appUrl);
  url.searchParams.set("strava_error", message);
  return url;
}

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || request.nextUrl.origin;
  const user = await getCurrentUser();
  const nextPath = safeNext(request.nextUrl.searchParams.get("next"));

  if (!user) {
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const state = randomBytes(24).toString("base64url");
  const store = await cookies();
  const redirectUri = process.env.STRAVA_REDIRECT_URI || `${appUrl}/api/strava/callback`;

  store.set("strava_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  store.set("strava_oauth_next", nextPath, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  try {
    return NextResponse.redirect(getStravaAuthorizeUrl(state, redirectUri));
  } catch (error) {
    const message = error instanceof Error ? error.message : "strava_config_error";
    return NextResponse.redirect(withError(appUrl, nextPath, message));
  }
}
