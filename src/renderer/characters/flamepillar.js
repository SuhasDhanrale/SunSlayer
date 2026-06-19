// Flame Pillar Warden — wild spiky yellow hair with crimson streaks.

export const id = 'flamepillar';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 7, hy + 2);
  ctx.lineTo(hx - 10, hy - 6);
  ctx.lineTo(hx - 4, hy - 3);
  ctx.lineTo(hx - 5, hy - 9);
  ctx.lineTo(hx, hy - 5);
  ctx.lineTo(hx + 5, hy - 9);
  ctx.lineTo(hx + 4, hy - 3);
  ctx.lineTo(hx + 9, hy - 5);
  ctx.lineTo(hx + 6, hy + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 4, hy - 6, 2, 0, Math.PI * 2);
  ctx.arc(hx + 4, hy - 6, 2, 0, Math.PI * 2);
  ctx.arc(hx, hy - 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
