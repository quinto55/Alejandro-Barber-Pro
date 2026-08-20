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
// `calSlug` is the event-type slug on Cal.com. It is NOT derivable from `id`:
// Alejandro named the event types himself and Cal generated the slugs from
// those titles, so four of the six diverge. Verified against his live profile
// on 2026-08-18 — re-check before changing any of them.
export const SERVICES = [
  { id: 'haircut',       priceFrom: 60,  plus: true,  durationMin: 55,  selfBookable: true,
    calSlug: 'haircut' },
  { id: 'haircut-beard', priceFrom: 85,  plus: true,  durationMin: 80,  selfBookable: true,
    calSlug: 'haircut-beard' },
  { id: 'kids',          priceFrom: 60,  plus: true,  durationMin: 50,  selfBookable: true,
    calSlug: 'kids-haircut-ages-6-12' },
  { id: 'platinum',      priceFrom: 275, plus: true,  durationMin: 175, selfBookable: true,
    calSlug: 'platinum-highlights' },
  { id: 'color',         priceFrom: 355, plus: true,  durationMin: 200, selfBookable: true,
    calSlug: 'platinum-colour-and-hydration' },
  // Sundays need his approval first — the site must never auto-confirm one.
  { id: 'vip',           priceFrom: 150, plus: false, durationMin: 65,  selfBookable: false,
    calSlug: 'sunday-after-hours-vip' },
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
  { name: 'Johan',    textKey: 'reviews.johan' },
  { name: 'Maks',     textKey: 'reviews.maks' },
  { name: 'Ibbz',     textKey: 'reviews.ibbz' },
  { name: 'Yuvraj',   textKey: 'reviews.yuvraj' },
  { name: 'Tomas',    textKey: 'reviews.tomas' },
];

export const PORTFOLIO_COUNT = 32;
export const PORTFOLIO_INITIAL = 12;

// Cal.com owns scheduling: availability, the date/time picker, the details
// form, confirmations, reminders and rescheduling. The site owns service
// selection (step 1) and hands off from there.
//
// An event type must exist at cal.com/<username>/<calSlug> for every service
// (see calSlug on SERVICES above). `vip` has Cal's "requires confirmation"
// turned on so it can never auto-confirm — verified live on 2026-08-18.
export const CAL = {
  username: 'alejandrobarberpro',
  brandColor: '#c8b8a9', // keep in step with --glow in styles.css
  theme: 'dark',
  layout: 'month_view',
};

// LEGACY — the self-hosted booking engine (slots.js availability math,
// booking-api.js, mock-busy.js and the Worker in worker/) is no longer wired
// into the wizard; Cal.com replaced it. The modules and their tests are kept
// until a real Cal.com booking has been verified end to end, then removed.
export const USE_MOCK = true;
export const API_BASE = 'https://abp-booking.example.workers.dev';
