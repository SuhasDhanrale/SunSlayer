import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

// Crate geometry (local 300×200 space). The cut-circle, the drawn box, and the
// shard origin all key off this so the red TNT box reads exactly where you slice.
const CRATE = { cx: 150, cy: 140, size: 66 };

export const TntObstacle = {
    id: 'tnt',
    name: 'TNT Crate',
    biome: 'cave',
    desc: 'A red TNT crate walling the tunnel. Slice the crate to detonate it — the blast chain-clears the boulder gate and bursts the box into flying shards.',
    init: () => {
      return { exploded: false, flashAge: 0 };
    },
    checkCut: (p1, p2, sim) => {
      // The crate's slice target — a circle over the box center.
      return checkSegmentCircle(p1, p2, CRATE.cx, CRATE.cy, 30);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.extra.exploded = true;
      // Burst the crate into red box shards flung radially from its center.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 3 + Math.random() * 4;
        sim.pieces.push({
          type: 'shard',
          x: CRATE.cx + Math.cos(a) * 12,
          y: CRATE.cy + Math.sin(a) * 12,
          w: 12 + Math.random() * 14,
          h: 10 + Math.random() * 10,
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
        const x0 = cx - size / 2;
        const y0 = cy - size / 2;

        // Crate body
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(x0, y0, size, size);
        // Darker strap bands (top & bottom)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(x0, y0 + size * 0.20, size, 9);
        ctx.fillRect(x0, y0 + size * 0.66, size, 9);
        // Bright edge highlight
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x0 + 1.5, y0 + 1.5, size - 3, size - 3);

        // "TNT" stencil
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', cx, cy + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Fuse + spark sputtering from the top corner
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0 + size * 0.78, y0);
        ctx.quadraticCurveTo(x0 + size + 8, y0 - 14, x0 + size + 2, y0 - 26);
        ctx.stroke();

        const flare = 3 + Math.sin(time * 30) * 1.5;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(x0 + size + 2, y0 - 26, flare, 0, Math.PI * 2);
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
