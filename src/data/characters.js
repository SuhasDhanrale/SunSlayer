// Character roster — ported faithfully from the "Character & Sister Cosmetics"
// mock (src/mocks/screens/CosmeticsMock.jsx). Pure DATA only: names, rarity,
// colors, fabric-pattern key, and decoration flags. The actual drawing lives in
// the pure renderers under src/renderer/characters/ (one file per character),
// keyed by the `id` field here.
//
// `unlockCost` is paid from the persistent coin wallet. Characters are visual
// only; `isDefault` seeds first-time ownership.

export const CHARACTERS = [
  {
    id: 'sunslayer',
    name: 'Checkered Sun Slayer',
    rarity: 'Legendary',
    isDefault: true,       // first / starter character — owned from the start
    unlockCost: 0,
    colorClass: 'text-emerald-400 border-emerald-600/50 bg-emerald-950/20',
    description: 'Wearing the signature green-and-black checkered Haori, with spiky dark-red hair and dangling hanafuda card earrings.',
    accentColor: '#10b981', // emerald green
    hairColor: '#450a0a',   // dark burgundy red
    hairTips: '#991b1b',
    hasEarrings: true,
    hasPonytail: false,
    guardColor: '#d97706',  // katana guard tint
    patternType: 'checkered_green',
    stats: { breathStyle: 'Sun / Solar', elementGlow: 'Bright Emerald' },
  },
  {
    id: 'thunderhunter',
    name: 'Thunder Flash Hunter',
    rarity: 'Epic',
    isDefault: false,
    unlockCost: 100,
    colorClass: 'text-amber-400 border-amber-600/50 bg-amber-950/20',
    description: 'Wearing a yellow-and-orange striped Haori, with bright yellow spiky hair that flares orange at the tips.',
    accentColor: '#fbbf24', // yellow gold
    hairColor: '#eab308',   // bright yellow
    hairTips: '#f97316',    // orange tips
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#d97706',
    patternType: 'striped_yellow',
    stats: { breathStyle: 'Thunder / Lightning', elementGlow: 'Golden Spark' },
  },
  {
    id: 'blossomwarden',
    name: 'Blossom Demon Warden',
    rarity: 'Rare',
    isDefault: false,
    unlockCost: 40,
    colorClass: 'text-pink-400 border-pink-600/50 bg-pink-950/20',
    description: 'Wearing a pink-and-white diamond checkered Haori, with flowing long pink-and-black spiky hair.',
    accentColor: '#f472b6', // pink
    hairColor: '#18181b',   // black base
    hairTips: '#ec4899',    // pink tips
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#d97706',
    patternType: 'diamond_pink',
    stats: { breathStyle: 'Blossom / Blood Burst', elementGlow: 'Cherry Pink' },
  },
  {
    id: 'torrentwarden',
    name: 'Water Torrent Warden',
    rarity: 'Epic',
    isDefault: false,
    unlockCost: 100,
    colorClass: 'text-cyan-400 border-cyan-600/50 bg-cyan-950/20',
    description: 'Wearing a deep teal Haori with white wave slice patterns, with spiky black hair tied back in a low ponytail.',
    accentColor: '#06b6d4', // cyan
    hairColor: '#09090b',   // solid black
    hairTips: '#0f172a',
    hasEarrings: false,
    hasPonytail: true,
    guardColor: '#d97706',
    patternType: 'wave_blue',
    stats: { breathStyle: 'Water / Flow', elementGlow: 'Ocean Azure' },
  },
  {
    id: 'flamepillar',
    name: 'Flame Pillar Warden',
    rarity: 'Legendary',
    isDefault: false,
    unlockCost: 200,
    colorClass: 'text-red-400 border-red-600/50 bg-red-950/20',
    description: 'Wearing a red-and-yellow flame-sliced Haori, with wild spiky yellow hair and crimson streaks.',
    accentColor: '#ef4444', // red
    hairColor: '#facc15',   // yellow base
    hairTips: '#dc2626',    // red flame streaks
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#dc2626',  // crimson guard
    patternType: 'flame_red',
    stats: { breathStyle: 'Flame / Fire', elementGlow: 'Blazing Crimson' },
  },
];

export const DEFAULT_CHARACTER_ID =
  (CHARACTERS.find((c) => c.isDefault) || CHARACTERS[0]).id;

export const getCharacter = (id) =>
  CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
