// Final production yokai roster. Visual paths live in renderer/yokai so this
// module stays data-only and can also drive galleries, spawning, and particles.
export const YOKAI = [
  {
    id: 'oni',
    name: 'Oni Mask (鬼)',
    desc: 'Classic horned ogre representing wrath and raw power. Broad crimson face, golden horns, protruding fangs.',
    color: '#dc2626',
    galleryRadius: 35,
    rotationSpeed: 0.015,
    accentColors: ['#dc2626', '#facc15'],
  },
  {
    id: 'kitsune',
    name: 'Kitsune Mask (狐)',
    desc: 'Cunning white fox messenger spirit of Inari. Pale bone-white, glowing cyan eyes, and fiery red cheek stripes.',
    color: '#f8fafc',
    galleryRadius: 30,
    rotationSpeed: 0.02,
    accentColors: ['#f8fafc', '#06b6d4', '#ef4444'],
  },
  {
    id: 'noface',
    name: 'No-Face Mask (野箆坊)',
    desc: 'Eerie faceless yokai mimicking human presence. A blank white oval with minimal calligraphy markings.',
    color: '#fafaf9',
    galleryRadius: 30,
    rotationSpeed: 0.008,
    accentColors: ['#fafaf9', '#86198f', '#dc2626'],
  },
  {
    // The Fruit-Ninja "pomegranate" treat. `special: true` keeps it OUT of every
    // random/woven spawn pool — it only ever arrives via DemonSystem.spawnGolden.
    // Round gilded fortune mask so it reads instantly as the sparkly bonus.
    id: 'golden',
    name: 'Fortune Mask (福)',
    desc: 'A rare gilded fortune mask. Slash it as fast as you can before it bursts — the blast clears every yokai on screen and showers coins.',
    color: '#fbbf24',
    galleryRadius: 38,
    rotationSpeed: 0.006,
    accentColors: ['#fde68a', '#f59e0b', '#fbbf24'],
    special: true,
  },
];

export const YOKAI_BY_ID = Object.fromEntries(YOKAI.map((yokai) => [yokai.id, yokai]));

export function getYokai(id) {
  return YOKAI_BY_ID[id] || YOKAI[0];
}

// The normal-spawn roster excludes `special` yokai (the golden treat) so it can
// never appear through a random draw or an empty-typeIds fallback.
const SPAWNABLE = YOKAI.filter((yokai) => !yokai.special);

export function randomYokai(random = Math.random) {
  return SPAWNABLE[Math.floor(random() * SPAWNABLE.length) % SPAWNABLE.length];
}

export function randomYokaiFrom(typeIds, random = Math.random) {
  const pool = Array.isArray(typeIds)
    ? typeIds.map((id) => YOKAI_BY_ID[id]).filter((yokai) => yokai && !yokai.special)
    : [];
  const choices = pool.length ? pool : SPAWNABLE;
  return choices[Math.floor(random() * choices.length) % choices.length];
}

export function countActiveYokai(demons) {
  return demons.reduce((count, demon) => count + (demon.sliced ? 0 : 1), 0);
}
