import clientAuth from './client-auth-30d.js';
import { FOLLOW_UP_COOKIE, createFollowUpSession, followUpSession, matchLink } from '../shared/follow-up-access.js';

const privateHeaders = { 'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer',
  'x-robots-tag': 'noindex, nofollow, noarchive', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY' };
const json = (body, status) => Response.json(body, { status, headers: privateHeaders });

function accessPage() {
  const nonce = crypto.randomUUID();
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your private follow-up | SABI</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f7faf9;color:#263b3b;font:16px/1.6 Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}main{width:100%;max-width:480px}h1{color:#084c50;font:600 30px/1.2 Georgia,serif;margin:20px 0}p{margin:12px 0}button{background:#f5cf50;border:0;border-radius:6px;min-height:44px;padding:12px 20px;color:#143d3e;font:600 16px Arial;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #084c50;outline-offset:3px}a{color:#084c50}small{display:block;margin-top:24px;color:#536363}</style></head><body><main><strong>SABI</strong><h1>Your private follow-up</h1><p id="message" role="status">Open the private link in your email to continue. You do not need a password.</p><button id="retry" hidden>Try again</button><small>Your saved answers stay on this device.</small><p><a href="mailto:info@sabigroup.co.uk">Contact SABI</a></p><noscript><p>Please enable JavaScript to open and complete the form.</p></noscript></main><script nonce="${nonce}">
  let token, attempts = 0;
  const message = document.getElementById('message'), retry = document.getElementById('retry');
  async function openLink() {
    const attempt = ++attempts;
    retry.hidden = true; message.textContent = 'Opening your follow-up...';
    try {
      const response = await fetch('/follow-up/access', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),signal:AbortSignal.timeout(20000)});
      const result = await response.json();
      if (attempt !== attempts) return;
      if (!response.ok) { message.textContent = result.error || 'This link could not be opened. Please contact SABI for a fresh link.'; return; }
      location.replace(result.testMode ? '/follow-up/?test=1' : '/follow-up/');
    } catch { if (attempt !== attempts) return; message.textContent = 'The connection was interrupted. Your answers have not been changed.'; retry.hidden = false; }
  }
  retry.addEventListener('click', openLink);
  function readLink() {
    const next = new URLSearchParams(location.hash.slice(1)).get('access');
    if (!next) return;
    token = next; history.replaceState(null, '', location.pathname + location.search); openLink();
  }
  addEventListener('hashchange', readLink);
  readLink();
  </script></body></html>`, { headers: { ...privateHeaders, 'content-type': 'text/html; charset=utf-8',
    'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'` } });
}

export default async function followUpAuth(request, context) {
  const url = new URL(request.url);
  const secret = Netlify.env.get('BRONAGH_ACCESS_SECRET');
  const grants = Netlify.env.get('BRONAGH_FOLLOW_UP_LINKS');
  if (url.pathname === '/follow-up/access') {
    if (request.method === 'GET') return accessPage();
    if (request.method !== 'POST') return json({ ok: false }, 405);
    if (request.headers.get('origin') !== url.origin) return json({ ok: false }, 403);
    if (!secret) return json({ ok: false, error: 'Access is not ready yet. Please contact SABI.' }, 503);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ ok: false }, 400);
    const raw = await request.text();
    if (raw.length > 300) return json({ ok: false }, 413);
    let token;
    try { token = JSON.parse(raw)?.token; } catch { return json({ ok: false }, 400); }
    const grant = await matchLink(token, grants);
    if (!grant) return json({ ok: false, error: 'This link is no longer available. Please contact SABI for a fresh link. Your saved answers have not been deleted.' }, 401);
    const session = await createFollowUpSession(grant, secret);
    return Response.json({ ok: true, testMode: grant.testMode }, { headers: { ...privateHeaders,
      'set-cookie': `${FOLLOW_UP_COOKIE}=${session.token}; Path=/; Expires=${new Date(session.expiresAt).toUTCString()}; Secure; HttpOnly; SameSite=Lax` } });
  }
  const session = await followUpSession(request, secret, grants);
  if (session) {
    if (session.testMode && ['/follow-up', '/follow-up/'].includes(url.pathname) && url.searchParams.get('test') !== '1') {
      return new Response(null, { status: 303, headers: { ...privateHeaders, location: '/follow-up/?test=1' } });
    }
    return context.next();
  }
  // A follow-up link never grants onboarding access; existing onboarding sessions still work here.
  if (request.method === 'GET' && context.cookies.get('sabi_client_access')) {
    const response = await clientAuth(request, context);
    if (response.status !== 401 && response.status !== 503) return response;
  }
  return accessPage();
}
