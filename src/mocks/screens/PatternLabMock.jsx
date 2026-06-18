// PATTERN LAB — author & FEEL one pattern at a time. Runs the game's REAL systems
// (Combat/Physics/Demon/PatternRunner) and REAL renderer, looping the selected
// pattern at real speed so a pattern's *feel* (not just its shape) is what you
// judge. Patterns are shared data (src/data/patterns.js) — anything good here is
// instantly usable by the in-game conductor. Swipe the blade across the canvas.
import { useEffect, useRef, useState } from 'react';
import { GameRenderer } from '../../renderer/GameRenderer.js';
import { CombatSystem } from '../../systems/CombatSystem.js';
import { PhysicsSystem } from '../../systems/PhysicsSystem.js';
import { DemonSystem } from '../../systems/DemonSystem.js';
import { SpawnSystem } from '../../systems/SpawnSystem.js';
import { PatternRunner, compilePattern } from '../../systems/PatternRunner.js';
import { CoinReward } from '../../systems/CoinReward.js';
import { PATTERNS, CATEGORIES } from '../../data/patterns.js';
import { BASE_SPEED, GROUND_HEIGHT, MONK_TARGET_X, MAX_FOCUS, getBiomeName } from '../../config/constants.js';

const GAP_AFTER = 520; // world-distance of empty space between loop repeats

function createLabState(w, h) {
  const groundY = h - GROUND_HEIGHT;
  return {
    monk: { x: MONK_TARGET_X, y: groundY, runCycle: 0 },
    sword: { x: w / 2, y: h / 2, trail: [], isSlashing: false },
    mouse: { x: w / 2, y: h / 2 },
    focus: { active: false, energy: MAX_FOCUS, path: [] },
    currentTimeScale: 1.0,
    boss: { active: false, type: 'archer', phase: 'hidden', role: null, finishedRole: null, arrows: [], warningTimer: 0, hp: 0, maxHp: 0, hitCooldown: 0, x: 0, y: 0, vx: 0, vy: 0, timer: 0 },
    biomeIndex: 0,
    arrowCluster: null,
    stumble: { count: 0, slowTimer: 0 },
    bamboo: [], coins: [], demons: [], debris: [], foreground: [],
    scenery: [
      SpawnSystem.createScenery(0, w, h, true, 'bamboo'), SpawnSystem.createScenery(600, w, h, true, 'bamboo'), SpawnSystem.createScenery(1200, w, h, true, 'bamboo'),
      SpawnSystem.createScenery(0, w, h, false, 'bamboo'), SpawnSystem.createScenery(500, w, h, false, 'bamboo'), SpawnSystem.createScenery(1000, w, h, false, 'bamboo')
    ],
    combo: 0, comboTimer: 0,
    hitPause: 0, shake: 0, flashHit: 0, flashColor: '255, 255, 255',
    cameraSpeed: BASE_SPEED, distance: 0,
    pattern: null,
    director: { intensity: 0.6 }, // drives the CoinReward layer (set from the slider)
    coinTimer: 0,
  };
}

export const PatternLabMock = ({ resetToken }) => {
  const canvasRef = useRef(null);
  const [selectedId, setSelectedId] = useState(PATTERNS[0].id);
  const [intensity, setIntensity] = useState(0.6);

  // Keep the latest selection/intensity in refs so the [] loop reads live values
  // without restarting (the loop must not depend on these to stay smooth).
  const selRef = useRef(selectedId);
  const intRef = useRef(intensity);
  selRef.current = selectedId;
  intRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth || 400));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight || 700));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let s = createLabState(canvas.width, canvas.height);
    let playingId = selRef.current;
    const patternOf = (id) => PATTERNS.find((p) => p.id === id) || PATTERNS[0];
    PatternRunner.start(s, compilePattern(patternOf(playingId), intRef.current));
    let gap = 0; // remaining empty distance before the next loop repeat

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) };
    };
    const onMove = (e) => { const p = getMousePos(e); s.mouse.x = p.x; s.mouse.y = p.y; if (e.touches) e.preventDefault(); };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: false });

    let raf = 0;
    let last = 0;
    const frame = (ts) => {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 16, 2);
      const unscaledDt = dt;
      last = ts;

      const groundY = canvas.height - GROUND_HEIGHT;
      s.monk.y = groundY;
      for (const m of s.scenery) m.y = groundY;
      s.monk.runCycle += 0.2 * dt;
      s.cameraSpeed = BASE_SPEED;
      s.distance += s.cameraSpeed * dt;
      s.director.intensity = intRef.current; // coin density follows the slider

      // If the selection changed, switch immediately on the next loop boundary.
      if (selRef.current !== playingId) { playingId = selRef.current; s.pattern.done = true; gap = 0; }

      CombatSystem.tick(s, dt, unscaledDt);

      const done = PatternRunner.tick(s, dt, canvas.width, canvas.height);
      if (done) {
        gap -= s.cameraSpeed * dt;
        if (gap <= 0) { PatternRunner.start(s, compilePattern(patternOf(playingId), intRef.current)); gap = GAP_AFTER; }
      }

      CoinReward.tick(s, dt, canvas.width, canvas.height); // reward layer (coins are not in patterns)
      PhysicsSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height, ts);
      DemonSystem.tick(s, dt, unscaledDt, canvas.width, canvas.height);

      GameRenderer.render(ctx, s, canvas, ts, 'PLAYING', getBiomeName(s.biomeIndex));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove);
    };
  }, [resetToken]);

  const active = PATTERNS.find((p) => p.id === selectedId) || PATTERNS[0];

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full block touch-none cursor-crosshair" />

      {/* Picker + intensity overlay */}
      <div className="absolute left-0 top-0 max-h-full w-[150px] overflow-y-auto bg-black/45 p-2 text-white backdrop-blur-sm">
        {CATEGORIES.map((cat) => {
          const inCat = PATTERNS.filter((p) => p.category === cat);
          if (!inCat.length) return null;
          return (
            <div key={cat} className="mb-2">
              <div className="mb-1 text-[9px] font-black uppercase tracking-widest text-white/50">{cat}</div>
              {inCat.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`mb-1 block w-full rounded px-2 py-1 text-left text-[10px] font-bold leading-tight ${p.id === selectedId ? 'bg-[#54a0ff] text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                >
                  {p.id.replace(/^[a-z]+-/, '')} <span className="opacity-50">· {p.kind === 'field' ? 'fld' : 'grd'} d{p.difficulty}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Intensity (only meaningful for field patterns) */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-black/45 px-3 py-2 text-white backdrop-blur-sm">
        <span className="text-[10px] font-black tracking-widest">
          INTENSITY {Math.round(intensity * 100)}%
        </span>
        <input
          type="range" min="0" max="1" step="0.05" value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="flex-1 accent-[#54a0ff]"
        />
        <span className="text-[9px] font-bold text-white/55">
          {active.kind === 'field' ? 'scales density' : 'grid · fixed'}
        </span>
      </div>
    </div>
  );
};
