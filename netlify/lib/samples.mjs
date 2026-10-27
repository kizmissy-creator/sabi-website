import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { catalogue } from '../../studio/samples/catalogue.mjs';
import { inviteHashes, adminHash, testInviteHashes } from './sample-access.mjs';

export const hash = value => createHash('sha256').update(value).digest('hex');
export function authenticate(token, admin = false) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 128) return null;
  const digest = hash(token);
  if (admin) return timingSafeEqual(Buffer.from(digest), Buffer.from(adminHash)) ? digest : null;
  return [...inviteHashes, ...testInviteHashes].includes(digest) ? digest : null;
}
export const isTest = digest => testInviteHashes.includes(digest);
export class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function field(input, key, max, required = true) {
  const value = typeof input[key] === 'string' ? input[key].trim() : '';
  if ((required && !value) || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RequestError(400, 'Please check your details and complete the required fields.');
  }
  return value;
}
export function validate(input) {
  if (!input || typeof input !== 'object' || input.website || input.consent !== true) throw new RequestError(400, 'Please check your details and the delivery permission.');
  const product = catalogue.find(item => item.id === input.product);
  if (!product || !product.sizes.includes(input.size)) throw new RequestError(400, 'Please choose an item and one of its listed sizes.');
  const email = field(input, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RequestError(400, 'Please enter a valid email address.');
  // Gmail treats dots and +aliases as the same mailbox; other providers at least share +aliases.
  const [local, domain] = email.split('@');
  const emailKey = /^(gmail|googlemail)\.com$/.test(domain) ? `${local.split('+')[0].replaceAll('.', '')}@gmail.com` : `${local.split('+')[0]}@${domain}`;
  return { product: product.id, size: input.size, name: field(input, 'name', 100), email, emailKey,
    address1: field(input, 'address1', 150), address2: field(input, 'address2', 150, false),
    city: field(input, 'city', 100), region: field(input, 'region', 100, false),
    postcode: field(input, 'postcode', 30), country: field(input, 'country', 80),
    notes: field(input, 'notes', 500, false), consentVersion: 'sample-delivery-2026-10-27' };
}

export async function readState(store, key) {
  const entry = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
  return { data: entry?.data || { claims: [] }, etag: entry?.etag };
}
// One atomic conditional write commits the person AND item together. Never split these
// into separate keys: a failure between writes could consume an invite without its item.
export async function changeState(store, key, change) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, etag } = await readState(store, key);
    const result = change(data);
    if (result.unchanged) return result.value;
    const saved = await store.setJSON(key, data, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
    if (saved.modified) return result.value;
  }
  throw new RequestError(503, 'A few people are choosing at once. Please try again; your item has not been confirmed.');
}
export async function reserve(store, key, invite, input) {
  const details = validate(input);
  return changeState(store, key, data => {
    const previous = data.claims.find(c => c.invite === invite);
    if (previous) {
      if (previous.status === 'cancelled') throw new RequestError(409, 'This request was cancelled. Please contact Sam if you need help.');
      if (previous.product === details.product && previous.emailKey === details.emailKey) return { unchanged: true, value: { reference: previous.reference, repeated: true } };
      throw new RequestError(409, 'This invitation has already been used. There is one sample per person. Contact Sam if you need to change your request.');
    }
    if (data.claims.some(c => c.emailKey === details.emailKey)) throw new RequestError(409, 'There is already a sample request for this email. There is one sample per person.');
    if (data.claims.some(c => c.product === details.product && c.status !== 'cancelled')) throw new RequestError(409, 'Someone has just claimed this item. Please choose another available sample.');
    const reference = `SABI-${randomUUID().slice(0, 8).toUpperCase()}`;
    data.claims.push({ ...details, invite, reference, status: 'requested', createdAt: new Date().toISOString() });
    return { value: { reference } };
  });
}

export function response(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function body(request) {
  if (request.method !== 'POST') throw new RequestError(405, 'Please use the sample form.');
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RequestError(415, 'Please use the sample form.');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new RequestError(403, 'Please open your invitation on the SABI site.');
  const raw = await request.text();
  if (raw.length > 8000) throw new RequestError(413, 'That request is too long.');
  try { return JSON.parse(raw); } catch { throw new RequestError(400, 'Please try the form again.'); }
}
