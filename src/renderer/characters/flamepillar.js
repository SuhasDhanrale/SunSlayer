// Kabuki Lion Master — wild, voluminous Renjishi lion-dance mane.
// Pure hair drawer consumed by drawSlayer (slayerBody.js).

export const id = 'flamepillar';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 8, hy + 5);
  ctx.lineTo(hx - 14, hy - 2);
  ctx.lineTo(hx - 8, hy - 6);
  ctx.lineTo(hx - 12, hy - 12);
  ctx.lineTo(hx - 4, hy - 9);
  ctx.lineTo(hx, hy - 14);
  ctx.lineTo(hx + 4, hy - 9);
  ctx.lineTo(hx + 12, hy - 12);
  ctx.lineTo(hx + 8, hy - 6);
  ctx.lineTo(hx + 14, hy - 2);
  ctx.lineTo(hx + 8, hy + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 6, hy - 8, 2, 0, Math.PI * 2);
  ctx.arc(hx + 6, hy - 8, 2, 0, Math.PI * 2);
  ctx.fill();
}
