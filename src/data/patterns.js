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
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const CATEGORIES = ['teach', 'obstacle', 'combo', 'rest', 'food'];

// THE OPENING — a scripted curriculum that plays in THIS EXACT ORDER before the
// generative conductor takes over (onboarding). Reorder / add / remove freely.
export const OPENING = [
  'intro-bamboo',      // 1. warm-up: just slice bamboo, no pressure
  'teach-spike',       // 2. teach the LOW sweep
  'teach-yokai',       // 3. introduce popping yokai (gentle, single pops)
  'teach-bridge',      // 4. teach the rope-snap bridge
  'combo-spike-yokai', // 5. first real combination
  'teach-boulder',     // 6. teach the boulder (later mechanic)
];
