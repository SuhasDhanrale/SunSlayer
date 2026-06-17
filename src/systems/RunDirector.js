import { PACING } from '../config/constants.js';

// ── The Conductor ────────────────────────────────────────────────────────────
// RunDirector owns the run's INTENSITY RHYTHM. It never spawns an entity itself;
// it hands the ElementDirector (the executor) a ZONE — a recipe + a length — and
// the executor spawns to that recipe until the zone ends. This is what turns the
// run from "uniform random soup" into deliberate pacing: contrast between calm
// pauses and high-stake peaks.
//
// Two acts:
//   1. TEACH (the opening "progression cover"): a scripted queue introduces each
//      element ISOLATED (alone, sparse, readable) → REINFORCED (a wall of just
//      that one, to build the skill) → then it joins the vocabulary. That ordering
//      *is* the isolated → reinforced → combined curve.
//   2. RHYTHM (after the queue drains): alternate REST ↔ PEAK forever. A PEAK is
//      either a FLOOD (one element, dense — e.g. "30s of overwhelming yokai") or a
//      COMBO (2–3 taught elements woven — a dense bamboo forest, a bridge gauntlet).
//      Peaks lengthen & tighten and rests shrink as cycles climb, so the contrast
//      keeps sharpening.
//
// A Zone is the whole authoring surface: { kind, label, durationDist, gap,
// intensity, recipe:[{id,weight}], teaches }. To re-author pacing you tune this
// file + data/config.json — there are still no hand-placed levels.
// ─────────────────────────────────────────────────────────────────────────────

const w = (id, weight) => ({ id, weight });

function zone(kind, label, durationDist, gap, intensity, recipe, teaches) {
  return { kind, label, durationDist, gap, intensity, recipe, teaches: teaches || null, _beat: 0 };
}

// Act 1. Each TEACH zone marks its element "taught" so the generator may later
// weave it into combos. REST zones are the low-stakes breathers between lessons.
//
// NOTE — the REST recipe is a deliberate PLACEHOLDER. "What a pause actually is"
// (Temple-Run rope coin-slide? Subway-style board grind?) is still undecided, so
// rest is just a sparse coin breather for now. Swap this recipe (or give REST a
// dedicated spawner id) to drop in the real pause beat WITHOUT touching the
// pacing engine.
function buildTeachQueue() {
  const P = PACING;
  const rest = () => zone('REST', 'Breather', P.restDist, P.baseGap * 1.3, 0.1, [w('coins', 1)], null);
  return [
    zone('TEACH', 'Bamboo',      P.isolateDist,   P.baseGap,        0.25, [w('bamboo', 1)], 'bamboo'),
    zone('TEACH', 'Bamboo Wall', P.reinforceDist, P.baseGap * 0.7,  0.40, [w('bamboo', 1)], null),
    rest(),
    zone('TEACH', 'Thick Stalk', P.isolateDist,   P.baseGap,        0.30, [w('thick', 1), w('coins', 0.3)], 'thick'),
    zone('TEACH', 'Low Spikes',  P.isolateDist,   P.baseGap,        0.35, [w('spikes', 1)], 'spikes'),
    rest(),
    zone('TEACH', 'High Vines',  P.isolateDist,   P.baseGap,        0.35, [w('vine', 1)], 'vine'),
    zone('TEACH', 'Rope Bridge', P.isolateDist,   P.baseGap * 1.1,  0.40, [w('bridge', 1)], 'bridge'),
    zone('TEACH', 'Yokai',       P.isolateDist,   P.baseGap,        0.45, [w('enemyPoke', 1)], 'enemyPoke'),
    rest(),
  ];
}

function pickN(arr, n) {
  const pool = arr.slice();
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

// Act 2. Alternate REST (low stakes) ↔ PEAK (high stakes), escalating each cycle.
function nextRhythmZone(d) {
  const P = PACING;

  if (d.lastKind !== 'REST') {
    d.lastKind = 'REST';
    const restDist = Math.max(400, P.restDist - d.cycle * 30); // pauses shrink as the run heats up
    return zone('REST', 'Breather', restDist, P.baseGap * 1.3, 0.1, [w('coins', 1)], null);
  }

  // PEAK: count the cycle, derive escalation, choose a theme.
  d.cycle += 1;
  d.lastKind = 'PEAK';
  if (d.cycle >= P.swarmUnlockCycle) d.taught.enemySwarm = true; // late-unlocking stress element

  const esc = Math.min(1, d.cycle * P.escalation);
  const dur = P.peakDist + esc * 700;                              // peaks grow
  const gap = P.baseGap - (P.baseGap - P.tightGap) * esc;          // and tighten
  const vocab = Object.keys(d.taught).filter(id => d.taught[id]);

  // FLOOD: one element, dense — "combine an element with itself" until it
  // overwhelms (the dense bamboo forest, the swarm of yokai).
  if (Math.random() < 0.5) {
    const stress = ['bamboo', 'spikes', 'enemySwarm'].filter(id => d.taught[id]);
    const pick = stress[Math.floor(Math.random() * stress.length)] || 'bamboo';
    return zone('FLOOD', 'Onslaught', dur, gap, 0.6 + 0.35 * esc, [w(pick, 1)], null);
  }

  // COMBO: 2–3 taught elements woven together, a reward trickle threaded through.
  const combo = pickN(vocab.filter(id => id !== 'coins'), 2 + (Math.random() < 0.5 ? 1 : 0));
  const recipe = combo.map(id => w(id, 1));
  recipe.push(w('coins', 0.4));
  return zone('COMBO', 'Gauntlet', dur, gap, 0.55 + 0.4 * esc, recipe, null);
}

export const RunDirector = {
  // Lazy one-time init (the prototype state is a flat ref with no reset hook).
  // Tolerate a missing director (e.g. an HMR-preserved ref that predates it).
  ensureInit(s) {
    if (!s.director) s.director = { initialized: false };
    if (s.director.initialized) return;
    s.director.initialized = true;
    s.director.taught = {};
    s.director.queue = buildTeachQueue();
    s.director.cycle = 0;
    s.director.lastKind = null;
    s.director.intensity = 0;
    this.advance(s);
  },

  // Hand the executor the next zone: drain the teach queue first, then generate.
  advance(s) {
    const d = s.director;
    const z = d.queue.length ? d.queue.shift() : nextRhythmZone(d);
    if (z.teaches) d.taught[z.teaches] = true;
    z._beat = 0;
    d.zone = z;
    d.zoneStartDist = s.distance;
    s.elementTimer = 0; // fresh beat clock so the new zone starts on the beat
  },

  tick(s, dt) {
    this.ensureInit(s);
    const d = s.director;
    if (!d.zone) { this.advance(s); return; } // e.g. cleared by a biome transition

    // Smooth intensity toward the active zone (feed feel/feedback later: music,
    // vignette, camera. Cheap to keep live; no renderer consumes it yet).
    d.intensity += ((d.zone.intensity || 0) - d.intensity) * 0.05;

    if (s.distance - d.zoneStartDist >= d.zone.durationDist) this.advance(s);
  }
};
