// Key-usage parity: every i18n key referenced anywhere in the markup or the
// JS source must actually exist in the dictionary. This is a heuristic
// (regex over source text), not a full parser — dynamic keys built with
// template literals (e.g. `t(\`svc.${s.id}.name\`)`) can't be statically
// resolved and are deliberately not extracted; they're covered instead by
// test/i18n.test.js's "no value is empty" + naming-convention checks and by
// manual verification.
//
// Deliberately NOT tested here (per the reviewer's own scoping): the
// reverse direction, "every dictionary key is used somewhere". That
// direction is more prone to false positives from exactly the same dynamic
// keys this file can't see (svc.${id}.name, day.${d}, book.step${n}, etc.
// would all look "unused" to a naive regex even though they're very much
// used), so it's out of scope as a hard assertion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import en from '../i18n/en.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function extractHtmlKeys(html) {
  const keys = new Set();
  for (const m of html.matchAll(/\bdata-i18n="([^"]+)"/g)) keys.add(m[1]);
  for (const m of html.matchAll(/\bdata-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(',')) {
      const key = pair.split(':')[1]?.trim();
      if (key) keys.add(key);
    }
  }
  return keys;
}

// Matches t('some.key' or t("some.key" — a call to the bare `t` function
// (imported as `t` everywhere in src/) with a plain string-literal first
// argument. `\bt\(` requires a non-identifier character immediately before
// the "t" so calls like `document.createElement('div')` (ends in
// "...ment('...")) or `setTimeout(` don't spuriously match: the boundary
// only exists when the character right before "t" is itself a non-word
// character. Skips backtick template-literal keys (dynamic, unresolvable
// statically) by construction — the quote-char group only matches ' or ".
function extractJsKeys(js) {
  const keys = new Set();
  for (const m of js.matchAll(/\bt\(\s*(['"])([^'"]+)\1/g)) keys.add(m[2]);
  return keys;
}

test('extractJsKeys sanity check: recognizes real t() calls and ignores lookalikes', () => {
  // A synthetic snippet standing in for the real patterns found in src/ —
  // used to confirm the regex's logic against a case with a known-correct
  // answer before trusting it against the real source below.
  const sample = `
    import { t } from './i18n.js';
    const a = t('book.pickService');
    const b = t("book.next", { x: 1 });
    const dyn = t(\`svc.\${s.id}.name\`);
    document.createElement('div');
    setTimeout(r, 260);
    el.querySelector('.shot');
  `;
  const got = extractJsKeys(sample);
  assert.deepEqual([...got].sort(), ['book.next', 'book.pickService']);
});

test('extractHtmlKeys sanity check: reads data-i18n and data-i18n-attr, not data-i18n-vars', () => {
  const sample = `
    <h2 data-i18n="services.title">Services</h2>
    <p data-i18n-attr="content:meta.description,aria-label:nav.toggle"></p>
    <p data-i18n="footer.rights" data-i18n-vars='{"year":2026}'></p>
  `;
  const got = extractHtmlKeys(sample);
  assert.deepEqual([...got].sort(), ['footer.rights', 'meta.description', 'nav.toggle', 'services.title']);
});

test('every i18n key referenced in index.html or src/*.js exists in i18n/en.js', () => {
  const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const used = extractHtmlKeys(html);

  const srcDir = path.join(ROOT, 'src');
  for (const file of readdirSync(srcDir).filter(f => f.endsWith('.js'))) {
    const js = readFileSync(path.join(srcDir, file), 'utf8');
    for (const k of extractJsKeys(js)) used.add(k);
  }

  const missing = [...used].filter(k => !(k in en)).sort();
  assert.deepEqual(missing, [], `keys referenced but not in i18n/en.js: ${missing.join(', ')}`);

  // Sanity: this test is only meaningful if it actually found a
  // reasonably-sized set of real keys, not an empty set from a broken
  // regex silently matching nothing.
  assert.ok(used.size > 30, `expected to find >30 used keys, found ${used.size}`);
});
