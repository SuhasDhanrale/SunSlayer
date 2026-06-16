import { PALETTE, SLASH_THRESHOLD, MAX_FOCUS } from '../config/constants.js';

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
    
    if (b.type === 'thick') s.score += 50;
    else if (b.type === 'vertical' || b.type === 'horizontal') s.score += 30;
    else s.score += 10;
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

    // Entities & Collisions (Bamboo)
    for (let i = s.bamboo.length - 1; i >= 0; i--) {
      const b = s.bamboo[i];
      if (b.hitCooldown > 0) b.hitCooldown -= unscaledDt;

      if (!s.focus.active && s.sword.isSlashing && s.sword.trail.length > 1 && b.hitCooldown <= 0) {
        const p1 = s.sword.trail[1]; const p2 = s.sword;
        
        let dSq;
        let isHit = false;

        if (b.type === 'fruit' || b.type === 'bomb') {
           dSq = distToSegmentSquared({x: b.x, y: b.y}, p1, p2);
           isHit = dSq < (b.width)**2; 
        } else {
           dSq = distToSegmentSquared({x: b.x, y: (p1.y+p2.y)/2}, p1, p2);
           isHit = dSq < (b.width * 2)**2 && p2.y > b.y && p2.y < b.y + b.height;
        }
        
        if (isHit) {
          if (b.type === 'bomb') {
             s.shake = 30;
             s.flashHit = 1.0;
             s.monk.x = -100; // Trigger game over
             for(let p=0; p<15; p++) s.debris.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, life: 1, type: 'ink', color: PALETTE.crimson });
             s.bamboo.splice(i, 1);
             continue;
          }

          if (b.type === 'fruit') {
             s.score += 150;
             s.hitPause = 5;
             s.shake = 8;
             for(let p=0; p<8; p++) s.debris.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1, type: 'ink', color: PALETTE.emerald });
             s.bamboo.splice(i, 1);
             continue;
          }

          const dy = Math.abs(p1.y - p2.y); const dx = Math.abs(p1.x - p2.x);

          if ((b.type === 'vertical' && dy < dx * 1.5) || (b.type === 'horizontal' && dx < dy * 1.5)) {
             s.shake = 3; b.hitCooldown = 15;
             for(let p=0; p<4; p++) s.debris.push({ x: b.x, y: p2.y, vx: -5 - Math.random()*5, vy: (Math.random()-0.5)*5, life: 1, type: 'ink', color: PALETTE.fadedInk });
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
  }
};
