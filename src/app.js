// Page shell wiring: footer social links, footer copyright year, the
// mobile nav, and the trilingual runtime. Later tasks (hero/services,
// portfolio, visit, booking wizard) add their own imports and init calls here.
import { BUSINESS } from './config.js';
import { initI18n, setLang, currentLang } from './i18n.js';

function populateFooterSocialLinks() {
  const links = {
    'social-instagram': BUSINESS.instagram,
    'social-facebook': BUSINESS.facebook,
    'social-tiktok': BUSINESS.tiktok,
  };
  for (const [id, href] of Object.entries(links)) {
    const el = document.getElementById(id);
    if (el && href) el.href = href;
  }
}

// The footer copyright string ("© {year} Alejandro Barber Pro") is a
// data-i18n key with a {year} placeholder. Task 8's i18n runtime applies
// translations with `el.textContent = t(el.dataset.i18n, JSON.parse(el.dataset.i18nVars || 'null'))`,
// which would overwrite any nested DOM node we tried to update directly.
// So instead of setting textContent ourselves, we stamp the current year
// onto data-i18n-vars as JSON — the same mechanism every other
// {placeholder} substitution uses — so `t()` resolves it correctly on
// initial load and on every subsequent `abp:langchange` re-render.
function setFooterCopyrightYear() {
  const el = document.getElementById('footer-copyright');
  if (el) el.dataset.i18nVars = JSON.stringify({ year: new Date().getFullYear() });
}

function setupHamburger() {
  const toggle = document.querySelector('.hamburger');
  const nav = document.getElementById('nav-menu');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the mobile menu once a nav link is used, so the next page
  // state (scrolled to the target section) isn't hidden behind an open menu.
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupLangSelect() {
  const picker = document.querySelector('#lang-select');
  if (!picker) return;
  picker.value = currentLang();
  picker.addEventListener('change', (e) => setLang(e.target.value));
}

async function init() {
  // DOM-prep steps must run before the first `applyTranslations()` call
  // (fired synchronously inside `initI18n()` -> `setLang()`), since that
  // first render reads data-i18n-vars off elements like #footer-copyright.
  // Running initI18n() before this would render the footer's {year}
  // placeholder unsubstituted on first paint.
  populateFooterSocialLinks();
  setFooterCopyrightYear();
  setupHamburger();
  // Smooth-scrolling for in-page nav anchors is handled declaratively via
  // `scroll-behavior: smooth` in styles.css — no duplicate JS scroll handler.

  await initI18n();
  setupLangSelect();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
