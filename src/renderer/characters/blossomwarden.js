// Blossom Demon Warden — long pink-and-black spiky hair.

export const id = 'blossomwarden';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 4, hy - 3);
  ctx.lineTo(hx - 10, hy + 5);
  ctx.lineTo(hx - 6, hy - 5);
  ctx.lineTo(hx - 2, hy - 7);
  ctx.lineTo(hx + 3, hy - 6);
  ctx.lineTo(hx + 6, hy - 2);
  ctx.lineTo(hx + 5, hy + 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 8, hy + 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
}
