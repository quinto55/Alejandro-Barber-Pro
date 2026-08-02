# Alejandro Barber Pro — Website Design Spec

**Date:** 2026-08-01
**Status:** Approved
**Repo:** `quinto55/Alejandro-Barber-Pro` (local: `~/projects/Alejandro-Barber-Pro`)

---

## 1. Purpose

Give Alejandro a professional site he owns, replacing a Booksy-only web presence. Two jobs:

1. Present his work — portfolio, services, credibility — in a way a third-party listing page cannot.
2. Take appointments directly, writing them to his own Google Calendar.

The site is the only booking channel. Booksy remains as a review source for credibility, not as a booking path.

## 2. Verified business facts

Everything below was pulled from live sources on 2026-08-01. No detail in the site copy may be invented; anything not on this list must be confirmed with Alejandro before it ships.

| Field | Value | Source |
|---|---|---|
| Business name | A L E J A N D R O B A R B E R P R O | Booksy |
| Address | 30-30 Northern Blvd, Phoenix Salon Suites, 1st Floor, Suite #158, Long Island City, NY 11101 | Booksy |
| Rating | 5.0 ★ from 147 reviews (144×5, 2×4, 1×1) | Booksy |
| Tagline | "The best customer experience, with the best services of 100% quality" | Booksy "About Us" |
| Positioning | NYC Taper Fade Specialist | Instagram bio |
| Nationality | Venezuelan (Puerto la Cruz) 🇻🇪 | Instagram bio, Facebook |
| Instagram | @alejandrobarberpro — 4,045 followers | Instagram |
| Mobile service | Offered (Booksy badge) | Booksy |
| Amenities | Credit cards, wheelchair accessible, child-friendly, pets allowed, Wi-Fi | Booksy |

### Business hours

| Day | Hours |
|---|---|
| Sunday | Closed — VIP / after-hours by prior approval only |
| Monday | 09:00 – 20:10 |
| Tuesday | 09:00 – 20:10 |
| Wednesday | 09:00 – 20:25 |
| Thursday | 09:00 – 20:25 |
| Friday | 09:00 – 20:25 |
| Saturday | 09:00 – 20:25 |

The odd closing times (20:10 / 20:25) are Alejandro's real posted hours, not a transcription error. They are derived from his last bookable slot. Hours live in one config object so a change is a one-line edit.

### Services

Prices are "from" prices — Booksy shows `$60.00+`, meaning final price can rise with hair length or complexity. The site must preserve the "+" so no client arrives expecting a fixed price.

| ID | English | Spanish | From | Duration | Notes |
|---|---|---|---|---|---|
| `haircut` | Haircut, no beard | Corte de cabello, no barba | $60+ | 55 min | Skin fade, taper-up, Mohawk, or regular. No beard. |
| `haircut-beard` | Haircut with beard | Corte y barba | $85+ | 1h 20m | Includes hot towel |
| `kids` | Kids haircut, ages 6–12 | Corte niños 6–12 años | $60+ | 50 min | No design included |
| `vip` | Sunday & after-hours VIP | VIP domingo / fuera de horario | $150 | 1h 5m | **Requires prior approval — not self-bookable** |
| `platinum` | Platinum highlights + cut + hydration | Mechas platinadas + corte + hidratación | $275+ | 2h 55m | |
| `color` | Hair dye + hydration + cut | Tinte + hidratación + corte | $355+ | 3h 20m | |

`vip` is deliberately not self-bookable. Booksy states Sundays are "subject to availability, please contact me before booking for approval." Letting the site auto-confirm a Sunday VIP slot would create appointments Alejandro never agreed to. The VIP card renders a "Request approval" action that links to his Instagram DM (`instagram.com/alejandrobarberpro`) rather than entering the booking flow. Instagram is the channel, because no public phone or email exists for him — Booksy gates contact behind an account. If Alejandro supplies a business phone or email later, that becomes the VIP contact path instead.

### Reviews to display (verbatim, real)

- Julio — "Alejandro is the best, super nice guy and gave me a great hair cut"
- erick — "El mejor, nunca falla una 🔥"
- Leonardo — "Best cuts" (business replied: "Gracias 🔥🤝")
- Anthony — "Great experience, would definitely come again."
- Alex — "Amazing work"
- Khan — "Excellent"

Displayed with first name only. A small non-clickable line reads "Verified reviews from Booksy" — showing a 5.0/147 figure without a source is unverifiable, and attribution is accuracy rather than a booking path.

## 3. Assets

| Asset | Source | Handling |
|---|---|---|
| ABP crown logo | Booksy CDN, 1023×1023 JPEG, black on light gray | Converted to a **recolourable alpha-mask PNG**, coloured at render time via CSS `mask-image` + `background`. Raster black-on-gray cannot sit on a black background. |
| Portfolio | 32 photos, Booksy CDN `service_photos/`, 736×736 JPEG, ~75 KB each | Downloaded into `assets/portfolio/`. Never hotlinked — a third-party CDN is not a dependency this site should carry. |
| Storefront photo | Booksy CDN `biz_photo/` | Optional, for the location section. |

**Amendment, 2026-08-01 (planning):** the logo was originally specced as a hand-traced SVG. On inspecting the source — a serif `ABp` wordmark plus a hand-drawn crown on a soft gray gradient — tracing a serif face without the original font would have lost fidelity. The alpha-mask approach preserves his exact mark, recolours to gold or bone from a single file, and stays crisp far beyond the ~200px it ever renders at. Validated against the real file during planning.

Instagram logged-out exposes only 12 grid images versus Booksy's 32, so Booksy is the primary source. Instagram remains an option later if Alejandro provides login access.

Photos are Alejandro's own work, on his own profile, used for his own site, with his okay confirmed by the project owner.

Total portfolio weight is ~2.4 MB. Mitigated by lazy loading and rendering 12 thumbnails initially behind a "load more" control, so first paint never pays for all 32.

## 4. Architecture

```
GitHub Pages (static)  ── quinto55/Alejandro-Barber-Pro
  index.html
  styles.css
  app.js               UI, portfolio, i18n, booking wizard
  booking-api.js       single seam: mock or live
  slots.js             pure availability logic (unit-tested)
  i18n/{en,es,zh}.json
  assets/{logo.svg, portfolio/*.jpg}
        │  fetch()
        ▼
  USE_MOCK = true   →  in-browser mock with seeded busy blocks   ← ships now
  USE_MOCK = false  →  Cloudflare Worker (written, NOT deployed)
                          GET  /availability?date&serviceId
                          POST /book
                            → Google Calendar FreeBusy + events.insert
                            → sendUpdates:'all' emails client + Alejandro
                          ▼
                       Alejandro's Google Calendar
```

**Why a Worker.** GitHub Pages serves static files only and cannot hold a Google credential. A Cloudflare Worker (free tier, 100k req/day) is the smallest thing that can. The site stays exactly where it was chosen to live.

**Why a service account, not OAuth.** Alejandro shares his calendar with a service-account address from Google Calendar settings and grants "Make changes to events." No login flow, no refresh token that silently expires months later and breaks bookings without anyone noticing.

**Why Google Calendar invites, not custom email.** `events.insert` with `sendUpdates: 'all'` and the client as an attendee makes Google send both parties a real calendar invite with an Add-to-Calendar button and automatic reminders. No sending domain, no email service, no cost. A branded Resend email needs a custom domain, which does not exist yet.

### API contract

Both mock and live implement this exactly, so flipping `USE_MOCK` changes nothing else.

```
GET /availability?date=YYYY-MM-DD&serviceId=<id>
  200 → { date, serviceId, slots: ["09:00", "09:15", ...] }

POST /book
  body → { serviceId, date, time, name, email, phone, notes }
  200  → { ok: true, eventId, start, end }
  409  → { ok: false, error: "slot_taken" }
  400  → { ok: false, error: "validation", fields: {...} }
```

### Availability logic (`slots.js`)

A pure function, no network and no DOM:

```
slotsFor({ date, businessHours, serviceDuration, busy, now, leadTimeMin, stepMin })
  → string[]
```

Rules:
- Step 15 minutes (`stepMin = 15`).
- A slot is valid only if `start + serviceDuration` fits entirely inside that day's business hours.
- A slot is dropped if `[start, start+duration)` overlaps any busy interval.
- Slots earlier than `now + leadTimeMin` are dropped. `leadTimeMin = 120` — two hours, so no one books a $355 colour service twenty minutes out while he is mid-cut.
- No buffer between appointments. Booksy durations already include his cleanup time, and adding a second buffer on top would silently shrink his bookable day.
- Sunday returns `[]`.
- All arithmetic in `America/New_York`. DST transitions must not shift or duplicate slots.

Being pure is what makes it verifiable without a browser or a live calendar.

## 5. Page structure

Single page, anchor navigation, plus a booking wizard.

1. **Hero** — ABP crown, "NYC Taper Fade Specialist," 5.0★/147, primary Book CTA
2. **Services** — six cards, real prices with "+", real durations; VIP card distinct
3. **Portfolio** — 12 photos then load-more to 32, lightbox
4. **About** — Venezuelan barber in Long Island City, positioning, amenities
5. **Reviews** — real quotes, Booksy attribution
6. **Location & hours** — address, embedded map, full week table, mobile-service note
7. **Booking** — four-step wizard
8. **Footer** — Instagram, Facebook, TikTok

### Booking wizard

**Service** → **Date** (60-day calendar; Sundays disabled with the VIP note) → **Time** (valid slots only) → **Details** (name, email, phone, notes) → confirmation.

State lives in one object. Back navigation never loses entered data. Every step is reachable by keyboard.

## 6. Trilingual EN / ES / ZH

Header toggle, JSON dictionaries keyed identically, choice persisted to `localStorage`, `<html lang>` updated on switch. No text hardcoded in markup.

**Spanish** is written directly — his own Booksy service names are already bilingual and supply the vocabulary he uses.

**Chinese** (Simplified) ships marked for native review in `i18n/zh.json`. Shipping unreviewed machine-quality Chinese as final would misrepresent the quality of the work.

## 7. Testing

| Layer | How |
|---|---|
| `slots.js` | Unit tests, `node --test`, zero dependencies. Covers: duration fitting inside hours, busy-interval overlap, lead time, Sunday closure, DST boundaries, the 20:10 vs 20:25 hour split. |
| Booking wizard | Manual browser pass against the mock: full happy path, back-navigation state retention, validation errors, taken-slot 409. |
| i18n | Assert all three dictionaries have identical key sets — a missing key must fail, not render blank. |
| Responsive | Verified at 375 / 768 / 1440 px. |
| Accessibility | Keyboard-only pass through the wizard; contrast checked against the dark palette. |

## 8. Scope boundary for this build

**In:** complete static site, portfolio, trilingual copy, full booking wizard against the mock, tested slot engine, hand-traced SVG logo, Worker source code, deploy checklist.

**Out, by explicit decision:** no GCP project, no service account, no Cloudflare deployment, no live Google Calendar connection, no payments or deposits, no Booksy booking link, no custom domain (ships at `quinto55.github.io/Alejandro-Barber-Pro`).

The Worker is written but not deployed. Infrastructure is a follow-up session.

## 9. Deferred

- Google Calendar connection (needs Alejandro's calendar + GCP/Cloudflare accounts)
- Custom domain, then branded Resend email
- Stripe deposits for no-show protection
- Native review of Chinese copy
- Instagram photos, if he grants login access
