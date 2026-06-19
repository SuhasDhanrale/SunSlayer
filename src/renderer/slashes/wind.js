// Wind Breath slash — chaotic crescent sickles + spiraling jade leaves and
// flying vacuum blades. Pure renderer ported from ElementalSlashesMock.jsx.
// `points` is an array of { x, y } swipe samples (oldest → newest).

export const id = 'wind';

export function drawTrail(ctx, points, time) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = '#065f46'; // deep emerald outline
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  ctx.strokeStyle = '#10b981'; // jade core
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.strokeStyle = '#ffffff'; // white highlight
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Sickle shapes splayed along the path
  for (let i = 1; i < points.length; i++) {
    if (i % 2 !== 0) continue;
    const p = points[i];
    const prev = points[i - 1];
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    const angle = Math.atan2(dy, dx);
    const size = (i / points.length) * 24 + 10;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.quadraticCurveTo(0, -size * 0.75, size, 0);
    ctx.quadraticCurveTo(0, -size * 0.15, -size, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(-size * 0.75, -size * 0.1);
    ctx.quadraticCurveTo(0, -size * 0.55, size * 0.75, -size * 0.1);
    ctx.quadraticCurveTo(0, -size * 0.2, -size * 0.75, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, -size * 0.18);
    ctx.quadraticCurveTo(0, -size * 0.4, size * 0.45, -size * 0.18);
    ctx.quadraticCurveTo(0, -size * 0.25, -size * 0.45, -size * 0.18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

// --- Elemental particles (jade leaves, vacuum blades, wisps) ---

export function spawnParticle(x, y, angle) {
  const pAngle = angle + (Math.random() - 0.5) * Math.PI * 1.2;
  const speed = Math.random() * 6 + 2.5;
  const p = {
    x, y,
    vx: Math.cos(pAngle) * speed + (Math.random() - 0.5) * 1.5,
    vy: Math.sin(pAngle) * speed + (Math.random() - 0.5) * 1.5,
    life: 0,
    maxLife: Math.floor(Math.random() * 25) + 20,
    size: Math.random() * 4 + 2,
  };

  const rand = Math.random();
  if (rand > 0.82) {
    const normalAngle = angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2) + (Math.random() - 0.5) * 0.25;
    const shootSpeed = Math.random() * 8 + 6;
    p.vx = Math.cos(normalAngle) * shootSpeed;
    p.vy = Math.sin(normalAngle) * shootSpeed;
    p.size = Math.random() * 18 + 12;
    p.type = 'vacuum-blade';
    p.rot = normalAngle;
    p.maxLife = 25;
  } else if (rand > 0.4) {
    p.color = Math.random() > 0.35 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(244, 244, 245, 0.9)';
    p.type = 'leaf';
    p.rot = Math.random() * Math.PI;
    p.rotSpeed = (Math.random() - 0.5) * 0.15;
    p.size = Math.random() * 6 + 3;
    p.centerX = x;
    p.centerY = y;
    p.orbitRadius = Math.random() * 45 + 15;
    p.orbitAngle = Math.random() * Math.PI * 2;
    p.orbitSpeed = (Math.random() * 0.08 + 0.08) * (Math.random() > 0.5 ? 1 : -1);
  } else {
    p.color = 'rgba(244, 244, 245, 0.5)';
    p.type = 'smoke';
    p.size = Math.random() * 8 + 4;
  }
  return p;
}

export function updateParticle(p) {
  p.life++;
  if (p.life >= p.maxLife) return false;
  if (p.type === 'leaf' && p.centerX !== undefined) {
    p.orbitAngle += p.orbitSpeed;
    p.orbitRadius = Math.max(0, p.orbitRadius - 1.2);
    p.x = p.centerX + Math.cos(p.orbitAngle) * p.orbitRadius;
    p.y = p.centerY + Math.sin(p.orbitAngle) * p.orbitRadius;
    p.rot += p.rotSpeed;
  } else {
    p.x += p.vx;
    p.y += p.vy;
  }
  return true;
}

export function drawParticle(ctx, p, time) {
  const lifeRatio = 1 - p.life / p.maxLife;
  ctx.save();
  ctx.fillStyle = p.color;
  ctx.globalAlpha = lifeRatio * 0.8;

  if (p.type === 'leaf') {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot + p.life * p.rotSpeed);
    const w = p.size;
    const h = p.size * 0.45 * Math.sin(time * 0.1 + p.rot);

    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.ellipse(0, 0, w, Math.abs(h), 0, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.ellipse(0, 0, w, Math.abs(h), 0, 0, Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();
  } else if (p.type === 'vacuum-blade') {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot + Math.PI / 2);
    ctx.globalAlpha = lifeRatio * 0.75;
    const w = p.size * lifeRatio;

    ctx.fillStyle = 'rgba(52, 211, 153, 0.65)';
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(0, -w * 0.75, w, 0);
    ctx.quadraticCurveTo(0, -w * 0.15, -w, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
