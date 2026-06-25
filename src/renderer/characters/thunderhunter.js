// Storm Tengu Hunter — wild swept-back silver hair.
// Pure hair drawer consumed by drawSlayer (slayerBody.js).

export const id = 'thunderhunter';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy + 3);
  ctx.lineTo(hx - 12, hy - 4);
  ctx.lineTo(hx - 4, hy - 6);
  ctx.lineTo(hx - 6, hy - 10);
  ctx.lineTo(hx, hy - 7);
  ctx.lineTo(hx + 4, hy - 9);
  ctx.lineTo(hx + 3, hy - 4);
  ctx.lineTo(hx + 8, hy - 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 5, hy - 5, 2, 0, Math.PI * 2);
  ctx.arc(hx, hy - 6, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
