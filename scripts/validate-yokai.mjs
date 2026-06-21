import assert from 'node:assert/strict';
import { PATTERNS, PATTERNS_BY_ID } from '../src/data/patterns.js';
import { compilePattern, PatternRunner } from '../src/systems/PatternRunner.js';
import {
  advanceYokaiTrack, createYokaiTrack, finishYokaiPeak, YOKAI_INTRO_SCRIPT,
} from '../src/systems/RunDirector.js';
import { DemonSystem } from '../src/systems/DemonSystem.js';

const fixed = () => 0;
const makeState = (track = createYokaiTrack()) => ({
  yokaiTrack: track, spawnBiome: 'bamboo', biome: 'bamboo', cameraSpeed: 6,
  demons: [], bamboo: [], coins: [], monk: { x: 150, y: 620 },
  stumble: { count: 0, slowTimer: 0 }, shake: 0, combo: 0, comboTimer: 0,
});
const blank = {
  id: 'validation-blank', category: 'teach', kind: 'grid', biomes: ['bamboo'],
  art: 'H .\nA .\nM .\nL .\nG .',
};
function emitPending(state) {
  PatternRunner.start(state, compilePattern(blank, 0, { biome: 'bamboo', random: fixed }));
  PatternRunner.tick(state, 0, 1000, 720);
}
function lcg(seed = 1) {
  let value = seed >>> 0;
  return () => ((value = (1664525 * value + 1013904223) >>> 0) / 0x100000000);
}
function symbols(pattern) {
  if (pattern.kind === 'field') return Object.keys(pattern.mix).filter((token) => token === 'x' || token === 'R');
  return String(pattern.art).split(/\s+/).filter((token) => token === 'x' || token === 'R');
}

// Opening emissions and ordered roster onboarding.
{
  const state = makeState();
  const emitted = [];
  for (let second = 1; second <= 66; second++) {
    advanceYokaiTrack(state.yokaiTrack, 1, 'bamboo', fixed);
    if (state.yokaiTrack.pendingDirective) {
      emitPending(state);
      emitted.push(...state.demons.map((enemy) => ({ second, type: enemy.type, source: enemy.source })));
      state.demons.length = 0;
    }
  }
  assert.ok(emitted.some((event) => event.second >= 5 && event.second <= 8 && event.type === 'oni'));
  assert.deepEqual(state.yokaiTrack.stats.introEmitted.slice(0, 4).map((event) => event.id), YOKAI_INTRO_SCRIPT.map((event) => event.id));
  assert.equal(state.yokaiTrack.stats.introEmitted[4].id, 'kitsune-solo');
  assert.equal(state.yokaiTrack.stats.introEmitted[5].id, 'noface-solo');
  assert.deepEqual(state.yokaiTrack.unlockedTypes, ['oni', 'kitsune', 'noface']);
}

// Phase order and one completed swarm per peak.
{
  const track = createYokaiTrack();
  track.activeSec = 28;
  track.introIndex = 4;
  track.introComplete = true;
  track.phase = 'LULL';
  track.phaseDuration = 6;
  track.phaseFrom = 0.05;
  track.intensity = 0.05;
  const seen = ['LULL'];
  for (let i = 0; i < 40 && track.phase !== 'PEAK'; i++) {
    const before = track.phase;
    advanceYokaiTrack(track, 0.5, 'bamboo', fixed);
    if (track.phase !== before) seen.push(track.phase);
  }
  assert.deepEqual(seen.slice(0, 3), ['LULL', 'RISE', 'PEAK']);
  assert.equal(track.swarmPending, true);
  finishYokaiPeak(track, fixed);
  assert.equal(track.phase, 'FALL');
  assert.equal(track.stats.swarmCount, 1);
}

// Injection probability, one-per-column, and exclusive column rejection.
{
  const pattern = {
    id: 'inject-test', category: 'combo', kind: 'grid', biomes: ['bamboo'],
    art: 'H . . . . .\nA . a . . .\nM . . = . .\nL . . . K x\nG . . . . .',
  };
  const compiled = compilePattern(pattern, 1, {
    biome: 'bamboo', yokaiIntensity: 1, allowWoven: true, typeIds: ['oni'], random: fixed,
  });
  assert.equal(compiled.injectionProbability, 0.3);
  assert.equal(compiled.columns[0].filter((cell) => cell.sym === 'x').length, 1);
  for (const index of [1, 2, 3, 4]) assert.equal(compiled.columns[index].filter((cell) => cell.sym === 'x').length, index === 4 ? 1 : 0);
}

// One-pass swarm metadata, burst groups, and shared cap.
{
  const small = PATTERNS_BY_ID['food-yokai-pop'];
  const large = PATTERNS_BY_ID['combo-yokai-swarm'];
  assert.equal(small.once && small.yokaiOnly, true);
  assert.equal(large.once && large.yokaiOnly, true);
  assert.deepEqual(small.burst, [1, 2]);
  assert.deepEqual(large.burst, [1, 3]);
  assert.equal(small.cap, 7);
  assert.equal(large.cap, 7);
  const state = makeState();
  DemonSystem.spawnWave(state, 1000, 720, 7, { typeIds: ['oni'], random: fixed });
  PatternRunner.start(state, compilePattern(large, 1, { biome: 'bamboo', typeIds: ['oni'], random: fixed }));
  while (!PatternRunner.tick(state, 1000, 1000, 720)) {}
  assert.equal(state.demons.length, 7);
}

// Water has no authored or injected Yokai/raft, pauses time, and exits at LULL.
{
  for (const pattern of PATTERNS.filter((entry) => entry.biomes.includes('water'))) {
    assert.equal(symbols(pattern).length, 0, `${pattern.id} contains a water Yokai/raft symbol`);
  }
  const compiled = compilePattern(blank, 1, { biome: 'water', yokaiIntensity: 1, allowWoven: true, random: fixed });
  assert.equal(compiled.injectedYokai, 0);
  const track = createYokaiTrack();
  track.activeSec = 70;
  track.introComplete = true;
  track.introIndex = 4;
  track.unlockedTypes = ['oni', 'kitsune', 'noface'];
  advanceYokaiTrack(track, 10, 'water', fixed);
  assert.equal(track.activeSec, 70);
  advanceYokaiTrack(track, 0, 'bamboo', fixed);
  assert.equal(track.phase, 'LULL');
  assert.deepEqual(track.unlockedTypes, ['oni', 'kitsune', 'noface']);
}

// Seeded route distribution and collision/escape semantics.
{
  const state = makeState();
  const random = lcg(42);
  DemonSystem.spawnWave(state, 1000, 720, 5000, { typeIds: ['oni'], random });
  const sideRatio = state.demons.filter((enemy) => enemy.route === 'side').length / state.demons.length;
  // 65/35 route mix (Yokai=Fruit Phase 0): sideWeight 0.65, ±0.05 for seed variance.
  assert.ok(sideRatio > 0.60 && sideRatio < 0.70, `side route ratio ${sideRatio}`);

  const escape = makeState();
  escape.demons.push({ x: -130, y: 100, vx: 0, vy: 0, gravity: 0, radius: 35, rot: 0, rv: 0, sliced: false, stumbled: false });
  DemonSystem.tick(escape, 1, 1, 1000, 720);
  assert.equal(escape.stumble.count, 0);

  const contact = makeState();
  contact.demons.push({ x: 150, y: 600, vx: 0, vy: 0, gravity: 0, radius: 35, rot: 0, rv: 0, sliced: false, stumbled: false });
  DemonSystem.tick(contact, 1, 1, 1000, 720);
  assert.equal(contact.stumble.count, 1);
}

console.log('Yokai woven validation passed.');
