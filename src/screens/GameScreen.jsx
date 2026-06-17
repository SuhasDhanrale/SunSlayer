import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop.js';

import { PALETTE, GROUND_HEIGHT, MONK_TARGET_X, SLASH_THRESHOLD, BASE_SPEED, MAX_FOCUS, BIOME_LENGTH, getBiome } from '../config/constants.js';
import { GameRenderer } from '../renderer/GameRenderer.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { BossSystem } from '../systems/BossSystem.js';
import { Persistence } from '../core/Persistence.js';
import { DebugLogger } from '../debug/DebugLogger.js';

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

export function GameScreen({ setGameState, setGlobalScore }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);

  // Mutable Game State for 60fps loop
  const state = useRef({
    monk: { x: MONK_TARGET_X, y: 1080 - GROUND_HEIGHT, runCycle: 0 },
    sword: { x: 1920 / 2, y: 1080 / 2, trail: [], isSlashing: false },
    mouse: { x: 1920 / 2, y: 1080 / 2 },
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
      SpawnSystem.createScenery(0, 1920, 1080, true, 0), SpawnSystem.createScenery(600, 1920, 1080, true, 0), SpawnSystem.createScenery(1200, 1920, 1080, true, 0), 
      SpawnSystem.createScenery(0, 1920, 1080, false, 0), SpawnSystem.createScenery(500, 1920, 1080, false, 0), SpawnSystem.createScenery(1000, 1920, 1080, false, 0)
    ],
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

  const handleGameOver = () => {
    const finalScore = Math.floor(state.current.distance / 100);
    const isNewHighScore = Persistence.updateScore(finalScore);
    setGlobalScore({ score: finalScore, isNewHighScore });
    setGameState('GAMEOVER');
  };


  // --- Main Engine ---
  const gameLoop = useCallback((time, dtMs, ctx, canvas, vp) => {
    try {
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

      if (!canvas) return;
      if (!ctx) return;

      if (s.hitPause > 0) {
        s.hitPause -= unscaledDt; 
        return; 
      }

      if ('PLAYING' === 'PLAYING') {
        // Ground-anchored entities track the live canvas height (which now
        // varies with the viewport's aspect ratio) so nothing floats or sinks.
        const groundY = canvas.height - GROUND_HEIGHT;
        s.monk.y = groundY;
        for (const m of s.scenery) m.y = groundY;
        s.cameraSpeed = BASE_SPEED + (s.distance * 0.0003);
        s.distance += s.cameraSpeed * dt;
        setScore(Math.floor(s.distance / 100));

        const inVillage = getBiome(s.distance);

        BossSystem.tick(s, dt, unscaledDt, handleGameOver);

        CombatSystem.tick(s, dt, unscaledDt);

        // Monk
        s.monk.runCycle += 0.2 * dt;
        if (s.monk.x < MONK_TARGET_X) s.monk.x += 1.5 * dt; 
        if (s.monk.x < 0) handleGameOver();

        SpawnSystem.tick(s, dt, canvas.width, canvas.height);
      } // End PLAYING state

      // Debug: log watched state transitions for this frame (after sim).
      DebugLogger.tick(s);

      // --- RENDERING ---
      PhysicsSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height, time);

      GameRenderer.render(ctx, s, canvas, time, 'PLAYING', getBiome(s.distance));
    } catch (e) {
      console.error(e);
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.font = '20px sans-serif';
        ctx.fillText(e.message, 50, 50);
        ctx.fillText(e.stack.substring(0, 100), 50, 80);
      }
    }
  }, ['PLAYING']);

  // --- Input Handling ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    DebugLogger.reset();

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return { 
        x: (clientX - rect.left) * (canvas.width / rect.width), 
        y: (clientY - rect.top) * (canvas.height / rect.height) 
      };
    };

    const handlePointerDown = (e) => {
      if ('PLAYING' !== 'PLAYING') return;
      const s = state.current;
      // Do not allow Iaijutsu against Ronin. You MUST swipe!
      if (s.focus.energy > 30 && (!s.boss.active || s.boss.type !== 'ronin')) {
        s.focus.active = true; s.focus.path = [getMousePos(e)]; s.sword.trail = [];
        DebugLogger.event('pointerDown → focus ON', { energy: Math.round(s.focus.energy), bossActive: s.boss.active, bossType: s.boss.type });
      } else {
        DebugLogger.event('pointerDown → focus BLOCKED', { energy: Math.round(s.focus.energy), bossActive: s.boss.active, bossType: s.boss.type, bossPhase: s.boss.phase });
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
        DebugLogger.event('pointerUp → focus OFF', { bossActive: s.boss.active, bossType: s.boss.type, bossPhase: s.boss.phase, pathLen: s.focus.path.length });

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
              CombatSystem.sliceBamboo(b, i, s, b.y + 100);
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
  }, ['PLAYING']);

  const vpRef = useGameLoop(canvasRef, gameLoop);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block touch-none cursor-crosshair" />
      
      {/* HUD */}
      <div className="absolute top-8 right-10 pointer-events-none text-right z-10">
        <div className="text-6xl text-[#1c1917] tracking-widest" style={{fontFamily: '"Times New Roman", Times, serif', textShadow: '2px 2px 0px #f4f1ea'}}>
          {score.toString().padStart(5, '0')}
        </div>
        <div className="text-sm font-bold tracking-widest text-[#78716c] mt-2">
           PACES
        </div>
      </div>
    </>
  );
}
