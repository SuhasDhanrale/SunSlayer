import { COIN_REWARD } from '../config/constants.js';
import { CoinSystem } from './CoinSystem.js';

// Coins are a REWARD layer, NOT part of the level. Three rhythms, by intensity:
//   • GOLD RUSH (intensity < rushBelow → a REST zone): flood the screen, no greed.
//   • NORMAL play: an occasional random coin WAVE, then a long (jittered) gap — so
//     there's breathing space, not a constant sprinkle.
//   • PEAK (intensity > busyStop): stay quiet — the player is busy; the only coins
//     are the contextual arcs over spikes (handled in PatternRunner).
// A countdown timer (in world-distance) paces the waves.
export const CoinReward = {
  tick(s, dt, w, h) {
    if (s.coinTimer === undefined) s.coinTimer = COIN_REWARD.calmGap;
    s.coinTimer -= s.cameraSpeed * dt;
    if (s.coinTimer > 0) return;

    const intensity = (s.director && s.director.intensity) || 0;

    if (intensity > COIN_REWARD.busyStop) {
      s.coinTimer = COIN_REWARD.busyGap; // too intense for reward coins — breathe
      return;
    }

    CoinSystem.spawnCluster(s, w, h);
    if (intensity < COIN_REWARD.rushBelow) {        // gold rush: pile it on
      CoinSystem.spawnCluster(s, w, h);
      CoinSystem.spawnCluster(s, w, h);
    }

    // Next wave: short when calm (frequent → gold rush), long when busy, jittered
    // so the gaps feel organic rather than metronomic.
    const base = COIN_REWARD.calmGap + (COIN_REWARD.busyGap - COIN_REWARD.calmGap) * Math.min(1, intensity);
    s.coinTimer = base * (0.6 + Math.random() * 0.8);
  }
};
