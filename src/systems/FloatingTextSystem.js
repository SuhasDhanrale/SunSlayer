// Floating combat text — ported 1:1 from the Floating Text Visuals mock
// (src/mocks/screens/FloatingTextVisualMock.jsx). One transient pool lives on
// `s.floatingText`; gameplay systems call a spawner at the world (logical) point
// where the event happened, the loop ticks this every frame on UNSCALED time (so a
// pop reads at real speed even during golden slow-mo / hitstop), and GameRenderer
// draws it on the world layer (see drawFloatingText there). Ages are in 60fps FRAME
// units to match the mock's hand-tuned phase durations. SPRITE-READY (text is final).
//
// The five families and where they fire:
//   combo      — per-swipe multi-cut, at the cut point  (CombatSystem.raiseMultiCut)
//   arrow      — cutting the forbidden seal, "-N"        (ArrowSystem.triggerBurst)
//   miss       — a stumble incident, above the monk head (StumbleSystem.register)
//   critical   — 15% chance on a player yokai cut, "+10" (CombatSystem.trySliceDemon)
//   goldenhits — golden frenzy scrub, climbing "N HITS"  (CombatSystem.tryHitGolden)
// The arrow "-N" mirrors the REAL score penalty (SCORING.arrowPenalty); the critical
// "+10" is still purely cosmetic (the cut's score is awarded in ComboSystem).

const POP_DURATION = 8;
const SHRINK_DURATION = 15;
const HOLD_DURATION = 40;
const FADE_DURATION = 20;
const MAX_AGE = POP_DURATION + SHRINK_DURATION + HOLD_DURATION + FADE_DURATION;

// Hard cap so a chaotic field (e.g. an iaijutsu sweep through a cluster) can't grow
// the pool without bound; extra spawns drop silently.
const POOL_CAP = 24;

// 15% of player yokai cuts pop a CRITICAL. Local prototype tunable (no data/ entry
// duplicates it yet); promote to config.json if it needs live tuning.
export const CRITICAL_CHANCE = 0.15;

export const FloatingTextSystem = {
  spawn(s, text, x, y, color, size, type) {
    s.floatingText ||= [];

    // Golden hits coalesce: a live "N HITS" popup updates its count + re-pops in
    // place, so a frenzy scrub shows one climbing counter rather than a stack.
    if (type === 'goldenhits') {
      const existing = s.floatingText.find((t) => t.type === 'goldenhits');
      if (existing) {
        existing.text = text;
        existing.x = x;
        existing.y = y;
        existing.age = POP_DURATION; // jump to the peak for a bump, no shrink-to-zero
        return existing;
      }
    }

    if (s.floatingText.length >= POOL_CAP) return null;

    const ft = {
      text, x, y, color, size, type,
      age: 0, maxAge: MAX_AGE,
      vx: (Math.random() - 0.5) * 0.5,
      // Miss / arrow fall down a touch; combo / crit / golden rise.
      vy: (type === 'miss' || type === 'arrow') ? 0.5 : -0.5,
    };
    s.floatingText.push(ft);
    return ft;
  },

  // --- Convenience spawners (call at the world point the event happened) ---
  // Sizes tuned down from the mock: arrow reads right as-is; combo/miss/golden are
  // ~35% smaller and critical ~50% smaller so they don't dominate the frame.
  combo(s, count, x, y) { return this.spawn(s, String(count), x, y, '#fbbf24', 29, 'combo'); },
  arrow(s, x, y, amount = 10) { return this.spawn(s, `-${amount}`, x, y, '#ef4444', 55, 'arrow'); },
  miss(s, x, y) { return this.spawn(s, 'MISS!', x, y, '#f97316', 33, 'miss'); },
  critical(s, x, y) { return this.spawn(s, 'CRITICAL +10', x, y, '#38bdf8', 33, 'critical'); },
  goldenHits(s, hits, x, y) { return this.spawn(s, `${hits} HITS`, x, y, '#fdf4ff', 39, 'goldenhits'); },

  // Ticked EVERY frame on UNSCALED (real) time so a pop reads even while the world
  // is in golden slow-mo or a hitstop freeze. Splices from the end.
  tick(s, unscaledDt) {
    const list = s.floatingText;
    if (!list || !list.length) return;
    for (let i = list.length - 1; i >= 0; i--) {
      const t = list[i];
      t.age += unscaledDt;
      if (t.age > t.maxAge) { list.splice(i, 1); continue; }
      t.x += t.vx * unscaledDt;
      t.y += t.vy * unscaledDt;
      // Float away faster during the fade-out (matches the mock).
      if (t.age > t.maxAge - FADE_DURATION) {
        t.y += ((t.type === 'miss' || t.type === 'arrow') ? 1.5 : -1.5) * unscaledDt;
      }
    }
  },
};

// Shared with GameRenderer.drawFloatingText so the draw-side scale/opacity phases
// stay in lock-step with the tick-side lifetime above.
export const FLOATING_TEXT_PHASES = { POP_DURATION, SHRINK_DURATION, HOLD_DURATION, FADE_DURATION, MAX_AGE };
