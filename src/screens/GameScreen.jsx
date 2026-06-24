import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop.js';
import { MenuModal } from '../components/MenuModal.jsx';
import { MenuButton } from '../components/MenuButton.jsx';
import { SettingsControls } from '../components/SettingsControls.jsx';

import { PALETTE, ARROW_TRAP, GATE_CONFIG, GOLDEN, GROUND_HEIGHT, MONK_TARGET_X, BASE_SPEED, MAX_FOCUS, STUMBLE, CAMERA, SCORING, getSpeedFactor, WATER_SURFACE_FRAC } from '../config/constants.js';
import { bus } from '../core/bus.js';
import { GameRenderer } from '../renderer/GameRenderer.js';
import { VISUAL_BIOMES, CAVE_FACTORY, GROVE_CAVE_FACTORY } from '../renderer/BiomeBackgrounds.js';
import { BiomeSystem } from '../systems/BiomeSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { BossSystem } from '../systems/BossSystem.js';
import { SegmentSystem } from '../systems/SegmentSystem.js';
import { DemonSystem } from '../systems/DemonSystem.js';
import { YOKAI_SHAPES } from '../data/yokaiShapes.js';
import { RunDirector } from '../systems/RunDirector.js';
import { PatternRunner } from '../systems/PatternRunner.js';
import { SamuraiSystem } from '../systems/SamuraiSystem.js';
import { TutorialSystem, createTutorialState } from '../systems/TutorialSystem.js';
import { StumbleSystem } from '../systems/StumbleSystem.js';
import { ComboSystem } from '../systems/ComboSystem.js';
import { CoinSystem } from '../systems/CoinSystem.js';
import { ArrowSystem } from '../systems/ArrowSystem.js';
import { FloatingTextSystem } from '../systems/FloatingTextSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { placeGate } from '../systems/ElementDirector.js';
import { DEFAULT_CHARACTER_ID } from '../data/characters.js';
import { DEFAULT_SLASH_ID } from '../data/slashes.js';
import { Persistence } from '../core/Persistence.js';
import { finalizeRun } from '../core/RunFinalizer.js';
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

export function GameScreen({ setGameState, setRunResult }) {
  const canvasRef = useRef(null);
  const coinHudIconRef = useRef(null);
  const [paces, setPaces] = useState(0);
  const [score, setScore] = useState(0);     // THE headline skill score (cuts × combo)
  const [runCoins, setRunCoins] = useState(0);
  const [combo, setCombo] = useState(0);     // surfaced when a slice chain is live
  const [comboTier, setComboTier] = useState(0);
  const [multiCut, setMultiCut] = useState(null); // transient per-swipe "×N!" burst
  const [milestone, setMilestone] = useState(null); // transient "1,000m" distance banner
  const [paused, setPaused] = useState(false); // pause overlay (visual + nav only; loop keeps running for now)

  // Last HUD values pushed to React. The rAF loop runs at 60fps but these change
  // rarely, so we diff against this ref and only call a setter when a value actually
  // moves — keeps React re-renders off the per-frame path. See syncHud below.
  const hudRef = useRef({ paces: 0, score: 0, coins: 0, combo: 0, comboTier: 0, multiCutId: 0, milestoneId: 0 });

  // Mutable Game State for 60fps loop
  const state = useRef({
    // `falling` flips true when an un-cut bridge's pit reaches the monk
    // (PhysicsSystem); the loop then drops him into the pit and ends the run.
    // `lifted` flips true when an un-popped water bubble engulfs the monk
    // (PhysicsSystem); the loop then rides monk.liftVy up and settles him back onto
    // the swim lane — a non-lethal vertical knock, mirror of `falling`.
    monk: { x: MONK_TARGET_X, y: 1080 - GROUND_HEIGHT, runCycle: 0, falling: false, fallVy: 0, lifted: false, liftVy: 0 },
    // Far-death cinematic (NOT the samurai duel, which owns its own camera): a pit
    // fall or running off the left edge freezes the world, punches the camera onto
    // the monk, and holds the death pose for `holdTimer` frames before game over — so
    // the player's eye lands on what killed them. Driven by beginDeath; framed by
    // CameraSystem.pickTarget's death branch.
    death: { active: false, kind: null, focusTimer: 0, holdTimer: 0, from: null },
    cosmetics: {
      characterId: Persistence.data.equippedCharacterId || DEFAULT_CHARACTER_ID,
      slashId: Persistence.data.equippedSlashId || DEFAULT_SLASH_ID,
    },
    sword: { x: 1920 / 2, y: 1080 / 2, trail: [], isSlashing: false },
    mouse: { x: 1920 / 2, y: 1080 / 2 },
    focus: { active: false, energy: MAX_FOCUS, path: [] },
    currentTimeScale: 1.0,
    // Dynamic camera (CameraSystem): a single composited transform for the run's
    // cinematics — golden-treat punch-in/pan and the samurai/ronin distance framing.
    camera: CameraSystem.createCamera(),
    goldenSlowmo: 0, // frames of post-golden-burst slow-mo (the "moment of pause")
    boss: {
      active: false, type: 'ronin', phase: 'hidden', role: null, finishedRole: null, finishedMode: null,
      duelMode: null, pendingDuelMode: null, pendingCanvasWidth: 0,
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
    pendingBoss: null,
    arrowTrap: null,
    arrowBurst: null,
    arrowLessonSeen: false,
    completedOncePatterns: {},
    taughtBiomes: {}, // Phase 5: which gameplay biomes have had their curriculum this run
    stumble: { count: 0, slowTimer: 0, incidentGraceTimer: 0, lastSource: null },
    bamboo: [],
    coins: [],
    coinsCollected: 0,
    coinHudCount: 0,
    yokaiCoinDrops: [],
    // One recoverable pressure episode: watch -> mercy -> post-mercy -> execution.
    samurai: {
      stage: 'absent', pose: 'absent', x: 0, y: 0, scale: 0.4,
      coolTimer: 0, graceTimer: 0, lastStumble: 0,
      pendingDuel: null, deferredIncident: false,
    },
    elementTimer: 0,
    // Macro pacing: RunDirector (conductor) picks authored patterns from decks to
    // match an intensity curve; PatternRunner (executor) plays the current one.
    // Both self-init on first tick. director is replaced by RunDirector.ensureInit.
    director: { initialized: false },
    pattern: null,
    debugPacing: true, // live intensity overlay during playtest (toggle: 'i' key)
    debugShapeIdx: 0,  // yokai shape tuning rig: 'y' cycles selection, 'u' spawns it
    demons: [],
    yokaiQueue: [], // staggered shape members waiting on their `delay` (DemonSystem)
    combo: 0,
    comboTimer: 0,
    comboTier: 0,
    comboLastStumble: 0,
    maxCombo: 0,
    // THE headline skill score: ComboSystem awards per-cut points scaled by combo
    // tier; ArrowSystem subtracts on a forbidden-seal cut. Distance is now flavor —
    // `lastMilestone` tracks the last 1,000-pace banner fired so each fires once.
    score: 0,
    lastMilestone: 0,
    milestone: null,
    milestoneSeq: 0,
    // Per-swipe multi-cut (DESIGN §6 / Phase 5). `stroke` tallies yokai cut in one
    // continuous slash; on close, N≥2 raises a transient `multiCut` (the loop
    // decays its life) + a `combo:multicut` bus burst. `multiCutSeq` ids each pop.
    stroke: null,
    multiCut: null,
    multiCutSeq: 0,
    // Transient floating combat text (combo / arrow / miss / critical / golden hits).
    // FloatingTextSystem owns the pool; ticked every frame; drawn on the world layer.
    floatingText: [],
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
    distancePaces: 0,
    // FTUE: the coached first run. TutorialSystem owns this sub-object; begin() (at run
    // start) flips `active` on only when the player hasn't finished the tutorial before.
    tutorial: createTutorialState(),
    ended: false,
  });

  // VISUAL biome timeline instances: one stateful renderer per registered biome plus
  // the shared cave transition tunnel. BiomeSystem sequences these off the schedule.
  const biomesRef = useRef(null);
  if (!biomesRef.current) {
    biomesRef.current = Object.fromEntries(
      Object.entries(VISUAL_BIOMES).map(([k, def]) => [k, def.make()])
    );
    biomesRef.current.cave = CAVE_FACTORY();
    biomesRef.current.grove = GROVE_CAVE_FACTORY(); // the short second tunnel (via:'grove')
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
    const s = state.current;
    const result = finalizeRun(s);
    if (!result) return;
    setRunResult(result);
    setGameState('GAMEOVER');
  };

  // Far-death entry: a pit fall ('pit') or running off the left edge ('edge') — the
  // deaths that aren't the samurai duel (that owns its own camera). Freezes the world
  // and punches the camera onto the monk (CameraSystem's death branch), then the loop
  // holds the pose for `hold` frames before handing off to handleGameOver — so the
  // player's eye is dragged to what killed them instead of an instant cut.
  const beginDeath = (kind) => {
    const s = state.current;
    if (s.death.active || s.ended) return;
    s.death.active = true;
    s.death.kind = kind;
    s.death.focusTimer = CAMERA.death.focus; // camera glides in over these frames…
    s.death.holdTimer = CAMERA.death.hold;   // …then holds the settled pose this long.
    // Snapshot the camera pose at the moment of death so CameraSystem eases FROM here
    // TO the death framing (a deliberate push-in that fully arrives), not the ambient
    // exponential drift that floats on the frozen frame.
    const c = s.camera;
    s.death.from = { x: c.x, y: c.y, zoom: c.zoom, angle: c.angle, letterbox: c.letterbox };
    s.cameraSpeed = 0;
    s.shake = Math.max(s.shake, CAMERA.death.shake);
    bus.emit('monk:death', { kind });
  };


  // --- Main Engine ---
  const gameLoop = useCallback((time, dtMs, ctx, canvas, vp) => {
    try {
      if (!state.current.lastTime) state.current.lastTime = time;
      const deltaTime = Math.min(time - state.current.lastTime, 32); 
      const unscaledDt = deltaTime / 16;
      state.current.lastTime = time;
      
      const s = state.current;
      if (s.ended) return;
      
      // --- TIME RAMPING LOGIC ---
      let targetTimeScale = 1.0;
      if (s.boss.active) {
        if (s.boss.phase === 'warning') targetTimeScale = 0.2;
        else if (s.boss.phase === 'active' && s.boss.type === 'ronin') targetTimeScale = 0.05;  // 5% Speed for clash
      } else if (s.arrowBurst?.phase === 'telegraph') {
        targetTimeScale = ARROW_TRAP.telegraphTimeScale;
      } else if (s.focus.active && s.focus.energy > 0) {
        targetTimeScale = 0.15; // Standard Iaijutsu Slow Mo
      } else if (s.demons.some((d) => d.golden && d.armed && !d.bursting)) {
        targetTimeScale = GOLDEN.frenzyScale; // first cut → time drops to ~zero for the scrub
      } else if (s.goldenSlowmo > 0) {
        targetTimeScale = GOLDEN.slowmoScale; // post-burst flash-bang "moment of pause"
      } else if (s.tutorial.active && s.tutorial.slowmo != null) {
        targetTimeScale = s.tutorial.slowmo; // FTUE coach beats slow the world so prompts read
      }
      if (s.goldenSlowmo > 0) s.goldenSlowmo -= unscaledDt;

      s.currentTimeScale += (targetTimeScale - s.currentTimeScale) * 0.1;
      const dt = unscaledDt * s.currentTimeScale;

      if (!canvas) return;
      if (!ctx) return;

      // Hitstop: FREEZE the world (skip simulation) but keep ticking the camera and still
      // RENDER this frame — so a camera punch-in / shake plays DURING the freeze instead of
      // snapping after it (mock parity for "freeze → multi-hit → burst → return"). Falls
      // through to the camera tick + render below.
      // A hitPause OR an active death-cam freezes the sim (skip simulation) while the
      // camera + render keep running below — so the death-cam punch-in holds a still
      // pose for `holdTimer` frames before handleGameOver.
      const frozen = s.hitPause > 0 || s.death.active;
      if (s.hitPause > 0) s.hitPause -= unscaledDt;

      if (!frozen) {
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
        if (!s.monk.falling && !s.monk.lifted) s.monk.y = laneY + Math.sin(time * 0.004) * 10 * laneFrac;
        for (const m of s.scenery) m.y = groundY;

        // Camera speed: a TIERED, time-based ramp (rise → plateau → rise → … → max).
        // Reduced while stumbling. See getSpeedFactor / data.speed.tiers.
        const elapsedSec = s.runStart ? (time - s.runStart) / 1000 : 0;

        // Visual biome timeline: advance the schedule + any in-progress cave
        // transition. Reseed the cave tunnel the frame a leg begins so it streams in
        // from its entrance rather than mid-journey.
        const connectors = biomesRef.current;
        const biomeSeq = BiomeSystem.tick(s, elapsedSec, connectors);
        if (biomeSeq.caveReset) {
          // Reseed whichever tunnel this leg uses. The boulder cave-gate is the long
          // cave's entry set-piece only; the grove's content is its payload (tickGrove).
          BiomeSystem.connectorFor(connectors, biomeSeq.via).reset();
          if (biomeSeq.via === 'cave') placeGate(s, canvas.width + GATE_CONFIG.spawnOffset, canvas.height, elapsedSec);
          biomeSeq.caveReset = false;
        }
        s.visualBiome = BiomeSystem.visualLabel(biomeSeq);
        s.playerBiome = BiomeSystem.gameplayAtScreenX(biomeSeq, connectors, s.monk.x);
        s.spawnBiome = BiomeSystem.gameplayAtScreenX(biomeSeq, connectors, canvas.width + 80);
        // Which payload a 'grove' beat should run (coins | gauntlet | swarm). Read off
        // the active schedule entry; RunDirector.tickGrove loops the matching pattern.
        s.grovePayload = BiomeSystem.scheduledEntryAt(elapsedSec).payload;
        // Entering WATER: keep spawning the cave's own elements while the spawn point
        // (right edge) is still inside the cave, but the instant the cave's exit mouth
        // scrolls past it, HOLD all spawns rather than forcing cave ones — otherwise
        // cave stalactites drop to the RIGHT of the exit mouth, onto the emerging water
        // region. Holding here also keeps water obstacles from pre-spawning before
        // SETTLE_IN floods the surface, so the water rise gets a clear field.
        let holdSpawn = false;
        if (biomeSeq.phase === 'TRANSITION' && BiomeSystem.visualToGameplay(biomeSeq.to) === 'water'
          && s.spawnBiome !== 'cave' && s.spawnBiome !== 'grove') {
          holdSpawn = true;
        }
        s.biome = s.playerBiome;
        const liveLaneY = groundY + (waterLaneY - groundY) * biomeSeq.laneFrac;
        if (!s.monk.falling && !s.monk.lifted) s.monk.y = liveLaneY + Math.sin(time * 0.004) * 10 * biomeSeq.laneFrac;

        let speed = BASE_SPEED * getSpeedFactor(elapsedSec);
        const wasStumbling = s.stumble.slowTimer > 0;
        StumbleSystem.tick(s, unscaledDt);
        if (wasStumbling) {
          speed *= STUMBLE.slowFactor;
        }
        if (s.monk.falling) speed = 0; // freeze the world so he drops into the visible pit
        s.cameraSpeed = speed;
        s.distance += s.cameraSpeed * dt;
        s.distancePaces = Math.floor(s.distance / 100);

        // Distance milestone: every `milestonePaces` paces fires a transient centered
        // banner (distance is flavor now, not the score). Keyed by a monotonic id so
        // the HUD diff-sync replays the pop; `lastMilestone` gates it to once each.
        const milestoneStep = Math.floor(s.distancePaces / SCORING.milestonePaces);
        if (milestoneStep > s.lastMilestone) {
          s.lastMilestone = milestoneStep;
          s.milestoneSeq += 1;
          s.milestone = { meters: milestoneStep * SCORING.milestonePaces, id: s.milestoneSeq };
        }

        if (!s.runStart) s.runStart = time;

        // Encounter orchestration runs before the Ronin executor so a pending
        // Samurai duel starts on this frame.
        SegmentSystem.tick(s);

        BossSystem.tick(s, dt, unscaledDt, handleGameOver);
        if (s.ended) return;

        ArrowSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);

        CombatSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);

        // Monk
        s.monk.runCycle += 0.2 * dt;
        if (s.monk.falling) {
          // The pit has him. Freeze at the lip and run the death-cam (hard freeze +
          // hold) rather than dropping him off the bottom into an empty-pit frame —
          // the camera punches onto the monk with the open gap right there, so the
          // player reads "pit" before the game-over cut.
          beginDeath('pit');
          return;
        } else if (s.monk.lifted) {
          // Flung up by a bubble: rise, let gravity arc him back, and re-clamp onto
          // the swim lane on the way down (clears the lift). The world keeps moving
          // and he can't recover x meanwhile, so the lift bleeds tempo to the samurai.
          s.monk.liftVy += 1.0 * unscaledDt;
          s.monk.y += s.monk.liftVy * unscaledDt;
          const restY = liveLaneY + Math.sin(time * 0.004) * 10 * biomeSeq.laneFrac;
          const ceilY = canvas.height * 0.14; // never flung off the top of the screen
          if (s.monk.y < ceilY) { s.monk.y = ceilY; if (s.monk.liftVy < 0) s.monk.liftVy = 0; }
          if (s.monk.liftVy >= 0 && s.monk.y >= restY) {
            s.monk.y = restY;
            s.monk.lifted = false;
            s.monk.liftVy = 0;
          }
          if (s.monk.x < 0) { beginDeath('edge'); return; }
        } else {
          if (s.monk.x < MONK_TARGET_X) s.monk.x += 1.5 * dt;
          if (s.monk.x < 0) { beginDeath('edge'); return; }
        }

        // Spawning (obstacles + coins + enemy waves) and ambient dressing pause
        // during boss encounters; demon movement runs every frame.
        if (s.tutorial.active) {
          // FTUE: the coached prologue authors what appears; the procedural conductor
          // is suspended until the tutorial hands off (RunDirector then self-inits).
          // Combat/Demon/Physics/Boss/Samurai keep ticking below, so slices, scrolling,
          // and the mercy duel all resolve through the real systems.
          TutorialSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);
        } else if (!s.boss.active && !s.pendingBoss && !(s.samurai.graceTimer > 0) && !BiomeSystem.spawnPaused(biomeSeq) && !holdSpawn) {
          RunDirector.tick(s, dt, elapsedSec, canvas.width, canvas.height); // conductor: pick the next pattern + weave yokai
          PatternRunner.tick(s, dt, canvas.width, canvas.height);   // executor: play it out
          SpawnSystem.tick(s, dt, canvas.width, canvas.height);
        }
        DemonSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);
        // The Samurai consumes accepted stumble incidents after movement/contact.
        SamuraiSystem.tick(s, dt, unscaledDt, canvas.width);

        // Debug: log watched state transitions for this frame (after sim).
        DebugLogger.tick(s);

        // Entity physics (debris/particles) — also frozen during a hitPause.
        PhysicsSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height, time);
      if (s.yokaiCoinDrops.length) {
        const canvasRect = canvas.getBoundingClientRect();
        const coinIconRect = coinHudIconRef.current?.getBoundingClientRect();
        const coinHudTarget = coinIconRect ? {
          x: (coinIconRect.left + coinIconRect.width / 2 - canvasRect.left) * (canvas.width / canvasRect.width),
          y: (coinIconRect.top + coinIconRect.height / 2 - canvasRect.top) * (canvas.height / canvasRect.height),
        } : { x: 50, y: 42 };
        CoinSystem.tick(s, dt, unscaledDt, canvas.height, coinHudTarget);
      }
      // Combo expiry is wall-clock: deltaTime is real elapsed ms (slow-mo excluded).
      ComboSystem.tick(s, deltaTime / 1000);

      // Per-swipe multi-cut "×N!" decays on the same wall-clock; clear it when the
      // life runs out so the diff-sync below retires the popup.
      if (s.multiCut) {
        s.multiCut.life -= deltaTime / 1000;
        if (s.multiCut.life <= 0) s.multiCut = null;
      }
      } // End per-frame simulation (frozen during a hitPause)

      // Camera advances EVERY frame on real (unscaled) time — including during a hitPause
      // freeze — so cinematic punch-in/pan/shake play through the freeze and glide home.
      CameraSystem.tick(s, unscaledDt, canvas.width, canvas.height);

      // Floating combat text advances EVERY frame on real (unscaled) time — including
      // during a hitstop/golden slow-mo — so each pop reads at full speed.
      FloatingTextSystem.tick(s, unscaledDt);

      // Death-cam stages (sim is frozen above while death.active): first let the camera
      // glide into the death framing (focusTimer — CameraSystem reads it for progress),
      // THEN hold the settled pose for a beat (holdTimer) before the game-over cut. The
      // glide→pause→screen rhythm is what the instant cut was missing.
      if (s.death.active) {
        if (s.death.focusTimer > 0) {
          s.death.focusTimer = Math.max(0, s.death.focusTimer - unscaledDt);
        } else {
          s.death.holdTimer -= unscaledDt;
          if (s.death.holdTimer <= 0) { handleGameOver(); return; }
        }
      }

      // HUD sync: one guarded pass — only fire a setter when its value changed,
      // so a steady frame triggers zero React re-renders.
      const hud = hudRef.current;
      if (hud.paces !== s.distancePaces) { hud.paces = s.distancePaces; setPaces(s.distancePaces); }
      if (hud.score !== s.score) { hud.score = s.score; setScore(s.score); }
      if (hud.coins !== s.coinHudCount) { hud.coins = s.coinHudCount; setRunCoins(s.coinHudCount); }
      if (hud.combo !== s.combo) { hud.combo = s.combo; setCombo(s.combo); }
      if (hud.comboTier !== s.comboTier) { hud.comboTier = s.comboTier; setComboTier(s.comboTier); }
      // Multi-cut is keyed by a monotonic id so a fresh ×N replays the pop even at
      // the same count; null when expired. Diff on the id only — still no per-frame
      // re-render while a burst lingers.
      const mcId = s.multiCut?.id || 0;
      if (hud.multiCutId !== mcId) {
        hud.multiCutId = mcId;
        setMultiCut(s.multiCut ? { count: s.multiCut.count, id: mcId } : null);
      }
      // Distance milestone banner: diff on the monotonic id so each new threshold
      // replays the centered pop (CSS animation fades it out; it stays mounted but
      // invisible until the next one supersedes it).
      const msId = s.milestone?.id || 0;
      if (hud.milestoneId !== msId) {
        hud.milestoneId = msId;
        setMilestone(s.milestone ? { meters: s.milestone.meters, id: msId } : null);
      }

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

      // FTUE coach prompt — a centered banner while a beat waits on the player. Drawn
      // here (not GameRenderer) so it stays a thin, removable onboarding layer alongside
      // the biome flash / pacing overlay above.
      if (s.tutorial.active && s.tutorial.prompt) {
        const pulse = 0.82 + Math.sin(time * 0.006) * 0.18;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 72px "Times New Roman", Times, serif';
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(12, 15, 18, 0.85)';
        ctx.strokeText(s.tutorial.prompt, canvas.width / 2, canvas.height * 0.18);
        ctx.fillStyle = `rgba(244, 241, 234, ${pulse})`;
        ctx.fillText(s.tutorial.prompt, canvas.width / 2, canvas.height * 0.18);
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
    TutorialSystem.begin(state.current); // arm the coached first run if it hasn't been seen

    // Set true whenever the pointer leaves the window so the next move snaps the
    // blade to the cursor instead of sweeping a phantom slash across the screen.
    let pointerLeft = false;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      // Canvas-pixel coords, then map back through the camera transform to WORLD space so
      // slices land on entities even while the camera is zoomed/tilted/panned. Identity at
      // neutral camera. Every pointer entry point funnels through here, so downstream slice
      // logic, sword/trail, and the focus path are all already world-space.
      const px = (clientX - rect.left) * (canvas.width / rect.width);
      const py = (clientY - rect.top) * (canvas.height / rect.height);
      return CameraSystem.toWorld(state.current, { x: px, y: py }, canvas.width, canvas.height);
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

        if (s.focus.path.length > 1 && s.focus.energy > 0 && !s.boss.active) {
          s.flashHit = 1.0; s.shake = 15; s.hitPause = 5; s.flashColor = '255, 255, 255';
          let targetsSliced = false;

          // Focus/touch paths cut yokai through the exact same production
          // operation as a normal cursor swipe, preserving each segment angle. The
          // whole iaijutsu sweep is one stroke, so N≥2 yokai raise the same ×N
          // per-swipe multi-cut as a cursor swipe (DESIGN §6 / Phase 5).
          let yokaiCut = 0;
          let lastCutX = null;
          let lastCutY = null;
          for (let i = s.demons.length - 1; i >= 0; i--) {
            const d = s.demons[i];
            if (d.sliced) continue;
            // The golden treat is hit through tryHitGolden (the frenzy tally), never
            // full-sliced — let an iaijutsu sweep scrub it too.
            if (d.golden) {
              for (let j = 0; j < s.focus.path.length - 1; j++) {
                if (CombatSystem.tryHitGolden(d, s, s.focus.path[j], s.focus.path[j + 1])) { targetsSliced = true; break; }
              }
              continue;
            }
            for (let j = 0; j < s.focus.path.length - 1; j++) {
              if (CombatSystem.trySliceDemon(d, s, s.focus.path[j], s.focus.path[j + 1])) {
                targetsSliced = true;
                yokaiCut += 1;
                lastCutX = d.x;
                lastCutY = d.y;
                break;
              }
            }
          }
          if (yokaiCut >= 2) CombatSystem.raiseMultiCut(s, yokaiCut, lastCutX, lastCutY);

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
                CombatSystem.detonateTnt(s, b);
                break;
              }
              targetsSliced = true;
              CombatSystem.sliceBamboo(b, i, s, b.y + 100);
              ComboSystem.registerHit(s, b.type === 'thick' ? 'thick-bamboo' : (b.type || 'bamboo'));
              s.debris.push({ x: b.x, y: b.y + 100, vx: 0, vy: 0, life: 1.5, type: 'ink', color: PALETTE.paper });
            }
          }
          const arrowResult = ArrowSystem.tryCutPath(s, s.focus.path, canvas.width, canvas.height);
          if (arrowResult.hit) targetsSliced = true;
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
      // Yokai shape tuning rig (Phase 4): 'y' cycles the selected shape, 'u' spawns
      // it on demand. The PacingOverlay names the selection so a playtest can tune
      // member spacing + T until ONE stroke catches the cluster (DESIGN §5 warning).
      if (e.key === 'y' || e.key === 'Y') {
        s.debugShapeIdx = ((s.debugShapeIdx ?? 0) + 1) % YOKAI_SHAPES.length;
      }
      if (e.key === 'u' || e.key === 'U') {
        const shape = YOKAI_SHAPES[s.debugShapeIdx ?? 0];
        if (shape) DemonSystem.spawnShape(s, canvas.width, canvas.height, shape.id, { source: 'debug' });
      }
      // Debug: spawn the golden treat on demand to tune the frenzy/burst feel.
      if (e.key === 'g' || e.key === 'G') {
        DemonSystem.spawnGolden(s, canvas.width, canvas.height, { source: 'debug' });
      }
      // Debug: reset the FTUE flag so the coached run replays on the next start.
      if (e.key === 'k' || e.key === 'K') {
        Persistence.resetTutorial();
        console.log('[tutorial] reset — coached run replays on next start');
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

      {/* Pause — opens the overlay. stopPropagation on mousedown so the click doesn't
          also fire a focus-slash through the window pointer listeners. */}
      <button
        onClick={() => setPaused(true)}
        onMouseDown={(e) => e.stopPropagation()}
        className="group absolute top-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#0c0f12]/80 border border-slate-700/50 hover:border-red-800/80 text-slate-200 hover:text-red-400 font-serif px-4 py-2.5 rounded cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all backdrop-blur-md"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:scale-110 transition-transform">
          <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
        </svg>
        <span className="tracking-widest text-xs font-bold uppercase pt-0.5">Pause</span>
      </button>

      {/* Coins collected during this run; the wallet is updated at game over. */}
      <div className="absolute top-8 left-10 pointer-events-none z-10 text-[#78716c]" style={{fontFamily: '"Times New Roman", Times, serif'}}>
        <div className="flex items-center gap-3 text-3xl font-bold tracking-widest text-[#a16207]" style={{textShadow: '1px 1px 0px #f4f1ea'}}>
          <span ref={coinHudIconRef} className="inline-block w-5 h-5 rounded-full bg-[#facc15] border-2 border-[#a16207]" />
          {runCoins}
        </div>
        <div className="text-[10px] font-bold tracking-widest mt-1">COINS THIS RUN</div>
      </div>

      {/* HUD — SCORE is the headline (the skill metric: cuts × combo). Distance (PACES)
          is demoted to a small secondary line; its milestones pop as a centered banner. */}
      <div className="absolute top-8 right-10 pointer-events-none text-right z-10">
        <div className="text-6xl text-[#1c1917] tracking-widest" style={{fontFamily: '"Times New Roman", Times, serif', textShadow: '2px 2px 0px #f4f1ea'}}>
          {score.toLocaleString()}
        </div>
        <div className="text-sm font-bold tracking-widest text-[#78716c] mt-2">
           SCORE
        </div>
        <div className="text-lg text-[#78716c] tracking-widest mt-2" style={{fontFamily: '"Times New Roman", Times, serif'}}>
          {paces.toString().padStart(5, '0')} <span className="text-[10px] font-bold tracking-widest">PACES</span>
        </div>
        {combo > 1 && (
          <div
            className="text-3xl font-bold tracking-widest mt-2 transition-all duration-150"
            style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: ['#78716c', '#1c1917', '#059669', '#d97706', '#b91c1c'][comboTier],
              textShadow: comboTier >= 3 ? '0 0 14px #facc15, 2px 2px 0px #f4f1ea' : '2px 2px 0px #f4f1ea',
              transform: `scale(${1 + comboTier * 0.05})`,
            }}
          >
            ×{combo}
          </div>
        )}

        {/* Per-swipe multi-cut burst (DESIGN §6 / Phase 5): one slice through N≥2
            yokai → a transient "×N!" that pops and fades over MULTICUT_LIFE. Keyed
            by id so a fresh multi-cut replays the pop; the loop retires it. */}
        {multiCut && (
          <div
            key={multiCut.id}
            className="text-5xl font-bold tracking-widest mt-3 multicut-pop"
            style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: multiCut.count >= 4 ? '#b91c1c' : multiCut.count === 3 ? '#d97706' : '#059669',
              textShadow: '0 0 18px #facc15, 2px 2px 0px #f4f1ea',
            }}
          >
            ×{multiCut.count}!
          </div>
        )}
      </div>

      {/* Distance milestone banner: a centered "1,000m" announcement that pops every
          SCORING.milestonePaces paces and fades on its own (keyed by id to replay). */}
      {milestone && (
        <div
          key={milestone.id}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none z-10 text-center milestone-pop"
        >
          <div
            className="text-7xl font-bold tracking-widest text-[#1c1917]"
            style={{ fontFamily: '"Times New Roman", Times, serif', textShadow: '0 0 22px #facc15, 3px 3px 0px #f4f1ea' }}
          >
            {milestone.meters.toLocaleString()}m
          </div>
        </div>
      )}

      <style>{`
        @keyframes multicutPop {
          0%   { transform: scale(0.4); opacity: 0; }
          22%  { transform: scale(1.28); opacity: 1; }
          55%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .multicut-pop { animation: multicutPop 0.9s ease-out forwards; }
        @keyframes milestonePop {
          0%   { transform: translateX(-50%) scale(0.6); opacity: 0; }
          18%  { transform: translateX(-50%) scale(1.12); opacity: 1; }
          70%  { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 0; }
        }
        .milestone-pop { animation: milestonePop 1.8s ease-out forwards; }
      `}</style>

      {/* Pause overlay (visual + navigation only; the run loop keeps ticking behind it
          for now — see "just visuals" scope). Resume closes; Quit returns home. */}
      {paused && (
        <MenuModal title="Paused">
          <SettingsControls />
          <div className="flex flex-col gap-4 mt-2 relative z-10">
            <MenuButton primary onClick={() => setPaused(false)} className="w-full">Resume</MenuButton>
            <MenuButton onClick={() => setGameState('START')} className="w-full">Quit</MenuButton>
          </div>
        </MenuModal>
      )}
    </>
  );
}
