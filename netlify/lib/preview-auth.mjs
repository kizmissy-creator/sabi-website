export async function credentialDigest(value, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function authorised(request, credential) {
  const header = request.headers.get('authorization') || '';
  if (header.length > 4096 || !/^Basic /i.test(header)) return false;
  let decoded;
  try { decoded = atob(header.slice(6)); } catch { return false; }
  const candidate = await credentialDigest(decoded, credential.salt);
  let difference = candidate.length ^ credential.digest.length;
  for (let index = 0; index < candidate.length; index++) difference |= candidate.charCodeAt(index) ^ credential.digest.charCodeAt(index);
  return difference === 0;
}
export async function protectPreview(request, context, credential) {
  // Deploy context is supplied by Netlify, never inferred from a client-controlled header.
  if (context.deploy?.context === 'production') return context.next();
  if (!(await authorised(request, credential))) {
    return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SABI preview — password required</title><body><h1>SABI preview</h1><p>This preview is password protected. Sign in with the username and password Sam shared with you.</p></body></html>', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="SABI preview", charset="UTF-8"',
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
      }
    });
  }
  const origin = await context.next();
  const response = new Response(origin.body, origin);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
