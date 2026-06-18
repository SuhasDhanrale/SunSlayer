import { GROUND_HEIGHT, getLaneY } from '../config/constants.js';

// ──────────────────────────────────────────────────────────────────────────
// Element PLACEMENT primitives. Each `place*` function knows HOW to inject one
// element into the world (where it sits, its band, its lifecycle hints). It does
// NOT decide WHEN/WHAT to spawn — PatternRunner calls these per compiled cell,
// driven by the RunDirector conductor.
//
// To add an element: add a place* primitive here + a cell symbol that calls it
// in PatternRunner.emitCell. Every element still resolves through the SAME simple
// slash; the only spatial nuance is high vs low, which falls out of vertical
// placement:
//   spike  → low band  (must sweep low)
//   vine   → high band (must sweep high)
//   stalk  → mid band  (sweep anywhere)
// ──────────────────────────────────────────────────────────────────────────

// Inject one slashable obstacle at an explicit world-x (lives in s.bamboo;
// CombatSystem/PhysicsSystem already treat every entry as "slash to clear, miss
// = stumble"). The type dictates the vertical band; x is supplied by the caller
// (ElementDirector spawns at the right edge; PatternRunner aligns to a column).
export function placeObstacle(s, type, x, h) {
  const groundY = getLaneY(s.biome, h);    // ground line, OR water surface lane
  let y, height, width;

  if (type === 'spike') {
    width = 90; height = 70; y = groundY - height;          // low band
  } else if (type === 'vine') {
    if (s.biome === 'water') {
      // WATER kelp: rises from the deep up to just under the swim lane — slash its
      // head (in the surface band) to clear it.
      width = 46; y = groundY - 24; height = h - y;
    } else {
      width = 70; y = 50; height = groundY * 0.45;          // high band (hanging)
    }
  } else if (type === 'thick') {
    width = 44; height = 300; y = groundY - (160 + Math.random() * 70);
  } else {
    type = 'basic'; width = 28; height = 280; y = groundY - (140 + Math.random() * 90);
  }

  s.bamboo.push({
    id: Math.random(), type, x, y, width, height,
    hp: type === 'thick' ? 3 : 1, hitCooldown: 0, stumbled: false,
    swayOffset: Math.random() * Math.PI * 2
  });
}

// "Slash a release point" set-pieces (the BUILD/SOLVE family): a rope hangs HIGH
// over the hazard — cut it (a simple high slash) and it resolves (plank bridges
// the gap / boulder rolls away). Miss it and the hazard trips you (heavy stumble).
// Both bridges AND boulders get a RANDOM cut height (within ROPE_BAND) and each is
// rolled independently — so a gauntlet reads as ropes "hung at different heights"
// and reading WHERE to slice is the actual decision, not a reflex at one spot.
const ROPE_BAND = { min: 150, span: 210 }; // cut-target height above ground (px)
export function placeSetpiece(s, type, x, h) {
  const groundY = getLaneY(s.biome, h);
  s.bamboo.push({
    id: Math.random(), type,
    x,
    y: groundY,
    width: type === 'bridge' ? 180 : 90,
    height: GROUND_HEIGHT,
    state: 'armed',          // armed → resolved (once the rope is cut)
    reactT: 0,               // resolution animation clock
    rot: 0,
    ropeOffY: ROPE_BAND.min + Math.random() * ROPE_BAND.span, // random cut height — read it, slice it
    ropeR: 42,               // generous cut radius
    stumbled: false,
    hp: 1, hitCooldown: 0, swayOffset: 0
  });
}

// Biome MOVERS — slashable hazards that TRAVEL vertically into the monk's lane
// instead of standing in it. They idle off in their home band, then on a fixed
// LEAD time (so it reads the same at any run speed) they launch along `dir` (+1
// drops, -1 rises) under accel `g`. Slashing is generic (they live in s.bamboo);
// PhysicsSystem owns the travel + the band-aware "miss = stumble" (a hanging rock
// overhead must NOT trip you — see PhysicsSystem's mover branch).
//   stalactite (CAVE)  → hangs at the ceiling, DROPS  → slash HIGH on the way down
//   mine       (WATER) → lurks below the lane, RISES  → slash before it surfaces
export function placeMover(s, kind, x, h) {
  const groundY = getLaneY(s.biome, h);
  const common = { id: Math.random(), x, hp: 1, hitCooldown: 0, stumbled: false, state: 'idle', vy: 0, lead: 72, swayOffset: 0 };
  if (kind === 'mine') {
    // WATER: lurks deep, RISES into the swim lane — slash before it surfaces.
    s.bamboo.push({ ...common, type: 'mine', y: h * 0.82, width: 70, height: 56, dir: -1, g: 0.5 });
  } else if (kind === 'barrel') {
    // WATER: a big spiked barrel tethered deeper, rises fast and EXPLODES when cut
    // (chain-clears nearby barrels). Slash it before it reaches the lane.
    s.bamboo.push({ ...common, type: 'barrel', y: h * 0.9, width: 84, height: 84, dir: -1, g: 0.6, explosive: true });
  } else {
    // CAVE: hangs at the ceiling, DROPS — slash HIGH on the way down.
    s.bamboo.push({ ...common, type: 'stalactite', y: 16 + Math.random() * 54, width: 78, height: 62, dir: 1, g: 0.5 });
  }
}

// WATER net — a mid-lane mesh wall straddling the swim lane. A plain standing
// obstacle: slash to clear, miss = stumble (generic Physics/Combat path).
export function placeNet(s, x, h) {
  const groundY = getLaneY(s.biome, h);
  s.bamboo.push({
    id: Math.random(), type: 'net', x, y: groundY - 75, width: 130, height: 150,
    hp: 1, hitCooldown: 0, stumbled: false, swayOffset: 0,
  });
}

// WATER raft — pure DRESSING that ferries a normal yokai wave in (the wave is
// spawned by the caller via DemonSystem; the raft itself doesn't collide or get
// sliced — see PhysicsSystem's raft branch + CombatSystem's raft skip).
export function placeRaft(s, x, h) {
  const groundY = getLaneY(s.biome, h);
  s.bamboo.push({
    id: Math.random(), type: 'raft', x, y: groundY - 6, width: 170, height: 14,
    hp: 1, hitCooldown: 0, stumbled: false, swayOffset: 0,
  });
}

// CAVE TNT — an explosive block in the lane. Slash it to detonate (the blast
// chain-clears nearby TNT/barrels/boulders — see CombatSystem.explode); miss it
// and it trips you like any standing obstacle.
export function placeTnt(s, x, h) {
  const groundY = getLaneY(s.biome, h);
  const size = 64;
  s.bamboo.push({
    id: Math.random(), type: 'tnt', x, y: groundY - size, width: size, height: size,
    hp: 1, hitCooldown: 0, stumbled: false, swayOffset: 0, explosive: true,
  });
}

