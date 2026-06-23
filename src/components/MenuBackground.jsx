import React, { useEffect, useRef } from 'react';
import { createRainBackground } from '../renderer/BiomeBackgrounds.js';

// Standalone animated rain backdrop for the menu/start screens. It reuses the live
// `rain` visual-biome painter (createRainBackground) so the home screen opens on the
// exact backdrop the run itself starts on — no separate art, no duplication.
//
// Pure visual: no pointer input, no simulation. The canvas backing store is sized 1:1
// with its CSS box (no DPR scaling), matching useGameLoop's resize so the rain renders
// at an identical scale to gameplay.
export function MenuBackground({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width || window.innerWidth));
      canvas.height = Math.max(1, Math.round(rect.height || window.innerHeight));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const backdrop = createRainBackground();
    let raf;
    const frame = () => {
      backdrop.render(ctx, canvas.width, canvas.height);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full block ${className}`} />;
}
