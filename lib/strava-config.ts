export function normalizeBaseUrl(value?: string | null) {
  if (!value) return "";
  return value.replace(/\/$/, "");
}

export function appBaseUrl(requestOrigin?: string) {
  return normalizeBaseUrl(process.env.APP_URL || requestOrigin || "http://localhost:3000");
}

export function stravaRedirectUri(requestOrigin?: string) {
  const explicit = normalizeBaseUrl(process.env.STRAVA_REDIRECT_URI || "");
  if (explicit) return explicit;
  return `${appBaseUrl(requestOrigin)}/api/strava/callback`;
}

export function stravaCallbackDomain(requestOrigin?: string) {
  try {
    return new URL(stravaRedirectUri(requestOrigin)).host;
  } catch {
    return "";
  }
}

export function stravaConfigStatus(requestOrigin?: string) {
  const redirectUri = stravaRedirectUri(requestOrigin);
  const callbackDomain = stravaCallbackDomain(requestOrigin);

  return {
    hasClientId: Boolean(process.env.STRAVA_CLIENT_ID),
    hasClientSecret: Boolean(process.env.STRAVA_CLIENT_SECRET),
    appUrl: appBaseUrl(requestOrigin),
    redirectUri,
    callbackDomain,
    ready: Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET && callbackDomain),
  };
}
