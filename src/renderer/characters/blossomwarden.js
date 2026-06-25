// Crimson Shrine Maiden (Miko) — long black hair framing the face.
// Pure hair drawer consumed by drawSlayer (slayerBody.js).

export const id = 'blossomwarden';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 7, hy + 8);  // left strand bottom
  ctx.lineTo(hx - 7, hy - 4);  // top left
  ctx.lineTo(hx - 2, hy - 6);  // top center-left
  ctx.lineTo(hx + 4, hy - 5);  // top center-right
  ctx.lineTo(hx + 8, hy + 7);  // right strand bottom
  ctx.lineTo(hx + 5, hy + 1);  // right side cut-in
  ctx.lineTo(hx + 2, hy - 2);  // bangs right
  ctx.lineTo(hx - 1, hy - 1);  // bangs center
  ctx.lineTo(hx - 4, hy + 2);  // bangs left cut-in
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 4, hy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
