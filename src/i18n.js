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

/**
 * Test-only seam: reassigns the module-private `dict` directly, bypassing
 * setLang()'s localStorage/document/dynamic-import path (all browser
 * globals unavailable/unwanted under `node --test`). Not used by app code.
 */
export function setDict(newDict) { dict = newDict; }

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
