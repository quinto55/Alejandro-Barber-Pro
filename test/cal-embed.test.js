// cal-embed.js touches `window` only inside mountCal(), so the URL helpers
// are testable under plain node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calLinkFor, calUrlFor } from '../src/cal-embed.js';

test('calLinkFor uses the Cal slug, not the service id', () => {
  assert.equal(calLinkFor('kids'), 'alejandrobarberpro/kids-haircut-ages-6-12');
});

test('calUrlFor without params is the bare booking page, exactly as before', () => {
  assert.equal(calUrlFor('haircut'), 'https://cal.com/alejandrobarberpro/haircut');
  assert.equal(calUrlFor('haircut', {}), 'https://cal.com/alejandrobarberpro/haircut');
  assert.equal(calUrlFor('haircut', { duration: undefined, notes: null }), 'https://cal.com/alejandrobarberpro/haircut');
});

test('calUrlFor carries duration and notes, URL-encoded, ñ and slashes included', () => {
  assert.equal(
    calUrlFor('haircut', { duration: 75, notes: 'Add-ons / Complementos: Design / Diseño' }),
    'https://cal.com/alejandrobarberpro/haircut?duration=75&notes=Add-ons+%2F+Complementos%3A+Design+%2F+Dise%C3%B1o',
  );
});

test('calUrlFor with a duration but no notes sends only the duration', () => {
  assert.equal(
    calUrlFor('kids', { duration: 50, notes: null }),
    'https://cal.com/alejandrobarberpro/kids-haircut-ages-6-12?duration=50',
  );
});
