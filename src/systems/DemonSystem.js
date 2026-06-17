import { GROUND_HEIGHT, DEMON_CONFIG } from '../config/constants.js';

// Fruit-Ninja style yokai: launched in an arc from the right, sliced mid-air by
// the player's swipe (slicing handled in CombatSystem). Placeholder art for now.
export const DemonSystem = {
  spawn(s, canvasWidth, canvasHeight) {
    const groundY = canvasHeight - GROUND_HEIGHT;
    s.demons.push({
      id: Math.random(),
      x: canvasWidth * (0.5 + Math.random() * 0.45),
      y: groundY,
      vx: -(DEMON_CONFIG.minSpeedX + Math.random() * (DEMON_CONFIG.maxSpeedX - DEMON_CONFIG.minSpeedX)),
      vy: -(DEMON_CONFIG.minSpeedY + Math.random() * (DEMON_CONFIG.maxSpeedY - DEMON_CONFIG.minSpeedY)),
      radius: DEMON_CONFIG.radius * (0.85 + Math.random() * 0.4),
      rot: 0,
      rv: (Math.random() - 0.5) * 0.1,
      sliced: false
    });
  },

  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    s.demonTimer += dt;
    if (s.demonTimer > DEMON_CONFIG.spawnRate) {
      this.spawn(s, canvasWidth, canvasHeight);
      s.demonTimer = 0;
    }

    for (let i = s.demons.length - 1; i >= 0; i--) {
      const d = s.demons[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += DEMON_CONFIG.gravity * dt;
      d.rot += d.rv * dt;
      if (d.y > canvasHeight + 120 || d.x < -120) s.demons.splice(i, 1);
    }

    // Combo decays once the window lapses with no fresh slice.
    if (s.comboTimer > 0) {
      s.comboTimer -= unscaledDt;
      if (s.comboTimer <= 0) s.combo = 0;
    }
  }
};
