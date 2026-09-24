// The judgement half of check-cal-fields.mjs: given one Cal.com event type
// as its public tRPC endpoint returns it, say in plain words what is wrong
// with it. Pure so test/cal-checks.test.js can pin every message.
import { defaultDurationFor, durationOptionsFor } from '../../src/addons.js';

const UNREADABLE = 'could not read bookingFields (Cal changed its API shape?)';

/**
 * Phone must be shown and required; email must still be shown and required.
 * The second half is not padding: Cal has a Confirmation toggle that swaps
 * email OUT for phone as the single confirmation field, and we want both —
 * the email is what sends the client their confirmation and reminder.
 */
export function assessPhone(bookingFields) {
  if (!Array.isArray(bookingFields)) return [UNREADABLE];
  const phone = bookingFields.find(f => f.name === 'attendeePhoneNumber');
  const email = bookingFields.find(f => f.name === 'email');
  const problems = [];
  if (!phone) problems.push('no phone field at all');
  else {
    if (phone.hidden) problems.push('phone is hidden');
    if (!phone.required) problems.push('phone is not required');
  }
  if (!email || email.hidden) problems.push('EMAIL IS GONE — the Confirmation toggle was flipped to Phone');
  else if (!email.required) problems.push('email is not required');
  return problems;
}

/**
 * The event's default length, its list of offered lengths, and the hidden
 * duration selector must all match docs/cal-multiple-durations.md — whose
 * numbers come from the same addons.js functions used here.
 */
export function assessDurations(event, service) {
  const problems = [];
  const wantLength = defaultDurationFor(service);
  const wantOptions = durationOptionsFor(service);
  if (event.length !== wantLength) problems.push(`default length is ${event.length}, should be ${wantLength}`);
  const got = event.metadata?.multipleDuration;
  if (!Array.isArray(got)) problems.push('multiple durations are not turned on');
  else {
    const sorted = [...got].sort((a, b) => a - b);
    if (sorted.join(',') !== wantOptions.join(',')) {
      problems.push(`durations are [${sorted.join(', ')}], should be [${wantOptions.join(', ')}]`);
    }
  }
  if (event.metadata?.hideDurationSelectorInBookingPage !== true) problems.push('duration selector is not hidden');
  return problems;
}
