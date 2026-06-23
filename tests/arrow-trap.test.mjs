import test from 'node:test';
import assert from 'node:assert/strict';
import { ArrowSystem } from '../src/systems/ArrowSystem.js';
import { ARROW_TRAP } from '../src/config/constants.js';

const W = 1280;
const H = 720;

function makeState() {
  return {
    monk: { x: 150, y: 620 },
    boss: { active: false },
    arrowTrap: null,
    arrowBurst: null,
    arrowLessonSeen: false,
    yokaiTrack: { arrowTaught: false },
    cameraSpeed: 6,
    combo: 8,
    comboTimer: 1,
    comboTier: 2,
    maxCombo: 8,
    stumble: { count: 0, slowTimer: 0, incidentGraceTimer: 0 },
    samurai: { graceTimer: 0 },
    debris: [],
    hitPause: 0,
    shake: 0,
    flashHit: 0,
    flashColor: '',
  };
}

function spawnCuttableTrap(s, tier = 'RISE') {
  const trap = ArrowSystem.spawnTrap(s, { x: 500, y: 300, tier, tutorial: tier === 'TUTORIAL' });
  trap.slashable = true;
  return trap;
}

test('an intact tutorial quiver passes harmlessly and marks the run-once lesson seen', () => {
  const s = makeState();
  ArrowSystem.spawnTrap(s, { x: -200, y: 300, tier: 'TUTORIAL', tutorial: true, worldAnchored: true });
  ArrowSystem.tick(s, 1, 1, W, H);
  assert.equal(s.arrowTrap, null);
  assert.equal(s.arrowBurst, null);
  assert.equal(s.stumble.count, 0);
  assert.equal(s.arrowLessonSeen, true);
  assert.equal(s.yokaiTrack.arrowTaught, true);
});

test('cutting a Rise quiver breaks combo and emits the Rise arrow count at the precise cut origin', () => {
  const s = makeState();
  const trap = spawnCuttableTrap(s, 'RISE');
  assert.equal(ArrowSystem.triggerBurst(s, trap, W, H), true);
  assert.equal(s.combo, 0);
  assert.equal(s.hitPause, ARROW_TRAP.hitPauseFrames);
  assert.deepEqual(s.arrowBurst.origin, { x: 500, y: 300 });
  assert.equal(s.arrowBurst.arrows.length, ARROW_TRAP.riseArrows);
  assert.ok(s.arrowBurst.arrows.every((arrow) => arrow.x === 500 && arrow.y === 300));
});

test('Peak quivers emit the Peak arrow count', () => {
  const s = makeState();
  ArrowSystem.triggerBurst(s, spawnCuttableTrap(s, 'PEAK'), W, H);
  assert.equal(s.arrowBurst.arrows.length, ARROW_TRAP.peakArrows);
});

test('deflecting every in-flight arrow resolves the burst without a stumble or reward mutation', () => {
  const s = makeState();
  ArrowSystem.triggerBurst(s, spawnCuttableTrap(s), W, H);
  const maxComboBefore = s.maxCombo;
  // Arrows are only deflectable once airborne past the grace buffer (the no-cut
  // window that stops the seal-breaking stroke from instantly clearing them).
  for (const arrow of s.arrowBurst.arrows) {
    arrow.state = 'flying';
    arrow.flyAge = ARROW_TRAP.cutGraceFrames;
    ArrowSystem.cutArrow(s, arrow);
  }
  ArrowSystem.tick(s, 1, 1, W, H);
  assert.equal(s.arrowBurst, null);
  assert.equal(s.stumble.count, 0);
  assert.equal(s.combo, 0);
  assert.equal(s.maxCombo, maxComboBefore);
});

test('the first arrow impact spends one incident and dissolves every remaining arrow', () => {
  const s = makeState();
  ArrowSystem.triggerBurst(s, spawnCuttableTrap(s, 'PEAK'), W, H);
  const burst = s.arrowBurst;
  burst.phase = 'launch';
  const first = burst.arrows[0];
  first.state = 'flying';
  first.x = s.monk.x;
  first.y = s.monk.y - 20;
  first.vx = 0;
  first.vy = 0;
  ArrowSystem.tick(s, 1, 1, W, H);
  assert.equal(s.stumble.count, 1);
  assert.equal(s.stumble.lastSource, 'arrow-burst');
  assert.equal(s.arrowBurst, null);
  assert.ok(burst.arrows.every((arrow) => arrow.resolution), 'all other arrows dissolve immediately');
});

test('staged and freshly-launched arrows cannot be deflected until past the grace buffer', () => {
  const s = makeState();
  ArrowSystem.triggerBurst(s, spawnCuttableTrap(s), W, H);
  const arrow = s.arrowBurst.arrows[0];
  // Telegraph phase (staging): never cuttable.
  assert.equal(ArrowSystem.cutArrow(s, arrow), false);
  // Just launched, still inside the grace window: not yet cuttable.
  arrow.state = 'flying';
  arrow.flyAge = ARROW_TRAP.cutGraceFrames - 1;
  assert.equal(ArrowSystem.cutArrow(s, arrow), false);
  // Past the buffer: now a valid skill-based deflect.
  arrow.flyAge = ARROW_TRAP.cutGraceFrames;
  assert.equal(ArrowSystem.cutArrow(s, arrow), true);
});

test('a Focus path can cut the trap but cannot clear the newly-created burst in the same stroke', () => {
  const s = makeState();
  spawnCuttableTrap(s);
  const result = ArrowSystem.tryCutPath(s, [{ x: 400, y: 300 }, { x: 600, y: 300 }], W, H);
  assert.equal(result.trapCut, true);
  assert.equal(result.arrowsCut, 0);
  assert.equal(s.arrowBurst.arrows.filter((arrow) => !arrow.resolution).length, ARROW_TRAP.riseArrows);
});
