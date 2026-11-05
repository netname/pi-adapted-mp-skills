import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteBatch as fresh } from '../examples/validation-lab/design-change-exercise/batch.mjs';
import { quoteBatch as cached } from '../examples/validation-lab/design-change-exercise/batch-cached.mjs';

const requests = [{ path: 'catalog.json', sku: 'PEN', quantity: 1 }, { path: 'catalog.json', sku: 'PEN', quantity: 1 }];
const products = price => [{ sku: 'PEN', unitPriceCents: price }];
const calculate = (price, quantity) => price * quantity;

test('ordinary fixed-catalog outputs cannot distinguish the two proposed sequences', async () => {
  for (const candidate of [fresh, cached]) {
    const result = await candidate(requests, async () => products(100), calculate);
    assert.deepEqual(result.map(item => item.totalCents), [100, 100]);
  }
});

test('accepted per-request reads observe changes that a cached candidate misses', async () => {
  async function observe(candidate) {
    let price = 100;
    return candidate(requests, async () => products(price), (value, quantity) => {
      price = 200; // External catalog change between requests, modeled at the API seam.
      return calculate(value, quantity);
    });
  }
  assert.deepEqual((await observe(fresh)).map(item => item.totalCents), [100, 200]);
  assert.deepEqual((await observe(cached)).map(item => item.totalCents), [100, 100]);
});

test('a first-read error rejects the batch before later reads or calculations', async () => {
  for (const candidate of [fresh, cached]) {
    const calls = [];
    await assert.rejects(candidate(requests, async path => {
      calls.push(path); throw new Error('Unreadable catalog');
    }, () => assert.fail('Calculation after failed read')), /Unreadable catalog/);
    assert.deepEqual(calls, ['catalog.json']);
  }
});
