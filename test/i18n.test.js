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
  const reviewKeys = ['reviews.julio', 'reviews.erick', 'reviews.leonardo', 'reviews.anthony', 'reviews.alex', 'reviews.khan'];
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
