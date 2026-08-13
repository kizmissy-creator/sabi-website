import { hasValidAccess, json, receiverEndpoint, submissionToken, validSubmission } from "./tester-common.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return json({ok: false, error: "Method not allowed."}, 405);
  if (!hasValidAccess(request)) return json({ok: false, error: "Tester access needs to be renewed."}, 401);
  let input;
  try { input = await request.json(); } catch { return json({ok: false, error: "Invalid upload request."}, 400); }
  if (!validSubmission(input) || !["ticket", "status", "delete"].includes(input.action)) return json({ok: false, error: "Invalid upload request."}, 400);
  const endpoint = receiverEndpoint();
  if (!endpoint) return json({ok: false, error: "The tester upload receiver is not configured yet."}, 503);
  let token;
  try { token = submissionToken(input); } catch { return json({ok: false, error: "The tester upload receiver is not configured yet."}, 503); }
  if (input.action === "ticket") return json({ok: true, receiverUrl: endpoint, token});
  const relay = {action: input.action === "status" ? "file_status" : "file_delete", submissionId: input.submissionId, clientReference: input.clientReference, serviceCode: input.serviceCode, submissionToken: token};
  if (input.action === "status") relay.uploadRequestId = input.uploadRequestId;
  else relay.uploadId = input.uploadId;
  try {
    const response = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(relay), redirect: "follow"});
    const received = await response.json().catch(() => ({}));
    if (!response.ok || !received.ok) return json({ok: false, error: received.error || "The test document request was not confirmed."}, 502);
    return json(input.action === "status" ? received : {ok: true, uploadId: input.uploadId});
  } catch { return json({ok: false, error: "The separate tester folder could not be reached."}, 502); }
}

export const config = {path: "/api/test-onboarding-upload", rateLimit: {windowSize: 60, windowLimit: 90, aggregateBy: ["ip", "domain"]}};
