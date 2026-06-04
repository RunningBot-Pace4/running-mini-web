import { createHmac, randomBytes, timingSafeEqual } from "crypto";

type OAuthStatePayload = {
  userId: string;
  nextPath: string;
  nonce: string;
  exp: number;
};

function signingSecret() {
  const value = process.env.SESSION_SECRET || process.env.STRAVA_CLIENT_SECRET;
  if (!value) throw new Error("Missing SESSION_SECRET or STRAVA_CLIENT_SECRET");
  return value;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createSignedOAuthState(userId: string, nextPath: string) {
  const payload: OAuthStatePayload = {
    userId,
    nextPath,
    nonce: randomBytes(16).toString("base64url"),
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
  };

  const encodedPayload = base64url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySignedOAuthState(state: string | null) {
  if (!state) return null;

  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  if (!safeCompare(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!payload.userId || !payload.nextPath || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.nextPath.startsWith("/") || payload.nextPath.startsWith("//")) payload.nextPath = "/";
    return payload;
  } catch {
    return null;
  }
}
