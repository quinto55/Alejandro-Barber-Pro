// The money and minutes behind the add-ons step. Pure: no DOM, no i18n.
//
// The one idea here: Cal.com owns the calendar and only offers lengths from
// a fixed menu (CAL_DURATION_MENU), so the true time of an appointment is
// rounded UP to the next menu value. Never down. Design:
// docs/superpowers/specs/2026-09-23-add-ons-design.md, §5.
import { ADDONS, ADDON_NOTE_PREFIX, CAL_DURATION_MENU } from './config.js';

/** The add-on records a service offers, in ADDONS order. */
export function addonsFor(service) {
  return ADDONS.filter(a => service.addons.includes(a.id));
}

/** Smallest Cal menu length that fits `minutes`. */
export function calDurationFor(minutes) {
  const fit = CAL_DURATION_MENU.find(d => d >= minutes);
  if (fit === undefined) throw new RangeError(`${minutes} min is longer than any length Cal offers`);
  return fit;
}

/** The length Alejandro must set as the event's default. */
export function defaultDurationFor(service) {
  return calDurationFor(service.durationMin);
}

// Ids in, records out, always in ADDONS order so output never depends on the
// order a client happened to tick things. Unknown ids simply drop out.
function chosen(addonIds) {
  const ids = new Set(addonIds);
  return ADDONS.filter(a => ids.has(a.id));
}
const sumMin = addonIds => chosen(addonIds).reduce((n, a) => n + a.min, 0);
const sumPrice = addonIds => chosen(addonIds).reduce((n, a) => n + a.price, 0);

/** What the calendar will block for this service with these add-ons. */
export function bookedDurationFor(service, addonIds) {
  return calDurationFor(service.durationMin + sumMin(addonIds));
}

/**
 * Every length Alejandro has to tick on Cal for this service: one per
 * distinct combination of its add-ons (including none), rounded up,
 * de-duplicated, ascending. This is the table in
 * docs/cal-multiple-durations.md and what `npm run check:cal` reads back
 * off his live event type.
 */
export function durationOptionsFor(service) {
  const sums = new Set([0]);
  for (const a of addonsFor(service)) {
    for (const s of [...sums]) sums.add(s + a.min);
  }
  const lengths = new Set([...sums].map(s => calDurationFor(service.durationMin + s)));
  return [...lengths].sort((a, b) => a - b);
}

/**
 * Price and time for a service plus add-ons. `minutes` is the true time;
 * `booked` is what Cal will block. The wizard shows `booked` (spec §3.4).
 */
export function totalsFor(service, addonIds) {
  return {
    priceFrom: service.priceFrom + sumPrice(addonIds),
    plus: service.plus,
    minutes: service.durationMin + sumMin(addonIds),
    booked: bookedDurationFor(service, addonIds),
  };
}

/** The line prefilled into Cal's notes field, or null when nothing was added. */
export function notesFor(addonIds) {
  const picked = chosen(addonIds);
  if (picked.length === 0) return null;
  return `${ADDON_NOTE_PREFIX}: ${picked.map(a => a.note).join(', ')}`;
}
