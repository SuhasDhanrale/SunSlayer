// Slash roster — ported from the "Breath Slashes Studio" mock
// (src/mocks/screens/ElementalSlashesMock.jsx). "Breath" is the umbrella; the
// four elemental slashes below are the actual unlockable trails. Pure DATA only;
// the drawing lives in the pure renderers under src/renderer/slashes/.
//
// `comboMin` mirrors the studio's auto-leveling (combo thresholds at which each
// element takes over). `unlockCost` is forward-looking for the future shop.

export const SLASHES = [
  {
    id: 'wind',
    name: 'Wind Breath',
    breath: 'Gale Form',
    description: 'Green jade wisps & spinning bamboo leaves.',
    accentColor: '#10b981',
    comboMin: 0,
    isDefault: false,
    unlockCost: 1500,
  },
  {
    id: 'water',
    name: 'Water Breath',
    breath: 'Tide Form',
    description: 'Flowing blue wave ribbons & water bubbles.',
    accentColor: '#38bdf8',
    comboMin: 5,
    isDefault: true,
    unlockCost: 0,
  },
  {
    id: 'thunder',
    name: 'Thunder Breath',
    breath: 'Storm Form',
    description: 'Jagged yellow-white electric lightning arcs.',
    accentColor: '#facc15',
    comboMin: 10,
    isDefault: false,
    unlockCost: 3000,
  },
  {
    id: 'flame',
    name: 'Flame Breath',
    breath: 'Blaze Form',
    description: 'Blazing fire ribbons & rising smoke sparks.',
    accentColor: '#f97316',
    comboMin: 15,
    isDefault: false,
    unlockCost: 4500,
  },
];

export const DEFAULT_SLASH_ID =
  (SLASHES.find((s) => s.isDefault) || SLASHES[0]).id;

export const getSlash = (id) =>
  SLASHES.find((s) => s.id === id) || SLASHES[0];

// Auto-leveling: pick the highest-threshold element the current combo unlocks.
export const slashForCombo = (combo) => {
  let pick = SLASHES[0];
  for (const s of SLASHES) {
    if (combo >= s.comboMin) pick = s;
  }
  return pick.id;
};
