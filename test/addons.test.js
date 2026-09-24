// The money and minutes behind the add-ons step. Every number here is in
// the spec (docs/superpowers/specs/2026-09-23-add-ons-design.md, §5) and in
// Alejandro's instructions (docs/cal-multiple-durations.md); this file is
// what stops the three from drifting apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES } from '../src/config.js';
import {
  addonsFor, calDurationFor, defaultDurationFor, bookedDurationFor,
  durationOptionsFor, totalsFor, notesFor,
} from '../src/addons.js';

const svc = id => SERVICES.find(s => s.id === id);
const ALL = ['design', 'eyebrows', 'wash', 'facial'];

test('calDurationFor rounds up to the next Cal menu length and never down', () => {
  assert.equal(calDurationFor(55), 60);
  assert.equal(calDurationFor(60), 60);
  assert.equal(calDurationFor(65), 75);
  assert.equal(calDurationFor(100), 120);
  assert.equal(calDurationFor(480), 480);
  assert.throws(() => calDurationFor(481), RangeError);
});

test('durationOptionsFor pins the lists Alejandro must tick', () => {
  assert.deepEqual(durationOptionsFor(svc('haircut')),       [60, 75, 80, 90, 120]);
  assert.deepEqual(durationOptionsFor(svc('haircut-beard')), [80, 90, 120, 150]);
  assert.deepEqual(durationOptionsFor(svc('kids')),          [50, 60, 75, 80, 90, 120]);
});

test('defaultDurationFor is the base rounded up, and Cal requires it to be one of the options', () => {
  assert.equal(defaultDurationFor(svc('haircut')), 60);
  assert.equal(defaultDurationFor(svc('haircut-beard')), 80);
  assert.equal(defaultDurationFor(svc('kids')), 50);
  for (const s of SERVICES) {
    assert.ok(durationOptionsFor(s).includes(defaultDurationFor(s)), `${s.id}: default not in options`);
  }
});

test('services without add-ons have exactly one option: their own rounded length', () => {
  for (const id of ['platinum', 'color', 'vip']) {
    assert.deepEqual(durationOptionsFor(svc(id)), [defaultDurationFor(svc(id))]);
  }
});

test('bookedDurationFor: the table in the spec', () => {
  const h = svc('haircut'), b = svc('haircut-beard'), k = svc('kids');
  assert.equal(bookedDurationFor(h, []), 60);
  assert.equal(bookedDurationFor(h, ['eyebrows']), 60);
  assert.equal(bookedDurationFor(h, ['design']), 75);
  assert.equal(bookedDurationFor(h, ['wash']), 75);
  assert.equal(bookedDurationFor(h, ['facial']), 75);
  assert.equal(bookedDurationFor(h, ALL), 120);
  assert.equal(bookedDurationFor(b, []), 80);
  assert.equal(bookedDurationFor(b, ['eyebrows']), 90);
  assert.equal(bookedDurationFor(b, ['facial']), 120);
  assert.equal(bookedDurationFor(b, ALL), 150);
  assert.equal(bookedDurationFor(k, []), 50);
  assert.equal(bookedDurationFor(k, ['eyebrows']), 60);
  assert.equal(bookedDurationFor(k, ['facial']), 75);
  assert.equal(bookedDurationFor(k, ALL), 120);
});

test('totalsFor adds fixed add-on prices, keeps the from-price plus, and reports both true and booked minutes', () => {
  const h = svc('haircut');
  assert.deepEqual(totalsFor(h, []),          { priceFrom: 60,  plus: true, minutes: 55,  booked: 60 });
  assert.deepEqual(totalsFor(h, ['design']),  { priceFrom: 80,  plus: true, minutes: 65,  booked: 75 });
  assert.deepEqual(totalsFor(h, ALL),         { priceFrom: 170, plus: true, minutes: 100, booked: 120 });
});

test('totalsFor accepts a Set, which is what the wizard keeps', () => {
  assert.equal(totalsFor(svc('kids'), new Set(['wash', 'facial'])).booked, 80);
});

test('notesFor is bilingual, in ADDONS order regardless of tick order, and null when nothing was added', () => {
  assert.equal(notesFor([]), null);
  assert.equal(notesFor(new Set()), null);
  assert.equal(notesFor(['facial', 'design']), 'Add-ons / Complementos: Design / Diseño, Facial');
  assert.equal(notesFor(['eyebrows']), 'Add-ons / Complementos: Eyebrows / Cejas');
  assert.equal(notesFor(ALL), 'Add-ons / Complementos: Design / Diseño, Eyebrows / Cejas, Hair wash / Lavado de cabello, Facial');
});

test('an unknown add-on id is ignored, not fatal', () => {
  assert.equal(notesFor(['nope']), null);
  assert.equal(bookedDurationFor(svc('haircut'), ['nope']), 60);
  assert.equal(totalsFor(svc('haircut'), ['nope']).priceFrom, 60);
});

test('addonsFor returns the records a service offers, in ADDONS order', () => {
  assert.deepEqual(addonsFor(svc('kids')).map(a => a.id), ALL);
  assert.deepEqual(addonsFor(svc('color')), []);
});
