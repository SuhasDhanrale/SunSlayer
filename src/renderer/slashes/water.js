// Water Breath slash — a continuous flowing stream (same ribbon construction as
// the flame slash) layered deep-blue → sky-blue → white core, with small foam
// dots along the crest instead of big scalloped bubbles.

export const id = 'water';

export function drawTrail(ctx, points, time) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const leftOuter = [];
  const rightOuter = [];
  const leftInner = [];
  const rightInner = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = points[i + 1] || p;
    const prev = points[i - 1] || p;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    // Gentle flowing swell along the stream (thinner than the old bubbles)
    const wave = Math.sin(i * 1.1 - time * 0.2) * 3;
    const outerWidth = (i / points.length) * 15 + 4 + wave;
    const innerWidth = outerWidth * 0.55;

    leftOuter.push({ x: p.x + nx * outerWidth, y: p.y + ny * outerWidth });
    rightOuter.push({ x: p.x - nx * outerWidth, y: p.y - ny * outerWidth });
    leftInner.push({ x: p.x + nx * innerWidth, y: p.y + ny * innerWidth });
    rightInner.push({ x: p.x - nx * innerWidth, y: p.y - ny * innerWidth });
  }

  const pLast = points[points.length - 1];

  // Layer 1: deep blue outer ribbon with thick Sumi outline + pointed tip
  ctx.beginPath();
  ctx.moveTo(leftOuter[0].x, leftOuter[0].y);
  for (let i = 1; i < leftOuter.length; i++) ctx.lineTo(leftOuter[i].x, leftOuter[i].y);
  ctx.lineTo(pLast.x, pLast.y);
  for (let i = rightOuter.length - 1; i >= 0; i--) ctx.lineTo(rightOuter[i].x, rightOuter[i].y);
  ctx.closePath();
  ctx.fillStyle = '#1d4ed8';
  ctx.fill();
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Layer 2: sky-blue inner ribbon
  ctx.beginPath();
  ctx.moveTo(leftInner[0].x, leftInner[0].y);
  for (let i = 1; i < leftInner.length; i++) ctx.lineTo(leftInner[i].x, leftInner[i].y);
  ctx.lineTo(pLast.x, pLast.y);
  for (let i = rightInner.length - 1; i >= 0; i--) ctx.lineTo(rightInner[i].x, rightInner[i].y);
  ctx.closePath();
  ctx.fillStyle = '#38bdf8';
  ctx.fill();

  // Small white foam dots riding the crest (replaces the big scallops)
  ctx.fillStyle = '#ffffff';
  for (let i = 1; i < points.length; i += 2) {
    const fp = leftOuter[i];
    const r = (i / points.length) * 3.5 + 1.5;
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Core white flowing slash
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  // Glassy bubbles drifting up off the stream. Animated by `time` so each one
  // rises and recycles — gives the "bubbles coming out of it" feel without a
  // stateful particle pool. Two staggered bubbles per sampled point.
  const drawBubble = (bx, by, r, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.30)';
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(bx - r * 0.35, by - r * 0.35, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  const RISE = 34; // travel distance before a bubble recycles
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    for (let b = 0; b < 2; b++) {
      const seed = i * 13 + b * 47;
      const phase = (time * 0.9 + seed) % RISE;
      const r = (i / points.length) * 2.5 + 1.5 + b;
      const bx = p.x + Math.sin(time * 0.08 + seed) * 7;
      const by = p.y - phase;                 // rise upward off the ribbon
      const alpha = (1 - phase / RISE) * 0.85; // fade as it rises
      drawBubble(bx, by, r, alpha);
    }
  }

  ctx.restore();
}

// --- Elemental particles (bubbles & teardrop droplets) ---

export function spawnParticle(x, y, angle) {
  const pAngle = angle + (Math.random() - 0.5) * Math.PI * 1.2;
  const speed = Math.random() * 6 + 2.5;
  const p = {
    x, y,
    vx: Math.cos(pAngle) * speed + (Math.random() - 0.5) * 1.5,
    vy: Math.sin(pAngle) * speed + (Math.random() - 0.5) * 1.5,
    life: 0,
    maxLife: Math.floor(Math.random() * 25) + 20,
    size: Math.random() * 6 + 2,
    color: Math.random() > 0.3 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    type: Math.random() > 0.5 ? 'bubble' : 'droplet',
  };
  p.vy -= 1.2; // float upwards slightly
  return p;
}

export function updateParticle(p) {
  p.life++;
  if (p.life >= p.maxLife) return false;
  p.x += p.vx;
  p.y += p.vy;
  return true;
}

export function drawParticle(ctx, p) {
  const lifeRatio = 1 - p.life / p.maxLife;
  ctx.save();
  ctx.globalAlpha = lifeRatio * 0.9;

  if (p.type === 'bubble') {
    const r = p.size * (0.5 + 0.5 * lifeRatio);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    const r = p.size * lifeRatio;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r);
    ctx.quadraticCurveTo(p.x + r * 0.75, p.y + r * 0.5, p.x, p.y + r * 1.3);
    ctx.quadraticCurveTo(p.x - r * 0.75, p.y + r * 0.5, p.x, p.y - r);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
