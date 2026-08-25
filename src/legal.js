// Page shell for the standalone legal pages (privacy.html).
//
// Deliberately NOT src/app.js: that module boots the whole marketing page —
// services, portfolio, reviews, hours, the booking wizard — and would throw
// looking for elements this page does not have. The legal pages need the
// language runtime, the language picker and the footer year, and nothing
// else. Keeping them on a separate entry point is why privacy.html loads no
// Cal.com script and mounts no map.

import { initI18n, setLang, currentLang } from './i18n.js';

function setFooterCopyrightYear() {
  const el = document.getElementById('footer-copyright');
  if (el) el.dataset.i18nVars = JSON.stringify({ year: new Date().getFullYear() });
}

function setupLangSelect() {
  const picker = document.querySelector('#lang-select');
  if (!picker) return;
  picker.value = currentLang();
  picker.addEventListener('change', e => setLang(e.target.value));
}

async function init() {
  // Before initI18n(): its first applyTranslations() reads data-i18n-vars,
  // so the year has to be stamped on by then or the footer renders a literal
  // {year}. Same ordering requirement as app.js.
  setFooterCopyrightYear();
  try {
    await initI18n();
  } catch (err) {
    console.error('i18n load failed', err);
  }
  setupLangSelect();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
