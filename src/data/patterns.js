// ─────────────────────────────────────────────────────────────────────────────
// THE PATTERN LIBRARY — the authored vocabulary the conductor sequences.
//
// Two flavors (see PatternRunner.js for how they're compiled into columns):
//
//   GRID  — exact, authored layouts. Rows = height bands, columns = horizontal
//           slices spaced STEP_PX apart. EVERYTHING IN ONE COLUMN ARRIVES ALIGNED.
//           Rows:  H high (vines)  ·  A air/blade  ·  M mid (bamboo)
//                  L low (spikes)  ·  G ground (bridges/boulders)
//           Symbols:  . empty   i bamboo   I thick bamboo   v vine
//                      s spike   = bridge   O boulder   x enemy   o coin
//           Biome movers (self-place their own band, like spikes — row is moot):
//                      T stalactite (CAVE: drops from the ceiling, slash HIGH)
//                      m mine       (WATER: rises from below, slash it before it surfaces)
//           Other biome elements:
//                      n net   (WATER: a mid-lane mesh wall, slash to cut through)
//                      R raft  (WATER: ferries in a NORMAL yokai wave — the raft is
//                               just the vehicle; the yokai behave like any other 'x')
//
//   FIELD — stochastic texture. Per column it spawns one item from `mix` with
//           probability `density` (lerped calm→peak by intensity). `band`/`jitter`
//           set the row for height-flexible cells (spikes/bridges/boulders/bamboo
//           self-place by type, so band is moot for them).
//
// THE MODEL (per design): TEACH the unique mechanics in isolation (spike, boulder,
// bridge — bamboo needs no teaching, it's the easy FILLER). OBSTACLES = a lot of
// one taught mechanic woven through bamboo filler. COMBOS = two mechanics forced
// together (the real challenge). REST = an authored coin gold-rush. FOOD = yokai.
//
// COINS: not sprinkled into obstacles — they ride OVER spikes (PatternRunner) plus
// occasional CoinReward waves. The REST gold-rush authors its own `o` coins and
// CoinReward stays off there. YOKAI: `x` = one; a field `burst:[min,max]` pops a
// scattered handful (fruit-ninja), capped by `cap`.
//
// Categories: teach | obstacle | combo | rest | food.  `difficulty` lets the
// conductor escalate (pick harder patterns as the run heats up).
//
// BIOME: a `biome` tag ('cave' | 'water') scopes a pattern to one biome. UNTAGGED
// patterns are UNIVERSAL — they're the shared base every biome draws from (bamboo
// filler, coin rests, yokai). The conductor filters its decks by the run's biome
// (see RunDirector.draw), so a cave run = shared base + cave-tagged signatures.
// ─────────────────────────────────────────────────────────────────────────────

export const STEP_PX = 240; // default world-distance between columns

const grid = (meta, art) => ({ kind: 'grid', ...meta, art });
const field = (meta, spec) => ({ kind: 'field', ...meta, ...spec });

export const PATTERNS = [
  // ── TEACH: the unique mechanics, one at a time, lots of room ──────────────
  grid({ id: 'teach-spike', category: 'teach', difficulty: 0, uses: ['spike'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . s . .
    G . . . .
  `),
  grid({ id: 'teach-boulder', category: 'teach', difficulty: 0, uses: ['boulder'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . . . .
    G . O . .
  `),
  grid({ id: 'teach-bridge', category: 'teach', difficulty: 0, uses: ['bridge'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . . . .
    G . = . .
  `),

  // Warm-up: just slice easy bamboo to get into the groove (opening beat).
  field({ id: 'intro-bamboo', category: 'teach', difficulty: 0, uses: ['bamboo'] }, {
    mix: { i: 0.9, I: 0.1 }, band: 'M', density: [0.35, 0.6], length: 10, jitter: 1,
  }),
  // Gentle yokai introduction — single pops (no burst), spaced out.
  grid({ id: 'teach-yokai', category: 'teach', difficulty: 0, uses: ['enemy'] }, `
    H . . . . .
    A . x . . x
    M . . . . .
    L . . . . .
    G . . . . .
  `),

  // ── OBSTACLE: a LOT of one taught mechanic, woven through bamboo filler ───
  // (bamboo is the easy filler that's common to every obstacle storm.)
  field({ id: 'obs-spikes-bamboo', category: 'obstacle', difficulty: 1, uses: ['spike', 'bamboo'] }, {
    mix: { s: 0.5, i: 0.4, I: 0.1 }, band: 'M', density: [0.7, 1.0], length: 12, jitter: 1,
  }),
  field({ id: 'obs-boulders-bamboo', category: 'obstacle', difficulty: 1, uses: ['boulder', 'bamboo'], stepPx: 280 }, {
    mix: { O: 0.35, i: 0.55, I: 0.1 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  field({ id: 'obs-bridges-bamboo', category: 'obstacle', difficulty: 1, uses: ['bridge', 'bamboo'], stepPx: 280 }, {
    mix: { '=': 0.35, i: 0.55, I: 0.1 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),

  // ── COMBO: two mechanics forced together — the real challenge ─────────────
  // Snap the bridge rope (high), then sweep the spike (low) — back and forth.
  grid({ id: 'combo-spike-bridge', category: 'combo', difficulty: 2, uses: ['bridge', 'spike'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . s . s
    G = . = .
  `),
  // Two snap-mechanics interleaved — bridge rope then boulder, alternating.
  grid({ id: 'combo-bridge-boulder', category: 'combo', difficulty: 3, uses: ['bridge', 'boulder'] }, `
    H . . . . . .
    A . . . . . .
    M . . . . . .
    L . . . . . .
    G = . O = = .
  `),
  // Sweep a low spike, then snap a popping yokai out of the air — repeat.
  grid({ id: 'combo-spike-yokai', category: 'combo', difficulty: 2, uses: ['spike', 'enemy'] }, `
    H . . . . .
    A . x . x .
    M . . . . .
    L s . s . s
    G . . . . .
  `),
  // Snap boulders loose while picking yokai out of the air between them.
  grid({ id: 'combo-boulder-yokai', category: 'combo', difficulty: 3, uses: ['boulder', 'enemy'] }, `
    H . . . . .
    A . x . x .
    M . . . . .
    L . . . . .
    G O . O . O
  `),
  // YOKAI SWARM — a storm of popping yokai through bamboo. Hardest yokai beat.
  field({ id: 'combo-yokai-swarm', category: 'combo', difficulty: 4, uses: ['enemy', 'bamboo'], stepPx: 200, burst: [2, 4] }, {
    mix: { x: 0.5, i: 0.4, I: 0.1 }, band: 'M', density: [0.7, 1.0], length: 12, jitter: 1, cap: 14,
  }),

  // ── REST: gold rush. Authored coin field (NOT random) — CoinReward stays off
  // for rest patterns, so this is exactly the coins you draw here.
  grid({ id: 'rest-gold-rush', category: 'rest', difficulty: 0, uses: ['coin'] }, `
    H o . o . o . o . .
    A . o . o . o . o .
    M o . o . o . o . .
    L . o . o . o . o .
    G o . o . o . o . .
  `),

  // ── FOOD / FLOW: popping yokai in random BURSTS — the fruit-ninja juice. Each
  // hit pops 2–5 scattered yokai; intensity raises how often a burst fires.
  field({ id: 'food-flurry', category: 'food', difficulty: 5, uses: ['enemy','bamboo','spike','boulder'], stepPx: 240, burst: [2, 5] }, {
    mix: { x: 1 }, band: 'M', density: [0.6, 1.0], length: 10, jitter: 0, cap: 12,
  }),

  // ── CAVE biome ────────────────────────────────────────────────────────────
  // Signature: the STALACTITE — drops from the ceiling, slash it HIGH on the way
  // down (miss = it lands on you). Cave layers stalactite CURTAINS over the shared
  // base (boulders to rope-cut, ground spikes, popping yokai).
  grid({ id: 'teach-stalactite', category: 'teach', difficulty: 0, biome: 'cave', uses: ['stalactite'] }, `
    H . T . .
    A . . . .
    M . . . .
    L . . . .
    G . . . .
  `),
  // A sparse drip of falling rock woven through bamboo filler.
  field({ id: 'obs-stalactites', category: 'obstacle', difficulty: 1, biome: 'cave', uses: ['stalactite', 'bamboo'], stepPx: 300 }, {
    mix: { T: 0.5, i: 0.4, I: 0.1 }, band: 'H', density: [0.55, 0.95], length: 12, jitter: 0,
  }),
  // A CURTAIN of rock — tight column spacing drops them in a rolling sweep you
  // clear with one big high slash (the mock's stalactite "batch").
  grid({ id: 'obs-stalactite-curtain', category: 'obstacle', difficulty: 2, biome: 'cave', uses: ['stalactite'], stepPx: 90 }, `
    H T T T T T T
    A . . . . . .
    M . . . . . .
    L . . . . . .
    G . . . . . .
  `),
  // HIGH/LOW whiplash: slash a falling stalactite, then sweep a ground spike.
  grid({ id: 'combo-stalactite-spike', category: 'combo', difficulty: 2, biome: 'cave', uses: ['stalactite', 'spike'] }, `
    H T . T . T
    A . . . . .
    M . . . . .
    L . s . s .
    G . . . . .
  `),
  // Slash the falling rock, then snap a popping yokai out of the air — repeat.
  grid({ id: 'combo-stalactite-yokai', category: 'combo', difficulty: 2, biome: 'cave', uses: ['stalactite', 'enemy'] }, `
    H T . T . T
    A . x . x .
    M . . . . .
    L . . . . .
    G . . . . .
  `),
  // Alternate snapping a boulder rope (ground) with slashing a stalactite (ceiling).
  grid({ id: 'combo-stalactite-boulder', category: 'combo', difficulty: 3, biome: 'cave', uses: ['stalactite', 'boulder'] }, `
    H . T . T . T
    A . . . . . .
    M . . . . . .
    L . . . . . .
    G O . O . O .
  `),

  // ── WATER biome ───────────────────────────────────────────────────────────
  // Signature: the MINE — rises from below; slash it before it surfaces. Water
  // also has NETS (mid mesh walls) and RAFTS (ferry in a normal yokai wave), over
  // the shared base + vines.
  grid({ id: 'teach-mine', category: 'teach', difficulty: 0, biome: 'water', uses: ['mine'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . m . .
    G . . . .
  `),
  grid({ id: 'teach-net', category: 'teach', difficulty: 0, biome: 'water', uses: ['net'] }, `
    H . . . .
    A . . . .
    M . n . .
    L . . . .
    G . . . .
  `),
  // Teach the raft: it ferries in a normal yokai wave — slash them as usual.
  grid({ id: 'teach-raft', category: 'teach', difficulty: 0, biome: 'water', uses: ['raft', 'enemy'] }, `
    H . . . .
    A . . . .
    M . R . .
    L . . . .
    G . . . .
  `),
  // Rising mines woven through bamboo filler.
  field({ id: 'obs-mines', category: 'obstacle', difficulty: 1, biome: 'water', uses: ['mine', 'bamboo'], stepPx: 280 }, {
    mix: { m: 0.5, i: 0.4, I: 0.1 }, band: 'L', density: [0.6, 1.0], length: 12, jitter: 0,
  }),
  // A run of mid-lane nets to cut through, with bamboo filler.
  field({ id: 'obs-nets', category: 'obstacle', difficulty: 1, biome: 'water', uses: ['net', 'bamboo'], stepPx: 300 }, {
    mix: { n: 0.45, i: 0.45, I: 0.1 }, band: 'M', density: [0.55, 0.95], length: 12, jitter: 0,
  }),
  // HIGH/LOW whiplash: cut a hanging vine, then a mine rising into the gap below.
  grid({ id: 'combo-mine-vine', category: 'combo', difficulty: 2, biome: 'water', uses: ['mine', 'vine'] }, `
    H . v . v .
    A . . . . .
    M . . . . .
    L m . m . m
    G . . . . .
  `),
  // MID/LOW whiplash: cut through a net, then slash a mine rising beneath it.
  grid({ id: 'combo-net-mine', category: 'combo', difficulty: 2, biome: 'water', uses: ['net', 'mine'] }, `
    H . . . . .
    A . . . . .
    M n . n . n
    L . m . m .
    G . . . . .
  `),
  // A raft drops in a yokai wave; rising mines punctuate the gaps between.
  grid({ id: 'combo-raft-mine', category: 'combo', difficulty: 3, biome: 'water', uses: ['raft', 'enemy', 'mine'] }, `
    H . . . . .
    A . . . . .
    M R . . . .
    L . m . m .
    G . . . . .
  `),
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const CATEGORIES = ['teach', 'obstacle', 'combo', 'rest', 'food'];

// THE GAMEPLAY BIOMES — one is active per run (the conductor scopes its decks to
// it). Distinct from the VISUAL biomes in constants.js (bamboo/village/rain skins).
export const GAMEPLAY_BIOMES = ['bamboo', 'cave', 'water'];

// THE OPENING — a scripted curriculum that plays in THIS EXACT ORDER before the
// generative conductor takes over (onboarding). One per biome: teach that biome's
// signature mechanic early, around the shared verbs. Reorder / add / remove freely.
export const OPENINGS = {
  bamboo: [
    'intro-bamboo',      // 1. warm-up: just slice bamboo, no pressure
    'teach-spike',       // 2. teach the LOW sweep
    'teach-yokai',       // 3. introduce popping yokai (gentle, single pops)
    'teach-bridge',      // 4. teach the rope-snap bridge
    'combo-spike-yokai', // 5. first real combination
    'teach-boulder',     // 6. teach the boulder (later mechanic)
  ],
  cave: [
    'intro-bamboo',             // 1. warm-up
    'teach-stalactite',         // 2. teach the signature: slash the falling rock HIGH
    'teach-spike',              // 3. teach the LOW sweep
    'obs-stalactite-curtain',   // 4. a rolling curtain of rock to settle into
    'combo-stalactite-yokai',   // 5. first combination (rock + popping yokai)
    'teach-boulder',            // 6. teach the boulder
  ],
  water: [
    'intro-bamboo',   // 1. warm-up
    'teach-mine',     // 2. teach the signature: slash the rising mine
    'teach-net',      // 3. teach cutting through a net
    'teach-raft',     // 4. teach the raft (it ferries in a normal yokai wave)
    'obs-mines',      // 5. rising mines to settle into
    'combo-net-mine', // 6. first combination (net + mine)
  ],
};

// Back-compat alias (the bamboo curriculum was the original single OPENING).
export const OPENING = OPENINGS.bamboo;
