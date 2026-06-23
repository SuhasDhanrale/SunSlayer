import { ARROW_TRAP, PALETTE } from '../config/constants.js';
import { bus } from '../core/bus.js';
import { ComboSystem } from './ComboSystem.js';
import { StumbleSystem } from './StumbleSystem.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distSq = (a, b) => (b.x - a.x) ** 2 + (b.y - a.y) ** 2;

function distToSegmentSquared(p, v, w) {
  const l2 = distSq(v, w);
  if (!l2) return distSq(p, v);
  const t = clamp(((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2, 0, 1);
  return distSq(p, { x: v.x + (w.x - v.x) * t, y: v.y + (w.y - v.y) * t });
}

function lerpAngle(from, to, t) {
  let delta = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

function addInk(s, x, y, color, count = 6, spread = 15) {
  s.debris ||= [];
  for (let i = 0; i < count; i++) {
    s.debris.push({
      x, y,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.5) * spread,
      life: 1,
      type: 'ink',
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function markLessonSeen(s) {
  s.arrowLessonSeen = true;
  if (s.yokaiTrack) s.yokaiTrack.arrowTaught = true;
}

function arrowCountFor(tier) {
  if (tier === 'PEAK') return ARROW_TRAP.peakArrows;
  if (tier === 'RISE') return ARROW_TRAP.riseArrows;
  return ARROW_TRAP.tutorialArrows;
}

export const ArrowSystem = {
  canSpawnTrap(s) {
    // Block arrows only during the actual duel — not while the Samurai is merely
    // `watching`/`postMercy`. Those are pressure states where an arrow is the ideal
    // discipline test (don't slice the forbidden target) and the right way to deliver
    // the next stumble. The active Ronin is already covered by `!s.boss.active`;
    // `pendingDuel` covers the frame gap before the duel boss spins up.
    const samuraiDueling = s.samurai && s.samurai.pendingDuel;
    return !s.arrowTrap && !s.arrowBurst && !s.boss?.active && !s.pendingBoss && !samuraiDueling;
  },

  spawnTrap(s, options = {}) {
    if (!this.canSpawnTrap(s)) return null;
    const launch = options.launch || {};
    const trap = {
      id: options.id ?? Math.random(),
      x: launch.x ?? options.x ?? 0,
      y: launch.y ?? options.y ?? 0,
      vx: launch.vx ?? options.vx ?? 0,
      vy: launch.vy ?? options.vy ?? 0,
      gravity: launch.gravity ?? options.gravity ?? 0,
      worldAnchored: Boolean(options.worldAnchored),
      r: ARROW_TRAP.radius,
      tier: options.tier || 'TUTORIAL',
      source: options.source || 'pattern',
      tutorial: Boolean(options.tutorial),
      slashable: false,
      angle: options.angle ?? Math.PI,
      // Tumble like a yokai so the sealed bundle reads as part of that layer.
      spin: 0,
      spinV: (Math.random() < 0.5 ? -1 : 1) * ARROW_TRAP.spinSpeed,
    };
    s.arrowTrap = trap;
    return trap;
  },

  triggerBurst(s, trap, canvasWidth, canvasHeight) {
    if (!trap || s.arrowBurst) return false;
    const origin = { x: trap.x, y: trap.y };
    const target = { x: s.monk.x, y: s.monk.y - 20 };
    const awayAngle = Math.atan2(origin.y - target.y, origin.x - target.x);
    const spread = (ARROW_TRAP.stagingSpreadDeg * Math.PI) / 180;
    const count = arrowCountFor(trap.tier);
    const arrows = [];

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const scatterAngle = awayAngle - spread / 2 + spread * t;
      const stageX = clamp(origin.x + Math.cos(scatterAngle) * ARROW_TRAP.stagingRadius, 44, canvasWidth - 44);
      const stageY = clamp(origin.y + Math.sin(scatterAngle) * ARROW_TRAP.stagingRadius, 44, canvasHeight - 44);
      arrows.push({
        id: Math.random(),
        x: origin.x,
        y: origin.y,
        stageX,
        stageY,
        targetX: target.x,
        targetY: target.y,
        initialAngle: trap.angle,
        angle: trap.angle,
        delay: i * ARROW_TRAP.launchGapFrames,
        age: 0,
        flyAge: 0,
        state: 'staging',
        resolution: null,
      });
    }

    s.arrowTrap = null;
    s.arrowBurst = {
      phase: 'telegraph',
      timer: 0,
      origin,
      target,
      tier: trap.tier,
      source: trap.source,
      incidentSpent: false,
      incidentCount: 0,
      arrows,
    };
    ComboSystem.break(s, 'forbidden-target');
    s.hitPause = Math.max(s.hitPause || 0, ARROW_TRAP.hitPauseFrames);
    s.shake = Math.max(s.shake || 0, 14);
    addInk(s, origin.x, origin.y, PALETTE.crimson, 14, 24);
    s.debris.push({ x: origin.x - 12, y: origin.y, vx: -5, vy: -5, rv: -0.12, rot: 0, life: 1, type: 'sealFragment' });
    s.debris.push({ x: origin.x + 12, y: origin.y, vx: 5, vy: -4, rv: 0.12, rot: 0, life: 1, type: 'sealFragment' });
    for (let i = 0; i < 6; i++) {
      s.debris.push({
        x: origin.x, y: origin.y,
        vx: (Math.random() - 0.5) * 13, vy: -3 - Math.random() * 7,
        rv: (Math.random() - 0.5) * 0.3, rot: Math.random() * Math.PI,
        life: 0.8 + Math.random() * 0.35, type: 'cordFragment',
        length: 9 + Math.random() * 12,
      });
    }
    markLessonSeen(s);
    bus.emit('arrow:trap-cut', { tier: trap.tier, count });
    return true;
  },

  // Arrows only become deflectable once they are genuinely in flight and have
  // cleared a short grace buffer. This stops the stroke that broke the seal (and
  // any drag during the slow-mo telegraph) from instantly mowing down the staged
  // arrows the moment they spawn.
  arrowSlashable(arrow) {
    return arrow.state === 'flying' && (arrow.flyAge || 0) >= ARROW_TRAP.cutGraceFrames;
  },

  cutArrow(s, arrow) {
    if (!arrow || arrow.resolution || !this.arrowSlashable(arrow)) return false;
    arrow.resolution = 'cut';
    arrow.state = 'cut';
    addInk(s, arrow.x, arrow.y, PALETTE.crimson, 7, 17);
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 9;
      s.debris.push({
        x: arrow.x, y: arrow.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        rot: angle, life: 0.45 + Math.random() * 0.25,
        type: 'arrowSpark', length: 5 + Math.random() * 8,
      });
    }
    s.shake = Math.max(s.shake || 0, 5);
    bus.emit('arrow:deflect');
    return true;
  },

  tryCutSegment(s, p1, p2, canvasWidth, canvasHeight) {
    if (!p1 || !p2) return { hit: false, trapCut: false, arrowsCut: 0 };
    let arrowsCut = 0;
    for (const arrow of s.arrowBurst?.arrows || []) {
      if (arrow.resolution || !this.arrowSlashable(arrow)) continue;
      if (distToSegmentSquared(arrow, p1, p2) < ARROW_TRAP.cutRadius ** 2 && this.cutArrow(s, arrow)) arrowsCut++;
    }

    let trapCut = false;
    const trap = s.arrowTrap;
    if (trap?.slashable && distToSegmentSquared(trap, p1, p2) < trap.r ** 2) {
      trapCut = this.triggerBurst(s, trap, canvasWidth, canvasHeight);
    }
    return { hit: trapCut || arrowsCut > 0, trapCut, arrowsCut };
  },

  tryCutPath(s, path, canvasWidth, canvasHeight) {
    if (!Array.isArray(path) || path.length < 2) return { hit: false, trapCut: false, arrowsCut: 0 };
    let arrowsCut = 0;
    // Resolve arrows that existed before this stroke, then trigger the trap. This
    // prevents one stored Focus path from creating and instantly clearing a burst.
    for (const arrow of s.arrowBurst?.arrows || []) {
      if (arrow.resolution || !this.arrowSlashable(arrow)) continue;
      for (let i = 0; i < path.length - 1; i++) {
        if (distToSegmentSquared(arrow, path[i], path[i + 1]) < ARROW_TRAP.cutRadius ** 2) {
          if (this.cutArrow(s, arrow)) arrowsCut++;
          break;
        }
      }
    }

    let trapCut = false;
    const trap = s.arrowTrap;
    if (trap?.slashable) {
      for (let i = 0; i < path.length - 1; i++) {
        if (distToSegmentSquared(trap, path[i], path[i + 1]) < trap.r ** 2) {
          trapCut = this.triggerBurst(s, trap, canvasWidth, canvasHeight);
          break;
        }
      }
    }
    return { hit: trapCut || arrowsCut > 0, trapCut, arrowsCut };
  },

  spendIncident(s, arrow) {
    const burst = s.arrowBurst;
    if (!burst || burst.incidentSpent) return;
    burst.incidentSpent = true;
    burst.incidentCount += 1;
    arrow.resolution = 'hit';
    if (burst.incidentCount <= ARROW_TRAP.maxIncidentsPerBurst) {
      StumbleSystem.register(s, { source: 'arrow-burst' });
    }
    s.shake = Math.max(s.shake || 0, 18);
    s.flashHit = Math.max(s.flashHit || 0, 0.55);
    s.flashColor = '185, 28, 28';
    addInk(s, arrow.x, arrow.y, PALETTE.crimson, 12, 22);
    for (const other of burst.arrows) {
      if (!other.resolution) {
        other.resolution = 'spent';
        addInk(s, other.x, other.y, PALETTE.fadedInk, 3, 10);
      }
    }
    bus.emit('arrow:hit');
    s.arrowBurst = null;
  },

  tick(s, dt, unscaledDt, canvasWidth, canvasHeight) {
    if (s.boss?.active) {
      s.arrowTrap = null;
      s.arrowBurst = null;
      return;
    }

    const trap = s.arrowTrap;
    if (trap) {
      if (trap.worldAnchored) trap.x -= (s.cameraSpeed || 0) * dt;
      else {
        trap.x += trap.vx * dt;
        trap.y += trap.vy * dt;
        trap.vy += trap.gravity * dt;
      }
      trap.angle = trap.worldAnchored ? Math.PI : Math.atan2(trap.vy, trap.vx);
      trap.spin += trap.spinV * dt;
      trap.slashable = trap.x >= trap.r + 12 && trap.x <= canvasWidth - trap.r - 12
        && trap.y >= trap.r && trap.y <= canvasHeight - trap.r;
      if (trap.x < -trap.r - 100 || trap.y < -trap.r - 120 || trap.y > canvasHeight + trap.r + 120) {
        if (trap.tutorial) markLessonSeen(s);
        s.arrowTrap = null;
      }
    }

    const burst = s.arrowBurst;
    if (!burst) return;
    if (burst.phase === 'telegraph') {
      burst.timer += unscaledDt;
      const t = clamp(burst.timer / ARROW_TRAP.telegraphFrames, 0, 1);
      const eased = 1 - (1 - t) ** 3;
      for (const arrow of burst.arrows) {
        if (arrow.resolution) continue;
        arrow.x = burst.origin.x + (arrow.stageX - burst.origin.x) * eased;
        arrow.y = burst.origin.y + (arrow.stageY - burst.origin.y) * eased;
        const aim = Math.atan2(arrow.targetY - arrow.y, arrow.targetX - arrow.x);
        arrow.angle = lerpAngle(arrow.initialAngle, aim, eased);
      }
      if (t >= 1) {
        burst.phase = 'launch';
        burst.timer = 0;
        for (const arrow of burst.arrows) if (!arrow.resolution) arrow.state = 'queued';
      }
    } else {
      for (const arrow of burst.arrows) {
        if (arrow.resolution) continue;
        arrow.age += unscaledDt;
        if (arrow.state === 'queued') {
          arrow.delay -= unscaledDt;
          if (arrow.delay <= 0) {
            arrow.state = 'flying';
            arrow.flyAge = 0;
            const angle = Math.atan2(arrow.targetY - arrow.y, arrow.targetX - arrow.x);
            arrow.angle = angle;
            arrow.vx = Math.cos(angle) * ARROW_TRAP.speed;
            arrow.vy = Math.sin(angle) * ARROW_TRAP.speed;
          }
        } else if (arrow.state === 'flying') {
          arrow.flyAge += unscaledDt;
          arrow.x += arrow.vx * unscaledDt;
          arrow.y += arrow.vy * unscaledDt;
          if (distSq(arrow, { x: s.monk.x, y: s.monk.y - 20 }) < ARROW_TRAP.monkHitRadius ** 2) {
            this.spendIncident(s, arrow);
            return;
          }
          if (arrow.x < -100 || arrow.x > canvasWidth + 100 || arrow.y < -100 || arrow.y > canvasHeight + 100 || arrow.age > 150) {
            arrow.resolution = 'expired';
          }
        }
      }
    }

    if (burst.arrows.every((arrow) => arrow.resolution)) {
      if (!burst.incidentSpent) bus.emit('arrow:burst-cleared');
      s.arrowBurst = null;
    }
  },
};
