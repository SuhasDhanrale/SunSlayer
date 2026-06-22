import { useEffect, useRef, useState } from 'react';
import { GameRenderer } from '../../renderer/GameRenderer.js';
import { CombatSystem } from '../../systems/CombatSystem.js';
import { PhysicsSystem } from '../../systems/PhysicsSystem.js';
import { DemonSystem } from '../../systems/DemonSystem.js';
import { SpawnSystem } from '../../systems/SpawnSystem.js';
import { RunDirector } from '../../systems/RunDirector.js';
import { PatternRunner } from '../../systems/PatternRunner.js';
import { PacingOverlay } from '../../debug/PacingOverlay.js';
import { BASE_SPEED, GROUND_HEIGHT, MAX_FOCUS, MONK_TARGET_X } from '../../config/constants.js';

function createState(w, h) {
  const groundY = h - GROUND_HEIGHT;
  return {
    monk: { x: MONK_TARGET_X, y: groundY, runCycle: 0 },
    sword: { x: w / 2, y: h / 2, trail: [], isSlashing: false },
    mouse: { x: w / 2, y: h / 2 },
    focus: { active: false, energy: MAX_FOCUS, path: [] },
    currentTimeScale: 1, boss: { active: false, type: 'ronin', phase: 'hidden' },
    playerBiome: 'bamboo', spawnBiome: 'bamboo', biome: 'bamboo', lastSpawnBiome: null,
    biomeIndex: 0, arrowTrap: null, arrowBurst: null, stumble: { count: 0, slowTimer: 0 },
    bamboo: [], coins: [], demons: [], punishers: [], debris: [], foreground: [],
    scenery: [
      SpawnSystem.createScenery(0, w, h, true, 'bamboo'),
      SpawnSystem.createScenery(600, w, h, true, 'bamboo'),
      SpawnSystem.createScenery(0, w, h, false, 'bamboo'),
      SpawnSystem.createScenery(600, w, h, false, 'bamboo'),
    ],
    combo: 0, comboTimer: 0, score: 0, hitPause: 0, shake: 0,
    flashHit: 0, flashColor: '255, 255, 255', cameraSpeed: BASE_SPEED,
    distance: 0, director: { initialized: false }, pattern: null, debugPacing: true,
  };
}

export const YokaiWovenLabMock = ({ resetToken }) => {
  const canvasRef = useRef(null);
  const [biome, setBiome] = useState('bamboo');
  const [readout, setReadout] = useState({ phase: 'INTRO', active: 0, intensity: 0, types: 'oni', count: 0 });
  const biomeRef = useRef(biome);
  biomeRef.current = biome;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth || 400));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight || 700));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const s = createState(canvas.width, canvas.height);

    const pointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches?.[0] || event;
      s.mouse.x = (point.clientX - rect.left) * (canvas.width / rect.width);
      s.mouse.y = (point.clientY - rect.top) * (canvas.height / rect.height);
      if (event.touches) event.preventDefault();
    };
    canvas.addEventListener('mousemove', pointer);
    canvas.addEventListener('touchmove', pointer, { passive: false });

    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let readoutClock = 0;
    const frame = (time) => {
      if (!last) last = time;
      const dt = Math.min((time - last) / 16, 2);
      last = time;
      elapsed += dt / 60;
      s.spawnBiome = biomeRef.current;
      s.playerBiome = biomeRef.current;
      s.biome = biomeRef.current;
      s.monk.y = canvas.height - GROUND_HEIGHT;
      s.monk.runCycle += 0.2 * dt;
      s.cameraSpeed = BASE_SPEED;
      s.distance += s.cameraSpeed * dt;

      CombatSystem.tick(s, dt, dt, canvas.width, canvas.height);
      RunDirector.tick(s, dt, elapsed, canvas.width, canvas.height);
      PatternRunner.tick(s, dt, canvas.width, canvas.height);
      PhysicsSystem.tick(s, dt, dt, canvas.width, canvas.height, time);
      DemonSystem.tick(s, dt, dt, canvas.width, canvas.height);
      GameRenderer.render(ctx, s, canvas, time, 'PLAYING', 'bamboo');
      PacingOverlay.draw(ctx, s, canvas, elapsed);

      if (++readoutClock % 15 === 0 && s.yokaiTrack) {
        setReadout({
          phase: s.yokaiTrack.phase, active: s.yokaiTrack.activeSec,
          intensity: s.yokaiTrack.intensity, types: s.yokaiTrack.unlockedTypes.join(' / '),
          count: s.demons.filter((enemy) => !enemy.sliced).length,
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('mousemove', pointer);
      canvas.removeEventListener('touchmove', pointer);
    };
  }, [resetToken]);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full touch-none cursor-crosshair" />
      <div className="absolute right-3 top-3 rounded bg-black/70 p-3 font-mono text-[11px] text-white backdrop-blur">
        <div className="mb-2 flex gap-1">
          {['bamboo', 'cave', 'water'].map((id) => (
            <button key={id} onClick={() => setBiome(id)} className={`rounded px-2 py-1 ${biome === id ? 'bg-rose-500' : 'bg-white/15'}`}>{id}</button>
          ))}
        </div>
        <div>{readout.phase} · {readout.active.toFixed(1)} active sec</div>
        <div>intensity {Math.round(readout.intensity * 100)}% · live {readout.count}/7</div>
        <div>types {readout.types}</div>
      </div>
    </div>
  );
};
