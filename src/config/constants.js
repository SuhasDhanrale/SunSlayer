import config from '../data/config.json';

export const PALETTE = {
  paper: '#f4f1ea',      
  ink: '#1c1917',        
  fadedInk: '#78716c',   
  lightInk: '#d6d3d1',   
  distantInk: '#e7e5e4', 
  crimson: '#b91c1c',    
  ground: '#0c0a09',
  warmGlow: '#fef08a',   
  mutedGlow: 'rgba(254, 240, 138, 0.4)', 
  emerald: '#059669', // Beautiful green for the monk's scarf
};

export const GROUND_HEIGHT = config.groundHeight || 100;
// Water swims at this fraction of canvas height (the surface line). The monk and
// all water hazards reference this lane instead of the ground.
export const WATER_SURFACE_FRAC = config.waterSurfaceFrac || 0.40;
// The monk's travel line for a gameplay biome: water swims at the surface, land
// biomes run on the ground. Obstacle spawners + the monk read this so the whole
// water playfield is re-based to the surface.
export const getLaneY = (biome, h) => (biome === 'water' ? h * WATER_SURFACE_FRAC : h - GROUND_HEIGHT);
export const MONK_TARGET_X = config.monkTargetX || 150;
export const SLASH_THRESHOLD = config.slashThreshold || 15; 
export const BASE_SPEED = config.baseSpeed || 5.5;
export const MAX_FOCUS = config.maxFocus || 100;
export const BIOME_LENGTH = config.biomeLength || 2500;
export const SEGMENT_LENGTH = config.segmentLength || 2200;
// Speed climbs in TIERS, not one continuous curve: at each tier's `atSec` the
// factor ramps over `rampSec` from the previous tier's plateau up to this tier's
// `factor`, then HOLDS there until the next tier kicks in. Final tier = the max
// factor, held forever. Tune times/factors in data/config.json.
export const SPEED = config.speed || {
  rampSec: 30,
  tiers: [
    { atSec: 0, factor: 1.0 }, { atSec: 60, factor: 1.6 },
    { atSec: 240, factor: 2.0 }, { atSec: 360, factor: 2.5 },
    { atSec: 540, factor: 2.75 }, { atSec: 720, factor: 3.0 }
  ]
};

// Multiplier on BASE_SPEED for a given elapsed run time (seconds). Ramp → plateau
// per tier, so the curve is a staircase: rise, hold, rise, hold, …, max.
export function getSpeedFactor(elapsedSec) {
  const tiers = SPEED.tiers;
  const rampSec = SPEED.rampSec || 30;
  let i = 0;
  for (let k = 0; k < tiers.length; k++) if (elapsedSec >= tiers[k].atSec) i = k;
  const cur = tiers[i];
  const prevFactor = i > 0 ? tiers[i - 1].factor : cur.factor;
  const p = Math.min(1, (elapsedSec - cur.atSec) / rampSec); // ramp progress into this tier
  return prevFactor + (cur.factor - prevFactor) * p;
}
export const STUMBLE = config.stumble || { slowFactor: 0.45, slowDuration: 70, incidentGrace: 90 };
// One recoverable Samurai episode: watching -> mercy -> post-mercy -> execution.
// Reset windows and the post-mercy runway use unscaled 60 fps frame units.
export const SAMURAI = config.samurai || {
  watchResetWindow: 720, postMercyResetWindow: 1080, postMercyGrace: 180,
  watchOffset: 900, drawOffset: 480, edgeMargin: 60, approachLerp: 0.04,
  biomeCool: { bamboo: 1, cave: 0, water: 2 },
};
export const DEMON_CONFIG = config.demons || {
  spawnRate: 70, minSpeedX: 4, maxSpeedX: 9, minSpeedY: 17, maxSpeedY: 25,
  gravity: 0.45, radius: 38, comboWindow: 90, sideWeight: 0.65,
  sideMinYFrac: 0.15, sideMaxYFrac: 0.65, sideMinSpeedX: 7,
  sideMaxSpeedX: 12, sideDriftY: 1, sideGravity: 0.02,
  bottomMinXFrac: 0.25, bottomMaxXFrac: 0.75, bottomDriftX: 3,
  sliceZone: { xFrac: 0.34, yFrac: 0.5 }, defaultT: { side: 78, bottom: 78 },
};
// `spawnRate` is legacy/dormant while generic random coin clusters are disabled.
// Coins currently come from authored `o` cells and one marker coin per spike.
export const COIN_CONFIG = config.coins || { spawnRate: 210, radius: 14 };
// Macro-pacing tunables (RunDirector conductor). Since Phase 3 the obstacle layer
// is LOCKED to the yokai master phase (LULL/RISE/PEAK/FALL) — it no longer runs its
// own oscillator. `baseStart→baseEnd over rampSeconds` is the slow macro-envelope
// (the loudness ceiling that climbs over the run); the phase shapes the obstacle
// layer within it: `restDepth`/`restCeil` set the LULL/FALL valley floor, and
// `peakHeight`/`peakCap` set the RISE build crest. `restPatterns`/`peakPatterns`
// are DORMANT (the old beat-length knobs of the retired oscillator). See RunDirector.js.
export const PACING = config.pacing || {
  rampSeconds: 720, baseStart: 0.15, baseEnd: 0.7, restDepth: 0.4, restCeil: 0.35,
  peakHeight: 0.35, peakCap: 0.85, setpieceDiff: 3, restPatterns: 1, peakPatterns: 2,
  teachDwell: 8, dwellBase: 6, dwellPerDiff: 2.5, gapSeconds: 0.5, jitter: 0.25, introTeach: true
};

// Persistent land-only Yokai pacing: onboarding, LULL/RISE/PEAK/FALL, safe
// blank-slot injection, one swarm per peak, and a shared live cap. Active time
// pauses in water and resumes at LULL without losing roster progression.
export const YOKAI_WOVEN = config.yokaiWoven || {
  cap: 7, introEndSec: 28, kitsuneSec: 35, nofaceSec: 65,
  // Macro-envelope (Flow Conductor Phase 1): the LULL→PEAK pulse rides a slow band
  // that climbs over `envelopeSeconds`. floorBand = LULL floor early→late (never
  // zero ⇒ a yokai floor on land); ceilBand = PEAK ceiling early→late (hiEnd < 1.0
  // so it never strobes to max). envJitter keeps the band from feeling metronomic.
  envelopeSeconds: 600, floorBand: [0.08, 0.22], ceilBand: [0.55, 0.92], envJitter: 0.12,
  lullDuration: [6, 10], riseDuration: [6, 9], fallDuration: [5, 8],
  peakDuration: [4, 6], shapeInterval: [5.5, 2], shapeJitter: 0.25,
  // backoffFloor: how thin the obstacle layer ducks to when the yokai burst leads
  // at PEAK (the unified-clock duck target, Phase 3). replaySkipAbove: above this
  // yokai intensity, don't replay a just-used obstacle wall on top of the burst.
  backoffFloor: 0.15, replaySkipAbove: 0.5,
  introSnack: {
    enabled: true, firstDelaySec: [0.5, 1.5], intervalSec: [0.5, 2],
    maxActive: 3, minScriptGapSec: 1,
  },
};
// Golden Yokai — the Fruit-Ninja "pomegranate" treat. A rare, sparkling special
// yokai that FLIES BY in a ballistic arc like any other yokai (miss the first cut
// and it's gone — no penalty). The first slice ARMS it: time drops to ~zero
// (`frenzyScale`), the camera locks onto it, and it freezes in place so the player
// scrubs it (gated by `hitCdFrames`), each slash firing a ray of light. While armed
// nothing else can be slashed. When the real-time `frenzyFrames` window elapses (or
// `hitCap` is reached) it BURSTS: every other on-screen yokai is sliced at once, a
// coin shower drops, a flash-bang fires, and a short slow-mo settle (`slowmoScale`
// over `slowmoFrames`) lands the "moment of pause". Obstacles are untouched — it
// stays a yokai-layer reward. `arcXFrac` is the apex x of the fly-by arc. All real
// 60fps frame units; tune in data/config.json.
export const GOLDEN = config.golden || {
  firstSpawnSec: 20, spawnCooldownSec: 50, spawnJitter: 0.25, presentFrames: 110, frenzyFrames: 180,
  hitCdFrames: 4, hitCap: 60, radiusMult: 1.4, burstHitPause: 6, slowmoFrames: 38,
  slowmoScale: 0.32, frenzyScale: 0.05, arcXFrac: 0.62, blastRadius: 380, coinsPerHit: 0.4, maxCoins: 22,
  beamLength: 1500, burstShake: 40, burstFlash: 1, burstPunchOut: 0.72,
};
// Dynamic camera juice (CameraSystem). Values seeded from the Camera Juice Lab mock
// (src/mocks/screens/CameraJuiceMock.jsx). `lerpSpeed` is the per-frame ease toward the
// target (mock's samuraiSpeed); `shakeDecay`/`punchDecay` mirror the mock's decays. Per
// mode: yokai (golden treat) pans to the first-hit point with NO letterbox; the samurai DUEL
// (ronin clash — not the mere watching appearance) zooms by the actual monk↔samurai distance
// to keep both framed.
export const CAMERA = config.camera || {
  lerpSpeed: 0.05, shakeDecay: 0.85, punchDecay: 0.1,
  yokai: { zoom: 1.8, tilt: -8, shake: 15, punchIn: 1.1, hitstop: 6 },
  samurai: { zoom: 1.4, tilt: 5, letterbox: 80, frameFrac: 0.6 },
  death: { zoom: 1.7, letterbox: 140, focus: 30, hold: 36, shake: 18 },
};
// Sealed-quiver inhibit read. Timers use real 60fps frame units so the recovery
// challenge stays consistent while the world briefly eases during telegraph.
export const ARROW_TRAP = config.arrowTrap || {
  radius: 54, hitPauseFrames: 8, telegraphFrames: 22, telegraphTimeScale: 0.65,
  stagingRadius: 100, stagingSpreadDeg: 110, launchGapFrames: 5, speed: 14, spinSpeed: 0.03,
  cutRadius: 27, cutGraceFrames: 7, monkHitRadius: 28, tutorialArrows: 3, riseArrows: 4,
  peakArrows: 6, maxIncidentsPerBurst: 1, peakPhaseChance: 0.5, maxPerCycle: 3,
};
export const GATE_CONFIG = config.gate || {
  spawnOffset: 900,
  tntLeadPxStart: 540,
  tntLeadPxMin: 320,
  tntLeadShrinkPerSpeed: 150,
  lethalContactBand: 46,
  blastRadius: 145,
  chainFuseSecMin: 2,
  chainFuseSecMax: 3,
};
export const BOSS_CONFIG = config.bosses || {
  ronin: {
    triggerDistance: 5000, mercyHp: 8, hitCooldown: 6,
    mercyWarning: 60, mercyCharge: 180, executionWarning: 90, executionCharge: 90,
    respawnGap: 7500,
  },
};

// Legacy distance-based lookup; the live run is driven by biomeSchedule.js.
export const BIOMES = ['bamboo', 'village', 'rain'];
export const getBiomeName = (index) => BIOMES[((index % BIOMES.length) + BIOMES.length) % BIOMES.length];

// Legacy distance-based lookup, kept for any caller not yet migrated to the index.
export const getBiome = (dist) => getBiomeName(Math.floor(dist / BIOME_LENGTH));
