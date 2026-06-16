import { GROUND_HEIGHT, getBiome } from '../config/constants.js';

export const SpawnSystem = {
  createScenery(xOffset, canvasWidth, canvasHeight, isDistant = false, currentDist = 0) {
    const inVillage = getBiome(currentDist);
    let type = 'mountain';

    if (inVillage) {
      const rand = Math.random();
      if (!isDistant) {
        if (rand > 0.75) type = 'pagoda';
        else if (rand > 0.5) type = 'torii';
        else type = 'house';
      } else {
        if (rand > 0.6) type = 'mountain';
        else if (rand > 0.4) type = 'torii';
        else type = 'house';
      }
    }

    return {
      type: type,
      x: xOffset,
      y: canvasHeight - GROUND_HEIGHT,
      width: type === 'pagoda' ? 140 + Math.random() * 60 : (isDistant ? 500 + Math.random() * 400 : 250 + Math.random() * 300),
      height: type === 'pagoda' ? 300 + Math.random() * 150 : (isDistant ? 200 + Math.random() * 150 : 120 + Math.random() * 150),
      parallax: isDistant ? 0.05 + Math.random() * 0.05 : 0.15 + Math.random() * 0.1,
      isDistant: isDistant
    };
  },

  spawnBamboo(state, canvasWidth, canvasHeight) {
    const rand = Math.random();
    let type = 'basic';
    
    if (rand > 0.95) type = 'bomb'; // Falling debris! 5% chance
    else if (rand > 0.85) type = 'fruit'; // Bouncing target! 10% chance
    else if (rand > 0.7) type = 'thick';
    else if (rand > 0.55) type = 'vertical';
    else if (rand > 0.4) type = 'horizontal';

    const width = type === 'thick' ? 24 : 14;
    
    if (type === 'fruit') {
      state.bamboo.push({
        id: Math.random(),
        type: 'fruit',
        x: canvasWidth + 150, // Spawn offscreen right
        y: canvasHeight - GROUND_HEIGHT, // Starts at ground
        vx: -6 - Math.random() * 4, // Moving left
        vy: -15 - Math.random() * 10, // Bouncing up
        width: 30,
        height: 30, 
        hp: 1,
        hitCooldown: 0,
        swayOffset: 0
      });
    } else if (type === 'bomb') {
      state.bamboo.push({
        id: Math.random(),
        type: 'bomb',
        x: canvasWidth * 0.4 + Math.random() * (canvasWidth * 0.4), // Spawn somewhere in middle-right sky
        y: -50, // Falling from top
        vx: -s.cameraSpeed, // Moves with camera
        vy: 5 + Math.random() * 5, // Falling down
        width: 40,
        height: 40, 
        hp: 1,
        hitCooldown: 0,
        swayOffset: 0
      });
    } else {
      state.bamboo.push({
        id: Math.random(),
        type: type,
        x: canvasWidth + 50,
        y: canvasHeight - GROUND_HEIGHT - (120 + Math.random() * 80), 
        width: width,
        height: 250, 
        hp: type === 'thick' ? 3 : 1,
        hitCooldown: 0,
        swayOffset: Math.random() * Math.PI * 2
      });
    }
  },

  tick(state, dt, canvasWidth, canvasHeight) {
    const s = state;
    if (s.boss.active) return; // Halt spawning during boss fights

    const biomeName = getBiome(s.distance);

    s.spawnTimer += dt;
    const currentSpawnRate = Math.max(40, 100 - (s.distance * 0.005));
    if (s.spawnTimer > currentSpawnRate) {
      this.spawnBamboo(s, canvasWidth, canvasHeight);
      s.spawnTimer = 0;
      
      // Environmental particle effects based on biome
      if (biomeName === 'village' && Math.random() > 0.4) {
         s.debris.push({ 
           x: canvasWidth + 50, 
           y: canvasHeight - GROUND_HEIGHT - 50 - Math.random() * 250, 
           vx: -3 - Math.random() * 3, 
           vy: -1 + Math.random() * 2, 
           life: 3 + Math.random() * 2, 
           type: 'ember' 
         });
      } else if (biomeName === 'rain' && Math.random() > 0.1) {
         s.debris.push({ 
           x: canvasWidth * Math.random(), 
           y: -10, 
           vx: -1, 
           vy: 15 + Math.random() * 10, 
           life: 1.0, 
           type: 'rain' 
         });
      } else if (biomeName === 'volcano' && Math.random() > 0.2) {
         s.debris.push({ 
           x: canvasWidth + 50, 
           y: canvasHeight - Math.random() * canvasHeight, 
           vx: -5 - Math.random() * 5, 
           vy: -2 + Math.random() * 4, 
           life: 2 + Math.random() * 2, 
           type: 'ash' 
         });
      }
    }

    s.fgTimer += dt;
    if (s.fgTimer > 150) {
      s.fgTimer = 0;
      if (Math.random() > 0.3) {
        let fgType = 'tree';
        if (biomeName === 'village') fgType = Math.random() > 0.6 ? 'lantern' : 'torii_fg';
        else if (biomeName === 'volcano') fgType = 'rock';
        else if (biomeName === 'rain') fgType = 'willow';

        s.foreground.push({
          x: canvasWidth + 100,
          type: fgType,
          parallax: 1.5 + Math.random() * 0.8
        });
      }
    }
  }
};
