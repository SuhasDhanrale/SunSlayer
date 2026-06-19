import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const SpikeObstacle = {
    id: 'spike',
    name: 'Bamboo Spikes',
    biome: 'normal',
    desc: 'A cluster of sharp, pointy ground stakes. Swipe to cleanly sever the tips and send them flying out.',
    init: () => {
      return {
        spikes: [
          { x: 92, yBase: 175, h: 68 },
          { x: 106, yBase: 175, h: 92 },
          { x: 122, yBase: 175, h: 76 },
          { x: 138, yBase: 175, h: 106 },
          { x: 154, yBase: 175, h: 86 },
          { x: 170, yBase: 175, h: 112 },
          { x: 186, yBase: 175, h: 78 },
          { x: 202, yBase: 175, h: 98 },
          { x: 216, yBase: 175, h: 72 }
        ]
      };
    },
    checkCut: (p1, p2, sim) => {
      // Check collision over the general spike area
      return checkThickLineCut(p1, p2, 154, 55, 175, 76);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces = [];
      sim.extra.spikes.forEach(s => {
        const topY = s.yBase - s.h;
        const cutY = Math.max(topY + s.h * 0.2, Math.min(hitY, s.yBase - 6));
        const upperH = cutY - topY;
        const lowerH = s.yBase - cutY;
        sim.pieces.push({
          side: 'top',
          x: s.x,
          y: topY + upperH / 2,
          w: 10,
          h: upperH,
          vx: (Math.random() - 0.5) * 2.5,
          vy: 1.8 + Math.random() * 1.4,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.18
        });
        sim.pieces.push({
          side: 'base',
          x: s.x,
          y: cutY + lowerH / 2,
          w: 10,
          h: lowerH,
          vx: (Math.random() - 0.5) * 1.8,
          vy: 2.4 + Math.random() * 1.8,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.14
        });
        s.h = 0;
      });
      // Charcoal/silver wood chips
      for (let i = 0; i < 15; i++) {
        const pAngle = angle + (Math.random() - 0.5) * Math.PI;
        sim.particles.push({
          x: hitX + (Math.random() - 0.5) * 20,
          y: hitY + (Math.random() - 0.5) * 10,
          vx: Math.cos(pAngle) * (2 + Math.random() * 4),
          vy: Math.sin(pAngle) * (2 + Math.random() * 4) - 1,
          r: 2 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#cbd5e1' : '#374151',
          opacity: 1,
          decay: 0.02 + Math.random() * 0.02,
          gravity: 0.25
        });
      }
    },
    draw: (ctx, sim, time) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
      skyGrad.addColorStop(0, '#090e15');
      skyGrad.addColorStop(1, '#1b263b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 175, 300, 25);

      const drawPointySpike = (x, yBase, h) => {
        // Sharp pointy polygon (warm terracotta brown)
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.moveTo(x - 5, yBase);
        ctx.lineTo(x + 5, yBase);
        ctx.lineTo(x, yBase - h); // pointy tip
        ctx.closePath();
        ctx.fill();

        // Shading/Highlight (warm amber)
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(x, yBase);
        ctx.lineTo(x + 5, yBase);
        ctx.lineTo(x, yBase - h);
        ctx.closePath();
        ctx.fill();

        // Golden/Yellow accent line
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yBase);
        ctx.lineTo(x, yBase - h);
        ctx.stroke();
      };

      sim.extra.spikes.forEach(s => {
        if (s.h > 0) drawPointySpike(s.x, s.yBase, s.h);
      });

      if (sim.isCut) {
        sim.pieces.forEach(p => {
          p.vy += 0.32;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          ctx.fillStyle = '#7c2d12';
          ctx.beginPath();
          if (p.side === 'top') {
            ctx.moveTo(-p.w / 2, p.h / 2);
            ctx.lineTo(p.w / 2, p.h / 2);
            ctx.lineTo(0, -p.h / 2);
          } else {
            ctx.moveTo(-p.w / 2, p.h / 2);
            ctx.lineTo(p.w / 2, p.h / 2);
            ctx.lineTo(p.w * 0.35, -p.h / 2);
            ctx.lineTo(-p.w * 0.35, -p.h / 2);
          }
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(0, p.h / 2);
          ctx.lineTo(p.w / 2, p.h / 2);
          ctx.lineTo(p.side === 'top' ? 0 : p.w * 0.35, -p.h / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, p.h / 2);
          ctx.lineTo(0, -p.h / 2);
          ctx.stroke();
          
          ctx.restore();
        });
      }
    }
  };

export default SpikeObstacle;
