import { GROUND_HEIGHT, PALETTE } from '../config/constants.js';
import { getObstacleSpec } from '../obstacles/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// FloorRenderer — the ONE gameplay floor. A pitch-black, slightly wobbly ground
// band that is drawn the same way in every environment, so the "flow" is
// consistent no matter what biome backdrop is behind it (the Pattern Lab floor).
//
// It is the gameplay truth: biome backdrops keep their own floor art as dressing
// BEHIND this band. In water the band stays put as the SEABED — water is its own
// column that rises over the top of it (the monk lifts to the surface via
// laneFrac), it never replaces the floor. See BiomeTransitionMock for the idea.
//
// Bridges/suspended platforms carve a DITCH: the floor is simply absent under the
// span (the backdrop shows through as a pit), and the plank drops to bridge it.
//
// Top edge gets a rim-light matching the cave CEILING highlight (slate contour +
// faint bioluminescent blue, see BiomeBackgrounds cave ceiling) so floor and
// ceiling read as the same material when the cave tunnel is on screen.
// Pure canvas — no React, no refs. // SPRITE-READY
// ─────────────────────────────────────────────────────────────────────────────

// A bridge/platform obstacle declares its open pit as `spec.gap` = the
// [start, end] fraction of its worldBox width that the plank spans (the rest is
// solid ledge). Because it is fractional, any worldBox width / bridge length
// scales automatically — a new bridge just authors its own `gap`. See the bridge
// specs in src/obstacles/specs/.
function specGap(b) {
  if (!b.specId || !b.worldBox) return null;
  return getObstacleSpec(b.specId)?.gap || null;
}

// Rim-light passes for the floor's top edge — copied from the cave ceiling so the
// two surfaces match: [color, lineWidth], drawn in order (slate, then blue glow).
const EDGE_RIM = [
  ['#334155', 3],
  ['rgba(186, 230, 253, 0.22)', 1.5],
];

// Overscan: the floor band is filled this far PAST the viewport edges (sides + bottom)
// so the dynamic camera's tilt/zoom/downward-pan can never lift the world's bottom edge
// into view and reveal an un-drawn gap below the ground. Viewport-relative so it holds on
// ultrawide screens too. Purely off-screen at neutral camera (clipped by the canvas), so it
// costs nothing and changes nothing in normal play.
const overscanX = (w) => Math.max(600, w * 0.5);
const overscanY = (h) => Math.max(1200, h * 1.3);

// Screen-space [x0, x1] spans where a bridge/platform wants a ditch in the floor.
function collectDitches(s, w) {
  const out = [];
  for (let i = 0; i < s.bamboo.length; i++) {
    const b = s.bamboo[i];
    let lo, hi;
    const gap = specGap(b);
    if (gap) {
      lo = b.worldBox.x + b.worldBox.width * gap[0];
      hi = b.worldBox.x + b.worldBox.width * gap[1];
    } else if (b.type === 'bridge' && !b.specId) {
      lo = b.x - b.width / 2;
      hi = b.x + b.width / 2;
    } else {
      continue;
    }
    lo = Math.max(0, lo);
    hi = Math.min(w, hi);
    if (hi > lo) out.push([lo, hi]);
  }
  return out.sort((p, q) => p[0] - q[0]);
}

// Solid floor segments [x0, x1] (the spans with no ditch), left→right.
function computeSegments(s, w) {
  const ditches = collectDitches(s, w);
  const segs = [];
  const left = -overscanX(w);
  const right = w + overscanX(w);
  let cursor = left;
  for (let i = 0; i < ditches.length; i++) {
    const [lo, hi] = ditches[i];
    if (lo > cursor) segs.push([cursor, lo]);
    cursor = Math.max(cursor, hi);
  }
  if (cursor < right) segs.push([cursor, right]);
  return segs;
}

// The wobbly top-of-ground line at screen x. Ported verbatim from the legacy
// GameRenderer ground so the Pattern Lab feel is preserved exactly.
function topEdgeY(groundLine, distance, x) {
  const worldX = x + distance;
  const bump = Math.sin(worldX * 0.02) * 5 + Math.sin(worldX * 0.05) * 3;
  return groundLine - 4 + bump;
}

// Fill one solid floor segment [x0, x1] down to the bottom of the screen.
function fillSegment(ctx, groundLine, distance, h, x0, x1) {
  const bottom = h + overscanY(h); // fill past the screen so a tilted/zoomed camera sees no gap
  ctx.beginPath();
  ctx.moveTo(x0, topEdgeY(groundLine, distance, x0));
  for (let x = x0; x < x1; x += 20) ctx.lineTo(x, topEdgeY(groundLine, distance, x));
  ctx.lineTo(x1, topEdgeY(groundLine, distance, x1));
  ctx.lineTo(x1, bottom);
  ctx.lineTo(x0, bottom);
  ctx.closePath();
  ctx.fill();
}

// Stroke the wobbly top edge of every segment (the rim light). Ditch gaps get no
// rim, so a pit reads as an open break in the ground.
function strokeTopEdges(ctx, groundLine, distance, segs) {
  for (let p = 0; p < EDGE_RIM.length; p++) {
    ctx.strokeStyle = EDGE_RIM[p][0];
    ctx.lineWidth = EDGE_RIM[p][1];
    for (let i = 0; i < segs.length; i++) {
      const [x0, x1] = segs[i];
      ctx.beginPath();
      ctx.moveTo(x0, topEdgeY(groundLine, distance, x0));
      for (let x = x0; x < x1; x += 10) ctx.lineTo(x, topEdgeY(groundLine, distance, x));
      ctx.lineTo(x1, topEdgeY(groundLine, distance, x1));
      ctx.stroke();
    }
  }
}

// Paint the inside of each pit so a ditch reads as DUG GROUND with depth, not a
// hole punched through to the backdrop. Drawn BEFORE obstacles so the dropped
// plank sits on top of it; the solid floor band (draw, below) is drawn AFTER
// obstacles and frames it. Per ditch: a darkening downward gradient (fakes depth)
// plus a cross-section "earth wall" on each inner cliff face.
function drawPit(ctx, groundLine, h, lo, hi, time) {
  const top = groundLine - 6;
  const depth = h - top;

  const grad = ctx.createLinearGradient(0, top, 0, h);
  grad.addColorStop(0, 'rgba(8, 7, 6, 0.55)');
  grad.addColorStop(0.35, 'rgba(4, 3, 3, 0.9)');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(lo, top, hi - lo, depth);

  // Hellish red glow welling up from the depths — marks the ditch as a demon pit.
  const redGlow = ctx.createLinearGradient(0, h, 0, top);
  redGlow.addColorStop(0, 'rgba(220, 38, 38, 0.6)');
  redGlow.addColorStop(0.45, 'rgba(153, 27, 27, 0.3)');
  redGlow.addColorStop(1, 'rgba(127, 29, 29, 0)');
  ctx.fillStyle = redGlow;
  ctx.fillRect(lo, top, hi - lo, depth);

  // Earth cross-section on each cliff face, with a faint lit lip on the very edge.
  const faceW = Math.min(12, (hi - lo) / 4);
  ctx.fillStyle = '#1c1714';
  ctx.fillRect(lo, top, faceW, depth);
  ctx.fillRect(hi - faceW, top, faceW, depth);
  ctx.fillStyle = 'rgba(120, 113, 108, 0.5)';
  ctx.fillRect(lo, top, 2, depth);
  ctx.fillRect(hi - 2, top, 2, depth);

  // Demons lurking in the dark — pairs of glowing eyes that occasionally blink.
  const innerLo = lo + faceW;
  const innerHi = hi - faceW;
  const span = innerHi - innerLo;
  if (span > 36) {
    const pairs = Math.max(1, Math.floor(span / 80));
    for (let e = 0; e < pairs; e++) {
      const cx = innerLo + span * ((e + 0.5) / pairs);
      const ey = top + depth * (0.4 + 0.16 * Math.sin(e * 2.3 + 1));
      // Slow per-pair blink: eyes wink shut briefly.
      if (Math.sin(time * 0.003 + e * 1.7 + cx * 0.008) < -0.86) continue;
      const gap = 8;
      const eyeR = 3.2;
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath(); ctx.ellipse(cx - gap, ey, eyeR, eyeR * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + gap, ey, eyeR, eyeR * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath(); ctx.ellipse(cx - gap, ey, 1.1, eyeR * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + gap, ey, 1.1, eyeR * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

export const FloorRenderer = {
  drawPits(ctx, s, w, h, time = 0) {
    const groundLine = h - GROUND_HEIGHT;
    const ditches = collectDitches(s, w);
    for (let i = 0; i < ditches.length; i++) {
      drawPit(ctx, groundLine, h, ditches[i][0], ditches[i][1], time);
    }
  },

  draw(ctx, s, w, h) {
    const groundLine = h - GROUND_HEIGHT;
    const distance = s.distance || 0;
    const segs = computeSegments(s, w);

    ctx.fillStyle = PALETTE.ground; // #0c0a09 — the canonical pitch-black floor
    for (let i = 0; i < segs.length; i++) {
      fillSegment(ctx, groundLine, distance, h, segs[i][0], segs[i][1]);
    }

    strokeTopEdges(ctx, groundLine, distance, segs);
  },
};
