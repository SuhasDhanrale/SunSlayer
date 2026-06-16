import { useEffect, useRef } from 'react';

export const LOGICAL_WIDTH = 1920;
export const LOGICAL_HEIGHT = 1080;

export function useGameLoop(canvasRef, tickFn) {
  const vpRef = useRef({ scale: 1, offX: 0, offY: 0, logicalH: LOGICAL_HEIGHT });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let requestRef;
    let lastTime = performance.now();

    // Set fixed internal resolution
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;

    const loop = (time) => {
      const dtMs = Math.min(time - lastTime, 100);
      lastTime = time;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        tickFn(time, dtMs, ctx, canvas, vpRef.current);
      }
      
      requestRef = requestAnimationFrame(loop);
    };

    requestRef = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef);
    };
  }, [tickFn]);

  return vpRef;
}
