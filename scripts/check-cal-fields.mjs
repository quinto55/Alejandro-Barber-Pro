#!/usr/bin/env node
/**
 * Verify, against the LIVE Cal.com booking pages, that every service asks the
 * client for a phone number.
 *
 * Why this exists: booking questions are a property of each Cal.com event
 * type, not of this repo. Nothing in src/ can show a field Cal is hiding, so
 * the only way to know the intake is right is to read it back off the public
 * booking page. The change itself is six manual toggles in Alejandro's
 * dashboard (docs/cal-booking-questions.md) — six repeats is exactly the
 * shape of task where one gets missed, so this checks all six.
 *
 * What it asserts, per service:
 *   attendeePhoneNumber   visible (not hidden) AND required
 *   email                 still visible and required
 *
 * That second assertion is not padding. Cal 5.5 put a Confirmation toggle at
 * the top of the booking-questions panel that swaps email OUT for phone as
 * the single confirmation field. We want both, so an email that has gone
 * missing means someone flipped that toggle instead of editing the phone row.
 *
 * Reads slugs from src/config.js, so it can never drift from what the site
 * actually links to.
 *
 * Usage:  node scripts/check-cal-fields.mjs
 * Exit:   0 = all six correct, 1 = at least one wrong or unreadable.
 */
import { CAL, SERVICES } from '../src/config.js';

/**
 * Pull the bookingFields array out of a Cal.com booking page.
 *
 * The array is embedded in Next.js flight payload inside the HTML, where the
 * JSON is itself string-escaped (`\"bookingFields\":[...]`). Un-escaping the
 * whole document first is cheaper and far less brittle than trying to match
 * across the escaping. Then walk the brackets to find the array's end —
 * a regex cannot balance nested [] and the field list contains them.
 */
function extractBookingFields(html) {
  const text = html.replace(/\\"/g, '"');
  const key = '"bookingFields":';
  const at = text.indexOf(key);
  if (at === -1) return null;

  const start = text.indexOf('[', at);
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']' && --depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function checkService(service) {
  const url = `https://cal.com/${CAL.username}/${service.calSlug}`;
  const res = await fetch(url);
  if (!res.ok) return { id: service.id, ok: false, why: `HTTP ${res.status} at ${url}` };

  const fields = extractBookingFields(await res.text());
  if (!fields) return { id: service.id, ok: false, why: 'could not read bookingFields (Cal changed its page shape?)' };

  const phone = fields.find(f => f.name === 'attendeePhoneNumber');
  const email = fields.find(f => f.name === 'email');

  const problems = [];
  if (!phone) problems.push('no phone field at all');
  else {
    if (phone.hidden) problems.push('phone is hidden');
    if (!phone.required) problems.push('phone is not required');
  }
  if (!email || email.hidden) problems.push('EMAIL IS GONE — the Confirmation toggle was flipped to Phone');
  else if (!email.required) problems.push('email is not required');

  return { id: service.id, ok: problems.length === 0, why: problems.join('; ') };
}

const results = await Promise.all(SERVICES.map(checkService));

for (const r of results) {
  console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.id.padEnd(14)} ${r.why}`);
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} services ask for a phone number.`);
process.exit(failed ? 1 : 0);
