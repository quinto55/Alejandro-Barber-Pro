import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekdayOf, addDays, nyParts, nyWallToUtc, toWallInterval } from '../src/tz.js';

test('weekdayOf does not drift with the host timezone', () => {
  assert.equal(weekdayOf('2026-08-01'), 6); // Saturday
  assert.equal(weekdayOf('2026-08-02'), 0); // Sunday
  assert.equal(weekdayOf('2026-08-03'), 1); // Monday
});

test('addDays crosses months and years', () => {
  assert.equal(addDays('2026-08-01', 1), '2026-08-02');
  assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-08-01', 60), '2026-09-30');
});

test('nyParts converts a UTC instant to NY wall clock', () => {
  // 2026-08-01T18:00Z is 14:00 EDT (UTC-4)
  assert.deepEqual(nyParts(new Date('2026-08-01T18:00:00Z')), {
    date: '2026-08-01', minutes: 14 * 60,
  });
  // 2026-01-15T18:00Z is 13:00 EST (UTC-5)
  assert.deepEqual(nyParts(new Date('2026-01-15T18:00:00Z')), {
    date: '2026-01-15', minutes: 13 * 60,
  });
});

test('nyWallToUtc round-trips through both DST offsets', () => {
  assert.equal(nyWallToUtc('2026-08-01', 14 * 60).toISOString(), '2026-08-01T18:00:00.000Z');
  assert.equal(nyWallToUtc('2026-01-15', 13 * 60).toISOString(), '2026-01-15T18:00:00.000Z');
  for (const d of ['2026-03-08', '2026-11-01', '2026-06-15']) {
    const back = nyParts(nyWallToUtc(d, 10 * 60));
    assert.deepEqual(back, { date: d, minutes: 600 }, `round trip failed for ${d}`);
  }
});

test('toWallInterval maps a UTC busy block onto a NY day', () => {
  const busy = { start: '2026-08-01T14:00:00Z', end: '2026-08-01T15:00:00Z' }; // 10:00-11:00 EDT
  assert.deepEqual(toWallInterval(busy, '2026-08-01'), { start: 600, end: 660 });
});

test('toWallInterval clamps blocks that overhang the day and drops non-overlapping ones', () => {
  const overnight = { start: '2026-07-31T20:00:00Z', end: '2026-08-01T15:00:00Z' };
  assert.deepEqual(toWallInterval(overnight, '2026-08-01'), { start: 0, end: 660 });
  const other = { start: '2026-08-05T14:00:00Z', end: '2026-08-05T15:00:00Z' };
  assert.equal(toWallInterval(other, '2026-08-01'), null);
});

test('spring-forward day maps busy blocks by wall clock, not elapsed time', () => {
  // 2026-03-08: clocks jump 02:00 -> 03:00 EST->EDT.
  // 12:00Z is 08:00 EDT that morning.
  const busy = { start: '2026-03-08T12:00:00Z', end: '2026-03-08T13:00:00Z' };
  assert.deepEqual(toWallInterval(busy, '2026-03-08'), { start: 480, end: 540 });
});
