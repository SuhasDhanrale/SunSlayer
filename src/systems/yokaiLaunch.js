import { DEMON_CONFIG } from '../config/constants.js';

// Ballistic launch solver for Yokai shapes (YOKAI_FRUIT_DESIGN §4).
//
// Yokai live in SCREEN space: each tick `pos += vel*dt`, `vy += gravity*dt`,
// never scrolled with the camera. Given where a member should be cleanly
// sliceable (`target`) and when it should arrive there (`T`, in 60fps frames),
// this returns the launch velocity that drops straight into DemonSystem.spawn.
//
// All native engine units: px, FRAMES (60fps), px/frame, px/frame². `scroll` is
// the world scroll speed in px/frame — pass 0 for a screen-anchored shape (the
// default, speed-invariant by construction) or cameraSpeed for a world-anchored
// one, where it enters exactly once as a `-scroll` term on vx (DESIGN §4.4).
//
// LOCKED DECISION (DESIGN §4.3, recommended default): bottom arcs use a FIXED
// global gravity (`DEMON_CONFIG.gravity`), so the airtime `T` is DERIVED from the
// rise rather than imposed. Revisit only if arcs need a fixed reaction window at
// speed — then switch to gravity = 2*rise/(T*T) and keep T as the input.
//
// Pure: no React, no refs, no state mutation. `sideGravity` is overridable so the
// flat-Train case (gs = 0, DESIGN §4.2) and the worked examples (§4.6) are
// reproducible from inputs alone; it defaults to the config value otherwise.
export function solveLaunch({
  spawn,
  target,
  route,
  T,
  scroll = 0,
  gravity = DEMON_CONFIG.gravity,
  sideGravity = DEMON_CONFIG.sideGravity ?? 0,
}) {
  if (route === 'side') {
    // Straight cross from the right edge. x is gravity-free; y solves the gentle
    // side-gravity so y(T) = target.y (vy = (yT − y0 − ½·gs·T²) / T). For a flat
    // Train, spawn at target height with sideGravity = 0 ⇒ vy = 0 (DESIGN §4.2).
    return {
      vx: (target.x - spawn.x) / T - scroll,
      vy: (target.y - spawn.y - 0.5 * sideGravity * T * T) / T,
      gravity: sideGravity,
      T,
    };
  }

  // Bottom arc — apex lands ON the target (the classic "catch it at the top").
  // Fixing gravity DETERMINES airtime: from R = ½·g·T² with R = rise (DESIGN §4.3).
  const rise = spawn.y - target.y; // > 0: climbs from below
  const Tapex = Math.sqrt((2 * rise) / gravity);
  return {
    vx: (target.x - spawn.x) / Tapex - scroll,
    vy: -gravity * Tapex, // negative = upward
    gravity,
    T: Tapex,
  };
}
