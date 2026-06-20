import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop.js';

import { PALETTE, GATE_CONFIG, GROUND_HEIGHT, MONK_TARGET_X, BASE_SPEED, MAX_FOCUS, STUMBLE, getSpeedFactor, WATER_SURFACE_FRAC } from '../config/constants.js';
import { GameRenderer } from '../renderer/GameRenderer.js';
import { VISUAL_BIOMES, CAVE_FACTORY } from '../renderer/BiomeBackgrounds.js';
import { BiomeSystem } from '../systems/BiomeSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { BossSystem } from '../systems/BossSystem.js';
import { SegmentSystem } from '../systems/SegmentSystem.js';
import { DemonSystem } from '../systems/DemonSystem.js';
import { RunDirector } from '../systems/RunDirector.js';
import { PatternRunner } from '../systems/PatternRunner.js';
import { SamuraiSystem } from '../systems/SamuraiSystem.js';
import { placeGate } from '../systems/ElementDirector.js';
import { DEFAULT_CHARACTER_ID } from '../data/characters.js';
import { DEFAULT_SLASH_ID } from '../data/slashes.js';
import { Persistence } from '../core/Persistence.js';
import { DebugLogger } from '../debug/DebugLogger.js';
import { PacingOverlay } from '../debug/PacingOverlay.js';

// --- Helper Math ---
const distSq = (p1, p2) => (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;

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
  const [combo, setCombo] = useState(0);     // surfaced when a slice chain is live
  const [runTime, setRunTime] = useState(0); // elapsed seconds

  // Mutable Game State for 60fps loop
  const state = useRef({
    // `falling` flips true when an un-cut bridge's pit reaches the monk
    // (PhysicsSystem); the loop then drops him into the pit and ends the run.
    monk: { x: MONK_TARGET_X, y: 1080 - GROUND_HEIGHT, runCycle: 0, falling: false, fallVy: 0 },
    // Equipped cosmetics. Defaults to the free starters; the future shop/
    // character-select writes the chosen ids here (and later, persistence).
    cosmetics: { characterId: DEFAULT_CHARACTER_ID, slashId: DEFAULT_SLASH_ID },
    sword: { x: 1920 / 2, y: 1080 / 2, trail: [], isSlashing: false },
    mouse: { x: 1920 / 2, y: 1080 / 2 },
    focus: { active: false, energy: MAX_FOCUS, path: [] },
    currentTimeScale: 1.0, 
    boss: {
      active: false, type: 'archer', phase: 'hidden', role: null, finishedRole: null,
      arrows: [],
      warningTimer: 0, hp: 0, maxHp: 0, hitCooldown: 0,
      x: 0, y: 0, vx: 0, vy: 0, timer: 0
    },
    // One continuous run; ElementDirector weaves obstacles, coins, and enemies.
    playerBiome: 'bamboo',
    spawnBiome: 'bamboo',
    visualBiome: 'rain',
    lastSpawnBiome: null,
    biome: 'bamboo',      // compatibility alias for playerBiome while older systems migrate
    biomeFlash: 0,        // debug: frames left on the "BIOME: X" banner after a switch
    segmentTime: 0,
    arrowCluster: null, // archer trigger cluster (null until the timer fires)
    stumble: { count: 0, slowTimer: 0 },
    bamboo: [],
    coins: [],
    // The Samurai: the run's one escalating pursuer (SamuraiSystem). tier 0 absent
    // → 1 watching → 2 drawn → 3 kill-duel (reuses the BossSystem ronin takeover).
    // Distinct from s.boss; lastStumble edge-detects new stumbles to escalate.
    samurai: { tier: 0, pose: 'absent', x: 0, y: 0, scale: 0.4, coolTimer: 0, lastStumble: 0 },
    elementTimer: 0,
    // Macro pacing: RunDirector (conductor) picks authored patterns from decks to
    // match an intensity curve; PatternRunner (executor) plays the current one.
    // Both self-init on first tick. director is replaced by RunDirector.ensureInit.
    director: { initialized: false },
    pattern: null,
    debugPacing: true, // live intensity overlay during playtest (toggle: 'i' key)
    demons: [],
    combo: 0,
    comboTimer: 0,
    debris: [],
    scenery: [
      SpawnSystem.createScenery(0, 1920, 1080, true, 'bamboo'), SpawnSystem.createScenery(600, 1920, 1080, true, 'bamboo'), SpawnSystem.createScenery(1200, 1920, 1080, true, 'bamboo'),
      SpawnSystem.createScenery(0, 1920, 1080, false, 'bamboo'), SpawnSystem.createScenery(500, 1920, 1080, false, 'bamboo'), SpawnSystem.createScenery(1000, 1920, 1080, false, 'bamboo')
    ],
    foreground: [],
    hitPause: 0,
    shake: 0,
    flashHit: 0,
    flashColor: '255, 255, 255',
    cameraSpeed: BASE_SPEED,
    lastTime: 0,
    runStart: 0,
    spawnTimer: 0,
    fgTimer: 0,
    distance: 0,
    // Bonus points from slicing/combos/coins/bosses (CombatSystem & BossSystem add
    // here). Displayed score = paces (distance/100) + this. Resets each run.
    score: 0,
  });

  // VISUAL biome timeline instances: one stateful renderer per registered biome plus
  // the shared cave transition tunnel. BiomeSystem sequences these off the schedule.
  const biomesRef = useRef(null);
  if (!biomesRef.current) {
    biomesRef.current = Object.fromEntries(
      Object.entries(VISUAL_BIOMES).map(([k, def]) => [k, def.make()])
    );
    biomesRef.current.cave = CAVE_FACTORY();
  }
  // Backdrop object handed to GameRenderer: it owns the whole environment layer, so
  // GameRenderer skips its default paper/sun/scenery/ground.
  const biomeViewRef = useRef(null);
  if (!biomeViewRef.current) {
    biomeViewRef.current = {
      render: (ctx, w, h) => BiomeSystem.draw(ctx, state.current, biomesRef.current, w, h),
    };
  }

  const handleGameOver = () => {
    const finalScore = Math.floor(state.current.distance / 100) + state.current.score;
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
        else if (s.boss.phase === 'active' && s.boss.type === 'archer') targetTimeScale = 0.4; // playable slow-mo: slash arrows by hand
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

      {
        // Ground-anchored entities track the live canvas height (which now
        // varies with the viewport's aspect ratio) so nothing floats or sinks.
        const groundY = canvas.height - GROUND_HEIGHT;
        // The monk travels on the VISUAL biome's lane, glided by BiomeSystem's
        // laneFrac (0 = ground, 1 = water surface). During a cave transition this
        // ramps across the enclosed middle, so a ground→water leg lifts the monk to
        // the swim surface (with bob) before he emerges — never a snap.
        const waterLaneY = canvas.height * WATER_SURFACE_FRAC;
        const laneFrac = s.biomeSeq ? s.biomeSeq.laneFrac : 0;
        const laneY = groundY + (waterLaneY - groundY) * laneFrac;
        if (!s.monk.falling) s.monk.y = laneY + Math.sin(time * 0.004) * 10 * laneFrac;
        for (const m of s.scenery) m.y = groundY;

        // Camera speed: a TIERED, time-based ramp (rise → plateau → rise → … → max).
        // Reduced while stumbling. See getSpeedFactor / data.speed.tiers.
        const elapsedSec = s.runStart ? (time - s.runStart) / 1000 : 0;

        // Visual biome timeline: advance the schedule + any in-progress cave
        // transition. Reseed the cave tunnel the frame a leg begins so it streams in
        // from its entrance rather than mid-journey.
        const caveJourney = biomesRef.current.cave.journey;
        const biomeSeq = BiomeSystem.tick(s, elapsedSec, caveJourney);
        if (biomeSeq.caveReset) {
          biomesRef.current.cave.reset();
          placeGate(s, canvas.width + GATE_CONFIG.spawnOffset, canvas.height, elapsedSec);
          biomeSeq.caveReset = false;
        }
        s.visualBiome = BiomeSystem.visualLabel(biomeSeq);
        s.playerBiome = BiomeSystem.gameplayAtScreenX(biomeSeq, caveJourney, s.monk.x);
        s.spawnBiome = BiomeSystem.gameplayAtScreenX(biomeSeq, caveJourney, canvas.width + 80);
        // Entering WATER: keep spawning the cave's own elements while the spawn point
        // (right edge) is still inside the cave, but the instant the cave's exit mouth
        // scrolls past it, HOLD all spawns rather than forcing cave ones — otherwise
        // cave spikes drop to the RIGHT of the exit mouth, onto the emerging water
        // region. Holding here also keeps water obstacles from pre-spawning before
        // SETTLE_IN floods the surface, so the water rise gets a clear field.
        let holdSpawn = false;
        if (biomeSeq.phase === 'TRANSITION' && BiomeSystem.visualToGameplay(biomeSeq.to) === 'water' && s.spawnBiome !== 'cave') {
          holdSpawn = true;
        }
        s.biome = s.playerBiome;
        const liveLaneY = groundY + (waterLaneY - groundY) * biomeSeq.laneFrac;
        if (!s.monk.falling) s.monk.y = liveLaneY + Math.sin(time * 0.004) * 10 * biomeSeq.laneFrac;

        let speed = BASE_SPEED * getSpeedFactor(elapsedSec);
        if (s.stumble.slowTimer > 0) {
          s.stumble.slowTimer -= unscaledDt;
          speed *= STUMBLE.slowFactor;
        }
        if (s.monk.falling) speed = 0; // freeze the world so he drops into the visible pit
        s.cameraSpeed = speed;
        s.distance += s.cameraSpeed * dt;
        // Displayed score = paces travelled + bonus points earned this run.
        setScore(Math.floor(s.distance / 100) + s.score);
        setCombo(s.combo);

        // Run timer (wall-clock since the run began). setState bails out unless
        // the whole-second value changes, so this re-renders ~once per second.
        if (!s.runStart) s.runStart = time;
        setRunTime(Math.floor((time - s.runStart) / 1000));

        // Encounter orchestration (archer cadence, ronin ambush) runs
        // before the encounter executor so a start this frame ticks immediately.
        SegmentSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);

        BossSystem.tick(s, dt, unscaledDt, handleGameOver);

        CombatSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);

        // Monk
        s.monk.runCycle += 0.2 * dt;
        if (s.monk.falling) {
          // Fell into a bridge pit: accelerate downward, end the run once he's
          // clearly below the floor. unscaledDt so the drop ignores any slow-mo.
          s.monk.fallVy += 1.4 * unscaledDt;
          s.monk.y += s.monk.fallVy * unscaledDt;
          if (s.monk.y > canvas.height + 120) { handleGameOver(); return; }
        } else {
          if (s.monk.x < MONK_TARGET_X) s.monk.x += 1.5 * dt;
          if (s.monk.x < 0) handleGameOver();
        }

        // Spawning (obstacles + coins + enemy waves) and ambient dressing pause
        // during boss encounters; demon movement runs every frame.
        if (!s.boss.active && !BiomeSystem.spawnPaused(biomeSeq) && !holdSpawn) {
          RunDirector.tick(s, dt, elapsedSec, canvas.width, canvas.height); // conductor: pick the next pattern + weave yokai
          PatternRunner.tick(s, dt, canvas.width, canvas.height);   // executor: play it out
          SpawnSystem.tick(s, dt, canvas.width, canvas.height);
        }
        DemonSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);
        // The samurai escalates off stumbles every frame (tiers 1–2 stalk
        // alongside play; tier 3 hands off to the ronin kill-duel).
        SamuraiSystem.tick(s, dt, unscaledDt);
      } // End per-frame simulation

      // Debug: log watched state transitions for this frame (after sim).
      DebugLogger.tick(s);

      // --- RENDERING ---
      PhysicsSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height, time);

      // The VISUAL biome timeline owns the whole environment layer (steady biome or
      // the cave-transition composite); GameRenderer skips its own paper/sun/ground.
      const backdrop = biomeViewRef.current;
      GameRenderer.render(ctx, s, canvas, time, 'PLAYING', BiomeSystem.visualLabel(s.biomeSeq), backdrop);

      // DEBUG: gameplay-biome cue. Biomes with a full backdrop (cave/water) skip
      // the flat tint — it's only a fallback cue for skinless gameplay biomes.
      // Lives here (not GameRenderer) so it stays a removable debug layer.
      const BIOME_TINT = { cave: '18, 26, 38', water: '8, 64, 96' }; // bamboo = no tint
      const tint = backdrop ? null : BIOME_TINT[s.biome];
      if (tint) { ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = `rgb(${tint})`; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore(); }

      if (s.debugPacing) PacingOverlay.draw(ctx, s, canvas, s.runStart ? (time - s.runStart) / 1000 : 0);

      if (s.biomeFlash > 0) {
        s.biomeFlash -= unscaledDt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, s.biomeFlash / 35);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((s.biome || 'bamboo').toUpperCase(), canvas.width / 2, canvas.height * 0.3);
        ctx.restore();
      }
    } catch (e) {
      console.error(e);
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.font = '20px sans-serif';
        ctx.fillText(e.message, 50, 50);
        ctx.fillText(e.stack.substring(0, 100), 50, 80);
      }
    }
  }, []);

  // --- Input Handling ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    DebugLogger.reset();

    // Set true whenever the pointer leaves the window so the next move snaps the
    // blade to the cursor instead of sweeping a phantom slash across the screen.
    let pointerLeft = false;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    // Snap the sword (and its trail) onto a position so tracking restarts clean.
    const recalibrate = (pos) => {
      const s = state.current;
      s.mouse.x = pos.x; s.mouse.y = pos.y;
      s.sword.x = pos.x; s.sword.y = pos.y;
      s.sword.trail = [{ x: pos.x, y: pos.y }];
      pointerLeft = false;
    };

    const onPointerLeft = () => { pointerLeft = true; };

    const handlePointerDown = (e) => {
      const s = state.current;
      // Always recalibrate on click so a fresh slash registers, even after the
      // pointer was off-screen.
      recalibrate(getMousePos(e));
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

      // First move after the pointer re-entered the window: snap, don't slash.
      if (pointerLeft) {
        recalibrate(pos);
        return;
      }

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
            // Mis-slicing the crimson arrow is a STUMBLE now (feeds the samurai),
            // never instant death (RUN_DESIGN §3 / D1).
            s.shake = 20; s.flashHit = 1.0; s.flashColor = '185, 28, 28';
            s.stumble.count += 1;
            s.stumble.slowTimer = STUMBLE.slowDuration;
            s.focus.path = [];
            return;
          }
        } 
        else if (s.focus.path.length > 1 && s.focus.energy > 0 && !s.boss.active) {
          s.flashHit = 1.0; s.shake = 15; s.hitPause = 5; s.flashColor = '255, 255, 255';
          let targetsSliced = false;

          // Focus/touch paths cut yokai through the exact same production
          // operation as a normal cursor swipe, preserving each segment angle.
          for (let i = s.demons.length - 1; i >= 0; i--) {
            const d = s.demons[i];
            if (d.sliced) continue;
            for (let j = 0; j < s.focus.path.length - 1; j++) {
              if (CombatSystem.trySliceDemon(d, s, s.focus.path[j], s.focus.path[j + 1])) {
                targetsSliced = true;
                break;
              }
            }
          }

          for (let i = s.bamboo.length - 1; i >= 0; i--) {
            const b = s.bamboo[i]; let hit = false;
            for (let j = 0; j < s.focus.path.length - 1; j++) {
              if (distToSegmentSquared({x: b.x, y: s.focus.path[j].y}, s.focus.path[j], s.focus.path[j+1]) < (b.width*3)**2 && s.focus.path[j].y > b.y) {
                hit = true; break;
              }
            }
            if (hit) {
              if (b.gate && b.type === 'boulder') continue;
              if (b.explosive) {
                targetsSliced = true;
                CombatSystem.explode(s, b.x, b.y + b.height / 2, b.blastRadius || 230, b.gateId ?? null);
                break;
              }
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

    const handleKey = (e) => {
      const s = state.current;
      if (e.key === 'i' || e.key === 'I') s.debugPacing = !s.debugPacing;
      // Debug: force a cave transition to the next visual biome now (don't wait on the
      // schedule). Latches manual mode so the schedule stops overriding.
      if (e.key === 'n' || e.key === 'N') BiomeSystem.debugNext(s);
      if (e.key === 'b' || e.key === 'B') {
        // BiomeSystem owns biome progression; B now only flashes the derived state.
        s.biomeFlash = 100;
        console.log('[biome] player/spawn', s.playerBiome, s.spawnBiome);
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('blur', onPointerLeft);
    document.addEventListener('mouseleave', onPointerLeft);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('blur', onPointerLeft);
      document.removeEventListener('mouseleave', onPointerLeft);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  useGameLoop(canvasRef, gameLoop);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block touch-none cursor-crosshair" />

      {/* Run timer */}
      <div className="absolute top-8 left-10 pointer-events-none z-10 text-[#78716c]" style={{fontFamily: '"Times New Roman", Times, serif'}}>
        <div className="text-2xl tracking-widest" style={{textShadow: '1px 1px 0px #f4f1ea'}}>
          {String(Math.floor(runTime / 60)).padStart(2, '0')}:{String(runTime % 60).padStart(2, '0')}
        </div>
        <div className="text-[10px] font-bold tracking-widest mt-1">TIME</div>
      </div>

      {/* HUD */}
      <div className="absolute top-8 right-10 pointer-events-none text-right z-10">
        <div className="text-6xl text-[#1c1917] tracking-widest" style={{fontFamily: '"Times New Roman", Times, serif', textShadow: '2px 2px 0px #f4f1ea'}}>
          {score.toString().padStart(5, '0')}
        </div>
        <div className="text-sm font-bold tracking-widest text-[#78716c] mt-2">
           SCORE
        </div>
        {combo > 1 && (
          <div className="text-3xl font-bold tracking-widest text-[#b91c1c] mt-2" style={{fontFamily: '"Times New Roman", Times, serif', textShadow: '2px 2px 0px #f4f1ea'}}>
            ×{combo}
          </div>
        )}
      </div>
    </>
  );
}
