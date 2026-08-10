import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "sabi_client_access";
const CLIENT_REFERENCE = "CL-2026-001";
const SERVICE_CODE = "career_partner_bespoke";
const MAX_REQUEST_BYTES = 26_000_000;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" }
  });
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function validAccessToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!secureEqual(expected, signature)) return false;
  try {
    const [clientReference, sessionId, expiresText] = Buffer.from(payload, "base64url").toString("utf8").split(".");
    return clientReference === CLIENT_REFERENCE && sessionId.startsWith("cs_") && Number(expiresText) >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export default async function onboardingSubmit(request) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const accessSecret = process.env.BRONAGH_ACCESS_SECRET;
  const endpoint = process.env.BRONAGH_APPS_SCRIPT_ENDPOINT;
  if (!accessSecret || !endpoint) return json({ ok: false, error: "The secure submission connection is not active yet." }, 503);
  if (!validAccessToken(cookieValue(request, COOKIE_NAME), accessSecret)) return json({ ok: false, error: "Your onboarding access needs to be renewed." }, 401);

  const raw = await request.text();
  if (!raw || raw.length > MAX_REQUEST_BYTES) return json({ ok: false, error: "The submission is too large." }, 413);

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Invalid submission." }, 400);
  }
  if (input.clientReference !== CLIENT_REFERENCE || input.serviceCode !== SERVICE_CODE || !/^[a-z0-9-]{20,80}$/i.test(String(input.submissionId || "")) || !input.submissionToken) {
    return json({ ok: false, error: "Invalid client submission." }, 400);
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: raw,
      redirect: "follow"
    });
  } catch {
    return json({ ok: false, error: "The secure record could not be reached. Your answers are still saved on this device." }, 502);
  }

  const responseText = await response.text();
  let received;
  try {
    received = JSON.parse(responseText);
  } catch {
    received = {};
  }
  if (!response.ok || !received.ok || received.submissionId !== input.submissionId) {
    return json({ ok: false, error: "The secure record did not confirm receipt. Your answers are still saved on this device." }, 502);
  }
  return json({ ok: true, submissionId: input.submissionId });
}

export const config = { path: "/api/onboarding-submit" };
