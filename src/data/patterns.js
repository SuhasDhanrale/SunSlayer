// Pattern library for the run conductor.
//
// Every pattern declares explicit gameplay ownership with `biomes`.
// Gameplay biomes are:
//   bamboo - all ground visual destinations
//   cave   - the transition tunnel
//   water  - the water destination
//
// Grid symbols:
//   . empty   i bamboo   I thick bamboo   v vine/kelp
//   s spike   = bridge   O boulder        x enemy   o coin
//   T stalactite   K tnt   m mine   n net   R raft   B barrel

export const STEP_PX = 240;

const ALL_BIOMES = ['bamboo', 'cave', 'water'];
const grid = (meta, art) => ({ kind: 'grid', ...meta, art });
const field = (meta, spec) => ({ kind: 'field', ...meta, ...spec });

export const PATTERNS = [
  // Ground / bamboo.
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
  grid({ id: 'teach-boulder', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['boulder'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . . . .
    G . O . .
  `),
  grid({ id: 'teach-bridge', category: 'teach', difficulty: 0, biomes: ['bamboo'], uses: ['bridge'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . . . .
    G . = . .
  `),
  field({ id: 'obs-spikes-bamboo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['spike', 'bamboo'] }, {
    mix: { s: 0.5, i: 0.4, I: 0.1 }, band: 'M', density: [0.7, 1.0], length: 12, jitter: 1,
  }),
  field({ id: 'obs-boulders-bamboo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['boulder', 'bamboo'], stepPx: 280 }, {
    mix: { O: 0.35, i: 0.55, I: 0.1 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  field({ id: 'obs-bridges-bamboo', category: 'obstacle', difficulty: 1, biomes: ['bamboo'], uses: ['bridge', 'bamboo'], stepPx: 280 }, {
    mix: { '=': 0.35, i: 0.55, I: 0.1 }, band: 'M', density: [0.6, 1.0], length: 12, jitter: 1,
  }),
  grid({ id: 'combo-spike-yokai', category: 'combo', difficulty: 1, biomes: ['bamboo'], uses: ['spike', 'enemy'] }, `
    H . . . . .
    A . x . x .
    M . . . . .
    L . s . . s
    G . . . . .
  `),
  grid({ id: 'combo-spike-bridge', category: 'combo', difficulty: 3, biomes: ['bamboo'], uses: ['bridge', 'spike'] }, `
    H . . . .
    A x . . . x .
    M . . . .
    L . s . s
    G = . = . = . O = = .
  `),
  grid({ id: 'combo-boulder-yokai', category: 'combo', difficulty: 2, biomes: ['bamboo'], uses: ['boulder', 'enemy'] }, `
    H . . . . .
    A . x . x .
    M . . . . .
    L . s . . . . . s . s
    G O . O . O
  `),

  // Shared flow patterns. These do not spawn biome-specific physical obstacles.
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

  // Cave transition.
  grid({ id: 'teach-stalactite', category: 'teach', difficulty: 0, biomes: ['cave'], uses: ['stalactite'] }, `
    H . T . .
    A . . . .
    M . . . .
    L . . . .
    G . . . .
  `),
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
  grid({ id: 'teach-tnt', category: 'teach', difficulty: 0, biomes: ['cave'], uses: ['tnt'] }, `
    H . . . .
    A . . . .
    M . K . .
    L . . . .
    G . . . .
  `),
  field({ id: 'obs-tnt', category: 'obstacle', difficulty: 1, biomes: ['cave'], uses: ['tnt'], stepPx: 280 }, {
    mix: { K: 1 }, band: 'M', density: [0.45, 0.8], length: 10, jitter: 1,
  }),
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

  // Water.
  grid({ id: 'teach-mine', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['mine'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . m . .
    G . . . .
  `),
  grid({ id: 'teach-net', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['net'] }, `
    H . . . .
    A . . . .
    M . n . .
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
  grid({ id: 'teach-barrel', category: 'teach', difficulty: 0, biomes: ['water'], uses: ['barrel'] }, `
    H . . . .
    A . . . .
    M . . . .
    L . B . .
    G . . . .
  `),
  field({ id: 'obs-mines', category: 'obstacle', difficulty: 1, biomes: ['water'], uses: ['mine'], stepPx: 280 }, {
    mix: { m: 1 }, band: 'L', density: [0.6, 1.0], length: 12, jitter: 0,
  }),
  field({ id: 'obs-nets', category: 'obstacle', difficulty: 1, biomes: ['water'], uses: ['net'], stepPx: 300 }, {
    mix: { n: 1 }, band: 'M', density: [0.55, 0.95], length: 12, jitter: 0,
  }),
  field({ id: 'obs-barrels', category: 'obstacle', difficulty: 2, biomes: ['water'], uses: ['barrel', 'mine'], stepPx: 300 }, {
    mix: { B: 0.55, m: 0.45 }, band: 'L', density: [0.55, 0.95], length: 12, jitter: 0,
  }),
  grid({ id: 'combo-mine-vine', category: 'combo', difficulty: 2, biomes: ['water'], uses: ['mine', 'vine'] }, `
    H . v . v .
    A . . . . .
    M . . . . .
    L m . m . m
    G . . . . .
  `),
  grid({ id: 'combo-net-mine', category: 'combo', difficulty: 2, biomes: ['water'], uses: ['net', 'mine'] }, `
    H . . . . .
    A . . . . .
    M n . n . n
    L . m . m .
    G . . . . .
  `),
  grid({ id: 'combo-raft-mine', category: 'combo', difficulty: 3, biomes: ['water'], uses: ['raft', 'enemy', 'mine'] }, `
    H . . . . .
    A . . . . .
    M R . . . .
    L . m . m .
    G . . . . .
  `),
  grid({ id: 'combo-net-barrel', category: 'combo', difficulty: 3, biomes: ['water'], uses: ['net', 'barrel'] }, `
    H . . . . .
    A . . . . .
    M n . n . n
    L . B . B .
    G . . . . .
  `),
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const CATEGORIES = ['teach', 'obstacle', 'combo', 'rest', 'food'];
export const GAMEPLAY_BIOMES = ['bamboo', 'cave', 'water'];

export const OPENINGS = {
  bamboo: [
    'intro-bamboo',
    'teach-spike',
    'teach-yokai',
    'teach-bridge',
    'combo-spike-yokai',
    'teach-boulder',
  ],
  cave: [
    'teach-stalactite',
    'teach-tnt',
    'obs-stalactite-curtain',
    'combo-tnt-stalactite',
  ],
  water: [
    'teach-mine',
    'teach-net',
    'teach-barrel',
    'teach-raft',
    'combo-net-barrel',
  ],
};

export const OPENING = OPENINGS.bamboo;
