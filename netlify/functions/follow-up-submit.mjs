import { createHmac } from 'node:crypto';
import { hasValidAccess } from './onboarding-session.mjs';

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' } });
export default async function followUpSubmit(request) {
  if (request.method !== 'POST') return reply({ ok: false }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ ok: false, error: 'Please send from your private follow-up page.' }, 403);
  const secret = process.env.BRONAGH_SUBMISSION_SECRET;
  const access = process.env.BRONAGH_ACCESS_SECRET;
  const endpoint = process.env.BRONAGH_APPS_SCRIPT_ENDPOINT;
  if (!secret || !access || !endpoint) return reply({ ok: false, error: 'The secure connection is not available yet.' }, 503);
  if (!hasValidAccess(request, access)) return reply({ ok: false, error: 'Please reopen your private follow-up link to renew access. Your draft is still saved.' }, 401);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 500000) return reply({ ok: false, error: 'This response is too large to send.' }, 413);
  let input;
  try { input = JSON.parse(raw); } catch { return reply({ ok: false, error: 'The response could not be read.' }, 400); }
  if (!input || input.clientReference !== 'CL-2026-001' || input.formType !== 'career_partner_follow_up' ||
    !/^[a-f0-9-]{36}$/i.test(input.submissionId || '') || typeof input.formVersion !== 'string' || input.formVersion.length > 100 ||
    !input.answers || typeof input.answers !== 'object' || Array.isArray(input.answers) ||
    typeof input.reviewText !== 'string' || !input.reviewText.trim() || input.reviewText.length > 200000 ||
    typeof input.testMode !== 'boolean') return reply({ ok: false, error: 'The follow-up response is incomplete.' }, 400);
  if (!input.testMode && process.env.BRONAGH_FOLLOW_UP_ENABLED !== 'true') return reply({ ok: false, error: 'Sending is not open yet. Your draft is safe on this device.' }, 503);
  const submission = { clientReference: 'CL-2026-001', formType: 'career_partner_follow_up', formVersion: input.formVersion,
    submissionId: input.submissionId, testMode: input.testMode, answers: input.answers,
    retainedAnswers: input.retainedAnswers || {}, reviewText: input.reviewText };
  const payload = JSON.stringify({ action: 'career_partner_follow_up', submission, expiresAt: Date.now() + 5 * 60 * 1000 });
  const signature = createHmac('sha256', secret).update('follow-up-v1\n' + payload).digest('base64url');
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'career_partner_follow_up', payload, signature }), signal: AbortSignal.timeout(25000), redirect: 'follow' });
    const result = await response.json();
    if (response.ok && result.ok === true && result.submissionId === submission.submissionId && result.formType === submission.formType) {
      return reply({ ok: true, submissionId: result.submissionId });
    }
  } catch { /* An unconfirmed save remains retryable with the same submission ID. */ }
  return reply({ ok: false, error: 'Receipt was not confirmed. Your answers are still saved; please try sending again.' }, 502);
}
export const config = { path: '/api/follow-up-submit' };
