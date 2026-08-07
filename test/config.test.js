import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOURS, SERVICES, BOOKING, BUSINESS } from '../src/config.js';

test('hours match the verified Booksy schedule', () => {
  assert.equal(HOURS[0], null, 'Sunday is closed');
  for (const d of [1, 2]) assert.deepEqual(HOURS[d], { open: 540, close: 1210 });
  for (const d of [3, 4, 5, 6]) assert.deepEqual(HOURS[d], { open: 540, close: 1225 });
});

test('services match verified prices and durations', () => {
  const byId = Object.fromEntries(SERVICES.map(s => [s.id, s]));
  assert.equal(SERVICES.length, 6);
  assert.deepEqual(
    SERVICES.map(s => [s.id, s.priceFrom, s.durationMin]),
    [
      ['haircut', 60, 55],
      ['haircut-beard', 85, 80],
      ['kids', 60, 50],
      ['platinum', 275, 175],
      ['color', 355, 200],
      ['vip', 150, 65],
    ],
  );
  assert.equal(byId.vip.plus, false, 'VIP is a fixed $150, not a from-price');
  assert.equal(byId.haircut.plus, true, 'all other prices are from-prices');
});

test('VIP is not self-bookable', () => {
  const vip = SERVICES.find(s => s.id === 'vip');
  assert.equal(vip.selfBookable, false);
  assert.equal(SERVICES.filter(s => s.selfBookable).length, 5);
});

test('booking constants match the spec', () => {
  assert.deepEqual(BOOKING, { stepMin: 15, leadTimeMin: 120, horizonDays: 60 });
  assert.equal(BUSINESS.timezone, 'America/New_York');
  assert.equal(BUSINESS.reviewCount, 147);
});
