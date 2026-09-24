#!/usr/bin/env node
/**
 * Read Alejandro's LIVE Cal.com event types and report whether they are set
 * up the way the site assumes. Two sections:
 *
 *   phone      all six services   the booking form asks for a phone number
 *                                 (docs/cal-booking-questions.md)
 *   durations  add-on services    the event offers exactly the lengths the
 *                                 site may ask for, with the site's default,
 *                                 and hides Cal's own duration picker
 *                                 (docs/cal-multiple-durations.md)
 *
 * Why this exists: both are properties of each Cal.com event type, not of
 * this repo. Nothing in src/ can show a field Cal is hiding or make Cal
 * honour a length it does not offer, so the only way to know is to read it
 * back. Each change is a handful of manual clicks in his dashboard repeated
 * per service — exactly the shape of task where one gets missed.
 *
 * The durations section is the launch gate for ADDONS_LIVE in src/config.js:
 * flip it only when every add-on service reads `ok` here.
 *
 * Source: Cal's public tRPC endpoint, the same one the booking page itself
 * calls. It returns the event type as JSON (length, metadata, bookingFields),
 * which beats scraping the page's HTML as this script used to.
 *
 * Usage:  node scripts/check-cal-fields.mjs      (npm run check:cal)
 * Exit:   0 = everything correct, 1 = at least one line failed or unreadable.
 */
import { CAL, SERVICES } from '../src/config.js';
import { assessPhone, assessDurations } from './lib/cal-checks.mjs';

function eventUrl(slug) {
  const input = JSON.stringify({ json: { username: CAL.username, eventSlug: slug, isTeamEvent: false, org: null } });
  return `https://cal.com/api/trpc/public/event?input=${encodeURIComponent(input)}`;
}

async function fetchEvent(service) {
  const res = await fetch(eventUrl(service.calSlug));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  const event = body?.result?.data?.json;
  if (!event || typeof event !== 'object') throw new Error('no event in the response (Cal changed its API shape?)');
  return event;
}

const rows = [];
function report(section, service, problems) {
  rows.push({ section, id: service.id, ok: problems.length === 0, why: problems.join('; ') });
}

await Promise.all(SERVICES.map(async service => {
  let event;
  try {
    event = await fetchEvent(service);
  } catch (err) {
    report('phone', service, [err.message]);
    if (service.addons.length) report('durations', service, [err.message]);
    return;
  }
  report('phone', service, assessPhone(event.bookingFields));
  if (service.addons.length) report('durations', service, assessDurations(event, service));
}));

const order = { phone: 0, durations: 1 };
rows.sort((a, b) => order[a.section] - order[b.section] || SERVICES.findIndex(s => s.id === a.id) - SERVICES.findIndex(s => s.id === b.id));
for (const r of rows) {
  console.log(`${r.section.padEnd(10)} ${r.id.padEnd(14)} ${r.ok ? 'ok  ' : 'FAIL'}  ${r.why}`);
}

const phone = rows.filter(r => r.section === 'phone');
const durations = rows.filter(r => r.section === 'durations');
const okCount = list => list.filter(r => r.ok).length;
console.log(`\n${okCount(phone)}/${phone.length} services ask for a phone number.`);
console.log(`${okCount(durations)}/${durations.length} add-on services carry their duration lists.` +
  (okCount(durations) === durations.length ? ' ADDONS_LIVE may be turned on.' : ' ADDONS_LIVE must stay false.'));

process.exit(rows.some(r => !r.ok) ? 1 : 0);
