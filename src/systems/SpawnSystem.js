import { GROUND_HEIGHT, getBiomeName } from '../config/constants.js';

export const SpawnSystem = {
  createScenery(xOffset, canvasWidth, canvasHeight, isDistant = false, biomeName = 'bamboo') {
    let type = 'mountain';

    if (biomeName === 'village') {
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

  // Ambient world dressing only — gameplay obstacles/coins are owned by
  // ElementDirector. This just paints biome particles + foreground parallax.
  tick(state, dt, canvasWidth, canvasHeight) {
    const s = state;
    if (s.boss.active) return; // Halt during boss fights

    const biomeName = getBiomeName(s.biomeIndex);

    s.spawnTimer += dt;
    if (s.spawnTimer > 100) {
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
      }
    }

    s.fgTimer += dt;
    if (s.fgTimer > 150) {
      s.fgTimer = 0;
      if (Math.random() > 0.3) {
        let fgType = 'tree';
        if (biomeName === 'village') fgType = Math.random() > 0.6 ? 'lantern' : 'torii_fg';
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
