import { prisma } from "@/lib/prisma";

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope?: string;
  athlete?: { id: number };
};

export type StravaActivitySummary = {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number;
  moving_time: number;
  elapsed_time?: number;
  start_date: string;
};

function stravaClientId() {
  const value = process.env.STRAVA_CLIENT_ID;
  if (!value) throw new Error("Missing STRAVA_CLIENT_ID");
  return value;
}

function stravaClientSecret() {
  const value = process.env.STRAVA_CLIENT_SECRET;
  if (!value) throw new Error("Missing STRAVA_CLIENT_SECRET");
  return value;
}

export function getStravaAuthorizeUrl(state: string) {
  const redirectUri = process.env.STRAVA_REDIRECT_URI || `${process.env.APP_URL}/api/strava/callback`;
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", stravaClientId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", "read,activity:read_all");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: stravaClientId(),
      client_secret: stravaClientSecret(),
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Strava token exchange failed: ${response.status}`);
  }

  return response.json();
}

async function refreshToken(userId: string): Promise<string> {
  const token = await prisma.stravaToken.findUnique({ where: { userId } });
  if (!token) throw new Error("STRAVA_NOT_CONNECTED");

  const now = Math.floor(Date.now() / 1000);
  if (token.expiresAt > now + 60) return token.accessToken;

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: stravaClientId(),
      client_secret: stravaClientSecret(),
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Strava refresh failed: ${response.status}`);
  }

  const refreshed = (await response.json()) as StravaTokenResponse;

  await prisma.stravaToken.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at,
      scope: refreshed.scope || token.scope,
    },
  });

  return refreshed.access_token;
}

export async function syncStravaActivities(userId: string, after: Date, before: Date) {
  const accessToken = await refreshToken(userId);
  const afterEpoch = Math.floor(after.getTime() / 1000);
  const beforeEpoch = Math.floor(before.getTime() / 1000);

  let page = 1;
  let saved = 0;

  while (page <= 5) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.searchParams.set("after", String(afterEpoch));
    url.searchParams.set("before", String(beforeEpoch));
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Strava activities fetch failed: ${response.status}`);
    }

    const activities = (await response.json()) as StravaActivitySummary[];
    if (activities.length === 0) break;

    for (const activity of activities) {
      const isRun =
        activity.type?.toLowerCase() === "run" ||
        activity.sport_type?.toLowerCase().includes("run");

      if (!isRun) continue;

      await prisma.stravaActivity.upsert({
        where: {
          userId_stravaId: {
            userId,
            stravaId: BigInt(activity.id),
          },
        },
        update: {
          name: activity.name,
          type: activity.type,
          sportType: activity.sport_type,
          distanceMeters: activity.distance,
          movingTimeSec: activity.moving_time,
          elapsedTimeSec: activity.elapsed_time,
          startDate: new Date(activity.start_date),
          rawJson: activity as object,
        },
        create: {
          userId,
          stravaId: BigInt(activity.id),
          name: activity.name,
          type: activity.type,
          sportType: activity.sport_type,
          distanceMeters: activity.distance,
          movingTimeSec: activity.moving_time,
          elapsedTimeSec: activity.elapsed_time,
          startDate: new Date(activity.start_date),
          rawJson: activity as object,
        },
      });

      saved++;
    }

    if (activities.length < 100) break;
    page++;
  }

  return saved;
}
