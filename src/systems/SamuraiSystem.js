import { SAMURAI } from '../config/constants.js';
import { BossSystem } from './BossSystem.js';

// ──────────────────────────────────────────────────────────────────────────
// THE SAMURAI — the run's one persistent, escalating pursuer and the only
// non-blocker death (RUN_DESIGN §3). He IS the diegetic stumble meter: clean
// play keeps him absent; each stumble draws him a tier closer; a stretch of
// clean play re-sheathes him. Only at the top tier does he commit to a
// kill-duel — the one moment he owns the screen. That duel reuses the existing
// BossSystem ronin wholesale (Z-axis dash, takeover, slow-mo, render), so this
// system only owns the stalking tiers and the hand-off.
//   tier 0  absent   — clean run, off screen, zero load
//   tier 1  watching — sheathed, stalking far back (warning only; run continues)
//   tier 2  drawn    — blade out, closing distance (still not lethal)
//   tier 3  duel     — kill-duel takeover (BossSystem ronin)
// Escalation feeds off s.stumble.count deltas (the counter is monotonic now
// that nothing resets it); de-escalation off accumulated clean time.
// ──────────────────────────────────────────────────────────────────────────
export const SamuraiSystem = {
  tick(state, dt, unscaledDt) {
    const s = state;
    const sam = s.samurai;

    // The kill-duel (or any boss takeover) owns the screen — the BossSystem
    // ronin drives the encounter then. Hold tier logic and keep the stumble
    // edge in sync so the duel's own stumbles don't double-count on resume.
    if (s.boss.active) { sam.lastStumble = s.stumble.count; return; }

    // Escalate on fresh stumbles (edge-detected). Each stumble draws him a tier.
    const fresh = s.stumble.count - sam.lastStumble;
    if (fresh > 0) {
      sam.lastStumble = s.stumble.count;
      const prev = sam.tier;
      sam.tier = Math.min(3, sam.tier + fresh);
      sam.coolTimer = 0;
      if (sam.tier > prev) {
        if (prev === 0) { sam.x = s.monk.x + SAMURAI.watchOffset; sam.scale = 0.4; } // appear far back
        s.shake = Math.max(s.shake, sam.tier >= 2 ? 14 : 8);
        s.flashHit = 0.4; s.flashColor = '185, 28, 28';
      }
    } else if (sam.tier > 0 && sam.tier < 3) {
      // Clean play cools him one tier per window. Conservative by default so a
      // single bad patch can't be trivially erased (RUN_DESIGN §8 open tuning).
      sam.coolTimer += unscaledDt;
      if (sam.coolTimer >= SAMURAI.coolWindow) {
        sam.tier -= 1;
        sam.coolTimer = 0;
      }
    }

    // Top tier → commit to the kill-duel (reuses the ronin takeover + render).
    if (sam.tier >= 3) {
      BossSystem.startRonin(s);
      return;
    }

    // Pose + glide. Watching/drawn stalk in the background, closing with tier so
    // the threat reads at a glance; he eases toward his tier's stand-off so a
    // step up looks like him gliding nearer rather than snapping.
    sam.pose = sam.tier === 0 ? 'absent' : sam.tier === 1 ? 'watching' : 'drawn';
    if (sam.tier === 0) return;

    const targetX = s.monk.x + (sam.tier === 1 ? SAMURAI.watchOffset : SAMURAI.drawOffset);
    const targetScale = sam.tier === 1 ? 0.4 : 0.58;
    sam.x += (targetX - sam.x) * SAMURAI.approachLerp * unscaledDt;
    sam.y = s.monk.y - 60;
    sam.scale += (targetScale - sam.scale) * 0.06 * unscaledDt;
  },

  // Called when a kill-duel resolves in the player's favour (SegmentSystem):
  // the samurai is repelled but keeps stalking — back to watching, not gone.
  onDuelRepelled(s) {
    const sam = s.samurai;
    sam.tier = 1;
    sam.coolTimer = 0;
    sam.lastStumble = s.stumble.count;
    sam.pose = 'watching';
    sam.x = s.monk.x + SAMURAI.watchOffset;
    sam.scale = 0.4;
  },
};
