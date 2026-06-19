import { PATTERNS, PATTERNS_BY_ID, OPENINGS, GAMEPLAY_BIOMES } from '../src/data/patterns.js';
import { BIOME_SCHEDULE } from '../src/data/biomeSchedule.js';
import { VISUAL_BIOMES } from '../src/renderer/BiomeBackgrounds.js';

const errors = [];
const gameplaySet = new Set(GAMEPLAY_BIOMES);
const visualSet = new Set(Object.keys(VISUAL_BIOMES));
const rowLabels = new Set(['H', 'A', 'M', 'L', 'G']);
const groundOnly = new Set(['i', 'I', 's', '=', 'O']);
const waterOnly = new Set(['m', 'n', 'R', 'B']);

function symbolsFor(pattern) {
  if (pattern.kind === 'field') return Object.keys(pattern.mix || {});
  if (pattern.kind !== 'grid') return [];

  const symbols = [];
  const lines = String(pattern.art || '').split('\n').map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const tokens = line.split(/\s+/);
    const [label, ...cells] = tokens;
    if (!rowLabels.has(label)) continue;
    for (const cell of cells) if (cell && cell !== '.') symbols.push(cell);
  }
  return symbols;
}

for (const pattern of PATTERNS) {
  if (!Array.isArray(pattern.biomes) || pattern.biomes.length === 0) {
    errors.push(`${pattern.id} must declare a non-empty biomes array`);
    continue;
  }

  if ('biome' in pattern) errors.push(`${pattern.id} still uses legacy biome`);

  for (const biome of pattern.biomes) {
    if (!gameplaySet.has(biome)) errors.push(`${pattern.id} has invalid gameplay biome ${biome}`);
  }

  const symbols = symbolsFor(pattern);
  if (pattern.biomes.includes('water')) {
    for (const sym of symbols) {
      if (groundOnly.has(sym)) errors.push(`${pattern.id} is water-owned but uses ground-only symbol ${sym}`);
    }
  }
  if (pattern.biomes.includes('cave')) {
    for (const sym of symbols) {
      if (waterOnly.has(sym)) errors.push(`${pattern.id} is cave-owned but uses water-only symbol ${sym}`);
    }
  }
}

for (const [biome, ids] of Object.entries(OPENINGS)) {
  if (!gameplaySet.has(biome)) errors.push(`OPENINGS has invalid gameplay biome ${biome}`);
  for (const id of ids) {
    if (!PATTERNS_BY_ID[id]) errors.push(`OPENINGS.${biome} references missing pattern ${id}`);
    else if (!PATTERNS_BY_ID[id].biomes.includes(biome)) {
      errors.push(`OPENINGS.${biome} references ${id}, which does not include biome ${biome}`);
    }
  }
}

for (const entry of BIOME_SCHEDULE) {
  if (!visualSet.has(entry.biome)) errors.push(`BIOME_SCHEDULE references missing visual biome ${entry.biome}`);
}

if (errors.length) {
  console.error('Pattern validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Pattern validation passed (${PATTERNS.length} patterns).`);
