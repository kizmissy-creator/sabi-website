import assert from 'node:assert/strict';
import { createHash, createHmac, webcrypto } from 'node:crypto';
import followUpAuth from '../netlify/edge-functions/follow-up-auth.js';
import clientAuth from '../netlify/edge-functions/client-auth-30d.js';
import submit from '../netlify/functions/follow-up-submit.mjs';
import { FOLLOW_UP_COOKIE, followUpSession } from '../netlify/shared/follow-up-access.js';

globalThis.crypto ??= webcrypto;
const env = { BRONAGH_ACCESS_SECRET: 'fictional-access', BRONAGH_PAGE_PASSWORD: 'fictional-password' };
globalThis.Netlify = { env: { get: key => env[key] } };
const context = token => ({ cookies: { get: name => name === 'sabi_client_access' ? token : '' }, next: () => new Response('private app') });
for (const path of ['/follow-up', '/follow-up/', '/follow-up/assets/app.js']) {
  const result = await followUpAuth(new Request('https://client.invalid' + path), context(''));
  assert.equal(result.status, 200);
  const html = await result.text();
  assert.ok(html.includes('Your private follow-up'));
  assert.ok(html.includes('You do not need a password.'));
  assert.ok(!html.includes('private app'));
  assert.ok(result.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
}
const identity = `CL-2026-001.cs_test.${Math.floor(Date.now()/1000)+60}`;
const token = Buffer.from(identity).toString('base64url') + '.' + createHmac('sha256', env.BRONAGH_ACCESS_SECRET).update(identity).digest('base64url');
assert.equal(await (await followUpAuth(new Request('https://client.invalid/follow-up/'), context(token))).text(), 'private app');
assert.ok((await (await followUpAuth(new Request('https://client.invalid/follow-up/'), context(token+'wrong'))).text()).includes('Your private follow-up'));

const link = 'a'.repeat(43);
const grant = {hash:createHash('sha256').update(link).digest('hex'),testMode:true,expiresAt:Date.now()+86400000};
env.BRONAGH_FOLLOW_UP_LINKS = JSON.stringify([grant]);
const exchange = (body={token:link},origin='https://client.invalid',method='POST') => followUpAuth(new Request('https://client.invalid/follow-up/access', {
  method, headers:{origin,'content-type':'application/json'}, ...(method==='GET'?{}:{body:JSON.stringify(body)}),
}),context(''));
assert.equal((await exchange({},undefined,'GET')).status,200, 'email scanner GET does not exchange credentials');
assert.equal((await exchange({token:link},'https://evil.invalid')).status,403);
assert.equal((await exchange({token:'wrong'})).status,401);
assert.equal((await exchange({token:'a'.repeat(500)})).status,413);
assert.equal((await exchange(null)).status,401);
const response = await exchange();
assert.equal(response.status,200);
assert.equal((await response.json()).testMode,true);
assert.match(response.headers.get('set-cookie'), /Path=\/;.*Secure; HttpOnly; SameSite=Lax/);
assert.equal((await exchange()).status,200, 'return visits work with the same private link');
const linkCookie = response.headers.get('set-cookie').split(';')[0];
const linkedRequest = path => new Request('https://client.invalid'+path,{headers:{cookie:linkCookie}});
assert.equal((await followUpAuth(linkedRequest('/follow-up/'),context(''))).headers.get('location'),'/follow-up/?test=1');
assert.equal(await (await followUpAuth(linkedRequest('/follow-up/?test=1'),context(''))).text(),'private app');
assert.equal(await (await followUpAuth(linkedRequest('/follow-up/assets/app.js'),context(''))).text(),'private app');
assert.equal((await clientAuth(linkedRequest('/'),context(''))).status,401, 'follow-up cookie cannot unlock onboarding');
assert.equal(await followUpSession(new Request('https://client.invalid',{headers:{cookie:linkCookie+'bad'}}),env.BRONAGH_ACCESS_SECRET,env.BRONAGH_FOLLOW_UP_LINKS),null);
assert.equal(await followUpSession(linkedRequest('/'),env.BRONAGH_ACCESS_SECRET,'[]'),null,'revocation invalidates sessions too');
assert.equal(await followUpSession(linkedRequest('/'),env.BRONAGH_ACCESS_SECRET,JSON.stringify([{...grant,expiresAt:Date.now()-1}])),null);

Object.assign(process.env, env, {BRONAGH_SUBMISSION_SECRET:'fictional-submit',BRONAGH_APPS_SCRIPT_ENDPOINT:'https://receiver.invalid',BRONAGH_FOLLOW_UP_ENABLED:'true'});
let sends=0;
globalThis.fetch = async () => { sends++; return Response.json({ok:true,submissionId:'11111111-1111-4111-8111-111111111111',formType:'career_partner_follow_up'}); };
const body = {clientReference:'CL-2026-001',formType:'career_partner_follow_up',formVersion:'test',submissionId:'11111111-1111-4111-8111-111111111111',answers:{},reviewText:'Fictional',testMode:true};
const sendRequest = testMode => new Request('https://client.invalid/api/follow-up-submit',{method:'POST',headers:{origin:'https://client.invalid',cookie:linkCookie},body:JSON.stringify({...body,testMode})});
assert.equal((await submit(sendRequest(false))).status,403);
assert.equal(sends,0);
assert.equal((await submit(sendRequest(true))).status,200);
assert.equal(sends,1);
const clientGrant = { ...grant, testMode: false };
env.BRONAGH_FOLLOW_UP_LINKS = JSON.stringify([clientGrant]);
process.env.BRONAGH_FOLLOW_UP_LINKS = env.BRONAGH_FOLLOW_UP_LINKS;
const clientExchange = await exchange();
const clientCookie = clientExchange.headers.get('set-cookie').split(';')[0];
assert.equal((await clientExchange.json()).testMode, false);
assert.equal(await (await followUpAuth(new Request('https://client.invalid/follow-up/', {headers:{cookie:clientCookie}}),context(''))).text(),'private app');
const clientRequest = new Request('https://client.invalid/api/follow-up-submit', {method:'POST',headers:{origin:'https://client.invalid',cookie:clientCookie},body:JSON.stringify({...body,testMode:false})});
assert.equal((await submit(clientRequest)).status,200);
assert.equal(sends,2);
assert.equal((await clientAuth(new Request('https://client.invalid/',{headers:{cookie:clientCookie}}),context(''))).status,401);
env.BRONAGH_FOLLOW_UP_LINKS = JSON.stringify([{...grant,expiresAt:Date.now()-1}]);
assert.equal((await exchange()).status,401);
delete env.BRONAGH_FOLLOW_UP_LINKS;
assert.equal((await exchange()).status,401);
console.log('PASS: private links, repeat access, tamper/expiry/revocation, origin checks, protected assets, original onboarding isolation and test-only delivery.');
