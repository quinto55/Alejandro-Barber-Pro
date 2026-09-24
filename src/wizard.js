import { SERVICES } from './config.js';
import { formatDuration, formatPrice } from './services.js';
import { t } from './i18n.js';
import { mountCal, calUrlFor } from './cal-embed.js';
import { addonsFor, totalsFor, notesFor } from './addons.js';
import {
  STEP_SERVICE, STEP_ADDONS, STEP_CAL,
  stepsFor, stepAfter, stepBefore,
  createState, chooseService, toggleAddon, resetState,
} from './flow.js';

// Up to three steps: Service, Add-ons, Date & time. The site owns the first
// two; Cal.com owns everything after — availability, the date/time picker,
// the details form, confirmation and reminders. Which steps a booking has
// is flow.js's call: add-ons appear only for services that offer them, and
// only once ADDONS_LIVE (config.js) says Cal is ready to honour them.
//
// `state` is a module-level const that the deep-link listener in
// initWizard() closes over, so every transition mutates it in place (the
// flow.js helpers do) rather than reassigning it.
const state = createState();

// `vip` is selfBookable:false and stays out of the picker. On Cal.com it has
// "requires confirmation" turned on, so Alejandro approves each one — it is
// reachable from the VIP note in the visit section, never auto-confirmed here.
const bookable = () => SERVICES.filter(s => s.selfBookable);
const currentService = () => SERVICES.find(s => s.id === state.serviceId);
const steps = () => stepsFor(state.serviceId);
/** True when this booking's path includes the add-ons step. */
const addonsInPlay = () => steps().includes(STEP_ADDONS);

function go(step) { state.step = step; render(); }

// ---- Step indicator ---------------------------------------------------

function renderStepIndicator() {
  const stepsEl = document.querySelector('#book-steps');
  if (!stepsEl) return;
  const list = steps();
  const at = list.indexOf(state.step);
  stepsEl.replaceChildren(...list.map((key, i) => {
    const li = document.createElement('li');
    li.className = 'book-step';
    if (i === at) { li.classList.add('is-current'); li.setAttribute('aria-current', 'step'); }
    else if (i < at) li.classList.add('is-done');
    li.textContent = `${i + 1}. ${t(`book.step.${key}`)}`;
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

// ---- Service step -----------------------------------------------------
// A real ARIA radiogroup: role="radio" options, aria-checked, roving
// tabindex (only the selected — or first, if none yet — option is
// tabindex="0"), Left/Right/Up/Down move focus AND selection together.
// Note: these options are tagged `data-svc`, deliberately NOT
// `data-service-id` — that attribute belongs to the service-card CTAs
// and is what the deep-link delegate listener in initWizard() matches on.
// Reusing it here would make selecting a service radio also trigger the
// deep-link handler and jump ahead, bypassing Continue.

function selectService(id) {
  chooseService(state, id);
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

function renderServiceStep() {
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

  panel.append(buildNav({
    onNext: () => go(stepAfter(steps(), STEP_SERVICE)),
    nextDisabled: !state.serviceId,
  }));
  return panel;
}

// ---- Add-ons step -----------------------------------------------------
// A plain checklist: native checkboxes inside labels, so keyboard and
// screen-reader behaviour come for free. The running total talks in the
// BOOKED length (what Cal will block), not the raw sum, so this panel and
// Cal's own panel on the next step never disagree — spec §3.4.

function renderTotal(el, service) {
  const totals = totalsFor(service, state.addons);
  el.textContent = `${t('book.total')}: ${t(`svc.${service.id}.name`)} · ${formatPrice(totals)} · ${formatDuration(totals.booked)}`;
}

function renderAddonsStep() {
  const service = currentService();
  // Reachable only if state was rebuilt around a service that has no
  // add-ons step (a deep link to platinum while on this step, say).
  if (!service || !addonsInPlay()) {
    resetState(state);
    return renderServiceStep();
  }

  const panel = document.createElement('div');
  panel.className = 'book-step-panel';

  const h3 = document.createElement('h3');
  h3.textContent = t('book.pickAddons');
  panel.append(h3);

  const hint = document.createElement('p');
  hint.className = 'book-note';
  hint.textContent = t('book.addonsHint');
  panel.append(hint);

  const total = document.createElement('p');
  total.className = 'book-total';

  const list = document.createElement('div');
  list.className = 'addon-list';
  for (const addon of addonsFor(service)) {
    const row = document.createElement('label');
    row.className = 'addon-row';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'addon-check';
    box.checked = state.addons.has(addon.id);
    box.addEventListener('change', () => {
      toggleAddon(state, addon.id, box.checked);
      row.classList.toggle('is-selected', box.checked);
      renderTotal(total, service);
    });

    const text = document.createElement('span');
    text.className = 'addon-text';
    const name = document.createElement('span');
    name.className = 'addon-name';
    name.textContent = t(`addon.${addon.id}.name`);
    text.append(name);
    if (addon.descKey) {
      const desc = document.createElement('span');
      desc.className = 'addon-desc';
      desc.textContent = t(addon.descKey);
      text.append(desc);
    }
    const plus = document.createElement('span');
    plus.className = 'addon-plus';
    plus.textContent = t('book.addonPlus', { n: addon.min });
    text.append(plus);

    const price = document.createElement('span');
    price.className = 'addon-price';
    price.textContent = formatPrice({ priceFrom: addon.price, plus: false });

    row.classList.toggle('is-selected', box.checked);
    row.append(box, text, price);
    list.append(row);
  }
  panel.append(list);

  renderTotal(total, service);
  panel.append(total);

  // Continue is never disabled: nothing ticked is a valid choice.
  panel.append(buildNav({ backStep: STEP_SERVICE, onNext: () => go(STEP_CAL) }));
  return panel;
}

// ---- Cal.com step -----------------------------------------------------

function renderCalStep() {
  const service = currentService();
  // Reachable if a deep link carried an id that is no longer a real service.
  // Falling back to the service step beats mounting an embed for a
  // nonexistent slug.
  if (!service) {
    resetState(state);
    return renderServiceStep();
  }

  const panel = document.createElement('div');
  panel.className = 'book-step-panel';

  const h3 = document.createElement('h3');
  h3.textContent = t(`svc.${service.id}.name`);
  panel.append(h3);

  // With add-ons in play the header talks in the booked length so it agrees
  // with what Cal shows underneath (60, not 55), and Cal is handed that
  // length plus the note. Otherwise Cal is still booking the true length,
  // the header says so, and nothing is handed over — exactly as before.
  const meta = document.createElement('p');
  meta.className = 'book-cal-meta';
  let params = {};
  let picked = [];
  if (addonsInPlay()) {
    const totals = totalsFor(service, state.addons);
    meta.textContent = `${formatPrice(totals)} · ${formatDuration(totals.booked)}`;
    params = { duration: totals.booked, notes: notesFor(state.addons) };
    picked = addonsFor(service).filter(a => state.addons.has(a.id));
  } else {
    meta.textContent = `${formatPrice(service)} · ${formatDuration(service.durationMin)}`;
  }
  panel.append(meta);

  if (picked.length) {
    const ul = document.createElement('ul');
    ul.className = 'book-cal-addons';
    for (const a of picked) {
      const li = document.createElement('li');
      li.textContent = `${t(`addon.${a.id}.name`)} · ${formatPrice({ priceFrom: a.price, plus: false })} · ${t('book.addonPlus', { n: a.min })}`;
      ul.append(li);
    }
    panel.append(ul);
  }

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
  link.href = calUrlFor(service.id, params);
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('book.calFallback');
  fallback.append(link);
  panel.append(fallback);

  panel.append(buildNav({ backStep: stepBefore(steps(), STEP_CAL) }));

  // Mount after the panel is in the document: Cal measures its container, so
  // mounting a detached node gives it nothing to size against. render()
  // appends synchronously, so a microtask is enough.
  queueMicrotask(() => {
    if (!host.isConnected) return;
    host.textContent = '';
    mountCal(host, service.id, params);
  });

  return panel;
}

// ---- Top-level render ---------------------------------------------------

const PANELS = {
  [STEP_SERVICE]: renderServiceStep,
  [STEP_ADDONS]: renderAddonsStep,
  [STEP_CAL]: renderCalStep,
};

function render() {
  const container = document.querySelector('#book-panel');
  if (!container) return;
  // Build the panel before the indicator: a step can bounce back to the
  // service step (missing service), and the indicator must show where we
  // actually landed.
  const build = PANELS[state.step] || renderServiceStep;
  const panel = build();
  renderStepIndicator();
  container.replaceChildren(panel);
}

// ---- Init + deep link ---------------------------------------------------

/**
 * Service-card "Book" buttons and the ?service= deep link: pick the service
 * and land on whatever comes next for it — add-ons if it offers them and
 * the gate is open, otherwise Cal.
 */
function jumpTo(id) {
  chooseService(state, id);
  state.step = stepAfter(steps(), STEP_SERVICE);
}

export function initWizard() {
  const preset = new URLSearchParams(location.search).get('service');
  if (preset && bookable().some(s => s.id === preset)) jumpTo(preset);

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-service-id]');
    if (!btn) return;
    jumpTo(btn.dataset.serviceId);
    render();
  });

  render();
}

// Re-translates the currently visible step without touching `state` or
// registering anything new — called on 'abp:langchange' (see app.js),
// never `initWizard()` again, which would double up the click listener
// above. Re-rendering the Cal step remounts the embed in the new language
// with the same duration and note.
export { render };
