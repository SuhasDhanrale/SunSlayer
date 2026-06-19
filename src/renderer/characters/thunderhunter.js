// Thunder Flash Hunter — bright yellow spiky hair flaring orange at the tips.

export const id = 'thunderhunter';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy + 3);
  ctx.lineTo(hx - 7, hy - 5);
  ctx.lineTo(hx - 3, hy - 5);
  ctx.lineTo(hx, hy - 8);
  ctx.lineTo(hx + 3, hy - 5);
  ctx.lineTo(hx + 7, hy - 5);
  ctx.lineTo(hx + 6, hy + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 5, hy + 1, 1.8, 0, Math.PI * 2);
  ctx.arc(hx + 5, hy + 1, 1.8, 0, Math.PI * 2);
  ctx.fill();
}
