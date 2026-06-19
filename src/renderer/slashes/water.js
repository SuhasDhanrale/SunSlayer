// Water Breath slash — Ukiyo-e wave stream with thick Sumi outlines and curly
// foam claws. Pure renderer ported from ElementalSlashesMock.jsx.

export const id = 'water';

export function drawTrail(ctx, points, time) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = points[i - 1];
    const r = (i / points.length) * 26 + 10;
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);

    // Deep blue wave bubble
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Light cyan splash inside
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.15, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // White foam wave cap
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.9);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.4, -r * 0.25, -r * 0.15);
    ctx.quadraticCurveTo(-r * 0.6, -r * 0.1, -r * 0.9, -r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Claw foam fingers
    if (i % 3 === 0) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.75, -r * 1.1, r * 1.15, -r * 1.4);
      ctx.quadraticCurveTo(r * 0.4, -r * 0.7, 0, -r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r * 1.15, -r * 1.4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // Flowing white core
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

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
