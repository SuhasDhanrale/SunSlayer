// Pattern library for the run conductor.
//
// Every pattern declares explicit gameplay ownership with `biomes`.
// Gameplay biomes are:
//   bamboo - all ground visual destinations
//   cave   - the transition tunnel
//   water  - the water destination (the BREATHER)
//
// The 5-family READ vocabulary (RUN_DESIGN §2) — everything else is a re-skin:
//   tempo       i bamboo   I thick bamboo   v vine/kelp   (the calm, sustains combo)
//   adrenaline  x yokai    R raft (ferries a yokai wave)  (reactive bursts)
//   low         s spike    (duck-slice a low hazard; cave glow-skin deferred)
//   timing      T stalactite   (cave-only: time the ceiling drop)
//   solve       = bridge (cut the rope) | K tnt (detonate)   (one aimed slice)
//   o coin      (reward layer, not a read)
//   a arrow-ball (the don't-slice / INHIBIT read: ignore it → safe; mis-slice → archer volley)
//
// NOT pool patterns: the boulder cave-gate wall (a leg-begin set-piece, Phase B)
// and the samurai (a pursuer, not a tile).

export const STEP_PX = 240;

const ALL_BIOMES = ['bamboo', 'cave', 'water'];
const grid = (meta, art) => ({ kind: 'grid', ...meta, art });
const field = (meta, spec) => ({ kind: 'field', ...meta, ...spec });

export const PATTERNS = [
  // ── Ground / bamboo — the full vocabulary is taught here ──────────────────
  field({ id: 'intro-bamboo', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['bamboo'] }, {
    mix: { i: 0.9, I: 0.1 }, band: 'M', density: [0.35, 0.6], length: 10, jitter: 1,
  }),
  grid({ id: 'teach-spike', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['spike'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . s . .
    G . . . .
  `),
  grid({ id: 'teach-bridge', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['bridge'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . . . .
    G . = . .
  `),
  // The INHIBIT read isolated: a lone arrow-ball drifts through. Withhold the
  // blade and it passes; swiping at it bursts the volley (a teachable mistake).
  grid({ id: 'teach-arrow', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['arrow'] }, `
    H . . . .
    A . a . .
    M . . . .
    L . . . .
    G . . . .
  `),
  // Tempo waves — the calm bamboo filler that sustains the combo.
  field({ id: 'obs-bamboo-tempo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['bamboo'] }, {
    mix: { i: 0.75, I: 0.25 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  // Low-read woven into the tempo.
  field({ id: 'obs-spikes-bamboo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['spike', 'bamboo'] }, {
    mix: { s: 0.5, i: 0.4, I: 0.1 }, band: 'M', density: [0.7, 1.0], length: 12, jitter: 1,
  }),
  // INHIBIT-under-pressure: an arrow-ball drifts through a tempo run. The blade is
  // busy slicing bamboo right beside the one thing it must NOT touch — the read is
  // restraint, not reaction. Spaced so the arrow-ball is never crowded.
  grid({ id: 'combo-arrow-tempo', category: 'combo', difficulty: 2, biomes: ['bamboo'], uses: ['arrow', 'bamboo', 'enemy'] }, `
    H . . . . . . . . .
    A . . . a . . . . .
    M . i . . . i . i .
    L . . . . . . . . .
    G . . . . . . . . .
  `),
  grid({ id: 'combo-spike-yokai', category: 'combo', difficulty: 1, biomes: ['bamboo'], uses: ['spike', 'enemy'] }, `
    H . . . . .
    A . x . x .
    M . . . . .
    L . s . . s
    G . . . . .
  `),
  // Spaced bridge set-piece interleaved with low spikes + a yokai pop — the run's
  // genuinely-hard lethal test (a missed gap kills). Never authored densely.
  grid({ id: 'combo-spike-bridge', category: 'combo', difficulty: 3, biomes: ['bamboo'], uses: ['bridge', 'spike', 'enemy'] }, `
    H . . . . . . . . . .
    A . x . . . . . . x .
    M . . . . . . . . . .
    L . . . s . . s . . .
    G . . = . . . . = . .
  `),

  // ── Shared flow patterns — no biome-specific physical obstacle ────────────
  grid({ id: 'teach-yokai', category: 'teach', difficulty: 0, biomes: ALL_BIOMES, uses: ['enemy'] }, `
    H . . . . .
    A . x . . x
    M . . . . .
    L . . . . .
    G . . . . .
  `),
  field({ id: 'food-yokai-pop', category: 'food', difficulty: 1, biomes: ALL_BIOMES, uses: ['enemy'], stepPx: 220 }, {
    mix: { x: 1 }, band: 'A', density: [0.35, 0.75], length: 8, jitter: 1, cap: 8,
  }),
  field({ id: 'combo-yokai-swarm', category: 'combo', difficulty: 4, biomes: ALL_BIOMES, uses: ['enemy'], stepPx: 200, burst: [2, 4] }, {
    mix: { x: 1 }, band: 'M', density: [0.5, 1.0], length: 12, jitter: 1, cap: 14,
  }),
  grid({ id: 'rest-gold-rush', category: 'rest', difficulty: 0, biomes: ALL_BIOMES, uses: ['coin'] }, `
    H o . o . o . o o . o . o . o . o . .
    A . o . o . o . o . o o . o . o . o .
    M o . o . o . o o . o . o . o . o . .
    L . o . o . o . o . o o . o . o . o .
    G o . o . o . o o . o . o . o . o . .
  `),

  // ── Cave — the high-tension tunnel (stalactite timing is cave-exclusive) ──
  grid({ id: 'teach-stalactite', category: 'teach', difficulty: 0, biomes: ['cave'], uses: ['stalactite'] }, `
    H . T . .
    A . . . .
    M . . . .
    L . . . .
    G . . . .
  `),
  grid({ id: 'teach-tnt', category: 'teach', difficulty: 0, biomes: ['cave'], uses: ['tnt'] }, `
    H . . . .
    A . . . .
    M . K . .
    L . . . .
    G . . . .
  `),
  // Cave bamboo tempo — the calm between drops.
  field({ id: 'obs-cave-bamboo', category: 'obstacle', difficulty: 1, biomes: ['cave'], uses: ['bamboo'] }, {
    mix: { i: 0.8, I: 0.2 }, band: 'M', density: [0.55, 0.95], length: 12, jitter: 1,
  }),
  // Cave low read (glow-spike skin deferred — uses the spike spec for now).
  field({ id: 'obs-cave-spikes', category: 'obstacle', difficulty: 1, biomes: ['cave'], uses: ['spike', 'bamboo'] }, {
    mix: { s: 0.5, i: 0.5 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  field({ id: 'obs-stalactites', category: 'obstacle', difficulty: 1, biomes: ['cave'], uses: ['stalactite'], stepPx: 300 }, {
    mix: { T: 1 }, band: 'H', density: [0.55, 0.95], length: 12, jitter: 0,
  }),
  grid({ id: 'obs-stalactite-curtain', category: 'obstacle', difficulty: 2, biomes: ['cave'], uses: ['stalactite'], stepPx: 90 }, `
    H T . T T T .
    A . . . . . .
    M . . . . . .
    L . . . . . .
    G . . . . . .
  `),
  grid({ id: 'combo-stalactite-yokai', category: 'combo', difficulty: 2, biomes: ['cave'], uses: ['stalactite', 'enemy'] }, `
    H T . T . T
    A . x . x .
    M . . . . .
    L . . . . .
    G . . . . .
  `),
  grid({ id: 'combo-tnt-stalactite', category: 'combo', difficulty: 3, biomes: ['cave'], uses: ['tnt', 'stalactite'] }, `
    H T . . T .
    A . . . . .
    M . K . . K
    L . . . . .
    G . . . . .
  `),
  grid({ id: 'combo-tnt-yokai', category: 'combo', difficulty: 2, biomes: ['cave'], uses: ['tnt', 'enemy'] }, `
    H . . . . .
    A x . x . x
    M . K . K .
    L . . . . .
    G . . . . .
  `),

  // ── Water — the BREATHER: vines (tempo) + raft→yokai (adrenaline) only ────
  // No spikes, no arrows, no blockers. The only death in water is the samurai.
  grid({ id: 'teach-vine', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['vine'] }, `
    H . . . .
    A . v . .
    M . . . .
    L . . . .
    G . . . .
  `),
  grid({ id: 'teach-raft', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['raft', 'enemy'] }, `
    H . . . .
    A . . . .
    M . R . .
    L . . . .
    G . . . .
  `),
  // Vine tempo — water's bamboo twin. Two spacings so the breather's obstacle
  // deck has variety to draw from (no single-pattern repeat): a relaxed sway…
  field({ id: 'obs-vines', category: 'obstacle', difficulty: 1, biomes: ['water'], uses: ['vine'], stepPx: 280 }, {
    mix: { v: 1 }, band: 'A', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  // …and a tighter stream that asks for a steadier slice cadence (still vines only).
  field({ id: 'obs-vine-stream', category: 'obstacle', difficulty: 1, biomes: ['water'], uses: ['vine'], stepPx: 220 }, {
    mix: { v: 1 }, band: 'M', density: [0.7, 1.0], length: 14, jitter: 1,
  }),
  grid({ id: 'combo-vine-yokai', category: 'combo', difficulty: 2, biomes: ['water'], uses: ['vine', 'enemy'] }, `
    H . . . . .
    A v . x . v
    M . . . . .
    L . x . x .
    G . . . . .
  `),
  // Raft delivers a yokai burst — the water adrenaline beat.
  grid({ id: 'combo-raft-yokai', category: 'combo', difficulty: 3, biomes: ['water'], uses: ['raft', 'enemy'] }, `
    H . . . . .
    A . . . . .
    M R . . . R
    L . . . . .
    G . . . . .
  `),
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const CATEGORIES = ['teach', 'obstacle', 'combo', 'rest', 'food'];
export const GAMEPLAY_BIOMES = ['bamboo', 'cave', 'water'];

// Scripted teach curriculum per biome: introduce → isolate → reinforce.
// Every id MUST exist in PATTERNS_BY_ID.
export const OPENINGS = {
  bamboo: [
    'intro-bamboo',       // introduce tempo
    'teach-spike',        // isolate the low read
    'teach-yokai',        // isolate adrenaline
    'teach-arrow',        // isolate the inhibit read (don't-slice)
    'teach-bridge',       // isolate the solve
    'combo-spike-yokai',  // reinforce (low + adrenaline together)
  ],
  cave: [
    'teach-stalactite',   // introduce the timing read
    'teach-tnt',          // isolate the cave solve
    'obs-stalactite-curtain',
    'combo-tnt-stalactite',
  ],
  water: [
    'teach-vine',         // introduce the water tempo
    'teach-raft',         // isolate raft→yokai
    'obs-vines',
    'combo-raft-yokai',
  ],
};

export const OPENING = OPENINGS.bamboo;
