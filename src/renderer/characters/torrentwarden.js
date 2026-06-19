// Water Torrent Warden — spiky black hair tied back in a low ponytail.

export const id = 'torrentwarden';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy + 1);
  ctx.lineTo(hx - 8, hy - 4);
  ctx.lineTo(hx - 3, hy - 4);
  ctx.lineTo(hx - 2, hy - 8);
  ctx.lineTo(hx + 3, hy - 5);
  ctx.lineTo(hx + 6, hy - 1);
  ctx.lineTo(hx + 4, hy + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 1, hy - 5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Low ponytail
  if (char.hasPonytail) {
    ctx.fillStyle = char.hairColor;
    ctx.beginPath();
    ctx.moveTo(hx - 5, hy + 2);
    ctx.quadraticCurveTo(hx - 16, hy + 6, hx - 14, hy + 14);
    ctx.quadraticCurveTo(hx - 10, hy + 8, hx - 3, hy + 4);
    ctx.closePath();
    ctx.fill();
  }
}
