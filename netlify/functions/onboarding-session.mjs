import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "sabi_client_access";
const CLIENT_REFERENCE = "CL-2026-001";
const SERVICE_CODE = "career_partner_bespoke";
const TOKEN_LIFETIME_MS = 15 * 60 * 1000;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff"
    }
  });
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function secureEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifyAccessToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;

  let payload;
  try {
    payload = Buffer.from(parts[0], "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!secureEqual(expected, parts[1])) return false;

  const [clientReference, sessionId, expiresText] = payload.split(".");
  const expires = Number(expiresText);
  return clientReference === CLIENT_REFERENCE && sessionId.startsWith("cs_") && Number.isFinite(expires) && expires >= Math.floor(Date.now() / 1000);
}

export default async function onboardingSession(request) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const accessSecret = process.env.BRONAGH_ACCESS_SECRET;
  const submissionSecret = process.env.BRONAGH_SUBMISSION_SECRET;
  const endpoint = process.env.BRONAGH_APPS_SCRIPT_ENDPOINT;

  if (!accessSecret || !submissionSecret || !endpoint) {
    return json({ ok: false, error: "The secure submission connection is not active yet." }, 503);
  }

  if (!verifyAccessToken(cookieValue(request, COOKIE_NAME), accessSecret)) {
    return json({ ok: false, error: "Your onboarding access needs to be renewed." }, 401);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const submissionId = String(input.submissionId || "");
  if (!/^[a-z0-9-]{20,80}$/i.test(submissionId)) {
    return json({ ok: false, error: "Invalid submission reference." }, 400);
  }
  if (input.clientReference !== CLIENT_REFERENCE || input.serviceCode !== SERVICE_CODE) {
    return json({ ok: false, error: "Invalid client submission." }, 400);
  }

  const claims = {
    submissionId,
    clientReference: CLIENT_REFERENCE,
    serviceCode: SERVICE_CODE,
    exp: Date.now() + TOKEN_LIFETIME_MS
  };
  const encodedClaims = base64Url(JSON.stringify(claims));
  const signature = createHmac("sha256", submissionSecret)
    .update(encodedClaims)
    .digest("base64url");

  return json({
    ok: true,
    endpoint,
    token: `${encodedClaims}.${signature}`,
    expiresInSeconds: TOKEN_LIFETIME_MS / 1000
  });
}

export const config = {
  path: "/api/onboarding-session"
};
