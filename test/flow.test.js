import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP_SERVICE, STEP_ADDONS, STEP_CAL,
  stepsFor, stepAfter, stepBefore,
  createState, chooseService, toggleAddon, resetState,
} from '../src/flow.js';

test('gate off: two steps for every service, exactly as before the feature', () => {
  for (const id of ['haircut', 'haircut-beard', 'kids', 'platinum', 'color', null]) {
    assert.deepEqual(stepsFor(id, false), [STEP_SERVICE, STEP_CAL], `gate off, ${id}`);
  }
});

test('gate on: the three haircuts get an add-ons step; colour and platinum do not', () => {
  for (const id of ['haircut', 'haircut-beard', 'kids']) {
    assert.deepEqual(stepsFor(id, true), [STEP_SERVICE, STEP_ADDONS, STEP_CAL], id);
  }
  for (const id of ['platinum', 'color']) {
    assert.deepEqual(stepsFor(id, true), [STEP_SERVICE, STEP_CAL], id);
  }
});

test('gate on with nothing chosen yet shows the three-step list, so the indicator does not jump', () => {
  assert.deepEqual(stepsFor(null, true), [STEP_SERVICE, STEP_ADDONS, STEP_CAL]);
});

test('an unknown service id behaves like nothing chosen', () => {
  assert.deepEqual(stepsFor('ghost', true), [STEP_SERVICE, STEP_ADDONS, STEP_CAL]);
  assert.deepEqual(stepsFor('ghost', false), [STEP_SERVICE, STEP_CAL]);
});

test('a Book button or deep link for a service without add-ons lands on Cal, never on an empty add-ons step', () => {
  assert.equal(stepAfter(stepsFor('platinum', true), STEP_SERVICE), STEP_CAL);
  assert.equal(stepAfter(stepsFor('haircut', true), STEP_SERVICE), STEP_ADDONS);
  assert.equal(stepAfter(stepsFor('haircut', false), STEP_SERVICE), STEP_CAL);
});

test('stepAfter / stepBefore walk the list and return null at the ends', () => {
  const three = [STEP_SERVICE, STEP_ADDONS, STEP_CAL];
  assert.equal(stepAfter(three, STEP_SERVICE), STEP_ADDONS);
  assert.equal(stepAfter(three, STEP_ADDONS), STEP_CAL);
  assert.equal(stepAfter(three, STEP_CAL), null);
  assert.equal(stepBefore(three, STEP_CAL), STEP_ADDONS);
  assert.equal(stepBefore(three, STEP_ADDONS), STEP_SERVICE);
  assert.equal(stepBefore(three, STEP_SERVICE), null);
  assert.equal(stepAfter(three, 'nonsense'), null);
  const two = [STEP_SERVICE, STEP_CAL];
  assert.equal(stepAfter(two, STEP_SERVICE), STEP_CAL);
  assert.equal(stepBefore(two, STEP_CAL), STEP_SERVICE);
});

test('createState starts on the service step with nothing chosen', () => {
  assert.deepEqual(createState(), { step: STEP_SERVICE, serviceId: null, addons: new Set() });
});

test('chooseService clears add-ons only when the service actually changes', () => {
  const s = createState();
  chooseService(s, 'haircut');
  toggleAddon(s, 'facial', true);
  toggleAddon(s, 'design', true);
  chooseService(s, 'haircut');
  assert.deepEqual([...s.addons], ['facial', 'design'], 're-picking the same service keeps the ticks');
  chooseService(s, 'kids');
  assert.equal(s.serviceId, 'kids');
  assert.deepEqual([...s.addons], [], 'a different service drops them');
});

test('toggleAddon adds and removes without duplicates', () => {
  const s = createState();
  toggleAddon(s, 'wash', true);
  toggleAddon(s, 'wash', true);
  assert.deepEqual([...s.addons], ['wash']);
  toggleAddon(s, 'wash', false);
  toggleAddon(s, 'wash', false);
  assert.deepEqual([...s.addons], []);
});

test('resetState mutates the same object — the deep-link listener closes over it', () => {
  const s = createState();
  chooseService(s, 'haircut');
  toggleAddon(s, 'wash', true);
  s.step = STEP_CAL;
  const same = s;
  resetState(s);
  assert.equal(s, same);
  assert.deepEqual(s, { step: STEP_SERVICE, serviceId: null, addons: new Set() });
});
