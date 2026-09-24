export const FOLLOW_UP_COOKIE = '__Host-sabi_follow_up';
const encoder = new TextEncoder();
const encode = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const decode = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
const key = secret => crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
const signedText = payload => encoder.encode('follow-up-access-v1\n' + payload);

export function linkGrants(config) {
  try {
    const values = JSON.parse(config || '[]');
    return Array.isArray(values) ? values.filter(value => value && /^[a-f0-9]{64}$/.test(value.hash) &&
      typeof value.testMode === 'boolean' && Number.isSafeInteger(value.expiresAt) && value.expiresAt > Date.now()) : [];
  } catch { return []; }
}

export async function matchLink(token, config) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return linkGrants(config).find(grant => grant.hash === hash) || null;
}

export async function createFollowUpSession(grant, secret) {
  const expiresAt = Math.min(grant.expiresAt, Date.now() + 30 * 24 * 60 * 60 * 1000);
  const payload = encode(encoder.encode(JSON.stringify({ client: 'CL-2026-001', hash: grant.hash, testMode: grant.testMode, expiresAt })));
  const signature = encode(new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), signedText(payload))));
  return { token: payload + '.' + signature, expiresAt };
}

export async function followUpSession(request, secret, config) {
  if (!secret) return null;
  for (const entry of (request.headers.get('cookie') || '').split(';')) {
    const [name, value] = entry.trim().split('=');
    if (name !== FOLLOW_UP_COOKIE || !value || value.length > 1500) continue;
    try {
      const [payload, signature, extra] = value.split('.');
      if (extra || !await crypto.subtle.verify('HMAC', await key(secret), decode(signature), signedText(payload))) continue;
      const session = JSON.parse(new TextDecoder().decode(decode(payload)));
      if (session.client !== 'CL-2026-001' || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= Date.now()) continue;
      const grant = linkGrants(config).find(value => value.hash === session.hash && value.testMode === session.testMode);
      if (grant && session.expiresAt <= grant.expiresAt) return session;
    } catch { /* Ignore malformed or stale cookies and require the private link again. */ }
  }
  return null;
}
