import { useEffect, useRef } from 'react';
import { WORLD_SCALE } from '../config/constants.js';

// The design reference the entities were authored against. The live logical world
// is this height divided by WORLD_SCALE, so a bigger WORLD_SCALE = a shorter world
// = everything appears bigger on screen. See resize() and constants.WORLD_SCALE.
export const LOGICAL_WIDTH = 1920;
export const LOGICAL_HEIGHT = 1080;

export function useGameLoop(canvasRef, tickFn) {
  const vpRef = useRef({ scale: 1, offX: 0, offY: 0, logicalH: LOGICAL_HEIGHT });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let requestRef;
    let lastTime = performance.now();

    // RELATIVE SCALING. The world is authored in a FIXED-HEIGHT logical space
    // (LOGICAL_HEIGHT tall), with its width flexing to the viewport's aspect ratio.
    // We size the canvas BACKING STORE to that logical space and let CSS (`w-full
    // h-full`) stretch it to the real display. Because the backing store's aspect
    // ALWAYS matches the display's, the stretch is uniform — no squish — and every
    // entity, the floor, and the monk keep a CONSTANT fraction of screen height on
    // any resolution. A 900×500 window and a 1080p laptop now read identically.
    //
    // This deliberately replaces the old 1:1 device-pixel sizing, where the same
    // hand-tuned pixel sizes (a 40px yokai, the 100px floor) occupied wildly
    // different screen fractions per display — so tuning on one screen broke on
    // another. The whole scene IS rescaled by the viewport now; that's the point.
    //
    // WORLD_SCALE (config.worldScale) is the master size knob: dividing the design
    // height by it shortens the logical world, so everything fills MORE of the
    // screen. Higher WORLD_SCALE = bigger monk/yokai/TNT/arrows/floor, everywhere.
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dispW = Math.max(1, rect.width || window.innerWidth);
      const dispH = Math.max(1, rect.height || window.innerHeight);
      const logicalH = Math.round(LOGICAL_HEIGHT / WORLD_SCALE);
      const logicalW = Math.max(1, Math.round(logicalH * (dispW / dispH)));
      canvas.width = logicalW;
      canvas.height = logicalH;
      vpRef.current.scale = dispH / logicalH; // display px per logical unit (CSS applies it)
      vpRef.current.offX = 0;
      vpRef.current.offY = 0;
      vpRef.current.logicalH = logicalH;
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
