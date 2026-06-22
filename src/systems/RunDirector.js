import { PACING, YOKAI_WOVEN } from '../config/constants.js';
import { PATTERNS, PATTERNS_BY_ID, OPENINGS } from '../data/patterns.js';
import { PatternRunner, compilePattern } from './PatternRunner.js';
import { DemonSystem } from './DemonSystem.js';
import { pickShapeForPhase } from '../data/yokaiShapes.js';

const MAX_DIFFICULTY = 4;
const LAND_BIOMES = new Set(['bamboo', 'cave']);
// Bonus grove beats: the schedule entry's `payload` picks ONE pattern, looped for
// the whole leg (see tickGrove). Anything unknown falls back to the coin reward.
const GROVE_PAYLOADS = { coins: 'bonus-coins', gauntlet: 'bonus-gauntlet', swarm: 'bonus-swarm' };
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;
const range = ([min, max], random) => min + (max - min) * random();

// Trade-off breath (DESIGN #97): the obstacle (bamboo) layer's intensity DUCKS as
// the yokai burst rises, so the two layers take turns leading instead of piling
// up. Scales `target` down by backoffStrength·yokaiIntensity, but never below
// backoffFloor (a thin tempo always remains) and never RAISES a naturally-sparse
// target. yokaiIntensity 0 (water/grove/onboarding) ⇒ target unchanged, so the
// pacing sim and non-yokai biomes behave exactly as before.
export function obstacleBreath(target, yokaiIntensity = 0) {
  const k = YOKAI_WOVEN.backoffStrength ?? 0.7;
  const floor = YOKAI_WOVEN.backoffFloor ?? 0.15;
  const m = clamp01(1 - k * clamp01(yokaiIntensity));
  return Math.max(Math.min(target, floor), target * m);
}

export const YOKAI_INTRO_SCRIPT = [
  { id: 'oni-side', atSec: 5, mode: 'isolated', typeIds: ['oni'], count: 1, routes: ['side'], row: 'A', scripted: true },
  { id: 'oni-bottom', atSec: 10, mode: 'isolated', typeIds: ['oni'], count: 1, routes: ['bottom'], row: 'M', scripted: true },
  { id: 'oni-woven', atSec: 16, mode: 'woven', typeIds: ['oni'], count: 1, routes: ['side'], row: 'M', scripted: true },
  { id: 'oni-pair', atSec: 23, mode: 'isolated', typeIds: ['oni'], count: 2, routes: ['side', 'bottom'], row: 'A', scripted: true },
];

function emptyStats() {
  return {
    spawned: 0, contacts: 0, escaped: 0, swarmCount: 0, injected: 0,
    introEmitted: [], routes: {}, sources: {}, types: {},
  };
}

export function createYokaiTrack() {
  return {
    activeSec: 0, phase: 'INTRO', phaseT: 0, phaseDuration: 0,
    phaseFrom: 0, phaseTo: 0, intensity: 0, introIndex: 0,
    introComplete: false, pendingDirective: null, unlockedTypes: ['oni'],
    kitsuneIntroduced: false, nofaceIntroduced: false, swarmPending: false,
    swarmInProgress: false, recentTypes: [], lastBiome: null,
    shapeTimer: 0, lastShapeId: null, stats: emptyStats(),
  };
}

function startLull(track, random) {
  track.phase = 'LULL';
  track.phaseT = 0;
  track.phaseDuration = range(YOKAI_WOVEN.lullDuration, random);
  track.phaseFrom = range(YOKAI_WOVEN.lullIntensity, random);
  track.phaseTo = track.phaseFrom;
  track.intensity = track.phaseFrom;
  track.swarmPending = false;
  track.swarmInProgress = false;
}

function startRise(track, random) {
  track.phase = 'RISE';
  track.phaseT = 0;
  track.phaseDuration = range(YOKAI_WOVEN.riseDuration, random);
  track.phaseFrom = track.intensity;
  track.phaseTo = YOKAI_WOVEN.riseTarget;
}

function startPeak(track, random) {
  track.phase = 'PEAK';
  track.phaseT = 0;
  // PEAK is now a timed plateau (was held until a swarm pattern finished). The
  // shape cadence fires the climax clusters across this window; finishYokaiPeak
  // drops to FALL when it elapses.
  track.phaseDuration = range(YOKAI_WOVEN.peakDuration, random);
  track.intensity = 1;
  track.swarmPending = true;
  track.swarmInProgress = false;
}

// Phase 6 — seconds until the next shape fires. The gap shrinks as intensity
// climbs (LULL ≈ shapeInterval[0], PEAK ≈ shapeInterval[1]) so shapes tighten
// with the curve; jittered so the cadence never feels metronomic.
export function nextShapeInterval(intensity, random = Math.random) {
  const span = YOKAI_WOVEN.shapeInterval || [9, 2.5];
  const base = lerp(span[0], span[1], clamp01(intensity));
  const j = YOKAI_WOVEN.shapeJitter ?? 0.25;
  return Math.max(0.5, base * (1 + (random() * 2 - 1) * j));
}

export function finishYokaiPeak(track, random = Math.random) {
  track.phase = 'FALL';
  track.phaseT = 0;
  track.phaseDuration = range(YOKAI_WOVEN.fallDuration, random);
  track.phaseFrom = YOKAI_WOVEN.fallStart;
  track.phaseTo = YOKAI_WOVEN.fallEnd;
  track.intensity = track.phaseFrom;
  track.swarmPending = false;
  track.swarmInProgress = false;
  track.stats.swarmCount += 1;
}

function queueTimedIntroductions(track) {
  if (track.pendingDirective) return;
  const scripted = YOKAI_INTRO_SCRIPT[track.introIndex];
  if (scripted && track.activeSec >= scripted.atSec) {
    track.pendingDirective = { ...scripted, typeIds: [...scripted.typeIds], routes: [...scripted.routes] };
    return;
  }
  if (!track.kitsuneIntroduced && track.activeSec >= YOKAI_WOVEN.kitsuneSec) {
    track.pendingDirective = {
      id: 'kitsune-solo', mode: 'isolated', typeIds: ['kitsune'], count: 1,
      routes: ['side'], row: 'A', unlockAfter: 'kitsune',
    };
    return;
  }
  if (!track.nofaceIntroduced && track.activeSec >= YOKAI_WOVEN.nofaceSec) {
    track.pendingDirective = {
      id: 'noface-solo', mode: 'isolated', typeIds: ['noface'], count: 1,
      routes: ['side'], row: 'M', unlockAfter: 'noface',
    };
  }
}

export function advanceYokaiTrack(track, seconds, biome, random = Math.random) {
  const onLand = LAND_BIOMES.has(biome);
  if (!onLand) {
    track.phase = 'WATER';
    track.intensity = 0;
    track.swarmPending = false;
    track.swarmInProgress = false;
    track.lastBiome = biome;
    return track;
  }
  if (track.lastBiome === 'water') startLull(track, random);
  track.lastBiome = biome;
  track.activeSec += Math.max(0, seconds);
  queueTimedIntroductions(track);
  if (!track.introComplete) {
    if (track.activeSec >= YOKAI_WOVEN.introEndSec && track.introIndex >= YOKAI_INTRO_SCRIPT.length) {
      track.introComplete = true;
      startLull(track, random);
    } else {
      track.phase = 'INTRO';
      track.intensity = 0;
    }
    return track;
  }
  if (track.phase === 'INTRO' || track.phase === 'WATER') startLull(track, random);
  track.phaseT += Math.max(0, seconds);
  if (track.phase === 'LULL') {
    track.intensity = track.phaseFrom;
    if (track.phaseT >= track.phaseDuration) startRise(track, random);
  } else if (track.phase === 'RISE') {
    track.intensity = lerp(track.phaseFrom, track.phaseTo, clamp01(track.phaseT / track.phaseDuration));
    if (track.phaseT >= track.phaseDuration) startPeak(track, random);
  } else if (track.phase === 'PEAK') {
    track.intensity = 1;
    if (track.phaseT >= track.phaseDuration) finishYokaiPeak(track, random);
  } else if (track.phase === 'FALL') {
    track.intensity = lerp(track.phaseFrom, track.phaseTo, clamp01(track.phaseT / track.phaseDuration));
    if (track.phaseT >= track.phaseDuration) startLull(track, random);
  }
  return track;
}

function createDirector(P, biome = 'bamboo') {
  const opening = OPENINGS[biome] || OPENINGS.bamboo;
  return {
    P, biome, initialized: true, intro: P.introTeach ? [...opening] : [],
    introTotal: P.introTeach ? opening.length : 0, phase: 'REST', phaseLeft: 0,
    intensity: P.baseStart, lastId: null, currentPattern: null,
    patternStartT: 0, dwellTarget: 0, switchAtT: null,
  };
}

function dwellFor(pattern, P) {
  if (pattern.dwell) return pattern.dwell;
  if (pattern.category === 'teach') return P.teachDwell;
  return P.dwellBase + (pattern.difficulty || 0) * P.dwellPerDiff;
}

function baselineAt(P, elapsedSec) {
  const t = clamp01(elapsedSec / P.rampSeconds);
  return P.baseStart + (P.baseEnd - P.baseStart) * t;
}

const jitter = (P) => (Math.random() * 2 - 1) * P.jitter;

function draw(director, category, maxDiff) {
  const fits = (pattern) => Array.isArray(pattern.biomes)
    && pattern.biomes.includes(director.biome) && !pattern.yokaiOnly && !pattern.special;
  let pool = PATTERNS.filter((pattern) => fits(pattern) && pattern.category === category && pattern.difficulty <= maxDiff);
  if (!pool.length) pool = PATTERNS.filter((pattern) => fits(pattern) && pattern.category === category);
  if (!pool.length) pool = PATTERNS.filter((pattern) => fits(pattern) && pattern.category === 'obstacle');
  if (!pool.length) pool = PATTERNS.filter(fits);
  if (!pool.length) return PATTERNS[0];
  let choices = pool.filter((pattern) => pattern.id !== director.lastId);
  if (!choices.length) choices = pool;
  const picked = choices[Math.floor(Math.random() * choices.length)];
  director.lastId = picked.id;
  return picked;
}

function selectNext(director, elapsedSec, yokaiIntensity = 0) {
  const P = director.P;
  if (director.intro.length) {
    const pattern = PATTERNS_BY_ID[director.intro.shift()] || PATTERNS[0];
    const index = director.introTotal - director.intro.length;
    const progress = director.introTotal > 1 ? (index - 1) / (director.introTotal - 1) : 0;
    director.intensity = clamp01(P.baseStart + progress * 0.25);
    director.lastId = pattern.id;
    return pattern;
  }
  if (director.phaseLeft <= 0) {
    director.phase = director.phase === 'REST' ? 'PEAK' : 'REST';
    const base = director.phase === 'REST' ? P.restPatterns : P.peakPatterns;
    director.phaseLeft = Math.max(1, Math.round(base * (1 + jitter(P))));
  }
  director.phaseLeft -= 1;
  const baseline = baselineAt(P, elapsedSec);
  const rawTarget = director.phase === 'REST'
    ? clamp01(baseline * P.restDepth + jitter(P) * 0.15)
    : clamp01(baseline + P.peakHeight + jitter(P) * 0.15);
  // Duck the obstacle layer under the live yokai burst (DESIGN #97). The REST/PEAK
  // cadence still free-runs; we only thin its loudness so the layers take turns.
  const target = obstacleBreath(rawTarget, yokaiIntensity);
  director.intensity = target;
  let category;
  if (director.phase === 'REST') category = Math.random() < 0.3 ? 'food' : 'rest';
  else {
    const roll = Math.random();
    category = roll < 0.5 ? 'obstacle' : roll < 0.8 ? 'combo' : 'food';
  }
  return draw(director, category, Math.round(target * MAX_DIFFICULTY));
}

function compileContext(s) {
  const track = s.yokaiTrack;
  return {
    biome: s.director.biome, yokaiIntensity: track.intensity,
    typeIds: [...track.unlockedTypes],
    // Grove payloads are single-flavour by design — never let woven yokai bleed into
    // the coin/gauntlet beats (the swarm beat brings its own yokai via 'x' cells).
    allowWoven: track.introComplete && track.phase !== 'PEAK' && track.phase !== 'WATER'
      && s.director.biome !== 'grove',
  };
}

function startCompiled(s, pattern) {
  const compiled = compilePattern(pattern, s.director.intensity, compileContext(s));
  s.yokaiTrack.stats.injected += compiled.injectedYokai;
  PatternRunner.start(s, compiled);
}

export const RunDirector = {
  ensureInit(s) {
    if (!s.yokaiTrack) s.yokaiTrack = createYokaiTrack();
    const biome = s.spawnBiome || s.biome || 'bamboo';
    if (s.lastSpawnBiome !== biome) {
      s.lastSpawnBiome = biome;
      s.director = { initialized: false };
      s.pattern = null;
      if (biome === 'water') s.demons.length = 0;
    }
    if (s.director?.initialized) return;
    s.director = createDirector(PACING, biome);
  },

  beginPattern(s, elapsedSec) {
    const director = s.director;
    const pattern = selectNext(director, elapsedSec, s.yokaiTrack?.intensity ?? 0);
    director.currentPattern = pattern;
    director.patternStartT = elapsedSec;
    director.dwellTarget = dwellFor(pattern, director.P);
    director.switchAtT = null;
    startCompiled(s, pattern);
  },

  // Phase 6 — the woven shape cadence. Fires one authored yokai SHAPE per beat,
  // selected by the current yokai phase's tier, so the burst layer ESCALATES with
  // the intensity curve (LULL singles → RISE lines → PEAK clusters → FALL singles).
  // Shapes spawn straight through DemonSystem.spawnShape and NEVER occupy the
  // obstacle pattern slot, so obstacle density stays a hand-balanced layer around
  // the automated yokai feel (DESIGN §7). Paused off-land / before onboarding
  // completes — the timer simply holds, matching the woven track's water pause.
  tickShapes(s, dt, w, h) {
    if (!w || !h) return;
    const track = s.yokaiTrack;
    const biome = s.director.biome;
    const eligible = track.introComplete && biome !== 'water' && biome !== 'grove'
      && (track.phase === 'LULL' || track.phase === 'RISE'
        || track.phase === 'PEAK' || track.phase === 'FALL');
    if (!eligible) return;
    track.shapeTimer -= dt / 60;
    if (track.shapeTimer > 0) return;
    const shape = pickShapeForPhase(track.phase, Math.random, track.lastShapeId);
    if (shape) {
      DemonSystem.spawnShape(s, w, h, shape.id, { source: 'director', typeIds: [...track.unlockedTypes] });
      track.lastShapeId = shape.id;
    }
    track.shapeTimer = nextShapeInterval(track.intensity);
  },

  replaySame(s) {
    startCompiled(s, s.director.currentPattern);
    s.pattern.acc = 0;
  },

  // The bonus grove ignores the procedural conductor entirely: loop the ONE payload
  // pattern the schedule chose for this leg (coins | gauntlet | swarm) until the
  // grove ends and ensureInit rebuilds the director for the next biome.
  tickGrove(s) {
    if (s.pattern && !s.pattern.done) return;
    const id = GROVE_PAYLOADS[s.grovePayload] || GROVE_PAYLOADS.coins;
    const pattern = PATTERNS_BY_ID[id];
    s.director.currentPattern = pattern;
    startCompiled(s, pattern);
    s.pattern.acc = 0;
  },

  tick(s, dt, elapsedSec, w, h) {
    this.ensureInit(s);
    const director = s.director;
    if (director.biome === 'grove') { this.tickGrove(s); return; }
    const track = s.yokaiTrack;
    advanceYokaiTrack(track, dt / 60, director.biome);
    // Yokai shapes weave in on their own cadence (the burst layer); the obstacle
    // pattern below runs continuously and independently underneath them.
    this.tickShapes(s, dt, w, h);
    if (!s.pattern) {
      this.beginPattern(s, elapsedSec);
      return;
    }
    if (!s.pattern.done) return;
    // While the yokai burst is hot, don't replay a dense bamboo wall on top of it —
    // let the pattern end so the next (ducked) one clears the field for the burst.
    const yokaiHot = (track.intensity ?? 0) > (YOKAI_WOVEN.replaySkipAbove ?? 0.5);
    if (!yokaiHot && elapsedSec - director.patternStartT < director.dwellTarget) {
      this.replaySame(s);
      return;
    }
    if (director.switchAtT == null) director.switchAtT = elapsedSec + director.P.gapSeconds;
    if (elapsedSec >= director.switchAtT) this.beginPattern(s, elapsedSec);
  },

  baselineAt(P, elapsedSec) { return baselineAt(P, elapsedSec); },

  simulate(params, minutes, biome = 'bamboo') {
    const P = { ...PACING, ...params };
    const director = createDirector(P, biome);
    const events = [];
    const limit = minutes * 60;
    let elapsed = 0;
    let guard = 0;
    while (elapsed < limit && guard++ < 4000) {
      const pattern = selectNext(director, elapsed);
      const duration = dwellFor(pattern, P) + P.gapSeconds;
      events.push({ t: elapsed, dur: duration, intensity: director.intensity, id: pattern.id, category: pattern.category });
      elapsed += duration;
    }
    return events;
  },
};
