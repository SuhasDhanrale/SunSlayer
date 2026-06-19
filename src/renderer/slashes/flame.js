// Flame Breath slash — a roaring, fluid stream of fire built from layered
// ribbons with an additive burning core and licking wisps. Pure renderer ported
// from ElementalSlashesMock.jsx.

export const id = 'flame';

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

    const wave = Math.sin(i * 1.5 - time * 0.35) * 8;
    const outerWidth = (i / points.length) * 26 + 6 + wave;
    const innerWidth = outerWidth * 0.55;

    const dragX = -(next.x - prev.x) * 0.35;
    const dragY = -(next.y - prev.y) * 0.35;

    leftOuter.push({ x: p.x + nx * outerWidth + dragX, y: p.y + ny * outerWidth + dragY });
    rightOuter.push({ x: p.x - nx * outerWidth + dragX, y: p.y - ny * outerWidth + dragY });
    leftInner.push({ x: p.x + nx * innerWidth + dragX * 0.5, y: p.y + ny * innerWidth + dragY * 0.5 });
    rightInner.push({ x: p.x - nx * innerWidth + dragX * 0.5, y: p.y - ny * innerWidth + dragY * 0.5 });
  }

  const pLast = points[points.length - 1];
  const pPrev = points[points.length - 2] || pLast;
  const tipDragX = -(pLast.x - pPrev.x) * 0.5;
  const tipDragY = -(pLast.y - pPrev.y) * 0.5;

  // Layer 1: crimson outer fire ribbon with thick black outline
  ctx.beginPath();
  ctx.moveTo(leftOuter[0].x, leftOuter[0].y);
  for (let i = 1; i < leftOuter.length; i++) ctx.lineTo(leftOuter[i].x, leftOuter[i].y);
  ctx.lineTo(pLast.x + tipDragX, pLast.y + tipDragY);
  for (let i = rightOuter.length - 1; i >= 0; i--) ctx.lineTo(rightOuter[i].x, rightOuter[i].y);
  ctx.closePath();
  ctx.fillStyle = '#b91c1c';
  ctx.fill();
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 4.5;
  ctx.stroke();

  // Additive burning core layers
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Layer 2: orange ribbon
  ctx.beginPath();
  ctx.moveTo(leftInner[0].x, leftInner[0].y);
  for (let i = 1; i < leftInner.length; i++) ctx.lineTo(leftInner[i].x, leftInner[i].y);
  ctx.lineTo(pLast.x + tipDragX * 0.7, pLast.y + tipDragY * 0.7);
  for (let i = rightInner.length - 1; i >= 0; i--) ctx.lineTo(rightInner[i].x, rightInner[i].y);
  ctx.closePath();
  ctx.fillStyle = '#f97316';
  ctx.fill();

  // Layer 3: yellow-hot inner core
  ctx.beginPath();
  ctx.moveTo(leftInner[0].x, leftInner[0].y);
  for (let i = 1; i < leftInner.length; i++) {
    const p = points[i];
    const next = points[i + 1] || p;
    const prev = points[i - 1] || p;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (i / points.length) * 10 + 2;
    ctx.lineTo(p.x + nx * w, p.y + ny * w);
  }
  ctx.lineTo(pLast.x + tipDragX * 0.5, pLast.y + tipDragY * 0.5);
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const next = points[i + 1] || p;
    const prev = points[i - 1] || p;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (i / points.length) * 10 + 2;
    ctx.lineTo(p.x - nx * w, p.y - ny * w);
  }
  ctx.closePath();
  ctx.fillStyle = '#fef08a';
  ctx.fill();

  ctx.restore();

  // Licking fire wisps shooting up from the ribbon
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.5;
  for (let i = 2; i < points.length - 1; i += 3) {
    const p = points[i];
    const prev = points[i - 1];
    const dx = p.x - prev.x;
    const dragX = -dx * 0.45;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(
      p.x + dragX + Math.sin(i * 1.5 + time * 0.2) * 15,
      p.y - 30,
      p.x + dragX * 0.8 + Math.cos(i) * 10,
      p.y - 50,
    );
    ctx.stroke();

    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
  }

  // Core hot white slash
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  ctx.restore();
}

// --- Elemental particles (rising flame wisps + dark soot smoke) ---

export function spawnParticle(x, y) {
  const rand = Math.random();
  const p = {
    x, y,
    vx: (Math.random() - 0.5) * 4,
    vy: -Math.random() * 4.5 - 2, // rise rapidly
    life: 0,
    maxLife: Math.floor(Math.random() * 25) + 20,
    size: Math.random() * 10 + 6,
  };

  if (rand > 0.65) {
    p.type = 'smoke';
    p.size = Math.random() * 12 + 6;
  } else {
    p.type = 'flame';
    p.color = '#ffffff';
  }
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
  ctx.globalAlpha = lifeRatio * 0.95;

  if (p.type === 'smoke') {
    ctx.fillStyle = 'rgba(30, 27, 38, 0.45)';
    const curSize = p.size * (1 + (1 - lifeRatio) * 1.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, curSize, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalCompositeOperation = 'lighter';
    if (lifeRatio > 0.75) ctx.fillStyle = '#ffffff';
    else if (lifeRatio > 0.5) ctx.fillStyle = '#facc15';
    else if (lifeRatio > 0.25) ctx.fillStyle = '#f97316';
    else ctx.fillStyle = '#dc2626';

    const r = p.size * lifeRatio;
    ctx.beginPath();
    ctx.moveTo(p.x - r, p.y);
    ctx.quadraticCurveTo(p.x - r, p.y - r * 1.4, p.x, p.y - r * 2.3);
    ctx.quadraticCurveTo(p.x + r, p.y - r * 1.4, p.x + r, p.y);
    ctx.quadraticCurveTo(p.x, p.y + r * 0.5, p.x - r, p.y);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
