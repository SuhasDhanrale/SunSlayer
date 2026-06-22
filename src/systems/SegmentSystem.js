import { BossSystem } from './BossSystem.js';
import { SamuraiSystem } from './SamuraiSystem.js';

// Reconciles the Samurai/Ronin interrupt with the continuous run. Sealed quivers
// are normal entities owned by ArrowSystem and never activate boss mode.
export const SegmentSystem = {
  tick(state) {
    const s = state;

    if (!s.boss.active && s.boss.finishedRole) {
      if (s.boss.finishedRole === 'interrupt') SamuraiSystem.onMercyWon(s);
      s.boss.finishedRole = null;
      s.boss.finishedMode = null;
    }

    if (!s.boss.active && s.pendingBoss) BossSystem.tryStartPending(s);
  },
};
