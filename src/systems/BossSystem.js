import { PALETTE, MAX_FOCUS, BOSS_CONFIG } from '../config/constants.js';
import { Persistence } from '../core/Persistence.js';
import { ComboSystem } from './ComboSystem.js';
import { bus } from '../core/bus.js';

const distSq = (p1, p2) => (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;

const distToSegmentSquared = (p, v, w) => {
  let l2 = distSq(v, w);
  if (l2 === 0) return distSq(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distSq(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};

export const BossSystem = {
  // Samurai/Ronin encounter starter. Arrow traps are continuous-run entities
  // owned by ArrowSystem and never activate boss mode.
  startRonin(s, options = {}) {
    if (typeof options === 'boolean') options = { force: options };
    const { mode = 'mercy', canvasWidth = 1920, force = false } = options;
    if (!force && s.coins?.length) {
      s.pendingBoss = 'ronin';
      s.boss.pendingDuelMode = mode;
      s.boss.pendingCanvasWidth = canvasWidth;
      return false;
    }
    s.pendingBoss = null;
    s.boss.active = true;
    s.boss.type = 'ronin';
    s.boss.role = 'interrupt';
    s.boss.phase = 'warning';
    s.boss.duelMode = mode;
    s.boss.finishedMode = null;
    s.boss.pendingDuelMode = null;
    s.boss.pendingCanvasWidth = 0;
    s.boss.warningTimer = 0;
    s.bamboo = [];
    s.demons = [];
    if (s.yokaiQueue) s.yokaiQueue.length = 0; // drop staggered members into the boss wipe
    s.arrowTrap = null;
    s.arrowBurst = null;
    s.focus.energy = MAX_FOCUS;
    s.shake = 15;
    s.flashHit = 0.8;
    s.flashColor = '255, 255, 255';
    s.focus.path = [];
    s.focus.active = false;
    s.boss.hp = mode === 'mercy' ? BOSS_CONFIG.ronin.mercyHp : 0;
    s.boss.maxHp = s.boss.hp;
    s.boss.hitCooldown = 0;
    const available = Math.max(80, canvasWidth - s.monk.x - 60);
    s.boss.x = s.monk.x + Math.min(760, available);
    s.boss.startX = s.boss.x;
    s.boss.y = s.monk.y - 50;
    s.boss.scale = 0.4;
    s.boss.timer = 0;
    return true;
  },

  tryStartPending(s) {
    if (s.boss.active || !s.pendingBoss || s.coins?.length) return false;
    const type = s.pendingBoss;
    if (type === 'ronin') return this.startRonin(s, {
      force: true,
      mode: s.boss.pendingDuelMode || 'mercy',
      canvasWidth: s.boss.pendingCanvasWidth || 1920,
    });
    s.pendingBoss = null;
    return false;
  },

  tick(state, dt, unscaledDt, handleGameOver) {
    const s = state;
    if (!s.boss.active) return;

    // --- SAMURAI DUEL LOGIC (internal legacy type: ronin) ---
    if (s.boss.type === 'ronin') {
      if (s.boss.phase === 'warning') {
        s.boss.warningTimer += unscaledDt;
        const warningDuration = s.boss.duelMode === 'execution'
          ? BOSS_CONFIG.ronin.executionWarning
          : BOSS_CONFIG.ronin.mercyWarning;
        if (s.boss.warningTimer > warningDuration) {
          s.boss.phase = 'active';
          s.boss.timer = 0;
          s.shake = 20;
        }
      } else if (s.boss.phase === 'active') {
        s.boss.timer = (s.boss.timer || 0) + unscaledDt;
        const chargeDuration = s.boss.duelMode === 'execution'
          ? BOSS_CONFIG.ronin.executionCharge
          : BOSS_CONFIG.ronin.mercyCharge;
        const progress = Math.max(0, Math.min(1, s.boss.timer / chargeDuration));
        const eased = progress * progress;
        s.boss.x = s.boss.startX + (s.monk.x + 40 - s.boss.startX) * eased;
        s.boss.y = (s.monk.y - 50) + (56 * progress);
        s.boss.scale = 0.4 + (0.8 * progress);

        if (progress >= 1) {
          s.flashHit = 1.0; s.flashColor = '185, 28, 28';
          handleGameOver();
          return;
        }

        if (s.boss.hitCooldown > 0) s.boss.hitCooldown -= unscaledDt;

        // Execution is explicitly terminal: it has no HP and ignores blade input.
        if (s.boss.duelMode === 'mercy' && s.sword.isSlashing && s.sword.trail.length > 1 && s.boss.hitCooldown <= 0 && !s.focus.active) {
          const p1 = s.sword.trail[1]; const p2 = s.sword;

          const hitRadius = 50 * s.boss.scale;
          if (distToSegmentSquared({x: s.boss.x, y: s.boss.y - 20 * s.boss.scale}, p1, p2) < hitRadius * hitRadius) {
            s.boss.hp -= 1;
            s.boss.hitCooldown = BOSS_CONFIG.ronin.hitCooldown;
            s.shake = 15;
            s.hitPause = 3;
            ComboSystem.registerHit(s, 'ronin');

            for(let p=0; p<10; p++) s.debris.push({ x: s.boss.x + (Math.random()-0.5)*40*s.boss.scale, y: s.boss.y - 20*s.boss.scale + (Math.random()-0.5)*40*s.boss.scale, vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20, life: 1.5, type: 'ink', color: Math.random() > 0.5 ? PALETTE.crimson : PALETTE.paper });

            if (s.boss.hp <= 0) {
              s.boss.phase = 'defeated';
              s.currentTimeScale = 1.0;
              s.shake = 40;
              s.flashHit = 1.0;
              s.flashColor = '255, 255, 255';
              s.boss.vx = 55; // Knocked backwards fast
              s.boss.vy = -22;
              s.boss.warningTimer = 0;
              s.boss.finishedMode = 'mercy';
              s.focus.active = false;
              s.focus.path = [];
              Persistence.incrementBosses();
            }
          }
        }

        // Execution is terminal — but the blade can still MEET him. The player keeps
        // the ability to slice ("it's like slicing"); the Samurai parries it. No HP,
        // no dice, no reprieve — the charge keeps closing, so the kill stays certain.
        if (s.boss.duelMode === 'execution' && s.sword.isSlashing && s.sword.trail.length > 1 && s.boss.hitCooldown <= 0) {
          const p1 = s.sword.trail[1]; const p2 = s.sword;
          const hitRadius = 50 * s.boss.scale;
          if (distToSegmentSquared({ x: s.boss.x, y: s.boss.y - 20 * s.boss.scale }, p1, p2) < hitRadius * hitRadius) {
            s.boss.hitCooldown = BOSS_CONFIG.ronin.hitCooldown;
            s.shake = Math.max(s.shake, 12);
            s.hitPause = 2;
            s.flashHit = Math.max(s.flashHit, 0.25);
            s.flashColor = '255, 255, 255';
            // Deflection sparks, never ink — he is parrying, not bleeding.
            for (let p = 0; p < 7; p++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 5 + Math.random() * 9;
              s.debris.push({
                x: s.boss.x, y: s.boss.y - 20 * s.boss.scale,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                rot: angle, life: 0.4 + Math.random() * 0.25,
                type: 'arrowSpark', length: 5 + Math.random() * 8,
              });
            }
            bus.emit('samurai:parry');
          }
        }
      } else if (s.boss.phase === 'defeated') {
        // Blasted away physics
        s.boss.x += s.boss.vx * unscaledDt;
        s.boss.y += s.boss.vy * unscaledDt;
        s.boss.vy += 0.8 * unscaledDt; // Gravity

        s.boss.warningTimer += unscaledDt;
        if (s.boss.warningTimer > 20) { // Quick exit (~0.3s)
          s.boss.active = false;
          s.boss.finishedRole = 'interrupt';
          s.boss.finishedMode = 'mercy';
          s.focus.active = false;
        }
      }
    }
  }
};
