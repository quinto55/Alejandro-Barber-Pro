import { weekdayOf, nyParts, toWallInterval } from './tz.js';
import { HOURS, SERVICES, BOOKING } from './config.js';

/** Minutes past midnight -> 'HH:MM'. */
export function formatMinutes(m) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * Pure slot generator. No network, no DOM, no clock.
 *
 * hours       {open, close} minutes past midnight, or null when closed
 * durationMin how long the service takes
 * busy        [{start, end}] minutes past midnight, already wall-clock
 * earliestMin no slot may start before this
 * stepMin     grid granularity
 */
export function slotsFor({ hours, durationMin, busy = [], earliestMin = 0, stepMin = BOOKING.stepMin }) {
  if (!hours || !durationMin) return [];
  const out = [];
  const first = Math.ceil(hours.open / stepMin) * stepMin;
  for (let t = first; t + durationMin <= hours.close; t += stepMin) {
    if (t < earliestMin) continue;
    // Half-open overlap: a block ending exactly at t does not clash.
    const clash = busy.some(b => t < b.end && b.start < t + durationMin);
    if (!clash) out.push(formatMinutes(t));
  }
  return out;
}

/**
 * Slots for a real date and service.
 * busy accepts UTC ISO pairs (as Google returns them) and converts them.
 */
export function availableSlots({ dateStr, serviceId, busy = [], now = new Date() }) {
  const service = SERVICES.find(s => s.id === serviceId);
  if (!service || !service.selfBookable) return [];

  const today = nyParts(now);
  if (dateStr < today.date) return [];

  const earliestMin = dateStr === today.date ? today.minutes + BOOKING.leadTimeMin : 0;

  const wallBusy = busy
    .map(b => (typeof b.start === 'string' ? toWallInterval(b, dateStr) : b))
    .filter(Boolean);

  return slotsFor({
    hours: HOURS[weekdayOf(dateStr)],
    durationMin: service.durationMin,
    busy: wallBusy,
    earliestMin,
  });
}
