// src/wizard.js is browser-only and this repo has no DOM under node --test,
// so behaviour that lives in an attribute is pinned the way
// test/i18n-usage.test.js pins keys: by reading the source. Brittle on
// purpose — if the line moves, someone has to look at why.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const wizard = readFileSync(path.join(ROOT, 'src', 'wizard.js'), 'utf8');

test('the running total on the add-ons step is a polite live region, so a screen reader announces each change', () => {
  // renderTotal() rewrites .book-total's text on every toggle. Without
  // aria-live a blind client hears "Facial, checked" and never hears that
  // the appointment became "$145+ · 1h 30m".
  const block = wizard.slice(wizard.indexOf("total.className = 'book-total'"));
  assert.notEqual(block.length, wizard.length, 'the total element was not found in wizard.js');
  assert.match(block.slice(0, 300), /total\.setAttribute\('aria-live', 'polite'\)/);
});
