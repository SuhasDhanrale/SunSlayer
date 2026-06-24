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

test('each cut scores base × combo-tier multiplier so combos dominate distance', () => {
  const state = makeState();
  // tiers: ×1 (combo 1-4), ×1, ×2 (5-9), ×3 (10-14), ×4 (15+). base = 10.
  // First 4 cuts: tier 1 → +10 each = 40.
  for (let i = 0; i < 4; i++) ComboSystem.registerHit(state, 'bamboo');
  assert.equal(state.score, 40);
  // 5th cut crosses into tier 2 → +20.
  ComboSystem.registerHit(state, 'bamboo');
  assert.equal(state.score, 60);
  // Reaching tier 4 (15th cut) scores +40 on that single cut.
  for (let i = state.combo; i < 14; i++) ComboSystem.registerHit(state, 'bamboo');
  const before = state.score;
  ComboSystem.registerHit(state, 'bamboo'); // 15th → tier 4
  assert.equal(state.comboTier, 4);
  assert.equal(state.score - before, 40);
});
