// Page shell wiring: footer social links, copyright year, and the mobile nav.
// Later tasks (i18n runtime, hero/services, portfolio, visit, booking wizard)
// add their own imports and init calls here.
import { BUSINESS } from './config.js';

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

function setCopyrightYear() {
  const el = document.getElementById('copyright-year');
  if (el) el.textContent = String(new Date().getFullYear());
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

function init() {
  populateFooterSocialLinks();
  setCopyrightYear();
  setupHamburger();
  // Smooth-scrolling for in-page nav anchors is handled declaratively via
  // `scroll-behavior: smooth` in styles.css — no duplicate JS scroll handler.
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
