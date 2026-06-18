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
//                      s spike   = bridge   O boulder   x enemy   (o coin)
//
//   FIELD — stochastic texture (bamboo thickets, popping yokai). Position doesn't
//           matter, DENSITY does — density scales with the conductor's intensity
//           (0..1) between `density[0]` (calm) and `density[1]` (peak). Keep
//           density in 0..1 — it's a per-column PROBABILITY, so >1 just means
//           "always one in this column", never several at once.
//
// COINS ARE NOT AUTHORED HERE. They're a separate random REWARD layer (CoinReward)
// that sprinkles wavy/zigzag/arc coins over the run — dense when calm (REST = gold
// rush), sparse during peaks. Putting coins in the grid made the run feel robotic.
//
// YOKAI: `x` = one yokai by default, but a field with `burst:[min,max]` pops a
// random handful at once (fruit-ninja chaos), scattered + capped by `cap`. Use a
// single `x` for tactical woven pops; use a burst field for the food/flow juice.
//
// Categories: teach | obstacle | combo | rest | food.  `difficulty` lets the
// conductor escalate (pick harder patterns as the run heats up).
// ─────────────────────────────────────────────────────────────────────────────

export const STEP_PX = 240; // default world-distance between columns

const grid = (meta, art) => ({ kind: 'grid', ...meta, art });
const field = (meta, spec) => ({ kind: 'field', ...meta, ...spec });

export const PATTERNS = [
  // ── TEACH: introduce ONE thing in isolation ───────────────────────────────
  grid({ id: 'teach-bamboo', category: 'teach', difficulty: 0, uses: ['bamboo'] }, `
    H . . . .
    A . . . .
    M . i . .
    L . . . .
    G . . . .
  `),
  grid({ id: 'teach-spike', category: 'teach', difficulty: 0, uses: ['spike'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . s . .
    G . . . .
  `),
  grid({ id: 'teach-vine', category: 'teach', difficulty: 0, uses: ['vine'] }, `
    H . v . .
    A . . . .
    M . . . .
    L . . . .
    G . . . .
  `),

  // ── OBSTACLE: pure challenge ("storms") from taught elements ──────────────
  // Storm of bamboo — slice-through flow that packs tighter as intensity rises.
  field({ id: 'obs-bamboo-storm', category: 'obstacle', difficulty: 3, uses: ['bamboo'] }, {
    mix: { i: 0.8, I: 0.2 }, band: 'M', density: [0.8, 1.0], length: 12, jitter: 1,
  }),
  // High vine / low spike, alternating — forces a HIGH-LOW sweep rhythm.
  grid({ id: 'obs-highlow-weave', category: 'obstacle', difficulty: 3, uses: ['vine', 'spike'] }, `
    H v . v . v . v .
    A . . . . . . . .
    M . . . . . . . .
    L . s . s . s . s
    G . . . . . . . .
  `),
  // Spike gauntlet broken by the occasional high vine (sweep low, low, snap high).
  // No column stacks high+low, so it's always clearable.
  grid({ id: 'obs-spike-gauntlet', category: 'obstacle', difficulty: 3, uses: ['spike', 'vine'] }, `
    H . . . . . . .
    A . . . . . . .
    M . . . . . . .
    L s . . s . . s
    G . . i . i . .
  `),
  // Popping yokai woven into a high-low weave — clear high, clear low, snap a
  // yokai. Yokai sit 3 columns apart so they pop one at a time, not together.
  grid({ id: 'obs-yokai-weave', category: 'obstacle', difficulty: 3, uses: ['vine', 'spike', 'enemy'] }, `
    H v . . v . .
    A . . x . . x
    M . . . . . .
    L . s . . s .
    G . . . . . .
  `),
  // Bamboo thicket with the odd yokai popping through (sparse `x`, one at a time).
  field({ id: 'obs-yokai-thicket', category: 'obstacle', difficulty: 3, uses: ['bamboo', 'enemy'] }, {
    mix: { i: 0.6, I: 0.1, x: 0.3 }, band: 'M', density: [0.55, 0.9], length: 10, jitter: 1, cap: 3,
  }),
  // Snap-the-rope BRIDGES in a row — cut each high rope and the plank drops to
  // carry you over; miss one and it trips you. Wider spacing (planks are big).
  grid({ id: 'obs-rope-bridges', category: 'obstacle', difficulty: 2, uses: ['bridge'], stepPx: 320 }, `
    H . . . . .
    A . . . . .
    M . . . . .
    L . . . . .
    G = . = . =
  `),
  // BOULDERS to snap loose so they roll away before they crush you.
  grid({ id: 'obs-boulders', category: 'obstacle', difficulty: 2, uses: ['boulder'], stepPx: 280 }, `
    H . . . . .
    A . . . . .
    M . . . . .
    L . . . . .
    G O . O . O
  `),

  // ── COMBO: two elements forcing a tight, deliberate sequence ──────────────
  // Snap the bridge rope (high), then immediately sweep the spike (low).
  grid({ id: 'combo-snap-spike', category: 'combo', difficulty: 2, uses: ['bridge', 'spike'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . . s .
    G = . . .
  `),
  // Vine then spike, close together — a sharp HIGH→LOW snap.
  grid({ id: 'combo-vine-spike', category: 'combo', difficulty: 2, uses: ['vine', 'spike'] }, `
    H v . . .
    A . . . .
    M . . . .
    L . . s .
    G . . . .
  `),

  // ── REST: gold rush. No obstacles — the CoinReward layer floods coins because
  // intensity is low here, so the player just sweeps up a screen full of gold.
  grid({ id: 'rest-gold-rush', category: 'rest', difficulty: 0, uses: ['coin'] }, `
    H . o . o . o . o o o o o
    A o . o . o . o . o o o o
    M . o . o . o . o o o o o
    L o . o . o . o . o o o o
    G . o . o . o . o o o o o
  `),

  // ── FOOD / FLOW: popping yokai in random BURSTS — the fruit-ninja juice. Each
  // hit pops 2–5 scattered yokai; intensity raises how often a burst fires.
  field({ id: 'food-flurry', category: 'food', difficulty: 1, uses: ['enemy'], stepPx: 240, burst: [2, 5] }, {
    mix: { x: 1 }, band: 'M', density: [0.6, 1.0], length: 10, jitter: 0, cap: 12,
  }),
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const CATEGORIES = ['teach', 'obstacle', 'combo', 'rest', 'food'];
