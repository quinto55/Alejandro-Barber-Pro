# Alejandro Barber Pro — Add-ons at Booking (Design Spec)

**Date:** 2026-09-23
**Status:** Approved 2026-09-23
**Repo:** `quinto55/Alejandro-Barber-Pro` (local: `~/projects/Alejandro-Barber-Pro`)
**Builds on:** `2026-08-01-alejandro-barber-pro-design.md` (the site) and the
2026-08-18 hand-off of scheduling to Cal.com (`src/cal-embed.js`).

---

## 1. Purpose

After a client picks a haircut in the booking wizard, offer the four add-ons
Alejandro already sells on Booksy — design, eyebrows, hair wash, facial —
each with its price and the time it adds, so that:

1. the client can add them to the same booking in one flow, and
2. Alejandro's calendar blocks enough time for the whole appointment and
   shows him what was added.

Source of the request: Alejandro, 2026-09-23, with a screenshot of Booksy's
"Complementos disponibles" sheet. Success is a client booking a haircut plus
add-ons on alejandrobarberpro.com and the resulting Cal.com event carrying
the right length and an "Add-ons" note.

## 2. Verified facts

### The add-ons (Booksy, screenshot 2026-09-23)

| id | Name on Booksy | Price | Adds | Description |
|---|---|---|---|---|
| `design` | Design - diseño | $20 | 10 min | — |
| `eyebrows` | Eyebrows - cejas | $10 | 5 min | — |
| `wash` | Washing your hair - lavado de cabello | $15 | 10 min | — |
| `facial` | FACIAL | $65 | 20 min | Vapor, toalla caliente, exfoliación, mascarilla de hidratación |

Prices are fixed, not from-prices. Booksy offers each with a quantity
stepper; this build uses a yes/no toggle (§3).

### How Cal.com handles lengths (read from Cal's source, 2026-09-23)

Everything the design leans on was checked against `calcom/cal.com@main`:

- **The dashboard's "multiple durations" menu is a fixed list**:
  5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80, 90, 120, 150, 180, 240,
  300, 360, 420, 480 minutes
  (`apps/web/modules/event-types/components/tabs/setup/EventSetupTab.tsx`,
  `multipleDurationOptions`). The event's default length must be one of the
  ticked options.
- **A "Hide duration selector in booking page" checkbox** sits in the same
  panel (`metadata.hideDurationSelectorInBookingPage`).
- **The booking page honours `?duration=N`** when N is in the event's list
  (`packages/features/bookings/Booker/store.ts`: `durationConfig.includes(...)`),
  and silently drops it otherwise.
- **The server validates the booked length against the same list**
  (`packages/features/bookings/lib/handleNewBooking/validateEventLength.ts`).
- **The inline embed forwards every `config` key as a query param**
  (`packages/embeds/embed-core/src/embed.ts`, `buildFilteredQueryParams`), so
  `config: { duration, notes }` prefills both. Cal's help page documents
  `duration` and `notes` as prefill params.
- Cal's API v2 would accept an arbitrary list (`lengthInMinutesOptions`,
  `@Min(1)` only), which is how exact lengths could be had. **Rejected** —
  see §3.

### Live state of his event types (read off cal.com, 2026-09-23)

All six: `multipleDuration` unset, `notes` field visible, no custom booking
questions. `kids` is 55 min on Cal, 50 on the site (open since August).

## 3. Decisions

1. **Round up to Cal's menu; no API key.** The exact-length route needs
   Alejandro to hand over an API key. Anthony chose the dashboard-only route
   on 2026-09-23, accepting that some appointments block more time than they
   take. The site never rounds *down*, so he can never be double-booked.
2. **Add-ons on the three haircut services only** — `haircut`,
   `haircut-beard`, `kids`. Not `platinum` or `color`: colour is 200 min,
   which is not on Cal's menu, so enabling this on it would book 240 for
   every colour client even with no add-ons; platinum with one add-on jumps
   from 175 to 240. Both stay exactly as they are. `vip` is untouched too.
3. **Toggles, not quantity steppers.** Nobody books two eyebrow trims.
4. **Totals show the booked length, not the raw sum.** A haircut with a
   design is presented as 1h 15m, not 1h 5m, so the site and Cal's panel on
   the same screen never disagree. The per-add-on "+10 min" labels stay
   true to Booksy.
5. **A launch gate.** `ADDONS_LIVE = false` in `config.js` until
   `npm run check:cal` proves all three services carry the right lists.
   While false the site behaves exactly as today. The code can ship before
   Alejandro does his part; nothing half-works in between.
6. **The client is told what was added through Cal's notes field**,
   prefilled and bilingual (English / Spanish) because Alejandro is the
   reader. The client can see and edit it; the duration is what binds.
7. **Cal's duration dropdown is hidden by Alejandro's checkbox**, not by the
   embed's `hideEventTypeDetails` — that flag would also hide the selected
   time summary, which the client should keep seeing.

## 4. Data (`src/config.js`)

```js
// Fixed list from Cal's dashboard — see §2 for the source file. If Cal
// changes it, the round-up lands somewhere else; `npm run check:cal`
// reads the live lists back so drift shows up there, not in bookings.
export const CAL_DURATION_MENU = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60,
  75, 80, 90, 120, 150, 180, 240, 300, 360, 420, 480];

// Prices and minutes from his Booksy add-on sheet, 2026-09-23. Fixed
// prices. `note` is what Alejandro reads on his calendar — bilingual on
// purpose, independent of the client's language. `descKey` only where
// Booksy shows a description.
export const ADDONS = [
  { id: 'design',   price: 20, min: 10, note: 'Design / Diseño' },
  { id: 'eyebrows', price: 10, min: 5,  note: 'Eyebrows / Cejas' },
  { id: 'wash',     price: 15, min: 10, note: 'Hair wash / Lavado de cabello' },
  { id: 'facial',   price: 65, min: 20, note: 'Facial', descKey: 'addon.facial.desc' },
];
export const ADDON_NOTE_PREFIX = 'Add-ons / Complementos';

// Flip to true only after `npm run check:cal` passes the duration section.
export const ADDONS_LIVE = false;
```

Each `SERVICES` entry gains `addons`: the list of add-on ids it offers —
all four on `haircut`, `haircut-beard`, `kids`; `[]` on the other three.
Nothing else on `SERVICES` changes; `durationMin` stays the true time.

## 5. Duration and price math (`src/addons.js`, pure, no DOM)

| Function | Returns |
|---|---|
| `calDurationFor(minutes)` | smallest `CAL_DURATION_MENU` value ≥ `minutes`; throws above 480 |
| `bookedDurationFor(service, addonIds)` | `calDurationFor(service.durationMin + Σ min)` |
| `durationOptionsFor(service)` | sorted unique `calDurationFor` over every subset sum of the service's add-ons (including none) — the list Alejandro must tick |
| `defaultDurationFor(service)` | `calDurationFor(service.durationMin)` — the default he must pick |
| `totalsFor(service, addonIds)` | `{ priceFrom: base + Σ price, plus: service.plus, minutes: true sum, booked: bookedDurationFor }` |
| `notesFor(addonIds)` | `"Add-ons / Complementos: Design / Diseño, Facial"` or `null` when none |

Pinned results (these are the tables in Alejandro's instructions; the test
asserts them so the doc and the code cannot drift apart):

| Service | Base | `durationOptionsFor` | Default |
|---|---|---|---|
| Haircut | 55 | 60, 75, 80, 90, 120 | 60 |
| Haircut + beard | 80 | 80, 90, 120, 150 | 80 |
| Kids | 50 | 50, 60, 75, 80, 90, 120 | 50 |

Worst-case over-booking: 25 min (beard or kids with all four). Plain
haircut books 60 instead of 55 from the day he enables this.

`formatDuration` in `services.js` gains an hours-only form so 60 and 120
render as "1h" / "2h", not "1h 0m" (new key `services.hoursOnly`).
`formatPrice` accepts any `{ priceFrom, plus }` so the total reuses it.

## 6. Wizard flow (`src/wizard.js`)

Steps are keyed, not numbered, and depend on the chosen service:

```
stepsFor(serviceId):
  service has add-ons AND ADDONS_LIVE  →  ['service', 'addons', 'cal']
  otherwise                            →  ['service', 'cal']
  (no service chosen yet: the three-step list when ADDONS_LIVE, else two)
```

State: `{ step, serviceId, addons: Set }`. Choosing a different service
clears `addons`. Continue/Back move along `stepsFor(state.serviceId)`.

- **Service-card "Book" buttons and the `?service=` deep link** land on the
  step *after* `service`: add-ons where the service has them, otherwise Cal,
  exactly as today.
- **Language switch** re-renders the current step without touching state;
  on `cal` it remounts the embed with the same duration and notes.
- The step indicator renders `1. Service · 2. Add-ons · 3. Date & time` (or
  two entries) from the same list; keys `book.step.service`,
  `book.step.addons`, `book.step.cal` replace `book.step1/2`.

### The add-ons step

- Heading "Add-ons (optional)" and a one-line hint that each adds a little
  time.
- One row per add-on the service offers: a real `<input type="checkbox">`
  inside a `<label>` (keyboard and screen-reader behaviour for free), the
  name, the description where there is one, "+N min", and the price.
- A running total under the list: `{service name} · {price}{+} · {booked}`
  — e.g. "Haircut, no beard · $80+ · 1h 15m". Updates on every toggle.
- Back → service. Continue → cal. Continue is never disabled; nothing ticked
  is a valid choice.

### The Cal step

When the add-ons step was in play (service has add-ons and `ADDONS_LIVE`),
the header line shows the same total as the add-ons step — so a haircut
with nothing added says 1h, matching Cal's 60 — and below it the add-ons
chosen, if any, as a short list. Otherwise the header shows `durationMin`
exactly as today (55 min), because Cal is still booking 55.

The services grid on the page is untouched: cards keep the true
`durationMin` and from-price. Only the wizard talks in booked lengths.

## 7. Cal hand-off (`src/cal-embed.js`)

`mountCal(container, serviceId, { duration, notes })` and
`calUrlFor(serviceId, { duration, notes })`:

- `duration` is passed only for services with add-ons when `ADDONS_LIVE` —
  always then, even with none chosen (the rounded base equals Cal's default
  anyway). Services without add-ons get no `duration` param: unchanged.
- `notes` is passed only when at least one add-on is chosen.
- The fallback link carries the same query string.
- `hideEventTypeDetails` stays `false` (§3.7). Namespacing stays per service;
  re-mounting the same namespace with different params is the path the
  language switch already exercises.

## 8. What Alejandro does (once per haircut service)

Written up as `docs/cal-multiple-durations.md` with a Spanish twin
`docs/cal-multiple-durations.es.md`, in the style of the phone-number doc:
why, the clicks, a tick-list of the three services, one thing not to touch,
how we verify. The clicks, per service, in the event's **Setup** tab:

1. Under **Duration**, turn on **Allow multiple durations**.
2. Tick exactly the options in §5's table for that service.
3. Set **Default duration** to that service's default.
4. Tick **Hide duration selector in booking page**.
5. Save.

Do not touch Advanced → Booking questions (the phone field lives there and
is finally right).

Side effect he should know about: Kids goes from 55 to 50 on Cal, matching
the site and Booksy; Haircut goes from 55 to 60.

## 9. Verification (`scripts/check-cal-fields.mjs`, `npm run check:cal`)

The existing script keeps its phone section for all six services and gains
a **durations** section for the three add-on services, read off the same
live pages (the metadata is in the same Next.js payload the phone check
already parses):

| Assertion | Against |
|---|---|
| `length` | `defaultDurationFor(service)` |
| `metadata.multipleDuration` as a set | `durationOptionsFor(service)` |
| `metadata.hideDurationSelectorInBookingPage` | `true` |

Expectations come from `src/addons.js`, never typed into the script. Exit 1
if any phone or duration line fails. Until Alejandro has done §8 the run
fails, which is the truthful state and the reason `ADDONS_LIVE` stays false.

## 10. Trilingual copy

New keys, all three dictionaries (the existing i18n tests enforce parity and
non-emptiness):

| Key | EN | ES | ZH |
|---|---|---|---|
| `book.step.service` | Service | Servicio | 服务 |
| `book.step.addons` | Add-ons | Complementos | 附加服务 |
| `book.step.cal` | Date & time | Fecha y hora | 日期与时间 |
| `book.pickAddons` | Add-ons (optional) | Complementos (opcional) | 附加服务（可选） |
| `book.addonsHint` | Each one adds a little time to your appointment. | Cada uno añade un poco de tiempo a tu cita. | 每项都会略微延长预约时间。 |
| `book.addonPlus` | +{n} min | +{n} min | +{n}分钟 |
| `book.total` | Your appointment | Tu cita | 您的预约 |
| `addon.design.name` | Hair design | Diseño | 发型图案 |
| `addon.eyebrows.name` | Eyebrows | Cejas | 修眉 |
| `addon.wash.name` | Hair wash | Lavado de cabello | 洗发 |
| `addon.facial.name` | Facial | Facial | 面部护理 |
| `addon.facial.desc` | Steam, hot towel, exfoliation, hydration mask | Vapor, toalla caliente, exfoliación, mascarilla de hidratación | 蒸汽、热毛巾、去角质、保湿面膜 |
| `services.hoursOnly` | {h}h | {h}h | {h}小时 |

Removed: `book.step1`, `book.step2`. Chinese add-on names are my
translations, not Alejandro's; he has no Chinese copy on Booksy to verify
against.

## 11. Testing

`node --test` only, as today. No DOM tests.

- `test/config.test.js`: pin `ADDONS` (id, price, min), which services carry
  add-ons, `CAL_DURATION_MENU`, and that `ADDONS_LIVE` is a boolean.
- `test/addons.test.js` (new): `calDurationFor` round-up cases and the
  over-480 throw; `durationOptionsFor` and `defaultDurationFor` pinned to
  §5's table; `totalsFor` for none / one / all; `notesFor` string and
  `null`.
- `test/i18n-runtime.test.js`: `formatDuration(60)` → "1h", `(75)` →
  "1h 15m", `(50)` → "50 min".
- Existing i18n parity/usage tests cover the new keys automatically.

Manual, in the browser, before flipping `ADDONS_LIVE` — listed in the plan:
haircut → tick design → Continue shows 75 min inside Cal; Back → untick →
60; language switch on the add-ons step keeps the ticks; platinum skips the
step; `?service=kids` lands on add-ons; the fallback link opens with the
params. Then one real booking with an add-on, checked on his calendar and
deleted — the end-to-end test that has been open since August.

## 12. Out of scope

Add-ons on platinum, colour or VIP; quantities; images per add-on; the
API-key route; a hidden custom booking question instead of notes; any change
to `privacy.html` (add-on choices are not personal data and are not stored).

## 13. Risks

- **Cal changes its menu.** Pinned constant with a source pointer; the check
  script reads live state, so a mismatch is visible before it bites.
- **Embed re-mount ignores new params.** The language switch already
  re-mounts the same namespace; verified manually in §11 before launch.
- **He saves the dashboard with a wrong tick.** The check script names the
  service and the exact mismatch, as it did for the phone field.
- **The client deletes the prefilled note.** The booked length is still
  right; Alejandro just has to ask what they wanted. Acceptable for v1.
