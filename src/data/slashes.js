// Slash roster — ported from the "Breath Slashes Studio" mock
// (src/mocks/screens/ElementalSlashesMock.jsx). "Breath" is the umbrella; the
// four elemental slashes below are the actual unlockable trails. Pure DATA only;
// the drawing lives in the pure renderers under src/renderer/slashes/.
//
// Equipped elements never change with combo. Combo intensity is rendered as a
// style layer over the selected trail; `unlockCost` is paid from the coin wallet.

export const SLASHES = [
  {
    id: 'wind',
    name: 'Wind Breath',
    breath: 'Gale Form',
    description: 'Green jade wisps & spinning bamboo leaves.',
    accentColor: '#10b981',
    isDefault: false,
    unlockCost: 60,
  },
  {
    id: 'water',
    name: 'Water Breath',
    breath: 'Tide Form',
    description: 'Flowing blue wave ribbons & water bubbles.',
    accentColor: '#38bdf8',
    isDefault: true,
    unlockCost: 0,
  },
  {
    id: 'thunder',
    name: 'Thunder Breath',
    breath: 'Storm Form',
    description: 'Jagged yellow-white electric lightning arcs.',
    accentColor: '#facc15',
    isDefault: false,
    unlockCost: 120,
  },
  {
    id: 'flame',
    name: 'Flame Breath',
    breath: 'Blaze Form',
    description: 'Blazing fire ribbons & rising smoke sparks.',
    accentColor: '#f97316',
    isDefault: false,
    unlockCost: 180,
  },
];

export const DEFAULT_SLASH_ID =
  (SLASHES.find((s) => s.isDefault) || SLASHES[0]).id;

export const getSlash = (id) =>
  SLASHES.find((s) => s.id === id) || SLASHES.find((s) => s.isDefault) || SLASHES[0];
