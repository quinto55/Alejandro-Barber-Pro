import { USE_MOCK, API_BASE, SERVICES, HOURS } from './config.js';
import { availableSlots } from './slots.js';
import { weekdayOf } from './tz.js';
import { hashDate } from './mock-busy.js';

export function isMock() { return USE_MOCK; }

/** Two to four plausible appointments, stable per date. */
export function mockBusyFor(dateStr) {
  const hours = HOURS[weekdayOf(dateStr)];
  if (!hours) return [];
  const h = hashDate(dateStr);
  const count = 2 + (h % 3);
  const out = [];
  let cursor = hours.open + 30 + (h % 60);
  for (let i = 0; i < count; i++) {
    const dur = 45 + ((h >> (i * 3)) % 5) * 15;
    const gap = 30 + ((h >> (i * 5)) % 6) * 15;
    if (cursor + dur > hours.close) break;
    out.push({ start: cursor, end: cursor + dur });
    cursor += dur + gap;
  }
  return out;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pure validation, shared by the mock and the live path. */
export function validateBooking(b) {
  const fields = {};
  const service = SERVICES.find(s => s.id === b.serviceId);
  if (!service || !service.selfBookable) fields.serviceId = 'book.required';
  if (!b.date) fields.date = 'book.required';
  if (!b.time) fields.time = 'book.required';
  if (!b.name?.trim()) fields.name = 'book.required';
  if (!b.email?.trim()) fields.email = 'book.required';
  else if (!EMAIL_RE.test(b.email.trim())) fields.email = 'book.badEmail';
  if (!b.phone?.trim()) fields.phone = 'book.required';
  else if ((b.phone.match(/\d/g) || []).length < 10) fields.phone = 'book.badPhone';
  return Object.keys(fields).length ? { ok: false, error: 'validation', fields } : { ok: true };
}

export async function getAvailability(dateStr, serviceId) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 260)); // make the loading state real
    return availableSlots({ dateStr, serviceId, busy: mockBusyFor(dateStr) });
  }
  const url = `${API_BASE}/availability?date=${encodeURIComponent(dateStr)}&serviceId=${encodeURIComponent(serviceId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`availability ${res.status}`);
  return (await res.json()).slots;
}

export async function book(payload) {
  const invalid = validateBooking(payload);
  if (!invalid.ok) return invalid;

  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));
    const still = availableSlots({
      dateStr: payload.date, serviceId: payload.serviceId, busy: mockBusyFor(payload.date),
    });
    if (!still.includes(payload.time)) return { ok: false, error: 'slot_taken' };
    return { ok: true, eventId: `mock-${payload.date}-${payload.time}`, start: `${payload.date}T${payload.time}`, end: null };
  }

  try {
    const res = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 409) return { ok: false, error: 'slot_taken' };
    if (!res.ok) return { ok: false, error: 'network' };
    return await res.json();
  } catch {
    return { ok: false, error: 'network' };
  }
}
