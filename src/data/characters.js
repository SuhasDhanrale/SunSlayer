// Character roster — pure DATA only: names, rarity, colors, fabric-pattern key,
// and decoration flags. The actual drawing lives in the pure renderers under
// src/renderer/characters/ (one file per character), keyed by the `id` field
// here. The `id`s are internal keys (renderer map + save data) and never shown
// to the player; the `name` is the user-facing label.
//
// `unlockCost` is paid from the persistent coin wallet. Characters are visual
// only; `isDefault` seeds first-time ownership.

export const CHARACTERS = [
  {
    id: 'sunslayer',
    name: 'Kaito',
    rarity: 'Legendary',
    isDefault: true,       // first / starter character — owned from the start
    unlockCost: 0,
    colorClass: 'text-indigo-400 border-indigo-600/50 bg-indigo-950/20',
    description: 'A wandering ronin in a deep indigo seigaiha-wave haori, with a tied-back topknot.',
    accentColor: '#1e3a8a', // deep indigo
    hairColor: '#0f172a',   // dark slate
    hairTips: '#1e293b',
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#d97706',  // katana guard tint
    patternType: 'seigaiha_blue',
    stats: { element: 'Wind / Air', glow: 'Azure Wave' },
  },
  {
    id: 'thunderhunter',
    name: 'Ren',
    rarity: 'Epic',
    isDefault: false,
    unlockCost: 2200,
    colorClass: 'text-purple-400 border-purple-600/50 bg-purple-950/20',
    description: 'A dark purple kumo-cloud haori inspired by the mythical Tengu, with wild swept-back silver hair.',
    accentColor: '#6d28d9', // dark purple
    hairColor: '#e2e8f0',   // silver / white
    hairTips: '#94a3b8',
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#d97706',
    patternType: 'kumo_purple',
    stats: { element: 'Thunder / Storm', glow: 'Violet Storm' },
  },
  {
    id: 'blossomwarden',
    name: 'Aya',
    rarity: 'Rare',
    isDefault: false,
    unlockCost: 900,
    colorClass: 'text-red-400 border-red-600/50 bg-red-950/20',
    description: 'A crimson asanoha hemp-leaf haori in traditional shrine-maiden colors, with long flowing black hair.',
    accentColor: '#dc2626', // crimson
    hairColor: '#09090b',   // black
    hairTips: '#18181b',
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#d97706',
    patternType: 'asanoha_red',
    stats: { element: 'Blossom / Seal', glow: 'Crimson Seal' },
  },
  {
    id: 'torrentwarden',
    name: 'Mizu',
    rarity: 'Epic',
    isDefault: false,
    unlockCost: 2200,
    colorClass: 'text-stone-300 border-stone-500/50 bg-stone-900/20',
    description: 'A disciplined swordmaster in a charcoal-and-gold yagasuri arrow-feather haori, with neat white hair.',
    accentColor: '#d4af37', // gold focus
    hairColor: '#fafaf9',   // pure white
    hairTips: '#d6d3d1',
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#d97706',
    patternType: 'yagasuri_black',
    stats: { element: 'Crane / Focus', glow: 'Golden Focus' },
  },
  {
    id: 'flamepillar',
    name: 'Hibana',
    rarity: 'Legendary',
    isDefault: false,
    unlockCost: 5000,
    colorClass: 'text-rose-400 border-rose-600/50 bg-rose-950/20',
    description: 'A bold rose shippo haori inspired by the Renjishi lion dance, with a wild voluminous red mane.',
    accentColor: '#be123c', // fierce rose / red
    hairColor: '#e11d48',   // bold red
    hairTips: '#f43f5e',
    hasEarrings: false,
    hasPonytail: false,
    guardColor: '#dc2626',  // crimson guard
    patternType: 'shippo_flame',
    stats: { element: 'Lion / Flame', glow: 'Theatrical Flame' },
  },
];

export const DEFAULT_CHARACTER_ID =
  (CHARACTERS.find((c) => c.isDefault) || CHARACTERS[0]).id;

export const getCharacter = (id) =>
  CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
