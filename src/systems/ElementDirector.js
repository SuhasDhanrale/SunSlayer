import { GROUND_HEIGHT, getLaneY } from '../config/constants.js';
import { attachObstacleSim } from '../obstacles/index.js';

const spawnBiomeOf = (s) => s.spawnBiome || s.biome || 'bamboo';

const galleryBox = (x, laneY, width = 300, height = 240, localAnchorY = 175) => ({
  x: x - width / 2,
  y: laneY - (localAnchorY / 200) * height,
  width,
  height,
});

const ceilingBox = (x, width = 300, height = 220) => ({
  x: x - width / 2,
  y: 0,
  width,
  height,
});

const ceilingArtBox = (x, width = 220, height = 240, offsetY = 0) => ({
  x: x - width / 2,
  y: offsetY,
  width,
  height,
});

function pushObstacle(s, entity, specId, worldBox) {
  s.bamboo.push(attachObstacleSim(entity, specId, worldBox));
}

export function placeObstacle(s, type, x, h) {
  const biome = spawnBiomeOf(s);
  const groundY = getLaneY(biome, h);
  let y;
  let height;
  let width;
  let specId;
  let worldBox;

  if (type === 'spike') {
    width = 180;
    height = 70;
    y = groundY - height;
    specId = 'spike';
    worldBox = galleryBox(x, groundY + 32, 340, 210, 175);
  } else if (type === 'vine') {
    if (biome === 'water') {
      width = 46;
      y = groundY - 24;
      height = h - y;
      specId = 'sea_vine';
      worldBox = galleryBox(x, h, 240, 260, 195);
    } else {
      width = 70;
      y = 50;
      height = groundY * 0.45;
      s.bamboo.push({
        id: Math.random(),
        type,
        x,
        y,
        width,
        height,
        hp: 1,
        hitCooldown: 0,
        stumbled: false,
        swayOffset: Math.random() * Math.PI * 2,
      });
      return;
    }
  } else if (type === 'thick') {
    width = 44;
    height = 300;
    y = groundY - (160 + Math.random() * 70);
    s.bamboo.push({
      id: Math.random(),
      type,
      x,
      y,
      width,
      height,
      hp: 3,
      hitCooldown: 0,
      stumbled: false,
      swayOffset: Math.random() * Math.PI * 2,
    });
    return;
  } else {
    type = 'basic';
    width = 28;
    height = 280;
    y = groundY - (140 + Math.random() * 90);
    s.bamboo.push({
      id: Math.random(),
      type,
      x,
      y,
      width,
      height,
      hp: 1,
      hitCooldown: 0,
      stumbled: false,
      swayOffset: Math.random() * Math.PI * 2,
    });
    return;
  }

  pushObstacle(s, {
    id: Math.random(),
    type,
    x,
    y,
    width,
    height,
    hp: type === 'thick' ? 3 : 1,
    hitCooldown: 0,
    stumbled: false,
    swayOffset: Math.random() * Math.PI * 2,
  }, specId, worldBox);
}

const ROPE_BAND = { min: 150, span: 210 };

// The bridge variants over a pit. `boxW` varies the on-screen length; `anchorY`
// is the spec's local floor line (so the carved ditch lines up with the live
// floor). The open gap itself is `spec.gap` (read by FloorRenderer/PhysicsSystem).
// Cut to drop the plank → safe; leave it un-cut → the monk falls in the pit.
const BRIDGE_VARIANTS = {
  bridge: { boxW: 360, anchorY: 145 },        // suspended platform (any biome)
  drawbridge: { boxW: 320, anchorY: 140 },    // one-side hanging (cave)
  smallbridges: { boxW: 300, anchorY: 138 },  // V-shaped log pair (cave)
};

// Pick a bridge spec for the spawn biome — cave gets the full variety, other
// biomes keep the plain suspended platform.
function pickBridgeSpec(biome) {
  const pool = biome === 'cave'
    ? ['bridge', 'drawbridge', 'smallbridges']
    : ['bridge'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function placeSetpiece(s, type, x, h) {
  const biome = spawnBiomeOf(s);
  const groundY = getLaneY(biome, h);
  const specId = type === 'boulder' ? 'boulder' : pickBridgeSpec(biome);
  const variant = BRIDGE_VARIANTS[specId] || { boxW: 300, anchorY: 165 };
  pushObstacle(s, {
    id: Math.random(),
    type,
    x,
    y: groundY,
    width: type === 'bridge' ? 180 : 90,
    height: GROUND_HEIGHT,
    state: 'armed',
    reactT: 0,
    rot: 0,
    ropeOffY: ROPE_BAND.min + Math.random() * ROPE_BAND.span,
    ropeR: 42,
    stumbled: false,
    hp: 1,
    hitCooldown: 0,
    swayOffset: 0,
  }, specId, galleryBox(x, groundY, type === 'bridge' ? variant.boxW : 300, 260, type === 'bridge' ? variant.anchorY : 165));
}

export function placeMover(s, kind, x, h) {
  const laneY = getLaneY(spawnBiomeOf(s), h);
  const common = {
    id: Math.random(),
    x,
    hp: 1,
    hitCooldown: 0,
    stumbled: false,
    state: 'active',
    vy: 0,
    lead: 72,
    swayOffset: 0,
  };

  if (kind === 'mine') {
    pushObstacle(s, {
      ...common,
      type: 'mine',
      y: laneY + 38,
      width: 88,
      height: 88,
      dir: 0,
      g: 0,
    }, 'spikedboulder', galleryBox(x, laneY + 70, 260, 230, 110));
  } else if (kind === 'barrel') {
    pushObstacle(s, {
      ...common,
      type: 'barrel',
      y: laneY + 20,
      width: 84,
      height: 84,
      dir: 0,
      g: 0,
      explosive: true,
    }, 'spikebarrel', galleryBox(x, laneY + 45, 250, 220, 100));
  } else {
    pushObstacle(s, {
      ...common,
      state: 'idle',
      type: 'stalactite',
      y: -8,
      width: 78,
      height: 115,
      dir: 1,
      g: 0.34 + Math.random() * 0.18,
      lead: 18 + Math.random() * 72,
    }, 'glowspikes', ceilingArtBox(x, 230, 200, -8));
  }
}

export function placeNet(s, x, h) {
  const groundY = getLaneY(spawnBiomeOf(s), h);
  pushObstacle(s, {
    id: Math.random(),
    type: 'net',
    x,
    y: groundY - 75,
    width: 130,
    height: 150,
    hp: 1,
    hitCooldown: 0,
    stumbled: false,
    swayOffset: 0,
  }, 'net', galleryBox(x, groundY, 340, 240, 170));
}

export function placeRaft(s, x, h) {
  const groundY = getLaneY(spawnBiomeOf(s), h);
  pushObstacle(s, {
    id: Math.random(),
    type: 'raft',
    x,
    y: groundY - 6,
    width: 170,
    height: 40,
    hp: 1,
    hitCooldown: 0,
    stumbled: false,
    swayOffset: 0,
  }, 'raft', galleryBox(x, groundY, 340, 230, 135));
}

export function placeTnt(s, x, h) {
  const groundY = getLaneY(spawnBiomeOf(s), h);
  const size = 64;
  pushObstacle(s, {
    id: Math.random(),
    type: 'tnt',
    x,
    y: groundY - size,
    width: size,
    height: size,
    hp: 1,
    hitCooldown: 0,
    stumbled: false,
    swayOffset: 0,
    explosive: true,
  }, 'tnt', galleryBox(x, groundY, 300, 240, 170));
}
