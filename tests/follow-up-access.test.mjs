import assert from 'node:assert/strict';
import { createHmac, webcrypto } from 'node:crypto';
import followUpAuth from '../netlify/edge-functions/follow-up-auth.js';

globalThis.crypto ??= webcrypto;
const env = { BRONAGH_ACCESS_SECRET: 'fictional-access', BRONAGH_PAGE_PASSWORD: 'fictional-password' };
globalThis.Netlify = { env: { get: key => env[key] } };
const context = token => ({ cookies: { get: () => token }, next: () => new Response('private app') });
for (const path of ['/follow-up', '/follow-up/', '/follow-up/assets/app.js']) {
  const result = await followUpAuth(new Request('https://client.invalid' + path), context(''));
  assert.equal(result.status, 401);
  const html = await result.text();
  assert.ok(html.includes('Your follow-up is private.'));
  assert.ok(html.includes('action="/follow-up/"'));
}
for (const testMode of [false, true]) {
  const result = await followUpAuth(new Request('https://client.invalid/follow-up/' + (testMode ? '?test=1' : ''), {
    method: 'POST', body: new URLSearchParams({ password: env.BRONAGH_PAGE_PASSWORD }),
  }), context(''));
  assert.equal(result.status, 303);
  assert.equal(result.headers.get('location'), '/follow-up/' + (testMode ? '?test=1' : ''));
  assert.match(result.headers.get('set-cookie'), /Path=\/;.*Secure; HttpOnly; SameSite=Strict/);
}
const identity = `CL-2026-001.cs_test.${Math.floor(Date.now()/1000)+60}`;
const token = Buffer.from(identity).toString('base64url') + '.' + createHmac('sha256', env.BRONAGH_ACCESS_SECRET).update(identity).digest('base64url');
assert.equal(await (await followUpAuth(new Request('https://client.invalid/follow-up/'), context(token))).text(), 'private app');
assert.equal((await followUpAuth(new Request('https://client.invalid/follow-up/'), context(token+'wrong'))).status, 401);
console.log('PASS: follow-up routes and assets protected; same onboarding cookie; correct post-login destination; test mode preserved.');
