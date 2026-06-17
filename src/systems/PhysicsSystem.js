import { SpawnSystem } from './SpawnSystem.js';
import { STUMBLE, getBiomeName } from '../config/constants.js';

export const PhysicsSystem = {
  tick(state, dt, unscaledDt, canvasWidth, canvasHeight, time) {
    const s = state;

    // Bamboo / obstacle movement & monk pushing
    for (let i = s.bamboo.length - 1; i >= 0; i--) {
      const b = s.bamboo[i];

      b.x -= s.cameraSpeed * dt;

      const isSetpiece = b.type === 'bridge' || b.type === 'boulder';
      if (isSetpiece) {
        if (b.state === 'resolved') {
          // Play out the resolution; a cut boulder rolls forward off-screen.
          b.reactT += dt;
          if (b.type === 'boulder') { b.x -= 6 * dt; b.rot += 0.16 * dt; }
        } else if (!b.stumbled && Math.abs(b.x - s.monk.x) < b.width / 2 + 18) {
          // Armed hazard reached the monk un-resolved → a heavy one-time trip.
          b.stumbled = true;
          s.stumble.count += 1;
          s.stumble.slowTimer = STUMBLE.slowDuration * 1.5;
          s.shake = 14;
        }
      } else {
        // An un-sliced stalk makes the monk STUMBLE — slows down, feeds the ronin.
        if (Math.abs(b.x - s.monk.x) < (b.width / 2 + 18) && s.monk.y > b.y) {
          s.monk.x -= (s.cameraSpeed + 3) * dt;
          if (!b.stumbled) {
            b.stumbled = true;
            s.stumble.count += 1;
            s.stumble.slowTimer = STUMBLE.slowDuration;
          }
        }
      }

      const cullX = isSetpiece ? -(b.width + 150) : -100;
      if (b.x < cullX || b.y > canvasHeight + 100) {
        s.bamboo.splice(i, 1);
        continue;
      }
    }

    // Coins scroll with the world.
    for (let i = s.coins.length - 1; i >= 0; i--) {
      const c = s.coins[i];
      c.x -= s.cameraSpeed * dt;
      if (c.x < -60) s.coins.splice(i, 1);
    }

    // Debris Physics
    for (let i = s.debris.length - 1; i >= 0; i--) {
      const d = s.debris[i];
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.type === 'stalk') { d.vy += 0.5 * dt; d.rot += d.rv * dt; } 
      else if (d.type === 'ink') { d.vy += 0.2 * dt; } 
      else if (d.type === 'leaf') { d.vy += 0.05 * dt; d.x += Math.sin(time * 0.005 + d.y) * 2 * dt; }
      else if (d.type === 'ember') { d.x += Math.sin(time * 0.003 + d.y) * 2 * dt; d.vy -= 0.02 * dt; } 
      else if (d.type === 'ash') { d.x += Math.sin(time * 0.002 + d.y) * 1 * dt; d.vy -= 0.01 * dt; }
      d.life -= 0.02 * dt;
      if (d.life <= 0 || d.y > canvasHeight) s.debris.splice(i, 1);
    }

    // Parallax Scenery
    s.scenery.forEach(m => {
      m.x -= (s.cameraSpeed * m.parallax) * dt;
      if (m.x + m.width < -100) {
        Object.assign(m, SpawnSystem.createScenery(canvasWidth + Math.random() * 200, canvasWidth, canvasHeight, m.isDistant, getBiomeName(s.biomeIndex)));
      }
    });

    // Foreground Parallax
    for (let i = s.foreground.length - 1; i >= 0; i--) {
      const fg = s.foreground[i];
      fg.x -= (s.cameraSpeed * fg.parallax) * dt;
      if (fg.x < -200) s.foreground.splice(i, 1);
    }

    // Shake & Flash decay
    if (s.shake > 0) {
      s.shake *= 0.85;
      if (s.shake < 0.5) s.shake = 0;
    }
    if (s.flashHit > 0) {
      s.flashHit -= 0.05 * (unscaledDt); 
    }
  }
};
