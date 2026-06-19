import { GATE_CONFIG, GROUND_HEIGHT, getLaneY } from '../config/constants.js';
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

// One cave PILLAR: a slim column of organic rock walling the lane, ALWAYS rigged
// with TWO TNT crates — one low, one high. A crate's blast only clears its own
// pocket, so the low crate opens the floor (the lethal part of the lane → safe
// pass) while the high crate finishes the top, fully blowing the pillar away.
// Reuses the gate boulder mechanic (gate:true → lane-lethal, unsliceable,
// organic render) so a TNT is never a bare crate — there's always rock with it.
function placeCavePillar(s, px, groundY, ceilingY) {
  const topY = groundY - (groundY - ceilingY) * (0.5 + Math.random() * 0.4);
  for (let cy = groundY - 4; cy > topY; cy -= 28 + Math.random() * 12) {
    const radius = 24 + Math.random() * 14;
    pushObstacle(s, {
      id: Math.random(),
      type: 'boulder',
      x: px + (Math.random() * 18 - 9),
      y: cy - radius,
      width: radius * 2,
      height: radius * 2,
      state: 'armed',
      reactT: 0,
      stumbled: false,
      hp: 1,
      hitCooldown: 0,
      swayOffset: 0,
      gate: true,
      gateContactBand: GATE_CONFIG.lethalContactBand,
      radius,
      shade: ROCK_SHADES[Math.floor(Math.random() * ROCK_SHADES.length)],
      rot: Math.random() * Math.PI * 2,
      rockSeed: Math.random() * 1000,
    }, 'boulder', galleryBox(px, cy, radius * 2, radius * 2, 100));
  }

  const pillarH = groundY - topY;
  const size = 56;
  for (const f of [0.18, 0.64]) {            // low crate (lane), high crate (top)
    const ty = groundY - pillarH * f - size;
    pushObstacle(s, {
      id: Math.random(),
      type: 'tnt',
      x: px,
      y: ty,
      width: size,
      height: size,
      hp: 1,
      hitCooldown: 0,
      stumbled: false,
      swayOffset: 0,
      explosive: true,
      blastRadius: GATE_CONFIG.blastRadius,
    }, 'tnt', galleryBox(px, ty + size, 300, 240, 170));
  }
}

// CAVE 'K' element: a cluster of TNT pillars walling the path — usually 1, often
// 2, occasionally 3 (kept modest so it layers on the other cave obstacles rather
// than swamping them). Each pillar is a slim, mid-run cousin of the entrance gate
// and always carries its two crates.
export function placeTnt(s, x, h) {
  const groundY = getLaneY('cave', h);
  const ceilingY = h * 0.10;
  const roll = Math.random();
  const count = roll < 0.55 ? 1 : (roll < 0.88 ? 2 : 3);
  for (let p = 0; p < count; p++) {
    placeCavePillar(s, x + p * (130 + Math.random() * 50), groundY, ceilingY);
  }
}

// Slate cave-rock shades for the organic boulders, lit → deep shadow.
const ROCK_SHADES = ['#3b4757', '#2f3a48', '#26303d', '#1c2531', '#141b25'];

// TNT crates sit along the FLOOR, each owning a horizontal SEGMENT of the lane
// (dx) so the player must slice every one to fully open the passage — slicing a
// single crate only clears its own pocket (no chain). The wall's upper rock
// stays put (it's above the monk's lane), so the gap reads as a blasted archway.
const GATE_TNT_SPOTS = [
  { dx: -105, fy: 0.94 },
  { dx: 0, fy: 0.88 },
  { dx: 105, fy: 0.95 },
];

export function placeGate(s, x, h) {
  const groundY = getLaneY('cave', h);
  const gateId = Math.random();
  const wallX = x;
  const ceilingY = h * 0.10;

  // The cave gate is a THICK, DENSE field of organic boulders choking the tunnel
  // mouth, with a few TNT crates wedged along its base. Slicing a crate blasts a
  // BOUNDED pocket of boulders around it (CombatSystem → PhysicsSystem expanding
  // ring) — no chain to other crates — so the thick wall takes several cuts to
  // open. Lethal-on-contact only fires for boulders still in the monk's body
  // band (PhysicsSystem), so blasting the floor-level pocket is a real safe pass.
  const colStep = 40;
  const rowStep = 40;
  const wallHalf = 150;                  // wall spans wallX ± 150 (thicker)
  for (let gx = wallX - wallHalf; gx <= wallX + wallHalf; gx += colStep) {
    for (let cy = groundY; cy > ceilingY; cy -= rowStep) {
      if (Math.random() > 0.92) continue;   // ~92% fill → thick, only lightly ragged
      const radius = 22 + Math.random() * 18;
      const cyJitter = cy + (Math.random() * 22 - 11);
      pushObstacle(s, {
        id: Math.random(),
        type: 'boulder',
        x: gx + (Math.random() * 22 - 11),
        y: cyJitter - radius,             // y = top of the bounding box
        width: radius * 2,
        height: radius * 2,
        state: 'armed',
        reactT: 0,
        stumbled: false,
        hp: 1,
        hitCooldown: 0,
        swayOffset: 0,
        gate: true,
        gateId,
        gateContactBand: GATE_CONFIG.lethalContactBand,
        radius,
        shade: ROCK_SHADES[Math.floor(Math.random() * ROCK_SHADES.length)],
        rot: Math.random() * Math.PI * 2,
        rockSeed: Math.random() * 1000,
      }, 'boulder', galleryBox(gx, cyJitter, radius * 2, radius * 2, 100));
    }
  }

  const size = 56;
  for (const spot of GATE_TNT_SPOTS) {
    const ty = ceilingY + (groundY - ceilingY) * spot.fy - size;
    const tx = wallX + spot.dx + (Math.random() * 16 - 8);
    pushObstacle(s, {
      id: Math.random(),
      type: 'tnt',
      x: tx,
      y: ty,
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
    }, 'tnt', galleryBox(tx, ty + size, 300, 240, 170));
  }
}
