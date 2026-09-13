const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const sent = [];
  await page.route('**/api/test-follow-up-submit', async route => {
    sent.push(route.request().postData());
    await route.fulfill({ status: sent.length === 1 ? 502 : 200, contentType: 'application/json',
      body: JSON.stringify(sent.length === 1 ? { ok: false, error: 'QA receipt not confirmed' } : { ok: true, submissionId: JSON.parse(sent[0]).submissionId }) });
  });
  const base = process.env.FOLLOW_UP_QA_URL || 'http://127.0.0.1:5207/follow-up/';
  await page.goto(base + '?test=1#section=9&question=0');
  await page.getByRole('heading', { name: 'Which changes would you consider?' }).waitFor();
  const output = path.resolve('test-artifacts');
  fs.mkdirSync(output, { recursive: true });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `overflow at ${width}`);
    const yes = page.getByRole('radio', { name: 'Yes', exact: true });
    if (await yes.count()) for (const radio of await yes.all()) assert.ok((await radio.boundingBox()).height >= 44);
    await page.screenshot({ path: path.join(output, `follow-up-${width}.png`), fullPage: true });
  }
  await page.goto(base + '?test=1#section=17&question=0');
  await page.locator('#reviewNotes').fill('FICTIONAL QA ONLY: delivery and retry check.');
  assert.equal(await page.getByRole('button', { name: 'Send test response', exact: true }).isDisabled(), true);
  await page.getByText('Test sending is not connected yet. Nothing will be sent from this page.').waitFor();
  assert.equal(sent.length, 0);
  await page.locator('#reviewNotes').blur();
  await page.reload();
  assert.equal(await page.locator('#reviewNotes').inputValue(), 'FICTIONAL QA ONLY: delivery and retry check.');
  assert.equal(sent.length, 0);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(output, 'follow-up-test-review.png'), fullPage: true });
  await browser.close();
  console.log('PASS: responsive layouts, editable fictional answers, readable review, reload persistence, disabled test sending and no outgoing submission.');
})().catch(error => { console.error(error); process.exit(1); });
