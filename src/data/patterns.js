// Run-conductor pattern library.
//
// HOW TO READ A PATTERN
// ---------------------
// id         Stable name used by OPENINGS, tools, and debug output.
// category   Conductor phase: teach, obstacle, combo, rest, or food.
// difficulty Minimum intended difficulty tier.
// biomes     Gameplay pools allowed to select the pattern.
// uses       Descriptive tags for tooling; these tags do not spawn entities.
// stepPx     Horizontal distance between columns (defaults to STEP_PX).
//
// A grid is an authored encounter. Rows are H/A/M/L/G (high, air, middle,
// low, ground); columns run left-to-right through encounter time.
// A field procedurally fills `length` columns from `mix`. `density` is its
// low-to-high intensity occupancy range, `band` is the preferred row, and
// `jitter` allows neighboring-row movement.
//
// GAMEPLAY BIOMES
// ---------------
// bamboo  Every surface destination: rain, sunset, sakura, snow, volcano, etc.
//         Full vocabulary: bamboo, spikes, arrows, bridges, and yokai.
// cave    Transition tunnel: stalactites, TNT, arrows, and yokai.
// water   Breather destination: vines and raft-delivered yokai are intended.
//         Patterns marked ALL_BIOMES currently also enter the water pool.
//
// SYMBOL / PLAYER-READ LEGEND (RUN_DESIGN section 2)
// --------------------------------------------------
// i thin bamboo, I thick bamboo, v water vine  -> tempo slice
// x yokai, R raft carrying yokai               -> adrenaline slice
// s floor spike                                -> low slice
// T falling stalactite                         -> timed slice
// = bridge rope, K TNT                         -> aimed solve slice
// a arrow-ball                                 -> inhibit: do not slice
// o coin                                       -> reward, not an obstacle read
// . empty cell
//
// Not normal pool patterns:
// - The boulder cave-gate wall is a biome-entry set-piece owned elsewhere.
// - The samurai is a miss-driven pursuer owned by SamuraiSystem, never a tile.

export const STEP_PX = 240;

const ALL_BIOMES = ['bamboo', 'cave', 'water'];
const grid = (meta, art) => ({ kind: 'grid', ...meta, art });
const field = (meta, spec) => ({ kind: 'field', ...meta, ...spec });

export const PATTERNS = [
  // ── Ground / bamboo — the full vocabulary is taught here ──────────────────
  // Opening calm: sparse thin/thick bamboo teaches the basic tempo slice.
  field({ id: 'intro-bamboo', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['bamboo'] }, {
    mix: { i: 0.9, I: 0.1 }, band: 'M', density: [0.35, 0.6], length: 10, jitter: 1,
  }),
  // Isolated low read: one floor spike with no competing target.
  grid({ id: 'teach-spike', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['spike'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . s . .
    G . . . .
  `),
  // Isolated solve read: cut one bridge rope before reaching its gap.
  grid({ id: 'teach-bridge', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['bridge'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . . . .
    G . = . .
  `),
  // Isolated inhibit read: ignore the arrow-ball; slicing it triggers a volley.
  grid({ id: 'teach-arrow', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['arrow'] }, `
    H . . . .
    A . a . .
    M . . . .
    L . . . .
    G . . . .
  `),
  // Core surface filler: scalable thin/thick bamboo tempo wave.
  field({ id: 'obs-bamboo-tempo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['bamboo'] }, {
    mix: { i: 0.75, I: 0.25 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  // Surface pressure: mixes the low spike read into normal bamboo tempo.
  field({ id: 'obs-spikes-bamboo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['spike', 'bamboo'] }, {
    mix: { s: 0.5, i: 0.4, I: 0.1 }, band: 'M', density: [0.7, 1.0], length: 12, jitter: 1,
  }),
  // Inhibit under pressure: bamboo invites slicing around one protected arrow-ball.
  // Yokai extend the encounter after the arrow-and-bamboo opening pressure.
  grid({ id: 'combo-arrow-tempo', category: 'combo', difficulty: 2, biomes: ['bamboo'], uses: ['arrow', 'bamboo', 'enemy'] }, `
    H . . . . . . . . . . . . . . . . . . .
    A . . . a . . . . . . . . . . . . . . .
    M . i . . . i . i . . . . . . . . . . .
    L . . . . . . . . . . x . . . . . . x .
    G . . . . . . . . . . . . . . . . . . .
  `),
  // First reinforcement combo: alternate low spikes with airborne yokai.
  grid({ id: 'combo-spike-yokai', category: 'combo', difficulty: 1, biomes: ['bamboo'], uses: ['spike', 'enemy'] }, `
    H . . . . . . . . . .
    A . x . . . . x . . .
    M . . . . . . . . . .
    L . s . . . . . . s .
    G . . . . . . . . . .
  `),
  // Hard surface set-piece: spaced lethal bridge gaps plus spikes and yokai.
  grid({ id: 'combo-spike-bridge', category: 'combo', difficulty: 3, biomes: ['bamboo'], uses: ['bridge', 'spike', 'enemy'] }, `
    H . . . . . . . . . .
    A . x . . . . . . x .
    M . . . . . . . . . .
    L . . . . . . s s . .
    G . . = . . . . . . .
  `),

  // ── Shared flow patterns — no biome-specific physical obstacle ────────────
  // SHARED POOL: eligible in bamboo, cave, and water.
  // IMPORTANT: direct `x` yokai can therefore appear in water without a raft.
  // That is current runtime behavior, although RUN_DESIGN intends raft delivery.
  // Isolated direct-yokai lesson; the bamboo OPENING explicitly uses it.
  grid({ id: 'teach-yokai', category: 'teach', difficulty: 0, biomes: ALL_BIOMES, uses: ['enemy'] }, `
    H . . . . . . . . . . . . . . .
    A . x . . . . . . x . . . . . .
    M . . . . . . . . . . . . . . .
    L . . . . . . . . . . . . . . .
    G . . . . . . . . . . . . . . .
  `),
  // Light direct-yokai reward beat: sparse spawns with an eight-yokai cap.
  field({ id: 'food-yokai-pop', category: 'food', difficulty: 1, biomes: ALL_BIOMES, uses: ['enemy'], stepPx: 220 }, {
    mix: { x: 1 }, band: 'A', density: [0.35, 0.75], length: 8, jitter: 1, cap: 8,
  }),
  // Peak direct-yokai beat: an occupied cell emits a capped burst of 2-4.
  field({ id: 'combo-yokai-swarm', category: 'combo', difficulty: 4, biomes: ALL_BIOMES, uses: ['enemy'], stepPx: 200, burst: [2, 4] }, {
    mix: { x: 1 }, band: 'M', density: [0.5, 1.0], length: 12, jitter: 1, cap: 14,
  }),
  // Universal recovery beat: coins only and no obstacle read.
  grid({ id: 'rest-gold-rush', category: 'rest', difficulty: 0, biomes: ALL_BIOMES, uses: ['coin'] }, `
    H o . o . o . o o . o . o . o . o . .
    A . o . o . o . o . o o . o . o . o .
    M o . o . o . o o . o . o . o . o . .
    L . o . o . o . o . o o . o . o . o .
    G o . o . o . o o . o . o . o . o . .
  `),

  // ── Cave — the high-tension tunnel (stalactite timing is cave-exclusive) ──
  // CAVE POOL: high-tension transition tunnel.
  // Isolated timing read: one ceiling stalactite.
  grid({ id: 'teach-stalactite', category: 'teach', difficulty: 0, biomes: ['cave'], uses: ['stalactite'] }, `
    H . . . . T .
    A . . . . . .
    M . . . . . .
    L . . . . . .
    G . . . . . .
  `),
  // Isolated cave solve read: one TNT target. This is not the boulder-wall gate.
  grid({ id: 'teach-tnt', category: 'teach', difficulty: 0, biomes: ['cave'], uses: ['tnt'] }, `
    H . . . . . . . . . . . . . . . . . . .
    A . . . . . . . . . . . . . . . . . . .
    M . K . . . . . . . . K . . . . . . . .
    L . . . . . . . . . . . . . . . . . . .
    G . . . . . . . . . . . . . . . . . . .
  `),
  // Relaxed ceiling-drop wave: widely spaced stalactites on the high band.
  field({ id: 'obs-stalactites', category: 'obstacle', difficulty: 1, biomes: ['cave'], uses: ['stalactite'], stepPx: 300 }, {
    mix: { T: 1 }, band: 'H', density: [0.55, 0.95], length: 12, jitter: 0,
  }),
  // Dense timing test: a short authored curtain of falling stalactites.
  grid({ id: 'obs-stalactite-curtain', category: 'obstacle', difficulty: 3, biomes: ['cave'], uses: ['stalactite'], stepPx: 90 }, `
    H T . T T . . T . . . .
    A . . . . . . . . . . .
    M . x . . . . . . . . .
    L . . . . . . . . . . .
    G . . . . . . . . . . .
  `),
  // Cave reaction combo: ceiling timing alternates with airborne yokai.
  grid({ id: 'combo-stalactite-yokai', category: 'combo', difficulty: 2, biomes: ['cave'], uses: ['stalactite', 'enemy'] }, `
    H T . . . . . . . .
    A . x . x . x . x .
    M . . . . . . . . .
    L . . . . . . . . .
    G . . . . . . . . .
  `),
  // Cave solve/timing combo: repeated TNT targets under ceiling pressure.
  grid({ id: 'combo-tnt-stalactite', category: 'combo', difficulty: 2, biomes: ['cave'], uses: ['tnt', 'stalactite'] }, `
    H T . . T .
    A . . . . .
    M . . . . K
    L . . . . .
    G . . . . .
  `),
  // Cave solve/reaction combo: aimed TNT slices alternate with yokai.
  grid({ id: 'combo-tnt-yokai', category: 'combo', difficulty: 3, biomes: ['cave'], uses: ['tnt', 'enemy'] }, `
    H . . . . .
    A x . x . x
    M . K . K .
    L . . . . .
    G . . . . .
  `),
  // The cave drawbridge solve isolated — a single hoisted span over a pit (cut the
  // high rope or fall in). Spaced wide; a missed gap is lethal, never crowd it.
  // DESIGN CAVEAT: RUN_DESIGN assigns bridge to surface and TNT to cave; this
  // cave bridge remains in the runtime pool until that mismatch is resolved.
  grid({ id: 'teach-cave-bridge', category: 'teach', difficulty: 1, biomes: ['cave'], uses: ['bridge'] }, `
    H . . . . . . . . . . . .
    A . . . . . . . . . . . .
    M . . . . . . . . . . . .
    L . . . . . . . . . . . .
    G . = . . . = = . . . . .
  `),
  // Drawbridge gap woven with the ceiling drop: time the stalactite, then make the
  // aimed rope cut before the pit arrives — the cave's genuinely-hard lethal test.
  // Cave hard set-piece: ceiling timing followed by one lethal bridge solve.
  grid({ id: 'combo-bridge-stalactite', category: 'combo', difficulty: 3, biomes: ['cave'], uses: ['bridge', 'stalactite', 'enemy'] }, `
    H . T . . . . . T .
    A . . . . x . . . .
    M . . . . . . . . .
    L . . . . . . . . .
    G . . . = . . . . .
  `),

  // ── Water — the BREATHER: grasping vines + raft→yokai (adrenaline) only ────
  // No spikes, no arrows, no blockers. Vines GRASP (ignored → capture stumble) and
  // rafts RAM, but neither is directly lethal — the only death in water is the samurai.
  // WATER POOL: breather biome. Water-local patterns use vines and rafts only;
  // shared ALL_BIOMES patterns can still add direct yokai. Missing a vine or raft
  // causes a stumble that feeds pursuit, not immediate death.
  // Isolated water tempo read: one grasping vine.
  grid({ id: 'teach-vine', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['vine'] }, `
    H . . . .
    A . v . .
    M . . . .
    L . . . .
    G . . . .
  `),
  // Isolated water adrenaline read: slice one raft to release its yokai wave.
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
  // Water-local mixed combo: vines plus direct yokai, not raft-delivered.
  // DESIGN CAVEAT: this conflicts with the raft-only delivery rule in RUN_DESIGN.
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

// BIOME OPENINGS
// --------------
// Scripted curricula played in order before procedural selection begins.
// Every id must exist in PATTERNS_BY_ID and be eligible for the matching biome.
// RunDirector rebuilds this list whenever gameplay biome changes, so returning
// cave and water legs repeat their openings; lessons are not globally remembered.
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
    'teach-tnt',          // isolate the cave solve (detonate)
    'teach-cave-bridge',  // isolate the cave solve (drawbridge — cut the hoist rope)
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
