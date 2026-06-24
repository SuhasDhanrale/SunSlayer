import { SAMURAI } from '../config/constants.js';
import { bus } from '../core/bus.js';
import { BossSystem } from './BossSystem.js';

const STAGE = Object.freeze({ ABSENT: 'absent', WATCHING: 'watching', POST_MERCY: 'postMercy' });

function standOffX(s, canvasWidth, maxOffset, fraction) {
  const edgeMargin = SAMURAI.edgeMargin || 60;
  const available = Math.max(80, canvasWidth - s.monk.x - edgeMargin);
  return s.monk.x + Math.min(maxOffset, available * fraction);
}

function resetEpisode(s) {
  const sam = s.samurai;
  sam.stage = STAGE.ABSENT;
  sam.pose = 'absent';
  sam.coolTimer = 0;
  sam.pendingDuel = null;
  sam.deferredIncident = false;
  sam.graceTimer = 0;
}

export const SamuraiSystem = {
  STAGE,

  tick(state, dt, unscaledDt, canvasWidth) {
    const s = state;
    const sam = s.samurai;
    if (!sam) return;

    sam.stage ||= STAGE.ABSENT;
    sam.lastStumble ??= s.stumble.count;
    sam.graceTimer = Math.max(0, (sam.graceTimer || 0) - unscaledDt);
    const freshIncident = s.stumble.count > sam.lastStumble;

    if (s.boss.active) {
      if (freshIncident && s.boss.type !== 'ronin') sam.deferredIncident = true;
      sam.lastStumble = s.stumble.count;
      return;
    }

    if (sam.pendingDuel) {
      sam.lastStumble = s.stumble.count;
      return;
    }

    let incident = freshIncident || sam.deferredIncident;
    if (freshIncident) sam.lastStumble = s.stumble.count;
    if (sam.deferredIncident) sam.deferredIncident = false;

    if (incident) {
      sam.coolTimer = 0;
      if (sam.stage === STAGE.ABSENT) {
        sam.stage = STAGE.WATCHING;
        sam.pose = 'watching';
        sam.scale = 0.4;
        sam.x = standOffX(s, canvasWidth, SAMURAI.watchOffset, 0.85);
        s.shake = Math.max(s.shake, 8);
        s.flashHit = 0.4;
        s.flashColor = '185, 28, 28';
        bus.emit('samurai:appear');
      } else if (sam.stage === STAGE.WATCHING) {
        sam.pendingDuel = 'mercy';
        bus.emit('samurai:mercy');
        BossSystem.startRonin(s, { mode: 'mercy', canvasWidth });
        return;
      } else if (sam.stage === STAGE.POST_MERCY) {
        sam.pendingDuel = 'execution';
        bus.emit('samurai:execution');
        BossSystem.startRonin(s, { mode: 'execution', canvasWidth });
        return;
      }
    }

    if (sam.stage !== STAGE.ABSENT && sam.graceTimer <= 0) {
      const biome = s.playerBiome || s.biome || 'bamboo';
      const coolMul = SAMURAI.biomeCool?.[biome] ?? 1;
      const resetWindow = sam.stage === STAGE.POST_MERCY
        ? SAMURAI.postMercyResetWindow
        : SAMURAI.watchResetWindow;
      if (coolMul > 0) sam.coolTimer += unscaledDt * coolMul;
      if (sam.coolTimer >= resetWindow) resetEpisode(s);
    }

    sam.pose = sam.stage === STAGE.ABSENT
      ? 'absent'
      : sam.stage === STAGE.POST_MERCY ? 'drawn' : 'watching';
    if (sam.stage === STAGE.ABSENT) return;

    const postMercy = sam.stage === STAGE.POST_MERCY;
    const targetX = standOffX(s, canvasWidth, postMercy ? SAMURAI.drawOffset : SAMURAI.watchOffset, postMercy ? 0.5 : 0.85);
    const targetScale = postMercy ? 0.58 : 0.4;
    sam.x += (targetX - sam.x) * SAMURAI.approachLerp * unscaledDt;
    sam.y = s.monk.y - 60;
    sam.scale += (targetScale - sam.scale) * 0.06 * unscaledDt;
  },

  onMercyWon(s) {
    const sam = s.samurai;
    sam.stage = STAGE.POST_MERCY;
    sam.pose = 'drawn';
    sam.pendingDuel = null;
    sam.coolTimer = 0;
    sam.graceTimer = SAMURAI.postMercyGrace;
    sam.lastStumble = s.stumble.count;
    sam.scale = 0.58;
    bus.emit('samurai:repelled');
  },

  resetEpisode,
};
