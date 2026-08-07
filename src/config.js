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
