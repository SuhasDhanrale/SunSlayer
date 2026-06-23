import test from 'node:test';
import assert from 'node:assert/strict';
import { RunDirector, advanceYokaiTrack, createYokaiTrack, nextShapeInterval } from '../src/systems/RunDirector.js';
import { pickShapeForPhase, shapesForPhase, YOKAI_SHAPES_BY_ID } from '../src/data/yokaiShapes.js';
import { PATTERNS_BY_ID } from '../src/data/patterns.js';
import { ARROW_TRAP, YOKAI_WOVEN } from '../src/config/constants.js';

// Phase 6 — the director weaves authored yokai SHAPES into the live run, keyed to
// the intensity phase, on a cadence that tightens as intensity climbs. The shape
// geometry/solver is covered by yokai-shapes/yokai-launch; here we verify the
// DIRECTOR WIRING: tier-correct selection, the escalating cadence, that shapes
// fire alongside (never instead of) the obstacle pattern, and the off-land /
// pre-intro gating.

const W = 1280;
const H = 720;

function makeState(phase, overrides = {}) {
  const track = createYokaiTrack();
  track.introComplete = true;
  track.introIndex = 4;
  track.activeSec = 100;
  track.unlockedTypes = ['oni', 'kitsune', 'noface'];
  track.phase = phase;
  track.intensity = phase === 'PEAK' ? 1 : 0.5;
  track.phaseDuration = 999; // never time out of the phase mid-test
  track.shapeTimer = 0;      // due to fire on the next tick
  Object.assign(track, overrides.track || {});
  return {
    yokaiTrack: track,
    spawnBiome: 'bamboo', biome: 'bamboo', cameraSpeed: 6,
    demons: [], coins: [], bamboo: [],
    monk: { x: 150, y: 620 },
    stumble: { count: 0, slowTimer: 0 }, shake: 0,
    boss: { active: false }, arrowTrap: null, arrowBurst: null, debris: [],
    ...overrides.state,
  };
}

function makeIntroState(overrides = {}) {
  return makeState('INTRO', {
    track: {
      introComplete: false,
      introIndex: 0,
      activeSec: 2,
      phase: 'INTRO',
      intensity: 0,
      pendingDirective: null,
      introSnackTimer: null,
      unlockedTypes: ['oni'],
      ...(overrides.track || {}),
    },
    state: overrides.state,
  });
}

function sequenceRandom(values, fallback = 0.5) {
  let i = 0;
  return () => values[i++] ?? fallback;
}

test('intro snacks use the configured first delay before spawning', () => {
  const s = makeIntroState({ track: { activeSec: 17, introIndex: 3 } });
  const random = sequenceRandom([0, 0]); // first delay min, repeat interval min
  const firstDelayFrames = Math.round(YOKAI_WOVEN.introSnack.firstDelaySec[0] * 60);

  RunDirector.tickIntroSnacks(s, firstDelayFrames - 1, W, H, random);
  assert.equal(s.demons.filter((d) => d.source === 'intro-snack').length, 0, 'not before configured first delay');

  RunDirector.tickIntroSnacks(s, 1, W, H, random);
  const snacks = s.demons.filter((d) => d.source === 'intro-snack');
  assert.equal(snacks.length, 1, 'spawns during onboarding');
  assert.equal(snacks[0].type, 'oni', 'uses the current intro unlock pool');
  assert.equal(s.yokaiTrack.introSnackTimer, YOKAI_WOVEN.introSnack.intervalSec[0]);
});

test('intro snacks repeat on the configured 0.5-2s interval range', () => {
  assert.deepEqual(YOKAI_WOVEN.introSnack.intervalSec, [0.5, 2]);

  const min = makeIntroState({ track: { introSnackTimer: 0 } });
  RunDirector.tickIntroSnacks(min, 1, W, H, sequenceRandom([0]));
  assert.equal(min.yokaiTrack.introSnackTimer, YOKAI_WOVEN.introSnack.intervalSec[0]);

  const max = makeIntroState({ track: { introSnackTimer: 0 } });
  RunDirector.tickIntroSnacks(max, 1, W, H, sequenceRandom([0.999]));
  const [minSec, maxSec] = YOKAI_WOVEN.introSnack.intervalSec;
  assert.equal(max.yokaiTrack.introSnackTimer, minSec + (maxSec - minSec) * 0.999);
});

test('intro snacks stay out of water, grove, and completed intro', () => {
  for (const biome of ['water', 'grove']) {
    const s = makeIntroState({
      track: { introSnackTimer: 0 },
      state: { spawnBiome: biome, biome, director: { biome, initialized: true } },
    });
    RunDirector.tickIntroSnacks(s, 1, W, H, () => 0);
    assert.equal(s.demons.filter((d) => d.source === 'intro-snack').length, 0, `no snack in ${biome}`);
  }

  const done = makeIntroState({ track: { introComplete: true, introSnackTimer: 0 } });
  RunDirector.tickIntroSnacks(done, 1, W, H, () => 0);
  assert.equal(done.demons.filter((d) => d.source === 'intro-snack').length, 0, 'no snack after intro');
});

test('intro snacks respect active cap and avoid scripted intro beats', () => {
  const capped = makeIntroState({ track: { introSnackTimer: 0 } });
  capped.demons = Array.from({ length: YOKAI_WOVEN.introSnack.maxActive }, () => ({ sliced: false }));
  RunDirector.tickIntroSnacks(capped, 1, W, H, () => 0);
  assert.equal(capped.demons.filter((d) => d.source === 'intro-snack').length, 0, 'cap blocks snack');

  const nearScript = makeIntroState({ track: { activeSec: 4.2, introSnackTimer: 0 } });
  RunDirector.tickIntroSnacks(nearScript, 1, W, H, () => 0);
  assert.equal(nearScript.demons.filter((d) => d.source === 'intro-snack').length, 0, 'script gap blocks snack');
  assert.ok(nearScript.yokaiTrack.introSnackTimer <= 0.25, 'blocked snack rechecks shortly');
});

test('Phase 6 — shapes are eligible by tier, keyed to the intensity phase', () => {
  assert.ok(shapesForPhase('LULL').every((shape) => shape.tier === 'LULL'));
  assert.ok(shapesForPhase('RISE').every((shape) => shape.tier === 'RISE'));
  assert.ok(shapesForPhase('PEAK').every((shape) => shape.tier === 'PEAK'));
  // FALL keeps the RISE vocabulary (readable lines/sweeps decaying), not PEAK clusters.
  assert.ok(shapesForPhase('FALL').every((shape) => shape.tier === 'RISE'));

  const riseIds = shapesForPhase('RISE').map((shape) => shape.id);
  assert.ok(riseIds.includes('train'), 'RISE fires the readable lines');
  assert.ok(!riseIds.includes('fan'), 'PEAK clusters do not leak into RISE');
});

test('Phase 6 — pickShapeForPhase avoids repeating the last shape when it can', () => {
  const first = pickShapeForPhase('PEAK', () => 0, null);
  const next = pickShapeForPhase('PEAK', () => 0, first.id);
  assert.notEqual(next.id, first.id);
});

test('Phase 6 — the cadence tightens as intensity rises', () => {
  const lull = nextShapeInterval(0, () => 0.5); // 0.5 ⇒ zero jitter, base only
  const peak = nextShapeInterval(1, () => 0.5);
  assert.ok(peak < lull, `peak gap ${peak} should be shorter than lull gap ${lull}`);
});

test('Phase 6 — the director weaves a phase-correct shape into the live run', () => {
  const s = makeState('PEAK');
  RunDirector.tick(s, 1, 100, W, H);

  assert.ok(s.demons.length > 0, 'a shape burst spawned');
  assert.ok(s.demons.every((d) => d.source === 'director'), 'all from the woven director cadence');
  assert.equal(YOKAI_SHAPES_BY_ID[s.yokaiTrack.lastShapeId].tier, 'PEAK', 'PEAK fires a PEAK-tier cluster');
  // The obstacle pattern runs concurrently — shapes never take its slot.
  assert.ok(s.pattern, 'an obstacle pattern runs alongside the shape burst');
  assert.ok(s.yokaiTrack.shapeTimer > 0, 'the next beat is rescheduled');
});

test('Phase 6 — a single tick fires exactly one shape, then waits out the cadence', () => {
  const s = makeState('RISE');
  RunDirector.tick(s, 1, 100, W, H);
  const afterFirst = s.yokaiTrack.lastShapeId;
  const count = s.demons.length;
  assert.ok(afterFirst, 'fired on the due beat');

  // Next frame the timer has not elapsed → no new shape (cap-independent: assert
  // the fired id/cadence is stable, not the roster which the cap could clamp).
  RunDirector.tick(s, 1, 100.02, W, H);
  assert.equal(s.demons.length, count, 'no second shape until the cadence elapses');
});

test('Phase 3 — the obstacle layer is locked to the yokai master phase (one wave)', () => {
  // simulate() now drives the obstacle layer off the SAME master clock the live run
  // uses, so the offline curve reflects the unified wave. Skip the opening curriculum
  // (drains by ~45s) and read the phase-driven beats.
  const events = RunDirector.simulate({}, 8, 'bamboo').filter((e) => e.t > 60);
  const byPhase = (p) => events.filter((e) => e.phase === p);
  const peakBeats = byPhase('PEAK');
  const riseBeats = byPhase('RISE');
  const lullBeats = byPhase('LULL');
  assert.ok(peakBeats.length && riseBeats.length && lullBeats.length, 'all phases exercised over 8 min');

  const avg = (xs) => xs.reduce((a, e) => a + e.intensity, 0) / xs.length;
  // PEAK ducks the obstacle layer BELOW the RISE build — the burst leads, obstacles hold a floor.
  assert.ok(avg(peakBeats) < avg(riseBeats), `PEAK ducks under the RISE build: ${avg(peakBeats)} < ${avg(riseBeats)}`);
  // LULL is a genuine valley, also under the build (a true breather, not a second peak).
  assert.ok(avg(lullBeats) < avg(riseBeats), 'LULL valley sits under the RISE build');
  // Every PEAK obstacle beat is a sparse FIELD — no authored spike/bridge grid wall under the burst.
  assert.ok(peakBeats.every((e) => PATTERNS_BY_ID[e.id].kind === 'field'), 'PEAK draws fields only');
});

test('Phase 6 — shapes do not fire off-land or before onboarding completes', () => {
  const water = makeState('PEAK', { state: { spawnBiome: 'water', biome: 'water' } });
  RunDirector.tick(water, 1, 100, W, H);
  assert.equal(water.demons.filter((d) => d.source === 'director').length, 0, 'no shapes in water');

  const intro = makeState('INTRO', {
    track: { introComplete: false, introIndex: 0, activeSec: 5 },
  });
  RunDirector.tick(intro, 1, 5, W, H);
  assert.equal(intro.demons.filter((d) => d.source === 'director').length, 0, 'no shapes during onboarding');
});

test('Phase 6 — without canvas dimensions the cadence holds (no crash, no fire)', () => {
  const s = makeState('PEAK');
  RunDirector.tick(s, 1, 100, 0, 0);
  assert.equal(s.demons.length, 0);
});

test('sealed quivers fire up to maxPerCycle in the selected Rise slot', () => {
  const s = makeState('RISE', {
    track: { arrowTaught: true, trapTargetPhase: 'RISE', trapCountThisCycle: 0, trapUsedThisCycle: false },
  });
  // Each quiver must resolve before the next, so clear the trap + roster between
  // ticks. The cycle now allows up to ARROW_TRAP.maxPerCycle (the "three cap").
  for (let n = 1; n <= ARROW_TRAP.maxPerCycle; n++) {
    s.arrowTrap = null;
    s.demons = [];
    s.yokaiTrack.shapeTimer = 0;
    RunDirector.tick(s, 1, 100 + n * 0.02, W, H);
    assert.equal(s.yokaiTrack.lastShapeId, 'sealed-train', `quiver ${n} fires`);
    assert.ok(s.arrowTrap, `quiver ${n} placed`);
    assert.equal(s.yokaiTrack.trapCountThisCycle, n);
  }

  // At the cap, the cycle schedules no further quiver.
  s.arrowTrap = null;
  s.demons = [];
  s.yokaiTrack.shapeTimer = 0;
  RunDirector.tick(s, 1, 100 + (ARROW_TRAP.maxPerCycle + 1) * 0.02, W, H);
  assert.equal(s.arrowTrap, null, 'the cycle stops at maxPerCycle quivers');
  assert.equal(s.yokaiTrack.trapCountThisCycle, ARROW_TRAP.maxPerCycle);
});

test('a missed Rise opportunity is forced into the next Peak shape slot', () => {
  const s = makeState('PEAK', {
    track: { arrowTaught: true, trapTargetPhase: 'RISE', trapCountThisCycle: 0, trapUsedThisCycle: false },
  });
  RunDirector.tick(s, 1, 100, W, H);
  assert.equal(s.yokaiTrack.lastShapeId, 'sealed-fan');
  assert.equal(s.arrowTrap?.tier, 'PEAK');
  assert.equal(s.demons.length, 4);
});

test('each cycle selects Rise or Peak using the configured phase probability', () => {
  const peak = createYokaiTrack();
  Object.assign(peak, { introComplete: true, phase: 'LULL', phaseDuration: 0, lastBiome: 'bamboo' });
  const peakRolls = [0.5, 0.49];
  advanceYokaiTrack(peak, 1, 'bamboo', () => peakRolls.shift() ?? 0.5);
  assert.equal(peak.phase, 'RISE');
  assert.equal(peak.trapTargetPhase, 'PEAK');

  const rise = createYokaiTrack();
  Object.assign(rise, { introComplete: true, phase: 'LULL', phaseDuration: 0, lastBiome: 'bamboo' });
  const riseRolls = [0.5, 0.51];
  advanceYokaiTrack(rise, 1, 'bamboo', () => riseRolls.shift() ?? 0.5);
  assert.equal(rise.trapTargetPhase, 'RISE');
});

test('sealed quivers are excluded from Lull, Fall, Grove, and active Samurai pressure', () => {
  for (const phase of ['LULL', 'FALL']) {
    const s = makeState(phase, {
      track: { arrowTaught: true, trapTargetPhase: 'RISE', trapCountThisCycle: 0, trapUsedThisCycle: false },
    });
    RunDirector.tick(s, 1, 100, W, H);
    assert.equal(s.arrowTrap, null, `no trap during ${phase}`);
  }

  const grove = makeState('PEAK', {
    state: { spawnBiome: 'grove', biome: 'grove', grovePayload: 'coins' },
    track: { arrowTaught: true, trapTargetPhase: 'PEAK', trapCountThisCycle: 0, trapUsedThisCycle: false },
  });
  RunDirector.tick(grove, 1, 100, W, H);
  assert.equal(grove.arrowTrap, null);

  const samurai = makeState('PEAK', {
    state: { samurai: { stage: 'watching' } },
    track: { arrowTaught: true, trapTargetPhase: 'PEAK', trapCountThisCycle: 0, trapUsedThisCycle: false },
  });
  RunDirector.tick(samurai, 1, 100, W, H);
  assert.equal(samurai.arrowTrap, null);
});
