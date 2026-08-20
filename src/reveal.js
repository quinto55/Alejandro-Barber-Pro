// Scroll reveal and the scrolled-nav state.
//
// SAFETY CONTRACT: the hidden state (.reveal { opacity: 0 }) is applied by
// this module and by nothing else. Markup and CSS never start an element
// hidden. So if this file fails to load, throws, or runs in a browser
// without IntersectionObserver, every element simply stays visible — a
// broken reveal can never blank the page. Read that before moving .reveal
// into the HTML "to avoid a flash".
//
// Under prefers-reduced-motion nothing is hidden at all: the observer is
// never created, so content is present and static rather than animating in.

// Sections whose content is worth revealing. Several of these are rendered
// by JS after init and re-rendered on language change or "Show more", which
// is why refresh() exists and why a MutationObserver drives it.
const TARGETS = [
  '#services .service-card',
  '#work .shot',
  '#about .about-grid',
  '#about .shop-grid',
  '#reviews .review',
  '#visit .visit-grid > *',
].join(', ');

const STAGGER_MS = 60;
const STAGGER_CYCLE = 6;   // restart the stagger every N items so a long grid
                           // does not end up with a multi-second last delay
const HEADER_OFFSET_PX = 80;

let observer = null;

function reveal(el, i) {
  // dataset flag, not class presence: an element that has already animated
  // in carries .reveal.is-in, and re-observing it would restart the delay.
  if (el.dataset.reveal) return;
  el.dataset.reveal = '1';
  el.style.transitionDelay = `${(i % STAGGER_CYCLE) * STAGGER_MS}ms`;
  el.classList.add('reveal');
  observer.observe(el);
}

/** Pick up anything rendered since the last pass. Safe to call repeatedly. */
export function refreshReveal() {
  if (!observer) return;
  document.querySelectorAll(TARGETS).forEach(reveal);
}

function initScrolledNav() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const sync = () => header.classList.toggle('is-scrolled', window.scrollY > HEADER_OFFSET_PX);
  addEventListener('scroll', sync, { passive: true });
  sync();  // honour a restored scroll position on load
}

export function initReveal() {
  // The nav state is not motion, so it runs regardless of motion preference.
  initScrolledNav();

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);   // one-shot: never re-hide on scroll up
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  refreshReveal();

  // services, portfolio and reviews all re-render on 'abp:langchange', and the
  // portfolio grid also rebuilds on "Show more". Watching for added nodes
  // covers every case without each of those modules having to know this
  // module exists. Only childList is observed, so the class and inline-style
  // writes above cannot feed back into it.
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refreshReveal(); });
  }).observe(document.body, { childList: true, subtree: true });
}
