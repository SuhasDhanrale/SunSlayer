import { GATE_CONFIG, GROUND_HEIGHT, getLaneY, getSpeedFactor } from '../config/constants.js';
import { attachObstacleSim } from '../obstacles/index.js';

const spawnBiomeOf = (s) => s.spawnBiome || s.biome || 'bamboo';

const galleryBox = (x, laneY, width = 300, height = 240, localAnchorY = 175) => ({
  x: x - width / 2,
  y: laneY - (localAnchorY / 200) * height,
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

// The single suspended-bridge over a pit. `boxW` is the on-screen length;
// `anchorY` is the spec's local floor line (so the carved ditch lines up with the
// live floor). The open gap itself is `spec.gap` (read by FloorRenderer/
// PhysicsSystem). Cut to drop the plank → safe; leave it un-cut → the monk falls
// in the pit. `boulder` is the only other setpiece — reserved for the cave-gate
// wall (Phase B), never a pattern dodge.
const BRIDGE_VARIANT = { boxW: 360, anchorY: 145 };

export function placeSetpiece(s, type, x, h) {
  const biome = spawnBiomeOf(s);
  const groundY = getLaneY(biome, h);
  const specId = type === 'boulder' ? 'boulder' : 'bridge';
  const variant = type === 'bridge' ? BRIDGE_VARIANT : { boxW: 300, anchorY: 165 };
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

// CAVE timing read: a rock spike that hangs from the ceiling, then drops in its
// fall window (slash it as it falls). `state:'idle'` until the monk closes within
// `lead`, then it accelerates straight down under `g` (PhysicsSystem mover path).
// TODO(stalactite spec): currently borrows the 'glowspikes' spec as a placeholder
// skin — give it a dedicated `stalactite` spec in a Phase B/cave refinement.
export function placeStalactite(s, x, h) {
  pushObstacle(s, {
    id: Math.random(),
    type: 'stalactite',
    x,
    y: -8,
    width: 78,
    height: 115,
    hp: 1,
    hitCooldown: 0,
    stumbled: false,
    state: 'idle',
    vy: 0,
    dir: 1,
    g: 0.34 + Math.random() * 0.18,
    lead: 18 + Math.random() * 72,
    swayOffset: 0,
  }, 'glowspikes', ceilingArtBox(x, 230, 200, -8));
}

// The DON'T-SLICE read: an arrow-bundle drifts across the lane. IGNORE it and it
// passes harmlessly (withholding the blade is the safe play); MIS-SLICE it and it
// bursts into the archer volley (CombatSystem sets `cut`, SegmentSystem watches).
// Single in-flight at a time — one clean read to make, reusing the `arrowCluster`
// slot the timed archer trigger already drives.
export function placeArrowBall(s, x, h) {
  if (s.arrowCluster) return;
  s.arrowCluster = { x, y: h * 0.42, r: 55, cut: false };
}

// WATER adrenaline: a raft ferries a yokai burst. The READ is the raft SIZE — a
// big raft telegraphs many yokai, a small one a few. Slicing it releases that
// burst (CombatSystem); ignoring it lets the raft RAM the monk for a stumble
// (PhysicsSystem). No yokai are spawned at placement now (RUN_DESIGN §2).
export function placeRaft(s, x, h) {
  const groundY = getLaneY(spawnBiomeOf(s), h);
  const big = Math.random() < 0.4;
  const yokaiCount = big ? 4 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
  const width = big ? 250 : 150;
  const boxW = big ? 420 : 300;
  const boxH = boxW * 0.68; // raft sprite box stays proportional to its width
  pushObstacle(s, {
    id: Math.random(),
    type: 'raft',
    x,
    y: groundY - 6,
    width,
    height: 40,
    hp: 1,
    hitCooldown: 0,
    stumbled: false,
    swayOffset: 0,
    yokaiCount,
  }, 'raft', galleryBox(x, groundY, boxW, boxH, 135));
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

export function placeGate(s, x, h, elapsedSec = 0) {
  const groundY = getLaneY('cave', h);
  const speedFactor = getSpeedFactor(elapsedSec);
  const lead = Math.max(
    GATE_CONFIG.tntLeadPxMin,
    GATE_CONFIG.tntLeadPxStart - Math.max(0, speedFactor - 1) * GATE_CONFIG.tntLeadShrinkPerSpeed
  );
  const gateId = Math.random();
  const wallX = x;
  const layout = Math.random() < 0.5
    ? [{ dx: -34, scale: 0.95 }, { dx: 36, scale: 1.08 }, { dx: 0, scale: 0.86 }]
    : [{ dx: -48, scale: 1.1 }, { dx: 20, scale: 0.92 }, { dx: 68, scale: 0.82 }];

  for (const part of layout) {
    const boxW = 260 * part.scale;
    const boxH = 240 * part.scale;
    pushObstacle(s, {
      id: Math.random(),
      type: 'boulder',
      x: wallX + part.dx,
      y: groundY,
      width: 110 * part.scale,
      height: GROUND_HEIGHT,
      state: 'armed',
      reactT: 0,
      rot: Math.random() * Math.PI,
      ropeOffY: ROPE_BAND.min + Math.random() * ROPE_BAND.span,
      ropeR: 42,
      stumbled: false,
      hp: 1,
      hitCooldown: 0,
      swayOffset: 0,
      gate: true,
      gateId,
      gateContactBand: GATE_CONFIG.lethalContactBand,
    }, 'boulder', galleryBox(wallX + part.dx, groundY, boxW, boxH, 165));
  }

  const size = 64;
  const tntX = wallX - lead;
  pushObstacle(s, {
    id: Math.random(),
    type: 'tnt',
    x: tntX,
    y: groundY - size,
    width: size,
    height: size,
    hp: 1,
    hitCooldown: 0,
    stumbled: false,
    swayOffset: 0,
    explosive: true,
    gate: true,
    gateId,
    blastRadius: GATE_CONFIG.blastRadius,
  }, 'tnt', galleryBox(tntX, groundY, 300, 240, 170));
}
