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

function cookieValues(request, name) {
  const cookies = request.headers.get("cookie") || "";
  const values = [];
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key !== name) continue;
    try {
      values.push(decodeURIComponent(rest.join("=")));
    } catch {
      values.push(rest.join("="));
    }
  }
  return values;
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function validAccessToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  const [encodedPayload, signature] = parts;
  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const rawSignature = createHmac("sha256", secret).update(payload).digest("base64url");
    const encodedSignature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    if (!secureEqual(rawSignature, signature) && !secureEqual(encodedSignature, signature)) return false;
    const [clientReference, sessionId, expiresText] = payload.split(".");
    return clientReference === CLIENT_REFERENCE && sessionId.startsWith("cs_") && Number(expiresText) >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function hasValidAccess(request, secret) {
  return cookieValues(request, COOKIE_NAME).some(token => validAccessToken(token, secret));
}

export default async function onboardingSubmit(request) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const accessSecret = process.env.BRONAGH_ACCESS_SECRET;
  const endpoint = process.env.BRONAGH_APPS_SCRIPT_ENDPOINT;
  if (!accessSecret || !endpoint) return json({ ok: false, error: "The secure submission connection is not active yet." }, 503);
  if (!hasValidAccess(request, accessSecret)) return json({ ok: false, error: "Your onboarding access needs to be renewed." }, 401);

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
    console.error("Onboarding receiver confirmation mismatch", JSON.stringify({
      responseStatus: response.status,
      responseUrl: response.url,
      responseType: response.headers.get("content-type"),
      responseBody: responseText.slice(0, 500),
      expectedSubmissionId: input.submissionId
    }));
    return json({ ok: false, error: "The secure record did not confirm receipt. Your answers are still saved on this device." }, 502);
  }
  return json({ ok: true, submissionId: input.submissionId });
}

export const config = { path: "/api/onboarding-submit" };
