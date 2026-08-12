import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import onboardingSession from "../netlify/functions/onboarding-session.mjs";
import onboardingSubmit from "../netlify/functions/onboarding-submit.mjs";
import onboardingUpload from "../netlify/functions/onboarding-upload.mjs";

const secret = "test-access-secret";
const cookieName = "sabi_client_access";

process.env.BRONAGH_ACCESS_SECRET = secret;
process.env.BRONAGH_SUBMISSION_SECRET = "test-submission-secret";
process.env.BRONAGH_APPS_SCRIPT_ENDPOINT = "https://example.invalid/receiver";

function accessToken(signEncoded = false, expiresOffsetSeconds = 3600) {
  const payload = `CL-2026-001.cs_password.${Math.floor(Date.now() / 1000) + expiresOffsetSeconds}`;
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(signEncoded ? encoded : payload)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function request(url, body, cookies) {
  return new Request(url, {
    method: "POST",
    headers: {"content-type": "application/json", cookie: cookies},
    body: JSON.stringify(body)
  });
}

const validSessionBody = {
  submissionId: "12345678-1234-1234-1234-123456789012",
  clientReference: "CL-2026-001",
  serviceCode: "career_partner_bespoke"
};

for (const [label, token] of [
  ["raw-payload signature", accessToken(false)],
  ["encoded-payload legacy signature", accessToken(true)]
]) {
  test(`all onboarding functions accept a ${label}`, async () => {
    const cookies = `${cookieName}=${encodeURIComponent(token)}`;

    const sessionResponse = await onboardingSession(request("https://example.test/api/onboarding-session", validSessionBody, cookies));
    assert.equal(sessionResponse.status, 200);
    assert.equal((await sessionResponse.json()).ok, true);

    const submitResponse = await onboardingSubmit(request("https://example.test/api/onboarding-submit", {}, cookies));
    assert.equal(submitResponse.status, 400);
    assert.notEqual((await submitResponse.json()).error, "Your onboarding access needs to be renewed.");

    const uploadResponse = await onboardingUpload(request("https://example.test/api/onboarding-upload", {}, cookies));
    assert.equal(uploadResponse.status, 400);
    assert.notEqual((await uploadResponse.json()).error, "Your onboarding access needs to be renewed.");
  });
}

test("a valid duplicate cookie is accepted when a stale cookie appears first", async () => {
  const cookies = `${cookieName}=${encodeURIComponent(accessToken(false, -60))}; ${cookieName}=${encodeURIComponent(accessToken(false))}`;
  const response = await onboardingSession(request("https://example.test/api/onboarding-session", validSessionBody, cookies));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("invalid access remains rejected", async () => {
  const response = await onboardingSession(request("https://example.test/api/onboarding-session", validSessionBody, `${cookieName}=invalid`));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "Your onboarding access needs to be renewed.");
});
