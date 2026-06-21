import { PALETTE, SLASH_THRESHOLD, MAX_FOCUS } from '../config/constants.js';

import { trySliceObstacle } from '../obstacles/index.js';
import { getYokai } from '../data/yokai.js';
import { ComboSystem } from './ComboSystem.js';
import { CoinSystem } from './CoinSystem.js';

// --- Helper Math ---
const distSq = (p1, p2) => (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
const dist = (p1, p2) => Math.sqrt(distSq(p1, p2));

const closestPointOnSegment = (p, v, w) => {
  const l2 = distSq(v, w);
  if (l2 === 0) return { x: v.x, y: v.y };
  const t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
  return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
};

const distToSegmentSquared = (p, v, w) => distSq(p, closestPointOnSegment(p, v, w));

export const CombatSystem = {
  sliceBamboo(b, i, s, cutY) {
    s.hitPause = b.type === 'thick' ? 4 : 2;
    s.shake = b.type === 'thick' ? 12 : 6;

    // Preserve the complete stalk as exactly two bamboo halves. The old effect
    // spawned one generic, ink-coloured rectangle, which became a white flipping
    // box in dark biomes and discarded most of the stalk.
    const stalkTop = b.y;
    const stalkBottom = b.y + b.height;
    const splitY = Math.max(stalkTop + 8, Math.min(stalkBottom - 8, cutY));
    const addHalf = (top, bottom, direction) => {
      const height = bottom - top;
      s.debris.push({
        x: b.x,
        y: top + height / 2,
        vx: direction * (1.5 + Math.random() * 1.5),
        vy: -1.5 - Math.random() * 2,
        rot: 0,
        rv: direction * (0.025 + Math.random() * 0.025),
        type: 'bambooPiece',
        width: b.width,
        height,
        nodeOffset: ((stalkTop + 40 - top) % 60 + 60) % 60,
        life: 2,
      });
    };
    addHalf(stalkTop, splitY, 1);
    addHalf(splitY, stalkBottom, -1);

    for(let p=0; p < (b.type === 'thick' ? 8 : 4); p++) {
       s.debris.push({ x: b.x, y: cutY, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1, type: 'ink', color: PALETTE.ink });
       if (Math.random() > 0.5) s.debris.push({ x: b.x, y: cutY, vx: (Math.random()-0.5)*5, vy: -2 - Math.random()*2, life: 1, type: 'leaf' });
    }

    s.bamboo.splice(i, 1);

  },

  // Detonate an explosive obstacle (TNT crate): clears every boulder within this
  // crate's blast RADIUS, right now, at the crate's position. NO chain to other
  // crates — each TNT only clears its own bounded pocket ("that much"), so a
  // thick wall takes several cuts to open. `gateId` is accepted for caller
  // compatibility but no longer used.
  explode(s, x, y, radius = 230, gateId = null) {
    s.shake = Math.max(s.shake, 16); s.hitPause = 4; s.flashHit = 0.5; s.flashColor = '255, 255, 255';
    ComboSystem.registerHit(s, 'tnt');
    // Shockwave ring — scroll it with the world so it stays over the pocket.
    s.debris.push({ x, y, r: 14, maxR: radius, life: 1, type: 'blast', vx: -(s.cameraSpeed || 0), vy: 0 });
    for (let p = 0; p < 12; p++) {
      s.debris.push({ x, y, vx: (Math.random()-0.5)*18, vy: (Math.random()-0.5)*18, life: 1, type: 'ink', color: Math.random() > 0.5 ? PALETTE.ink : PALETTE.fadedInk });
    }
    // Clear boulders inside the radius (measured from boulder centre).
    for (let j = s.bamboo.length - 1; j >= 0; j--) {
      const o = s.bamboo[j];
      if (o.type !== 'boulder') continue;
      const oy = o.y + (o.height || 0) / 2;
      if (Math.hypot(o.x - x, oy - y) <= radius + (o.width || 0) / 2) s.bamboo.splice(j, 1);
    }
  },

  trySliceDemon(d, s, p1, p2) {
    if (d.sliced || distToSegmentSquared({ x: d.x, y: d.y }, p1, p2) >= d.radius ** 2) return false;
    this.sliceDemon(d, s, p1, p2);
    return true;
  },

  sliceDemon(d, s, p1, p2) {
    const rawPoint = closestPointOnSegment({ x: d.x, y: d.y }, p1, p2);
    const rawDx = rawPoint.x - d.x;
    const rawDy = rawPoint.y - d.y;
    const rawDistance = Math.hypot(rawDx, rawDy);
    const maxOffset = d.radius * 0.25;
    const centerBias = rawDistance > maxOffset ? maxOffset / rawDistance : 1;
    const point = { x: rawDx * centerBias, y: rawDy * centerBias };
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const localAngle = angle - d.rot;
    const normalX = -Math.sin(angle);
    const normalY = Math.cos(angle);
    const alignedPointY = normalX * point.x + normalY * point.y;
    const inheritedVX = d.vx * 0.5;
    const inheritedVY = d.vy * 0.5;

    d.sliced = true;
    if (!d.coinDropped) {
      d.coinDropped = true;
      CoinSystem.dropFromYokai(s, d.x + point.x, d.y + point.y);
    }
    d.cut = {
      phase: 'contact', contactTicks: 0, age: 0,
      angle, localAngle, alignedPointY, baseRotation: d.rot, point,
      negative: { x: 0, y: 0, vx: inheritedVX - normalX * 4.5, vy: inheritedVY - normalY * 4.5, rot: 0, rv: -0.09 },
      positive: { x: 0, y: 0, vx: inheritedVX + normalX * 4.5, vy: inheritedVY + normalY * 4.5, rot: 0, rv: 0.09 },
    };

    ComboSystem.registerHit(s, 'yokai');
    s.hitPause = 3;
    s.shake = Math.max(s.shake, 12);
    s.flashHit = 0.5;
    s.flashColor = '255, 255, 255';

    const accents = getYokai(d.type).accentColors;
    const particleCount = 18 + Math.floor(Math.random() * 5);
    for (let p = 0; p < particleCount; p++) {
      const alongCut = Math.random() < 0.55;
      const direction = Math.random() < 0.5 ? -1 : 1;
      const particleAngle = angle + (alongCut ? (direction < 0 ? Math.PI : 0) : direction * Math.PI / 2) + (Math.random() - 0.5) * 0.65;
      const speed = 4 + Math.random() * 9;
      const color = Math.random() < 0.68 ? PALETTE.ink : accents[Math.floor(Math.random() * accents.length)];
      s.debris.push({
        x: d.x + point.x, y: d.y + point.y,
        vx: Math.cos(particleAngle) * speed, vy: Math.sin(particleAngle) * speed,
        life: 1, type: 'ink', color, size: 2 + Math.random() * 4,
      });
    }
  },

  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    // Focus Mechanics (Regen)
    if (s.focus.active) {
      if (!s.boss.active) {
         s.focus.energy = Math.max(0, s.focus.energy - 0.5 * unscaledDt);
         if (s.focus.energy <= 0) s.focus.active = false;
      }
    } else {
      s.focus.energy = Math.min(MAX_FOCUS, s.focus.energy + 0.3 * unscaledDt);
    }

    // Sword Physics
    const oldSword = { x: s.sword.x, y: s.sword.y };
    s.sword.x += (s.mouse.x - s.sword.x) * 0.5;
    s.sword.y += (s.mouse.y - s.sword.y) * 0.5;
    s.sword.isSlashing = dist(oldSword, s.sword) > SLASH_THRESHOLD;

    if (!s.focus.active) {
      s.sword.trail.unshift({ x: s.sword.x, y: s.sword.y });
      if (s.sword.trail.length > 12) s.sword.trail.pop();
    }

    const canSlash = !s.focus.active && s.sword.isSlashing && s.sword.trail.length > 1;
    const p1 = canSlash ? s.sword.trail[1] : null;
    const p2 = canSlash ? s.sword : null;

    // Bamboo collisions / slicing (any-direction)
    for (let i = s.bamboo.length - 1; i >= 0; i--) {
      const b = s.bamboo[i];

      if (b.specId) {
        if (b.gate && b.type === 'boulder') continue;
        if (b.sim?.isCut) continue;
        if (b.hitCooldown > 0) b.hitCooldown -= unscaledDt;
        if (canSlash && b.hitCooldown <= 0) {
          const result = trySliceObstacle(b, p1, p2);
          if (result.hit) {
            const cut = result.world || { x: b.x, y: b.y + b.height / 2 };
            if (b.explosive) {
              this.explode(s, b.x, b.y + b.height / 2, b.blastRadius || 230, b.gateId ?? null);
              break; // array heavily mutated by the blast; resume next frame
            }
            s.hitPause = b.type === 'thick' ? 4 : 2;
            s.shake = b.type === 'thick' ? 12 : 6;
            ComboSystem.registerHit(s, b.type || b.specId || 'obstacle');
            for (let p = 0; p < 5; p++) {
              s.debris.push({
                x: cut.x,
                y: cut.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 0.8,
                type: 'ink',
                color: PALETTE.ink,
              });
            }
          }
        }
        continue;
      }

      if (b.type === 'raft') continue; // dressing only

      // Set-pieces: cut the HIGH rope to resolve them (plank drops / boulder rolls).
      if (b.type === 'bridge' || b.type === 'boulder') {
        if (b.state === 'armed' && canSlash) {
          const ry = s.monk.y - b.ropeOffY;
          if (distToSegmentSquared({ x: b.x, y: ry }, p1, p2) < b.ropeR ** 2) {
            b.state = 'resolved';
            b.reactT = 0;
            s.shake = 14; s.hitPause = 3;
            ComboSystem.registerHit(s, b.type);
            for (let p = 0; p < 8; p++) s.debris.push({ x: b.x, y: ry, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 1, type: 'ink', color: PALETTE.paper });
          }
        }
        continue;
      }

      if (b.hitCooldown > 0) b.hitCooldown -= unscaledDt;

      if (canSlash && b.hitCooldown <= 0) {
        const isHit = distToSegmentSquared({x: b.x, y: (p1.y+p2.y)/2}, p1, p2) < (b.width * 2)**2 && p2.y > b.y && p2.y < b.y + b.height;

        if (isHit) {
          if (b.explosive) {            // TNT / barrel — detonate (chain-clears nearby)
            this.explode(s, b.x, b.y + b.height / 2, b.blastRadius || 230, b.gateId ?? null);
            break;                      // array heavily mutated; resume next frame
          }
          if (b.type === 'thick') {
            b.hp -= 1; b.hitCooldown = 10; s.shake = 4; s.hitPause = 1;
            ComboSystem.registerHit(s, 'thick-bamboo');
            for(let p=0; p<5; p++) s.debris.push({ x: b.x, y: p2.y, vx: (Math.random()-0.5)*10, vy: -2 - Math.random()*5, life: 1, type: 'ink', color: PALETTE.ink });
            if (b.hp <= 0) this.sliceBamboo(b, i, s, p2.y);
            continue;
          }

          ComboSystem.registerHit(s, b.type === 'vine' ? 'vine' : 'bamboo');
          this.sliceBamboo(b, i, s, p2.y);
          continue;
        }
      }
    }

    // Demon (Fruit-Ninja) slicing — same swipe gesture, no directional matching.
    for (let i = s.demons.length - 1; i >= 0; i--) {
      const d = s.demons[i];
      if (canSlash) this.trySliceDemon(d, s, p1, p2);
    }

    // Arrow volley is broken with a NORMAL slash — no
    // focus/iaijutsu required. Just sweep the blade across the incoming arrows.
    if (canSlash && s.boss.active && s.boss.type === 'archer' && s.boss.phase === 'active') {
      for (const arr of s.boss.arrows) {
        if (arr.sliced) continue;
        if (distToSegmentSquared({x: arr.x, y: arr.y}, p1, p2) < 34 ** 2) {
          arr.sliced = true;
          arr.resolution = 'cut';
          ComboSystem.registerHit(s, 'arrow');
          s.shake = Math.max(s.shake, 6);
          for (let p = 0; p < 6; p++) s.debris.push({ x: arr.x, y: arr.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1, type: 'ink', color: PALETTE.paper });
        }
      }
    }

    // Arrow-cluster archer trigger — cut it to burst the volley early.
    if (s.arrowCluster && !s.arrowCluster.cut && canSlash) {
      const c = s.arrowCluster;
      if (distToSegmentSquared({ x: c.x, y: c.y }, p1, p2) < c.r ** 2) {
        c.cut = true;
        ComboSystem.break(s, 'forbidden-target');
      }
    }

    // Coin pickups — collected by brushing the blade across them (no fast swipe
    // required), so a clean stroke sweeps up a whole trail.
    for (let i = s.coins.length - 1; i >= 0; i--) {
      const c = s.coins[i];
      if (distToSegmentSquared(c, oldSword, s.sword) < (c.r + 16) ** 2) {
        CoinSystem.collectImmediately(s);

        if (s.shake < 2) s.shake = 2;
        for (let p = 0; p < 5; p++) s.debris.push({ x: c.x, y: c.y, vx: (Math.random()-0.5)*8, vy: -1 - Math.random()*4, life: 0.8, type: 'ink', color: PALETTE.warmGlow });
        s.coins.splice(i, 1);
      }
    }
  }
};
