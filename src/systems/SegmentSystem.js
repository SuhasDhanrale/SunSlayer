import { SEGMENT_SECONDS, STUMBLE, PALETTE } from '../config/constants.js';
import { BossSystem } from './BossSystem.js';

// Orchestrates encounter pressure in one continuous run. Biome progression is
// owned by BiomeSystem; this system schedules the archer volley and the global
// stumble-triggered ronin ambush.
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
      // 'interrupt' (ronin): the run resumes where it left off.
      s.boss.finishedRole = null;
    }

    if (s.boss.active) return; // an encounter owns the screen (timer paused)

    // Archer trigger: once it's time, an arrow-cluster floats in. CUT it to burst
    // the volley early; if it drifts to the monk uncut it auto-bursts.
    if (s.arrowCluster) {
      const c = s.arrowCluster;
      c.x -= s.cameraSpeed * dt;
      if (c.cut || c.x <= s.monk.x + 60) {
        for (let p = 0; p < 18; p++) s.debris.push({ x: c.x, y: c.y, vx: (Math.random()-0.5)*26, vy: (Math.random()-0.5)*26, life: 1.5, type: 'ink', color: PALETTE.crimson });
        s.shake = 22; s.flashHit = 0.8; s.flashColor = '255, 255, 255';
        s.arrowCluster = null;
        BossSystem.startArcher(s); // burst → the staggered volley
      }
      return;
    }

    // Real-frame timer (unscaledDt approx 60/sec) -> predictable archer cadence.
    s.segmentTime += unscaledDt;

    // The ONLY thing that summons the ronin is stumbling. This is global across
    // ground, cave, and water.
    if (s.stumble.count >= STUMBLE.threshold) {
      s.stumble.count = 0;
      BossSystem.startRonin(s);
      return;
    }

    // End of segment -> float in the archer trigger cluster.
    if (s.segmentTime > SEGMENT_SECONDS * 60) {
      s.arrowCluster = { x: canvasWidth + 80, y: canvasHeight * 0.45, r: 55, cut: false };
    }
  }
};
