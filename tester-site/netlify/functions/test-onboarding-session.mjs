import { hasValidAccess, json, submissionToken, TOKEN_LIFETIME_MS, validSubmission } from "./tester-common.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return json({ok: false, error: "Method not allowed."}, 405);
  if (!hasValidAccess(request)) return json({ok: false, error: "Tester access needs to be renewed."}, 401);
  let input;
  try { input = await request.json(); } catch { return json({ok: false, error: "Invalid request."}, 400); }
  if (!validSubmission(input)) return json({ok: false, error: "Invalid tester submission."}, 400);
  try { return json({ok: true, token: submissionToken(input), expiresInSeconds: TOKEN_LIFETIME_MS / 1000}); }
  catch { return json({ok: false, error: "The tester receiver is not configured yet."}, 503); }
}

export const config = {path: "/api/test-onboarding-session"};
