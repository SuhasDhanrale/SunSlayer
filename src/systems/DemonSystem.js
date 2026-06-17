import { GROUND_HEIGHT, DEMON_CONFIG, STUMBLE } from '../config/constants.js';

const distSq = (ax, ay, bx, by) => (bx - ax) ** 2 + (by - ay) ** 2;

// Fruit-Ninja style yokai. Two launch styles so they read like the mock:
//  - 'ground': flung up from the ground in an arc
//  - 'right' : glide in from the right edge, drifting across the screen
// They are NOT aimed at the monk, but an un-sliced demon that drifts into him
// makes him stumble — feeding the same ronin-ambush counter as bamboo. Sliced in
// CombatSystem. Placeholder art for now.
export const DemonSystem = {
  spawn(s, canvasWidth, canvasHeight) {
    const groundY = canvasHeight - GROUND_HEIGHT;
    const speedX = DEMON_CONFIG.minSpeedX + Math.random() * (DEMON_CONFIG.maxSpeedX - DEMON_CONFIG.minSpeedX);
    const radius = DEMON_CONFIG.radius * (0.85 + Math.random() * 0.4);

    const fromRight = Math.random() < 0.5;
    let demon;
    if (fromRight) {
      // Drive in from the right edge with real force so it crosses the screen
      // toward the player and arcs, rather than petering out near the edge.
      demon = {
        x: canvasWidth + radius,
        y: groundY - (90 + Math.random() * (canvasHeight * 0.45)),
        vx: -(speedX + 2),
        vy: -(4 + Math.random() * 6), // launched upward; gravity arcs it back down
      };
    } else {
      // Flung up from the ground somewhere on the right half.
      demon = {
        x: canvasWidth * (0.45 + Math.random() * 0.5),
        y: groundY,
        vx: -speedX,
        vy: -(DEMON_CONFIG.minSpeedY + Math.random() * (DEMON_CONFIG.maxSpeedY - DEMON_CONFIG.minSpeedY)),
      };
    }

    s.demons.push({
      id: Math.random(),
      ...demon,
      radius,
      rot: 0,
      rv: (Math.random() - 0.5) * 0.1,
      stumbled: false,
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

      // Drifted into the monk un-sliced → stumble (same counter that calls the ronin).
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
