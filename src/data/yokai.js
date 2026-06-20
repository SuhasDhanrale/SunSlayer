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
];

export const YOKAI_BY_ID = Object.fromEntries(YOKAI.map((yokai) => [yokai.id, yokai]));

export function getYokai(id) {
  return YOKAI_BY_ID[id] || YOKAI[0];
}

export function randomYokai(random = Math.random) {
  return YOKAI[Math.floor(random() * YOKAI.length) % YOKAI.length];
}

export function countActiveYokai(demons) {
  return demons.reduce((count, demon) => count + (demon.sliced ? 0 : 1), 0);
}
