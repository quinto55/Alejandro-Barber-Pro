// All America/New_York conversion lives here. No other module touches
// timezones. Uses built-in Intl so there is no dependency and the IANA
// rules stay current with the runtime.

export const TZ = 'America/New_York';

const FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

function fields(instant) {
  const p = Object.fromEntries(FMT.formatToParts(instant).map(x => [x.type, x.value]));
  let hour = Number(p.hour);
  if (hour === 24) hour = 0; // some ICU builds emit '24' at midnight
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour, minute: Number(p.minute),
  };
}

/** 'YYYY-MM-DD' -> 0 (Sunday) .. 6 (Saturday). UTC math avoids host-zone drift. */
export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 'YYYY-MM-DD' + n days -> 'YYYY-MM-DD'. */
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** A UTC instant -> the NY calendar date and minutes past NY midnight. */
export function nyParts(instant) {
  const f = fields(instant);
  return {
    date: `${String(f.year).padStart(4, '0')}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`,
    minutes: f.hour * 60 + f.minute,
  };
}

/** Offset in ms that NY is ahead of UTC at a given instant (negative in NY). */
function offsetMs(instant) {
  const f = fields(instant);
  const asIfUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute);
  return asIfUtc - Math.floor(instant.getTime() / 60000) * 60000;
}

/**
 * NY wall clock -> the UTC instant.
 * Two passes: guess the offset, correct, re-check. The second pass fixes
 * the case where the first guess landed on the far side of a DST boundary.
 */
export function nyWallToUtc(dateStr, minutes) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let ts = naive;
  for (let i = 0; i < 2; i++) ts = naive - offsetMs(new Date(ts));
  return new Date(ts);
}

/**
 * A UTC busy block -> minutes past NY midnight on dateStr, clamped to that
 * day. Returns null when the block does not overlap the day at all.
 * Wall minutes come from nyParts rather than elapsed time, so a DST day
 * maps correctly instead of shifting by an hour.
 */
export function toWallInterval({ start, end }, dateStr) {
  const s = new Date(start);
  const e = new Date(end);
  const dayStart = nyWallToUtc(dateStr, 0);
  const nextStart = nyWallToUtc(addDays(dateStr, 1), 0);
  if (e <= dayStart || s >= nextStart) return null;
  const startMin = s <= dayStart ? 0 : nyParts(s).minutes;
  const endMin = e >= nextStart ? 1440 : nyParts(e).minutes;
  if (endMin <= startMin) return null;
  return { start: startMin, end: endMin };
}
