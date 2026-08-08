# Alejandro Barber Pro

A trilingual (English / Spanish / Chinese) marketing and booking site for
Alejandro Barber Pro — NYC Taper Fade Specialist, located at Phoenix Salon
Suites, Long Island City, Queens. Vanilla HTML/CSS/JS, no build step, no
framework.

The site covers services and pricing, a portfolio gallery, hours/location/
reviews, and a multi-step appointment booking wizard.

**Booking is in demo mode — see `worker/README.md` to connect Google
Calendar.** Until then, the wizard runs against a deterministic in-browser
mock (`USE_MOCK = true` in `src/config.js`), so every part of the booking
flow is fully clickable and testable without any backend.

## Running it locally

No install step — it's static files plus a dev server for convenience:

```bash
npm run serve
```

This starts a local static server (`python3 -m http.server 8080`) at
http://localhost:8080.

## Running the tests

```bash
npm test
```

Runs the Node built-in test runner (`node --test test/`) over the pure
logic modules (slot math, timezone conversion, i18n, config, the booking
API's mock and validation paths). No browser or network required.

## File map

- **`index.html`** — the single page. All sections (hero, services,
  portfolio, visit/hours/reviews, booking wizard, footer) live here as
  markup; JS fills in content and behavior at runtime.
- **`styles.css`** — all styling.
- **`src/`** — application logic, ES modules, no bundler:
  - `config.js` — business data, hours, services, pricing, booking rules,
    and the `USE_MOCK` / `API_BASE` switch that controls demo vs. live
    booking.
  - `i18n.js` — trilingual runtime (reads `i18n/*.js`, applies
    `data-i18n` attributes, handles language switching).
  - `tz.js` — all America/New_York timezone conversion; no other module
    touches timezones directly.
  - `slots.js` — pure slot-availability math (open hours, service
    duration, busy-block overlap, lead time). Shared by both the mock
    booking path and the real Google Calendar Worker, so they can't drift
    apart.
  - `mock-busy.js` — deterministic fake "busy" calendar blocks, used only
    when `USE_MOCK` is true.
  - `booking-api.js` — the booking API surface the wizard calls
    (`getAvailability`, `book`, `validateBooking`). Switches between the
    mock path and real `fetch` calls to the Worker based on `USE_MOCK`.
  - `wizard.js` — the multi-step booking UI (service → date/time → contact
    details → confirmation).
  - `services.js`, `portfolio.js`, `visit.js` — rendering for the
    services list, portfolio gallery, and hours/address/reviews sections.
  - `app.js` — page shell wiring (footer links, mobile nav, init calls
    for the other modules).
- **`i18n/`** — `en.js`, `es.js`, `zh.js`: the translation dictionaries
  consumed by `src/i18n.js`.
- **`assets/`** — images (logo, favicon, portfolio photos) and fonts.
- **`worker/`** — the Cloudflare Worker that will connect the booking
  wizard to Alejandro's real Google Calendar, plus the deploy checklist.
  Written and syntax-checked, **not deployed**. See `worker/README.md`
  before running any of it.
- **`test/`** — Node test-runner specs for the pure logic in `src/`.
- **`scripts/`** — one-off asset-prep scripts (logo generation, asset
  fetching), not part of the runtime site.
- **`docs/`** — project planning docs (specs, task briefs) for this build.

## Connecting real booking

The wizard is fully functional today against the mock. To make it book real
appointments on Alejandro's Google Calendar, follow the checklist in
[`worker/README.md`](worker/README.md) — it walks through creating the GCP
project, service account, and Cloudflare Worker deployment, then flipping
`USE_MOCK` to `false` in `src/config.js`. None of that has been done yet;
no cloud account has been touched by this codebase.
