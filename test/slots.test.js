import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMinutes, slotsFor, availableSlots } from '../src/slots.js';

const WED = { open: 540, close: 1225 }; // 09:00 - 20:25

test('formatMinutes zero-pads', () => {
  assert.equal(formatMinutes(540), '09:00');
  assert.equal(formatMinutes(1225), '20:25');
  assert.equal(formatMinutes(0), '00:00');
});

test('a closed day yields no slots', () => {
  assert.deepEqual(slotsFor({ hours: null, durationMin: 55 }), []);
});

test('the last slot leaves room for the full service', () => {
  const s = slotsFor({ hours: WED, durationMin: 55 });
  assert.equal(s[0], '09:00');
  // 20:25 close - 55min = 19:30 latest start
  assert.equal(s.at(-1), '19:30');
});

test('a long service ends earlier in the day', () => {
  // 3h20 colour: 20:25 - 200min = 17:05, stepped down to 17:00
  const s = slotsFor({ hours: WED, durationMin: 200 });
  assert.equal(s.at(-1), '17:00');
});

test('a service that cannot fit at all yields no slots', () => {
  assert.deepEqual(slotsFor({ hours: { open: 540, close: 560 }, durationMin: 55 }), []);
});

test('slots step by 15 minutes', () => {
  const s = slotsFor({ hours: WED, durationMin: 55 });
  assert.deepEqual(s.slice(0, 4), ['09:00', '09:15', '09:30', '09:45']);
});

test('a busy block removes every overlapping start, not just its own', () => {
  // Busy 10:00-11:00. A 55-min cut starting 09:15 runs to 10:10 and clashes.
  const s = slotsFor({ hours: WED, durationMin: 55, busy: [{ start: 600, end: 660 }] });
  assert.ok(!s.includes('10:00'), 'start inside the block');
  assert.ok(!s.includes('09:15'), 'earlier start that runs into the block');
  assert.ok(!s.includes('09:30'), 'earlier start that runs into the block');
  assert.ok(s.includes('09:00'), '09:00 + 55min = 09:55, ends before the block');
  assert.ok(s.includes('11:00'), 'starts exactly when the block ends');
});

test('touching intervals do not count as a clash', () => {
  const s = slotsFor({ hours: WED, durationMin: 60, busy: [{ start: 600, end: 660 }] });
  assert.ok(s.includes('09:00'), '09:00-10:00 abuts the block, no overlap');
  assert.ok(s.includes('11:00'), '11:00 starts at the block end');
});

test('earliestMin drops slots that are too soon', () => {
  const s = slotsFor({ hours: WED, durationMin: 55, earliestMin: 720 });
  assert.equal(s[0], '12:00');
});

test('availableSlots: Sunday is closed', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-08-02', serviceId: 'haircut', busy: [], now: new Date('2026-07-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: VIP is never self-bookable', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-08-05', serviceId: 'vip', busy: [], now: new Date('2026-07-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: an unknown service yields no slots', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-08-05', serviceId: 'nope', busy: [], now: new Date('2026-07-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: past dates yield no slots', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-07-01', serviceId: 'haircut', busy: [], now: new Date('2026-08-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: the 120-minute lead time applies today only', () => {
  // 2026-08-05 is a Wednesday. 14:00Z = 10:00 EDT.
  const now = new Date('2026-08-05T14:00:00Z');
  const today = availableSlots({ dateStr: '2026-08-05', serviceId: 'haircut', busy: [], now });
  assert.equal(today[0], '12:00', '10:00 + 120min lead');
  const tomorrow = availableSlots({ dateStr: '2026-08-06', serviceId: 'haircut', busy: [], now });
  assert.equal(tomorrow[0], '09:00', 'a future day opens normally');
});

test('availableSlots: Monday closes at 20:10, Wednesday at 20:25', () => {
  const now = new Date('2026-07-01T12:00:00Z');
  const mon = availableSlots({ dateStr: '2026-08-03', serviceId: 'haircut', busy: [], now });
  const wed = availableSlots({ dateStr: '2026-08-05', serviceId: 'haircut', busy: [], now });
  assert.equal(mon.at(-1), '19:15', '20:10 - 55min = 19:15');
  assert.equal(wed.at(-1), '19:30', '20:25 - 55min = 19:30');
});

test('availableSlots: UTC busy blocks are honoured', () => {
  const now = new Date('2026-07-01T12:00:00Z');
  const busy = [{ start: '2026-08-05T14:00:00Z', end: '2026-08-05T15:00:00Z' }]; // 10:00-11:00 EDT
  const s = availableSlots({ dateStr: '2026-08-05', serviceId: 'haircut', busy, now });
  assert.ok(!s.includes('10:00'));
  assert.ok(s.includes('11:00'));
});
