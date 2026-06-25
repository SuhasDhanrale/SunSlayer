// Slash roster — the four elemental blade trails are the actual unlockable
// cosmetics. Pure DATA only; the drawing lives in the pure renderers under
// src/renderer/slashes/. Names use the neutral "<Element> Slash" framing (the
// `tagline` is a flavor eyebrow label shown above the name in the wardrobe).
//
// Equipped elements never change with combo. Combo intensity is rendered as a
// style layer over the selected trail; `unlockCost` is paid from the coin wallet.

export const SLASHES = [
  {
    id: 'wind',
    name: 'Wind Slash',
    tagline: 'Gale Trail',
    description: 'Green jade wisps & spinning bamboo leaves.',
    accentColor: '#10b981',
    isDefault: false,
    unlockCost: 600,
  },
  {
    id: 'water',
    name: 'Water Slash',
    tagline: 'Tide Trail',
    description: 'Flowing blue wave ribbons & water bubbles.',
    accentColor: '#38bdf8',
    isDefault: true,
    unlockCost: 0,
  },
  {
    id: 'thunder',
    name: 'Thunder Slash',
    tagline: 'Storm Trail',
    description: 'Jagged yellow-white electric lightning arcs.',
    accentColor: '#facc15',
    isDefault: false,
    unlockCost: 1300,
  },
  {
    id: 'flame',
    name: 'Fire Slash',
    tagline: 'Ember Trail',
    description: 'Blazing fire ribbons & rising smoke sparks.',
    accentColor: '#f97316',
    isDefault: false,
    unlockCost: 2000,
  },
];

export const DEFAULT_SLASH_ID =
  (SLASHES.find((s) => s.isDefault) || SLASHES[0]).id;

export const getSlash = (id) =>
  SLASHES.find((s) => s.id === id) || SLASHES.find((s) => s.isDefault) || SLASHES[0];
