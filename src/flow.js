// The booking wizard's shape and state, without any DOM.
//
// A booking has two or three steps. The add-ons step exists only for
// services that offer add-ons, and only once ADDONS_LIVE (config.js) says
// Cal is set up to honour the duration we would send — before that, Cal
// ignores the param and would book the base length under a client who
// believes they added a facial. Design:
// docs/superpowers/specs/2026-09-23-add-ons-design.md, §6.
import { SERVICES, ADDONS_LIVE } from './config.js';

export const STEP_SERVICE = 'service';
export const STEP_ADDONS = 'addons';
export const STEP_CAL = 'cal';

/**
 * The steps for a chosen service, or for none yet. With no (or an unknown)
 * service the longest possible list is returned, so the indicator does not
 * grow when a haircut is picked. `live` is a parameter only so tests can
 * pin both sides of the gate without editing config.
 */
export function stepsFor(serviceId, live = ADDONS_LIVE) {
  if (!live) return [STEP_SERVICE, STEP_CAL];
  const service = SERVICES.find(s => s.id === serviceId);
  const offers = service
    ? service.addons.length > 0
    : SERVICES.some(s => s.selfBookable && s.addons.length > 0);
  return offers ? [STEP_SERVICE, STEP_ADDONS, STEP_CAL] : [STEP_SERVICE, STEP_CAL];
}

export function stepAfter(steps, key) {
  const i = steps.indexOf(key);
  return i === -1 || i === steps.length - 1 ? null : steps[i + 1];
}

export function stepBefore(steps, key) {
  const i = steps.indexOf(key);
  return i <= 0 ? null : steps[i - 1];
}

export function createState() {
  return { step: STEP_SERVICE, serviceId: null, addons: new Set() };
}

/**
 * Switching to a different service drops any add-ons ticked for the old
 * one: they were priced and timed against that service. Re-picking the
 * same service (Back, then Continue) keeps them.
 */
export function chooseService(state, id) {
  if (id !== state.serviceId) state.addons.clear();
  state.serviceId = id;
}

export function toggleAddon(state, id, on) {
  if (on) state.addons.add(id);
  else state.addons.delete(id);
}

// In place, never a reassignment: the wizard's deep-link click listener
// closes over the one state object for the life of the page.
export function resetState(state) {
  state.step = STEP_SERVICE;
  state.serviceId = null;
  state.addons.clear();
}
