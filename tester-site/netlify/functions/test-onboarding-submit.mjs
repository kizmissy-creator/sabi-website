import { hasValidAccess, json, receiverEndpoint, validSubmission } from "./tester-common.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return json({ok: false, error: "Method not allowed."}, 405);
  if (!hasValidAccess(request)) return json({ok: false, error: "Tester access needs to be renewed."}, 401);
  const raw = await request.text();
  if (!raw || raw.length > 26_000_000) return json({ok: false, error: "The test submission is too large."}, 413);
  let input;
  try { input = JSON.parse(raw); } catch { return json({ok: false, error: "Invalid submission."}, 400); }
  if (!validSubmission(input) || !input.submissionToken) return json({ok: false, error: "Invalid tester submission."}, 400);
  const endpoint = receiverEndpoint();
  if (!endpoint) return json({ok: false, error: "The tester receiver is not configured yet."}, 503);
  try {
    const response = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: raw, redirect: "follow"});
    const received = await response.json().catch(() => ({}));
    if (response.ok && received.ok && received.submissionId === input.submissionId) return json({ok: true, submissionId: input.submissionId, testOnly: true});
    return json({ok: false, error: "The separate tester record did not confirm receipt."}, 502);
  } catch { return json({ok: false, error: "The separate tester record could not be reached."}, 502); }
}

export const config = {path: "/api/test-onboarding-submit"};
