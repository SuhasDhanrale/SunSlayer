import { SEGMENT_LENGTH, STUMBLE } from '../config/constants.js';
import { BossSystem } from './BossSystem.js';

// Orchestrates the run as a sequence of mutually-exclusive segments:
//   BAMBOO  --(arrow volley)-->  DEMONS  --(arrow volley)-->  BAMBOO  ...
// The arrow volley is the biome transition; clearing it advances the biome AND
// flips the segment type. A ronin ambush can interrupt a BAMBOO segment (from
// stumbles or a "full moon") without advancing the biome.
export const SegmentSystem = {
  tick(state, dt, unscaledDt) {
    const s = state;

    // React to an encounter that just finished (BossSystem sets finishedRole).
    if (!s.boss.active && s.boss.finishedRole) {
      if (s.boss.finishedRole === 'transition') {
        s.biomeIndex += 1;
        s.phase = s.phase === 'BAMBOO' ? 'DEMONS' : 'BAMBOO';
        s.segmentDistance = 0;
        s.bamboo = [];
        s.demons = [];
        s.stumble.count = 0;
      }
      // 'interrupt' (ronin): bamboo simply resumes, biome unchanged.
      s.fullMoon = false;
      s.boss.finishedRole = null;
    }

    if (s.boss.active) return; // an encounter owns the screen

    s.segmentDistance += s.cameraSpeed * dt;

    // Ronin ambush can only break into a BAMBOO segment.
    if (s.phase === 'BAMBOO') {
      if (s.stumble.count >= STUMBLE.threshold) {
        s.stumble.count = 0;
        BossSystem.startRonin(s);
        return;
      }
      if (Math.random() < STUMBLE.fullMoonChance) {
        s.fullMoon = true;
        BossSystem.startRonin(s);
        return;
      }
    }

    // End of segment → fire the transition volley.
    if (s.segmentDistance > SEGMENT_LENGTH) {
      BossSystem.startArcher(s);
    }
  }
};
