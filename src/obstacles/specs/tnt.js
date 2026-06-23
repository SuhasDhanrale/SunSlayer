import { checkSegmentCircle } from '../helpers.js';

// Crate geometry (local 300×200 space). The visual scale keeps gameplay tuning
// stable while drawing the TNT crate 25% smaller.
const CRATE = { cx: 150, cy: 140, size: 66, cutRadius: 30 };
const CRATE_VISUAL_SCALE = 0.75;

export const TntObstacle = {
    id: 'tnt',
    name: 'TNT Crate',
    biome: 'cave',
    desc: 'A red TNT crate walling the tunnel. Slice the crate to detonate it instantly; TNT caught in the blast pulses briefly, then chain-detonates.',
    init: () => {
      return { exploded: false, flashAge: 0, chainArmed: false, chainFuseRemaining: 0, chainFuseDuration: 0 };
    },
    checkCut: (p1, p2, sim) => {
      // The crate's slice target — a circle over the box center.
      return checkSegmentCircle(p1, p2, CRATE.cx, CRATE.cy, CRATE.cutRadius);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.extra.exploded = true;
      // Burst the crate into red box shards flung radially from its center.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 3 + Math.random() * 4;
        sim.pieces.push({
          type: 'shard',
          x: CRATE.cx + Math.cos(a) * 12 * CRATE_VISUAL_SCALE,
          y: CRATE.cy + Math.sin(a) * 12 * CRATE_VISUAL_SCALE,
          w: (12 + Math.random() * 14) * CRATE_VISUAL_SCALE,
          h: (10 + Math.random() * 10) * CRATE_VISUAL_SCALE,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 2,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.4
        });
      }

      // Explosion sparks and soot particles
      for (let i = 0; i < 35; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        sim.particles.push({
          x: CRATE.cx,
          y: CRATE.cy,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed - 1.5,
          r: 5 + Math.random() * 10,
          color: Math.random() > 0.6 ? '#dc2626' : (Math.random() > 0.3 ? '#ea580c' : '#334155'),
          opacity: 1,
          decay: 0.02 + Math.random() * 0.02,
          gravity: -0.05
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Cavern background
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#100b1a');
      cave.addColorStop(1, '#231932');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Cave floor
      ctx.fillStyle = '#171022';
      ctx.fillRect(0, 170, 300, 30);

      if (!sim.isCut) {
        // Red TNT crate with white stencil — the slice target. SPRITE-READY
        const { cx, cy, size } = CRATE;
        const visualSize = size * CRATE_VISUAL_SCALE;
        const armed = Boolean(sim.extra.chainArmed);
        const duration = sim.extra.chainFuseDuration || 1;
        const remaining = Math.max(0, sim.extra.chainFuseRemaining || 0);
        const fuseProgress = armed ? Math.max(0, Math.min(1, 1 - remaining / duration)) : 0;
        const beat = armed ? (0.5 + Math.sin(time * (14 + fuseProgress * 22)) * 0.5) : 0;
        const drawSize = visualSize * (armed ? 1 + beat * (0.05 + fuseProgress * 0.04) : 1);
        const x0 = cx - drawSize / 2;
        const y0 = cy - drawSize / 2;

        if (armed) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const glowR = visualSize * (0.72 + beat * 0.45 + fuseProgress * 0.22);
          const glow = ctx.createRadialGradient(cx, cy, visualSize * 0.15, cx, cy, glowR);
          glow.addColorStop(0, `rgba(254,240,138, ${0.34 + beat * 0.28})`);
          glow.addColorStop(0.45, `rgba(249,115,22, ${0.18 + beat * 0.16})`);
          glow.addColorStop(1, 'rgba(185,28,28,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Crate body
        ctx.fillStyle = armed && beat > 0.55 ? '#dc2626' : '#b91c1c';
        ctx.fillRect(x0, y0, drawSize, drawSize);
        // Darker strap bands (top & bottom)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(x0, y0 + drawSize * 0.20, drawSize, 9 * CRATE_VISUAL_SCALE);
        ctx.fillRect(x0, y0 + drawSize * 0.66, drawSize, 9 * CRATE_VISUAL_SCALE);
        // Bright edge highlight
        ctx.strokeStyle = armed && beat > 0.4 ? '#fef08a' : '#ef4444';
        ctx.lineWidth = (armed ? 3.5 : 2.5) * CRATE_VISUAL_SCALE;
        ctx.strokeRect(x0 + 1.5, y0 + 1.5, drawSize - 3, drawSize - 3);

        // "TNT" stencil
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${22 * CRATE_VISUAL_SCALE}px "Arial Black", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', cx, cy + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Fuse + spark sputtering from the top corner
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = (armed ? 3 : 2) * CRATE_VISUAL_SCALE;
        ctx.beginPath();
        ctx.moveTo(x0 + drawSize * 0.78, y0);
        ctx.quadraticCurveTo(
          x0 + drawSize + 8 * CRATE_VISUAL_SCALE,
          y0 - 14 * CRATE_VISUAL_SCALE,
          x0 + drawSize + 2 * CRATE_VISUAL_SCALE,
          y0 - 26 * CRATE_VISUAL_SCALE
        );
        ctx.stroke();

        const flare = (armed ? 6 + beat * 8 + fuseProgress * 4 : 3 + Math.sin(time * 30) * 1.5) * CRATE_VISUAL_SCALE;
        ctx.fillStyle = armed && beat > 0.5 ? '#fb923c' : '#fef08a';
        ctx.beginPath();
        ctx.arc(
          x0 + drawSize + 2 * CRATE_VISUAL_SCALE,
          y0 - 26 * CRATE_VISUAL_SCALE,
          flare,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        // Animate the bursting crate into flying red shards
        sim.pieces.forEach(p => {
          p.vy += 0.3; // gravity
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          if (p.y < 230) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#b91c1c';
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
          }
        });

        // Detonation screen flash
        const flashAge = sim.timeSinceCut * 60;
        if (flashAge < 8) {
          ctx.fillStyle = `rgba(255,255,255, ${0.9 - flashAge / 8})`;
          ctx.fillRect(0, 0, 300, 200);

          const fireRad = flashAge * 15;
          const fireGrad = ctx.createRadialGradient(CRATE.cx, CRATE.cy, 2, CRATE.cx, CRATE.cy, fireRad);
          fireGrad.addColorStop(0, '#ffffff');
          fireGrad.addColorStop(0.3, '#fef08a');
          fireGrad.addColorStop(0.7, '#f97316');
          fireGrad.addColorStop(1, 'rgba(220,38,38,0)');
          ctx.fillStyle = fireGrad;
          ctx.beginPath(); ctx.arc(CRATE.cx, CRATE.cy, fireRad, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  };

export default TntObstacle;
