import { GROUND_HEIGHT, DEMON_CONFIG, STUMBLE } from '../config/constants.js';

const distSq = (ax, ay, bx, by) => (bx - ax) ** 2 + (by - ay) ** 2;

// Fruit-Ninja style yokai. Two launch styles so they read like the mock:
//  - 'ground': flung up from the ground in an arc
//  - 'right' : glide in from the right edge, drifting across the screen
// They are NOT aimed at the monk, but an un-sliced demon that drifts into him
// makes him stumble — feeding the same ronin-ambush counter as bamboo. Sliced in
// CombatSystem. Placeholder art for now.
export const DemonSystem = {
  // Fruit-Ninja style: flung up in an arc from a VARIED x — from close to the
  // monk out to the far right — so the player's blade has to roam the screen to
  // catch them instead of camping at one edge. Sliced in CombatSystem.
  spawn(s, canvasWidth, canvasHeight) {
    const groundY = canvasHeight - GROUND_HEIGHT;
    const radius = DEMON_CONFIG.radius * (0.85 + Math.random() * 0.4);
    const speedX = DEMON_CONFIG.minSpeedX + Math.random() * (DEMON_CONFIG.maxSpeedX - DEMON_CONFIG.minSpeedX);
    const speedY = DEMON_CONFIG.minSpeedY + Math.random() * (DEMON_CONFIG.maxSpeedY - DEMON_CONFIG.minSpeedY);

    s.demons.push({
      id: Math.random(),
      x: s.monk.x + 200 + Math.random() * (canvasWidth - s.monk.x - 250),
      y: groundY,
      vx: -speedX,
      vy: -speedY,
      radius,
      rot: 0,
      rv: (Math.random() - 0.5) * 0.1,
      stumbled: false,
      sliced: false
    });
  },

  // A burst of `count` demons — the ElementDirector spawns these as a woven
  // "enemy wave" element (small pokes, occasional swarms).
  spawnWave(s, canvasWidth, canvasHeight, count) {
    for (let i = 0; i < count; i++) this.spawn(s, canvasWidth, canvasHeight);
  },

  // Movement + combo decay only. Spawning is owned by ElementDirector now, so
  // this runs every frame regardless of what else is on screen.
  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    for (let i = s.demons.length - 1; i >= 0; i--) {
      const d = s.demons[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += DEMON_CONFIG.gravity * dt; // arc back down
      d.rot += d.rv * dt;

      // Arced into the monk un-sliced → stumble (same counter that calls the ronin).
      if (!d.stumbled && distSq(d.x, d.y, s.monk.x, s.monk.y - 20) < (d.radius + 25) ** 2) {
        d.stumbled = true;
        s.stumble.count += 1;
        s.stumble.slowTimer = STUMBLE.slowDuration;
        s.shake = 12;
        s.demons.splice(i, 1);
        continue;
      }

      if (d.y > canvasHeight + 120 || d.x < -120) s.demons.splice(i, 1);
    }

    // Combo decays once the window lapses with no fresh slice.
    if (s.comboTimer > 0) {
      s.comboTimer -= unscaledDt;
      if (s.comboTimer <= 0) s.combo = 0;
    }
  }
};
