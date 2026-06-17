import React, { useEffect, useRef, useState, useCallback } from 'react';

// --- Sumi-e Palette & Constants ---
const PALETTE = {
  paper: '#f4f1ea',      
  ink: '#1c1917',        
  fadedInk: '#78716c',   
  lightInk: '#d6d3d1',   
  distantInk: '#e7e5e4', 
  crimson: '#b91c1c',    
  ground: '#0c0a09',
  warmGlow: '#fef08a',   
  mutedGlow: 'rgba(254, 240, 138, 0.4)', 
  emerald: '#059669', // Beautiful green for the monk's scarf
};

const GROUND_HEIGHT = 100;
const MONK_TARGET_X = 150;
const SLASH_THRESHOLD = 15; 
const BASE_SPEED = 5.5;
const MAX_FOCUS = 100;
const BIOME_LENGTH = 2500; 

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

export default function PhantomBlade() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);

  // Mutable Game State for 60fps loop
  const state = useRef({
    monk: { x: MONK_TARGET_X, y: 0, runCycle: 0 },
    sword: { x: window.innerWidth / 2, y: window.innerHeight / 2, trail: [], isSlashing: false },
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    focus: { active: false, energy: MAX_FOCUS, path: [] },
    currentTimeScale: 1.0, 
    boss: { 
      active: false, type: 'archer', phase: 'hidden', 
      arrows: [], nextTrigger: 3000, nextType: 'archer', 
      warningTimer: 0, hp: 0, maxHp: 0, hitCooldown: 0,
      x: 0, y: 0, vx: 0, vy: 0, timer: 0
    },
    bamboo: [],
    debris: [],
    scenery: [],
    foreground: [],
    hitPause: 0,
    shake: 0,
    flashHit: 0,
    flashColor: '255, 255, 255',
    cameraSpeed: BASE_SPEED,
    lastTime: 0,
    spawnTimer: 0,
    fgTimer: 0,
    distance: 0,
  });

  const requestRef = useRef();

  // --- Initialization & Spawning ---
  const isVillageBiome = (dist) => Math.floor(dist / BIOME_LENGTH) % 2 === 1;

  const spawnScenery = (xOffset, canvasWidth, canvasHeight, isDistant = false, currentDist = 0) => {
    const inVillage = isVillageBiome(currentDist);
    let type = 'mountain';

    if (inVillage) {
      const rand = Math.random();
      if (!isDistant) {
        if (rand > 0.75) type = 'pagoda';
        else if (rand > 0.5) type = 'torii';
        else type = 'house';
      } else {
        if (rand > 0.6) type = 'mountain';
        else if (rand > 0.4) type = 'torii';
        else type = 'house';
      }
    }

    return {
      type: type,
      x: xOffset,
      y: canvasHeight - GROUND_HEIGHT,
      width: type === 'pagoda' ? 140 + Math.random() * 60 : (isDistant ? 500 + Math.random() * 400 : 250 + Math.random() * 300),
      height: type === 'pagoda' ? 300 + Math.random() * 150 : (isDistant ? 200 + Math.random() * 150 : 120 + Math.random() * 150),
      parallax: isDistant ? 0.05 + Math.random() * 0.05 : 0.15 + Math.random() * 0.1,
      isDistant: isDistant
    };
  };

  const spawnBamboo = (canvasWidth, canvasHeight) => {
    const s = state.current;
    const rand = Math.random();
    let type = 'basic';
    
    if (rand > 0.85) type = 'thick';
    else if (rand > 0.7) type = 'vertical';
    else if (rand > 0.55) type = 'horizontal';

    const width = type === 'thick' ? 24 : 14;
    
    s.bamboo.push({
      id: Math.random(),
      type: type,
      x: canvasWidth + 50,
      y: canvasHeight - GROUND_HEIGHT - (120 + Math.random() * 80), 
      width: width,
      height: 250, 
      hp: type === 'thick' ? 3 : 1,
      hitCooldown: 0,
      swayOffset: Math.random() * Math.PI * 2
    });
  };

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    const h = canvas ? canvas.height : window.innerHeight;
    const w = canvas ? canvas.width : window.innerWidth;
    
    state.current = {
      ...state.current,
      monk: { x: MONK_TARGET_X, y: h - GROUND_HEIGHT, runCycle: 0 },
      sword: { x: w / 2, y: h / 2, trail: [], isSlashing: false },
      focus: { active: false, energy: MAX_FOCUS, path: [] },
      currentTimeScale: 1.0,
      boss: { 
        active: false, type: 'archer', phase: 'hidden', 
        arrows: [], nextTrigger: 3000, nextType: 'archer', 
        warningTimer: 0, hp: 0, maxHp: 0, hitCooldown: 0,
        x: 0, y: 0, vx: 0, vy: 0, timer: 0
      },
      bamboo: [],
      debris: [],
      scenery: [
        spawnScenery(0, w, h, true, 0), spawnScenery(600, w, h, true, 0), spawnScenery(1200, w, h, true, 0), 
        spawnScenery(0, w, h, false, 0), spawnScenery(500, w, h, false, 0), spawnScenery(1000, w, h, false, 0)
      ],
      foreground: [],
      hitPause: 0,
      shake: 0,
      flashHit: 0,
      flashColor: '255, 255, 255',
      cameraSpeed: BASE_SPEED,
      spawnTimer: 0,
      fgTimer: 0,
      distance: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  }, []);

  const handleGameOver = () => {
    state.current.shake = 20;
    setGameState('GAMEOVER');
  };

  const sliceBamboo = (b, i, s, cutY) => {
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
  };

  // --- Main Engine ---
  const gameLoop = useCallback((time) => {
    if (!state.current.lastTime) state.current.lastTime = time;
    const deltaTime = Math.min(time - state.current.lastTime, 32); 
    const unscaledDt = deltaTime / 16;
    state.current.lastTime = time;
    
    const s = state.current;
    
    // --- TIME RAMPING LOGIC ---
    let targetTimeScale = 1.0;
    if (s.boss.active) {
      if (s.boss.phase === 'warning') targetTimeScale = 0.2; 
      else if (s.boss.phase === 'active' && s.boss.type === 'archer') targetTimeScale = 0.01; // 1% Speed for arrows
      else if (s.boss.phase === 'active' && s.boss.type === 'ronin') targetTimeScale = 0.05;  // 5% Speed for clash
    } else if (s.focus.active && s.focus.energy > 0) {
      targetTimeScale = 0.15; // Standard Iaijutsu Slow Mo
    }
    
    s.currentTimeScale += (targetTimeScale - s.currentTimeScale) * 0.1;
    const dt = unscaledDt * s.currentTimeScale;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (s.hitPause > 0) {
      s.hitPause -= unscaledDt; 
      requestRef.current = requestAnimationFrame(gameLoop);
      return; 
    }

    if (gameState === 'PLAYING') {
      s.cameraSpeed = BASE_SPEED + (s.distance * 0.0003);
      s.distance += s.cameraSpeed * dt;
      setScore(Math.floor(s.distance / 100));

      const inVillage = isVillageBiome(s.distance);

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
           s.boss.hp = 15;
           s.boss.maxHp = 15;
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
            
            const distanceScale = Math.floor((s.distance - 3000) / 1500); 
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
            s.boss.nextTrigger = Math.max(5000, s.distance + 1500); // Trigger Ronin soon after
            s.boss.nextType = 'ronin';
            s.focus.active = false; s.focus.path = [];
            
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

      // Monk
      s.monk.runCycle += 0.2 * dt;
      if (s.monk.x < MONK_TARGET_X) s.monk.x += 1.5 * dt; 
      if (s.monk.x < 0) handleGameOver();

      // Spawning Targets & Foreground (Only if boss is not active)
      if (!s.boss.active) {
        s.spawnTimer += dt;
        const currentSpawnRate = Math.max(40, 100 - (s.distance * 0.005));
        if (s.spawnTimer > currentSpawnRate) {
          spawnBamboo(canvas.width, canvas.height);
          s.spawnTimer = 0;
          if (inVillage && Math.random() > 0.4) {
             s.debris.push({ x: canvas.width + 50, y: canvas.height - GROUND_HEIGHT - 50 - Math.random() * 250, vx: -3 - Math.random() * 3, vy: -1 + Math.random() * 2, life: 3 + Math.random() * 2, type: 'ember' });
          }
        }

        s.fgTimer += dt;
        if (s.fgTimer > 150) {
          s.fgTimer = 0;
          if (Math.random() > 0.3) {
            s.foreground.push({
              x: canvas.width + 100,
              type: inVillage ? (Math.random() > 0.6 ? 'lantern' : 'torii_fg') : 'tree',
              parallax: 1.5 + Math.random() * 0.8
            });
          }
        }
      }

      // Entities & Collisions (Bamboo)
      for (let i = s.bamboo.length - 1; i >= 0; i--) {
        const b = s.bamboo[i];
        b.x -= s.cameraSpeed * dt;
        if (b.hitCooldown > 0) b.hitCooldown -= unscaledDt;

        if (b.x < -100) { s.bamboo.splice(i, 1); continue; }

        if (!s.focus.active && s.sword.isSlashing && s.sword.trail.length > 1 && b.hitCooldown <= 0) {
          const p1 = s.sword.trail[1]; const p2 = s.sword;
          const dSq = distToSegmentSquared({x: b.x, y: (p1.y+p2.y)/2}, p1, p2);
          
          if (dSq < (b.width * 2)**2 && p2.y > b.y && p2.y < b.y + b.height) {
            const dy = Math.abs(p1.y - p2.y); const dx = Math.abs(p1.x - p2.x);

            if ((b.type === 'vertical' && dy < dx * 1.5) || (b.type === 'horizontal' && dx < dy * 1.5)) {
               s.shake = 3; b.hitCooldown = 15;
               for(let p=0; p<4; p++) s.debris.push({ x: b.x, y: p2.y, vx: -5 - Math.random()*5, vy: (Math.random()-0.5)*5, life: 1, type: 'ink', color: PALETTE.fadedInk });
               continue;
            }

            if (b.type === 'thick') {
              b.hp -= 1; b.hitCooldown = 10; s.shake = 4; s.hitPause = 1;
              for(let p=0; p<5; p++) s.debris.push({ x: b.x, y: p2.y, vx: (Math.random()-0.5)*10, vy: -2 - Math.random()*5, life: 1, type: 'ink', color: PALETTE.ink });
              if (b.hp <= 0) sliceBamboo(b, i, s, p2.y);
              continue;
            }

            sliceBamboo(b, i, s, p2.y);
            continue; 
          }
        }

        if (Math.abs(b.x - s.monk.x) < 20 && s.monk.y > b.y) {
          s.monk.x -= (s.cameraSpeed + 3) * dt; 
        }
      }

      // Debris Physics
      for (let i = s.debris.length - 1; i >= 0; i--) {
        const d = s.debris[i];
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.type === 'stalk') { d.vy += 0.5 * dt; d.rot += d.rv * dt; } 
        else if (d.type === 'ink') { d.vy += 0.2 * dt; } 
        else if (d.type === 'leaf') { d.vy += 0.05 * dt; d.x += Math.sin(time * 0.005 + d.y) * 2 * dt; }
        else if (d.type === 'ember') { d.x += Math.sin(time * 0.003 + d.y) * 2 * dt; d.vy -= 0.02 * dt; } 
        d.life -= 0.02 * dt;
        if (d.life <= 0 || d.y > canvas.height) s.debris.splice(i, 1);
      }

      // Parallax Scenery
      s.scenery.forEach(m => {
        m.x -= (s.cameraSpeed * m.parallax) * dt;
        if (m.x + m.width < -100) {
          Object.assign(m, spawnScenery(canvas.width + Math.random() * 200, canvas.width, canvas.height, m.isDistant, s.distance));
        }
      });

      // Foreground Parallax
      for (let i = s.foreground.length - 1; i >= 0; i--) {
        const fg = s.foreground[i];
        fg.x -= (s.cameraSpeed * fg.parallax) * dt;
        if (fg.x < -200) s.foreground.splice(i, 1);
      }
    }

    // --- RENDERING ---
    
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(canvas.width * 0.75, canvas.height * 0.45, Math.min(canvas.width, canvas.height) * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = s.focus.active ? '#7f1d1d' : 'rgba(185, 28, 28, 0.85)';
    ctx.fill();

    // Boss Warning Lightning Effects (Shared by both bosses)
    if (s.boss.active && s.boss.phase === 'warning' && gameState === 'PLAYING') {
      if (s.boss.warningTimer % 15 < 3) {
          ctx.beginPath();
          let lx = canvas.width * (0.6 + Math.random() * 0.3);
          let ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < canvas.height) {
              lx += (Math.random() - 0.5) * 100;
              ly += 50 + Math.random() * 50;
              ctx.lineTo(lx, ly);
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 4 + Math.random() * 6;
          ctx.stroke();
      }
    }

    // Dim background for Iaijutsu or Boss
    if ((s.focus.active || s.boss.active) && gameState === 'PLAYING') {
      const darkenAlpha = s.boss.phase === 'warning' ? Math.min(0.8, (s.boss.warningTimer / 60)) : 0.8;
      ctx.fillStyle = `rgba(28, 25, 23, ${darkenAlpha})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    if (s.shake > 0) {
      ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      s.shake *= 0.85;
      if (s.shake < 0.5) s.shake = 0;
    }

    // Boss Phase Vignette and Text
    if (s.boss.active && s.boss.phase === 'active') {
      const grad = ctx.createRadialGradient(s.monk.x, s.monk.y - 20, 50, s.monk.x, s.monk.y - 20, canvas.width * 0.8);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(28, 25, 23, 0.9)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = `rgba(185, 28, 28, ${0.6 + Math.sin(time*0.005)*0.3})`;
      ctx.font = 'italic 70px serif';
      ctx.textAlign = 'center';
      if (s.boss.type === 'archer') ctx.fillText("STRIKE TRUE", canvas.width / 2, canvas.height / 2 + 180);
      else if (s.boss.type === 'ronin') ctx.fillText("CLASH!", canvas.width / 2, canvas.height / 2 + 180);
    } else if (s.boss.active && s.boss.phase === 'warning') {
      ctx.fillStyle = `rgba(185, 28, 28, ${Math.sin(time*0.02) * 0.5 + 0.5})`;
      ctx.font = 'italic 50px serif';
      ctx.textAlign = 'center';
      if (s.boss.type === 'archer') ctx.fillText("KILLER INTENT", canvas.width / 2, canvas.height / 2 - 100);
      else if (s.boss.type === 'ronin') ctx.fillText("SHADOW RONIN", canvas.width / 2, canvas.height / 2 - 100);
    }

    // Scenery helper & drawing
    const drawSceneryElement = (m, color) => {
      ctx.fillStyle = color;
      const isFocus = s.focus.active || s.boss.active;
      const glowFill = isFocus ? 'transparent' : (m.isDistant ? PALETTE.mutedGlow : PALETTE.warmGlow);

      if (m.type === 'mountain') {
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.quadraticCurveTo(m.x + m.width/2, m.y - m.height * 1.5, m.x + m.width, m.y); ctx.fill();
      } else if (m.type === 'house') {
        const hHeight = m.height * 0.6; ctx.fillRect(m.x + 20, m.y - hHeight, m.width - 40, hHeight); 
        if (!isFocus) {
          ctx.fillStyle = glowFill; const winW = (m.width - 80) / 2;
          if (winW > 0) {
             ctx.fillRect(m.x + 30, m.y - hHeight + 20, winW, hHeight - 40); ctx.fillRect(m.x + m.width - 30 - winW, m.y - hHeight + 20, winW, hHeight - 40);
             ctx.fillStyle = color;
             ctx.fillRect(m.x + 30 + winW/2 - 1, m.y - hHeight + 20, 2, hHeight - 40); ctx.fillRect(m.x + m.width - 30 - winW/2 - 1, m.y - hHeight + 20, 2, hHeight - 40);
             ctx.fillRect(m.x + 30, m.y - hHeight + 20 + (hHeight-40)/2, winW, 2); ctx.fillRect(m.x + m.width - 30 - winW, m.y - hHeight + 20 + (hHeight-40)/2, winW, 2);
          }
        }
        ctx.fillStyle = color; 
        ctx.beginPath(); ctx.moveTo(m.x - 30, m.y - hHeight + 20); ctx.quadraticCurveTo(m.x + 10, m.y - hHeight, m.x + m.width/2, m.y - m.height); 
        ctx.quadraticCurveTo(m.x + m.width - 10, m.y - hHeight, m.x + m.width + 30, m.y - hHeight + 20); ctx.lineTo(m.x + m.width - 10, m.y - hHeight); ctx.lineTo(m.x + 10, m.y - hHeight); ctx.fill();
      } else if (m.type === 'pagoda') {
        const tiers = 5; const tHeight = m.height / tiers; ctx.fillRect(m.x + m.width/2 - 6, m.y - m.height - 40, 12, m.height + 40); 
        for(let i=0; i<tiers; i++) {
          const tw = m.width * (1 - (i * 0.15)); const tx = m.x + (m.width - tw)/2; const ty = m.y - (i * tHeight);
          ctx.fillRect(tx + 15, ty - tHeight, tw - 30, tHeight); 
          if (!isFocus && i > 0) {
             ctx.fillStyle = glowFill; ctx.fillRect(tx + 25, ty - tHeight + 10, tw - 50, tHeight - 20);
             ctx.fillStyle = color; ctx.fillRect(tx + tw/2 - 2, ty - tHeight + 10, 4, tHeight - 20); 
          }
          ctx.beginPath(); ctx.moveTo(tx - 25, ty - tHeight + 15); ctx.quadraticCurveTo(tx + 5, ty - tHeight - 5, tx + tw/2, ty - tHeight - 25);
          ctx.quadraticCurveTo(tx + tw - 5, ty - tHeight - 5, tx + tw + 25, ty - tHeight + 15); ctx.lineTo(tx + tw - 5, ty - tHeight); ctx.lineTo(tx + 5, ty - tHeight); ctx.fill();
        }
      } else if (m.type === 'torii') {
        ctx.fillRect(m.x + 20, m.y - m.height, 16, m.height); ctx.fillRect(m.x + m.width - 36, m.y - m.height, 16, m.height); ctx.fillRect(m.x + 10, m.y - m.height + 30, m.width - 20, 12); 
        ctx.beginPath(); ctx.moveTo(m.x - 10, m.y - m.height + 10); ctx.quadraticCurveTo(m.x + m.width/2, m.y - m.height - 10, m.x + m.width + 10, m.y - m.height + 10);
        ctx.lineTo(m.x + m.width + 10, m.y - m.height + 25); ctx.quadraticCurveTo(m.x + m.width/2, m.y - m.height + 5, m.x - 10, m.y - m.height + 25); ctx.fill();
      }
    };

    s.scenery.filter(m => m.isDistant).forEach(m => drawSceneryElement(m, s.focus.active || s.boss.active ? PALETTE.ink : PALETTE.distantInk));
    s.scenery.filter(m => !m.isDistant).forEach(m => drawSceneryElement(m, s.focus.active || s.boss.active ? PALETTE.ink : PALETTE.lightInk));

    const fogGrd = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT - 120, 0, canvas.height - GROUND_HEIGHT);
    fogGrd.addColorStop(0, 'rgba(244, 241, 234, 0)'); fogGrd.addColorStop(1, s.focus.active || s.boss.active ? 'rgba(28, 25, 23, 1)' : PALETTE.paper); 
    ctx.fillStyle = fogGrd; ctx.fillRect(0, canvas.height - GROUND_HEIGHT - 120, canvas.width, 120);

    ctx.fillStyle = PALETTE.ground; ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    ctx.beginPath(); ctx.moveTo(0, canvas.height - GROUND_HEIGHT);
    for(let i=0; i<=canvas.width; i+=20) {
      const worldX = i + s.distance; const bump = Math.sin(worldX * 0.02) * 5 + Math.sin(worldX * 0.05) * 3;
      ctx.lineTo(i, canvas.height - GROUND_HEIGHT - 4 + bump);
    }
    ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.fill();

    // Boss Entity Drawing
    if (s.boss.active && s.boss.type === 'archer') {
      s.boss.arrows.forEach(arr => {
        if (arr.sliced) return;
        ctx.save(); ctx.translate(arr.x, arr.y); ctx.rotate(arr.angle);
        if (arr.isCrimson) {
          ctx.strokeStyle = PALETTE.crimson; ctx.fillStyle = PALETTE.crimson; ctx.shadowColor = PALETTE.crimson; ctx.shadowBlur = 15;
        } else {
          ctx.strokeStyle = PALETTE.paper; ctx.fillStyle = PALETTE.paper;
        }
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(15, 0); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(-45, -8); ctx.lineTo(-20, 0); ctx.lineTo(-45, 8); ctx.fill();
        ctx.restore();
      });
    }

    if (s.boss.active && s.boss.type === 'ronin') {
      const rx = s.boss.x; const ry = s.boss.y;
      const scale = s.boss.scale || 1;
      
      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(-scale, scale); // Mirror context and apply dynamic depth scale
      
      // Ghostly Red Aura
      ctx.fillStyle = `rgba(185, 28, 28, ${Math.random() * 0.4 + 0.1})`;
      ctx.beginPath(); ctx.arc(0, -30, 40 + Math.random()*15, 0, Math.PI*2); ctx.fill();

      // Body 
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.lineTo(12, -35); ctx.lineTo(-12, -35); ctx.fill();
      
      // Tattered Kasa (Hat)
      ctx.beginPath(); ctx.moveTo(-25, -40); ctx.lineTo(25, -40); ctx.lineTo(0, -55); ctx.fill();

      // Glowing Red Eye
      ctx.fillStyle = PALETTE.crimson;
      ctx.shadowColor = PALETTE.crimson; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(-8, -32, 4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

      // Wild Scarf
      const rScarfWave = Math.sin(time*0.02) * 15;
      ctx.lineWidth = 4; ctx.strokeStyle = PALETTE.crimson;
      ctx.beginPath(); ctx.moveTo(-6, -38); ctx.quadraticCurveTo(-35, -25 + rScarfWave, -55, -35 - Math.random()*15); ctx.stroke();

      // Legs
      ctx.lineWidth = 5; ctx.strokeStyle = PALETTE.ink;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, 15); ctx.stroke();
      ctx.restore();

      // Ronin UI & Slash FX (Rendered un-scaled for clarity)
      if (s.boss.phase === 'active') {
        const hpW = 120;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(rx - hpW/2, ry - 80 * scale, hpW, 8);
        ctx.fillStyle = PALETTE.crimson; ctx.fillRect(rx - hpW/2, ry - 80 * scale, hpW * (s.boss.hp / s.boss.maxHp), 8);
        
        if (s.boss.hitCooldown > 0) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(rx - 40*scale + Math.random()*80*scale, ry - 60*scale + Math.random()*60*scale); ctx.lineTo(rx - 40*scale + Math.random()*80*scale, ry - 60*scale + Math.random()*60*scale); ctx.stroke();
        }
      }
    }

    // Bamboo
    s.bamboo.forEach(b => {
      ctx.save();
      const sway = Math.sin(time * 0.002 + b.swayOffset) * 0.05;
      ctx.translate(b.x, canvas.height - GROUND_HEIGHT); ctx.rotate(sway); ctx.translate(-b.x, -(canvas.height - GROUND_HEIGHT));

      ctx.fillStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : PALETTE.ink;
      ctx.fillRect(b.x - b.width/2, b.y, b.width, b.height);

      ctx.fillStyle = PALETTE.paper;
      for(let n = b.y + 40; n < b.y + b.height; n += 60) ctx.fillRect(b.x - b.width/2 - 2, n, b.width + 4, 2);

      if (b.type === 'vertical') {
        ctx.fillStyle = PALETTE.crimson; ctx.fillRect(b.x - 2, b.y + 40, 4, 100);
      } else if (b.type === 'horizontal') {
        ctx.fillStyle = PALETTE.crimson; ctx.fillRect(b.x - b.width/2 - 10, b.y + 80, b.width + 20, 4);
      } else if (b.type === 'thick') {
        ctx.fillStyle = PALETTE.paper;
        if (b.hp <= 2) { ctx.beginPath(); ctx.moveTo(b.x - b.width/2, b.y + 60); ctx.lineTo(b.x + 5, b.y + 70); ctx.lineTo(b.x - b.width/2, b.y + 75); ctx.fill(); }
        if (b.hp <= 1) { ctx.beginPath(); ctx.moveTo(b.x + b.width/2, b.y + 120); ctx.lineTo(b.x - 5, b.y + 130); ctx.lineTo(b.x + b.width/2, b.y + 135); ctx.fill(); }
      }
      ctx.restore();
    });

    // Debris
    s.debris.forEach(d => {
      ctx.globalAlpha = (d.type === 'ink' || d.type === 'ember') ? Math.min(1, Math.max(0, d.life)) : 1;
      if (d.type === 'ink') {
         ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(d.x, d.y, 2 + Math.random()*4, 0, Math.PI*2); ctx.fill();
      } else if (d.type === 'leaf') {
         ctx.fillStyle = PALETTE.fadedInk; ctx.beginPath(); ctx.ellipse(d.x, d.y, 6, 2, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      } else if (d.type === 'stalk') {
         ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.fillStyle = PALETTE.ink; ctx.fillRect(-d.width/2, -d.height/2, d.width, d.height); ctx.restore();
      } else if (d.type === 'ember') {
         if (!s.focus.active && !s.boss.active) {
            ctx.fillStyle = PALETTE.warmGlow; ctx.shadowColor = PALETTE.warmGlow; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; 
         }
      }
      ctx.globalAlpha = 1;
    });

    // Monk
    if (gameState === 'PLAYING') {
      const mx = s.monk.x; const my = s.monk.y;
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath(); ctx.moveTo(mx - 15, my); ctx.lineTo(mx + 15, my); ctx.lineTo(mx + 10, my - 30); ctx.lineTo(mx - 10, my - 30); ctx.fill();
      
      const headOffset = Math.sin(s.monk.runCycle * 2) * 2;
      ctx.beginPath(); ctx.moveTo(mx - 20, my - 35 + headOffset); ctx.lineTo(mx + 20, my - 35 + headOffset); ctx.lineTo(mx, my - 45 + headOffset); ctx.fill();

      const scarfWave = Math.sin(s.monk.runCycle * 1.5) * 10;
      ctx.beginPath(); ctx.moveTo(mx - 5, my - 32 + headOffset); ctx.quadraticCurveTo(mx - 25, my - 25 + scarfWave, mx - 40, my - 28 - scarfWave);
      ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.emerald; ctx.stroke();

      const legStride = Math.sin(s.monk.runCycle) * 15;
      ctx.lineWidth = 4; ctx.strokeStyle = PALETTE.ink;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + legStride, my + 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - legStride, my + 15); ctx.stroke();
    }

    // Foreground Parallax 
    s.foreground.forEach(fg => {
      ctx.fillStyle = '#050404'; 
      if (fg.type === 'tree') {
        ctx.fillRect(fg.x, -50, 80, canvas.height + 100);
        ctx.fillStyle = '#1c1917';
        for(let n=0; n<canvas.height; n+=120) ctx.fillRect(fg.x-5, n, 90, 8); 
      } else if (fg.type === 'lantern') {
        ctx.fillRect(fg.x, -50, 40, canvas.height + 100); 
        ctx.fillRect(fg.x - 60, 100, 160, 30); ctx.fillRect(fg.x - 50, 130, 60, 80); 
        if (!s.focus.active && !s.boss.active) {
          ctx.fillStyle = PALETTE.warmGlow; ctx.shadowColor = PALETTE.warmGlow; ctx.shadowBlur = 30;
          ctx.fillRect(fg.x - 40, 140, 40, 60); ctx.shadowBlur = 0; 
        }
      } else if (fg.type === 'torii_fg') {
         ctx.fillRect(fg.x, -50, 150, canvas.height + 100); 
      }
    });

    // Brush/Sword Trail
    if (!s.focus.active && s.sword.trail.length > 1 && !(s.boss.active && s.boss.type === 'archer')) {
      ctx.beginPath(); ctx.moveTo(s.sword.trail[0].x, s.sword.trail[0].y);
      for (let i = 1; i < s.sword.trail.length; i++) ctx.lineTo(s.sword.trail[i].x, s.sword.trail[i].y);
      ctx.strokeStyle = s.sword.isSlashing ? PALETTE.ink : PALETTE.lightInk;
      ctx.lineWidth = s.sword.isSlashing ? 8 : 3;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    }

    // Focus Path
    if (s.focus.active && s.focus.path.length > 0) {
      ctx.beginPath(); ctx.moveTo(s.focus.path[0].x, s.focus.path[0].y);
      for (let i = 1; i < s.focus.path.length; i++) ctx.lineTo(s.focus.path[i].x, s.focus.path[i].y);
      ctx.strokeStyle = PALETTE.crimson; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash([15, 10]); ctx.stroke(); ctx.setLineDash([]);
      
      ctx.beginPath(); ctx.arc(s.mouse.x, s.mouse.y, 12 + Math.sin(time*0.01)*6, 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE.crimson; ctx.lineWidth = 2; ctx.stroke();
    }

    // Screen Flash 
    if (s.flashHit > 0) {
      ctx.fillStyle = `rgba(${s.flashColor}, ${s.flashHit})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      s.flashHit -= 0.05 * (deltaTime/16); 
    }

    ctx.restore(); 

    // UI Overlays
    if (gameState === 'PLAYING') {
      const isVillage = isVillageBiome(s.distance);
      const biomeAlpha = Math.max(0, 1 - ((s.distance % BIOME_LENGTH) / 300)); 
      if (biomeAlpha > 0 && !s.boss.active) {
         ctx.fillStyle = `rgba(185, 28, 28, ${biomeAlpha})`;
         ctx.font = 'italic 40px serif';
         ctx.textAlign = 'center';
         ctx.fillText(isVillage ? "NINJA VILLAGE" : "BAMBOO FOREST", canvas.width / 2, 80);
      }

      const barWidth = 200;
      const barX = canvas.width / 2 - barWidth / 2;
      const barY = canvas.height - 40;
      ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barWidth, 12);
      
      if (s.boss.active && s.boss.type === 'archer') {
        ctx.fillStyle = PALETTE.crimson; ctx.fillRect(barX + 2, barY + 2, barWidth - 4, 8);
        ctx.fillStyle = PALETTE.ink; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center';
        ctx.fillText("INFINITE FOCUS", canvas.width / 2, barY - 10);
      } else {
        ctx.fillStyle = s.focus.energy >= 30 ? PALETTE.crimson : PALETTE.fadedInk;
        ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * (s.focus.energy / MAX_FOCUS), 8);
        ctx.fillStyle = PALETTE.ink; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center';
        ctx.fillText("HOLD CLICK: IAIJUTSU", canvas.width / 2, barY - 10);
      }

      if (s.boss.active && s.boss.type === 'ronin' && s.boss.phase === 'active') {
        const timeLeft = Math.max(0, 150 - s.boss.timer);
        ctx.fillStyle = PALETTE.crimson;
        ctx.fillRect(barX + 2, barY + 2, barWidth - 4, 8);
        ctx.fillStyle = PALETTE.ink; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center';
        ctx.fillText("INFINITE FOCUS", canvas.width / 2, barY - 10);
      } else {
        ctx.fillStyle = s.focus.energy >= 30 ? PALETTE.crimson : PALETTE.fadedInk;
        ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * (s.focus.energy / MAX_FOCUS), 8);
        ctx.fillStyle = PALETTE.ink; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center';
        ctx.fillText("HOLD CLICK: IAIJUTSU", canvas.width / 2, barY - 10);
      }

      if (s.boss.active && s.boss.type === 'ronin' && s.boss.phase === 'active') {
        // Distance based "time left" bar
        const maxDist = 360; // Total dash distance
        const currentDist = Math.max(0, s.boss.x - (s.monk.x + 40));
        ctx.fillStyle = PALETTE.crimson;
        ctx.fillRect(canvas.width/2 - 150, 100, 300 * (currentDist/maxDist), 10);
        ctx.strokeStyle = '#fff'; ctx.lineWidth=2; ctx.strokeRect(canvas.width/2 - 150, 100, 300, 10);
      }
    }

    if (gameState === 'PLAYING' && s.monk.x < MONK_TARGET_X - 20) {
      const danger = 1 - (s.monk.x / MONK_TARGET_X);
      ctx.fillStyle = `rgba(28, 25, 23, ${danger * 0.4})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  // --- Input Handling ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handlePointerDown = (e) => {
      if (gameState !== 'PLAYING') return;
      const s = state.current;
      // Do not allow Iaijutsu against Ronin. You MUST swipe!
      if (s.focus.energy > 30 && (!s.boss.active || s.boss.type !== 'ronin')) { 
        s.focus.active = true; s.focus.path = [getMousePos(e)]; s.sword.trail = []; 
      }
    };

    const handlePointerMove = (e) => {
      const s = state.current;
      const pos = getMousePos(e);
      s.mouse.x = pos.x; s.mouse.y = pos.y;
      
      if (s.focus.active) {
        const lastP = s.focus.path[s.focus.path.length - 1];
        if (!lastP || distSq(pos, lastP) > 100) s.focus.path.push(pos);
      }
      if (e.touches) e.preventDefault(); 
    };

    const handlePointerUp = () => {
      const s = state.current;
      if (s.focus.active) {
        s.focus.active = false;

        if (s.boss.active && s.boss.type === 'archer' && s.boss.phase === 'active' && s.focus.path.length > 1) {
          let hitCrimson = false;

          for (let i = 0; i < s.boss.arrows.length; i++) {
            const arr = s.boss.arrows[i];
            if (arr.sliced) continue;

            let hit = false;
            for (let j = 0; j < s.focus.path.length - 1; j++) {
              if (distToSegmentSquared(arr, s.focus.path[j], s.focus.path[j+1]) < 30 * 30) {
                hit = true; break;
              }
            }

            if (hit) {
              arr.sliced = true;
              if (arr.isCrimson) {
                hitCrimson = true; break; 
              } else {
                for(let p=0; p<8; p++) s.debris.push({ x: arr.x, y: arr.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1.5, type: 'ink', color: PALETTE.paper });
              }
            }
          }

          if (hitCrimson) {
            s.shake = 20; s.flashHit = 1.0; s.flashColor = '185, 28, 28';
            s.focus.path = [];
            handleGameOver();
            return;
          }
        } 
        else if (s.focus.path.length > 1 && s.focus.energy > 0 && !s.boss.active) {
          s.flashHit = 1.0; s.shake = 15; s.hitPause = 5; s.flashColor = '255, 255, 255';
          let targetsSliced = false;

          for (let i = s.bamboo.length - 1; i >= 0; i--) {
            const b = s.bamboo[i]; let hit = false;
            for (let j = 0; j < s.focus.path.length - 1; j++) {
              if (distToSegmentSquared({x: b.x, y: s.focus.path[j].y}, s.focus.path[j], s.focus.path[j+1]) < (b.width*3)**2 && s.focus.path[j].y > b.y) {
                hit = true; break;
              }
            }
            if (hit) {
              targetsSliced = true;
              sliceBamboo(b, i, s, b.y + 100);
              s.debris.push({ x: b.x, y: b.y + 100, vx: 0, vy: 0, life: 1.5, type: 'ink', color: PALETTE.paper });
            }
          }
          if (targetsSliced) s.focus.energy = Math.max(0, s.focus.energy - 40); 
        }
        
        s.focus.path = [];
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp, { passive: false });

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerUp);
    };
  }, [gameState]);

  // --- Setup & Resize ---
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        state.current.monk.y = window.innerHeight - GROUND_HEIGHT - 15;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none font-serif" style={{ backgroundColor: PALETTE.paper }}>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block touch-none cursor-crosshair" />
      
      {/* HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-8 right-10 pointer-events-none text-right">
          <div className="text-6xl text-[#1c1917] tracking-widest" style={{fontFamily: '"Times New Roman", Times, serif', textShadow: '2px 2px 0px #f4f1ea'}}>
            {score.toString().padStart(5, '0')}
          </div>
          <div className="text-sm font-bold tracking-widest text-[#78716c] mt-2">
             PACES
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f1ea]/80 backdrop-blur-sm z-10 pointer-events-none">
          <h1 className="text-7xl font-bold text-[#1c1917] tracking-tighter mb-8 italic" style={{fontFamily: '"Times New Roman", Times, serif'}}>
            Tameshigiri
          </h1>
          <div className="max-w-xl text-center text-[#1c1917] space-y-4 mb-8 p-10 bg-[#f4f1ea] rounded-sm shadow-2xl border-2 border-[#1c1917]">
            <p className="text-2xl italic text-[#b91c1c] border-b-2 border-[#1c1917] pb-4 font-serif">
              Test your blade against the bamboo grove.
            </p>
            <ul className="text-left space-y-4 text-lg font-serif mt-6">
              <li className="flex items-center">
                <strong className="mr-3 w-32 shrink-0">Standard:</strong> Swipe fast to cut normal bamboo.
              </li>
              <li className="flex items-center">
                <strong className="mr-3 w-32 shrink-0 text-[#78716c]">Thick Bamboo:</strong> Requires 3 rapid strikes.
              </li>
              <li className="flex items-start mt-6 pt-4 border-t border-[#d6d3d1]">
                <div>
                  <strong className="block text-[#b91c1c] mb-1">The Archer's Volley (3000 Paces):</strong> 
                  Time will freeze. Hold click to carefully paint a path that cuts <span className="font-bold underline">only normal arrows</span>. 
                </div>
              </li>
              <li className="flex items-start mt-2">
                <div>
                  <strong className="block text-[#b91c1c] mb-1">The Shadow Ronin (5000 Paces):</strong> 
                  Defend yourself in a frantic clash by swiping back and forth 15 times before time runs out.
                </div>
              </li>
            </ul>
          </div>
          <button onClick={resetGame} className="pointer-events-auto px-16 py-4 bg-[#b91c1c] text-[#f4f1ea] font-serif font-bold text-2xl tracking-widest shadow-xl hover:bg-[#991b1b] transition-all border-2 border-[#1c1917]">
            Begin
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1917]/90 backdrop-blur-md z-10 pointer-events-none">
          <div className="w-24 h-24 mb-6 rounded-full border-4 border-[#b91c1c] flex items-center justify-center">
            <span className="text-[#b91c1c] text-5xl font-serif">無</span>
          </div>
          <h2 className="text-5xl font-serif text-[#f4f1ea] mb-2 tracking-widest italic">
            Focus Lost
          </h2>
          <div className="text-[#d6d3d1] text-2xl mb-12 font-serif">
            Paces Traveled: <span className="text-[#b91c1c] font-bold text-4xl ml-2">{score}</span>
          </div>
          <button onClick={resetGame} className="pointer-events-auto px-16 py-4 bg-transparent border-2 border-[#f4f1ea] text-[#f4f1ea] font-serif font-bold text-xl tracking-widest hover:bg-[#f4f1ea] hover:text-[#1c1917] transition-all">
            Walk Again
          </button>
        </div>
      )}
    </div>
  );
}