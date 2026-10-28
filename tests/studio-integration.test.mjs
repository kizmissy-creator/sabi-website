import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalogue } from '../studio/samples/catalogue.mjs';
import { validate } from '../netlify/lib/samples.mjs';

test('every visible product maps to exactly one reservable product with valid sizes', async () => {
  const html = await readFile(new URL('../studio/index.html', import.meta.url), 'utf8');
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
