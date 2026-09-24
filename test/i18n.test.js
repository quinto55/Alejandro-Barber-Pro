import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../i18n/en.js';
import { REVIEWS, ADDONS } from '../src/config.js';
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
  // Derived from REVIEWS, not hardcoded: a hardcoded list silently stops
  // covering every review added after it was written.
  const reviewKeys = REVIEWS.map(r => r.textKey);
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

// The wizard builds these keys with template literals, which
// test/i18n-usage.test.js cannot see — so they are pinned here instead.
test('every add-on has a name in every language, and a description only where config says so', () => {
  for (const a of ADDONS) {
    for (const [lang, d] of Object.entries(dicts)) {
      assert.equal(typeof d[`addon.${a.id}.name`], 'string', `${lang} lacks addon.${a.id}.name`);
    }
    if (a.descKey) assert.ok(a.descKey in en, `${a.descKey} is not a real key`);
  }
});

test('the wizard step labels exist for every step key', () => {
  for (const key of ['service', 'addons', 'cal']) {
    assert.ok(`book.step.${key}` in en, `book.step.${key} missing`);
  }
  assert.ok('services.hoursOnly' in en);
  assert.match(en['book.addonPlus'], /\{n\}/);
});
