// Gameplay scene experiment. Drives the game's REAL renderer (GameRenderer) so
// what you see here is exactly what the live game draws — promotion is a move,
// not a port.
//
// NOTE on shape: the live renderer/systems currently read a FLAT state shape
// (s.monk, s.boss, s.distance, …) while createInitialState() is namespaced
// (s.sim.monk, s.entities.boss, s.run.distance) — the engine refactor is in
// flight. `toRenderState` below bridges a namespaced preset into the flat shape
// the renderer consumes today. When the refactor lands and the renderer reads
// namespaced state, delete this adapter and pass the preset straight through.
import { useEffect, useRef } from 'react';
import { GameRenderer } from '../../renderer/GameRenderer.js';
import { getBiome } from '../../config/constants.js';
import { getPreset, metaPresets } from '../presets.js';

const toRenderState = (preset) => ({
  // sim
  monk: preset.sim.monk,
  sword: preset.sim.sword,
  focus: preset.sim.focus,
  shake: preset.sim.shake,
  flashHit: preset.sim.flashHit,
  flashColor: preset.sim.flashColor,
  // entities
  boss: preset.entities.boss,
  bamboo: preset.entities.bamboo,
  debris: preset.entities.debris,
  scenery: preset.entities.scenery,
  foreground: preset.entities.foreground,
  // run
  distance: preset.run.distance,
  // input
  mouse: { x: preset.input.pointer.x, y: preset.input.pointer.y },
});

export const GameplayMock = ({ presetId, resetToken }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 400) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 700) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const s = toRenderState(getPreset(metaPresets, presetId).create());

    let raf = 0;
    let start = null;
    const frame = (ts) => {
      if (start === null) start = ts;
      const time = ts - start;
      const dt = 1; // idle preview — no systems, just renderer ambient motion

      // Ground-anchor entities to the live canvas height, like the real loop.
      const groundY = canvas.height - 100;
      s.monk.y = groundY;
      for (const m of s.scenery) m.y = groundY;
      s.monk.runCycle += 0.2 * dt;
      if (s.boss.active) s.boss.warningTimer += dt;

      GameRenderer.render(ctx, s, canvas, time, 'PLAYING', getBiome(s.distance));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // resetToken restarts the experiment on Reset / screen switch.
  }, [presetId, resetToken]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};
