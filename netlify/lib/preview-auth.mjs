export async function credentialDigest(value, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function authorised(request, credential) {
  const cookie = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith('__Host-sabi-preview='))?.slice('__Host-sabi-preview='.length);
  if (cookie && cookie.length === 64 && credential.sessionDigest) {
    if (await credentialDigest(cookie, credential.salt) === credential.sessionDigest) return true;
  }
  const header = request.headers.get('authorization') || '';
  if (header.length > 4096 || !/^Basic /i.test(header)) return false;
  let decoded;
  try { decoded = atob(header.slice(6)); } catch { return false; }
  const candidate = await credentialDigest(decoded, credential.salt);
  let difference = candidate.length ^ credential.digest.length;
  for (let index = 0; index < candidate.length; index++) difference |= candidate.charCodeAt(index) ^ credential.digest.charCodeAt(index);
  return difference === 0;
}
function loginPage(message = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SABI preview — password required</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4eedf;color:#293c36;font:16px/1.6 Arial,sans-serif}main{width:min(390px,calc(100% - 64px));padding:36px 0}h1{font:42px Georgia,serif;margin:0 0 20px}label{display:block;margin:24px 0 8px}input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #8e9989;border-radius:4px;background:#fffaf0;font:18px Arial}button{margin-top:20px;background:#263f37;color:#fffaf0;padding:13px 24px;border:0;border-radius:5px 13px 5px 13px;font:16px Arial;cursor:pointer}input:focus-visible,button:focus-visible{outline:3px solid #9f4d31;outline-offset:4px}.error{color:#9f4d31}</style></head><body><main><h1>SABI preview</h1><p>Enter the password Sam shared with you.</p>${message ? `<p class="error" role="alert">${message}</p>` : ''}<form method="post"><input type="hidden" name="_sabi_preview_login" value="1"><label for="password">Preview password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="200" autofocus><button type="submit">Continue</button></form></main></body></html>`;
}
const privateHeaders = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" };
export async function protectPreview(request, context, credential) {
  // Deploy context is supplied by Netlify, never inferred from a client-controlled header.
  if (context.deploy?.context === 'production') return context.next();
  if (!(await authorised(request, credential))) {
    let message = '';
    if (request.method === 'POST' && request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) return new Response('Sign in on the SABI preview.', { status: 403, headers: privateHeaders });
      const raw = await request.text();
      if (raw.length > 2048) return new Response('Please try again.', { status: 413, headers: privateHeaders });
      const data = new URLSearchParams(raw);
      if (data.get('_sabi_preview_login') === '1') {
        const password = data.get('password') || '';
        if (password.length <= 200 && await credentialDigest(`sabi:${password}`, credential.salt) === credential.digest) {
          // A separate high-entropy bearer token: the password itself is never stored in a cookie.
          const session = await credentialDigest(`sabi:${password}`, `session:${credential.salt}`);
          const url = new URL(request.url);
          return new Response(null, { status: 303, headers: { ...privateHeaders, Location: url.pathname + url.search, 'Set-Cookie': `__Host-sabi-preview=${session}; Path=/; HttpOnly; Secure; SameSite=Strict` } });
        }
        message = 'That password wasn’t recognised. Please try again.';
      }
    }
    return new Response(loginPage(message), { status: 401, headers: privateHeaders });
  }
  const origin = await context.next();
  const response = new Response(origin.body, origin);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
