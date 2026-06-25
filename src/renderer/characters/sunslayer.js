// Checkered sun warden hair — spiky dark-red hair + dangling card earrings.
// Pure hair drawer consumed by drawSlayer (slayerBody.js).

export const id = 'sunslayer';

export function drawHair(ctx, char, hx, hy) {
  // Spiky hair
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy + 2);
  ctx.lineTo(hx - 8, hy - 4);
  ctx.lineTo(hx - 4, hy - 2);
  ctx.lineTo(hx - 5, hy - 7);
  ctx.lineTo(hx, hy - 4);
  ctx.lineTo(hx + 4, hy - 7);
  ctx.lineTo(hx + 3, hy - 2);
  ctx.lineTo(hx + 7, hy - 1);
  ctx.lineTo(hx + 5, hy + 3);
  ctx.lineTo(hx - 1, hy + 1);
  ctx.closePath();
  ctx.fill();

  // Highlights
  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 3, hy - 3, 2, 0, Math.PI * 2);
  ctx.arc(hx + 2, hy - 4, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Small plain earring — neutral gold stud (no card/sun motif)
  if (char.hasEarrings) {
    ctx.fillStyle = '#d4af37';
    ctx.beginPath(); ctx.arc(hx + 4.5, hy + 6.5, 1, 0, Math.PI * 2); ctx.fill();
  }
}
