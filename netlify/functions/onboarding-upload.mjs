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
  const [encodedPayload, signature] = parts;
  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const expected = createHmac("sha256", secret).update(payload).digest("base64url");
    if (!secureEqual(expected, signature)) return false;
    const [clientReference, sessionId, expiresText] = payload.split(".");
    return clientReference === CLIENT_REFERENCE && sessionId.startsWith("cs_") && Number(expiresText) >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function submissionToken(submissionId, secret) {
  const claims = {
    submissionId,
    clientReference: CLIENT_REFERENCE,
    serviceCode: SERVICE_CODE,
    exp: Date.now() + TOKEN_LIFETIME_MS
  };
  const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function validSubmission(input) {
  return input.clientReference === CLIENT_REFERENCE
    && input.serviceCode === SERVICE_CODE
    && /^[a-z0-9-]{20,80}$/i.test(String(input.submissionId || ""));
}

export default async function onboardingUpload(request) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const accessSecret = process.env.BRONAGH_ACCESS_SECRET;
  const submissionSecret = process.env.BRONAGH_SUBMISSION_SECRET;
  const endpoint = process.env.BRONAGH_APPS_SCRIPT_ENDPOINT;
  if (!accessSecret || !submissionSecret || !endpoint) return json({ ok: false, error: "The secure upload connection is not active yet." }, 503);
  if (!validAccessToken(cookieValue(request, COOKIE_NAME), accessSecret)) return json({ ok: false, error: "Your onboarding access needs to be renewed." }, 401);

  const raw = await request.text();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Invalid upload request." }, 400);
  }
  if (!validSubmission(input) || !["ticket", "status", "delete"].includes(input.action)) return json({ ok: false, error: "Invalid upload request." }, 400);

  if (input.action === "ticket") {
    if (!/^[a-z0-9-]{20,80}$/i.test(String(input.uploadRequestId || ""))) return json({ok: false, error: "Invalid upload request."}, 400);
    return json({ok: true, receiverUrl: endpoint, token: submissionToken(input.submissionId, submissionSecret)});
  }
  if (input.action === "status" && !/^[a-z0-9-]{20,80}$/i.test(String(input.uploadRequestId || ""))) return json({ok: false, error: "Invalid upload request."}, 400);
  if (input.action === "delete" && !/^[a-z0-9_-]{10,180}$/i.test(String(input.uploadId || ""))) return json({ok: false, error: "Invalid document reference."}, 400);

  const relay = {
    action: input.action === "status" ? "file_status" : "file_delete",
    submissionId: input.submissionId,
    clientReference: CLIENT_REFERENCE,
    serviceCode: SERVICE_CODE,
    submissionToken: submissionToken(input.submissionId, submissionSecret)
  };
  if (input.action === "status") relay.uploadRequestId = input.uploadRequestId;
  else relay.uploadId = input.uploadId;

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(relay),
      redirect: "follow"
    });
  } catch {
    return json({ ok: false, error: "The private document folder could not be reached. Please try again." }, 502);
  }

  const received = await response.json().catch(() => ({}));
  if (!response.ok || !received.ok) return json({ok: false, error: received.error || "The document request was not confirmed."}, 502);
  if (input.action === "status") return json(received);
  return json({ok: true, uploadId: input.uploadId});
}

export const config = {
  path: "/api/onboarding-upload",
  rateLimit: {windowSize: 60, windowLimit: 90, aggregateBy: ["ip", "domain"]}
};
