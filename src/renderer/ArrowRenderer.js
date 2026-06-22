import { ARROW_TRAP, PALETTE } from '../config/constants.js';

function drawArrow(ctx, arrow, inkColor, telegraph = false) {
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle || 0);
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = PALETTE.crimson;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();
  ctx.shadowColor = PALETTE.crimson;
  ctx.shadowBlur = telegraph ? 14 : 7;
  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.lineTo(9, -7);
  ctx.lineTo(9, 7);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(19, -1.5);
  ctx.lineTo(12, -4.5);
  ctx.stroke();
  ctx.strokeStyle = inkColor;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-44, -8);
  ctx.moveTo(-34, 0);
  ctx.lineTo(-44, 8);
  ctx.stroke();
  ctx.restore();
}

export function drawArrowTrap(ctx, trap, time, inkColor) {
  if (!trap) return;
  ctx.save();
  ctx.translate(trap.x, trap.y);
  ctx.rotate(trap.angle || Math.PI);
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const y = (i - 2.5) * 6;
    ctx.beginPath();
    ctx.moveTo(-38, y);
    ctx.lineTo(29, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(39, y);
    ctx.lineTo(27, y - 5);
    ctx.lineTo(27, y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-38, y);
    ctx.lineTo(-47, y - 5);
    ctx.moveTo(-38, y);
    ctx.lineTo(-47, y + 5);
    ctx.stroke();
  }

  ctx.strokeStyle = PALETTE.crimson;
  ctx.lineWidth = 5;
  for (const x of [-13, 15]) {
    ctx.beginPath();
    ctx.moveTo(x, -23);
    ctx.quadraticCurveTo(x + Math.sin(time * 0.008 + x) * 3, 0, x, 23);
    ctx.stroke();
  }

  ctx.rotate(Math.sin(time * 0.006) * 0.025);
  ctx.fillStyle = '#efe6d1';
  ctx.strokeStyle = PALETTE.crimson;
  ctx.lineWidth = 3;
  ctx.fillRect(-12, -27, 25, 54);
  ctx.strokeRect(-12, -27, 25, 54);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(7, 13);
  ctx.moveTo(7, -12);
  ctx.lineTo(-6, 13);
  ctx.stroke();
  ctx.restore();

  if (trap.tutorial && trap.x > 0) {
    ctx.save();
    ctx.fillStyle = PALETTE.crimson;
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('DO NOT BREAK THE SEAL', trap.x, trap.y - ARROW_TRAP.radius - 28);
    ctx.restore();
  }
}

export function drawArrowBurst(ctx, burst, inkColor) {
  if (!burst) return;
  const telegraph = burst.phase === 'telegraph';
  if (telegraph) {
    const progress = Math.min(1, burst.timer / ARROW_TRAP.telegraphFrames);
    ctx.save();
    ctx.strokeStyle = `rgba(185, 28, 28, ${0.55 * progress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(burst.origin.x, burst.origin.y, 20 + progress * 80, 0, Math.PI * 2);
    ctx.stroke();
    if (progress > 0.42) {
      ctx.setLineDash([9, 9]);
      for (const arrow of burst.arrows) {
        if (arrow.resolution) continue;
        ctx.beginPath();
        ctx.moveTo(arrow.x, arrow.y);
        ctx.lineTo(arrow.targetX, arrow.targetY);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  for (const arrow of burst.arrows) {
    if (arrow.resolution) continue;
    drawArrow(ctx, arrow, inkColor, telegraph || arrow.state === 'queued');
  }
}
