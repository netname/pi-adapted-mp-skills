import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotalCents } from '../../src/pricing.mjs';

test('quotes whole quantities in integer cents', () => {
  assert.equal(calculateTotalCents(1250, 3), 3750);
  assert.equal(calculateTotalCents(0, 2), 0);
});
test('rejects invalid prices, quantities and unsafe totals', () => {
  for (const [price, quantity] of [[-1, 1], [1.5, 1], ['10', 1], [NaN, 1], [1, 0], [1, -1], [1, 1.5], [1, '2'], [1, Infinity], [Number.MAX_SAFE_INTEGER, 2]]) {
    assert.throws(() => calculateTotalCents(price, quantity), RangeError);
  }
});
