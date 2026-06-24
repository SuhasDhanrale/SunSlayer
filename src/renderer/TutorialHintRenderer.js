// FTUE slice-hint telegraph — drawn over each un-cut tutorial target so the player
// learns the verb by example: a slash sweeping THROUGH the obstacle plus a bobbing
// down-chevron floating ABOVE it. Thin, removable onboarding layer (like the coach
// prompt banner) — imports zero React/refs, takes (ctx, state, time) only.
//
// Targets carry their entity in `ref` (a bamboo obstacle or a side-route yokai),
// each with canvas-space x/y/width/height (see ElementDirector.placeObstacle). We
// draw only for targets that are present and not yet cut.

const SWEEP_MS = 760;        // one left→right slash sweep
const SWEEP_TILT = -0.18;    // radians — a slight upward slash, matches the slashes
const TRAIL = 7;             // ghost samples behind the blade dot

function drawSweep(ctx, cx, cy, half, time) {
  const phase = (time % SWEEP_MS) / SWEEP_MS;           // 0→1 sweep progress
  const cos = Math.cos(SWEEP_TILT);
  const sin = Math.sin(SWEEP_TILT);
  // Guide line: the full slash path THROUGH the obstacle (faint, static).
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(244, 241, 234, 0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - half * cos, cy - half * sin);
  ctx.lineTo(cx + half * cos, cy + half * sin);
  ctx.stroke();

  // The travelling blade dot + its fading trail — reads as a live swipe.
  for (let i = 0; i < TRAIL; i++) {
    const p = phase - i * 0.05;
    if (p < 0 || p > 1) continue;
    const dx = (-half + p * 2 * half) * cos;
    const dy = (-half + p * 2 * half) * sin;
    const a = (1 - i / TRAIL) * 0.9;
    const r = i === 0 ? 7 : 4.5 * (1 - i / TRAIL);
    ctx.beginPath();
    ctx.fillStyle = i === 0 ? `rgba(255, 255, 255, ${a})` : `rgba(251, 191, 36, ${a})`;
    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawChevron(ctx, cx, topY, time) {
  // A small down-pointing chevron bobbing ABOVE the obstacle — "slice here".
  const bob = Math.sin(time * 0.006) * 5;
  const y = topY - 30 + bob;
  const w = 13;
  const h = 9;
  ctx.save();
  ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 + Math.sin(time * 0.006) * 0.25})`;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - w, y);
  ctx.lineTo(cx, y + h);
  ctx.lineTo(cx + w, y);
  ctx.stroke();
  ctx.restore();
}

export function drawTutorialHints(ctx, s, time) {
  const tut = s.tutorial;
  if (!tut || !tut.active || tut.phase !== 'WAIT') return;
  if (!tut.targets || !tut.targets.length) return;

  for (const t of tut.targets) {
    const ref = t.ref;
    if (!t || t.cut || !ref || ref.x == null) continue;
    // Only telegraph entities actually on the field right now.
    const present = s.bamboo?.includes(ref) || s.demons?.includes(ref);
    if (!present) continue;

    const cx = ref.x;
    let cy;       // slash center (cuts through the body)
    let topY;     // top edge (chevron floats above this)
    let half;     // slash half-length
    if (ref.radius != null) {
      // Circular yokai: x/y is the CENTER, radius the extent. Slash through the
      // center, chevron above the top of the disc.
      cy = ref.y;
      topY = ref.y - ref.radius;
      half = Math.max(ref.radius * 1.3, 56);
    } else {
      // Rect obstacle: x = center, y = TOP edge. Slash through the upper body so it
      // reads as cutting it; chevron clears the top edge.
      const width = ref.width || 60;
      const height = ref.height || 80;
      topY = ref.y != null ? ref.y : 0;
      cy = topY + Math.min(height * 0.5, 46);
      half = Math.max(width * 0.9, 56);
    }

    drawSweep(ctx, cx, cy, half, time);
    drawChevron(ctx, cx, topY, time);
  }
}
