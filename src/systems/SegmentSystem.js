import { SEGMENT_SECONDS, STUMBLE, PALETTE } from '../config/constants.js';
import { BossSystem } from './BossSystem.js';

// Orchestrates ONE continuous run. Obstacles, coins, and enemy waves are all
// woven together by the ElementDirector; this system just owns the run's macro
// rhythm: every ~SEGMENT_SECONDS an arrow volley fires as the biome transition
// (clearing it advances the biome), and a ronin ambush breaks in whenever
// stumbles pile up (from obstacles or demons hitting the monk).
export const SegmentSystem = {
  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    // React to an encounter that just finished (BossSystem sets finishedRole).
    if (!s.boss.active && s.boss.finishedRole) {
      if (s.boss.finishedRole === 'transition') {
        s.biomeIndex += 1;        // new biome, fresh run
        s.segmentTime = 0;
        s.bamboo = [];
        s.coins = [];
        s.demons = [];
        s.arrowCluster = null;
        s.stumble.count = 0;
        // New biome → restart the pacing rhythm with a fresh REST-led ramp, but
        // KEEP what's already taught (the player learned the vocabulary once).
        if (s.director) { s.director.zone = null; s.director.lastKind = null; }
      }
      // 'interrupt' (ronin): the run resumes where it left off, biome unchanged.
      s.boss.finishedRole = null;
    }

    if (s.boss.active) return; // an encounter owns the screen (timer paused)

    // Transition trigger: once it's time, an arrow-cluster floats in. CUT it to
    // burst the volley early; if it drifts to the monk uncut it auto-bursts, so
    // progression never stalls. While it's live, the segment timer is paused.
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

    // Real-frame timer (unscaledDt ≈ 60/sec) → predictable biome cadence.
    s.segmentTime += unscaledDt;

    // The ONLY thing that summons the ronin is stumbling — un-sliced bamboo or
    // demons that drift into the monk feed one shared counter.
    if (s.stumble.count >= STUMBLE.threshold) {
      s.stumble.count = 0;
      BossSystem.startRonin(s);
      return;
    }

    // End of segment → float in the cut-to-transition arrow-cluster.
    if (s.segmentTime > SEGMENT_SECONDS * 60) {
      s.arrowCluster = { x: canvasWidth + 80, y: canvasHeight * 0.45, r: 55, cut: false };
    }
  }
};
