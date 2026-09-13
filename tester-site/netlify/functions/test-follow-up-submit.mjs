import { createHmac } from 'node:crypto';
import { hasValidAccess, json, receiverEndpoint } from './tester-common.mjs';

export default async function handler(request) {
  if (request.method !== 'POST') return json({ ok: false }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ ok: false, error: 'Please send from the tester page.' }, 403);
  if (!hasValidAccess(request)) return json({ ok: false, error: 'Please reopen the tester page and enter the tester password. Your draft is still saved.' }, 401);
  if (process.env.TESTER_FOLLOW_UP_ENABLED !== 'true') return json({ ok: false, error: 'Test sending is not connected yet. Nothing has been sent; your draft is saved.' }, 503);
  const secret = process.env.TESTER_SUBMISSION_SECRET;
  const endpoint = receiverEndpoint();
  if (!secret || !endpoint) return json({ ok: false, error: 'Test sending is not connected yet. Your draft is saved.' }, 503);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 500000) return json({ ok: false, error: 'This response is too large to send.' }, 413);
  let input;
  try { input = JSON.parse(raw); } catch { return json({ ok: false, error: 'The response could not be read.' }, 400); }
  if (!input || input.testMode !== true || input.clientReference !== 'CL-2026-001' || input.formType !== 'career_partner_follow_up' ||
    !/^[a-f0-9-]{36}$/i.test(input.submissionId || '') || typeof input.formVersion !== 'string' || input.formVersion.length > 100 ||
    !input.answers || typeof input.answers !== 'object' || Array.isArray(input.answers) ||
    typeof input.reviewText !== 'string' || !input.reviewText.trim() || input.reviewText.length > 200000) {
    return json({ ok: false, error: 'This page accepts test follow-up answers only.' }, 400);
  }
  const submission = { clientReference: 'CL-2026-001', formType: 'career_partner_follow_up', testMode: true,
    submissionId: input.submissionId, formVersion: input.formVersion, answers: input.answers,
    retainedAnswers: input.retainedAnswers || {}, reviewText: input.reviewText };
  const payload = JSON.stringify({ action: 'career_partner_follow_up', submission, expiresAt: Date.now() + 5 * 60 * 1000 });
  const signature = createHmac('sha256', secret).update('follow-up-v1\n' + payload).digest('base64url');
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'career_partner_follow_up', testOnly: true, payload, signature }),
      signal: AbortSignal.timeout(25000), redirect: 'follow' });
    const result = await response.json();
    if (response.ok && result.ok === true && result.submissionId === submission.submissionId && result.formType === submission.formType) {
      return json({ ok: true, submissionId: result.submissionId, testOnly: true });
    }
  } catch { /* Only a matching Google receipt confirms a save; retries keep the same ID. */ }
  return json({ ok: false, error: 'The test record did not confirm receipt. Your answers are saved on this device; please try sending again.' }, 502);
}
export const config = { path: '/api/test-follow-up-submit' };
