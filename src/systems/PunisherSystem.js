import { STUMBLE, PUNISHERS } from '../config/constants.js';

// ──────────────────────────────────────────────────────────────────────────
// PUNISHERS — the biome "you stumbled, now pay" chaser, ported in spirit from
// the playtest mocks (CaveBiomeMock's spider, WaterBiomeMock's demon carp). A
// stumble spawns ONE chaser for the active biome; it homes the monk's lane and
// closes in. SLASH it to dispel (CombatSystem). If it reaches the monk it's a
// heavy stumble (forgiving — not a kill) and it's spent. Movement lives here;
// the blade math lives in CombatSystem; the art lives in GameRenderer.
//   cave  → spider, scuttles up from BEHIND (off the left edge)
//   water → carp,  surges in from AHEAD (the right edge)
// ──────────────────────────────────────────────────────────────────────────
export const PunisherSystem = {
  tick(s, dt, unscaledDt, w, h, handleGameOver) {
    const biome = s.playerBiome || s.biome;
    const kind = biome === 'cave' ? 'spider' : (biome === 'water' ? 'carp' : null);

    // One chaser per fresh stumble, only while none is on screen and no boss.
    if (kind && !s.boss.active && s.punishers.length === 0 && s.stumble.count > s.punisherLastStumble) {
      s.punishers.push({
        kind,
        x: kind === 'spider' ? s.monk.x - PUNISHERS.spawnBehind : w + 80,
        y: s.monk.y,
        radius: kind === 'spider' ? 24 : 28,
        legTimer: 0,
        cut: false,
        vy: 0,
      });
    }

    const chase = PUNISHERS.chaseSpeed;
    for (let i = s.punishers.length - 1; i >= 0; i--) {
      const pu = s.punishers[i];

      if (pu.cut) {
        // Dispelled: tumble away off the bottom.
        pu.vy += 0.6 * dt;
        pu.y += pu.vy * dt;
        pu.x -= s.cameraSpeed * dt;
        if (pu.y > h + 120 || pu.x < -120) s.punishers.splice(i, 1);
        continue;
      }

      pu.legTimer += 0.2 * dt;
      pu.y += (s.monk.y - pu.y) * 0.1 * dt;                  // home onto the lane
      pu.x += (pu.kind === 'spider' ? chase : -chase) * dt;   // close from behind / ahead

      // Caught the monk → a heavy stumble, then the chaser is spent.
      if (Math.abs(pu.x - s.monk.x) < PUNISHERS.contactDist) {
        s.stumble.count += 1;
        s.stumble.slowTimer = STUMBLE.slowDuration * 1.5;
        s.shake = Math.max(s.shake, 16);
        s.flashHit = 0.4; s.flashColor = '185, 28, 28';
        s.monk.x -= (s.cameraSpeed + 4) * dt;
        s.punishers.splice(i, 1);
        continue;
      }

      // A chaser that somehow overshoots past the monk (carp off the left, spider
      // off the right) just scuttles off-screen instead of lingering forever.
      if (pu.x < -120 || pu.x > w + 200) s.punishers.splice(i, 1);
    }

    // Consume any stumbles raised this frame so contact doesn't instantly respawn.
    s.punisherLastStumble = s.stumble.count;
  }
};
