export function getPointSegmentDistance(pt, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(pt.x - p1.x, pt.y - p1.y);

  let t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(pt.x - (p1.x + t * dx), pt.y - (p1.y + t * dy));
}

export function checkThickLineCut(p1, p2, lx, ly1, ly2, thickness = 22) {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const ly = ly1 + (ly2 - ly1) * (i / steps);
    const dist = getPointSegmentDistance({ x: lx, y: ly }, p1, p2);
    if (dist < thickness) return { x: lx, y: ly };
  }
  return null;
}

export function checkSegmentCircle(p1, p2, cx, cy, r) {
  const dist = getPointSegmentDistance({ x: cx, y: cy }, p1, p2);
  return dist < r ? { x: cx, y: cy } : null;
}

// Does the swipe (p1→p2) cross or pass within `thickness` of a VERTICAL rope at
// x=lineX spanning local y ∈ [lyTop, lyBottom]? Used for hanging ropes whose
// visible length runs far above the obstacle box (the ceiling tether), so a
// negative lyTop is expected — any swipe across the rope anywhere counts.
export function checkSegmentVerticalLine(p1, p2, lineX, lyTop, lyBottom, thickness = 12) {
  // Exact crossing: the swipe passes from one side of the rope's x to the other,
  // and the crossing point lies within the rope's y-span.
  if ((p1.x - lineX) * (p2.x - lineX) <= 0 && p1.x !== p2.x) {
    const t = (lineX - p1.x) / (p2.x - p1.x);
    const iy = p1.y + t * (p2.y - p1.y);
    if (iy >= lyTop && iy <= lyBottom) return { x: lineX, y: iy };
  }
  // Near-miss (swipe roughly parallel to the rope): closest endpoint within band.
  for (const pt of [p1, p2]) {
    const cy = Math.max(lyTop, Math.min(lyBottom, pt.y));
    if (getPointSegmentDistance({ x: lineX, y: cy }, p1, p2) < thickness) {
      return { x: lineX, y: cy };
    }
  }
  return null;
}

export function checkSegmentHorizontalLine(p1, p2, targetY, targetXMin, targetXMax) {
  if ((p1.y - targetY) * (p2.y - targetY) <= 0 && p1.y !== p2.y) {
    const t = (targetY - p1.y) / (p2.y - p1.y);
    const intersectX = p1.x + t * (p2.x - p1.x);
    if (intersectX >= targetXMin && intersectX <= targetXMax) {
      return { x: intersectX, y: targetY };
    }
  }

  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const lx = targetXMin + (targetXMax - targetXMin) * (i / steps);
    const dist = getPointSegmentDistance({ x: lx, y: targetY }, p1, p2);
    if (dist < 15) return { x: lx, y: targetY };
  }
  return null;
}

export function drawGalleryParticles(ctx, particles) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;

    if (p.shape === 'spark') {
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.lineTo(p.r / 3, -p.r / 3);
      ctx.lineTo(p.r, 0);
      ctx.lineTo(p.r / 3, p.r / 3);
      ctx.lineTo(0, p.r);
      ctx.lineTo(-p.r / 3, p.r / 3);
      ctx.lineTo(-p.r, 0);
      ctx.lineTo(-p.r / 3, -p.r / 3);
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'spike_needle') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -p.h / 2);
      ctx.lineTo(0, p.h / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}
