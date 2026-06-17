import { PALETTE, MAX_FOCUS, BOSS_CONFIG } from '../config/constants.js';
import { Persistence } from '../core/Persistence.js';

const distSq = (p1, p2) => (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;

const distToSegmentSquared = (p, v, w) => {
  let l2 = distSq(v, w);
  if (l2 === 0) return distSq(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distSq(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};

export const BossSystem = {
  // --- Encounter starters (called by SegmentSystem, not by distance) ---
  // role 'transition' = arrow volley between biomes; 'interrupt' = ronin ambush.
  startArcher(s) {
    s.boss.active = true;
    s.boss.type = 'archer';
    s.boss.role = 'transition';
    s.boss.phase = 'warning';
    s.boss.warningTimer = 0;
    s.boss.arrows = [];
    s.bamboo = [];
    s.coins = [];
    s.demons = [];
    s.focus.energy = MAX_FOCUS;
    s.shake = 15;
    s.flashHit = 0.8;
    s.flashColor = '255, 255, 255';
    s.focus.path = [];
    s.focus.active = false;
  },

  startRonin(s) {
    s.boss.active = true;
    s.boss.type = 'ronin';
    s.boss.role = 'interrupt';
    s.boss.phase = 'warning';
    s.boss.warningTimer = 0;
    s.bamboo = [];
    s.coins = [];
    s.demons = [];
    s.focus.energy = MAX_FOCUS;
    s.shake = 15;
    s.flashHit = 0.8;
    s.flashColor = '255, 255, 255';
    s.focus.path = [];
    s.focus.active = false;
    s.boss.hp = BOSS_CONFIG.ronin.hp;
    s.boss.maxHp = BOSS_CONFIG.ronin.hp;
    s.boss.x = s.monk.x + 1200; // Far right (background)
    s.boss.y = s.monk.y - 50;
    s.boss.scale = 0.4;
    s.boss.timer = 0;
  },

  tick(state, dt, unscaledDt, handleGameOver) {
    const s = state;
    if (!s.boss.active) return;

    // --- ARCHER'S VOLLEY LOGIC (biome transition) ---
    if (s.boss.type === 'archer') {
      if (s.boss.phase === 'warning') {
        s.boss.warningTimer += unscaledDt;
        if (s.boss.warningTimer > 60) {
          s.boss.phase = 'active';
          s.shake = 10;

          // A volley of several staggered waves rather than one synchronized
          // batch — arrows vary in angle, depth (near/far → front/back), speed,
          // and arrival time so they sweep in and out with spatial variation.
          const startAngle = -Math.PI / 2.5;
          const endAngle = 0.15; // a touch past horizontal for wider spread
          const waves = 3 + Math.floor(Math.random() * 2); // 3–4 waves
          const distanceScale = Math.min(3, Math.floor(s.distance / 4000));

          for (let w = 0; w < waves; w++) {
            const perWave = 2 + Math.floor(Math.random() * 3) + distanceScale; // 2–4 (+ ramp)
            for (let k = 0; k < perWave; k++) {
              const angle = startAngle + Math.random() * (endAngle - startAngle);
              const radius = 450 + Math.random() * 500; // depth from the monk
              const depth = (radius - 450) / 500;        // 0 front … 1 back

              s.boss.arrows.push({
                id: Math.random(),
                x: s.monk.x + Math.cos(angle) * radius,
                y: s.monk.y - 20 + Math.sin(angle) * radius,
                angle: angle + Math.PI,
                speed: 1.5 + Math.random() * 1.3,
                scale: 1.15 - depth * 0.5,                       // back arrows read smaller
                delay: w * (28 + Math.random() * 18) + Math.random() * 12,
                isCrimson: false,
                sliced: false
              });
            }
          }
        }
      } else if (s.boss.phase === 'active') {
        let arrowsLeft = 0;

        s.boss.arrows.forEach(arr => {
          if (arr.sliced) return;
          arrowsLeft++;

          // Hold the arrow at its spawn point until its wave is due.
          if (arr.delay > 0) { arr.delay -= unscaledDt; return; }

          arr.x += Math.cos(arr.angle) * arr.speed * unscaledDt;
          arr.y += Math.sin(arr.angle) * arr.speed * unscaledDt;

          if (distSq({x: arr.x, y: arr.y}, {x: s.monk.x, y: s.monk.y - 20}) < 20 * 20) {
            s.shake = 20; s.flashHit = 1.0; s.flashColor = '185, 28, 28';
            handleGameOver();
          }
        });

        if (arrowsLeft === 0) {
          s.boss.phase = 'defeated';
          s.currentTimeScale = 1.0; // Clean cut: snap time back to normal on kill
          s.score += 100 * s.boss.arrows.length;
          s.shake = 30; s.flashHit = 1.0; s.flashColor = '255, 255, 255';
          s.focus.active = false; s.focus.path = [];
          Persistence.incrementBosses();

          s.boss.arrows.forEach(arr => {
            if (!arr.sliced) {
              for(let p=0; p<15; p++) s.debris.push({ x: arr.x, y: arr.y, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, life: 2, type: 'ink', color: PALETTE.crimson });
            }
          });
          setTimeout(() => { s.boss.active = false; s.boss.arrows = []; s.boss.finishedRole = 'transition'; }, 100);
        }
      }
    }

    // --- SHADOW RONIN LOGIC (interrupt ambush) ---
    if (s.boss.type === 'ronin') {
      if (s.boss.phase === 'warning') {
        s.boss.warningTimer += unscaledDt;

        if (s.boss.warningTimer > 90) { // 1.5s real time holding dramatic pose
          s.boss.phase = 'active';
          s.shake = 20;
        }
      } else if (s.boss.phase === 'active') {
        // Cinematic Z-Axis Dash
        s.boss.timer = (s.boss.timer || 0) + unscaledDt;
        const speedRamp = Math.min(1.0, s.boss.timer / 120.0);
        const currentSpeed = 1.0 + (9.0 * speedRamp * speedRamp);
        s.boss.x -= currentSpeed * unscaledDt;

        const progress = Math.max(0, Math.min(1, 1.0 - ((s.boss.x - s.monk.x - 40) / 760)));
        s.boss.y = (s.monk.y - 50) + (56 * progress);
        s.boss.scale = 0.4 + (0.8 * progress);

        // Game over if he reaches the monk
        if (s.boss.x <= s.monk.x + 40) {
          s.flashHit = 1.0; s.flashColor = '185, 28, 28';
          handleGameOver();
        }

        if (s.boss.hitCooldown > 0) s.boss.hitCooldown -= unscaledDt;

        // Frantic Hit Detection
        if (s.sword.isSlashing && s.sword.trail.length > 1 && s.boss.hitCooldown <= 0 && !s.focus.active) {
          const p1 = s.sword.trail[1]; const p2 = s.sword;

          const hitRadius = 50 * s.boss.scale;
          if (distToSegmentSquared({x: s.boss.x, y: s.boss.y - 20 * s.boss.scale}, p1, p2) < hitRadius * hitRadius) {
            s.boss.hp -= 1;
            s.boss.hitCooldown = 6;
            s.shake = 15;
            s.hitPause = 3;

            for(let p=0; p<10; p++) s.debris.push({ x: s.boss.x + (Math.random()-0.5)*40*s.boss.scale, y: s.boss.y - 20*s.boss.scale + (Math.random()-0.5)*40*s.boss.scale, vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20, life: 1.5, type: 'ink', color: Math.random() > 0.5 ? PALETTE.crimson : PALETTE.paper });

            if (s.boss.hp <= 0) {
              s.boss.phase = 'defeated';
              s.currentTimeScale = 1.0;
              s.score += 1500;
              s.shake = 40;
              s.flashHit = 1.0;
              s.flashColor = '255, 255, 255';
              s.boss.vx = 55; // Knocked backwards fast
              s.boss.vy = -22;
              s.boss.warningTimer = 0;
              s.focus.active = false;
              s.focus.path = [];
              Persistence.incrementBosses();
            }
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
          s.focus.active = false;
        }
      }
    }
  }
};
