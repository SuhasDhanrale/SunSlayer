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
  tick(state, dt, unscaledDt, handleGameOver) {
    const s = state;

    // --- BOSS STATE MACHINE ---
    if (!s.boss.active && s.distance > s.boss.nextTrigger) {
      s.boss.active = true;
      s.boss.type = s.boss.nextType;
      s.boss.phase = 'warning';
      s.boss.warningTimer = 0;
      s.bamboo = []; // Clear the screen
      s.focus.energy = MAX_FOCUS;
      s.shake = 15; 
      s.flashHit = 0.8; 
      s.flashColor = '255, 255, 255';
      s.focus.path = [];
      s.focus.active = false;

      if (s.boss.type === 'ronin') {
         s.boss.hp = BOSS_CONFIG.ronin.hp;
         s.boss.maxHp = BOSS_CONFIG.ronin.hp;
         s.boss.x = s.monk.x + 400; // Far right (Background)
         s.boss.y = s.monk.y - 50;  // Elevated slightly
         s.boss.scale = 0.4;        // Start very small
         s.boss.timer = 0;
      }
    }

    // --- ARCHER'S VOLLEY LOGIC ---
    if (s.boss.active && s.boss.type === 'archer') {
      if (s.boss.phase === 'warning') {
        s.boss.warningTimer += unscaledDt;
        if (s.boss.warningTimer > 60) { 
          s.boss.phase = 'active';
          s.shake = 10;
          
          const distanceScale = Math.floor((s.distance - BOSS_CONFIG.archer.triggerDistance) / 1500); 
          let totalArrows = 2 + Math.floor(Math.random() * 3) + distanceScale; 
          totalArrows = Math.min(totalArrows, 15); 
          
          let numCrimson = Math.max(0, Math.floor(totalArrows / 4)); 
          if (totalArrows > 3 && numCrimson === 0) numCrimson = 1; 

          const crimsonIndices = new Set();
          while(crimsonIndices.size < numCrimson) {
            crimsonIndices.add(Math.floor(Math.random() * totalArrows));
          }

          const radius = 600 + Math.random() * 200; 
          const startAngle = -Math.PI / 2.5; 
          const endAngle = Math.PI / 2.5;    
          
          for(let i=0; i<totalArrows; i++) {
            const baseAngle = totalArrows === 1 ? 0 : startAngle + (i * (endAngle - startAngle) / (totalArrows - 1));
            const angle = baseAngle + (Math.random() - 0.5) * 0.2; 
            
            s.boss.arrows.push({
              id: Math.random(), x: s.monk.x + Math.cos(angle) * radius, y: s.monk.y - 20 + Math.sin(angle) * radius,
              angle: angle + Math.PI, isCrimson: crimsonIndices.has(i), sliced: false
            });
          }
        }
      } else if (s.boss.phase === 'active') {
        let normalArrowsLeft = 0;

        s.boss.arrows.forEach(arr => {
          if (arr.sliced) return;
          if (!arr.isCrimson) normalArrowsLeft++;

          arr.x += Math.cos(arr.angle) * 2.0 * unscaledDt; 
          arr.y += Math.sin(arr.angle) * 2.0 * unscaledDt;

          if (distSq({x: arr.x, y: arr.y}, {x: s.monk.x, y: s.monk.y - 20}) < 20 * 20) {
            s.shake = 20; s.flashHit = 1.0; s.flashColor = '185, 28, 28'; 
            handleGameOver();
          }
        });

        if (normalArrowsLeft === 0) {
          s.boss.phase = 'defeated';
          s.score += 100 * s.boss.arrows.length; 
          s.shake = 30; s.flashHit = 1.0; s.flashColor = '255, 255, 255'; 
          s.boss.nextTrigger = Math.max(BOSS_CONFIG.ronin.triggerDistance, s.distance + 1500); // Trigger Ronin soon after
          s.boss.nextType = 'ronin';
          s.focus.active = false; s.focus.path = [];
          Persistence.incrementBosses();
          
          s.boss.arrows.forEach(arr => {
            if (!arr.sliced) {
              for(let p=0; p<15; p++) s.debris.push({ x: arr.x, y: arr.y, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, life: 2, type: 'ink', color: PALETTE.crimson });
            }
          });
          setTimeout(() => { s.boss.active = false; s.boss.arrows = []; }, 100);
        }
      }
    }

    // --- SHADOW RONIN LOGIC ---
    if (s.boss.active && s.boss.type === 'ronin') {
      if (s.boss.phase === 'warning') {
        s.boss.warningTimer += unscaledDt;
        
        if (s.boss.warningTimer > 90) { // 1.5s real time holding dramatic pose
          s.boss.phase = 'active';
          s.shake = 20;
        }
      } else if (s.boss.phase === 'active') {
        // Cinematic Z-Axis Dash (He gets closer and larger over ~2.5 seconds)
        s.boss.x -= 2.5 * unscaledDt; 
        s.boss.y += 0.35 * unscaledDt; // Move down to ground level
        s.boss.scale += 0.0055 * unscaledDt; // Scale up to look closer
        
        if (s.boss.scale > 1.2) s.boss.scale = 1.2;

        // Game over if he reaches the monk
        if (s.boss.x <= s.monk.x + 40) { 
          s.flashHit = 1.0; s.flashColor = '185, 28, 28';
          handleGameOver(); 
        }

        if (s.boss.hitCooldown > 0) s.boss.hitCooldown -= unscaledDt;

        // Frantic Hit Detection
        if (s.sword.isSlashing && s.sword.trail.length > 1 && s.boss.hitCooldown <= 0 && !s.focus.active) {
          const p1 = s.sword.trail[1]; const p2 = s.sword;
          
          // Hitbox scales with him as he gets closer
          const hitRadius = 50 * s.boss.scale; 
          if (distToSegmentSquared({x: s.boss.x, y: s.boss.y - 20 * s.boss.scale}, p1, p2) < hitRadius * hitRadius) {
            s.boss.hp -= 1;
            s.boss.hitCooldown = 6; // Requires stroke momentum
            s.shake = 15;
            s.hitPause = 3; 
            
            // Explosive spark feedback
            for(let p=0; p<10; p++) s.debris.push({ x: s.boss.x + (Math.random()-0.5)*40*s.boss.scale, y: s.boss.y - 20*s.boss.scale + (Math.random()-0.5)*40*s.boss.scale, vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20, life: 1.5, type: 'ink', color: Math.random() > 0.5 ? PALETTE.crimson : PALETTE.paper });

            if (s.boss.hp <= 0) {
              s.boss.phase = 'defeated';
              s.score += 1500;
              s.shake = 40;
              s.flashHit = 1.0;
              s.flashColor = '255, 255, 255';
              s.boss.nextTrigger = s.distance + 2500;
              s.boss.nextType = Math.random() > 0.5 ? 'archer' : 'ronin'; // Alternate
              s.boss.vx = 25; // Knocked backwards
              s.boss.vy = -15;
              s.boss.warningTimer = 0;
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
        if (s.boss.warningTimer > 100) s.boss.active = false;
      }
    }
  }
};
