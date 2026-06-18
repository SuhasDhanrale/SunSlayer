import { GROUND_HEIGHT, COIN_REWARD } from '../config/constants.js';
import { placeObstacle, placeSetpiece } from './ElementDirector.js';
import { CoinSystem } from './CoinSystem.js';
import { DemonSystem } from './DemonSystem.js';
import { STEP_PX } from '../data/patterns.js';

// ─────────────────────────────────────────────────────────────────────────────
// Plays ONE pattern. A pattern (grid or field) compiles to a list of COLUMNS;
// each column is a set of {sym,row} cells. The runner walks a distance cursor and
// emits the next column every STEP_PX of travel, at the right edge — so cells in
// the same column arrive vertically aligned, and columns are evenly spaced as the
// world scrolls. Grids and fields are identical to the runner once compiled.
// ─────────────────────────────────────────────────────────────────────────────

const ROWS = ['H', 'A', 'M', 'L', 'G'];

// Where a row sits vertically (used for height-flexible cells: coins, enemy hint).
// Band-locked elements (spike/vine/setpieces) derive their own Y from their type.
function bandY(row, h) {
  const groundY = h - GROUND_HEIGHT;
  switch (row) {
    case 'H': return groundY * 0.15;
    case 'A': return groundY * 0.42;
    case 'M': return groundY * 0.64;
    case 'L': return groundY - 80;
    default:  return groundY; // G
  }
}

// Parse a grid art string into columns: [ [{sym,row},…], … ].
function parseGrid(art) {
  const lines = art.split('\n').map((l) => l.trim()).filter(Boolean);
  const rowCells = {};       // row label → array of symbols
  let width = 0;
  for (const line of lines) {
    const tokens = line.split(/\s+/);
    const label = tokens[0];
    if (!ROWS.includes(label)) continue;
    rowCells[label] = tokens.slice(1);
    width = Math.max(width, rowCells[label].length);
  }
  const columns = [];
  for (let c = 0; c < width; c++) {
    const col = [];
    for (const row of ROWS) {
      const sym = rowCells[row]?.[c];
      if (sym && sym !== '.') col.push({ sym, row });
    }
    columns.push(col);
  }
  return columns;
}

const lerp = (a, b, t) => a + (b - a) * t;

// Pick a symbol from a weighted mix bag ({ i: 0.8, I: 0.2 }).
function pickMix(mix) {
  let total = 0;
  for (const k in mix) total += mix[k];
  let r = Math.random() * total;
  for (const k in mix) { r -= mix[k]; if (r <= 0) return k; }
  return Object.keys(mix)[0];
}

// Generate field columns at a given intensity (0..1). Re-rolled each playthrough.
function generateField(p, intensity) {
  const density = lerp(p.density[0], p.density[1], intensity);
  const jitterRows = (base) => {
    if (!p.jitter) return base;
    const i = ROWS.indexOf(base);
    const j = Math.max(0, Math.min(ROWS.length - 1, i + (Math.floor(Math.random() * (p.jitter * 2 + 1)) - p.jitter)));
    return ROWS[j];
  };
  const columns = [];
  for (let c = 0; c < p.length; c++) {
    const col = [];
    if (Math.random() < density) col.push({ sym: pickMix(p.mix), row: jitterRows(p.band) });
    columns.push(col);
  }
  return columns;
}

export function compilePattern(p, intensity = 0.5) {
  const columns = p.kind === 'grid' ? parseGrid(p.art) : generateField(p, intensity);
  return {
    id: p.id, category: p.category, columns,
    stepPx: p.stepPx || STEP_PX, cap: p.cap || Infinity,
    burst: p.burst || null, // [min,max] yokai per `x` (fruit-ninja flurries); null = single
  };
}

// A small coin arc cresting OVER a spike — the reward for committing to the low
// sweep. Coins are contextual here (tied to the hazard), not authored in the grid.
function spikeCoins(s, x, h) {
  const groundY = h - GROUND_HEIGHT;
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    CoinSystem.add(s, x - 56 + t * 112, groundY - 120 - Math.sin(t * Math.PI) * 80);
  }
}

// Place one cell at world-x `x`.
function emitCell(s, cell, x, w, h, cap, burst) {
  switch (cell.sym) {
    case 'o': CoinSystem.add(s, x, bandY(cell.row, h)); break;
    case 'i': placeObstacle(s, 'basic', x, h); break;
    case 'I': placeObstacle(s, 'thick', x, h); break;
    case 'v': placeObstacle(s, 'vine', x, h); break;
    case 's':
      placeObstacle(s, 'spike', x, h);
      if (Math.random() < COIN_REWARD.spikeChance) spikeCoins(s, x, h); // coins over the spike
      break;
    case '=': placeSetpiece(s, 'bridge', x, h); break;
    case 'O': placeSetpiece(s, 'boulder', x, h); break;
    case 'x': {
      // One yokai by default; a `burst` pattern pops a random handful at once
      // (scattered across the screen) for fruit-ninja chaos — capped for fairness.
      const want = burst ? burst[0] + Math.floor(Math.random() * (burst[1] - burst[0] + 1)) : 1;
      DemonSystem.spawnWave(s, w, h, Math.max(0, Math.min(want, cap - s.demons.length)));
      break;
    }
    default: break;
  }
}

export const PatternRunner = {
  // Begin playing a compiled pattern.
  start(s, compiled) {
    s.pattern = { ...compiled, idx: 0, acc: compiled.stepPx, done: false };
    // acc seeded to stepPx so the first column emits immediately on the first tick.
  },

  // Advance the distance cursor and emit columns. Returns true when finished.
  tick(s, dt, w, h) {
    const pat = s.pattern;
    if (!pat || pat.done) return true;
    pat.acc += s.cameraSpeed * dt;
    while (pat.acc >= pat.stepPx && !pat.done) {
      pat.acc -= pat.stepPx;
      const col = pat.columns[pat.idx];
      if (col) for (const cell of col) emitCell(s, cell, w + 80, w, h, pat.cap, pat.burst);
      pat.idx += 1;
      if (pat.idx >= pat.columns.length) pat.done = true;
    }
    return pat.done;
  }
};
