// Shared "warden" body renderer — ported from OriginalCosmeticsMock.jsx (the
// legally-distinct "Original Lore" designs). Pure: takes a 2D context + a plain
// character descriptor (from src/data/characters.js) and a per-character hair
// drawer. Imports zero React. The body, the Wagara-patterned Haori, the portable
// Ward-Shrine (Zushi) on the back, the cursed sibling peeking out, the
// floating-hand katana, and the breath-aura particles are identical across all
// five wardens; only the hair shape, colors, and fabric pattern differ (those
// come from the descriptor + the injected `drawHair`).
//
// SPRITE-READY: this entire procedural figure is the sprite-swap point.

// --- Wagara fabric patterns (lazily built once, cached by patternType) ---
// CanvasPattern objects are tied to the canvas they were created from; the game
// uses a single canvas, so a module-level cache is safe.
let _patterns = null;

// Each motif is drawn on a SUPERSAMPLED tile (PATTERN_SS×) and then scaled back
// down via CanvasPattern.setTransform, so the wagara stays crisp instead of
// bilinear-blurring once the figure is scaled up (~1.7× MONK_SCALE × DPR × camera
// zoom). PATTERN_SCALE also enlarges the motif a touch so it reads cleanly at
// gameplay size. The draw callbacks stay in the original logical tile units.
const PATTERN_SS = 3;
const PATTERN_SCALE = 1.35;

function makePattern(ctx, tile, draw) {
  const c = document.createElement('canvas');
  c.width = tile * PATTERN_SS;
  c.height = tile * PATTERN_SS;
  const cc = c.getContext('2d');
  cc.scale(PATTERN_SS, PATTERN_SS);
  draw(cc);
  const pat = ctx.createPattern(c, 'repeat');
  if (pat && pat.setTransform) {
    // DOMMatrix2DInit dict (no DOMMatrix global needed): scale the supersampled
    // tile back down to PATTERN_SCALE× its logical footprint.
    const k = PATTERN_SCALE / PATTERN_SS;
    pat.setTransform({ a: k, b: 0, c: 0, d: k, e: 0, f: 0 });
  }
  return pat;
}

function buildPatterns(ctx) {
  const patterns = {};

  // 1. Seigaiha (blue waves) — Ronin
  patterns['seigaiha_blue'] = makePattern(ctx, 20, (c) => {
    c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, 20, 20);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.5;
    for (let yy = 0; yy <= 20; yy += 10) {
      for (let xx = (yy % 20 === 0 ? 0 : -10); xx <= 20; xx += 20) {
        c.beginPath(); c.arc(xx + 10, yy + 10, 8, Math.PI, 0); c.stroke();
        c.beginPath(); c.arc(xx + 10, yy + 10, 5, Math.PI, 0); c.stroke();
        c.beginPath(); c.arc(xx + 10, yy + 10, 2, Math.PI, 0); c.stroke();
      }
    }
  });

  // 2. Kumo (purple storm clouds) — Tengu
  patterns['kumo_purple'] = makePattern(ctx, 24, (c) => {
    c.fillStyle = '#4c1d95'; c.fillRect(0, 0, 24, 24);
    c.strokeStyle = '#cbd5e1'; c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(4, 12); c.quadraticCurveTo(8, 4, 16, 8); c.quadraticCurveTo(20, 12, 16, 16); c.quadraticCurveTo(8, 20, 4, 12);
    c.stroke();
  });

  // 3. Asanoha (red hemp leaf) — Miko
  patterns['asanoha_red'] = makePattern(ctx, 20, (c) => {
    c.fillStyle = '#dc2626'; c.fillRect(0, 0, 20, 20);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(10, 0); c.lineTo(10, 20);
    c.moveTo(0, 10); c.lineTo(20, 10);
    c.moveTo(0, 0); c.lineTo(20, 20);
    c.moveTo(20, 0); c.lineTo(0, 20);
    c.moveTo(10, 10); c.lineTo(20, 0);
    c.stroke();
  });

  // 4. Yagasuri (black arrow feathers) — Kensei
  patterns['yagasuri_black'] = makePattern(ctx, 16, (c) => {
    c.fillStyle = '#f5f5f4'; c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#1c1917';
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(8, 8); c.lineTo(0, 16); c.fill();
    c.beginPath();
    c.moveTo(16, 0); c.lineTo(8, 8); c.lineTo(16, 16); c.fill();
  });

  // 5. Shippo (overlapping circles, flame palette) — Kabuki
  patterns['shippo_flame'] = makePattern(ctx, 20, (c) => {
    c.fillStyle = '#9f1239'; c.fillRect(0, 0, 20, 20);
    c.strokeStyle = '#fcd34d'; c.lineWidth = 1.5;
    const shippo = (cx, cy) => { c.beginPath(); c.arc(cx, cy, 10, 0, Math.PI * 2); c.stroke(); };
    shippo(0, 0); shippo(20, 0); shippo(0, 20); shippo(20, 20); shippo(10, 10);
  });

  return patterns;
}

export function getFabricPattern(ctx, patternType) {
  if (!_patterns) _patterns = buildPatterns(ctx);
  return _patterns[patternType] || '#ffffff';
}

// --- Breath-aura particles (the "breathing technique" haze + swim bubbles) ---
// Module-level, hard-capped, drawn in the same logical space as the figure. Pure
// cosmetics; a `null` (cap reached) is simply dropped. Only one figure renders per
// frame per screen, so a single shared buffer is fine.
const AURA_CAP = 48;
const _aura = [];

function spawnAura(p) {
  if (_aura.length >= AURA_CAP) return;
  _aura.push(p);
}

function updateDrawAura(ctx) {
  for (let i = _aura.length - 1; i >= 0; i--) {
    const a = _aura[i];
    a.x += a.vx;
    a.y += a.vy;
    a.life -= a.decay;
    if (a.life <= 0) { _aura.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.max(0, a.life) * a.alpha;
    ctx.fillStyle = a.color;
    if (a.glow) { ctx.shadowColor = a.color; ctx.shadowBlur = a.size * 2.5; }
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draw a full warden figure (body + Ward-Shrine + sibling + Haori + floating
 * katana, and the head via the injected `drawHair`).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 * @param {number} opts.x        logical x of the figure's feet
 * @param {number} opts.y        logical y of the figure's feet
 * @param {number} opts.scale    overall scale
 * @param {object} opts.char     character descriptor (src/data/characters.js)
 * @param {function} opts.drawHair (ctx, char, hx, hy) => void
 * @param {string} [opts.pose]   'running' | 'idle' | 'slashing' | 'swimming'
 * @param {number} [opts.time]   monotonic frame counter for animation
 */
export function drawSlayer(ctx, { x, y, scale, char, drawHair, pose = 'running', time = 0 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // --- Animation calculations ---
  let bobY = 0;
  const runCycle = time * 0.22;
  let legStride = 0;
  let headBob = 0;
  let swordAngle = 0.25;
  let handX = 14;
  let handY = -24;

  // Swimming: the whole figure dives forward into the water surface.
  if (pose === 'swimming') {
    ctx.rotate(1.2);
    ctx.translate(15, -20);
  }

  if (pose === 'running') {
    bobY = Math.sin(runCycle * 2) * 2.2;
    headBob = Math.sin(runCycle * 2) * 1.2;
    legStride = Math.sin(runCycle) * 14;
  } else if (pose === 'idle') {
    // Standing ambient — a slow, shallow breathing bob with feet planted.
    bobY = Math.sin(time * 0.04) * 0.7;
    headBob = Math.sin(time * 0.04) * 0.4;
    legStride = 2;
  } else if (pose === 'slashing') {
    // Keeps striding; the floating sword-hand drives a fast follow-through strike.
    bobY = Math.sin(runCycle * 2) * 2.2;
    headBob = Math.sin(runCycle * 2) * 1.2;
    legStride = Math.sin(runCycle) * 14;
    swordAngle = -1.2 + Math.sin(time * 0.5) * 0.6;
    handX = 8 + Math.sin(time * 0.5) * 8;
    handY = -30;
  } else if (pose === 'swimming') {
    bobY = Math.sin(time * 0.08) * 3;
    headBob = -Math.sin(time * 0.08) * 1.5;
    legStride = Math.sin(time * 0.2) * 10;
    handX = 5 + Math.sin(time * 0.2) * 8;
    handY = -18 + Math.cos(time * 0.2) * 5;
    swordAngle = 0.5 + Math.sin(time * 0.1) * 0.2;
  }

  const isSwimming = pose === 'swimming';
  const currentPattern = getFabricPattern(ctx, char.patternType);

  // A. Waving scarf (filled with the warden's fabric pattern)
  const scarfWave = Math.sin(runCycle * 1.5) * 12;
  ctx.save();
  ctx.strokeStyle = currentPattern;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -29 + bobY + headBob);
  if (isSwimming) {
    ctx.quadraticCurveTo(-12, -18 + bobY + scarfWave * 0.5, -25, -10 + bobY);
  } else {
    ctx.quadraticCurveTo(-18, -23 + bobY + scarfWave, -40, -29 + bobY - scarfWave * 0.7);
  }
  ctx.stroke();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  ctx.restore();

  // B. The portable Ward-Shrine (Zushi) on the back — carries the cursed sibling.
  const boxX = -15;
  const boxY = -5 + bobY;
  const boxW = 16;
  const boxH = 28;

  ctx.save();
  ctx.translate(boxX, boxY);

  // Shrine body (dark lacquered wood)
  ctx.fillStyle = '#292524';
  ctx.fillRect(-boxW / 2, -boxH, boxW, boxH);

  // Curved temple roof
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.moveTo(-boxW / 2 - 3, -boxH);
  ctx.quadraticCurveTo(0, -boxH - 6, boxW / 2 + 3, -boxH);
  ctx.lineTo(boxW / 2, -boxH + 2);
  ctx.lineTo(-boxW / 2, -boxH + 2);
  ctx.fill();

  // Brass corner fittings
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(-boxW / 2, -boxH + 2, 2, 2);
  ctx.fillRect(boxW / 2 - 2, -boxH + 2, 2, 2);
  ctx.fillRect(-boxW / 2, -2, 2, 2);
  ctx.fillRect(boxW / 2 - 2, -2, 2, 2);

  // Dark door slit
  const crackWidth = 2;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(boxW / 2 - 1.5 - crackWidth, -boxH + 6, crackWidth, boxH - 10);

  // Shimenawa (sacred straw rope) wrapping the shrine
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-boxW / 2 - 1, -boxH * 0.4);
  ctx.quadraticCurveTo(0, -boxH * 0.35, boxW / 2 + 1, -boxH * 0.4);
  ctx.stroke();

  // Paper talismans (ofuda)
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-boxW / 2 + 2, -boxH * 0.4, 3, 7);
  ctx.fillRect(boxW / 2 - 5, -boxH * 0.4, 3, 6);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-boxW / 2 + 2.5, -boxH * 0.4 + 1, 2, 1);
  ctx.fillRect(-boxW / 2 + 2.5, -boxH * 0.4 + 3, 2, 2);
  ctx.fillRect(boxW / 2 - 4.5, -boxH * 0.4 + 1, 2, 1.5);

  // The cursed sibling peeks out intermittently (teal mystic glow).
  const isPeeking = Math.sin(time * 0.03) > 0.45;
  if (isPeeking) {
    ctx.save();
    ctx.translate(boxW / 2 - 1 - crackWidth / 2, -boxH * 0.5);

    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(-1, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.moveTo(-3, -2); ctx.lineTo(-1, -4); ctx.lineTo(1, -2); ctx.lineTo(-1, 0);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#2dd4bf';
    ctx.shadowColor = '#2dd4bf';
    ctx.shadowBlur = 5;
    ctx.fillRect(-2, -0.8, 0.8, 0.8);
    ctx.fillRect(-0.5, -0.8, 0.8, 0.8);
    ctx.shadowBlur = 0;

    ctx.restore();
  } else if (Math.sin(time * 0.05) > -0.9) {
    ctx.fillStyle = '#2dd4bf';
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
  if (isSwimming) {
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

  // G. Head + skin, then per-warden hair via the injected drawer
  const hx = 0;
  const hy = -28 + bobY + headBob;

  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.arc(hx, hy + 3, 5, 0, Math.PI * 2);
  ctx.fill();

  drawHair(ctx, char, hx, hy);

  // H. Floating sword-hand & tempered katana (no connecting arm — easier, snappier
  // to animate, and reads cleaner at gameplay scale).
  ctx.save();
  ctx.translate(handX, handY + bobY);

  // Floating hand grip
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(swordAngle);

  // Guard (tsuba)
  ctx.fillStyle = char.guardColor;
  ctx.fillRect(-1.5, -3, 3, 6);

  // Handle (tsuka) behind the hand
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-5, -1.5, 3.5, 3);

  // Blade
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 0); ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, 0); ctx.stroke();

  // Accent edge glow
  ctx.strokeStyle = char.accentColor;
  ctx.lineWidth = 0.8;
  ctx.shadowColor = char.accentColor;
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.moveTo(2, -0.5); ctx.lineTo(34, -0.5); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();

  ctx.restore(); // main scale/transform

  // --- FX in logical space ---

  // Slash arc — the visible "line" left by the strike. Drawn over the figure when
  // slashing so a clear accent sweep reads even at small gameplay scale.
  if (pose === 'slashing') {
    ctx.save();
    ctx.translate(x + 16 * scale, y - 16 * scale);
    ctx.strokeStyle = char.accentColor;
    ctx.shadowColor = char.accentColor;
    ctx.shadowBlur = 12;
    ctx.lineWidth = (4 + Math.sin(time * 0.5) * 1.5) * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-8 * scale, 0, 32 * scale, -1.4, 0.6);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(-8 * scale, 0, 32 * scale, -1.3, 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // --- Breath-aura particles (the "breathing technique" haze rising off the warden) ---
  if (pose !== 'idle' && Math.random() < 0.5) {
    spawnAura({
      x: x + (6 + Math.random() * 6) * scale,
      y: y - (24 + Math.random() * 4) * scale,
      vx: (Math.random() - 0.5) * 0.6 * scale,
      vy: -(0.3 + Math.random() * 0.6) * scale,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      color: char.accentColor,
      size: (1.3 + Math.random() * 1.6) * scale,
      alpha: 0.5,
      glow: true,
    });
  }

  // Swim bubbles rising past the diving warden.
  if (pose === 'swimming' && Math.random() < 0.3) {
    spawnAura({
      x: x + (Math.random() * 40 - 20) * scale,
      y: y + 6 * scale,
      vx: (Math.random() - 0.5) * 0.3 * scale,
      vy: -(0.6 + Math.random() * 0.9) * scale,
      life: 1,
      decay: 0.015 + Math.random() * 0.015,
      color: 'rgba(255, 255, 255, 0.7)',
      size: (1.2 + Math.random() * 1.6) * scale,
      alpha: 0.6,
      glow: false,
    });
  }

  updateDrawAura(ctx);
}
