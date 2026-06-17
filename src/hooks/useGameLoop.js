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

    // Size the backing store to the canvas's REAL displayed pixel size (1:1),
    // exactly like the calibrated reference. This both prevents squish/stretch
    // (backing store always matches the display's aspect ratio) AND keeps every
    // entity at its true, hand-tuned pixel scale — a fixed logical width would
    // rescale the whole scene by (screenWidth / logicalWidth) and shrink it.
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width || window.innerWidth));
      const h = Math.max(1, Math.round(rect.height || window.innerHeight));
      canvas.width = w;
      canvas.height = h;
      vpRef.current.scale = 1;
      vpRef.current.offX = 0;
      vpRef.current.offY = 0;
      vpRef.current.logicalH = h;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

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
      ro.disconnect();
    };
  }, [tickFn]);

  return vpRef;
}
