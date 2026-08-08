// Tests for src/i18n.js's runtime lookup logic (t()), as distinct from
// test/i18n.test.js, which tests the *dictionaries* (en/es/zh content and
// shape), not the runtime that reads them.
//
// t() reads a module-private `dict` that's normally only reachable through
// setLang(), which needs `localStorage` and `document` (browser globals not
// available/wanted under plain `node --test`). src/i18n.js exports a
// test-only `setDict()` seam for this — see its doc comment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, setDict } from '../src/i18n.js';

test('t() substitutes a single {placeholder}', () => {
  setDict({ 'greeting.hello': 'Hello, {name}!' });
  assert.equal(t('greeting.hello', { name: 'Ana' }), 'Hello, Ana!');
});

test('t() substitutes multiple {placeholders} in one string', () => {
  setDict({ 'hero.rating': '{rating} from {count} clients' });
  assert.equal(t('hero.rating', { rating: '5.0', count: 147 }), '5.0 from 147 clients');
});

test('t() substitutes the same placeholder repeated more than once', () => {
  setDict({ 'echo.twice': '{word} {word}' });
  assert.equal(t('echo.twice', { word: 'go' }), 'go go');
});

test('t() returns the literal key string for a key missing from the dictionary', () => {
  setDict({ 'known.key': 'known value' });
  assert.equal(t('totally.unknown.key'), 'totally.unknown.key');
});

test('t() returns the literal key string when the dictionary is empty', () => {
  // Mirrors the real-world case fixed in this pass (app.js's try/catch
  // around initI18n()): if the dictionary fetch fails, dict stays {} and
  // every t() call must degrade to key-text rather than throwing or
  // returning undefined/blank.
  setDict({});
  assert.equal(t('hero.title'), 'hero.title');
});

test('t(key) with no vars argument leaves {placeholders} unsubstituted', () => {
  // Reading the actual implementation: `if (vars) for (...)` — substitution
  // is skipped entirely when `vars` is undefined, so a key whose value
  // contains {placeholder} tokens comes back with those tokens still
  // literally in the string, not blanked out or errored.
  setDict({ 'hero.rating': '{rating} from {count} clients' });
  assert.equal(t('hero.rating'), '{rating} from {count} clients');
});

test('t(key, vars) ignores vars entries that have no matching {placeholder}', () => {
  setDict({ 'plain.key': 'no placeholders here' });
  assert.equal(t('plain.key', { unused: 'x' }), 'no placeholders here');
});

test('t(key, vars) leaves a {placeholder} unsubstituted if vars omits it', () => {
  setDict({ 'two.slots': '{a} and {b}' });
  assert.equal(t('two.slots', { a: 'first' }), 'first and {b}');
});

// applyTranslations() (the [data-i18n] / [data-i18n-attr] DOM walker) is not
// covered here: it calls document.querySelectorAll, and this project has no
// runtime/dev dependencies to add a DOM implementation (e.g. jsdom) for
// plain `node --test`. t()'s substitution and fallback logic — exercised
// thoroughly above — is what applyTranslations() delegates to for every
// actual translation decision, so this is judged an acceptable gap rather
// than one worth a new dependency. See test/i18n-usage.test.js for a
// DOM-free way of still checking markup/dictionary key parity.
