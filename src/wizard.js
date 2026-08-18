import { SERVICES } from './config.js';
import { formatDuration, formatPrice } from './services.js';
import { t } from './i18n.js';
import { mountCal, calUrlFor } from './cal-embed.js';

// Two steps now, not four. The site owns service selection; Cal.com owns the
// date/time picker, the details form, confirmation and reminders — so there
// is no local date, time, details, slots or result to track any more.
const state = { step: 1, serviceId: null };

// `vip` is selfBookable:false and stays out of the picker, exactly as before.
// On Cal.com it exists as an event type with "requires confirmation" turned
// on, so Alejandro approves each one — it is reachable from the VIP note in
// the visit section, never auto-confirmed here.
const bookable = () => SERVICES.filter(s => s.selfBookable);

function go(step) { state.step = step; render(); }

/**
 * Mutates in place rather than reassigning `state` (it's a module-level
 * `const`, and the deep-link listener registered in initWizard() closes over
 * this one object). Reassigning would leave that closure pointing at a stale
 * object.
 */
function resetState() {
  state.step = 1;
  state.serviceId = null;
}

// ---- Step indicator ---------------------------------------------------

function renderStepIndicator() {
  const stepsEl = document.querySelector('#book-steps');
  if (!stepsEl) return;
  stepsEl.replaceChildren(...[1, 2].map(n => {
    const li = document.createElement('li');
    li.className = 'book-step';
    if (n === state.step) { li.classList.add('is-current'); li.setAttribute('aria-current', 'step'); }
    else if (n < state.step) li.classList.add('is-done');
    li.textContent = `${n}. ${t(`book.step${n}`)}`;
    return li;
  }));
}

// ---- Shared nav (Back / Continue) --------------------------------------

function buildNav({ backStep = null, onNext = null, nextDisabled = false } = {}) {
  const nav = document.createElement('div');
  nav.className = 'book-nav';
  if (backStep !== null) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'btn btn-ghost';
    back.textContent = t('book.back');
    back.addEventListener('click', () => go(backStep));
    nav.append(back);
  }
  if (onNext) {
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn';
    next.textContent = t('book.next');
    next.disabled = nextDisabled;
    next.addEventListener('click', onNext);
    nav.append(next);
  }
  return nav;
}

// ---- Step 1: service picker -------------------------------------------
// A real ARIA radiogroup: role="radio" options, aria-checked, roving
// tabindex (only the selected — or first, if none yet — option is
// tabindex="0"), Left/Right/Up/Down move focus AND selection together.
// Note: these options are tagged `data-svc`, deliberately NOT
// `data-service-id` — that attribute belongs to the service-card CTAs
// and is what the deep-link delegate listener in initWizard() matches on.
// Reusing it here would make selecting a service radio also trigger the
// deep-link handler and jump straight to step 2, bypassing Continue.

function selectService(id) {
  state.serviceId = id;
  render();
  document.querySelector(`#book-panel [data-svc="${id}"]`)?.focus();
}

function handleServiceKeydown(e, services) {
  const NAV = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
  if (!(e.key in NAV)) return;
  e.preventDefault();
  const idx = services.findIndex(s => s.id === state.serviceId);
  const from = idx === -1 ? 0 : idx;
  const next = (from + NAV[e.key] + services.length) % services.length;
  selectService(services[next].id);
}

function renderStep1() {
  const panel = document.createElement('div');
  panel.className = 'book-step-panel';

  const h3 = document.createElement('h3');
  h3.textContent = t('book.pickService');
  panel.append(h3);

  const services = bookable();
  const selectedIdx = services.findIndex(s => s.id === state.serviceId);
  const rovingIdx = selectedIdx === -1 ? 0 : selectedIdx;

  const group = document.createElement('div');
  group.className = 'service-radiogroup';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', t('book.pickService'));

  services.forEach((s, i) => {
    const checked = state.serviceId === s.id;
    const opt = document.createElement('div');
    opt.className = 'service-radio' + (checked ? ' is-selected' : '');
    opt.setAttribute('role', 'radio');
    opt.setAttribute('aria-checked', String(checked));
    opt.tabIndex = i === rovingIdx ? 0 : -1;
    opt.dataset.svc = s.id;

    const name = document.createElement('span');
    name.className = 'service-radio-name';
    name.textContent = t(`svc.${s.id}.name`);

    const meta = document.createElement('span');
    meta.className = 'service-radio-meta';
    const price = document.createElement('span');
    price.className = 'service-radio-price';
    price.textContent = formatPrice(s);
    const dur = document.createElement('span');
    dur.className = 'service-radio-dur';
    dur.textContent = formatDuration(s.durationMin);
    meta.append(price, dur);

    opt.append(name, meta);
    opt.addEventListener('click', () => selectService(s.id));
    opt.addEventListener('keydown', e => handleServiceKeydown(e, services));
    group.append(opt);
  });

  panel.append(group);

  // Placed right where a client is looking at a bare "$60+" before
  // committing — exactly where the spec's stated goal ("no client arrives
  // expecting a fixed price") matters most.
  const note = document.createElement('p');
  note.className = 'book-note';
  note.textContent = t('services.note');
  panel.append(note);

  panel.append(buildNav({ onNext: () => go(2), nextDisabled: !state.serviceId }));
  return panel;
}

// ---- Step 2: Cal.com booking -------------------------------------------

function renderStep2() {
  const panel = document.createElement('div');
  panel.className = 'book-step-panel';

  const service = SERVICES.find(s => s.id === state.serviceId);
  // Reachable if a deep link carried an id that is no longer a real service.
  // Falling back to step 1 beats mounting an embed for a nonexistent slug.
  if (!service) {
    resetState();
    return renderStep1();
  }

  const h3 = document.createElement('h3');
  h3.textContent = t(`svc.${service.id}.name`);
  panel.append(h3);

  const meta = document.createElement('p');
  meta.className = 'book-cal-meta';
  meta.textContent = `${formatPrice(service)} · ${formatDuration(service.durationMin)}`;
  panel.append(meta);

  // The embed replaces this container's contents once Cal's script lands.
  // Until then (and forever, if the script is blocked) the placeholder text
  // and the fallback link below are what the client sees.
  const host = document.createElement('div');
  host.className = 'book-cal-host';
  host.textContent = t('book.calLoading');
  panel.append(host);

  const fallback = document.createElement('p');
  fallback.className = 'book-cal-fallback';
  const link = document.createElement('a');
  link.href = calUrlFor(service.id);
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('book.calFallback');
  fallback.append(link);
  panel.append(fallback);

  panel.append(buildNav({ backStep: 1 }));

  // Mount after the panel is in the document: Cal measures its container, so
  // mounting a detached node gives it nothing to size against. render()
  // appends synchronously, so a microtask is enough.
  queueMicrotask(() => {
    if (!host.isConnected) return;
    host.textContent = '';
    mountCal(host, service.id);
  });

  return panel;
}

// ---- Top-level render ---------------------------------------------------

const PANELS = { 1: renderStep1, 2: renderStep2 };

function render() {
  renderStepIndicator();
  const container = document.querySelector('#book-panel');
  if (!container) return;
  const build = PANELS[state.step] || renderStep1;
  container.replaceChildren(build());
}

// ---- Init + deep link ---------------------------------------------------

export function initWizard() {
  const preset = new URLSearchParams(location.search).get('service');
  if (preset && bookable().some(s => s.id === preset)) { state.serviceId = preset; state.step = 2; }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-service-id]');
    if (!btn) return;
    state.serviceId = btn.dataset.serviceId;
    go(2);
  });

  render();
}

// Re-translates the currently visible step without touching `state` or
// registering anything new — called on 'abp:langchange' (see app.js),
// never `initWizard()` again, which would double up the click listener
// above. Re-rendering step 2 remounts the embed in the new language.
export { render };
