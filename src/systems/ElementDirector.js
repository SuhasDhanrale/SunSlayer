import { GROUND_HEIGHT } from '../config/constants.js';
import { CoinSystem } from './CoinSystem.js';
import { DemonSystem } from './DemonSystem.js';

// ──────────────────────────────────────────────────────────────────────────
// The EXECUTOR. ElementDirector knows HOW to inject each element; it no longer
// decides WHEN/WHAT mix. The RunDirector (conductor) owns that: it hands us the
// current zone (a recipe + a beat gap), and we spawn to that recipe on the beat.
//
// To add an element: add a spawner here + reference its id from a zone recipe in
// RunDirector. Every element still resolves through the SAME simple slash; the
// only spatial nuance is high vs low, which falls out of vertical placement:
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
// Bridges vary their rope height so a gauntlet reads as planks "hung at different
// heights" (STUB: just the cut-target height for now — geometry is placeholder).
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
    ropeOffY: type === 'bridge' ? 180 + Math.random() * 140 : 230, // varied hang height
    ropeR: 42,               // generous cut radius
    stumbled: false,
    hp: 1, hitCooldown: 0, swayOffset: 0
  });
}

// id → spawner. Zone recipes (in RunDirector) reference these ids.
const SPAWNERS = {
  bamboo:     (s, w, h) => pushObstacle(s, w, h, 'basic'),
  thick:      (s, w, h) => pushObstacle(s, w, h, 'thick'),
  vine:       (s, w, h) => pushObstacle(s, w, h, 'vine'),
  spikes:     (s, w, h) => {                                        // GROUP: spikes + aligned coins
    pushObstacle(s, w, h, 'spike');
    CoinSystem.spawnLine(s, w + 60, (h - GROUND_HEIGHT) - 100, 4, 46);   // ride the low sweep
  },
  coins:      (s, w, h) => CoinSystem.spawnCluster(s, w, h),
  lanterns:   (s, w, h) => CoinSystem.spawnCluster(s, w, h),
  bridge:     (s, w, h) => pushSetpiece(s, w, h, 'bridge'),
  boulder:    (s, w, h) => pushSetpiece(s, w, h, 'boulder'),
  enemyPoke:  (s, w, h) => DemonSystem.spawnWave(s, w, h, 1 + Math.floor(Math.random() * 2)), // 1–2
  enemySwarm: (s, w, h) => DemonSystem.spawnWave(s, w, h, 4 + Math.floor(Math.random() * 3)), // 4–6 peak
};

function pickWeighted(recipe) {
  let total = 0;
  for (const e of recipe) total += e.weight;
  let r = Math.random() * total;
  for (const e of recipe) { r -= e.weight; if (r <= 0) return e.id; }
  return recipe[recipe.length - 1].id;
}

export const ElementDirector = {
  tick(s, dt, canvasWidth, canvasHeight) {
    const z = s.director.zone;
    if (!z || !z.recipe || !z.recipe.length) return; // no zone → conductor hasn't handed one yet

    s.elementTimer += dt;
    if (s.elementTimer < z.gap) return;
    s.elementTimer = 0;

    const id = pickWeighted(z.recipe);
    const spawn = SPAWNERS[id];
    if (spawn) { spawn(s, canvasWidth, canvasHeight); z._beat++; }
  }
};
