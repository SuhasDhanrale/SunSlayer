import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { bus } from '../src/core/bus.js';

// Capture every combo:multicut emitted while `fn` runs (the bus is a singleton;
// SoundSystem isn't attached in tests, so we're the only listener).
const captureMultiCuts = (fn) => {
  const seen = [];
  const on = (e) => seen.push(e);
  bus.on('combo:multicut', on);
  try { fn(); } finally { bus.off('combo:multicut', on); }
  return seen;
};

// Minimal state for CombatSystem.tick: a blade that lerps toward the mouse, and
// whatever sliceDemon → registerHit → dropFromYokai touch downstream.
const makeCombatState = (demons) => ({
  monk: { x: 150 }, cameraSpeed: 0,
  focus: { active: false, energy: 0, path: [] },
  boss: { active: false, type: '', phase: '' },
  sword: { x: 1000, y: 220, trail: [{ x: 1000, y: 220 }, { x: 1000, y: 220 }], isSlashing: false },
  mouse: { x: 1000, y: 220 },
  bamboo: [], demons, coins: [], arrowTrap: null, arrowBurst: null,
  yokaiCoinDrops: [], debris: [],
  combo: 0, comboTimer: 0, comboTier: 0, maxCombo: 0,
  stumble: { count: 0 },
  hitPause: 0, shake: 0, flashHit: 0, flashColor: '',
  stroke: null, multiCut: null, multiCutSeq: 0,
});

const demon = (x) => ({ x, y: 220, vx: 0, vy: 0, gravity: 0, radius: 35, rot: 0, rv: 0, type: 'oni', sliced: false });

test('Phase 5 — one stroke through 3 yokai fires exactly one ×3 multi-cut', () => {
  const s = makeCombatState([demon(700), demon(800), demon(900)]);

  const emits = captureMultiCuts(() => {
    // Rising edge: a fast swipe far left opens the stroke; the horizontal slash
    // segment sweeps all three yokai in this one frame.
    s.mouse.x = 300; s.mouse.y = 220;
    CombatSystem.tick(s, 1, 1, 1280, 720);
    assert.equal(s.stroke.active, true);
    assert.equal(s.stroke.count, 3);
    assert.equal(s.multiCut, null); // not raised until the stroke closes

    // Falling edge: blade catches up to the cursor (no movement) → stroke closes.
    s.mouse.x = s.sword.x; s.mouse.y = s.sword.y;
    CombatSystem.tick(s, 1, 1, 1280, 720);
  });

  assert.equal(emits.length, 1);       // exactly ONE burst, not one per yokai
  assert.equal(emits[0].count, 3);
  assert.equal(s.multiCut.count, 3);
  assert.equal(s.stroke.active, false);
});

test('Phase 5 — closeStroke raises only on N≥2 and ids each burst', () => {
  const base = () => ({ multiCutSeq: 0, multiCut: null, stroke: null });

  // count 1 → no multi-cut, stroke still closes
  let s = base(); s.stroke = { active: true, count: 1 };
  let emits = captureMultiCuts(() => CombatSystem.closeStroke(s));
  assert.equal(emits.length, 0);
  assert.equal(s.multiCut, null);
  assert.equal(s.stroke.active, false);

  // an already-closed stroke is a no-op
  s = base(); s.stroke = { active: false, count: 5 };
  emits = captureMultiCuts(() => CombatSystem.closeStroke(s));
  assert.equal(emits.length, 0);
  assert.equal(s.multiCut, null);

  // count 3 → raises once with a fresh id; a later raise advances the id so the
  // HUD replays the pop even at the same count.
  s = base(); s.stroke = { active: true, count: 3 };
  emits = captureMultiCuts(() => CombatSystem.closeStroke(s));
  assert.equal(emits.length, 1);
  assert.equal(s.multiCut.count, 3);
  assert.equal(s.multiCut.id, 1);
  CombatSystem.raiseMultiCut(s, 2);
  assert.equal(s.multiCut.id, 2);
  assert.equal(s.multiCut.count, 2);
});

test('Phase 5 — single-cut strokes never multi-cut, even back to back', () => {
  // A slow drag that catches yokai across SEPARATE flicks stays separate cuts.
  const s = { multiCutSeq: 0, multiCut: null, stroke: null };
  const emits = captureMultiCuts(() => {
    s.stroke = { active: true, count: 1 }; CombatSystem.closeStroke(s);
    s.stroke = { active: true, count: 1 }; CombatSystem.closeStroke(s);
  });
  assert.equal(emits.length, 0);
  assert.equal(s.multiCut, null);
});
