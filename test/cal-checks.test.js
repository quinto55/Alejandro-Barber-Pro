// The judgement half of scripts/check-cal-fields.mjs, tested against
// hand-written Cal.com event payloads. The runner (network, printing,
// exit code) is not tested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES } from '../src/config.js';
import { assessPhone, assessDurations } from '../scripts/lib/cal-checks.mjs';

const svc = id => SERVICES.find(s => s.id === id);
const goodFields = [
  { name: 'name', required: true },
  { name: 'email', required: true },
  { name: 'attendeePhoneNumber', hidden: false, required: true },
  { name: 'notes', required: false },
];

test('assessPhone: a correct intake has no problems', () => {
  assert.deepEqual(assessPhone(goodFields), []);
});

test('assessPhone names each thing wrong', () => {
  assert.deepEqual(assessPhone(goodFields.filter(f => f.name !== 'attendeePhoneNumber')), ['no phone field at all']);
  assert.deepEqual(
    assessPhone(goodFields.map(f => f.name === 'attendeePhoneNumber' ? { ...f, hidden: true, required: false } : f)),
    ['phone is hidden', 'phone is not required'],
  );
  assert.deepEqual(
    assessPhone(goodFields.map(f => f.name === 'email' ? { ...f, hidden: true } : f)),
    ['EMAIL IS GONE — the Confirmation toggle was flipped to Phone'],
  );
});

test('assessPhone: an unreadable payload is a failure, not a pass', () => {
  assert.deepEqual(assessPhone(undefined), ['could not read bookingFields (Cal changed its API shape?)']);
  assert.deepEqual(assessPhone('nonsense'), ['could not read bookingFields (Cal changed its API shape?)']);
});

test('assessDurations: a correctly set-up haircut passes, whatever order Cal stores the list in', () => {
  const event = { length: 60, metadata: { multipleDuration: [75, 60, 120, 80, 90], hideDurationSelectorInBookingPage: true } };
  assert.deepEqual(assessDurations(event, svc('haircut')), []);
});

test("assessDurations: today's live state fails on all three counts", () => {
  const event = { length: 55, metadata: { bookerLayouts: {} } };
  assert.deepEqual(assessDurations(event, svc('haircut')), [
    'default length is 55, should be 60',
    'multiple durations are not turned on',
    'duration selector is not hidden',
  ]);
});

test('assessDurations: a missed or extra option is named with both lists', () => {
  const missing = { length: 60, metadata: { multipleDuration: [60, 75, 80, 90], hideDurationSelectorInBookingPage: true } };
  assert.deepEqual(assessDurations(missing, svc('haircut')), ['durations are [60, 75, 80, 90], should be [60, 75, 80, 90, 120]']);
  const extra = { length: 50, metadata: { multipleDuration: [50, 60, 75, 80, 90, 120, 150], hideDurationSelectorInBookingPage: true } };
  assert.deepEqual(assessDurations(extra, svc('kids')), ['durations are [50, 60, 75, 80, 90, 120, 150], should be [50, 60, 75, 80, 90, 120]']);
});

test('assessDurations: no metadata at all is a failure, not a pass', () => {
  assert.deepEqual(assessDurations({ length: 60 }, svc('haircut')), [
    'multiple durations are not turned on',
    'duration selector is not hidden',
  ]);
});
