import { COIN_REWARD } from '../config/constants.js';
import { CoinSystem } from './CoinSystem.js';

// Coins are a REWARD layer, NOT part of the level. During obstacle/combo play it
// drops an OCCASIONAL coin wave with a long, jittered gap (breathing space), and
// goes quiet during intense peaks. It stays OFF entirely for REST patterns — the
// gold-rush authors its own coins. (Spikes also carry their own coin arc; see
// PatternRunner.) Spacing is world-distance, lerped calm→busy by intensity.
export const CoinReward = {
  tick(s, dt, w, h) {
    const pat = s.pattern;
    if (pat && pat.category === 'rest') return; // gold rush authors its own coins

    if (s.coinTimer === undefined) s.coinTimer = COIN_REWARD.calmGap;
    s.coinTimer -= s.cameraSpeed * dt;
    if (s.coinTimer > 0) return;

    const intensity = (s.director && s.director.intensity) || 0;
    if (intensity > COIN_REWARD.busyStop) { s.coinTimer = COIN_REWARD.busyGap; return; } // too intense — breathe

    CoinSystem.spawnCluster(s, w, h);
    // Next wave: short when calm, long when busy, jittered so gaps feel organic.
    const base = COIN_REWARD.calmGap + (COIN_REWARD.busyGap - COIN_REWARD.calmGap) * Math.min(1, intensity);
    s.coinTimer = base * (0.6 + Math.random() * 0.8);
  }
};
