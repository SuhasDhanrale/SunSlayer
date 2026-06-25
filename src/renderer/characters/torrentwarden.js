// Kensei Crane Warden — neat, sharp white swordmaster's hair.
// Pure hair drawer consumed by drawSlayer (slayerBody.js).

export const id = 'torrentwarden';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy + 1);
  ctx.lineTo(hx - 7, hy - 5);
  ctx.lineTo(hx - 3, hy - 5);
  ctx.lineTo(hx - 1, hy - 8);
  ctx.lineTo(hx + 3, hy - 5);
  ctx.lineTo(hx + 6, hy - 2);
  ctx.lineTo(hx + 5, hy + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx, hy - 6, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
