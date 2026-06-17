import { PALETTE, SLASH_THRESHOLD, MAX_FOCUS, DEMON_CONFIG } from '../config/constants.js';

// --- Helper Math ---
const distSq = (p1, p2) => (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
const dist = (p1, p2) => Math.sqrt(distSq(p1, p2));

const distToSegmentSquared = (p, v, w) => {
  let l2 = distSq(v, w);
  if (l2 === 0) return distSq(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distSq(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};

export const CombatSystem = {
  sliceBamboo(b, i, s, cutY) {
    s.hitPause = b.type === 'thick' ? 4 : 2;
    s.shake = b.type === 'thick' ? 12 : 6;

    s.debris.push({
      x: b.x, y: cutY - 40, vx: 4 + Math.random() * 4, vy: -2 - Math.random() * 3,
      rot: 0, rv: 0.1 + Math.random() * 0.2, type: 'stalk', width: b.width, height: 80, life: 1
    });

    for(let p=0; p < (b.type === 'thick' ? 8 : 4); p++) {
       s.debris.push({ x: b.x, y: cutY, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1, type: 'ink', color: PALETTE.ink });
       if (Math.random() > 0.5) s.debris.push({ x: b.x, y: cutY, vx: (Math.random()-0.5)*5, vy: -2 - Math.random()*2, life: 1, type: 'leaf' });
    }

    s.bamboo.splice(i, 1);

    s.score += b.type === 'thick' ? 50 : 10;
  },

  sliceDemon(d, i, s) {
    s.combo += 1;
    s.comboTimer = DEMON_CONFIG.comboWindow;
    s.score += 100 * Math.max(1, s.combo);
    s.hitPause = 3;
    s.shake = 8;
    s.flashHit = 0.5;
    s.flashColor = '255, 255, 255';

    for (let p = 0; p < 10; p++) {
      s.debris.push({ x: d.x, y: d.y, vx: (Math.random()-0.5)*18, vy: (Math.random()-0.5)*18, life: 1, type: 'ink', color: Math.random() > 0.5 ? PALETTE.crimson : PALETTE.ink });
    }

    s.demons.splice(i, 1);
  },

  tick(state, dt, unscaledDt) {
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
      if (b.hitCooldown > 0) b.hitCooldown -= unscaledDt;

      if (canSlash && b.hitCooldown <= 0) {
        let isHit = false;

        if (b.type === 'bomb') {
           isHit = distToSegmentSquared({x: b.x, y: b.y}, p1, p2) < (b.width)**2;
        } else {
           isHit = distToSegmentSquared({x: b.x, y: (p1.y+p2.y)/2}, p1, p2) < (b.width * 2)**2 && p2.y > b.y && p2.y < b.y + b.height;
        }

        if (isHit) {
          if (b.type === 'bomb') {
             s.shake = 30;
             s.flashHit = 1.0;
             s.flashColor = '185, 28, 28';
             s.monk.x = -100; // Trigger game over
             for(let p=0; p<15; p++) s.debris.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, life: 1, type: 'ink', color: PALETTE.crimson });
             s.bamboo.splice(i, 1);
             continue;
          }

          if (b.type === 'thick') {
            b.hp -= 1; b.hitCooldown = 10; s.shake = 4; s.hitPause = 1;
            for(let p=0; p<5; p++) s.debris.push({ x: b.x, y: p2.y, vx: (Math.random()-0.5)*10, vy: -2 - Math.random()*5, life: 1, type: 'ink', color: PALETTE.ink });
            if (b.hp <= 0) this.sliceBamboo(b, i, s, p2.y);
            continue;
          }

          this.sliceBamboo(b, i, s, p2.y);
          continue;
        }
      }
    }

    // Demon (Fruit-Ninja) slicing — same swipe gesture, no directional matching.
    for (let i = s.demons.length - 1; i >= 0; i--) {
      const d = s.demons[i];
      if (d.sliced) continue;
      if (canSlash && distToSegmentSquared({x: d.x, y: d.y}, p1, p2) < (d.radius) ** 2) {
        this.sliceDemon(d, i, s);
      }
    }
  }
};
