const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const { default: auth } = await import('../netlify/edge-functions/follow-up-auth.js');
  const token = 'q'.repeat(43);
  const env = { BRONAGH_ACCESS_SECRET: 'fictional-ui-secret', BRONAGH_FOLLOW_UP_LINKS: JSON.stringify([
    { hash: createHash('sha256').update(token).digest('hex'), testMode: true, expiresAt: Date.now() + 86400000 },
  ]) };
  globalThis.Netlify = { env: { get: name => env[name] } };
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let interrupt = false;
    const requests = [], errors = [];
    await context.route('https://follow-up.invalid/**', async route => {
      const input = route.request();
      requests.push(input.url());
      if (interrupt && input.method() === 'POST') { interrupt = false; return route.abort(); }
      const request = new Request(input.url(), { method: input.method(), headers: await input.allHeaders(),
        ...(input.method() === 'POST' ? { body: input.postData() } : {}) });
      const result = await auth(request, { cookies: { get: () => '' }, next: () => new Response('<h1>Private test form</h1>', { headers: { 'content-type': 'text/html' } }) });
      await route.fulfill({ status: result.status, headers: Object.fromEntries(result.headers), body: await result.text() });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const output = path.resolve('test-artifacts');
    fs.mkdirSync(output, { recursive: true });
    await page.goto('https://follow-up.invalid/follow-up/');
    await page.getByText('Open the private link in your email to continue. You do not need a password.').waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `follow-up-link-${width}.png`), fullPage: true });
    }
    await page.goto('https://follow-up.invalid/follow-up/access#access=invalid');
    await page.getByText(/This link is no longer available/).waitFor();
    assert.ok(!page.url().includes('#'));
    interrupt = true;
    await page.goto('https://follow-up.invalid/follow-up/access#access=' + token);
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.getByRole('heading', { name: 'Private test form' }).waitFor();
    assert.equal(page.url(), 'https://follow-up.invalid/follow-up/?test=1');
    assert.ok(requests.every(url => !url.includes(token)), 'fragment token must never be in a network URL');
    const cookies = await context.cookies();
    assert.ok(cookies.some(cookie => cookie.name === '__Host-sabi_follow_up' && cookie.httpOnly && cookie.secure));
    assert.ok(!cookies.some(cookie => cookie.name === 'sabi_client_access'));
    await page.goto('https://follow-up.invalid/follow-up/access#access=' + token);
    await page.getByRole('heading', { name: 'Private test form' }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: mobile/desktop private-link page, CSP, fragment cleanup, invalid link, offline retry, secure scoped cookie and repeat opening.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
