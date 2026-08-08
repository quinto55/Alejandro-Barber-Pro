// Cloudflare Worker: connects the booking wizard to Alejandro's real Google
// Calendar. Written in Task 14 but NOT deployed — see worker/README.md for
// the deploy checklist and for confirmation that no account was touched.
//
// Satisfies the API contract already fixed by the client (src/booking-api.js,
// !USE_MOCK branches):
//
//   GET  /availability?date=YYYY-MM-DD&serviceId=<id>
//        200 -> { date, serviceId, slots: ["09:00", "09:15", ...] }
//
//   POST /book   body: { serviceId, date, time, name, email, phone, notes }
//        200 -> { ok: true, eventId, start, end }
//        409 -> { ok: false, error: "slot_taken" }
//        400 -> { ok: false, error: "validation", fields: {...} }
//
// The availability math (open hours, duration, busy-block overlap, lead
// time) is NOT reimplemented here. Both this Worker and the mock path in
// src/booking-api.js call the same src/slots.js#availableSlots, so they
// cannot silently drift apart.
//
// Secrets (bound via `wrangler secret put`, never hardcoded):
//   env.GOOGLE_CLIENT_EMAIL  service-account email
//   env.GOOGLE_PRIVATE_KEY   service-account private key, PEM, "\n" newlines
//   env.CALENDAR_ID          Alejandro's calendar id, shared with the SA
//   env.ALLOWED_ORIGIN       exact origin allowed to call this Worker

import { availableSlots } from '../../src/slots.js';
import { validateBooking } from '../../src/booking-api.js';
import { SERVICES } from '../../src/config.js';
import { nyWallToUtc, addDays } from '../../src/tz.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    try {
      if (request.method === 'GET' && url.pathname === '/availability') {
        return await handleAvailability(url, env, cors);
      }
      if (request.method === 'POST' && url.pathname === '/book') {
        return await handleBook(request, env, cors);
      }
      return json({ ok: false, error: 'not_found' }, 404, cors);
    } catch (err) {
      // Never leak upstream error bodies or stack traces to the browser.
      console.error('worker error', err);
      return json({ ok: false, error: 'server_error' }, 500, cors);
    }
  },
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}

/** GET /availability?date&serviceId */
async function handleAvailability(url, env, cors) {
  const dateStr = url.searchParams.get('date');
  const serviceId = url.searchParams.get('serviceId');
  if (!dateStr || !serviceId) {
    return json({ ok: false, error: 'validation', fields: {
      ...(dateStr ? {} : { date: 'book.required' }),
      ...(serviceId ? {} : { serviceId: 'book.required' }),
    } }, 400, cors);
  }

  const token = await getAccessToken(env);
  const busy = await freeBusyFor(dateStr, token, env);
  const slots = availableSlots({ dateStr, serviceId, busy });
  return json({ date: dateStr, serviceId, slots }, 200, cors);
}

/** POST /book */
async function handleBook(request, env, cors) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'validation', fields: { _: 'book.required' } }, 400, cors);
  }

  const invalid = validateBooking(payload);
  if (!invalid.ok) return json(invalid, 400, cors);

  const service = SERVICES.find(s => s.id === payload.serviceId);
  const token = await getAccessToken(env);

  // Re-check availability immediately before insert: the slot could have
  // been taken while the client was filling out the form.
  const busy = await freeBusyFor(payload.date, token, env);
  const stillFree = availableSlots({ dateStr: payload.date, serviceId: payload.serviceId, busy });
  if (!stillFree.includes(payload.time)) {
    return json({ ok: false, error: 'slot_taken' }, 409, cors);
  }

  const startMin = minutesFromHHMM(payload.time);
  const start = nyWallToUtc(payload.date, startMin);
  const end = nyWallToUtc(payload.date, startMin + service.durationMin);

  const event = await insertEvent(payload, service, start, end, token, env);

  return json({
    ok: true,
    eventId: event.id,
    start: event.start?.dateTime ?? start.toISOString(),
    end: event.end?.dateTime ?? end.toISOString(),
  }, 200, cors);
}

/** 'HH:MM' -> minutes past midnight. */
function minutesFromHHMM(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Google's freeBusy API for the full NY calendar day of dateStr. */
async function freeBusyFor(dateStr, token, env) {
  const timeMin = nyWallToUtc(dateStr, 0).toISOString();
  const timeMax = nyWallToUtc(addDays(dateStr, 1), 0).toISOString();

  const res = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: env.CALENDAR_ID }] }),
  });
  if (!res.ok) {
    console.error('freeBusy request failed', res.status, await safeText(res));
    throw new Error('freebusy_failed');
  }
  const data = await res.json();
  const cal = data.calendars?.[env.CALENDAR_ID];
  if (cal?.errors?.length) {
    console.error('freeBusy calendar errors', cal.errors);
    throw new Error('freebusy_failed');
  }
  // Google returns { busy: [{ start: ISO, end: ISO }, ...] } — the same
  // shape availableSlots() already accepts from src/slots.js.
  return cal?.busy ?? [];
}

/** Insert the confirmed event, inviting the client and Alejandro. */
async function insertEvent(payload, service, start, end, token, env) {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(env.CALENDAR_ID)}/events?sendUpdates=all`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        summary: `${service.id} — ${payload.name}`,
        description: payload.notes || '',
        start: { dateTime: start.toISOString(), timeZone: 'America/New_York' },
        end: { dateTime: end.toISOString(), timeZone: 'America/New_York' },
        attendees: [{ email: payload.email, displayName: payload.name }],
      }),
    },
  );
  if (!res.ok) {
    console.error('event insert failed', res.status, await safeText(res));
    throw new Error('insert_failed');
  }
  return res.json();
}

/**
 * Exchange a signed service-account JWT for an OAuth access token.
 * See https://developers.google.com/identity/protocols/oauth2/service-account
 */
async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: env.GOOGLE_CLIENT_EMAIL,
    scope: CALENDAR_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const key = await importPrivateKey(env.GOOGLE_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error('token exchange failed', res.status, await safeText(res));
    throw new Error('token_exchange_failed');
  }
  const data = await res.json();
  return data.access_token;
}

/** PEM PKCS#8 -> a Web Crypto private key usable for RS256 signing. */
async function importPrivateKey(pem) {
  const contents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = base64ToArrayBuffer(contents);
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/** Base64url-encode a UTF-8 string or an ArrayBuffer/TypedArray. */
function base64url(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Best-effort read of a failed response body, for server-side logs only. */
async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
