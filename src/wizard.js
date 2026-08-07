import { SERVICES, BOOKING } from './config.js';
import { getAvailability, book, isMock } from './booking-api.js';
import { addDays, weekdayOf, nyParts } from './tz.js';
import { formatDuration, formatPrice } from './services.js';
import { t, currentLang } from './i18n.js';

const state = { step: 1, serviceId: null, date: null, time: null,
                details: { name: '', email: '', phone: '', notes: '' },
                slots: [], loading: false, errors: {}, result: null };
// Not part of the brief's given skeleton, but needed to disable the submit
// button and show `book.submitting` while a real `book()` call is in flight.
state.submitting = false;

const bookable = () => SERVICES.filter(s => s.selfBookable);

function go(step) { state.step = step; render(); }

async function loadSlots() {
  state.loading = true; state.time = null; render();
  try {
    state.slots = await getAvailability(state.date, state.serviceId);
  } catch { state.slots = []; state.errors.slots = 'book.error'; }
  state.loading = false; render();
}

/**
 * Mutates every field back to its initial value rather than reassigning
 * `state` (it's a module-level `const`, and every closure in this file —
 * the click/keydown handlers built during earlier renders, the deep-link
 * listener — closes over this one object). Reassigning would leave those
 * closures pointing at a stale object.
 */
function resetState() {
  state.step = 1;
  state.serviceId = null;
  state.date = null;
  state.time = null;
  state.details = { name: '', email: '', phone: '', notes: '' };
  state.slots = [];
  state.loading = false;
  state.errors = {};
  state.result = null;
  state.submitting = false;
}

// ---- Step indicator ---------------------------------------------------

function renderStepIndicator() {
  const stepsEl = document.querySelector('#book-steps');
  if (!stepsEl) return;
  stepsEl.replaceChildren(...[1, 2, 3, 4].map(n => {
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
// from Task 9 and is what the Step 6 deep-link delegate listener matches
// on. Reusing it here would make selecting a service radio also trigger
// the deep-link handler and jump straight to step 2, bypassing Continue.

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
  panel.append(buildNav({ onNext: () => go(2), nextDisabled: !state.serviceId }));
  return panel;
}

// ---- Step 2: date picker ------------------------------------------------

function monthLabel(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  // Fixed mid-month day, formatted in UTC: sidesteps any DST/timezone edge
  // case nudging the formatted month backward or forward.
  const mid = new Date(Date.UTC(y, m - 1, 15));
  return new Intl.DateTimeFormat(currentLang(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(mid);
}

function chooseDate(d) {
  if (weekdayOf(d) === 0) return; // Sundays aren't choosable.
  state.date = d;
  state.step = 3;
  state.errors.submit = null;
  state.errors.slots = null;
  loadSlots(); // sets loading + renders itself; no separate go()/render() needed here.
}

function renderStep2() {
  const panel = document.createElement('div');
  panel.className = 'book-step-panel';

  const h3 = document.createElement('h3');
  h3.textContent = t('book.pickDate');
  panel.append(h3);

  const today = nyParts(new Date()).date;
  const dates = Array.from({ length: BOOKING.horizonDays }, (_, i) => addDays(today, i));

  const list = document.createElement('div');
  list.className = 'date-list';

  let monthKey = null;
  let grid = null;
  for (const d of dates) {
    const key = d.slice(0, 7); // 'YYYY-MM'
    if (key !== monthKey) {
      monthKey = key;
      const heading = document.createElement('h4');
      heading.className = 'date-month';
      heading.textContent = monthLabel(d);
      list.append(heading);
      grid = document.createElement('div');
      grid.className = 'date-month-grid';
      list.append(grid);
    }

    const isSunday = weekdayOf(d) === 0;
    const dayNum = Number(d.slice(8, 10));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'date-btn' + (isSunday ? ' is-disabled' : '') + (state.date === d ? ' is-selected' : '');
    btn.textContent = String(dayNum);
    btn.dataset.date = d;
    btn.setAttribute('aria-label', `${t(`day.${weekdayOf(d)}`)}, ${monthLabel(d)} ${dayNum}`);

    if (isSunday) {
      btn.disabled = true;
      btn.title = t('book.closedDay');
    } else {
      btn.addEventListener('click', () => chooseDate(d));
    }
    grid.append(btn);
  }

  panel.append(list);
  panel.append(buildNav({ backStep: 1 }));
  return panel;
}

// ---- Step 3: time picker --------------------------------------------

function renderStep3() {
  const panel = document.createElement('div');
  panel.className = 'book-step-panel';

  const h3 = document.createElement('h3');
  h3.textContent = t('book.pickTime');
  panel.append(h3);

  const bannerKey = state.errors.submit || state.errors.slots;
  if (bannerKey) {
    const banner = document.createElement('p');
    banner.className = 'book-error-banner';
    banner.setAttribute('role', 'alert');
    banner.textContent = t(bannerKey);
    panel.append(banner);
  }

  if (state.loading) {
    const p = document.createElement('p');
    p.className = 'book-status';
    p.setAttribute('aria-live', 'polite');
    p.textContent = t('book.loading');
    panel.append(p);
  } else if (!state.slots.length) {
    const p = document.createElement('p');
    p.className = 'book-status';
    p.setAttribute('aria-live', 'polite');
    p.textContent = t('book.noSlots');
    panel.append(p);
  } else {
    const grid = document.createElement('div');
    grid.className = 'slot-grid';
    for (const slot of state.slots) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn' + (state.time === slot ? ' is-selected' : '');
      btn.textContent = slot;
      btn.addEventListener('click', () => {
        state.time = slot;
        state.errors.submit = null;
        go(4);
      });
      grid.append(btn);
    }
    panel.append(grid);
  }

  panel.append(buildNav({ backStep: 2 }));
  return panel;
}

// ---- Step 4: details, confirmation, success --------------------------

const FIELD_ORDER = ['name', 'email', 'phone', 'notes'];

function buildField(name, type, label, required) {
  const wrap = document.createElement('div');
  wrap.className = 'book-field';

  const errId = `book-${name}-error`;
  const labelEl = document.createElement('label');
  labelEl.htmlFor = `book-${name}`;
  labelEl.textContent = required ? `${label} *` : label;
  wrap.append(labelEl);

  const input = type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
  if (type !== 'textarea') input.type = type;
  else input.rows = 3;
  input.id = `book-${name}`;
  input.name = name;
  input.value = state.details[name] || '';
  input.setAttribute('aria-describedby', errId);
  if (required) input.required = true;

  const fieldError = state.errors.fields && state.errors.fields[name];
  if (fieldError) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');

  // Written into state on every keystroke — not read from the DOM at
  // submit time — so back-navigation and language switches (which
  // rebuild this panel from `state.details`) never lose what was typed.
  input.addEventListener('input', e => { state.details[name] = e.target.value; });

  wrap.append(input);

  const err = document.createElement('p');
  err.id = errId;
  err.className = 'book-field-error';
  if (fieldError) {
    err.textContent = t(fieldError);
  } else {
    err.hidden = true;
  }
  wrap.append(err);

  return wrap;
}

function focusFirstInvalidField(fields) {
  const first = FIELD_ORDER.find(f => fields[f]);
  if (!first) return;
  document.getElementById(`book-${first}`)?.focus();
}

async function onSubmit(e) {
  e.preventDefault();
  state.errors = {};
  state.submitting = true;
  render();

  const result = await book({
    serviceId: state.serviceId,
    date: state.date,
    time: state.time,
    name: state.details.name,
    email: state.details.email,
    phone: state.details.phone,
    notes: state.details.notes,
  });

  state.submitting = false;

  if (result.ok) {
    state.result = result;
    render();
    return;
  }

  if (result.error === 'validation') {
    state.errors = { fields: result.fields };
    render();
    focusFirstInvalidField(result.fields);
    return;
  }

  if (result.error === 'slot_taken') {
    state.errors = { submit: 'book.taken' };
    state.time = null;
    state.step = 3;
    render();
    loadSlots();
    return;
  }

  // 'network', or anything else the API seam might return.
  state.errors = { submit: 'book.error' };
  render();
}

function renderSuccess(panel) {
  const h3 = document.createElement('h3');
  h3.textContent = t('book.successTitle');
  panel.append(h3);

  const body = document.createElement('p');
  body.textContent = t('book.successBody', { email: state.details.email });
  panel.append(body);

  const startOver = document.createElement('button');
  startOver.type = 'button';
  startOver.className = 'btn';
  startOver.textContent = t('book.startOver');
  startOver.addEventListener('click', () => { resetState(); render(); });
  panel.append(startOver);

  return panel;
}

function renderStep4() {
  const panel = document.createElement('div');
  panel.className = 'book-step-panel';

  // The demo must never look like it created a real appointment — the
  // notice stays visible through submission and into the success view
  // below, since isMock() doesn't change once a booking completes.
  if (isMock()) {
    const notice = document.createElement('p');
    notice.className = 'book-mock-notice';
    notice.textContent = t('book.mockNotice');
    panel.append(notice);
  }

  if (state.result && state.result.ok) return renderSuccess(panel);

  const h3 = document.createElement('h3');
  h3.textContent = t('book.confirm');
  panel.append(h3);

  const service = SERVICES.find(s => s.id === state.serviceId);
  const summary = document.createElement('p');
  summary.className = 'book-summary';
  summary.textContent = t('book.summary', {
    service: service ? t(`svc.${service.id}.name`) : '',
    date: state.date || '',
    time: state.time || '',
  });
  panel.append(summary);

  if (state.errors.submit) {
    const banner = document.createElement('p');
    banner.className = 'book-error-banner';
    banner.setAttribute('role', 'alert');
    banner.textContent = t(state.errors.submit);
    panel.append(banner);
  }

  const form = document.createElement('form');
  form.className = 'book-form';
  form.noValidate = true;
  form.append(
    buildField('name', 'text', t('book.name'), true),
    buildField('email', 'email', t('book.email'), true),
    buildField('phone', 'tel', t('book.phone'), true),
    buildField('notes', 'textarea', t('book.notes'), false),
  );

  const nav = document.createElement('div');
  nav.className = 'book-nav';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn btn-ghost';
  back.textContent = t('book.back');
  back.addEventListener('click', () => go(3));
  nav.append(back);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn';
  submit.disabled = state.submitting;
  submit.textContent = state.submitting ? t('book.submitting') : t('book.confirm');
  nav.append(submit);

  form.append(nav);
  form.addEventListener('submit', onSubmit);

  panel.append(form);
  return panel;
}

// ---- Top-level render ---------------------------------------------------

const PANELS = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4 };

function render() {
  renderStepIndicator();
  const container = document.querySelector('#book-panel');
  if (!container) return;
  const build = PANELS[state.step] || renderStep1;
  container.replaceChildren(build());
}

// ---- Init + deep link (Step 6, brief's given code, verbatim) ---------

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
// above.
export { render };
