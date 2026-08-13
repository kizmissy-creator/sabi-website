import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "sabi_tester_access";
export const CLIENT_REFERENCE = "TEST-CAREER-PARTNER";
export const SERVICE_CODE = "career_partner_test";
export const TOKEN_LIFETIME_MS = 15 * 60 * 1000;

export function json(body, status = 200) {
  return Response.json(body, {status, headers: {"cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff"}});
}

function equal(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hasValidAccess(request) {
  const secret = process.env.TESTER_ACCESS_SECRET || "";
  if (!secret) return false;
  const cookies = request.headers.get("cookie") || "";
  return cookies.split(";").some(part => {
    const [key, ...rest] = part.trim().split("=");
    if (key !== COOKIE_NAME) return false;
    try {
      const [encoded, signature] = decodeURIComponent(rest.join("=")).split(".");
      if (!encoded || !signature) return false;
      const payload = Buffer.from(encoded, "base64url").toString("utf8");
      const expected = createHmac("sha256", secret).update(payload).digest("base64url");
      const [reference, session, expires] = payload.split(".");
      return equal(signature, expected) && reference === CLIENT_REFERENCE && session.startsWith("test_") && Number(expires) >= Math.floor(Date.now() / 1000);
    } catch { return false; }
  });
}

export function validSubmission(input) {
  return input.clientReference === CLIENT_REFERENCE && input.serviceCode === SERVICE_CODE && /^[a-z0-9-]{20,80}$/i.test(String(input.submissionId || ""));
}

export function submissionToken(input) {
  const secret = process.env.TESTER_SUBMISSION_SECRET || "";
  if (!secret) throw new Error("Tester submission secret is missing.");
  const claims = {submissionId: input.submissionId, clientReference: CLIENT_REFERENCE, serviceCode: SERVICE_CODE, exp: Date.now() + TOKEN_LIFETIME_MS};
  const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function receiverEndpoint() {
  return process.env.TESTER_APPS_SCRIPT_ENDPOINT || "";
}
