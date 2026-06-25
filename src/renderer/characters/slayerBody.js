// Shared "slayer" body renderer — ported from CosmeticsMock.jsx. Pure: takes a
// 2D context + a plain character descriptor (from src/data/characters.js) and a
// per-character hair drawer. Imports zero React. The body, the patterned Haori,
// the cedar box on the back, and the sister peeking out are identical across all
// five characters; only the hair shape, colors, pattern, and decoration flags
// differ (those come from the descriptor + the injected `drawHair`).
//
// SPRITE-READY: this entire procedural figure is the sprite-swap point.

// --- Geometric fabric patterns (lazily built once, cached by patternType) ---
// CanvasPattern objects are tied to the canvas they were created from; the game
// uses a single canvas, so a module-level cache is safe.
let _patterns = null;

function buildPatterns(ctx) {
  const patterns = {};

  // 1. Green/White checkered (default starter)
  const p1 = document.createElement('canvas');
  p1.width = 12; p1.height = 12;
  const c1 = p1.getContext('2d');
  c1.fillStyle = '#065f46';
  c1.fillRect(0, 0, 12, 12);
  c1.fillStyle = '#f1f5f9';
  c1.fillRect(0, 0, 6, 6);
  c1.fillRect(6, 6, 6, 6);
  patterns['checkered_green'] = ctx.createPattern(p1, 'repeat');

  // 2. Yellow/Orange diagonal stripes (Thunder Flash Hunter)
  const p2 = document.createElement('canvas');
  p2.width = 16; p2.height = 16;
  const c2 = p2.getContext('2d');
  c2.fillStyle = '#f59e0b';
  c2.fillRect(0, 0, 16, 16);
  c2.strokeStyle = '#ea580c';
  c2.lineWidth = 4;
  c2.beginPath();
  c2.moveTo(0, 0); c2.lineTo(16, 16);
  c2.moveTo(-8, 8); c2.lineTo(8, 24);
  c2.moveTo(8, -8); c2.lineTo(24, 8);
  c2.stroke();
  patterns['striped_yellow'] = ctx.createPattern(p2, 'repeat');

  // 3. Pink/White diamonds (Blossom Demon Warden)
  const p3 = document.createElement('canvas');
  p3.width = 14; p3.height = 14;
  const c3 = p3.getContext('2d');
  c3.fillStyle = '#fbcfe8';
  c3.fillRect(0, 0, 14, 14);
  c3.fillStyle = '#ffffff';
  c3.beginPath();
  c3.moveTo(7, 0); c3.lineTo(14, 7); c3.lineTo(7, 14); c3.lineTo(0, 7);
  c3.closePath(); c3.fill();
  patterns['diamond_pink'] = ctx.createPattern(p3, 'repeat');

  // 4. Blue wave slices (Water Torrent Warden)
  const p4 = document.createElement('canvas');
  p4.width = 18; p4.height = 18;
  const c4 = p4.getContext('2d');
  c4.fillStyle = '#0284c7';
  c4.fillRect(0, 0, 18, 18);
  c4.strokeStyle = '#ffffff';
  c4.lineWidth = 2.5;
  c4.beginPath();
  c4.moveTo(-4, 9); c4.quadraticCurveTo(5, 0, 14, 9);
  c4.moveTo(5, 18); c4.quadraticCurveTo(14, 9, 23, 18);
  c4.stroke();
  patterns['wave_blue'] = ctx.createPattern(p4, 'repeat');

  // 5. Red flame slices (Flame Pillar Warden)
  const p5 = document.createElement('canvas');
  p5.width = 20; p5.height = 20;
  const c5 = p5.getContext('2d');
  c5.fillStyle = '#dc2626';
  c5.fillRect(0, 0, 20, 20);
  c5.fillStyle = '#fbbf24';
  c5.beginPath();
  c5.moveTo(0, 20);
  c5.lineTo(4, 8); c5.lineTo(8, 16); c5.lineTo(12, 4); c5.lineTo(16, 14); c5.lineTo(20, 20);
  c5.closePath(); c5.fill();
  patterns['flame_red'] = ctx.createPattern(p5, 'repeat');

  return patterns;
}

export function getFabricPattern(ctx, patternType) {
  if (!_patterns) _patterns = buildPatterns(ctx);
  return _patterns[patternType] || '#ffffff';
}

/**
 * Draw a full slayer figure (body + box + sister + Haori + arm/katana, and the
 * head via the injected `drawHair`).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 * @param {number} opts.x        logical x of the figure's feet
 * @param {number} opts.y        logical y of the figure's feet
 * @param {number} opts.scale    overall scale (mock used ~min(w,h)*0.0035)
 * @param {object} opts.char     character descriptor (src/data/characters.js)
 * @param {function} opts.drawHair (ctx, char, hx, hy) => void
 * @param {string} [opts.pose]   'running' | 'slashing' | 'charging'
 * @param {number} [opts.time]   monotonic frame counter for animation
 */
export function drawSlayer(ctx, { x, y, scale, char, drawHair, pose = 'running', time = 0 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // --- Animation calculations ---
  // (swimTilt is computed below; the rotate is applied straight after, before any
  // body part is drawn, so the lean wraps the entire figure.)
  let bobY = 0;
  const runCycle = time * 0.22;
  let legStride = 0;
  let headBob = 0;
  let swordAngle = 0.25;
  let handX = 14;
  let handY = -24;
  let swimTilt = 0; // forward lean (radians) applied to the whole figure when swimming

  if (pose === 'running') {
    bobY = Math.sin(runCycle * 2) * 2.2;
    headBob = Math.sin(runCycle * 2) * 1.2;
    legStride = Math.sin(runCycle) * 14;
  } else if (pose === 'idle') {
    // Standing ambient — a slow, shallow breathing bob with feet planted. Used by
    // menu/preview stages where the figure waits rather than runs (e.g. the home
    // screen monk before the player slices the lamp).
    bobY = Math.sin(time * 0.04) * 0.7;
    headBob = Math.sin(time * 0.04) * 0.4;
    legStride = 2;
  } else if (pose === 'swimming') {
    // Surface flutter-kick: the whole figure leans forward into the water, bobs
    // gently with the swell, and the legs do a quick small alternating kick (no
    // ground stride). The sword arm reaches forward like a freestyle pull.
    swimTilt = 0.55;
    bobY = Math.sin(runCycle * 2) * 1.6;
    headBob = Math.sin(runCycle * 2) * 0.8;
    legStride = Math.sin(runCycle * 2.2) * 9;
    swordAngle = 0.05;
    handX = 18;
    handY = -26;
  } else if (pose === 'slashing') {
    bobY = 3.5;
    legStride = 9;
    swordAngle = -1.1 + Math.sin(time * 0.18) * 0.35;
    handX = 20;
    handY = -21;
  } else if (pose === 'charging') {
    bobY = 7;
    legStride = 13;
    headBob = -1.5;
    handX = 4;
    handY = -15;
  }

  // Swimming lean: rotate the whole figure forward around its feet origin so the
  // monk lies into the water surface instead of standing upright on it.
  if (swimTilt) ctx.rotate(swimTilt);

  const currentPattern = getFabricPattern(ctx, char.patternType);

  // A. Waving scarf (filled with the character's fabric pattern)
  const scarfWave = Math.sin(runCycle * 1.5) * 12;
  ctx.save();
  ctx.strokeStyle = currentPattern;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -29 + bobY + headBob);
  if (pose === 'charging') {
    ctx.quadraticCurveTo(-12, -18 + bobY + scarfWave * 0.5, -25, -10 + bobY);
  } else {
    ctx.quadraticCurveTo(-18, -23 + bobY + scarfWave, -40, -29 + bobY - scarfWave * 0.7);
  }
  ctx.stroke();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  ctx.restore();

  // B. Consistent wooden box on the back (carrying the sister)
  const boxX = -15;
  const boxY = -20 + bobY;
  const boxW = 14;
  const boxH = 25;

  ctx.save();
  ctx.translate(boxX, boxY);

  ctx.fillStyle = '#653c24';
  ctx.fillRect(-boxW / 2, -boxH, boxW, boxH);

  ctx.fillStyle = '#18120e';
  const isDarkPose = pose === 'charging';
  const crackWidth = isDarkPose ? 4.5 : 2;
  ctx.fillRect(boxW / 2 - 1.5 - crackWidth, -boxH + 3, crackWidth, boxH - 6);

  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-boxW / 2 - 0.5, -boxH, boxW + 1, 2.5);
  ctx.fillRect(-boxW / 2 - 0.5, -2.5, boxW + 1, 2.5);
  ctx.fillRect(-boxW / 2 - 0.5, -boxH + 2.5, 2, boxH - 5);
  ctx.fillRect(boxW / 2 - 1.5, -boxH + 2.5, 2, boxH - 5);

  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(boxW / 2 - 4.5, -boxH * 0.5 - 2, 2.5, 4);

  // Sister peeks out of the box (always when dark, else intermittently)
  const isPeeking = isDarkPose || (Math.sin(time * 0.03) > 0.45);
  if (isPeeking) {
    ctx.save();
    ctx.translate(boxW / 2 - 1 - crackWidth / 2, -boxH * 0.5);

    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(-1, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(-2.5, -2); ctx.lineTo(-1, -3); ctx.lineTo(0.5, -1.8); ctx.lineTo(-1, 0);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 4;
    ctx.fillRect(-2, -0.8, 0.8, 0.8);
    ctx.fillRect(-0.5, -0.8, 0.8, 0.8);
    ctx.shadowBlur = 0;

    ctx.restore();
  } else if (Math.sin(time * 0.05) > -0.9) {
    // Just glowing eyes deep inside the dark box
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(boxW / 2 - 2.5, -boxH * 0.5 - 1.5, 0.8, 0, Math.PI * 2);
    ctx.arc(boxW / 2 - 2.5, -boxH * 0.5 + 1, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // C. Legs & Kyahan (shin wraps)
  ctx.save();
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  const leg1X = legStride * 0.6;
  const leg1Y = 11;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(leg1X, leg1Y); ctx.stroke();

  const leg2X = -legStride * 0.6;
  const leg2Y = 11;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(leg2X, leg2Y); ctx.stroke();

  const drawKyahan = (lx, ly) => {
    ctx.save();
    ctx.translate(lx * 0.6, ly * 0.6);
    ctx.scale(0.8, 0.8);

    ctx.fillStyle = char.accentColor;
    ctx.fillRect(-3.5, 0, 7, 6);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-3, 1.5); ctx.lineTo(3, 3.5);
    ctx.moveTo(3, 1.5); ctx.lineTo(-3, 3.5);
    ctx.moveTo(-3, 3.5); ctx.lineTo(3, 5.5);
    ctx.stroke();
    ctx.restore();
  };
  drawKyahan(leg1X, leg1Y);
  drawKyahan(leg2X, leg2Y);
  ctx.restore();

  // D. Dark uniform chest
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.moveTo(-9, bobY);
  ctx.lineTo(9, bobY);
  ctx.lineTo(7, -23 + bobY);
  ctx.lineTo(-7, -23 + bobY);
  ctx.closePath();
  ctx.fill();

  // E. Signature white belt
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6.5, -9 + bobY, 13, 2.5);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(-1.5, -9.5 + bobY, 3, 3.5);

  // F. Patterned Haori (tail + sleeves)
  ctx.save();
  ctx.fillStyle = currentPattern;

  ctx.beginPath();
  if (pose === 'charging') {
    ctx.moveTo(-8, -20 + bobY);
    ctx.lineTo(-2, -20 + bobY);
    ctx.lineTo(-8, bobY);
    ctx.lineTo(-12, bobY);
  } else {
    ctx.moveTo(-8, -20 + bobY);
    ctx.lineTo(-2, -20 + bobY);
    ctx.quadraticCurveTo(-14, -6 + bobY + scarfWave * 0.4, -20, bobY - 2);
    ctx.lineTo(-14, bobY + 3);
  }
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-9, -21 + bobY);
  ctx.lineTo(-1, -21 + bobY);
  ctx.lineTo(-5, -7 + bobY);
  ctx.lineTo(-12, -7 + bobY);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(9, -21 + bobY);
  ctx.lineTo(1, -21 + bobY);
  ctx.lineTo(5, -7 + bobY);
  ctx.lineTo(12, -7 + bobY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  ctx.restore();

  // G. Head + skin, then per-character hair via the injected drawer
  const hx = 0;
  const hy = -28 + bobY + headBob;

  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.arc(hx, hy + 3, 5, 0, Math.PI * 2);
  ctx.fill();

  drawHair(ctx, char, hx, hy);

  // H. Arm & Nichirin katana
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(3, -16 + bobY);
  ctx.lineTo(handX, handY + bobY);
  ctx.stroke();

  ctx.save();
  ctx.translate(handX, handY + bobY);
  ctx.rotate(swordAngle);

  ctx.fillStyle = char.guardColor;
  ctx.fillRect(-1.5, -3, 3, 6);

  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 0); ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, 0); ctx.stroke();

  ctx.strokeStyle = char.accentColor;
  ctx.lineWidth = 0.8;
  ctx.shadowColor = char.accentColor;
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.moveTo(2, -0.5); ctx.lineTo(34, -0.5); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();

  ctx.restore(); // main scale

  // I. Pose FX (preview-only flourishes, kept for fidelity with the mock)
  if (pose === 'slashing') {
    ctx.save();
    ctx.translate(x + 10 * scale, y - 18 * scale);
    ctx.strokeStyle = char.accentColor;
    ctx.shadowColor = char.accentColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 5 + Math.sin(time * 0.4) * 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-8, 0, 65, -0.5, 1.3);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-8, 0, 65, -0.4, 1.2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  } else if (pose === 'charging') {
    ctx.save();
    ctx.translate(x, y - 18 * scale);
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + time * 0.05;
      const radius = 90 - (time * 1.8 + i * 18) % 80;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px * 0.75, py * 0.75);
      ctx.stroke();
    }
    ctx.restore();
  }
}
