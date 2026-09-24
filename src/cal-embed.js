// Cal.com inline embed.
//
// Division of labour: the site owns service selection (wizard step 1) — the
// on-brand, trilingual grid with real prices and durations. Cal.com owns
// everything after it: availability against Alejandro's Google Calendar, the
// date/time picker, the details form, confirmation email, reminders and
// client-side rescheduling. None of that is reimplemented here.
//
// Since 2026-09 the site also hands Cal a `duration` (the length the
// calendar must block, from addons.js) and a `notes` line naming the
// add-ons. See docs/superpowers/specs/2026-09-23-add-ons-design.md, §7.
//
// The embed is third-party and loads over the network, so every path in this
// module assumes it might not arrive: see mountCal()'s fallback link.

import { CAL, SERVICES } from './config.js';
import { currentLang } from './i18n.js';

const EMBED_SRC = 'https://app.cal.com/embed/embed.js';

/**
 * Cal.com's official loader snippet, transcribed. It defines window.Cal as a
 * queueing stub, injects the real embed script once, and replays whatever was
 * queued when that script takes over. Kept close to the vendor's published
 * form on purpose — this is their contract, not our code to tidy.
 */
function ensureCalLoader() {
  if (window.Cal) return;
  (function (C, A, L) {
    const p = function (a, ar) { a.q.push(ar); };
    const d = C.document;
    C.Cal = C.Cal || function () {
      const cal = C.Cal;
      const ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement('script')).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar);
          p(cal, ['initNamespace', namespace]);
        } else {
          p(cal, ar);
        }
        return;
      }
      p(cal, ar);
    };
  })(window, EMBED_SRC, 'init');
}

/**
 * cal.com/<username>/<calSlug>. The slug is looked up on the service record —
 * it is deliberately NOT the service id, which only coincides for two of the
 * six. Falling back to the id keeps a brand-new service reachable rather than
 * throwing, but it will 404 until a calSlug is filled in.
 */
export function calLinkFor(serviceId) {
  const service = SERVICES.find(s => s.id === serviceId);
  return `${CAL.username}/${service?.calSlug ?? serviceId}`;
}

/**
 * Query params for the booking page. Both are Cal's own prefill params:
 * `duration` is honoured only when the event type offers that length (that
 * is what docs/cal-multiple-durations.md sets up, and why ADDONS_LIVE
 * exists); `notes` prefills the notes field the client sees. Falsy values
 * are left out so a call with no add-ons is indistinguishable from before.
 */
function calParams({ duration, notes } = {}) {
  const p = new URLSearchParams();
  if (duration) p.set('duration', String(duration));
  if (notes) p.set('notes', notes);
  return p;
}

/** The public booking URL, used for the no-JS / embed-blocked fallback. */
export function calUrlFor(serviceId, params) {
  const qs = calParams(params).toString();
  return `https://cal.com/${calLinkFor(serviceId)}${qs ? `?${qs}` : ''}`;
}

/**
 * Mount an inline Cal.com booking widget for one service into `container`.
 *
 * A namespace per service keeps repeat mounts (the client going back and
 * picking a different service, or switching language) from colliding — Cal
 * keys its internal instances by namespace.
 *
 * NOTE ON LANGUAGE: the site's own toggle drives `currentLang()`, and the
 * language is handed to Cal below. Cal's own support for being forced into a
 * locale is not something this code can guarantee — if the widget ignores it
 * and renders in the visitor's browser language, that is a Cal-side
 * limitation, not a bug here. Verify against the live account before
 * promising trilingual booking.
 */
export function mountCal(container, serviceId, params = {}) {
  ensureCalLoader();

  const namespace = serviceId;
  const lang = currentLang();

  window.Cal('init', namespace, { origin: 'https://cal.com' });

  // Cal's embed turns every `config` key into a query param on the booking
  // page (embed-core's buildFilteredQueryParams), so duration and notes
  // ride along with the layout and locale. Values go in raw — the embed
  // does its own encoding.
  const config = { layout: CAL.layout, theme: CAL.theme, locale: lang };
  for (const [key, value] of calParams(params)) config[key] = value;

  window.Cal.ns[namespace]('inline', {
    elementOrSelector: container,
    calLink: calLinkFor(serviceId),
    layout: CAL.layout,
    config,
  });

  window.Cal.ns[namespace]('ui', {
    theme: CAL.theme,
    hideEventTypeDetails: false,
    styles: { branding: { brandColor: CAL.brandColor } },
  });
}
