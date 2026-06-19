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
    width = 90;
    height = 70;
    y = groundY - height;
    specId = 'spike';
    worldBox = galleryBox(x, groundY, 260, 210, 175);
  } else if (type === 'vine') {
    if (biome === 'water') {
      width = 46;
      y = groundY - 24;
      height = h - y;
      specId = 'sea_vine';
      worldBox = galleryBox(x, h, 250, 260, 195);
    } else {
      width = 70;
      y = 50;
      height = groundY * 0.45;
      specId = 'bamboo_thin';
      worldBox = galleryBox(x, groundY, 180, 240, 175);
    }
  } else if (type === 'thick') {
    width = 44;
    height = 300;
    y = groundY - (160 + Math.random() * 70);
    specId = 'bamboo_thick';
    worldBox = galleryBox(x, groundY, 180, 250, 175);
  } else {
    type = 'basic';
    width = 28;
    height = 280;
    y = groundY - (140 + Math.random() * 90);
    specId = 'bamboo_thin';
    worldBox = galleryBox(x, groundY, 160, 240, 175);
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

export function placeSetpiece(s, type, x, h) {
  const groundY = getLaneY(spawnBiomeOf(s), h);
  const specId = type === 'boulder' ? 'boulder' : 'bridge';
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
  }, specId, galleryBox(x, groundY, type === 'bridge' ? 360 : 300, 260, type === 'bridge' ? 145 : 165));
}

export function placeMover(s, kind, x, h) {
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
      y: h * 0.55,
      width: 88,
      height: 88,
      dir: 0,
      g: 0,
    }, 'spikedboulder', galleryBox(x, h * 0.64, 260, 230, 110));
  } else if (kind === 'barrel') {
    pushObstacle(s, {
      ...common,
      type: 'barrel',
      y: h * 0.48,
      width: 84,
      height: 84,
      dir: 0,
      g: 0,
      explosive: true,
    }, 'spikebarrel', galleryBox(x, h * 0.52, 250, 220, 100));
  } else {
    pushObstacle(s, {
      ...common,
      type: 'stalactite',
      y: 16 + Math.random() * 54,
      width: 78,
      height: 115,
      dir: 0,
      g: 0,
    }, 'glowspikes', ceilingBox(x, 230, 220));
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
  }, 'net', galleryBox(x, groundY + 35, 360, 250, 170));
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
  }, 'raft', galleryBox(x, groundY + 35, 360, 250, 135));
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
