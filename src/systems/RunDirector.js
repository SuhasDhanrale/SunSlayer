import { ARROW_TRAP, PACING, YOKAI_WOVEN, GOLDEN } from '../config/constants.js';
import { PATTERNS, PATTERNS_BY_ID, OPENINGS } from '../data/patterns.js';
import { PatternRunner, compilePattern } from './PatternRunner.js';
import { DemonSystem } from './DemonSystem.js';
import { pickShapeForPhase, trapShapeForPhase } from '../data/yokaiShapes.js';
import { countActiveYokai } from '../data/yokai.js';

const MAX_DIFFICULTY = 4;
const LAND_BIOMES = new Set(['bamboo', 'cave']);
// Phase 5 — the re-acclimation beat. On RE-entry to a biome already taught this run
// we skip the scripted curriculum (the sawtooth re-teach) and play ONE short rest
// beat as the post-transition breather before procedural selection resumes — a
// breather, NOT a difficulty:0 tutorial. Eligible in every gameplay pool.
const RE_ENTRY_BEAT = 'rest-gold-rush';
// Bonus grove beats: the schedule entry's `payload` picks ONE pattern, looped for
// the whole leg (see tickGrove). Anything unknown falls back to the coin reward.
const GROVE_PAYLOADS = { coins: 'bonus-coins', gauntlet: 'bonus-gauntlet', swarm: 'bonus-swarm' };
const INTRO_SNACK_DEFAULT = {
  enabled: true,
  firstDelaySec: [0.5, 1.5],
  intervalSec: [0.5, 2],
  maxActive: 3,
  minScriptGapSec: 1,
};
const INTRO_SNACK_ROWS = ['H', 'A', 'M', 'L'];
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;
const range = ([min, max], random) => min + (max - min) * random();
const introSnackConfig = () => ({ ...INTRO_SNACK_DEFAULT, ...(YOKAI_WOVEN.introSnack || {}) });
const nextScriptGap = (track) => {
  const scripted = YOKAI_INTRO_SCRIPT[track.introIndex];
  return scripted ? scripted.atSec - track.activeSec : Infinity;
};

// Phase 1 — the macro-envelope. The fast LULL→PEAK pulse rides a slow band that
// climbs over `envelopeSeconds` of land time, so the run rises "slowly slowly":
// early = a narrow low band, late = a higher band whose ceiling is held BELOW max
// (no 30s strobe to 1.0). floor is the LULL trough (never zero ⇒ a yokai floor on
// land), ceil is the PEAK crest. Pure function of active seconds — read by the
// phase starts and the debug overlay; never reads run/React state.
export function yokaiEnvelope(activeSec = 0) {
  const span = YOKAI_WOVEN.envelopeSeconds || 360;
  const t = clamp01(activeSec / span);
  const fb = YOKAI_WOVEN.floorBand || [0.08, 0.22];
  const cb = YOKAI_WOVEN.ceilBand || [0.55, 0.92];
  return { t, floor: lerp(fb[0], fb[1], t), ceil: lerp(cb[0], cb[1], t) };
}
// Small symmetric jitter on a band edge so the enveloped LULL/PEAK never lands on
// the exact same number twice (keeps the pulse from feeling metronomic).
const bandJitter = (random) => 1 + (random() * 2 - 1) * (YOKAI_WOVEN.envJitter ?? 0.12);

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
    kitsuneIntroduced: false, nofaceIntroduced: false,
    recentTypes: [], lastBiome: null,
    shapeTimer: 0, introSnackTimer: null, lastShapeId: null, arrowTaught: false, peakCeil: 0,
    trapUsedThisCycle: false, trapCountThisCycle: 0, trapTargetPhase: null, stats: emptyStats(),
  };
}

function startLull(track, random) {
  const env = yokaiEnvelope(track.activeSec);
  track.phase = 'LULL';
  track.phaseT = 0;
  track.phaseDuration = range(YOKAI_WOVEN.lullDuration, random);
  // LULL trough = the enveloped floor (rises slowly with run time, never zero).
  track.phaseFrom = clamp01(env.floor * bandJitter(random));
  track.phaseTo = track.phaseFrom;
  track.intensity = track.phaseFrom;
}

function startRise(track, random) {
  const env = yokaiEnvelope(track.activeSec);
  track.phase = 'RISE';
  track.phaseT = 0;
  track.phaseDuration = range(YOKAI_WOVEN.riseDuration, random);
  track.phaseFrom = track.intensity;
  track.trapUsedThisCycle = false;
  track.trapCountThisCycle = 0;
  track.trapTargetPhase = random() < ARROW_TRAP.peakPhaseChance ? 'PEAK' : 'RISE';
  if (track.trapTargetPhase === 'RISE') track.shapeTimer = 0;
  // Climb toward the enveloped ceiling (held below 1.0); PEAK then plateaus here.
  // Drawn AFTER the trap decision so the band jitter doesn't shift its RNG slot.
  track.phaseTo = clamp01(env.ceil * bandJitter(random));
  track.peakCeil = track.phaseTo;
}

function startPeak(track, random) {
  track.phase = 'PEAK';
  track.phaseT = 0;
  // PEAK is now a timed plateau (was held until a swarm pattern finished). The
  // shape cadence fires the climax clusters across this window; finishYokaiPeak
  // drops to FALL when it elapses.
  track.phaseDuration = range(YOKAI_WOVEN.peakDuration, random);
  // Plateau at the enveloped ceiling RISE climbed to (never 1.0). Fallback covers
  // a PEAK entered without a preceding RISE.
  track.peakCeil = track.peakCeil || clamp01(yokaiEnvelope(track.activeSec).ceil * bandJitter(random));
  track.intensity = track.peakCeil;
  if ((track.trapCountThisCycle || 0) < ARROW_TRAP.maxPerCycle) track.shapeTimer = 0;
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
  const env = yokaiEnvelope(track.activeSec);
  track.phase = 'FALL';
  track.phaseT = 0;
  track.phaseDuration = range(YOKAI_WOVEN.fallDuration, random);
  // Comedown from where PEAK left off back down to the enveloped floor.
  track.phaseFrom = track.intensity;
  track.phaseTo = clamp01(env.floor * bandJitter(random));
  track.intensity = track.phaseFrom;
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
    track.intensity = track.peakCeil || 1;
    if (track.phaseT >= track.phaseDuration) finishYokaiPeak(track, random);
  } else if (track.phase === 'FALL') {
    track.intensity = lerp(track.phaseFrom, track.phaseTo, clamp01(track.phaseT / track.phaseDuration));
    if (track.phaseT >= track.phaseDuration) startLull(track, random);
  }
  return track;
}

function createDirector(P, biome = 'bamboo', firstVisit = true) {
  const opening = OPENINGS[biome] || OPENINGS.bamboo;
  // Phase 5 — teach once per run per biome. The scripted curriculum plays only on the
  // FIRST entry to a gameplay biome this run; later entries drop straight into the
  // procedural curve at its current height (after one rest re-acclimation beat, if the
  // biome has a curriculum at all). This kills the per-transition tutorial sawtooth.
  const intro = firstVisit
    ? (P.introTeach ? [...opening] : [])
    : (opening.length ? [RE_ENTRY_BEAT] : []);
  return {
    P, biome, initialized: true, intro,
    introTotal: intro.length,
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

function draw(director, category, maxDiff, fieldsOnly = false) {
  // fieldsOnly (Phase 3 PEAK duck): restrict the deck to procedural FIELDS so the
  // obstacle layer thins to a sparse tempo and no authored spike/bridge grid wall
  // lands under the yokai burst. Fields scale by density; grids are fixed walls.
  const fits = (pattern) => Array.isArray(pattern.biomes)
    && pattern.biomes.includes(director.biome) && !pattern.yokaiOnly && !pattern.special
    && (!fieldsOnly || pattern.kind === 'field');
  // The difficulty cap is a HARD ceiling: every fallback must stay within it, never
  // drop it (DESIGN: a hard set-piece is opt-in by phase, not a fallback accident).
  const within = (pattern) => fits(pattern) && (pattern.difficulty || 0) <= maxDiff;
  let pool = PATTERNS.filter((pattern) => within(pattern) && pattern.category === category);
  if (!pool.length) pool = PATTERNS.filter((pattern) => within(pattern) && pattern.category === 'obstacle');
  if (!pool.length) pool = PATTERNS.filter(within);
  if (!pool.length) {
    // Nothing fits under the cap (e.g. cap 0 in a biome whose floor is diff 1): pick
    // the LOWEST-difficulty fitting pattern — the closest thing to within-cap, never
    // an arbitrary hard one above it.
    const fitting = PATTERNS.filter(fits);
    if (!fitting.length) return PATTERNS[0];
    const minDiff = Math.min(...fitting.map((pattern) => pattern.difficulty || 0));
    pool = fitting.filter((pattern) => (pattern.difficulty || 0) === minDiff);
  }
  let choices = pool.filter((pattern) => pattern.id !== director.lastId);
  if (!choices.length) choices = pool;
  const picked = choices[Math.floor(Math.random() * choices.length)];
  director.lastId = picked.id;
  return picked;
}

// Phase 3 — the unified clock. The obstacle layer no longer free-runs its own
// REST↔PEAK oscillation; its density + category are DRIVEN by the yokai master
// phase, so the two layers lock into ONE wave. `baselineAt` stays the slow macro-
// envelope (the loudness ceiling that climbs over the run, Phase 1/2 knobs); the
// phase shapes the obstacle layer WITHIN that envelope, and exactly one layer
// leads each phase while the other holds a floor:
//   LULL → valley: coins / near-empty (the yokai trickle is the only read).
//   RISE → the threat BUILD leads: obstacle density sits at the crest plateau.
//   PEAK → obstacle DUCKS to a thin tempo floor (fields only, no grid walls) so
//          the yokai burst leads — this is the law that replaced obstacleBreath.
//   FALL → comedown: obstacles thin back to the valley as the burst decays.
//   WATER/INTRO → no land phase: the macro-valley breather (gentle vine/bubble
//          tempo at the valley depth; the offline sim with no track lands here).
// Targets are FLAT per phase (not intra-phase ramps): a phase usually holds a
// single obstacle beat, so a per-phase plateau is what the player actually feels —
// the loudness wave lives in the phase SEQUENCE, not inside one beat.
function obstaclePlan(P, baseline, phase) {
  const restCeil = P.restCeil ?? 1;
  const peakCap = P.peakCap ?? 1;
  const duck = YOKAI_WOVEN.backoffFloor ?? 0.15;
  const valley = Math.min(restCeil, clamp01(baseline * P.restDepth)); // the dip (Phase 2 restCeil)
  const crest = Math.min(peakCap, clamp01(baseline + P.peakHeight));  // the build top (Phase 2 peakCap)
  const j = jitter(P) * 0.15;
  switch (phase) {
    case 'LULL':
      // The valley: mostly coins (rest), an occasional sparse tempo. The slashable
      // content here is the yokai trickle from tickShapes (the single yokai path).
      return { target: clamp01(valley + j), categories: ['rest', 'rest', 'obstacle'], fieldsOnly: false };
    case 'RISE':
      return { target: clamp01(crest + j), categories: ['obstacle', 'obstacle', 'combo'], fieldsOnly: false };
    case 'PEAK':
      return { target: clamp01(duck + j * 0.5), categories: ['obstacle'], fieldsOnly: true };
    case 'FALL':
      return { target: clamp01(valley + j), categories: ['obstacle', 'rest'], fieldsOnly: false };
    default: // WATER / INTRO — the macro-valley breather
      return { target: clamp01(valley + j), categories: ['obstacle', 'combo', 'rest'], fieldsOnly: false };
  }
}

function selectNext(director, elapsedSec, track = null) {
  const P = director.P;
  if (director.intro.length) {
    const pattern = PATTERNS_BY_ID[director.intro.shift()] || PATTERNS[0];
    const index = director.introTotal - director.intro.length;
    const progress = director.introTotal > 1 ? (index - 1) / (director.introTotal - 1) : 0;
    director.intensity = clamp01(P.baseStart + progress * 0.25);
    director.lastId = pattern.id;
    return pattern;
  }
  const baseline = baselineAt(P, elapsedSec);
  const plan = obstaclePlan(P, baseline, track?.phase || 'WATER');
  director.intensity = plan.target;
  const category = plan.categories[Math.floor(Math.random() * plan.categories.length)];
  return draw(director, category, Math.round(plan.target * MAX_DIFFICULTY), plan.fieldsOnly);
}

function compileContext(s) {
  const track = s.yokaiTrack;
  // Phase 4 — no more woven injection: a compiled obstacle pattern never carries
  // yokai. typeIds only flows through for the grove swarm fixture's own `x` cells.
  return {
    biome: s.director.biome, yokaiIntensity: track.intensity,
    typeIds: [...track.unlockedTypes],
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
    s.taughtBiomes ||= {}; // Phase 5 — per-run memory of which biomes have been taught
    const biome = s.spawnBiome || s.biome || 'bamboo';
    if (s.lastSpawnBiome !== biome) {
      s.lastSpawnBiome = biome;
      s.director = { initialized: false };
      s.pattern = null;
      s.groveCoinRewardStarted = false;
      if (biome === 'water') {
        s.demons.length = 0;
        if (s.yokaiQueue) s.yokaiQueue.length = 0; // water pauses shapes — drop pending members too
      }
    }
    if (s.director?.initialized) return;
    const firstVisit = !s.taughtBiomes[biome];
    s.taughtBiomes[biome] = true;
    s.director = createDirector(PACING, biome, firstVisit);
  },

  beginPattern(s, elapsedSec) {
    const director = s.director;
    s.completedOncePatterns ||= {};
    let pattern = selectNext(director, elapsedSec, s.yokaiTrack);
    let guard = 0;
    while (pattern?.once && s.completedOncePatterns[pattern.id] && guard++ < 20) {
      pattern = selectNext(director, elapsedSec, s.yokaiTrack);
    }
    director.currentPattern = pattern;
    director.patternStartT = elapsedSec;
    director.dwellTarget = dwellFor(pattern, director.P);
    director.switchAtT = null;
    startCompiled(s, pattern);
  },

  tickIntroSnacks(s, dt, w, h, random = Math.random) {
    if (!w || !h) return;
    const track = s.yokaiTrack;
    const cfg = introSnackConfig();
    if (!cfg.enabled || !track || track.introComplete) return;

    const biome = s.director?.biome || s.spawnBiome || s.biome || 'bamboo';
    if (!LAND_BIOMES.has(biome)) return;

    track.introSnackTimer ??= range(cfg.firstDelaySec, random);
    track.introSnackTimer -= dt / 60;
    if (track.introSnackTimer > 0) return;

    track.introSnackTimer = range(cfg.intervalSec, random);
    if (track.pendingDirective || nextScriptGap(track) <= (cfg.minScriptGapSec ?? 1)) {
      track.introSnackTimer = Math.min(track.introSnackTimer, 0.25);
      return;
    }
    if (countActiveYokai(s.demons) >= (cfg.maxActive ?? INTRO_SNACK_DEFAULT.maxActive)) return;

    const row = INTRO_SNACK_ROWS[Math.floor(random() * INTRO_SNACK_ROWS.length)] || 'M';
    DemonSystem.spawn(s, w, h, {
      row,
      source: 'intro-snack',
      typeIds: [...(track.unlockedTypes || ['oni'])],
      random,
    });
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
    const trapPhaseDue = track.arrowTaught
      && (track.trapCountThisCycle || 0) < ARROW_TRAP.maxPerCycle
      && !s.arrowTrap && !s.arrowBurst && !s.boss?.active
      && !s.pendingBoss && (!s.samurai?.stage || s.samurai.stage === 'absent')
      && (track.phase === track.trapTargetPhase
        || (track.phase === 'PEAK' && track.trapTargetPhase === 'RISE'));
    const shape = trapPhaseDue
      ? trapShapeForPhase(track.phase)
      : pickShapeForPhase(track.phase, Math.random, track.lastShapeId);
    if (shape) {
      DemonSystem.spawnShape(s, w, h, shape.id, { source: 'director', typeIds: [...track.unlockedTypes] });
      if (shape.trap && !s.arrowTrap) {
        track.shapeTimer = 0.5;
        return;
      }
      if (shape.trap) {
        track.trapCountThisCycle = (track.trapCountThisCycle || 0) + 1;
        track.trapUsedThisCycle = track.trapCountThisCycle >= ARROW_TRAP.maxPerCycle;
      }
      track.lastShapeId = shape.id;
    }
    track.shapeTimer = nextShapeInterval(track.intensity);
  },

  // The golden treat: a rare PEAK climax bonus. A cooldown counts down on land time
  // (first one held back by `firstSpawnSec`); once it's elapsed the next PEAK spawns
  // one golden yokai. Gated off boss/arrow/samurai pressure and never while another
  // golden is live, so it can't pile onto a hot moment. One yokai-layer path, like
  // the arrow trap — it never occupies the obstacle pattern slot.
  tickGolden(s, dt, w, h) {
    if (!w || !h) return;
    const track = s.yokaiTrack;
    if (!track.introComplete) return;
    const biome = s.director.biome;
    if (biome === 'water' || biome === 'grove') return;
    if (s.boss?.active || s.pendingBoss || s.arrowTrap || s.arrowBurst) return;
    if (s.samurai?.stage && s.samurai.stage !== 'absent') return;
    if (s.demons.some((d) => d.golden)) return;
    track.goldenTimer ??= GOLDEN.firstSpawnSec;
    track.goldenTimer -= dt / 60;
    if (track.goldenTimer > 0) return;
    // Fire on the next active land beat (LULL/RISE/PEAK/FALL — introComplete + the
    // water/grove guard above already exclude INTRO/WATER). A LULL valley is fine:
    // the frenzy makes its OWN little peak and gets room to itself. Reset with jitter
    // so the cadence reads as a surprise, not a metronome (the cooldown floor stays —
    // never two within one window).
    DemonSystem.spawnGolden(s, w, h, { source: 'director' });
    track.goldenTimer = GOLDEN.spawnCooldownSec * (1 + (Math.random() * 2 - 1) * (GOLDEN.spawnJitter ?? 0));
  },

  replaySame(s) {
    startCompiled(s, s.director.currentPattern);
    s.pattern.acc = 0;
  },

  // The bonus grove ignores the procedural conductor entirely. Coin rewards play
  // once per grove entry; active payloads still loop for the grove's duration.
  tickGrove(s) {
    if (s.pattern && !s.pattern.done) return;
    const id = GROVE_PAYLOADS[s.grovePayload] || GROVE_PAYLOADS.coins;
    if (id === GROVE_PAYLOADS.coins && s.groveCoinRewardStarted) return;
    const pattern = PATTERNS_BY_ID[id];
    s.director.currentPattern = pattern;
    startCompiled(s, pattern);
    if (id === GROVE_PAYLOADS.coins) s.groveCoinRewardStarted = true;
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
    this.tickIntroSnacks(s, dt, w, h);
    this.tickShapes(s, dt, w, h);
    this.tickGolden(s, dt, w, h);
    if (!s.pattern) {
      this.beginPattern(s, elapsedSec);
      return;
    }
    if (!s.pattern.done) return;
    if (director.currentPattern?.once) {
      // Do not consume the isolated quiver lesson until the trap resolves.
      // If Samurai pressure blocked placement, replay it after the normal gap.
      if (director.currentPattern.id === 'teach-arrow' && !s.arrowLessonSeen) {
        if (s.arrowTrap || s.arrowBurst) return;
        if (director.switchAtT == null) director.switchAtT = elapsedSec + director.P.gapSeconds;
        if (elapsedSec >= director.switchAtT) this.replaySame(s);
        return;
      }
      s.completedOncePatterns ||= {};
      s.completedOncePatterns[director.currentPattern.id] = true;
      if (director.switchAtT == null) director.switchAtT = elapsedSec + director.P.gapSeconds;
      if (elapsedSec >= director.switchAtT) this.beginPattern(s, elapsedSec);
      return;
    }
    // Phase 6 — hard set-pieces are one-pass. dwell is measured in SECONDS, but a
    // pattern is a fixed stretch of DISTANCE, so at late speed it scrolls past in less
    // time and the dwell window replays it 2–3×. A diff>=setpieceDiff wall must read as
    // an occasional moment, not a repeated curtain — so it never dwell-replays.
    const isSetpiece = (director.currentPattern?.difficulty || 0) >= (director.P.setpieceDiff ?? 3);
    // While the yokai burst is hot, don't replay a dense bamboo wall on top of it —
    // let the pattern end so the next (ducked) one clears the field for the burst.
    const yokaiHot = (track.intensity ?? 0) > (YOKAI_WOVEN.replaySkipAbove ?? 0.5);
    if (!isSetpiece && !yokaiHot && elapsedSec - director.patternStartT < director.dwellTarget) {
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
    // Phase 3 — model the unified phase: the obstacle layer reads the same master
    // LULL/RISE/PEAK/FALL clock the live run does, so the offline curve reflects
    // what the player feels (obstacle density locked to the yokai phase).
    const track = createYokaiTrack();
    track.introComplete = true;
    track.introIndex = YOKAI_INTRO_SCRIPT.length;
    startLull(track, Math.random);
    const events = [];
    const limit = minutes * 60;
    let elapsed = 0;
    let guard = 0;
    while (elapsed < limit && guard++ < 4000) {
      const pattern = selectNext(director, elapsed, track);
      const duration = dwellFor(pattern, P) + P.gapSeconds;
      events.push({
        t: elapsed, dur: duration, intensity: director.intensity,
        phase: track.phase, yokai: track.intensity, id: pattern.id, category: pattern.category,
      });
      advanceYokaiTrack(track, duration, biome);
      elapsed += duration;
    }
    return events;
  },

  // Offline check for the yokai macro-envelope (Phase 1). Steps the LULL→PEAK pulse
  // in fine increments over the whole run and records, per PEAK, the crest intensity
  // and when it fired — so you can confirm the pulse amplitude RISES with time and
  // the ceiling never hits 1.0. Pure: no React/run state, fixed-seedable RNG.
  simulateYokai(minutes, { biome = 'bamboo', step = 0.25, random = Math.random } = {}) {
    const track = createYokaiTrack();
    track.introComplete = true;
    track.introIndex = YOKAI_INTRO_SCRIPT.length;
    startLull(track, random);
    const peaks = [];
    let lastPhase = track.phase;
    let elapsed = 0;
    const limit = minutes * 60;
    while (elapsed < limit) {
      advanceYokaiTrack(track, step, biome, random);
      if (track.phase === 'PEAK' && lastPhase !== 'PEAK') {
        peaks.push({ t: Math.round(track.activeSec), crest: Number(track.intensity.toFixed(3)) });
      }
      lastPhase = track.phase;
      elapsed += step;
    }
    return peaks;
  },
};
