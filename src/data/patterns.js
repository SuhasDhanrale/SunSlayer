// Run-conductor pattern library.
//
// HOW TO READ A PATTERN
// ---------------------
// id         Stable name used by OPENINGS, tools, and debug output.
// category   Conductor phase: teach, obstacle, combo, or rest.
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
// water   Breather destination: vines (surface tempo) + bubbles (rising timed
//         read from below). Yokai and rafts are excluded.
//
// SYMBOL / PLAYER-READ LEGEND (RUN_DESIGN section 2)
// --------------------------------------------------
// i thin bamboo, I thick bamboo, v water vine  -> tempo slice
// x yokai (grove swarm fixture ONLY — see note) -> adrenaline slice
// s floor spike                                -> low slice
// T falling stalactite, b rising water bubble  -> timed slice
// = bridge rope, K TNT                         -> aimed solve slice
// a sealed quiver (run-once lesson only)       -> inhibit: do not slice
// o coin                                       -> reward, not an obstacle read
// . empty cell
//
// YOKAI ARE NOT AUTHORED HERE (Phase 4 — one yokai path).
// --------------------------------------------------------
// This file is the THREAT vocabulary only. Land yokai arrive through a SINGLE
// path: the shape cadence (RunDirector.tickShapes → yokaiShapes.js). The two
// old paths are gone — `x` cells baked into obstacle grids, and the woven
// blank-cell injection. The lone remaining `x` lives in `bonus-swarm`, the
// grove-only one-pass fixture that DemonSystem fires for the bonus leg.
//
// Not normal pool patterns:
// - The boulder cave-gate wall is a biome-entry set-piece owned elsewhere.
// - The samurai is a miss-driven pursuer owned by SamuraiSystem, never a tile.

export const STEP_PX = 240;

const _ALL_BIOMES = ['bamboo', 'cave', 'water'];
const GROVE_BIOMES = ['grove'];
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
    H . . . . . . . . . . . .
    A . . . . . . . . . . . .
    M . . . . . . . . . . . .
    L . s . . . . . . . . . .
    G . . . . . . . . . . . .
  `),
  // Isolated solve read: cut one bridge rope before reaching its gap.
  grid({ id: 'teach-bridge', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['bridge'] }, `
    H . . . . . . . . . . . .
    A . . . . . . . . . . . .
    M . . . . . . . . . . . .
    L . . . . . . . . . . . .
    G . = . . . . . . . . . .
  `),
  // Run-once inhibit lesson. Later quivers live only inside authored Yokai shapes.
  grid({ id: 'teach-arrow', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['arrow'], once: true }, `
    H . . . . . . . . . . . .
    A . a . . . . . . . . . .
    M . . . . . . . . . . . .
    L . . . . . . . . . . . .
    G . . . . . . . . . . . .
  `),
  // Core surface filler: scalable thin/thick bamboo tempo wave.
  field({ id: 'obs-bamboo-tempo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['bamboo'] }, {
    mix: { i: 0.75, I: 0.25 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  // Surface pressure: mixes the low spike read into normal bamboo tempo.
  field({ id: 'obs-spikes-bamboo', category: 'obstacle', difficulty: 2, biomes: ['bamboo'], uses: ['spike', 'bamboo'] }, {
    mix: { s: 0.5, i: 0.4, I: 0.1 }, band: 'M', density: [0.6, 0.8], length: 12, jitter: 1,
  }),
  // Spaced low-spike rhythm. (Pre-Phase-4 this leaned on woven yokai for its second
  // beat; that path is gone, so it's now a thin spike pattern — Phase 6 to re-author.)
  grid({ id: 'combo-spike-yokai', category: 'combo', difficulty: 1, biomes: ['bamboo'], uses: ['spike'] }, `
    H . . . . . . . . . . . . . . . . . . . .
    A . . . . . . . . . . . . . . . . . . . .
    M . . . . . . . . . . . . . . . . . . . .
    L . s . . . . . . s . . . . . . . . . . .
    G . . . . . . . . . . . . . . . . . . . .
  `),
  // Hard surface set-piece: spaced lethal bridge gaps plus spikes (a true
  // obstacle-on-obstacle combo — spike read under an aimed bridge solve).
  grid({ id: 'combo-spike-bridge', category: 'combo', difficulty: 3, biomes: ['bamboo'], uses: ['bridge', 'spike'] }, `
    H . . . . . . . . . . . . . . . . . . . .
    A . . . . . . . . . . . . . . . . . . . .
    M . . . . . . . . . . . . . . . . . . . .
    L . . . . . . s s . . . . . . . . . . . .
    G . . = . . . . . . . . . . . . . . . . .
  `),

  // ── Shared flow patterns — no biome-specific physical obstacle ────────────
  // SHARED POOL: eligible in bamboo, cave, and water.
  // (The old yokai-only swarm/intro fixtures — teach-yokai, food-yokai-pop,
  // combo-yokai-swarm — were removed in Phase 4: yokai now come only from the
  // shape cadence, so these data-level swarms are dead. The grove keeps its own.)
  // Universal recovery beat: coins only and no obstacle read.
  /*grid({ id: 'rest-gold-rush', category: 'rest', difficulty: 0, biomes: ALL_BIOMES, uses: ['coin'] }, `
    H o . o . o . o . .
    A . o . o . o . o .
    M o . o . o . o . .
    L . o . o . o . o . 
    G . . . . . . . . . 
  `),*/

  // ── Cave — the high-tension tunnel (stalactite timing is cave-exclusive) ──
  // CAVE POOL: high-tension transition tunnel.
  // Isolated timing read: one ceiling stalactite.
  grid({ id: 'teach-stalactite', category: 'teach', difficulty: 0, biomes: ['cave'], uses: ['stalactite'] }, `
    H . . . . T . . . . .
    A . . . . . . . . . .
    M . . . . . . . . . .
    L . . . . . . . . . .
    G . . . . . . . . . .
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
    M . . . . . . . . . . .
    L . . . . . . . . . . .
    G . . . . . . . . . . .
  `),
  // Sparse ceiling-timing beat. (Pre-Phase-4 the second read was woven yokai; that
  // path is gone, so it's now a single stalactite drop — Phase 6 to re-author.)
  grid({ id: 'combo-stalactite-yokai', category: 'combo', difficulty: 2, biomes: ['cave'], uses: ['stalactite'] }, `
    H T . . . . . . . .
    A . . . . . . . . .
    M . . . . . . . . .
    L . . . . . . . . .
    G . . . . . . . . .
  `),
  // Cave solve/timing combo: repeated TNT targets under ceiling pressure.
  grid({ id: 'combo-tnt-stalactite', category: 'combo', difficulty: 2, biomes: ['cave'], uses: ['tnt', 'stalactite'] }, `
    H T . . T . . . . . . . . . . .
    A . . . . . . . . . . . . . . .
    M . . . . K . . . . . . . . . .
    L . . . . . . . . . . . . . . .
    G . . . . . . . . . . . . . . .
  `),
  // Aimed TNT solve rhythm. (Pre-Phase-4 these alternated with woven yokai; that
  // path is gone, so it's now two spaced TNT targets — Phase 6 to re-author.)
  grid({ id: 'combo-tnt-yokai', category: 'combo', difficulty: 3, biomes: ['cave'], uses: ['tnt'] }, `
    H . . . . . . . . . . . . . . .
    A . . . . . . . . . . . . . . .
    M . K . K . . . . . . . . . . .
    L . . . . . . . . . . . . . . .
    G . . . . . . . . . . . . . . .
  `),
  // The cave drawbridge solve isolated — a single hoisted span over a pit (cut the
  // high rope or fall in). Spaced wide; a missed gap is lethal, never crowd it.
  // DESIGN CAVEAT: RUN_DESIGN assigns bridge to surface and TNT to cave; this
  // cave bridge remains in the runtime pool until that mismatch is resolved.
  grid({ id: 'teach-cave-bridge', category: 'teach', difficulty: 1, biomes: ['cave'], uses: ['bridge'] }, `
    H . . . . . . . . . . . . . . . . . . . . . .
    A . . . . . . . . . . . . . . . . . . . . . .
    M . . . . . . . . . . . . . . . . . . . . . .
    L . . . . . . . . . . . . . . . . . . . . . .
    G . = . . . = = . . . . . . . . . . . . . . .
  `),
  // Drawbridge gap woven with the ceiling drop: time the stalactite, then make the
  // aimed rope cut before the pit arrives — the cave's genuinely-hard lethal test.
  // Cave hard set-piece: ceiling timing followed by one lethal bridge solve.
  grid({ id: 'combo-bridge-stalactite', category: 'combo', difficulty: 3, biomes: ['cave'], uses: ['bridge', 'stalactite'] }, `
    H . T . . . . . T . . . . . . . . . . .
    A . . . . . . . . . . . . . . . . . . .
    M . . . . . . . . . . . . . . . . . . .
    L . . . . . . . . . . . . . . . . . . .
    G . . . = . . . . . . . . . . . . . . .
  `),

  // ── Water — the breather: vines (surface) + bubbles (from below) ───────────
  // WATER POOL: vines + rising bubbles. Yokai injection and raft gameplay are off.
  // Isolated water tempo read: one grasping vine.
  grid({ id: 'teach-vine', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['vine'] }, `
    H . . . . . . . . . . . . . .
    A . v . . . . . . . . . . . .
    M . . . . . . . . . . . . . .
    L . . . . . . . . . . . . . .
    G . . . . . . . . . . . . . .
  `),
  // Isolated timed read from below: one bubble wells up — pop it on the climb, or
  // it scoops the monk up (the watch-below half of the water read).
  grid({ id: 'teach-bubble', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['bubble'] }, `
    H . . . . . . . . . . . . . .
    A . . . . . . . . . . . . . .
    M . . . . . . . . . . . . . .
    L . b . . . . . . . . . . . .
    G . . . . . . . . . . . . . .
  `),
  // Vine tempo — water's bamboo twin. Two spacings so the breather's obstacle
  // deck has variety to draw from (no single-pattern repeat): a relaxed sway…
  field({ id: 'obs-vines', category: 'obstacle', difficulty: 1, biomes: ['water'], uses: ['vine'], stepPx: 280 }, {
    mix: { v: 1 }, band: 'A', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  // …and a tighter stream that asks for a steadier slice cadence (still vines only).
  field({ id: 'obs-vine-stream', category: 'obstacle', difficulty: 1, biomes: ['water'], uses: ['vine'], stepPx: 220 }, {
    mix: { v: 1 }, band: 'M', density: [0.4, 0.8], length: 14, jitter: 1,
  }),
  // Sparse bubble field — each one needs its own climb window, so they spawn well
  // spaced (wide stepPx, low density): the timed-read deck for the breather.
  field({ id: 'obs-bubbles', category: 'obstacle', difficulty: 1, biomes: ['water'], uses: ['bubble'], stepPx: 360 }, {
    mix: { b: 1 }, band: 'L', density: [0.45, 0.8], length: 10, jitter: 0,
  }),
  // Two-channel water read: surface vines to keep tempo while bubbles rise from
  // below — the "watch above and below" combo, kept gentle (breather).
  field({ id: 'combo-vine-bubble', category: 'combo', difficulty: 2, biomes: ['water'], uses: ['vine', 'bubble'], stepPx: 300 }, {
    mix: { v: 0.62, b: 0.38 }, band: 'A', density: [0.5, 0.85], length: 12, jitter: 1,
  }),

  // ── Grove — the BONUS beat. These are NOT drawn from the procedural pools: the
  // RunDirector forces ONE of them by the schedule entry's `payload` and loops it
  // for the grove's short duration. Each is a single-flavour fantasy. ────────────
  // payload:'coins' — a tight river of coins (pure reward, no obstacle read). Far
  // denser/closer-packed than rest-gold-rush: small stepPx + a solid mid band.
  grid({ id: 'bonus-coins', category: 'rest', difficulty: 0, biomes: GROVE_BIOMES, uses: ['coin'], stepPx: 130 }, `
    H o . o o . o o . o o . o
    A . o o . o o . o o . o o
    M o o o o o o o o o o o o
    L . o o . o o . o o . o o
    G o . o o . o o . o o . o
  `),
  // payload:'gauntlet' — the short cave FILLED with TNT-rigged boulder pillars (each
  // 'K' is a 1–3 pillar cluster). Tight stepPx + a K on every column packs the tunnel
  // into a near-continuous rubble wall — the "blast your way through" power fantasy.
  grid({ id: 'bonus-gauntlet', category: 'obstacle', difficulty: 3, biomes: GROVE_BIOMES, uses: ['tnt'], stepPx: 150 }, `
    H . . . . . . . . . . . . . . . . . . . . .
    A . . . . . . . . . . . . . . . . . . . . .
    M K . . K k . K . k . . . . . . . . . . . .
    L . . . . . . . . . . . . . . . . . . . . .
    G . . . . . . . . . . . . . . . . . . . . .
  `),
  // payload:'swarm' — a free-flying yokai swarm pouring in from the edges and below
  // (DemonSystem side/bottom routes, NOT rafts), capped so it stays readable. Like
  // the other yokai fixtures it's a yokaiOnly one-pass field; tickGrove re-runs it
  // (re-randomised) for the whole grove leg.
  field({ id: 'bonus-swarm', category: 'combo', difficulty: 3, biomes: GROVE_BIOMES, uses: ['enemy'], stepPx: 160, special: 'grove-swarm', yokaiOnly: true, once: true, burst: [1, 2], cap: 7 }, {
    mix: { x: 1 }, band: 'A', density: [0.7, 0.95], length: 14, jitter: 2,
  }),
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const CATEGORIES = ['teach', 'obstacle', 'combo', 'rest'];
export const GAMEPLAY_BIOMES = ['bamboo', 'cave', 'water', 'grove'];

// BIOME OPENINGS
// --------------
// Scripted curricula played in order before procedural selection begins.
// Every id must exist in PATTERNS_BY_ID and be eligible for the matching biome.
// RunDirector rebuilds this list whenever gameplay biome changes, so returning
// cave and water legs repeat their openings; lessons are not globally remembered.
export const OPENINGS = {
  bamboo: [
    'intro-bamboo',       // introduce tempo
    'teach-arrow',        // isolate the inhibit read (don't-slice) — taught early so bombs flow soon
    'teach-spike',        // isolate the low read
    'teach-bridge',       // isolate the solve
    'obs-spikes-bamboo',  // reinforce the low read
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
    'teach-bubble',       // introduce the rising timed read (watch below)
    'obs-vines',
    'obs-bubbles',
    'combo-vine-bubble',  // weave the two channels together
  ],
  // Grove has no curriculum — it's a forced single-payload beat (RunDirector.tickGrove).
  grove: [],
};

export const OPENING = OPENINGS.bamboo;
