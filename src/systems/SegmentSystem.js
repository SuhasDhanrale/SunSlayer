import { SEGMENT_SECONDS, PALETTE } from '../config/constants.js';
import { BossSystem } from './BossSystem.js';
import { SamuraiSystem } from './SamuraiSystem.js';

// Orchestrates encounter pressure in one continuous run. Biome progression is
// owned by BiomeSystem; this system schedules the archer volley. The escalating
// samurai (the stumble-driven pursuer) lives in SamuraiSystem; here we only
// react when its kill-duel resolves.
export const SegmentSystem = {
  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    // React to an encounter that just finished (BossSystem sets finishedRole).
    if (!s.boss.active && s.boss.finishedRole) {
      if (s.boss.finishedRole === 'transition') {
        s.segmentTime = 0;
        s.arrowCluster = null;
        // Archer volley finished; drop the in-flight pattern so the conductor
        // resumes cleanly in the current spawn biome.
        s.pattern = null;
      }
      if (s.boss.finishedRole === 'interrupt') {
        // The samurai's kill-duel was survived: he's repelled but keeps stalking
        // (back to watching), and the run resumes where it left off.
        SamuraiSystem.onDuelRepelled(s);
      }
      s.boss.finishedRole = null;
    }

    if (s.boss.active) return; // an encounter owns the screen (timer paused)

    // The DON'T-SLICE read: an arrow-bundle drifts across the lane (spawned by the
    // conductor's `a` cell or the timed trigger below). IGNORE it and it passes
    // harmlessly — withholding the blade is the safe play. MIS-SLICE it
    // (CombatSystem sets `c.cut`) and it bursts into the staggered archer volley.
    if (s.arrowCluster) {
      const c = s.arrowCluster;
      c.x -= s.cameraSpeed * dt;
      if (c.cut) {
        for (let p = 0; p < 18; p++) s.debris.push({ x: c.x, y: c.y, vx: (Math.random()-0.5)*26, vy: (Math.random()-0.5)*26, life: 1.5, type: 'ink', color: PALETTE.crimson });
        s.shake = 22; s.flashHit = 0.8; s.flashColor = '255, 255, 255';
        s.arrowCluster = null;
        BossSystem.startArcher(s); // mis-slice → the staggered volley
      } else if (c.x < -120) {
        s.arrowCluster = null; // drifted off-screen un-cut → harmless pass
      }
      return;
    }

    // Real-frame timer (unscaledDt approx 60/sec) -> predictable archer cadence.
    s.segmentTime += unscaledDt;

    // (Stumbles now feed the escalating samurai in SamuraiSystem, not a one-shot
    // ronin ambush — the run stays continuous; the duel triggers at his top tier.)

    // End of segment -> float in the archer trigger cluster.
    if (s.segmentTime > SEGMENT_SECONDS * 60) {
      s.arrowCluster = { x: canvasWidth + 80, y: canvasHeight * 0.45, r: 55, cut: false };
    }
  }
};
