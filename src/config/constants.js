import config from '../data/config.json';

export const PALETTE = {
  paper: '#f4f1ea',      
  ink: '#1c1917',        
  fadedInk: '#78716c',   
  lightInk: '#d6d3d1',   
  distantInk: '#e7e5e4', 
  crimson: '#b91c1c',    
  ground: '#0c0a09',
  warmGlow: '#fef08a',   
  mutedGlow: 'rgba(254, 240, 138, 0.4)', 
  emerald: '#059669', // Beautiful green for the monk's scarf
};

export const GROUND_HEIGHT = config.groundHeight || 100;
export const MONK_TARGET_X = config.monkTargetX || 150;
export const SLASH_THRESHOLD = config.slashThreshold || 15; 
export const BASE_SPEED = config.baseSpeed || 5.5;
export const MAX_FOCUS = config.maxFocus || 100;
export const BIOME_LENGTH = config.biomeLength || 2500;
export const SEGMENT_LENGTH = config.segmentLength || 2200;
export const SEGMENT_SECONDS = config.segmentSeconds || 120; // wall-clock-ish length of a segment before the biome changes
export const STUMBLE = config.stumble || { threshold: 3, slowFactor: 0.45, slowDuration: 70 };
export const DEMON_CONFIG = config.demons || { spawnRate: 70, minSpeedX: 4, maxSpeedX: 9, minSpeedY: 17, maxSpeedY: 25, gravity: 0.45, radius: 38, comboWindow: 90 };
export const COIN_CONFIG = config.coins || { spawnRate: 210, value: 25, radius: 14 };
export const BOSS_CONFIG = config.bosses || { archer: { triggerDistance: 3000, respawnGap: 4500 }, ronin: { triggerDistance: 5000, hp: 15, respawnGap: 7500 } };

// Biomes are now driven by an explicit segment index (advanced when an arrow
// volley is cleared), NOT by raw distance — so a ronin interrupt can add distance
// without changing biome. Volcano biome was removed (it was just a red tint).
export const BIOMES = ['bamboo', 'village', 'rain'];
export const getBiomeName = (index) => BIOMES[((index % BIOMES.length) + BIOMES.length) % BIOMES.length];

// Legacy distance-based lookup, kept for any caller not yet migrated to the index.
export const getBiome = (dist) => getBiomeName(Math.floor(dist / BIOME_LENGTH));
