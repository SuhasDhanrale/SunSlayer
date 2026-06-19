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
export const SEGMENT_SECONDS = config.segmentSeconds || 120; // wall-clock-ish length of a segment before the biome changes
// Speed climbs in TIERS, not one continuous curve: at each tier's `atSec` the
// factor ramps over `rampSec` from the previous tier's plateau up to this tier's
// `factor`, then HOLDS there until the next tier kicks in. Final tier = the max
// factor, held forever. Tune times/factors in data/config.json.
export const SPEED = config.speed || {
  rampSec: 30,
  tiers: [
    { atSec: 0, factor: 1.0 }, { atSec: 120, factor: 1.7 },
    { atSec: 240, factor: 2.3 }, { atSec: 360, factor: 2.85 }
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
export const STUMBLE = config.stumble || { threshold: 3, slowFactor: 0.45, slowDuration: 70 };
// The Samurai — the run's one escalating pursuer and only non-blocker death.
// coolWindow = unscaled frames of clean play to drop a tier (conservative so a
// bad patch isn't trivially erased); watch/drawOffset = his stand-off (px ahead
// of the monk) per tier; approachLerp = how fast he glides to it. biomeCool =
// per-biome multiplier on the cooling rate — the BIOME MACRO tension (RUN_DESIGN
// §5, Phase E2): cave RATCHETS (0 = no cooling, the gauntlet holds him), water is
// the breather (>1 = cools faster), bamboo neutral (1). See SamuraiSystem.
export const SAMURAI = config.samurai || {
  coolWindow: 360, watchOffset: 900, drawOffset: 480, approachLerp: 0.04,
  biomeCool: { bamboo: 1, cave: 0, water: 2 },
};
export const DEMON_CONFIG = config.demons || { spawnRate: 70, minSpeedX: 4, maxSpeedX: 9, minSpeedY: 17, maxSpeedY: 25, gravity: 0.45, radius: 38, comboWindow: 90 };
export const COIN_CONFIG = config.coins || { spawnRate: 210, value: 25, radius: 14 };
// Macro-pacing tunables (RunDirector conductor). The run's tension is an
// intensity CURVE: a rising baseline (baseStart→baseEnd over rampSeconds) with a
// REST↔PEAK oscillation on top (restDepth dips below baseline, peakHeight rises
// above), jittered so it never feels metronomic. The conductor draws patterns
// from per-category decks to match where the curve is. See RunDirector.js.
export const PACING = config.pacing || {
  rampSeconds: 480, baseStart: 0.15, baseEnd: 0.7, restDepth: 0.4, peakHeight: 0.35,
  restPatterns: 1, peakPatterns: 2, teachDwell: 8, dwellBase: 6, dwellPerDiff: 2.5,
  gapSeconds: 0.5, jitter: 0.25, introTeach: true
};

// CoinReward (reward layer, NOT part of patterns). Wave spacing in distance units,
// lerps calmGap→busyGap by intensity; flood below rushBelow (gold rush), go quiet
// above busyStop (peaks). spikeChance = chance a spike gets a coin arc over it.
export const COIN_REWARD = config.coinReward || {
  calmGap: 500, busyGap: 1200, busyStop: 0.6, spikeChance: 0.6
};

// Woven yokai (RunDirector). An independent, slow ebb/flow that sprinkles yokai
// flurries OVER the authored pattern on land biomes — the "enemy waves are woven,
// not a phase" resolution (RUN_DESIGN). It rides its own sine (periodSec) so the
// chaos waxes/wanes out of step with the main tension curve; flurry frequency
// (gapMin/Max frames, lerped by the wave) and size (maxBurst) scale with it, and
// it never exceeds `cap` live yokai. Water expresses this via raft size instead.
export const YOKAI_WOVEN = config.yokaiWoven || {
  periodSec: 18, cap: 7, gapMinFrames: 90, gapMaxFrames: 300, maxBurst: 2
};
export const GATE_CONFIG = config.gate || {
  spawnOffset: 900,
  tntLeadPxStart: 540,
  tntLeadPxMin: 320,
  tntLeadShrinkPerSpeed: 150,
  lethalContactBand: 46,
  blastRadius: 280
};
export const BOSS_CONFIG = config.bosses || { archer: { triggerDistance: 3000, respawnGap: 4500 }, ronin: { triggerDistance: 5000, hp: 15, respawnGap: 7500 } };

// Biomes are now driven by an explicit segment index (advanced when an arrow
// volley is cleared), NOT by raw distance — so a ronin interrupt can add distance
// without changing biome. Volcano biome was removed (it was just a red tint).
export const BIOMES = ['bamboo', 'village', 'rain'];
export const getBiomeName = (index) => BIOMES[((index % BIOMES.length) + BIOMES.length) % BIOMES.length];

// Legacy distance-based lookup, kept for any caller not yet migrated to the index.
export const getBiome = (dist) => getBiomeName(Math.floor(dist / BIOME_LENGTH));
