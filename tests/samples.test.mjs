import test from 'node:test';
import assert from 'node:assert/strict';
import { reserve, validate, authenticate, body, readState, normaliseCode, inventoryKey, isTest } from '../netlify/lib/samples.mjs';
import { trialCodes } from '../netlify/lib/sample-trials.mjs';
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
test('free checkout ignores client-supplied prices and records zero item and delivery totals', async () => {
  const store = new MemoryStore();
  const saved = await reserve(store, 'round', 'alice', input({total: 9900, delivery: 400, currency: 'USD'}));
  assert.equal(saved.total, 0); assert.equal(saved.delivery, 0); assert.equal(saved.currency, 'GBP');
  const claim = (await readState(store, 'round')).data.claims[0];
  assert.equal(claim.total, 0); assert.equal(claim.delivery, 0); assert.equal(claim.currency, 'GBP');
  const retry = await reserve(store, 'round', 'alice', input());
  assert.equal(retry.reference, saved.reference); assert.equal(retry.total, 0);
});
test('personal codes allow spacing and case changes but cannot authenticate as owner credentials', () => {
  const code = 'sabi-abcde-fghjk-lmnpq-rstuv';
  assert.equal(normaliseCode(code), normaliseCode(' SABI ABCDE FGHJK LMNPQ RSTUV '));
  assert.equal(authenticate(code), null); assert.equal(authenticate(code, true), null);
  assert.equal(authenticate('SABI-' + 'A'.repeat(1000)), null);
});
test('owner trials have full independent inventory and never consume friends or other trials', async () => {
  const store = new MemoryStore();
  const [owner, verification] = Object.values(trialCodes);
  assert.equal(isTest(owner),true);
  assert.notEqual(inventoryKey(owner),inventoryKey(verification));
  assert.notEqual(inventoryKey(owner),inventoryKey('friend'));
  await reserve(store, inventoryKey(verification), verification, input());
  assert.equal((await readState(store, inventoryKey(owner))).data.claims.length,0);
  await reserve(store, inventoryKey(owner), owner, input());
  assert.equal((await readState(store, inventoryKey('friend'))).data.claims.length,0);
  await reserve(store, inventoryKey('friend'), 'friend', input());
  await assert.rejects(reserve(store, inventoryKey(owner), owner, input({product:'mask-oversized'})),error=>error.status===409);
});
