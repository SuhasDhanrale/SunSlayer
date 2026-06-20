import test from 'node:test';
import assert from 'node:assert/strict';
import { ComboSystem, getComboTier } from '../src/systems/ComboSystem.js';

const makeState = () => ({
  combo: 0,
  comboTimer: 0,
  comboTier: 0,
  comboLastStumble: 0,
  maxCombo: 0,
  stumble: { count: 0 },
  flashHit: 0,
  shake: 0,
});

test('combo tiers are capped at the agreed thresholds', () => {
  assert.equal(getComboTier(0), 0);
  assert.equal(getComboTier(1), 1);
  assert.equal(getComboTier(5), 2);
  assert.equal(getComboTier(10), 3);
  assert.equal(getComboTier(15), 4);
  assert.equal(getComboTier(100), 4);
});

test('successful hits build combo and timeout resets it', () => {
  const state = makeState();
  for (let i = 0; i < 15; i++) ComboSystem.registerHit(state, 'bamboo');
  assert.equal(state.combo, 15);
  assert.equal(state.maxCombo, 15);
  assert.equal(state.comboTier, 4);

  // tick now takes real elapsed seconds; 2s exceeds the 1.6s window → timeout.
  ComboSystem.tick(state, 2);
  assert.equal(state.combo, 0);
});

test('a stumble immediately breaks the active combo', () => {
  const state = makeState();
  ComboSystem.registerHit(state, 'yokai');
  state.stumble.count += 1;
  ComboSystem.tick(state, 1);
  assert.equal(state.combo, 0);
  assert.equal(state.comboTier, 0);
});
