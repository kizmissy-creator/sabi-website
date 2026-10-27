import test from 'node:test';
import assert from 'node:assert/strict';
import { credentialDigest, protectPreview } from '../netlify/lib/preview-auth.mjs';
const credential = { salt: 'test-only-salt', digest: await credentialDigest('sabi:test-password', 'test-only-salt') };
function context(deployContext = 'deploy-preview') {
  return { deploy: { context: deployContext }, calls: 0, async next() { this.calls++; return new Response('original page', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' } }); } };
}
const request = (path, auth) => new Request(`https://preview.example${path}`, auth ? { headers: { Authorization: auth } } : {});
test('all preview pages, images and direct function URLs require authentication', async () => {
  for (const path of ['/', '/studio/', '/studio/assets/clothing-mark.png', '/.netlify/functions/sample-request', '/.netlify/functions/sample-admin']) {
    const ctx = context(); const response = await protectPreview(request(path), ctx, credential);
    assert.equal(response.status, 401); assert.equal(ctx.calls, 0);
    assert.match(response.headers.get('WWW-Authenticate'), /^Basic /);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  }
});
test('wrong passwords, usernames and malformed headers cannot reach content', async () => {
  for (const header of ['Bearer abc', 'Basic !!!!', `Basic ${btoa('sabi:wrong')}`, `Basic ${btoa('other:test-password')}`]) {
    const ctx = context(); assert.equal((await protectPreview(request('/studio/', header), ctx, credential)).status, 401); assert.equal(ctx.calls, 0);
  }
});
test('correct credentials preserve original content and prevent shared caching', async () => {
  const ctx = context(); const response = await protectPreview(request('/studio/', `Basic ${btoa('sabi:test-password')}`), ctx, credential);
  assert.equal(response.status, 200); assert.equal(await response.text(), 'original page'); assert.equal(ctx.calls, 1);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
test('production remains unchanged without a password', async () => {
  const ctx = context('production'); const response = await protectPreview(request('/'), ctx, credential);
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'public, max-age=3600');
});
test('unknown deployment context is protected and spoofed context headers are ignored', async () => {
  const ctx = context(); delete ctx.deploy;
  const req = new Request('https://preview.example/', { headers: { 'x-netlify-context': 'production', 'x-forwarded-host': 'www.sabigroup.co.uk' } });
  assert.equal((await protectPreview(req, ctx, credential)).status, 401);
});
