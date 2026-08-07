import { PORTFOLIO_COUNT, PORTFOLIO_INITIAL } from './config.js';
import { t } from './i18n.js';

const src = n => `assets/portfolio/cut-${String(n).padStart(2, '0')}.jpg`;
let shown = PORTFOLIO_INITIAL;

function tile(n) {
  const btn = document.createElement('button');
  btn.className = 'shot';
  btn.type = 'button';
  btn.dataset.index = n;
  btn.setAttribute('aria-label', t('work.alt', { n }));
  const img = new Image(736, 736);
  img.src = src(n);
  img.alt = t('work.alt', { n });
  img.loading = 'lazy';
  img.decoding = 'async';
  btn.append(img);
  return btn;
}

export function renderPortfolio() {
  const grid = document.querySelector('#work-grid');
  const more = document.querySelector('#work-more');
  grid.replaceChildren(...Array.from({ length: shown }, (_, i) => tile(i + 1)));
  more.textContent = t('work.more');
  more.hidden = shown >= PORTFOLIO_COUNT;
  // Keep an open lightbox in sync with the language that was just switched
  // to: the alt text is the only thing on the dialog that's translated, and
  // the photo it belongs to doesn't change, so just re-stamp it in place.
  if (current !== null) {
    const img = document.querySelector('#lightbox-img');
    if (img) img.alt = t('work.alt', { n: current });
  }
}

export function initPortfolio() {
  const grid = document.querySelector('#work-grid');
  const more = document.querySelector('#work-more');

  more.addEventListener('click', () => {
    shown = PORTFOLIO_COUNT;
    renderPortfolio();
    grid.querySelectorAll('.shot')[PORTFOLIO_INITIAL]?.focus();
  });

  grid.addEventListener('click', e => {
    const shot = e.target.closest('.shot');
    if (shot) openLightbox(Number(shot.dataset.index));
  });

  renderPortfolio();
  document.addEventListener('abp:langchange', renderPortfolio);
  initLightbox();
}

// ---- Lightbox -------------------------------------------------------

// Index (1-based) of the photo currently shown in the lightbox, or null
// when it's closed. Tracked at module scope so renderPortfolio() can
// re-translate the open image's alt text on a language switch (see above).
let current = null;
// The tile <button> that was activated to open the lightbox, so focus can
// be explicitly returned to it on close rather than relying on whatever
// the dialog implementation happens to do.
let trigger = null;

function initLightbox() {
  const dialog = document.querySelector('#lightbox');
  if (!dialog) return;
  const img = document.querySelector('#lightbox-img');
  const closeBtn = document.querySelector('#lightbox-close');
  const prevBtn = document.querySelector('#lightbox-prev');
  const nextBtn = document.querySelector('#lightbox-next');

  closeBtn?.addEventListener('click', () => dialog.close());
  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  // Clicking the backdrop (the dialog element itself, outside its content
  // box) closes it, matching the close-button/Escape affordances.
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    current = null;
    trigger?.focus();
    trigger = null;
  });
}

function step(delta) {
  if (current === null) return;
  // Wrap at both ends: photo 1 back-steps to PORTFOLIO_COUNT, and
  // PORTFOLIO_COUNT forward-steps to photo 1.
  const next = ((current - 1 + delta + PORTFOLIO_COUNT) % PORTFOLIO_COUNT) + 1;
  show(next);
}

function show(n) {
  current = n;
  const img = document.querySelector('#lightbox-img');
  img.src = src(n);
  img.alt = t('work.alt', { n });
}

export function openLightbox(n) {
  const dialog = document.querySelector('#lightbox');
  if (!dialog) return;
  trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  show(n);
  dialog.showModal();
}
