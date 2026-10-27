import test from 'node:test';
import assert from 'node:assert/strict';
import { reserve, validate, authenticate, body, readState } from '../netlify/lib/samples.mjs';
class MemoryStore {
  records = new Map(); version = 0;
  async getWithMetadata(key) { const value = this.records.get(key); await new Promise(resolve => setImmediate(resolve)); return value ? structuredClone(value) : null; }
  async setJSON(key, data, options) {
    const current = this.records.get(key);
    if ((options.onlyIfNew && current) || (options.onlyIfMatch && current?.etag !== options.onlyIfMatch)) return { modified: false };
    this.records.set(key, { data: structuredClone(data), etag: String(++this.version) }); return { modified: true };
  }
}
const input = (extra = {}) => ({ product: 'crop', size: 'M', name: 'Sample Test', email: 'sample@example.com', address1: '1 Test Street', city: 'Test Town', postcode: 'TEST 123', country: 'United Kingdom', consent: true, ...extra });
test('two simultaneous people claiming one product: only one wins', async () => {
  const store = new MemoryStore();
  const results = await Promise.allSettled([reserve(store, 'round', 'alice', input()), reserve(store, 'round', 'bob', input({ email: 'bob@example.com' }))]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await readState(store, 'round')).data.claims.length, 1);
});
test('one invite cannot reserve two products at once', async () => {
  const store = new MemoryStore();
  const results = await Promise.allSettled([reserve(store, 'round', 'alice', input()), reserve(store, 'round', 'alice', input({ product: 'mask-oversized' }))]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
});
test('different products and people can both reserve concurrently', async () => {
  const store = new MemoryStore();
  await Promise.all([reserve(store, 'round', 'alice', input()), reserve(store, 'round', 'bob', input({ product: 'mask-oversized', email: 'bob@example.com' }))]);
  assert.equal((await readState(store, 'round')).data.claims.length, 2);
});
test('a retry after a lost response returns the original reference', async () => {
  const store = new MemoryStore();
  const first = await reserve(store, 'round', 'alice', input());
  const retry = await reserve(store, 'round', 'alice', input());
  assert.equal(first.reference, retry.reference); assert.equal(retry.repeated, true);
  assert.equal((await readState(store, 'round')).data.claims.length, 1);
});
test('duplicate email and Gmail aliases cannot use another invitation', async () => {
  const store = new MemoryStore();
  await reserve(store, 'round', 'alice', input({ email: 'First.Last+one@gmail.com' }));
  await assert.rejects(reserve(store, 'round', 'bob', input({ product: 'mask-oversized', email: 'firstlast+two@googlemail.com' })), error => error.status === 409);
});
test('invalid size, missing permission, empty address and unknown product rejected', () => {
  for (const patch of [{ size: '5XL' }, { consent: false }, { address1: '' }, { product: 'unknown' }, { email: 'bad-email' }, { website: 'spam' }, { name: 'x'.repeat(101) }]) assert.throws(() => validate(input(patch)));
});
test('invalid credentials and cross-origin requests rejected', async () => {
  assert.equal(authenticate('x'.repeat(43)), null); assert.equal(authenticate(null), null);
  await assert.rejects(body(new Request('https://sabi.example/api', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'https://other.example' }, body: '{}' })), error => error.status === 403);
});
test('test reservations do not consume real inventory', async () => {
  const store = new MemoryStore();
  await reserve(store, 'test-round', 'test', input());
  assert.equal((await readState(store, 'friends-round')).data.claims.length, 0);
});
