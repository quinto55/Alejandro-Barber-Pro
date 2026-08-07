import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockBusyFor, validateBooking } from '../src/booking-api.js';

test('mock busy blocks are deterministic per date', () => {
  assert.deepEqual(mockBusyFor('2026-08-05'), mockBusyFor('2026-08-05'));
});

test('different dates produce different mock busy blocks', () => {
  const a = JSON.stringify(mockBusyFor('2026-08-05'));
  const b = JSON.stringify(mockBusyFor('2026-08-06'));
  assert.notEqual(a, b);
});

test('mock busy blocks fall inside business hours', () => {
  for (const d of ['2026-08-03', '2026-08-05', '2026-08-08']) {
    for (const b of mockBusyFor(d)) {
      assert.ok(b.start >= 540 && b.end <= 1225, `${d} block out of hours`);
      assert.ok(b.end > b.start);
    }
  }
});

test('validateBooking rejects empty required fields', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: '', email: '', phone: '' });
  assert.equal(r.ok, false);
  assert.ok(r.fields.name && r.fields.email && r.fields.phone);
});

test('validateBooking rejects a malformed email', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: 'A', email: 'nope', phone: '2125551234' });
  assert.equal(r.fields.email, 'book.badEmail');
});

test('validateBooking rejects a phone with too few digits', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: 'A', email: 'a@b.co', phone: '123' });
  assert.equal(r.fields.phone, 'book.badPhone');
});

test('validateBooking rejects a non-self-bookable service', () => {
  const r = validateBooking({ serviceId: 'vip', date: '2026-08-05', time: '10:00', name: 'A', email: 'a@b.co', phone: '2125551234' });
  assert.equal(r.ok, false);
});

test('validateBooking accepts a complete valid booking', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: 'Ana Ruiz', email: 'ana@example.com', phone: '(212) 555-1234' });
  assert.equal(r.ok, true);
});
