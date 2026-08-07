// Page shell wiring: footer social links, footer copyright year, the
// mobile nav, and the trilingual runtime. Later tasks (hero/services,
// portfolio, visit, booking wizard) add their own imports and init calls here.
import { BUSINESS } from './config.js';
import { initI18n, setLang, currentLang } from './i18n.js';
import { renderServices } from './services.js';
import { initPortfolio } from './portfolio.js';
import { renderReviews, renderHours, renderAddress } from './visit.js';
import { initWizard, render as renderWizard } from './wizard.js';

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

// Same mechanism, same ordering requirement as the footer year above: the
// hero rating line ("5.0 from 147 clients") is a data-i18n key with
// {rating}/{count} placeholders. It must be stamped onto data-i18n-vars
// before the first applyTranslations() call (inside initI18n() -> setLang()),
// or the first paint leaks the literal "{rating}"/"{count}" tokens.
function setHeroRatingVars() {
  const el = document.querySelector('.hero-rating');
  if (el) {
    el.dataset.i18nVars = JSON.stringify({
      rating: BUSINESS.rating.toFixed(1),
      count: BUSINESS.reviewCount,
    });
  }
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

// The Google Maps embed src is built from BUSINESS.mapQuery (the single
// source of truth for his address, verified against Booksy — see
// config.js) rather than being hand-encoded into index.html, so the two
// never drift apart. It doesn't depend on the i18n dictionary and doesn't
// change with language, so — unlike renderReviews()/renderHours()/
// renderAddress() below — it's set once here rather than re-run on
// 'abp:langchange'.
function setMapEmbedSrc() {
  const iframe = document.getElementById('visit-map');
  if (iframe) iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.mapQuery)}&output=embed`;
}

async function init() {
  // DOM-prep steps must run before the first `applyTranslations()` call
  // (fired synchronously inside `initI18n()` -> `setLang()`), since that
  // first render reads data-i18n-vars off elements like #footer-copyright.
  // Running initI18n() before this would render the footer's {year}
  // placeholder unsubstituted on first paint.
  populateFooterSocialLinks();
  setFooterCopyrightYear();
  setHeroRatingVars();
  setMapEmbedSrc();
  setupHamburger();
  // Smooth-scrolling for in-page nav anchors is handled declaratively via
  // `scroll-behavior: smooth` in styles.css — no duplicate JS scroll handler.

  await initI18n();
  setupLangSelect();

  // Services need the dictionary that initI18n() just loaded, so the first
  // render happens here rather than at module load. initI18n() -> setLang()
  // already dispatched one 'abp:langchange' event before this listener
  // existed, so we render once directly and then listen for the ones that
  // follow future language switches.
  renderServices();
  document.addEventListener('abp:langchange', renderServices);

  // initPortfolio() renders the grid itself and registers its own
  // 'abp:langchange' listener (mirroring renderServices() above), so it
  // only needs to be called once here.
  initPortfolio();

  // Same reasoning as renderServices() above: renderReviews()/renderHours()/
  // renderAddress() all call t() internally, so the first render happens
  // here (after the dictionary has loaded) and each re-runs on every
  // subsequent language switch.
  renderReviews();
  renderHours();
  renderAddress();
  document.addEventListener('abp:langchange', renderReviews);
  document.addEventListener('abp:langchange', renderHours);
  document.addEventListener('abp:langchange', renderAddress);

  // initWizard() must run exactly once: besides its own first render, it
  // registers a document-level click listener (the #book?service= deep
  // link delegate) that would duplicate on every language switch if this
  // were re-run from the 'abp:langchange' handler below. That's the same
  // bug class Task 10's review specifically checked for elsewhere, so the
  // wizard's own re-translation hook is its exported `render`, not
  // `initWizard` again — it redraws the current step from the dictionary
  // that was just loaded without resetting wizard state or re-registering
  // any listener.
  initWizard();
  document.addEventListener('abp:langchange', renderWizard);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
