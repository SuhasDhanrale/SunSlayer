import { GROUND_HEIGHT, YOKAI_WOVEN } from '../config/constants.js';
import { placeObstacle, placeSetpiece, placeStalactite, placeTnt, placeArrowBall } from './ElementDirector.js';
import { CoinSystem } from './CoinSystem.js';
import { DemonSystem } from './DemonSystem.js';
import { STEP_PX } from '../data/patterns.js';
import { countActiveYokai } from '../data/yokai.js';

const ROWS = ['H', 'A', 'M', 'L', 'G'];
const YOKAI_ROWS = ['H', 'A', 'M', 'L'];
const YOKAI_EXCLUSIVE = new Set(['a', '=', 'K', 'x']);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (value) => Math.max(0, Math.min(1, value));

function bandY(row, h) {
  const groundY = h - GROUND_HEIGHT;
  switch (row) {
    case 'H': return groundY * 0.15;
    case 'A': return groundY * 0.42;
    case 'M': return groundY * 0.64;
    case 'L': return groundY - 80;
    default: return groundY;
  }
}

export function parsePatternGrid(art) {
  const lines = art.split('\n').map((line) => line.trim()).filter(Boolean);
  const rowCells = {};
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
    const column = [];
    for (const row of ROWS) {
      const sym = rowCells[row]?.[c];
      if (sym && sym !== '.') column.push({ sym, row });
    }
    columns.push(column);
  }
  return columns;
}

function pickMix(mix, random) {
  let total = 0;
  for (const key in mix) total += mix[key];
  let roll = random() * total;
  for (const key in mix) {
    roll -= mix[key];
    if (roll <= 0) return key;
  }
  return Object.keys(mix)[0];
}

function generateField(pattern, intensity, random) {
  const density = lerp(pattern.density[0], pattern.density[1], intensity);
  const jitterRow = (base) => {
    if (!pattern.jitter) return base;
    const index = ROWS.indexOf(base);
    const offset = Math.floor(random() * (pattern.jitter * 2 + 1)) - pattern.jitter;
    return ROWS[Math.max(0, Math.min(ROWS.length - 1, index + offset))];
  };
  return Array.from({ length: pattern.length }, () => {
    if (random() >= density) return [];
    return [{ sym: pickMix(pattern.mix, random), row: jitterRow(pattern.band) }];
  });
}

function canAddYokai(column) {
  return !column.some((cell) => YOKAI_EXCLUSIVE.has(cell.sym));
}

function emptyYokaiRows(column) {
  const occupied = new Set(column.map((cell) => cell.row));
  return YOKAI_ROWS.filter((row) => !occupied.has(row));
}

export function injectWovenYokai(columns, context = {}) {
  const random = context.random || Math.random;
  const probability = Math.min(YOKAI_WOVEN.maxChance, YOKAI_WOVEN.maxChance * clamp01(context.yokaiIntensity || 0));
  let injected = 0;
  if (!context.allowWoven || context.biome === 'water' || probability <= 0) return { columns, injected, probability };

  for (const column of columns) {
    // Exactly one probability roll per column. Row choice is a separate roll only
    // after the column passes and is known to be safe.
    if (random() >= probability || !canAddYokai(column)) continue;
    const emptyRows = emptyYokaiRows(column);
    if (!emptyRows.length) continue;
    const row = emptyRows[Math.floor(random() * emptyRows.length)];
    column.push({
      sym: 'x',
      row,
      yokai: { source: 'woven', typeIds: [...(context.typeIds || ['oni'])] },
    });
    injected += 1;
  }
  return { columns, injected, probability };
}

export function compilePattern(pattern, intensity = 0.5, context = {}) {
  const random = context.random || Math.random;
  const columns = pattern.kind === 'grid'
    ? parsePatternGrid(pattern.art)
    : generateField(pattern, intensity, random);

  for (const column of columns) {
    for (const cell of column) {
      if (cell.sym === 'x') {
        cell.yokai = {
          source: pattern.yokaiOnly ? 'swarm' : 'authored',
          typeIds: [...(pattern.yokaiTypes || context.typeIds || ['oni'])],
        };
      }
    }
  }

  const result = injectWovenYokai(columns, context);
  return {
    id: pattern.id,
    category: pattern.category,
    columns: result.columns,
    stepPx: pattern.stepPx || STEP_PX,
    cap: Math.min(pattern.cap ?? YOKAI_WOVEN.cap, YOKAI_WOVEN.cap),
    burst: pattern.burst || null,
    yokaiOnly: Boolean(pattern.yokaiOnly),
    once: Boolean(pattern.once),
    special: pattern.special || null,
    yokaiTypes: [...(pattern.yokaiTypes || context.typeIds || ['oni'])],
    injectedYokai: result.injected,
    injectionProbability: result.probability,
  };
}

function floorSpikeMarkerCoin(s, x, h) {
  CoinSystem.add(s, x, h - GROUND_HEIGHT - 130);
}

function suspendedSpikeMarkerCoin(s, x) {
  CoinSystem.add(s, x, 150);
}

function applyIntroDirective(s, pattern, column) {
  const track = s.yokaiTrack;
  const directive = track?.pendingDirective;
  if (!directive || (s.spawnBiome || s.biome) === 'water' || !canAddYokai(column)) return column;

  const rows = emptyYokaiRows(column);
  if (!rows.length) return column;
  const preferred = rows.includes(directive.row) ? directive.row : rows[0];
  const cell = {
    sym: 'x',
    row: preferred,
    yokai: {
      source: 'intro',
      typeIds: [...directive.typeIds],
      count: directive.count || 1,
      routes: directive.routes ? [...directive.routes] : undefined,
      route: directive.route,
    },
  };
  const nextColumn = directive.mode === 'isolated' ? [cell] : [...column, cell];

  track.pendingDirective = null;
  if (directive.scripted) track.introIndex += 1;
  if (directive.unlockAfter) {
    if (!track.unlockedTypes.includes(directive.unlockAfter)) track.unlockedTypes.push(directive.unlockAfter);
    track[`${directive.unlockAfter}Introduced`] = true;
  }
  track.stats.introEmitted.push({ id: directive.id, activeSec: track.activeSec });
  pattern.introDirectiveApplied = directive.id;
  return nextColumn;
}

function emitYokai(s, cell, pattern, w, h) {
  if ((s.spawnBiome || s.biome) === 'water') return;
  const metadata = cell.yokai || {};
  const random = metadata.random || Math.random;
  const want = metadata.count || (pattern.burst
    ? pattern.burst[0] + Math.floor(random() * (pattern.burst[1] - pattern.burst[0] + 1))
    : 1);
  const room = Math.max(0, Math.min(pattern.cap, YOKAI_WOVEN.cap) - countActiveYokai(s.demons));
  if (!room) return;
  DemonSystem.spawnWave(s, w, h, Math.min(want, room), {
    row: cell.row,
    route: metadata.route,
    routes: metadata.routes,
    typeIds: metadata.typeIds || pattern.yokaiTypes,
    source: metadata.source || (pattern.yokaiOnly ? 'swarm' : 'authored'),
    random,
  });
}

function emitCell(s, cell, x, w, h, pattern) {
  switch (cell.sym) {
    case 'o': CoinSystem.add(s, x, bandY(cell.row, h)); break;
    case 'i': placeObstacle(s, 'basic', x, h); break;
    case 'I': placeObstacle(s, 'thick', x, h); break;
    case 'v': placeObstacle(s, 'vine', x, h); break;
    case 's':
      placeObstacle(s, 'spike', x, h);
      floorSpikeMarkerCoin(s, x, h);
      break;
    case '=': placeSetpiece(s, 'bridge', x, h); break;
    case 'T':
      placeStalactite(s, x, h);
      suspendedSpikeMarkerCoin(s, x);
      break;
    case 'K': placeTnt(s, x, h); break;
    case 'a': placeArrowBall(s, x, h); break;
    case 'x': emitYokai(s, cell, pattern, w, h); break;
    default: break;
  }
}

export const PatternRunner = {
  start(s, compiled) {
    s.pattern = { ...compiled, idx: 0, acc: compiled.stepPx, done: false };
  },

  tick(s, dt, w, h) {
    const pattern = s.pattern;
    if (!pattern || pattern.done) return true;
    pattern.acc += s.cameraSpeed * dt;
    while (pattern.acc >= pattern.stepPx && !pattern.done) {
      pattern.acc -= pattern.stepPx;
      let column = pattern.columns[pattern.idx] || [];
      column = applyIntroDirective(s, pattern, column);
      for (const cell of column) emitCell(s, cell, w + 80, w, h, pattern);
      pattern.idx += 1;
      if (pattern.idx >= pattern.columns.length) pattern.done = true;
    }
    return pattern.done;
  },
};
