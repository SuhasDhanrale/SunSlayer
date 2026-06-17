import { GROUND_HEIGHT, COIN_CONFIG } from '../config/constants.js';

// Coin pickups are an "element" (spawned by ElementDirector, not on their own
// timer). Collected by brushing the blade across them (see CombatSystem); moved
// by PhysicsSystem. Placeholder art.
export const CoinSystem = {
  // A standalone reward cluster in one of three sweepable shapes.
  spawnCluster(s, canvasWidth, canvasHeight) {
    const groundY = canvasHeight - GROUND_HEIGHT;
    const baseX = canvasWidth + 60;
    const baseY = groundY - (160 + Math.random() * 240); // mid-air, blade height
    const spacing = 46;
    const count = 5 + Math.floor(Math.random() * 4); // 5–8 coins
    const pattern = Math.floor(Math.random() * 3);   // 0 trail, 1 zigzag, 2 arc
    const slope = (Math.random() - 0.5) * 30;        // per-cluster tilt for trails

    for (let i = 0; i < count; i++) {
      let y = baseY;
      if (pattern === 0) y = baseY + i * slope * 0.3;                  // gentle diagonal
      else if (pattern === 1) y = baseY + (i % 2 === 0 ? 0 : -64);     // zigzag
      else y = baseY - Math.sin((i / (count - 1)) * Math.PI) * 130;    // arc
      this.add(s, baseX + i * spacing, y);
    }
  },

  // A straight horizontal trail at a fixed height — used to ride an obstacle's
  // sweep (e.g. coins sitting just above a spike row).
  spawnLine(s, startX, y, count, spacing) {
    for (let i = 0; i < count; i++) this.add(s, startX + i * spacing, y);
  },

  add(s, x, y) {
    s.coins.push({ id: Math.random(), x, y, r: COIN_CONFIG.radius, bob: Math.random() * Math.PI * 2 });
  }
};
