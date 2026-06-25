// Ronin of the Azure Dragon — tied-back topknot (chonmage), no earrings.
// Pure hair drawer consumed by drawSlayer (slayerBody.js).

export const id = 'sunslayer';

export function drawHair(ctx, char, hx, hy) {
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  // Tight pulled-back hair
  ctx.moveTo(hx - 5, hy + 2);
  ctx.lineTo(hx - 6, hy - 4);
  ctx.lineTo(hx - 2, hy - 6);
  ctx.lineTo(hx + 2, hy - 6);
  ctx.lineTo(hx + 5, hy - 3);
  ctx.lineTo(hx + 5, hy + 2);
  // Topknot tuft
  ctx.moveTo(hx, hy - 5);
  ctx.lineTo(hx - 8, hy - 9);
  ctx.lineTo(hx - 3, hy - 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = char.hairTips;
  ctx.beginPath();
  ctx.arc(hx - 2, hy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
