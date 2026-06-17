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
export const BOSS_CONFIG = config.bosses || { archer: { triggerDistance: 3000, respawnGap: 4500 }, ronin: { triggerDistance: 5000, hp: 15, respawnGap: 7500 } };

export const getBiome = (dist) => {
  // Volcano ('Mt. Doom') biome removed — it was just a red tint with no gameplay.
  const index = Math.floor(dist / BIOME_LENGTH) % 3;
  switch(index) {
    case 0: return 'bamboo';
    case 1: return 'village';
    case 2: return 'rain';
    default: return 'bamboo';
  }
};
