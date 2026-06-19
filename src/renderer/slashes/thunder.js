// Thunder Breath slash — jagged crackling yellow/white electric lightning arcs.
// Pure renderer ported from ElementalSlashesMock.jsx.

export const id = 'thunder';

export function drawTrail(ctx, points, time) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer glow
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.3)';
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  // Core electric jagged arc
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const offset = (Math.random() - 0.5) * 14;
    ctx.lineTo(mx + nx * offset, my + ny * offset);
    ctx.lineTo(p2.x, p2.y);
  }
  ctx.stroke();

  // Thin neon yellow bolt
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// --- Elemental particles (electric diamond sparks) ---

export function spawnParticle(x, y, angle) {
  const pAngle = angle + (Math.random() - 0.5) * Math.PI * 1.2;
  const speed = Math.random() * 6 + 2.5;
  const p = {
    x, y,
    vx: (Math.cos(pAngle) * speed + (Math.random() - 0.5) * 1.5) * 1.8,
    vy: (Math.sin(pAngle) * speed + (Math.random() - 0.5) * 1.5) * 1.8,
    life: 0,
    maxLife: Math.floor(Math.random() * 25) + 20,
    size: Math.random() * 3.5 + 1.5,
    color: Math.random() > 0.3 ? '#fde047' : '#ffffff',
  };
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
  ctx.fillStyle = p.color;
  ctx.globalAlpha = lifeRatio;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - p.size);
  ctx.lineTo(p.x + p.size, p.y);
  ctx.lineTo(p.x, p.y + p.size);
  ctx.lineTo(p.x - p.size, p.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
