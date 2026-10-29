import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalogue } from '../studio/samples/catalogue.mjs';
import { validate } from '../netlify/lib/samples.mjs';
import { renderStudioPages } from '../scripts/render-studio.mjs';

test('every visible product maps to exactly one reservable product with valid sizes', async () => {
  const pages = await renderStudioPages();
  const html = [...pages.values()].join('\n');
  const ids = [...new Set([...html.matchAll(/data-product="([^"]+)"/g)].map(match => match[1]))].sort();
  assert.deepEqual(ids, catalogue.map(p => p.id).sort());
  assert.equal(ids.length, 11);
  for (const product of catalogue) for (const size of product.sizes) {
    assert.doesNotThrow(() => validate({ product: product.id, size, name: 'Test', email: 'test@example.com', address1: '1 Test Street', city: 'Test Town', postcode: 'TEST 123', country: 'United Kingdom', consent: true }));
  }
  assert.ok(!html.includes('class="product-price"'));
  const js = await readFile(new URL('../studio/studio.js', import.meta.url), 'utf8');
  assert.ok(!js.includes('deliveredPrices'));
});

test('collections are independent pages with working shared navigation and assets', async () => {
  const pages = await renderStudioPages();
  const masks = pages.get('masks/index.html');
  const battery = pages.get('social-battery/index.html');
  assert.ok(!pages.get('shop/index.html').includes('data-product='));
  assert.ok(!pages.get('index.html').includes('data-product='));
  assert.ok(masks.includes('data-product="crop"'));
  assert.ok(!masks.includes('data-product="sb-tee"'));
  assert.ok(battery.includes('data-product="sb-tee"'));
  assert.ok(!battery.includes('data-product="crop"'));
  for (const [route, html] of pages) {
    assert.equal((html.match(/<h1\b/g) || []).length, 1, route);
    const base = new URL(route, 'https://example.test/');
    for (const [, attribute, value] of html.matchAll(/(href|src)="([^"]+)"/g)) {
      if (/^(mailto:|https:|#)/.test(value)) continue;
      const target = new URL(value, base).pathname.slice(1);
      if (!target || target.endsWith('/')) assert.ok(pages.has(`${target}index.html`), `${route}: ${value}`);
      else await readFile(new URL(`../studio/${target}`, import.meta.url));
    }
    const header = html.match(/<header[\s\S]*?<\/header>/)[0];
    assert.ok(!header.includes('<details') && !header.includes('class="menu"'));
    assert.ok(header.replace(/<[^>]*>/g, '').includes('Cart (0)'));
  }
});
