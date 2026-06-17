import { SEGMENT_SECONDS, STUMBLE } from '../config/constants.js';
import { BossSystem } from './BossSystem.js';

// Orchestrates the run as a sequence of mutually-exclusive segments:
//   BAMBOO  --(arrow volley)-->  DEMONS  --(arrow volley)-->  BAMBOO  ...
// Each segment is a long stretch (minutes); the arrow volley is the biome
// transition — clearing it advances the biome AND flips the segment type. A
// ronin ambush can interrupt either segment when stumbles pile up, without
// advancing the biome.
export const SegmentSystem = {
  tick(state, dt, unscaledDt) {
    const s = state;

    // React to an encounter that just finished (BossSystem sets finishedRole).
    if (!s.boss.active && s.boss.finishedRole) {
      if (s.boss.finishedRole === 'transition') {
        s.biomeIndex += 1;
        s.phase = s.phase === 'BAMBOO' ? 'DEMONS' : 'BAMBOO';
        s.segmentTime = 0;
        s.bamboo = [];
        s.coins = [];
        s.demons = [];
        s.stumble.count = 0;
      }
      // 'interrupt' (ronin): the same segment resumes, biome unchanged.
      s.boss.finishedRole = null;
    }

    if (s.boss.active) return; // an encounter owns the screen (timer paused)

    // Real-frame timer (unscaledDt ≈ 60/sec), so the biome changes on a
    // predictable wall-clock cadence regardless of run speed.
    s.segmentTime += unscaledDt;

    // The ONLY thing that summons the ronin is stumbling — un-sliced bamboo or
    // demons that drift into the monk feed one shared counter.
    if (s.stumble.count >= STUMBLE.threshold) {
      s.stumble.count = 0;
      BossSystem.startRonin(s);
      return;
    }

    // End of segment → fire the transition volley.
    if (s.segmentTime > SEGMENT_SECONDS * 60) {
      BossSystem.startArcher(s);
    }
  }
};
