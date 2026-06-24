import { ARROW_TRAP, PALETTE } from '../config/constants.js';

// A single teardrop flame tongue, widest at `baseX`, tapering to a point `dir*len`
// away. `dir` = +1 trails ahead of travel (the tip flare), -1 streams behind.
function flameTongue(ctx, baseX, dir, len, halfW) {
  ctx.beginPath();
  ctx.moveTo(baseX, -halfW);
  ctx.quadraticCurveTo(baseX + dir * len * 0.45, -halfW * 0.55, baseX + dir * len, 0);
  ctx.quadraticCurveTo(baseX + dir * len * 0.45, halfW * 0.55, baseX, halfW);
  ctx.closePath();
  ctx.fill();
}

// SPRITE-READY: flaming recovery arrow — curved charcoal shaft + flickering flame
// head and trailing fire. Drawn in arrow-local space (travels toward +x).
function drawArrow(ctx, arrow, inkColor, time = 0, telegraph = false) {
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle || 0);

  // Per-arrow flicker phase so neighbouring arrows don't pulse in lockstep.
  const phase = (arrow.id || 0) * 53.13;
  const flick = Math.sin(time * 0.03 + phase) * 0.5 + Math.sin(time * 0.072 + phase * 1.7) * 0.5;
  const intensity = telegraph ? 0.55 : 1; // staged arrows smoulder; flying arrows blaze

  // Trailing fire (streams back from the shaft, behind the direction of travel).
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = '#ff6a1a';
  ctx.shadowBlur = (telegraph ? 8 : 16) * intensity;
  ctx.fillStyle = `rgba(178, 34, 12, ${0.5 * intensity})`;
  flameTongue(ctx, -26, -1, (26 + flick * 8) * intensity, 8.5);
  ctx.fillStyle = `rgba(243, 116, 22, ${0.7 * intensity})`;
  flameTongue(ctx, -26, -1, (18 + flick * 6) * intensity, 6);

  // Curved charcoal shaft (the "bowed" arrow read the player asked for).
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#2a2018';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.quadraticCurveTo(-6, -6, 14, 0);
  ctx.stroke();

  // Fletching at the tail.
  ctx.strokeStyle = PALETTE.crimson;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-40, -7);
  ctx.moveTo(-30, 0);
  ctx.lineTo(-40, 6);
  ctx.stroke();

  // Iron arrowhead.
  ctx.fillStyle = '#1c160f';
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(11, -6.5);
  ctx.lineTo(11, 6.5);
  ctx.closePath();
  ctx.fill();

  // Flame head — the flickering "flyer" engulfing the tip.
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = '#ffae1a';
  ctx.shadowBlur = (telegraph ? 12 : 22) * intensity;
  ctx.fillStyle = `rgba(190, 30, 12, ${0.65 * intensity})`;
  flameTongue(ctx, 8, 1, (30 + flick * 10) * intensity, 11);
  ctx.fillStyle = `rgba(243, 116, 22, ${0.8 * intensity})`;
  flameTongue(ctx, 10, 1, (22 + flick * 8) * intensity, 7.5);
  ctx.fillStyle = `rgba(255, 214, 90, ${0.9 * intensity})`;
  flameTongue(ctx, 12, 1, (13 + flick * 5) * intensity, 4);

  ctx.restore();
}

// SPRITE-READY: the sealed quiver as a spinning radial bundle — arrows fanned
// outward in a ring around a whitish circular seal, tumbling like a yokai so it
// reads as part of that layer instead of a stiff scroll sliding past.
export function drawArrowTrap(ctx, trap, time, inkColor) {
  if (!trap) return;
  const R = trap.r || 54;
  const sealR = R * 0.4;
  const count = 9;

  ctx.save();
  ctx.translate(trap.x, trap.y);
  ctx.rotate(trap.spin || 0);

  // Fiery red arrows fanned outward around the ring — bright and glowing so they
  // pop against dark biomes.
  for (let i = 0; i < count; i++) {
    ctx.save();
    ctx.rotate((i / count) * Math.PI * 2);
    const flick = Math.sin(time * 0.03 + i * 1.7) * 0.5 + Math.sin(time * 0.07 + i) * 0.5;

    // Glowing crimson shaft.
    ctx.shadowColor = '#ff5a1e';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ef3b2c';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sealR - 4, 0);
    ctx.lineTo(R, 0);
    ctx.stroke();

    // Bright head at the outer tip.
    ctx.fillStyle = '#ff4d2e';
    ctx.beginPath();
    ctx.moveTo(R + 9, 0);
    ctx.lineTo(R - 4, -6);
    ctx.lineTo(R - 4, 6);
    ctx.closePath();
    ctx.fill();

    // Flame licking off each tip.
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#ffae1a';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(243, 116, 22, 0.8)';
    flameTongue(ctx, R - 2, 1, 16 + flick * 7, 6);
    ctx.fillStyle = 'rgba(255, 214, 90, 0.9)';
    flameTongue(ctx, R, 1, 10 + flick * 5, 3.5);
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Whitish circular seal binding the bundle, with a soft pulse.
  const pulse = 1 + Math.sin(time * 0.006) * 0.04;
  ctx.shadowColor = PALETTE.crimson;
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#efe9da';
  ctx.strokeStyle = PALETTE.crimson;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, sealR * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Inner ring + forbidden seal mark.
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, sealR * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.5;
  const m = sealR * 0.42;
  ctx.beginPath();
  ctx.moveTo(-m, -m);
  ctx.lineTo(m, m);
  ctx.moveTo(m, -m);
  ctx.lineTo(-m, m);
  ctx.stroke();
  ctx.restore();
  // The "DO NOT BREAK THE SEAL" label that used to draw above the tutorial trap is
  // gone — the FTUE coach lines (tutorial.js `prompts.quiver`/`demo`) teach the seal
  // rule, so the on-arrow caption is redundant.
}

export function drawArrowBurst(ctx, burst, inkColor, time = 0) {
  if (!burst) return;
  const telegraph = burst.phase === 'telegraph';
  if (telegraph) {
    const progress = Math.min(1, burst.timer / ARROW_TRAP.telegraphFrames);
    ctx.save();
    ctx.strokeStyle = `rgba(185, 28, 28, ${0.55 * progress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(burst.origin.x, burst.origin.y, 20 + progress * 80, 0, Math.PI * 2);
    ctx.stroke();
    if (progress > 0.42) {
      ctx.setLineDash([9, 9]);
      for (const arrow of burst.arrows) {
        if (arrow.resolution) continue;
        ctx.beginPath();
        ctx.moveTo(arrow.x, arrow.y);
        ctx.lineTo(arrow.targetX, arrow.targetY);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  for (const arrow of burst.arrows) {
    if (arrow.resolution) continue;
    drawArrow(ctx, arrow, inkColor, time, telegraph || arrow.state === 'queued');
  }
}
