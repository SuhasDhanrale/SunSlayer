import { PACING } from '../config/constants.js';
import { PATTERNS, PATTERNS_BY_ID, OPENINGS } from '../data/patterns.js';
import { PatternRunner, compilePattern } from './PatternRunner.js';

// ── The Conductor ────────────────────────────────────────────────────────────
// RunDirector owns the run's INTENSITY RHYTHM and feeds the PatternRunner one
// authored pattern at a time. It never spawns entities itself.
//
// DWELL: a pattern is a short loopable beat, so when one is chosen the conductor
// keeps REPLAYING that same pattern for its `dwell` time before switching — a
// lesson/zone lasts long enough to read and play, instead of flipping every few
// seconds. Teaching gets a solid minimum; harder obstacles dwell longer.
//
// Tension is a CURVE: rising baseline (baseStart→baseEnd over rampSeconds) with a
// REST↔PEAK oscillation on top. Each time it picks a NEW pattern (not a replay) it
// reads the curve, chooses a CATEGORY (rest/food in troughs, obstacle/combo/food
// on crests), caps DIFFICULTY by curve height, and DRAWS from that category's deck
// (no immediate repeat). The opening is a scripted teach intro.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_DIFFICULTY = 3;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function createDirector(P, biome = 'bamboo') {
  const opening = OPENINGS[biome] || OPENINGS.bamboo; // biome-specific teach curriculum
  return {
    P,
    biome,
    initialized: true,
    intro: P.introTeach ? [...opening] : [],   // scripted onboarding, drained first
    introTotal: P.introTeach ? opening.length : 0,
    phase: 'REST',     // flips to PEAK on the first generative pick
    phaseLeft: 0,
    intensity: P.baseStart,
    lastId: null,
    currentPattern: null,
    patternStartT: 0,  // elapsed-sec when the current pattern (this dwell) began
    dwellTarget: 0,    // how long (sec) to keep replaying it
    switchAtT: null,   // elapsed-sec to start the next pattern (after the gap)
  };
}

// How long a chosen pattern should DWELL (seconds) before the conductor moves on.
function dwellFor(p, P) {
  if (p.dwell) return p.dwell;                             // explicit per-pattern override
  if (p.category === 'teach') return P.teachDwell;          // a solid minimum to learn
  return P.dwellBase + (p.difficulty || 0) * P.dwellPerDiff; // harder = lasts longer
}

// Baseline tension at a given elapsed time — the slow whole-run climb.
function baselineAt(P, elapsedSec) {
  const t = clamp01(elapsedSec / P.rampSeconds);
  return P.baseStart + (P.baseEnd - P.baseStart) * t;
}

const jit = (P) => (Math.random() * 2 - 1) * P.jitter;

// Draw a pattern of `category` no harder than `maxDiff`, avoiding an immediate
// repeat. Falls back gracefully so selection never returns null.
function draw(d, category, maxDiff) {
  const fits = (p) => Array.isArray(p.biomes) && p.biomes.includes(d.biome);
  let pool = PATTERNS.filter((p) => fits(p) && p.category === category && p.difficulty <= maxDiff);
  if (!pool.length) pool = PATTERNS.filter((p) => fits(p) && p.category === category);
  if (!pool.length) pool = PATTERNS.filter((p) => fits(p) && p.category === 'obstacle');
  if (!pool.length) pool = PATTERNS.filter(fits);
  if (!pool.length) return PATTERNS[0];
  let choices = pool.filter((p) => p.id !== d.lastId);
  if (!choices.length) choices = pool;
  const pick = choices[Math.floor(Math.random() * choices.length)];
  d.lastId = pick.id;
  return pick;
}

// Decide the next pattern + set d.intensity to the curve value driving it.
function selectNext(d, elapsedSec) {
  const P = d.P;

  // Scripted onboarding (OPENING), drained first — calm, with a gentle ramp so it
  // builds from the bamboo warm-up toward the first combo/boulder.
  if (d.intro.length) {
    const p = PATTERNS_BY_ID[d.intro.shift()] || PATTERNS[0];
    const idx = d.introTotal - d.intro.length;                 // 1..introTotal
    const prog = d.introTotal > 1 ? (idx - 1) / (d.introTotal - 1) : 0;
    d.intensity = clamp01(P.baseStart + prog * 0.25);
    d.lastId = p.id;
    return p;
  }

  // Flip REST↔PEAK when the current phase is spent (length jittered).
  if (d.phaseLeft <= 0) {
    d.phase = d.phase === 'REST' ? 'PEAK' : 'REST';
    const base = d.phase === 'REST' ? P.restPatterns : P.peakPatterns;
    d.phaseLeft = Math.max(1, Math.round(base * (1 + jit(P))));
  }
  d.phaseLeft -= 1;

  const b = baselineAt(P, elapsedSec);
  const target = d.phase === 'REST'
    ? clamp01(b * P.restDepth + jit(P) * 0.15)
    : clamp01(b + P.peakHeight + jit(P) * 0.15);
  d.intensity = target;

  // Category from phase; difficulty cap from how high the curve is.
  let category;
  if (d.phase === 'REST') {
    category = Math.random() < 0.3 ? 'food' : 'rest';
  } else {
    const r = Math.random();
    category = r < 0.5 ? 'obstacle' : r < 0.8 ? 'combo' : 'food';
  }
  const maxDiff = Math.round(target * MAX_DIFFICULTY);
  return draw(d, category, maxDiff);
}

export const RunDirector = {
  ensureInit(s) {
    const biome = s.spawnBiome || s.biome || 'bamboo';
    if (s.lastSpawnBiome !== biome) {
      s.lastSpawnBiome = biome;
      s.director = { initialized: false };
      s.pattern = null;
    }
    if (s.director && s.director.initialized) return;
    s.director = createDirector(PACING, biome);
  },

  // Pick a NEW pattern and start its dwell window.
  beginPattern(s, elapsedSec) {
    const d = s.director;
    const p = selectNext(d, elapsedSec);
    d.currentPattern = p;
    d.patternStartT = elapsedSec;
    d.dwellTarget = dwellFor(p, d.P);
    d.switchAtT = null;
    PatternRunner.start(s, compilePattern(p, d.intensity));
  },

  // Replay the SAME pattern (fresh field roll) — continues the current dwell.
  replaySame(s) {
    const d = s.director;
    PatternRunner.start(s, compilePattern(d.currentPattern, d.intensity));
    s.pattern.acc = 0; // continue column spacing seamlessly into the next loop
  },

  // PatternRunner.tick (called separately) emits the columns; this owns selection.
  tick(s, dt, elapsedSec) {
    this.ensureInit(s);
    const d = s.director;
    if (!s.pattern) { this.beginPattern(s, elapsedSec); return; }
    if (!s.pattern.done) return;

    // The pattern just finished a loop. Stay on it until its dwell elapses…
    if (elapsedSec - d.patternStartT < d.dwellTarget) { this.replaySame(s); return; }
    // …then a short breather, then a different pattern.
    if (d.switchAtT == null) d.switchAtT = elapsedSec + d.P.gapSeconds;
    if (elapsedSec >= d.switchAtT) this.beginPattern(s, elapsedSec);
  },

  // ── Tooling: dry-run the conductor for the Director Lab ────────────────────
  // The sequence it WOULD generate over `minutes`, each beat lasting its dwell.
  baselineAt(P, elapsedSec) { return baselineAt(P, elapsedSec); },

  simulate(params, minutes, biome = 'bamboo') {
    const P = { ...PACING, ...params };
    const d = createDirector(P, biome);
    const events = [];
    const limit = minutes * 60;
    let elapsed = 0;
    let guard = 0;
    while (elapsed < limit && guard++ < 4000) {
      const p = selectNext(d, elapsed);
      const dur = dwellFor(p, P) + P.gapSeconds;
      events.push({ t: elapsed, dur, intensity: d.intensity, id: p.id, category: p.category });
      elapsed += dur;
    }
    return events;
  },
};
