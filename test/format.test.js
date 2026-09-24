// formatDuration / formatPrice read the dictionary through t(), so this
// loads the real English dictionary through the same test seam
// test/i18n-runtime.test.js uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setDict } from '../src/i18n.js';
import { formatDuration, formatPrice } from '../src/services.js';
import en from '../i18n/en.js';

test('formatDuration: minutes, hours with minutes, and whole hours', () => {
  setDict(en);
  assert.equal(formatDuration(50), '50 min');
  assert.equal(formatDuration(55), '55 min');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(75), '1h 15m');
  assert.equal(formatDuration(120), '2h');
  assert.equal(formatDuration(200), '3h 20m');
});

test('formatPrice keeps the plus on from-prices and drops it on fixed ones', () => {
  assert.equal(formatPrice({ priceFrom: 60, plus: true }), '$60+');
  assert.equal(formatPrice({ priceFrom: 150, plus: false }), '$150');
  assert.equal(formatPrice({ priceFrom: 20, plus: false }), '$20');
});
