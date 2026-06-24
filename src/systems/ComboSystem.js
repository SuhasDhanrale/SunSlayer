import { bus } from '../core/bus.js';
import { SCORING } from '../config/constants.js';

export const COMBO_WINDOW_SECONDS = 1.6;

export function getComboTier(combo) {
  if (combo >= 15) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  if (combo >= 1) return 1;
  return 0;
}

export const ComboSystem = {
  registerHit(s, source = 'slice') {
    const previousTier = getComboTier(s.combo || 0);
    s.combo = (s.combo || 0) + 1;
    s.maxCombo = Math.max(s.maxCombo || 0, s.combo);
    s.comboTimer = COMBO_WINDOW_SECONDS;
    s.comboTier = getComboTier(s.combo);

    // THE skill score: every cut scores base × the multiplier for the NEW tier, so a
    // chained run climbs far faster than a sloppy one over the same distance. This is
    // the single chokepoint all legit cuts (yokai / bamboo / obstacle / ronin / golden
    // / tnt) flow through, so scoring lives here rather than in each call site.
    const mult = SCORING.tierMultipliers[s.comboTier] ?? 1;
    s.score = (s.score || 0) + SCORING.baseCutPoints * mult;
    bus.emit('combo:hit', { combo: s.combo, tier: s.comboTier, source });

    if (s.comboTier > previousTier) {
      s.flashHit = Math.max(s.flashHit || 0, 0.12 + s.comboTier * 0.05);
      s.shake = Math.max(s.shake || 0, 2 + s.comboTier * 1.5);
      bus.emit('combo:tier', { combo: s.combo, tier: s.comboTier, source });
    }
    return s.combo;
  },

  break(s, reason = 'timeout') {
    const previousTier = getComboTier(s.combo || 0);
    s.combo = 0;
    s.comboTimer = 0;
    s.comboTier = 0;
    if (previousTier > 0) bus.emit('combo:break', { previousTier, reason });
  },

  // dtSeconds is REAL wall-clock elapsed time (not slow-mo scaled), so the combo
  // window is a true 1.6s regardless of the loop's frame normalization or focus
  // slow-mo. A stumble breaks the chain instantly, independent of the timer.
  tick(s, dtSeconds) {
    const stumbleCount = s.stumble?.count || 0;
    if (stumbleCount > (s.comboLastStumble || 0)) {
      s.comboLastStumble = stumbleCount;
      this.break(s, 'stumble');
      return;
    }
    s.comboLastStumble = stumbleCount;
    if (s.comboTimer <= 0) return;
    s.comboTimer -= dtSeconds;
    if (s.comboTimer <= 0) this.break(s, 'timeout');
  },
};
