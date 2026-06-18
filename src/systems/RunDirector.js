import { PACING, BASE_SPEED } from '../config/constants.js';
import { PATTERNS, PATTERNS_BY_ID } from '../data/patterns.js';
import { PatternRunner, compilePattern } from './PatternRunner.js';

// ── The Conductor ────────────────────────────────────────────────────────────
// RunDirector owns the run's INTENSITY RHYTHM and feeds the PatternRunner one
// authored pattern at a time. It never spawns entities itself.
//
// Tension is a CURVE: a rising baseline (baseStart→baseEnd over rampSeconds) with
// a REST↔PEAK oscillation on top. Each time a pattern finishes, the conductor:
//   1. reads where the curve is now (baseline + which phase),
//   2. picks a CATEGORY (rest/food in troughs, obstacle/combo/food on crests),
//   3. caps DIFFICULTY by the curve height (escalation),
//   4. DRAWS a pattern from that category (random, no immediate repeat).
// Randomness lives at the pattern level + curve jitter — never per-spawn — so the
// run is varied but never noisy. Tune the curve in data/config.json `pacing`.
//
// The opening is a scripted TEACH intro (isolated lessons) before the generative
// rhythm begins — the isolated→reinforced→combined curve.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_DIFFICULTY = 3;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function createDirector(P) {
  return {
    P,
    initialized: true,
    intro: P.introTeach ? ['teach-bamboo', 'teach-spike', 'teach-vine'] : [],
    phase: 'REST',     // flips to PEAK on the first generative pick
    phaseLeft: 0,
    intensity: P.baseStart,
    lastId: null,
    current: null,
    gap: 0,
  };
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
  let pool = PATTERNS.filter((p) => p.category === category && p.difficulty <= maxDiff);
  if (!pool.length) pool = PATTERNS.filter((p) => p.category === category);
  if (!pool.length) pool = PATTERNS.filter((p) => p.category === 'obstacle');
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

  // Scripted teaching intro, drained first (calm, isolated lessons).
  if (d.intro.length) {
    const p = PATTERNS_BY_ID[d.intro.shift()] || PATTERNS[0];
    d.intensity = clamp01(P.baseStart);
    d.current = p.id;
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

  const p = draw(d, category, maxDiff);
  d.current = p.id;
  return p;
}

export const RunDirector = {
  ensureInit(s) {
    if (s.director && s.director.initialized) return;
    s.director = createDirector(PACING);
  },

  startNext(s, elapsedSec) {
    const d = s.director;
    const p = selectNext(d, elapsedSec);
    PatternRunner.start(s, compilePattern(p, d.intensity));
    d.gap = d.P.patternGap;
  },

  // Drive selection. PatternRunner.tick (called separately) emits the columns.
  tick(s, dt, elapsedSec) {
    this.ensureInit(s);
    if (!s.pattern) { this.startNext(s, elapsedSec); return; }
    if (s.pattern.done) {
      s.director.gap -= s.cameraSpeed * dt;       // breathe between patterns
      if (s.director.gap <= 0) this.startNext(s, elapsedSec);
    }
  },

  // ── Tooling: dry-run the conductor for the Director Lab ────────────────────
  // Returns the sequence it WOULD generate over `minutes`, without touching game
  // state — each event has { t, dur, intensity, id, category }. Pure aside from
  // Math.random (reseed by re-calling). Used to draw the curve + fast-forward.
  baselineAt(P, elapsedSec) { return baselineAt(P, elapsedSec); },

  simulate(params, minutes) {
    const P = { ...PACING, ...params };
    const d = createDirector(P);
    const events = [];
    const speedPerSec = (P.simSpeed || BASE_SPEED) * 60; // world-distance per second
    const limit = minutes * 60;
    let elapsed = 0;
    let guard = 0;
    while (elapsed < limit && guard++ < 4000) {
      const p = selectNext(d, elapsed);
      const cols = compilePattern(p, d.intensity).columns.length;
      const dur = (cols * 240 + P.patternGap) / speedPerSec; // 240 = STEP_PX
      events.push({ t: elapsed, dur, intensity: d.intensity, id: p.id, category: p.category });
      elapsed += dur;
    }
    return events;
  },
};
