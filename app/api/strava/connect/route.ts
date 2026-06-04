import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createSignedOAuthState } from "@/lib/oauth-state";
import { getStravaAuthorizeUrl } from "@/lib/strava";
import { appBaseUrl, stravaRedirectUri } from "@/lib/strava-config";

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
  const appUrl = appBaseUrl(request.nextUrl.origin);
  const user = await getCurrentUser();
  const nextPath = safeNext(request.nextUrl.searchParams.get("next"));

  if (!user) {
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const redirectUri = stravaRedirectUri(request.nextUrl.origin);

  try {
    const state = createSignedOAuthState(user.id, nextPath);
    return NextResponse.redirect(getStravaAuthorizeUrl(state, redirectUri));
  } catch (error) {
    const message = error instanceof Error ? error.message : "strava_config_error";
    return NextResponse.redirect(withError(appUrl, nextPath, message));
  }
}
