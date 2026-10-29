import test from 'node:test';
import assert from 'node:assert/strict';
import { credentialDigest, protectPreview } from '../netlify/lib/preview-auth.mjs';
import { studioSiteId } from '../netlify/lib/studio-site.mjs';
const credential = { salt: 'test-only-salt', digest: await credentialDigest('sabi:test-password', 'test-only-salt') };
credential.sessionDigest = await credentialDigest(await credentialDigest('sabi:test-password', `session:${credential.salt}`), credential.salt);
function context(deployContext = 'deploy-preview') {
  return { deploy: { context: deployContext }, calls: 0, async next() { this.calls++; return new Response('original page', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' } }); } };
}
const request = (path, auth) => new Request(`https://preview.example${path}`, auth ? { headers: { Authorization: auth } } : {});
test('all preview pages, images and direct function URLs require authentication', async () => {
  for (const path of ['/', '/studio/', '/studio/assets/clothing-mark.png', '/.netlify/functions/sample-request', '/.netlify/functions/sample-admin']) {
    const ctx = context(); const response = await protectPreview(request(path), ctx, credential);
    assert.equal(response.status, 401); assert.equal(ctx.calls, 0);
    assert.match(await response.text(), /Preview password/);
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

test('the standalone Studio preview requires its password even on its primary URL', async () => {
  const ctx = context('production'); ctx.site = { id: studioSiteId };
  assert.equal((await protectPreview(request('/'), ctx, credential)).status, 401);
  assert.equal(ctx.calls, 0);
  assert.equal((await protectPreview(request('/', `Basic ${btoa('sabi:test-password')}`), ctx, credential)).status, 200);
});
test('unknown deployment context is protected and spoofed context headers are ignored', async () => {
  const ctx = context(); delete ctx.deploy;
  const req = new Request('https://preview.example/', { headers: { 'x-netlify-context': 'production', 'x-forwarded-host': 'www.sabigroup.co.uk' } });
  assert.equal((await protectPreview(req, ctx, credential)).status, 401);
});
test('password form creates a secure session without putting the password in a cookie', async () => {
  const ctx = context();
  const req = new Request('https://preview.example/studio/', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:'https://preview.example'},body:'_sabi_preview_login=1&password=test-password'});
  const response = await protectPreview(req,ctx,credential);
  assert.equal(response.status,303); assert.equal(ctx.calls,0);
  const cookie = response.headers.get('Set-Cookie');
  assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/); assert.ok(!cookie.includes('test-password'));
  const access = await protectPreview(new Request('https://preview.example/studio/',{headers:{Cookie:cookie.split(';')[0]}}),ctx,credential);
  assert.equal(access.status,200);
});
test('forged cookies and cross-origin login attempts fail', async () => {
  const ctx = context();
  const forged = new Request('https://preview.example/',{headers:{Cookie:'__Host-sabi-preview='+ '0'.repeat(64)}});
  assert.equal((await protectPreview(forged,ctx,credential)).status,401);
  const crossSite = new Request('https://preview.example/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:'https://other.example'},body:'_sabi_preview_login=1&password=test-password'});
  assert.equal((await protectPreview(crossSite,ctx,credential)).status,403);
});
