import { GROUND_HEIGHT, COIN_CONFIG } from '../config/constants.js';

// Bamboo-phase-only coin pickups, spawned in sweepable clusters (trail, zigzag,
// arc) that drift in from the right. Collected by brushing the blade across them
// (see CombatSystem). Replaces the old undodgeable bomb. Placeholder art.
export const CoinSystem = {
  spawnCluster(s, canvasWidth, canvasHeight) {
    const groundY = canvasHeight - GROUND_HEIGHT;
    const baseX = canvasWidth + 60;
    const baseY = groundY - (160 + Math.random() * 240); // mid-air, blade height
    const spacing = 46;
    const count = 5 + Math.floor(Math.random() * 4); // 5–8 coins
    const pattern = Math.floor(Math.random() * 3);   // 0 trail, 1 zigzag, 2 arc
    const slope = (Math.random() - 0.5) * 30;        // per-cluster tilt for trails
    const r = COIN_CONFIG.radius;

    for (let i = 0; i < count; i++) {
      const x = baseX + i * spacing;
      let y = baseY;
      if (pattern === 0) {
        y = baseY + i * slope * 0.3;                  // gentle diagonal trail
      } else if (pattern === 1) {
        y = baseY + (i % 2 === 0 ? 0 : -64);          // zigzag
      } else {
        y = baseY - Math.sin((i / (count - 1)) * Math.PI) * 130; // arc
      }
      s.coins.push({ id: Math.random(), x, y, r, bob: Math.random() * Math.PI * 2 });
    }
  },

  tick(s, dt, canvasWidth, canvasHeight) {
    s.coinTimer += dt;
    if (s.coinTimer > COIN_CONFIG.spawnRate) {
      this.spawnCluster(s, canvasWidth, canvasHeight);
      s.coinTimer = 0;
    }

    for (let i = s.coins.length - 1; i >= 0; i--) {
      const c = s.coins[i];
      c.x -= s.cameraSpeed * dt;
      if (c.x < -60) s.coins.splice(i, 1);
    }
  }
};
