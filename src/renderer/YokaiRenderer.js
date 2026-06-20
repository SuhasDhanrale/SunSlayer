import { getYokai } from '../data/yokai.js';

const TAU = Math.PI * 2;

function oniPath(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, 5, r * 0.9, 0, Math.PI, false);
  ctx.lineTo(-r * 0.9, -r * 0.2);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.95, 0, -r * 0.95);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.95, r * 0.9, -r * 0.2);
  ctx.closePath();
}

function kitsunePath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, r * 1.2);
  ctx.lineTo(-r * 0.85, 0);
  ctx.lineTo(-r * 0.85, -r * 0.45);
  ctx.lineTo(0, -r * 0.85);
  ctx.lineTo(r * 0.85, -r * 0.45);
  ctx.lineTo(r * 0.85, 0);
  ctx.closePath();
}

function nofacePath(ctx, r) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 1.15, 0, 0, TAU);
  ctx.closePath();
}

function silhouettePath(ctx, type, r) {
  if (type === 'kitsune') kitsunePath(ctx, r);
  else if (type === 'noface') nofacePath(ctx, r);
  else oniPath(ctx, r);
}

function drawOniDetails(ctx, r) {
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.85);
  ctx.quadraticCurveTo(-r * 0.9, -r * 1.1, -r * 0.95, -r * 1.5);
  ctx.quadraticCurveTo(-r * 0.5, -r * 1.1, -r * 0.2, -r * 0.85);
  ctx.moveTo(r * 0.5, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.9, -r * 1.1, r * 0.95, -r * 1.5);
  ctx.quadraticCurveTo(r * 0.5, -r * 1.1, r * 0.2, -r * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.25, r * 0.18, r * 0.08, 0.25, 0, TAU);
  ctx.ellipse(r * 0.3, -r * 0.25, r * 0.18, r * 0.08, -0.25, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, r * 0.45);
  ctx.lineTo(-r * 0.55, r * 0.75);
  ctx.lineTo(-r * 0.3, r * 0.45);
  ctx.moveTo(r * 0.45, r * 0.45);
  ctx.lineTo(r * 0.55, r * 0.75);
  ctx.lineTo(r * 0.3, r * 0.45);
  ctx.closePath();
  ctx.fill();
}

function drawKitsuneDetails(ctx, r) {
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.35);
  ctx.lineTo(-r * 0.95, -r * 1.15);
  ctx.lineTo(-r * 0.3, -r * 0.65);
  ctx.moveTo(r * 0.7, -r * 0.35);
  ctx.lineTo(r * 0.95, -r * 1.15);
  ctx.lineTo(r * 0.3, -r * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = Math.max(4, r * 0.22);
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.22, r * 0.16, r * 0.06, 0.2, 0, TAU);
  ctx.ellipse(r * 0.3, -r * 0.22, r * 0.16, r * 0.06, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.15);
  ctx.lineTo(-r * 0.4, r * 0.05);
  ctx.lineTo(-r * 0.8, r * 0.1);
  ctx.moveTo(r * 0.8, -r * 0.15);
  ctx.lineTo(r * 0.4, r * 0.05);
  ctx.lineTo(r * 0.8, r * 0.1);
  ctx.closePath();
  ctx.fill();
}

function drawNoFaceDetails(ctx, r) {
  ctx.fillStyle = '#86198f';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.lineTo(r * 0.1, -r * 0.45);
  ctx.lineTo(0, -r * 0.3);
  ctx.lineTo(-r * 0.1, -r * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(0, r * 0.5, r * 0.1, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.1, r * 0.1, r * 0.03, 0.1, 0, TAU);
  ctx.ellipse(r * 0.3, -r * 0.1, r * 0.1, r * 0.03, -0.1, 0, TAU);
  ctx.fill();
}

export function drawYokaiMask(ctx, type, r, options = {}) {
  const spec = getYokai(type);
  ctx.save();
  ctx.fillStyle = options.color || spec.color;
  silhouettePath(ctx, spec.id, r);
  ctx.fill();
  ctx.strokeStyle = options.outlineColor || '#020617';
  ctx.lineWidth = options.outlineWidth ?? 3.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
  if (spec.id === 'kitsune') drawKitsuneDetails(ctx, r);
  else if (spec.id === 'noface') drawNoFaceDetails(ctx, r);
  else drawOniDetails(ctx, r);
  ctx.restore();
}

function drawAura(ctx, demon, time) {
  const seed = demon.id * 1000;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const phase = time * 0.0015 + seed + i * 2.1;
    const x = Math.sin(phase * 1.3) * demon.radius * 0.55;
    const y = Math.cos(phase) * demon.radius * 0.45;
    const radius = demon.radius * (0.45 + i * 0.12 + Math.sin(phase) * 0.06);
    ctx.fillStyle = `rgba(45, 20, 58, ${0.08 + i * 0.025})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function clipCutHalf(ctx, demon, side) {
  const cut = demon.cut;
  const extent = demon.radius * 4;
  ctx.rotate(cut.localAngle);
  ctx.beginPath();
  if (side < 0) ctx.rect(-extent, -extent, extent * 2, extent + cut.alignedPointY);
  else ctx.rect(-extent, cut.alignedPointY, extent * 2, extent - cut.alignedPointY);
  ctx.clip();
  ctx.rotate(-cut.localAngle);
}

function drawHalf(ctx, demon, piece, side) {
  ctx.save();
  ctx.translate(demon.x + piece.x, demon.y + piece.y);
  ctx.rotate(demon.cut.baseRotation + piece.rot);
  clipCutHalf(ctx, demon, side);
  drawYokaiMask(ctx, demon.type, demon.radius);
  ctx.restore();
}

function drawCutSeam(ctx, demon) {
  const cut = demon.cut;
  const length = demon.radius * 1.65;
  ctx.save();
  ctx.translate(demon.x + cut.point.x, demon.y + cut.point.y);
  ctx.rotate(cut.angle);
  ctx.strokeStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-length, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  ctx.restore();
}

export function drawYokai(ctx, demon, time) {
  if (!demon.sliced) {
    ctx.save();
    ctx.translate(demon.x, demon.y);
    drawAura(ctx, demon, time);
    ctx.rotate(demon.rot);
    drawYokaiMask(ctx, demon.type, demon.radius);
    ctx.restore();
    return;
  }

  const fade = demon.cut.age <= 0.35 ? 1 : Math.max(0, 1 - (demon.cut.age - 0.35) / 0.3);
  ctx.save();
  ctx.globalAlpha = fade;
  drawHalf(ctx, demon, demon.cut.negative, -1);
  drawHalf(ctx, demon, demon.cut.positive, 1);
  if (demon.cut.phase === 'contact') drawCutSeam(ctx, demon);
  ctx.restore();
}
