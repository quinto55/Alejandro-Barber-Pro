# Alejandro Barber Pro Website — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a trilingual, dark-luxe static site for Alejandro Barber Pro on GitHub Pages, with a working four-step booking wizard running against a mock backend and a tested availability engine, plus an undeployed Cloudflare Worker ready to connect his Google Calendar.

**Architecture:** Vanilla ES modules, no framework, no build step. Pure logic (`tz.js`, `slots.js`) is unit-tested with `node --test` and zero dependencies; the same modules run unmodified in the browser. `booking-api.js` is the single seam between mock and live — flipping `USE_MOCK` in `config.js` is the only change needed once the Worker is deployed.

**Tech Stack:** HTML5, CSS (custom properties, grid, `mask-image`), ES2022 modules, `node --test` (Node v20.20.0, verified present), Python 3.12 + Pillow 12.2 for one-time asset processing, Cloudflare Workers (written, not deployed).

## Global Constraints

- **Spec is authoritative:** `docs/superpowers/specs/2026-08-01-alejandro-barber-pro-design.md`. No business fact may be invented. Anything not in the spec's "Verified business facts" table must not appear in site copy.
- **Prices keep the `+`.** Booksy lists `$60.00+`. Rendering `$60` is a factual error. Only `vip` ($150) is a fixed price.
- **`vip` is never self-bookable.** It must not appear in the booking wizard's service list. Its card links to Instagram DM.
- **Hours** (minutes since local midnight): Sun closed · Mon/Tue 540–1210 · Wed–Sat 540–1225. The 20:10 / 20:25 split is real.
- **Timezone is `America/New_York`** for all appointment arithmetic. Never use the browser's local zone.
- **No runtime dependencies.** No npm packages ship to the browser. Dev dependencies: none — `node --test` is built in.
- **No hotlinking.** All images served from `assets/`, never from the Booksy CDN.
- **Booking lead time 120 min, step 15 min, horizon 60 days, no inter-appointment buffer.**
- **Every user-visible string is an i18n key.** No hardcoded English in markup.
- **Chinese strings ship marked `"__REVIEW__"`-suffixed in a `_meta.needsNativeReview` list** — never presented as final.
- Commit after every task. Conventional commit messages.

## Design tokens (used from Task 7 onward)

```
--ink:        #0b0b0c    page ground
--ink-2:      #131316    raised surface
--ink-3:      #1c1c21    hairline / input ground
--gold:       #c8a45c    primary accent, pulled from the crown
--gold-soft:  #e0c690    hover / focus
--bone:       #f2efe9    primary text
--bone-dim:   #a7a29a    secondary text
--danger:     #d9534f    validation
--font-display: 'Cormorant Garamond', 'Playfair Display', Georgia, serif
--font-ui:      'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif
```

Display serif echoes the serif `ABp` in his mark. Fonts self-hosted in `assets/fonts/` — no Google Fonts CDN call, which keeps the site working offline and avoids a third-party request on every load.

## File structure

| Path | Responsibility |
|---|---|
| `index.html` | Single page, all sections, `data-i18n` keys only |
| `styles.css` | Tokens, layout primitives, all component styling |
| `src/config.js` | Business facts, hours, services, booking constants, `USE_MOCK` |
| `src/tz.js` | `America/New_York` wall-clock ↔ UTC helpers |
| `src/slots.js` | Pure availability engine |
| `src/booking-api.js` | Mock/live seam — `getAvailability`, `book` |
| `src/mock-busy.js` | Deterministic seeded busy blocks for the mock |
| `src/i18n.js` | Dictionary loading, DOM application, persistence |
| `src/portfolio.js` | Grid, load-more, lightbox |
| `src/wizard.js` | Four-step booking wizard |
| `src/app.js` | Entry point, wires modules, nav behaviour |
| `i18n/{en,es,zh}.js` | Translation dictionaries |
| `test/*.test.js` | `node --test` suites |
| `worker/src/worker.js` | Cloudflare Worker (not deployed) |
| `worker/README.md` | Deploy checklist |
| `scripts/fetch-assets.sh` | One-time download of 32 photos + logo |
| `scripts/make-logo.py` | One-time logo → alpha mask |

---

## Task 1: Repo scaffold and asset pipeline

**Files:**
- Create: `package.json`, `.nojekyll`, `.gitignore` (exists — extend), `scripts/fetch-assets.sh`, `scripts/ids.txt`
- Create (generated): `assets/portfolio/cut-01.jpg` … `cut-32.jpg`, `assets/logo-src.jpg`

**Interfaces:**
- Consumes: nothing
- Produces: `assets/portfolio/cut-NN.jpg` (NN = 01–32, zero-padded), `assets/logo-src.jpg`

**Context:** All 32 URLs were verified to return HTTP 200 on 2026-08-01. `.nojekyll` is required or GitHub Pages will refuse to serve paths beginning with an underscore and may mangle the asset directory.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "alejandro-barber-pro",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/",
    "serve": "python3 -m http.server 8080"
  }
}
```

`"type": "module"` makes `.js` files ESM in Node, so the same source runs in the browser and under `node --test` with no transpilation.

- [ ] **Step 2: Create `.nojekyll` (empty) and extend `.gitignore`**

```bash
touch .nojekyll
printf 'node_modules/\n.DS_Store\nassets/logo-src.jpg\n' > .gitignore
```

`logo-src.jpg` is ignored because it is an intermediate — only the generated mask is committed.

- [ ] **Step 3: Create `scripts/ids.txt` with the 32 verified photo IDs**

```
ab79e28619c3482eacbb32d4d343490d
fbd2a1023b0d434ea921e0ff77b0b406
4901eb7d75a340e18467ff5395a61cf3
f43bcb0ac1884598b3e3e40aa0ef2190
e29717177ece48ef887fe8635a98300e
00aa3f1aceeb4c5f958edbcfe2ac6790
bda13bf926c14d4db8e7671ca384cb24
347c16ff18524a0b9149a4be28ac78eb
c116510b0d7e4cc280f58fcfe0f939b5
a770206acea84c879633b3a3e0ed50a3
aa67d3f8f7004f5798a988098899856b
181d71ee1fcd4c008b12f4134fefaa0a
ae034afffc164f40be1a37bd2f26b156
6efb3d5401f9444ab6025b6ef44d5d2f
bf3a2f51793f4d529a9b51cf508703aa
6ab4f795a5554a5d964512fcfad47048
06c4efdf04ee4eb2b3d527e8b6ee62b1
450611239f6e4e5eb13f32353cf7ade6
1976d49550ed489e98bec17b23b60fa6
a7421481539c4a72beb6424f4e3b1b1c
98a9c3d37dee474ca9ff461a6255bf8b
2c754b4b501f4deab27a4d8061b07fd6
706ea72b6d35495da7b9a380e12f5a79
39ffc914e4254309b6b5839ec3ef4321
e2f9ce3c42b741f2bca1869335259558
4aeda39d4de84fd8930f0ff2f3fb6b6c
acd299c448aa443db017a184d1d516e1
118e3c8b1ebb4a50871f21c2c1f96456
065f87d27e4041a28058fa3b31801ae5
706afe825fd54a9c98c239a34eb1c07e
48b71f2d9ee3474089e9c5cf23129c1a
436c3583126a40fda01acf407971c19f
```

- [ ] **Step 4: Write `scripts/fetch-assets.sh`**

```bash
#!/usr/bin/env bash
# One-time download of Alejandro's own photos from his Booksy profile.
# Re-runnable: skips files already present.
set -euo pipefail
cd "$(dirname "$0")/.."

CDN="https://d2zdpiztbgorvt.cloudfront.net/region1/us/1114924"
LOGO="$CDN/logo/1cb19e2a7c0044eaaae241228b07f1-a-l-e-j-a-n-d-r-o-b-a-r-b-e-r--logo-3b13416b3ee94685a7788248111b05-booksy.jpeg"

mkdir -p assets/portfolio

[ -f assets/logo-src.jpg ] || curl -fsS -o assets/logo-src.jpg "$LOGO"

n=0
while read -r id; do
  [ -z "$id" ] && continue
  n=$((n+1))
  out=$(printf 'assets/portfolio/cut-%02d.jpg' "$n")
  [ -f "$out" ] && continue
  curl -fsS -o "$out" "$CDN/service_photos/$id.jpeg"
done < scripts/ids.txt

echo "logo: $([ -f assets/logo-src.jpg ] && echo ok || echo MISSING)"
echo "photos: $(ls assets/portfolio/*.jpg 2>/dev/null | wc -l)/32"
```

`curl -f` makes a 404 a hard failure rather than writing an HTML error page into a `.jpg`.

- [ ] **Step 5: Run it and verify every file is a real JPEG**

```bash
chmod +x scripts/fetch-assets.sh && ./scripts/fetch-assets.sh
ls assets/portfolio/*.jpg | wc -l                    # expect 32
file assets/portfolio/*.jpg | grep -cv 'JPEG image'  # expect 0
```

Expected: `32`, then `0`. A non-zero second number means a download returned non-image content — do not proceed.

- [ ] **Step 6: Commit**

```bash
git add package.json .nojekyll .gitignore scripts/ assets/portfolio/
git commit -m "chore: scaffold repo and fetch portfolio assets"
```

---

## Task 2: Logo alpha mask

**Files:**
- Create: `scripts/make-logo.py`
- Create (generated, committed): `assets/logo-mask.png`, `assets/crown-mask.png`, `assets/favicon.png`

**Interfaces:**
- Consumes: `assets/logo-src.jpg` from Task 1
- Produces: `assets/logo-mask.png` (full ABP lockup), `assets/crown-mask.png` (crown only), `assets/favicon.png` (gold on transparent, 180×180)

**Context — a deliberate change from the spec.** The spec said "hand-traced to SVG." During planning the source was examined: the mark is a serif `ABp` wordmark plus a hand-drawn crown, on a soft gray gradient. Hand-tracing a serif face without the original font would lose fidelity. Instead the black ink is converted to an **alpha mask PNG** and coloured at render time with CSS `mask-image` + `background`. This preserves his exact mark, recolours to gold or bone from one file, and is crisp far beyond the ~200px it ever displays at. The threshold values below were validated against the real file during planning and produce clean edges.

- [ ] **Step 1: Write `scripts/make-logo.py`**

```python
#!/usr/bin/env python3
"""Convert the ABP logo JPEG into a recolourable alpha mask.

The source is black ink on a soft gray gradient. A soft threshold ramp
between LO and HI turns ink into opaque alpha and paper into transparent,
keeping antialiased edges instead of producing a jagged 1-bit cutout.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LO, HI = 110, 175  # <=LO fully opaque ink, >=HI fully transparent paper

src = Image.open(ROOT / "assets/logo-src.jpg").convert("L")
alpha = src.point(lambda v: 255 if v <= LO else (0 if v >= HI else int(255 * (HI - v) / (HI - LO))))

mask = Image.new("LA", src.size)
mask.putdata([(255, a) for a in alpha.get_flattened_data()])
mask = mask.crop(alpha.getbbox())
mask.save(ROOT / "assets/logo-mask.png")

# Crown only: the mark's top ~30%, for nav and favicon.
w, h = mask.size
crown = mask.crop((0, 0, w, int(h * 0.30)))
crown = crown.crop(crown.split()[-1].getbbox())
crown.save(ROOT / "assets/crown-mask.png")

# Favicon: crown in gold on transparent, square, padded.
GOLD = (200, 164, 92)
side = max(crown.size)
fav = Image.new("RGBA", (side, side), (0, 0, 0, 0))
tint = Image.new("RGBA", crown.size, GOLD + (255,))
fav.paste(tint, ((side - crown.size[0]) // 2, (side - crown.size[1]) // 2), crown.split()[-1])
fav.resize((180, 180), Image.LANCZOS).save(ROOT / "assets/favicon.png")

print("logo-mask", mask.size, "crown-mask", crown.size, "favicon 180x180")
```

- [ ] **Step 2: Run it**

```bash
python3 scripts/make-logo.py
```

Expected output resembling: `logo-mask (639, 650) crown-mask (...) favicon 180x180`. The logo-mask bbox must be substantially smaller than the 1023×1023 source — a bbox near the full source means the threshold failed to strip the background and the values need adjusting.

- [ ] **Step 3: Verify visually**

Create a throwaway `/tmp/logo-check.html`, open it in a browser, confirm the mark renders gold on black with clean edges and no gray halo:

```html
<body style="background:#0b0b0c;padding:40px">
  <div style="width:260px;height:260px;background:#c8a45c;
              -webkit-mask:url(logo-mask.png) center/contain no-repeat;
              mask:url(logo-mask.png) center/contain no-repeat"></div>
</body>
```

- [ ] **Step 4: Commit**

```bash
git add scripts/make-logo.py assets/logo-mask.png assets/crown-mask.png assets/favicon.png
git commit -m "feat: generate recolourable ABP logo alpha mask"
```

---

## Task 3: Business configuration

**Files:**
- Create: `src/config.js`
- Test: `test/config.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `BUSINESS` — `{ name, addressLines: string[], mapQuery, instagram, facebook, tiktok, rating, reviewCount, timezone }`
  - `HOURS` — `Record<0..6, {open:number, close:number} | null>`, minutes since local midnight
  - `SERVICES` — `Array<{ id, priceFrom:number, plus:boolean, durationMin:number, selfBookable:boolean }>`
  - `BOOKING` — `{ stepMin:15, leadTimeMin:120, horizonDays:60 }`
  - `REVIEWS` — `Array<{ name:string, textKey:string }>`
  - `USE_MOCK: boolean`, `API_BASE: string`

- [ ] **Step 1: Write the failing test**

```js
// test/config.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOURS, SERVICES, BOOKING, BUSINESS } from '../src/config.js';

test('hours match the verified Booksy schedule', () => {
  assert.equal(HOURS[0], null, 'Sunday is closed');
  for (const d of [1, 2]) assert.deepEqual(HOURS[d], { open: 540, close: 1210 });
  for (const d of [3, 4, 5, 6]) assert.deepEqual(HOURS[d], { open: 540, close: 1225 });
});

test('services match verified prices and durations', () => {
  const byId = Object.fromEntries(SERVICES.map(s => [s.id, s]));
  assert.equal(SERVICES.length, 6);
  assert.deepEqual(
    SERVICES.map(s => [s.id, s.priceFrom, s.durationMin]),
    [
      ['haircut', 60, 55],
      ['haircut-beard', 85, 80],
      ['kids', 60, 50],
      ['platinum', 275, 175],
      ['color', 355, 200],
      ['vip', 150, 65],
    ],
  );
  assert.equal(byId.vip.plus, false, 'VIP is a fixed $150, not a from-price');
  assert.equal(byId.haircut.plus, true, 'all other prices are from-prices');
});

test('VIP is not self-bookable', () => {
  const vip = SERVICES.find(s => s.id === 'vip');
  assert.equal(vip.selfBookable, false);
  assert.equal(SERVICES.filter(s => s.selfBookable).length, 5);
});

test('booking constants match the spec', () => {
  assert.deepEqual(BOOKING, { stepMin: 15, leadTimeMin: 120, horizonDays: 60 });
  assert.equal(BUSINESS.timezone, 'America/New_York');
  assert.equal(BUSINESS.reviewCount, 147);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/config.test.js`
Expected: FAIL — `Cannot find module '../src/config.js'`

- [ ] **Step 3: Write `src/config.js`**

```js
// Verified against his live Booksy profile on 2026-08-01.
// See docs/superpowers/specs/2026-08-01-alejandro-barber-pro-design.md
// Do not change any value here without re-verifying against source.

export const BUSINESS = {
  name: 'Alejandro Barber Pro',
  addressLines: [
    '30-30 Northern Blvd',
    'Phoenix Salon Suites, 1st Floor, Suite #158',
    'Long Island City, NY 11101',
  ],
  mapQuery: '30-30 Northern Blvd, Long Island City, NY 11101',
  instagram: 'https://www.instagram.com/alejandrobarberpro/',
  facebook: 'https://www.facebook.com/alejandrobarberpro/',
  tiktok: 'https://www.tiktok.com/@alejandrobarberpro',
  rating: 5.0,
  reviewCount: 147,
  timezone: 'America/New_York',
};

// Minutes since local midnight. null = closed. Index 0 = Sunday.
// 20:10 Mon/Tue and 20:25 Wed/Sat are his real posted closing times.
export const HOURS = {
  0: null,
  1: { open: 540, close: 1210 },
  2: { open: 540, close: 1210 },
  3: { open: 540, close: 1225 },
  4: { open: 540, close: 1225 },
  5: { open: 540, close: 1225 },
  6: { open: 540, close: 1225 },
};

// Display names and descriptions live in i18n/, not here.
// `plus` renders the trailing "+" on from-prices.
export const SERVICES = [
  { id: 'haircut',       priceFrom: 60,  plus: true,  durationMin: 55,  selfBookable: true },
  { id: 'haircut-beard', priceFrom: 85,  plus: true,  durationMin: 80,  selfBookable: true },
  { id: 'kids',          priceFrom: 60,  plus: true,  durationMin: 50,  selfBookable: true },
  { id: 'platinum',      priceFrom: 275, plus: true,  durationMin: 175, selfBookable: true },
  { id: 'color',         priceFrom: 355, plus: true,  durationMin: 200, selfBookable: true },
  // Sundays need his approval first — the site must never auto-confirm one.
  { id: 'vip',           priceFrom: 150, plus: false, durationMin: 65,  selfBookable: false },
];

export const BOOKING = { stepMin: 15, leadTimeMin: 120, horizonDays: 60 };

// Real review text, verbatim, first names only. Text lives in i18n
// (untranslated — a client's own words are not rewritten per language).
export const REVIEWS = [
  { name: 'Julio',    textKey: 'reviews.julio' },
  { name: 'erick',    textKey: 'reviews.erick' },
  { name: 'Leonardo', textKey: 'reviews.leonardo' },
  { name: 'Anthony',  textKey: 'reviews.anthony' },
  { name: 'Alex',     textKey: 'reviews.alex' },
  { name: 'Khan',     textKey: 'reviews.khan' },
];

export const PORTFOLIO_COUNT = 32;
export const PORTFOLIO_INITIAL = 12;

// Flip to false once the Worker in worker/ is deployed. Nothing else changes.
export const USE_MOCK = true;
export const API_BASE = 'https://abp-booking.example.workers.dev';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/config.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config.js test/config.test.js
git commit -m "feat: add verified business configuration"
```

---

## Task 4: New York timezone helpers

**Files:**
- Create: `src/tz.js`
- Test: `test/tz.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `weekdayOf(dateStr: 'YYYY-MM-DD') → 0..6`
  - `addDays(dateStr, n) → 'YYYY-MM-DD'`
  - `nyParts(instant: Date) → { date: 'YYYY-MM-DD', minutes: number }`
  - `nyWallToUtc(dateStr, minutes) → Date`
  - `toWallInterval({start, end}: {start:string, end:string}, dateStr) → {start:number, end:number} | null`

**Context:** Appointments are wall-clock facts ("Tuesday 2pm"), but Google returns busy blocks as UTC instants. Every conversion happens here so no other module ever touches a timezone. `Intl.DateTimeFormat` with `timeZone` is used rather than a library — it is built into both Node 20 and every target browser, and carries the current IANA rules.

- [ ] **Step 1: Write the failing test**

```js
// test/tz.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekdayOf, addDays, nyParts, nyWallToUtc, toWallInterval } from '../src/tz.js';

test('weekdayOf does not drift with the host timezone', () => {
  assert.equal(weekdayOf('2026-08-01'), 6); // Saturday
  assert.equal(weekdayOf('2026-08-02'), 0); // Sunday
  assert.equal(weekdayOf('2026-08-03'), 1); // Monday
});

test('addDays crosses months and years', () => {
  assert.equal(addDays('2026-08-01', 1), '2026-08-02');
  assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-08-01', 60), '2026-09-30');
});

test('nyParts converts a UTC instant to NY wall clock', () => {
  // 2026-08-01T18:00Z is 14:00 EDT (UTC-4)
  assert.deepEqual(nyParts(new Date('2026-08-01T18:00:00Z')), {
    date: '2026-08-01', minutes: 14 * 60,
  });
  // 2026-01-15T18:00Z is 13:00 EST (UTC-5)
  assert.deepEqual(nyParts(new Date('2026-01-15T18:00:00Z')), {
    date: '2026-01-15', minutes: 13 * 60,
  });
});

test('nyWallToUtc round-trips through both DST offsets', () => {
  assert.equal(nyWallToUtc('2026-08-01', 14 * 60).toISOString(), '2026-08-01T18:00:00.000Z');
  assert.equal(nyWallToUtc('2026-01-15', 13 * 60).toISOString(), '2026-01-15T18:00:00.000Z');
  for (const d of ['2026-03-08', '2026-11-01', '2026-06-15']) {
    const back = nyParts(nyWallToUtc(d, 10 * 60));
    assert.deepEqual(back, { date: d, minutes: 600 }, `round trip failed for ${d}`);
  }
});

test('toWallInterval maps a UTC busy block onto a NY day', () => {
  const busy = { start: '2026-08-01T14:00:00Z', end: '2026-08-01T15:00:00Z' }; // 10:00-11:00 EDT
  assert.deepEqual(toWallInterval(busy, '2026-08-01'), { start: 600, end: 660 });
});

test('toWallInterval clamps blocks that overhang the day and drops non-overlapping ones', () => {
  const overnight = { start: '2026-07-31T20:00:00Z', end: '2026-08-01T15:00:00Z' };
  assert.deepEqual(toWallInterval(overnight, '2026-08-01'), { start: 0, end: 660 });
  const other = { start: '2026-08-05T14:00:00Z', end: '2026-08-05T15:00:00Z' };
  assert.equal(toWallInterval(other, '2026-08-01'), null);
});

test('spring-forward day maps busy blocks by wall clock, not elapsed time', () => {
  // 2026-03-08: clocks jump 02:00 -> 03:00 EST->EDT.
  // 12:00Z is 08:00 EDT that morning.
  const busy = { start: '2026-03-08T12:00:00Z', end: '2026-03-08T13:00:00Z' };
  assert.deepEqual(toWallInterval(busy, '2026-03-08'), { start: 480, end: 540 });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/tz.test.js`
Expected: FAIL — `Cannot find module '../src/tz.js'`

- [ ] **Step 3: Write `src/tz.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/tz.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Run the whole suite in a non-NY timezone to prove independence**

```bash
TZ=Asia/Tokyo node --test test/tz.test.js
TZ=UTC        node --test test/tz.test.js
```

Expected: PASS both. A failure here means host-timezone leakage — the exact bug that would make bookings land on the wrong day for a client browsing from another zone.

- [ ] **Step 6: Commit**

```bash
git add src/tz.js test/tz.test.js
git commit -m "feat: add America/New_York wall-clock helpers"
```

---

## Task 5: Availability engine

**Files:**
- Create: `src/slots.js`
- Test: `test/slots.test.js`

**Interfaces:**
- Consumes: `weekdayOf`, `nyParts` from `src/tz.js`; `HOURS`, `SERVICES`, `BOOKING` from `src/config.js`
- Produces:
  - `formatMinutes(m:number) → 'HH:MM'`
  - `slotsFor({ hours, durationMin, busy, earliestMin, stepMin }) → string[]`
  - `availableSlots({ dateStr, serviceId, busy, now }) → string[]`

- [ ] **Step 1: Write the failing test**

```js
// test/slots.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMinutes, slotsFor, availableSlots } from '../src/slots.js';

const WED = { open: 540, close: 1225 }; // 09:00 - 20:25

test('formatMinutes zero-pads', () => {
  assert.equal(formatMinutes(540), '09:00');
  assert.equal(formatMinutes(1225), '20:25');
  assert.equal(formatMinutes(0), '00:00');
});

test('a closed day yields no slots', () => {
  assert.deepEqual(slotsFor({ hours: null, durationMin: 55 }), []);
});

test('the last slot leaves room for the full service', () => {
  const s = slotsFor({ hours: WED, durationMin: 55 });
  assert.equal(s[0], '09:00');
  // 20:25 close - 55min = 19:30 latest start
  assert.equal(s.at(-1), '19:30');
});

test('a long service ends earlier in the day', () => {
  // 3h20 colour: 20:25 - 200min = 17:05, stepped down to 17:00
  const s = slotsFor({ hours: WED, durationMin: 200 });
  assert.equal(s.at(-1), '17:00');
});

test('a service that cannot fit at all yields no slots', () => {
  assert.deepEqual(slotsFor({ hours: { open: 540, close: 560 }, durationMin: 55 }), []);
});

test('slots step by 15 minutes', () => {
  const s = slotsFor({ hours: WED, durationMin: 55 });
  assert.deepEqual(s.slice(0, 4), ['09:00', '09:15', '09:30', '09:45']);
});

test('a busy block removes every overlapping start, not just its own', () => {
  // Busy 10:00-11:00. A 55-min cut starting 09:15 runs to 10:10 and clashes.
  const s = slotsFor({ hours: WED, durationMin: 55, busy: [{ start: 600, end: 660 }] });
  assert.ok(!s.includes('10:00'), 'start inside the block');
  assert.ok(!s.includes('09:15'), 'earlier start that runs into the block');
  assert.ok(!s.includes('09:30'), 'earlier start that runs into the block');
  assert.ok(s.includes('09:00'), '09:00 + 55min = 09:55, ends before the block');
  assert.ok(s.includes('11:00'), 'starts exactly when the block ends');
});

test('touching intervals do not count as a clash', () => {
  const s = slotsFor({ hours: WED, durationMin: 60, busy: [{ start: 600, end: 660 }] });
  assert.ok(s.includes('09:00'), '09:00-10:00 abuts the block, no overlap');
  assert.ok(s.includes('11:00'), '11:00 starts at the block end');
});

test('earliestMin drops slots that are too soon', () => {
  const s = slotsFor({ hours: WED, durationMin: 55, earliestMin: 720 });
  assert.equal(s[0], '12:00');
});

test('availableSlots: Sunday is closed', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-08-02', serviceId: 'haircut', busy: [], now: new Date('2026-07-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: VIP is never self-bookable', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-08-05', serviceId: 'vip', busy: [], now: new Date('2026-07-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: an unknown service yields no slots', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-08-05', serviceId: 'nope', busy: [], now: new Date('2026-07-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: past dates yield no slots', () => {
  assert.deepEqual(
    availableSlots({ dateStr: '2026-07-01', serviceId: 'haircut', busy: [], now: new Date('2026-08-01T12:00:00Z') }),
    [],
  );
});

test('availableSlots: the 120-minute lead time applies today only', () => {
  // 2026-08-05 is a Wednesday. 14:00Z = 10:00 EDT.
  const now = new Date('2026-08-05T14:00:00Z');
  const today = availableSlots({ dateStr: '2026-08-05', serviceId: 'haircut', busy: [], now });
  assert.equal(today[0], '12:00', '10:00 + 120min lead');
  const tomorrow = availableSlots({ dateStr: '2026-08-06', serviceId: 'haircut', busy: [], now });
  assert.equal(tomorrow[0], '09:00', 'a future day opens normally');
});

test('availableSlots: Monday closes at 20:10, Wednesday at 20:25', () => {
  const now = new Date('2026-07-01T12:00:00Z');
  const mon = availableSlots({ dateStr: '2026-08-03', serviceId: 'haircut', busy: [], now });
  const wed = availableSlots({ dateStr: '2026-08-05', serviceId: 'haircut', busy: [], now });
  assert.equal(mon.at(-1), '19:15', '20:10 - 55min = 19:15');
  assert.equal(wed.at(-1), '19:30', '20:25 - 55min = 19:30');
});

test('availableSlots: UTC busy blocks are honoured', () => {
  const now = new Date('2026-07-01T12:00:00Z');
  const busy = [{ start: '2026-08-05T14:00:00Z', end: '2026-08-05T15:00:00Z' }]; // 10:00-11:00 EDT
  const s = availableSlots({ dateStr: '2026-08-05', serviceId: 'haircut', busy, now });
  assert.ok(!s.includes('10:00'));
  assert.ok(s.includes('11:00'));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/slots.test.js`
Expected: FAIL — `Cannot find module '../src/slots.js'`

- [ ] **Step 3: Write `src/slots.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/slots.test.js`
Expected: PASS, 16 tests.

- [ ] **Step 5: Run the full suite across timezones**

```bash
npm test && TZ=Asia/Tokyo npm test && TZ=Pacific/Auckland npm test
```

Expected: PASS in all three.

- [ ] **Step 6: Commit**

```bash
git add src/slots.js test/slots.test.js
git commit -m "feat: add tested availability engine"
```

---

## Task 6: Translation dictionaries

**Files:**
- Create: `i18n/en.js`, `i18n/es.js`, `i18n/zh.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: three default-exported flat objects with identical key sets, plus `zh.js` exporting `needsNativeReview: string[]`

**Context:** Flat dot-notation keys, one level of lookup, no interpolation library. Runtime substitution uses `{name}` placeholders replaced by `src/i18n.js` in Task 8. Review text is **not translated** — a client's own words stay verbatim in every language.

- [ ] **Step 1: Write the failing parity test**

```js
// test/i18n.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../i18n/en.js';
import es from '../i18n/es.js';
import zh from '../i18n/zh.js';

const dicts = { en, es, zh };

test('every dictionary has an identical key set', () => {
  const base = Object.keys(en).sort();
  for (const [lang, d] of Object.entries(dicts)) {
    const keys = Object.keys(d).filter(k => k !== '_meta').sort();
    const missing = base.filter(k => !keys.includes(k));
    const extra = keys.filter(k => !base.includes(k));
    assert.deepEqual(missing, [], `${lang} is missing keys`);
    assert.deepEqual(extra, [], `${lang} has keys English does not`);
  }
});

test('no value is empty', () => {
  for (const [lang, d] of Object.entries(dicts)) {
    for (const [k, v] of Object.entries(d)) {
      if (k === '_meta') continue;
      assert.ok(typeof v === 'string' && v.trim().length > 0, `${lang}.${k} is empty`);
    }
  }
});

test('review text is verbatim and identical across languages', () => {
  const reviewKeys = Object.keys(en).filter(k => k.startsWith('reviews.'));
  assert.ok(reviewKeys.length >= 6);
  for (const k of reviewKeys) {
    assert.equal(es[k], en[k], `${k} must not be translated`);
    assert.equal(zh[k], en[k], `${k} must not be translated`);
  }
});

test('placeholders survive translation', () => {
  for (const [lang, d] of Object.entries(dicts)) {
    for (const k of Object.keys(en)) {
      const want = (en[k].match(/\{\w+\}/g) || []).sort();
      const got = (d[k].match(/\{\w+\}/g) || []).sort();
      assert.deepEqual(got, want, `${lang}.${k} placeholder mismatch`);
    }
  }
});

test('Chinese declares which strings still need native review', () => {
  assert.ok(Array.isArray(zh._meta?.needsNativeReview));
  assert.ok(zh._meta.needsNativeReview.length > 0,
    'shipping zh as final without review would misrepresent it');
  for (const k of zh._meta.needsNativeReview) {
    assert.ok(k in en, `${k} in needsNativeReview is not a real key`);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/i18n.test.js`
Expected: FAIL — `Cannot find module '../i18n/en.js'`

- [ ] **Step 3: Write `i18n/en.js`**

```js
export default {
  'meta.title': 'Alejandro Barber Pro — NYC Taper Fade Specialist',
  'meta.description': 'Precision fades, beard work and colour in Long Island City. 5.0 stars from 147 clients. Book online.',

  'nav.services': 'Services',
  'nav.work': 'Work',
  'nav.about': 'About',
  'nav.reviews': 'Reviews',
  'nav.visit': 'Visit',
  'nav.book': 'Book',

  'hero.eyebrow': 'Long Island City, NY',
  'hero.title': 'NYC Taper Fade Specialist',
  'hero.sub': 'Precision fades, sharp beard work and colour — by appointment.',
  'hero.rating': '{rating} from {count} clients',
  'hero.cta': 'Book an appointment',
  'hero.ctaSecondary': 'See the work',

  'services.title': 'Services',
  'services.note': 'Prices shown are starting prices. Longer or more complex hair may cost more.',
  'services.from': 'from',
  'services.book': 'Book',
  'services.minutes': '{n} min',
  'services.hours': '{h}h {m}m',

  'svc.haircut.name': 'Haircut, no beard',
  'svc.haircut.desc': 'Skin fade, taper-up, Mohawk or a regular cut. Beard not included.',
  'svc.haircut-beard.name': 'Haircut with beard',
  'svc.haircut-beard.desc': 'Any haircut with beard work, finished with a hot towel.',
  'svc.kids.name': 'Kids haircut, ages 6–12',
  'svc.kids.desc': 'Any haircut. Hair designs not included.',
  'svc.platinum.name': 'Platinum highlights',
  'svc.platinum.desc': 'Platinum highlights with a cut, hydration treatment and styling.',
  'svc.color.name': 'Colour and hydration',
  'svc.color.desc': 'Any colour or highlights, with hydration treatment and a cut.',
  'svc.vip.name': 'Sunday & after-hours VIP',
  'svc.vip.desc': 'Sundays and after-hours are by prior approval only and subject to availability.',
  'svc.vip.cta': 'Message to request',

  'work.title': 'The work',
  'work.sub': 'Every cut here is his own.',
  'work.more': 'Show more',
  'work.close': 'Close',
  'work.prev': 'Previous photo',
  'work.next': 'Next photo',
  'work.alt': 'Haircut by Alejandro, photo {n}',

  'about.title': 'About Alejandro',
  'about.body': 'Alejandro is a Venezuelan barber working out of Phoenix Salon Suites in Long Island City. He specialises in taper fades and detailed beard work, and takes colour and platinum clients by appointment. One hundred and forty seven reviews later, his rating has not moved off five stars.',
  'about.amenities': 'At the shop',
  'about.amenity.cards': 'Credit cards accepted',
  'about.amenity.accessible': 'Wheelchair accessible',
  'about.amenity.kids': 'Child friendly',
  'about.amenity.pets': 'Pets allowed',
  'about.amenity.wifi': 'Wi-Fi',
  'about.amenity.mobile': 'Mobile service available',

  'reviews.title': 'What clients say',
  'reviews.source': 'Verified reviews from Booksy',
  'reviews.summary': '{rating} average from {count} reviews',
  'reviews.julio': 'Alejandro is the best, super nice guy and gave me a great hair cut',
  'reviews.erick': 'El mejor, nunca falla una 🔥',
  'reviews.leonardo': 'Best cuts',
  'reviews.anthony': 'Great experience, would definitely come again.',
  'reviews.alex': 'Amazing work',
  'reviews.khan': 'Excellent',

  'visit.title': 'Visit',
  'visit.hours': 'Hours',
  'visit.address': 'Address',
  'visit.directions': 'Get directions',
  'visit.closed': 'Closed',
  'visit.vipNote': 'Sundays are VIP and after-hours only, by prior approval.',
  'day.0': 'Sunday',
  'day.1': 'Monday',
  'day.2': 'Tuesday',
  'day.3': 'Wednesday',
  'day.4': 'Thursday',
  'day.5': 'Friday',
  'day.6': 'Saturday',

  'book.title': 'Book an appointment',
  'book.step1': 'Service',
  'book.step2': 'Date',
  'book.step3': 'Time',
  'book.step4': 'Details',
  'book.next': 'Continue',
  'book.back': 'Back',
  'book.confirm': 'Confirm booking',
  'book.pickService': 'Choose a service',
  'book.pickDate': 'Choose a date',
  'book.pickTime': 'Choose a time',
  'book.noSlots': 'No times left on this day. Try another date.',
  'book.closedDay': 'Closed on Sundays, except VIP by prior approval.',
  'book.loading': 'Checking availability…',
  'book.name': 'Full name',
  'book.email': 'Email',
  'book.phone': 'Phone',
  'book.notes': 'Anything he should know (optional)',
  'book.required': 'Required',
  'book.badEmail': 'Enter a valid email address',
  'book.badPhone': 'Enter a valid phone number',
  'book.summary': '{service} · {date} at {time}',
  'book.submitting': 'Booking…',
  'book.successTitle': 'You are booked',
  'book.successBody': 'A calendar invite is on its way to {email}. Add it to your calendar and you will get a reminder before your appointment.',
  'book.taken': 'That time was just taken. Pick another.',
  'book.error': 'Something went wrong. Try again, or message him on Instagram.',
  'book.mockNotice': 'Demo mode — availability is simulated and no appointment is created.',
  'book.startOver': 'Book another',

  'footer.follow': 'Follow',
  'footer.rights': '© {year} Alejandro Barber Pro',
  'lang.label': 'Language',
};
```

**Note for the implementer:** every number in this dictionary is a verified fact — 147 reviews, five stars. If you find yourself rephrasing `about.body`, re-check the spec's facts table rather than the number you remember.

- [ ] **Step 4: Write `i18n/es.js` and `i18n/zh.js`**

Same key set exactly. Spanish uses his own Booksy service vocabulary (`Corte de cabello, no barba`, `Corte y barba`, `Mechas platinadas`, `Corte niños 6–12 años`). Review values are copied verbatim from `en.js` — do not translate them.

`zh.js` ends with:

```js
  _meta: {
    // Written from English, not by a native speaker. Review before launch.
    needsNativeReview: [
      'hero.title', 'hero.sub', 'about.body', 'services.note',
      'svc.vip.desc', 'visit.vipNote', 'book.successBody', 'book.mockNotice',
    ],
  },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/i18n.test.js`
Expected: PASS, 5 tests. The parity test will name any key you missed.

- [ ] **Step 6: Commit**

```bash
git add i18n/ test/i18n.test.js
git commit -m "feat: add EN/ES/ZH dictionaries with parity tests"
```

---

## Task 7: HTML shell, design tokens, navigation and footer

**Files:**
- Create: `index.html`, `styles.css`, `src/app.js`

**Interfaces:**
- Consumes: `assets/logo-mask.png`, `assets/crown-mask.png`, `assets/favicon.png` (Task 2); `BUSINESS` (Task 3)
- Produces: `<section>` anchors `#services`, `#work`, `#about`, `#reviews`, `#visit`, `#book`; the `data-i18n` / `data-i18n-attr` contract every later task uses; `.logo` and `.crown` mask classes

**Context:** Every translatable node carries `data-i18n="key"`. Attributes use `data-i18n-attr="attr:key"`. Task 8 reads these. No English may be hardcoded outside `i18n/`.

- [ ] **Step 1: Write `index.html`**

Document skeleton with `<html lang="en">`, meta description via `data-i18n-attr`, favicon link, preloaded self-hosted fonts, skip-link, sticky header containing the crown mark + nav + language `<select>` + Book button, six empty `<section>` shells with headings, and a footer with Instagram/Facebook/TikTok links from `BUSINESS`. Load `<script type="module" src="src/app.js">`.

Key structural requirements:
- Header nav collapses to a hamburger under 768px, controlled by a `<button aria-expanded>`.
- The language selector is a real `<select>` with `aria-label` from `lang.label` — a native control is keyboard- and screen-reader-correct for free, and this is a barber's site, not a place to hand-roll a listbox.
- Every section heading is an `<h2>`; the hero holds the single `<h1>`.

- [ ] **Step 2: Write `styles.css` — tokens and primitives**

```css
:root {
  --ink: #0b0b0c; --ink-2: #131316; --ink-3: #1c1c21;
  --gold: #c8a45c; --gold-soft: #e0c690;
  --bone: #f2efe9; --bone-dim: #a7a29a; --danger: #d9534f;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-ui: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --wrap: 1120px;
  --s1: .5rem; --s2: 1rem; --s3: 1.5rem; --s4: 2.5rem; --s5: 4rem; --s6: 6rem;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--ink); color: var(--bone);
  font-family: var(--font-ui); font-size: 16px; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 600; line-height: 1.08; margin: 0; }
h1 { font-size: clamp(2.75rem, 8vw, 5.5rem); letter-spacing: -.02em; }
h2 { font-size: clamp(2rem, 4.5vw, 3rem); }
.wrap { max-width: var(--wrap); margin: 0 auto; padding: 0 var(--s3); }
section { padding: var(--s6) 0; }

/* The mark is a monochrome alpha mask, coloured here — one file, any colour. */
.logo, .crown {
  background: var(--gold);
  -webkit-mask: center / contain no-repeat;
  mask: center / contain no-repeat;
}
.logo { -webkit-mask-image: url(assets/logo-mask.png); mask-image: url(assets/logo-mask.png); }
.crown { -webkit-mask-image: url(assets/crown-mask.png); mask-image: url(assets/crown-mask.png); }

:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
.skip:not(:focus) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

Plus header, nav, hamburger, footer, and `.btn` / `.btn-ghost` styling using only these tokens.

- [ ] **Step 3: Write `src/app.js` entry point**

Imports `BUSINESS`, populates footer social links and the copyright year, wires the hamburger toggle and smooth-scroll nav. Later tasks add their own imports here.

- [ ] **Step 4: Verify in a browser**

```bash
npm run serve
```

Open `http://localhost:8080`. Confirm: gold crown renders in the header on black, nav anchors jump to each section, hamburger works at 375px, tab order reaches every control with a visible gold focus ring.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css src/app.js
git commit -m "feat: add page shell, design tokens, nav and footer"
```

---

## Task 8: i18n runtime and language toggle

**Files:**
- Create: `src/i18n.js`
- Modify: `src/app.js`, `index.html` (add `data-i18n` to shell strings)

**Interfaces:**
- Consumes: `i18n/{en,es,zh}.js` (Task 6); the `data-i18n` contract (Task 7)
- Produces:
  - `t(key, vars?) → string`
  - `setLang(lang) → Promise<void>`
  - `currentLang() → 'en'|'es'|'zh'`
  - `applyTranslations(root = document) → void`
  - custom event `abp:langchange` on `document` after every switch

**Context:** Dictionaries are dynamically imported so only the active language is fetched. Sections rendered later must re-translate, which is what `abp:langchange` is for.

- [ ] **Step 1: Write `src/i18n.js`**

```js
const SUPPORTED = ['en', 'es', 'zh'];
const STORAGE_KEY = 'abp.lang';
let dict = {};
let lang = 'en';

function pickInitial() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED.includes(saved)) return saved;
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return SUPPORTED.includes(nav) ? nav : 'en';
}

/** Look up a key and substitute {placeholders}. Missing keys return the key. */
export function t(key, vars) {
  let s = dict[key];
  if (typeof s !== 'string') return key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export function currentLang() { return lang; }

export function applyTranslations(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n, JSON.parse(el.dataset.i18nVars || 'null'));
  }
  for (const el of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(',')) {
      const [attr, key] = pair.split(':').map(s => s.trim());
      el.setAttribute(attr, t(key));
    }
  }
}

export async function setLang(next) {
  lang = SUPPORTED.includes(next) ? next : 'en';
  dict = (await import(`../i18n/${lang}.js`)).default;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  applyTranslations();
  document.dispatchEvent(new CustomEvent('abp:langchange', { detail: { lang } }));
}

export function initI18n() { return setLang(pickInitial()); }
```

- [ ] **Step 2: Wire it in `src/app.js`**

```js
import { initI18n, setLang, currentLang } from './i18n.js';

await initI18n();

const picker = document.querySelector('#lang');
picker.value = currentLang();
picker.addEventListener('change', e => setLang(e.target.value));
```

- [ ] **Step 3: Add `data-i18n` to every shell string in `index.html`**

Nav links, buttons, footer, and `<title>` / meta description via `data-i18n-attr="content:meta.description"`.

- [ ] **Step 4: Verify in a browser**

Switch EN → ES → ZH. Confirm: all shell text changes, `<html lang>` updates in devtools, the choice survives a reload, and no key strings (e.g. a literal `nav.book`) leak into the page — a visible key means a missing dictionary entry.

- [ ] **Step 5: Commit**

```bash
git add src/i18n.js src/app.js index.html
git commit -m "feat: add trilingual runtime and language toggle"
```

---

## Task 9: Hero and services sections

**Files:**
- Create: `src/services.js`
- Modify: `index.html`, `styles.css`, `src/app.js`

**Interfaces:**
- Consumes: `SERVICES`, `BUSINESS` (Task 3); `t`, `applyTranslations` (Task 8)
- Produces: `renderServices() → void`, `formatDuration(min) → string`, `formatPrice(service) → string`

- [ ] **Step 1: Build the hero in `index.html` + `styles.css`**

Full-bleed near-black hero: gold `.logo` lockup, `<h1>` from `hero.title`, subline, a gold star row with `hero.rating` (vars `{rating: 5.0, count: 147}`), primary Book button, ghost "See the work" button. One portfolio photo at 25% opacity behind, `object-fit: cover`, with a bottom-to-top gradient into `--ink` so text contrast never drops.

- [ ] **Step 2: Write `src/services.js`**

```js
import { SERVICES, BUSINESS } from './config.js';
import { t } from './i18n.js';

export function formatDuration(min) {
  return min < 60
    ? t('services.minutes', { n: min })
    : t('services.hours', { h: Math.floor(min / 60), m: min % 60 });
}

/** Preserves the "+" on from-prices. $60 and $60+ mean different things. */
export function formatPrice(s) {
  return `$${s.priceFrom}${s.plus ? '+' : ''}`;
}

export function renderServices() {
  const list = document.querySelector('#service-list');
  list.replaceChildren(...SERVICES.map(s => {
    const card = document.createElement('article');
    card.className = `service-card${s.selfBookable ? '' : ' service-card--vip'}`;
    card.innerHTML = `
      <h3>${t(`svc.${s.id}.name`)}</h3>
      <p class="service-desc">${t(`svc.${s.id}.desc`)}</p>
      <div class="service-meta">
        <span class="service-price">${s.plus ? `<em>${t('services.from')}</em> ` : ''}${formatPrice(s)}</span>
        <span class="service-dur">${formatDuration(s.durationMin)}</span>
      </div>`;

    const cta = document.createElement('a');
    if (s.selfBookable) {
      cta.href = '#book';
      cta.className = 'btn btn-ghost';
      cta.textContent = t('services.book');
      cta.dataset.serviceId = s.id;
    } else {
      // VIP needs his approval first — never route it into the wizard.
      cta.href = BUSINESS.instagram;
      cta.target = '_blank';
      cta.rel = 'noopener';
      cta.className = 'btn btn-ghost';
      cta.textContent = t('svc.vip.cta');
    }
    card.append(cta);
    return card;
  }));
}
```

- [ ] **Step 3: Render on load and on language change**

In `src/app.js`:

```js
import { renderServices } from './services.js';
renderServices();
document.addEventListener('abp:langchange', renderServices);
```

- [ ] **Step 4: Verify in a browser**

Confirm all six cards render; `$60+`, `$85+`, `$275+`, `$355+` show the plus and `$150` does not; durations read `55 min`, `1h 20m`, `2h 55m`, `3h 20m`; the VIP card is visually distinct and its button opens Instagram in a new tab rather than jumping to `#book`; all six re-translate on language switch.

- [ ] **Step 5: Commit**

```bash
git add src/services.js index.html styles.css src/app.js
git commit -m "feat: add hero and services sections"
```

---

## Task 10: Portfolio grid and lightbox

**Files:**
- Create: `src/portfolio.js`
- Modify: `index.html`, `styles.css`, `src/app.js`

**Interfaces:**
- Consumes: `PORTFOLIO_COUNT`, `PORTFOLIO_INITIAL` (Task 3); `t` (Task 8)
- Produces: `renderPortfolio() → void`

**Context:** 32 photos at ~75 KB each is ~2.4 MB. Twelve render initially; the rest arrive on demand. Every `<img>` is `loading="lazy"` with explicit `width`/`height` so the grid never shifts as images arrive.

- [ ] **Step 1: Write `src/portfolio.js`**

```js
import { PORTFOLIO_COUNT, PORTFOLIO_INITIAL } from './config.js';
import { t } from './i18n.js';

const src = n => `assets/portfolio/cut-${String(n).padStart(2, '0')}.jpg`;
let shown = PORTFOLIO_INITIAL;

function tile(n) {
  const btn = document.createElement('button');
  btn.className = 'shot';
  btn.type = 'button';
  btn.dataset.index = n;
  btn.setAttribute('aria-label', t('work.alt', { n }));
  const img = new Image(736, 736);
  img.src = src(n);
  img.alt = t('work.alt', { n });
  img.loading = 'lazy';
  img.decoding = 'async';
  btn.append(img);
  return btn;
}

export function renderPortfolio() {
  const grid = document.querySelector('#work-grid');
  const more = document.querySelector('#work-more');
  grid.replaceChildren(...Array.from({ length: shown }, (_, i) => tile(i + 1)));
  more.textContent = t('work.more');
  more.hidden = shown >= PORTFOLIO_COUNT;
}

export function initPortfolio() {
  const grid = document.querySelector('#work-grid');
  const more = document.querySelector('#work-more');

  more.addEventListener('click', () => {
    shown = PORTFOLIO_COUNT;
    renderPortfolio();
    grid.querySelectorAll('.shot')[PORTFOLIO_INITIAL]?.focus();
  });

  grid.addEventListener('click', e => {
    const shot = e.target.closest('.shot');
    if (shot) openLightbox(Number(shot.dataset.index));
  });

  renderPortfolio();
  document.addEventListener('abp:langchange', renderPortfolio);
}
```

Plus a `<dialog>`-based lightbox: `openLightbox(n)` sets the image and calls `showModal()` — the native element gives focus trapping, Escape-to-close and inert background for free. Left/Right arrows step through, wrapping at both ends. Close button labelled from `work.close`.

- [ ] **Step 2: Add the grid, load-more button and `<dialog>` markup to `index.html`**

- [ ] **Step 3: Style the grid in `styles.css`**

`grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`, square tiles via `aspect-ratio: 1`, `object-fit: cover`, gold outline on hover and focus, no layout shift.

- [ ] **Step 4: Verify in a browser**

Confirm: 12 tiles initially; devtools Network shows only 12 image requests before clicking Show more; clicking loads the remaining 20; clicking a tile opens the lightbox; Escape closes it; arrow keys step and wrap; focus returns to the triggering tile on close; the grid does not shift while images load.

- [ ] **Step 5: Commit**

```bash
git add src/portfolio.js index.html styles.css src/app.js
git commit -m "feat: add portfolio grid and lightbox"
```

---

## Task 11: About, reviews, and visit sections

**Files:**
- Create: `src/visit.js`
- Modify: `index.html`, `styles.css`, `src/app.js`

**Interfaces:**
- Consumes: `BUSINESS`, `HOURS`, `REVIEWS` (Task 3); `formatMinutes` (Task 5); `t`, `currentLang` (Task 8)
- Produces: `renderReviews() → void`, `renderHours() → void`, `renderAddress() → void`

- [ ] **Step 1: Write `src/visit.js`**

```js
import { BUSINESS, HOURS, REVIEWS } from './config.js';
import { formatMinutes } from './slots.js';
import { t } from './i18n.js';
import { nyParts } from './tz.js';
import { weekdayOf } from './tz.js';

export function renderReviews() {
  document.querySelector('#reviews-summary').textContent =
    t('reviews.summary', { rating: BUSINESS.rating.toFixed(1), count: BUSINESS.reviewCount });
  document.querySelector('#reviews-source').textContent = t('reviews.source');
  document.querySelector('#review-list').replaceChildren(...REVIEWS.map(r => {
    const li = document.createElement('li');
    li.className = 'review';
    li.innerHTML = `<p class="review-text">${t(r.textKey)}</p>
                    <p class="review-name">${r.name}</p>`;
    return li;
  }));
}

export function renderHours() {
  const today = weekdayOf(nyParts(new Date()).date);
  const rows = [1, 2, 3, 4, 5, 6, 0].map(d => {
    const h = HOURS[d];
    const tr = document.createElement('tr');
    if (d === today) tr.className = 'is-today';
    tr.innerHTML = `<th scope="row">${t(`day.${d}`)}</th>
                    <td>${h ? `${formatMinutes(h.open)} – ${formatMinutes(h.close)}` : t('visit.closed')}</td>`;
    return tr;
  });
  document.querySelector('#hours-body').replaceChildren(...rows);
  document.querySelector('#vip-note').textContent = t('visit.vipNote');
}

export function renderAddress() {
  document.querySelector('#address').replaceChildren(
    ...BUSINESS.addressLines.map(line => Object.assign(document.createElement('span'), { textContent: line })),
  );
  const dir = document.querySelector('#directions');
  dir.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapQuery)}`;
  dir.textContent = t('visit.directions');
}
```

Week starts Monday and ends Sunday, so his one closed day reads as the exception it is rather than leading the table.

- [ ] **Step 2: Add the markup for about, amenities, reviews and visit to `index.html`**

Amenities render as an icon-free list from the six `about.amenity.*` keys. The map is an `<iframe>` Google Maps embed with `loading="lazy"` and a `title` attribute, wrapped in a `.map` container with `aspect-ratio: 16/9`.

- [ ] **Step 3: Wire into `src/app.js` on load and on `abp:langchange`**

- [ ] **Step 4: Verify in a browser**

Confirm: six real reviews render with first names; the Booksy attribution line is present and not a link; the hours table shows Mon–Sat then Sunday Closed, with 20:10 on Mon/Tue and 20:25 on Wed–Sat; today's row is highlighted; Get directions opens the right map pin.

- [ ] **Step 5: Commit**

```bash
git add src/visit.js index.html styles.css src/app.js
git commit -m "feat: add about, reviews and visit sections"
```

---

## Task 12: Booking API seam

**Files:**
- Create: `src/booking-api.js`, `src/mock-busy.js`
- Test: `test/booking-api.test.js`

**Interfaces:**
- Consumes: `availableSlots` (Task 5); `USE_MOCK`, `API_BASE`, `SERVICES` (Task 3)
- Produces:
  - `getAvailability(dateStr, serviceId) → Promise<string[]>`
  - `book({ serviceId, date, time, name, email, phone, notes }) → Promise<{ok:true, eventId, start, end} | {ok:false, error:'slot_taken'|'validation'|'network', fields?}>`
  - `isMock() → boolean`
  - `mockBusyFor(dateStr) → Array<{start:number,end:number}>`

**Context:** Both branches satisfy the same contract, so Task 13's wizard never learns which is active. The mock's busy blocks are derived deterministically from the date string — the same day always looks the same, so the demo is stable and testable rather than reshuffling on every render.

- [ ] **Step 1: Write the failing test**

```js
// test/booking-api.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockBusyFor, validateBooking } from '../src/booking-api.js';

test('mock busy blocks are deterministic per date', () => {
  assert.deepEqual(mockBusyFor('2026-08-05'), mockBusyFor('2026-08-05'));
});

test('different dates produce different mock busy blocks', () => {
  const a = JSON.stringify(mockBusyFor('2026-08-05'));
  const b = JSON.stringify(mockBusyFor('2026-08-06'));
  assert.notEqual(a, b);
});

test('mock busy blocks fall inside business hours', () => {
  for (const d of ['2026-08-03', '2026-08-05', '2026-08-08']) {
    for (const b of mockBusyFor(d)) {
      assert.ok(b.start >= 540 && b.end <= 1225, `${d} block out of hours`);
      assert.ok(b.end > b.start);
    }
  }
});

test('validateBooking rejects empty required fields', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: '', email: '', phone: '' });
  assert.equal(r.ok, false);
  assert.ok(r.fields.name && r.fields.email && r.fields.phone);
});

test('validateBooking rejects a malformed email', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: 'A', email: 'nope', phone: '2125551234' });
  assert.equal(r.fields.email, 'book.badEmail');
});

test('validateBooking rejects a phone with too few digits', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: 'A', email: 'a@b.co', phone: '123' });
  assert.equal(r.fields.phone, 'book.badPhone');
});

test('validateBooking rejects a non-self-bookable service', () => {
  const r = validateBooking({ serviceId: 'vip', date: '2026-08-05', time: '10:00', name: 'A', email: 'a@b.co', phone: '2125551234' });
  assert.equal(r.ok, false);
});

test('validateBooking accepts a complete valid booking', () => {
  const r = validateBooking({ serviceId: 'haircut', date: '2026-08-05', time: '10:00', name: 'Ana Ruiz', email: 'ana@example.com', phone: '(212) 555-1234' });
  assert.equal(r.ok, true);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/booking-api.test.js`
Expected: FAIL — `Cannot find module '../src/booking-api.js'`

- [ ] **Step 3: Write `src/mock-busy.js`**

```js
/** Stable 32-bit hash so a given date always yields the same fake day. */
export function hashDate(dateStr) {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
```

- [ ] **Step 4: Write `src/booking-api.js`**

```js
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/booking-api.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/booking-api.js src/mock-busy.js test/booking-api.test.js
git commit -m "feat: add booking API seam with mock backend"
```

---

## Task 13: Booking wizard

**Files:**
- Create: `src/wizard.js`
- Modify: `index.html`, `styles.css`, `src/app.js`

**Interfaces:**
- Consumes: `getAvailability`, `book`, `isMock` (Task 12); `SERVICES`, `BOOKING` (Task 3); `addDays`, `weekdayOf`, `nyParts` (Task 4); `formatDuration`, `formatPrice` (Task 9); `t` (Task 8)
- Produces: `initWizard() → void`, and honours `#book?service=<id>` deep links from the service cards

**Context:** One state object, four panels, one renderer. Only self-bookable services appear. State survives back-navigation because nothing is read from the DOM.

- [ ] **Step 1: Write the wizard skeleton in `src/wizard.js`**

```js
import { SERVICES, BOOKING } from './config.js';
import { getAvailability, book, isMock } from './booking-api.js';
import { addDays, weekdayOf, nyParts } from './tz.js';
import { formatDuration, formatPrice } from './services.js';
import { t } from './i18n.js';

const state = { step: 1, serviceId: null, date: null, time: null,
                details: { name: '', email: '', phone: '', notes: '' },
                slots: [], loading: false, errors: {}, result: null };

const bookable = () => SERVICES.filter(s => s.selfBookable);

function go(step) { state.step = step; render(); }

async function loadSlots() {
  state.loading = true; state.time = null; render();
  try {
    state.slots = await getAvailability(state.date, state.serviceId);
  } catch { state.slots = []; state.errors.slots = 'book.error'; }
  state.loading = false; render();
}
```

Then `renderStep1` … `renderStep4`, a `render()` that shows one panel and updates the step indicator, and `initWizard()` that binds events and reads `?service=`.

- [ ] **Step 2: Step 1 — service picker**

Radio-group semantics (`role="radiogroup"`, arrow-key navigation) over the five bookable services, each showing name, price with `+`, and duration. Selecting one enables Continue. VIP is absent — assert this in the browser check.

- [ ] **Step 3: Step 2 — date picker**

A 60-day list grouped by month, rendered from `addDays(today, 0..59)`. Sundays render disabled with `book.closedDay` as their title. Dates are produced from `nyParts(new Date()).date`, never from the browser's local date, so a client browsing from Los Angeles at 10pm does not see yesterday. Choosing a date calls `loadSlots()` and advances.

- [ ] **Step 4: Step 3 — time picker**

Shows `book.loading` while fetching, `book.noSlots` when the day is full, otherwise a grid of slot buttons. Selecting one advances to step 4.

- [ ] **Step 5: Step 4 — details and confirmation**

Name / email / phone / notes, each `<label>`-bound with `aria-describedby` pointing at its error node. Above the form, a summary line from `book.summary` with vars `{service, date, time}`. When `isMock()` a `book.mockNotice` banner renders — the demo must never look like it created a real appointment. Submit calls `book()`:

- `{ok:true}` → success panel with `book.successTitle` and `book.successBody` (vars `{email}`), plus a `book.startOver` button that resets state.
- `{error:'validation'}` → paint `state.errors` onto the fields, focus the first bad one.
- `{error:'slot_taken'}` → show `book.taken`, return to step 3 and reload slots.
- `{error:'network'}` → show `book.error`.

- [ ] **Step 6: Deep-link from the service cards**

```js
// in initWizard()
const preset = new URLSearchParams(location.search).get('service');
if (preset && bookable().some(s => s.id === preset)) { state.serviceId = preset; state.step = 2; }

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-service-id]');
  if (!btn) return;
  state.serviceId = btn.dataset.serviceId;
  go(2);
});
```

- [ ] **Step 7: Verify the full flow in a browser**

Walk it end to end and confirm each of these:
- Only five services appear; VIP is not among them.
- Sundays are disabled and explain why.
- The loading state is visible, then real slots appear.
- Slots respect the mock's busy blocks — cross-check one date against `node -e` output from `mockBusyFor`.
- Back from step 4 to step 1 and forward again: every earlier choice is still selected.
- Submitting with an empty form shows three field errors and focuses the first.
- A malformed email is rejected; a valid one passes.
- Success panel shows the demo-mode notice.
- The whole flow is completable with keyboard only.
- Switching language mid-flow re-translates without losing state.

- [ ] **Step 8: Commit**

```bash
git add src/wizard.js index.html styles.css src/app.js
git commit -m "feat: add four-step booking wizard"
```

---

## Task 14: Cloudflare Worker and deploy checklist

**Files:**
- Create: `worker/src/worker.js`, `worker/wrangler.toml`, `worker/README.md`
- Modify: `README.md` (create at repo root)

**Interfaces:**
- Consumes: the API contract from Task 12
- Produces: `GET /availability?date&serviceId`, `POST /book` — **written, not deployed**

**Context:** This task writes and reviews code but touches no accounts, per the agreed scope. Do not run `wrangler deploy`. Do not create a GCP project. The Worker must import the *same* `slots.js` so the mock and live paths cannot drift.

- [ ] **Step 1: Write `worker/src/worker.js`**

Service-account JWT signing via Web Crypto (`RSASSA-PKCS1-v1_5`, SHA-256), exchanged at `oauth2.googleapis.com/token` for an access token; `POST /freeBusy` for the day's busy blocks; `POST /calendars/{id}/events?sendUpdates=all` with the client as an attendee so Google sends both parties the invite. CORS restricted to the Pages origin. A conditional re-check of availability immediately before insert returns `409` when the slot went while the client was typing.

Secrets, all set via `wrangler secret put`: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `CALENDAR_ID`, `ALLOWED_ORIGIN`.

- [ ] **Step 2: Write `worker/wrangler.toml`**

```toml
name = "abp-booking"
main = "src/worker.js"
compatibility_date = "2026-08-01"
```

- [ ] **Step 3: Write `worker/README.md` — the checklist to run later**

Numbered, copy-pasteable: create the GCP project → enable the Calendar API → create a service account → download the JSON key → in Google Calendar share Alejandro's calendar with the service-account address granting "Make changes to events" → copy the calendar ID → `wrangler secret put` each of the four secrets → `wrangler deploy` → set `API_BASE` and `USE_MOCK = false` in `src/config.js` → verify one real booking end to end → delete the test event.

State plainly that no account was created and nothing was deployed in this session.

- [ ] **Step 4: Syntax-check the Worker without deploying**

```bash
node --check worker/src/worker.js
```

Expected: no output. This confirms it parses; it does not confirm it runs, which is honest — it cannot be exercised until the secrets exist.

- [ ] **Step 5: Write the root `README.md`**

What the site is, how to run it (`npm run serve`), how to test it (`npm test`), the file map, and an explicit "Booking is in demo mode — see `worker/README.md` to connect Google Calendar."

- [ ] **Step 6: Commit**

```bash
git add worker/ README.md
git commit -m "feat: add Google Calendar Worker and deploy checklist (not deployed)"
```

---

## Task 15: Verification pass

**Files:**
- Modify: whatever the pass turns up

**Interfaces:**
- Consumes: everything
- Produces: a verified, shippable site

- [ ] **Step 1: Full test suite across timezones**

```bash
npm test && TZ=Asia/Tokyo npm test && TZ=America/Los_Angeles npm test
```

Expected: PASS in all three. Record the actual test count in the commit message.

- [ ] **Step 2: Responsive check at 375 / 768 / 1440 px**

At each width confirm: no horizontal scroll, the hero headline does not overflow, the services grid reflows, the portfolio grid reflows, the wizard is usable, and the hours table stays readable.

- [ ] **Step 3: Keyboard and screen-reader pass**

Tab from the top through the entire page and the whole wizard without touching the mouse. Every interactive element must be reachable with a visible gold focus ring. The lightbox must trap focus and restore it on close. Confirm one `<h1>` and a sane heading order.

- [ ] **Step 4: Contrast check**

Verify `--bone` on `--ink` and `--gold` on `--ink` meet WCAG AA for their sizes. `--bone-dim` on `--ink` must not be used for anything smaller than 14px unless it passes.

- [ ] **Step 5: Copy audit against the spec**

Re-read the spec's verified-facts table and check every number on the rendered page: address, 5.0, 147, all six prices with correct `+`, all six durations, all seven hours rows. Any mismatch is a bug, not a preference.

- [ ] **Step 6: Confirm no hotlinks and no leaked keys**

```bash
grep -rn "cloudfront\|booksy.com" index.html src/ styles.css || echo "no hotlinks"
grep -rn "PRIVATE KEY\|client_secret" . --exclude-dir=.git || echo "no secrets"
```

Expected: both fall through to their echo.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: verification pass — responsive, a11y, copy audit"
```

---

## Self-review

**Spec coverage:** Purpose → all tasks. Verified facts → Task 3, audited again in Task 15 Step 5. Hours → Tasks 3, 5, 11. Services incl. VIP non-bookability → Tasks 3, 9, 12, 13. Reviews + Booksy attribution → Task 11. Assets → Tasks 1, 2. Architecture + API contract → Task 12. Slot rules → Task 5. Page structure → Tasks 7, 9, 10, 11, 13. Trilingual → Tasks 6, 8. Testing table → Tasks 4, 5, 6, 12, 15. Scope boundary → Task 14 writes but does not deploy. Deferred items → not implemented, as intended.

**Deviation from spec, recorded deliberately:** Task 2 produces an alpha-mask PNG rather than a hand-traced SVG. Rationale is stated in the task; the spec's Assets section has been amended to match.

**Type consistency:** `availableSlots({dateStr, serviceId, busy, now})` is called with that exact shape in Tasks 12 and 13. `slotsFor` takes `{hours, durationMin, busy, earliestMin, stepMin}` throughout. `t(key, vars)` is uniform. `formatMinutes` is defined in `slots.js` (Task 5) and imported by `visit.js` (Task 11) from there, not redefined. `formatDuration` / `formatPrice` are defined in `services.js` (Task 9) and imported by `wizard.js` (Task 13). `weekdayOf`, `addDays`, `nyParts`, `toWallInterval` all come from `tz.js`. `hashDate` lives in `mock-busy.js` and is imported by `booking-api.js`.
