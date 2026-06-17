import { GROUND_HEIGHT } from '../config/constants.js';
import { CoinSystem } from './CoinSystem.js';
import { DemonSystem } from './DemonSystem.js';

// ──────────────────────────────────────────────────────────────────────────
// The run is composed from "elements". Each element knows how to inject its
// entities; the director picks one per beat by WEIGHT, gated by minDist (the
// teaching curve — rarer/harder things appear later), and some elements spawn a
// GROUP (e.g. spikes + an aligned coin trail). To author the run you tune this
// one table — no hand-placed levels.
//
// Every element resolves through the SAME simple slash. The only spatial nuance
// is high vs low, which falls out of where each obstacle sits vertically:
//   spike  → low band  (must sweep low)
//   vine   → high band (must sweep high)
//   stalk  → mid band  (sweep anywhere)
// ──────────────────────────────────────────────────────────────────────────

// Inject one slashable obstacle (lives in s.bamboo; CombatSystem/PhysicsSystem
// already treat every entry as "slash to clear, miss = stumble").
function pushObstacle(s, w, h, type) {
  const groundY = h - GROUND_HEIGHT;
  let y, height, width;

  if (type === 'spike') {
    width = 90; height = 70; y = groundY - height;          // low band
  } else if (type === 'vine') {
    width = 70; y = 50; height = groundY * 0.45;            // high band
  } else if (type === 'thick') {
    width = 44; height = 300; y = groundY - (160 + Math.random() * 70);
  } else {
    type = 'basic'; width = 28; height = 280; y = groundY - (140 + Math.random() * 90);
  }

  s.bamboo.push({
    id: Math.random(), type, x: w + 60, y, width, height,
    hp: type === 'thick' ? 3 : 1, hitCooldown: 0, stumbled: false,
    swayOffset: Math.random() * Math.PI * 2
  });
}

// "Slash a release point" set-pieces (the BUILD/SOLVE family): a rope hangs HIGH
// over the hazard — cut it (a simple high slash) and it resolves (plank bridges
// the gap / boulder rolls away). Miss it and the hazard trips you (heavy stumble).
function pushSetpiece(s, w, h, type) {
  const groundY = h - GROUND_HEIGHT;
  s.bamboo.push({
    id: Math.random(), type,
    x: w + 140,
    y: groundY,
    width: type === 'bridge' ? 180 : 90,
    height: GROUND_HEIGHT,
    state: 'armed',          // armed → resolved (once the rope is cut)
    reactT: 0,               // resolution animation clock
    rot: 0,
    ropeOffY: 230,           // rope cut-target height above the ground
    ropeR: 42,               // generous cut radius
    stumbled: false,
    hp: 1, hitCooldown: 0, swayOffset: 0
  });
}

// The authoring surface: weight = frequency, minDist = first appearance.
const ELEMENTS = [
  { id: 'bamboo',   weight: 10, minDist: 0,    spawn: (s, w, h) => pushObstacle(s, w, h, 'basic') },
  { id: 'coins',    weight: 6,  minDist: 0,    spawn: (s, w, h) => CoinSystem.spawnCluster(s, w, h) },
  { id: 'thick',    weight: 4,  minDist: 500,  spawn: (s, w, h) => pushObstacle(s, w, h, 'thick') },
  { id: 'spikes',   weight: 6,  minDist: 1200, spawn: (s, w, h) => {            // GROUP: spikes + aligned coins
      pushObstacle(s, w, h, 'spike');
      CoinSystem.spawnLine(s, w + 60, (h - GROUND_HEIGHT) - 100, 4, 46);        // ride the low sweep
    } },
  { id: 'vine',     weight: 4,  minDist: 2600, spawn: (s, w, h) => pushObstacle(s, w, h, 'vine') },
  { id: 'lanterns', weight: 1,  minDist: 3500, spawn: (s, w, h) => CoinSystem.spawnCluster(s, w, h) }, // rare bonus
  // Set-pieces (cut-the-rope puzzles) — the variation beats.
  { id: 'bridge',   weight: 3,  minDist: 1500, spawn: (s, w, h) => pushSetpiece(s, w, h, 'bridge') },
  { id: 'boulder',  weight: 3,  minDist: 2200, spawn: (s, w, h) => pushSetpiece(s, w, h, 'boulder') },
  // Enemies woven into the run: frequent small "one-two" pokes, plus rarer,
  // later-unlocking swarm peaks (slicing enemies is the most satisfying beat).
  { id: 'enemyPoke',  weight: 5, minDist: 800,  spawn: (s, w, h) => DemonSystem.spawnWave(s, w, h, 1 + Math.floor(Math.random() * 2)) }, // 1–2
  { id: 'enemySwarm', weight: 2, minDist: 3000, spawn: (s, w, h) => DemonSystem.spawnWave(s, w, h, 4 + Math.floor(Math.random() * 3)) }, // 4–6 peak
];

export const ElementDirector = {
  tick(s, dt, canvasWidth, canvasHeight) {
    s.elementTimer += dt;
    // Beat spacing tightens as the run speeds up.
    const gap = Math.max(55, 120 - s.distance * 0.004);
    if (s.elementTimer < gap) return;
    s.elementTimer = 0;

    const pool = ELEMENTS.filter(e => s.distance >= e.minDist);
    let total = 0;
    for (const e of pool) total += e.weight;

    let r = Math.random() * total;
    let pick = pool[pool.length - 1];
    for (const e of pool) { r -= e.weight; if (r <= 0) { pick = e; break; } }

    pick.spawn(s, canvasWidth, canvasHeight);
  }
};
