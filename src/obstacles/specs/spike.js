import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const SpikeObstacle = {
    id: 'spike',
    name: 'Bamboo Spikes',
    biome: 'normal',
    desc: 'A cluster of sharp, pointy ground stakes. Swipe to cleanly sever the tips and send them flying out.',
    init: () => {
      // 3 pointy spikes
      return {
        spikes: [
          { x: 135, yBase: 175, h: 80 },
          { x: 150, yBase: 175, h: 100 },
          { x: 165, yBase: 175, h: 70 }
        ]
      };
    },
    checkCut: (p1, p2, sim) => {
      // Check collision over the general spike area
      return checkThickLineCut(p1, p2, 150, 75, 175, 40);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces = [];
      sim.extra.spikes.forEach(s => {
        // If cut is above the base, separate the top
        if (hitY < s.yBase) {
          const cutH = hitY - (s.yBase - s.h);
          if (cutH > 0) {
            sim.pieces.push({
              x: s.x,
              y: hitY - cutH / 2,
              w: 8,
              h: cutH,
              vx: Math.cos(angle) * (3 + Math.random() * 3),
              vy: Math.sin(angle) * 3 - 2 - Math.random() * 2,
              rotation: 0,
              rotSpeed: (Math.random() - 0.5) * 0.3
            });
            s.h = s.yBase - hitY; // shorten base stump
          }
        }
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

      // Draw base stumps
      sim.extra.spikes.forEach(s => {
        drawPointySpike(s.x, s.yBase, s.h);
        // If cut, draw flat light wood-gray top
        if (sim.isCut) {
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.ellipse(s.x, s.yBase - s.h, 5 * (s.h / 100 + 0.1), 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw flying tips
      if (sim.isCut) {
        sim.pieces.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          ctx.fillStyle = '#7c2d12';
          ctx.beginPath();
          ctx.moveTo(-4, p.h / 2);
          ctx.lineTo(4, p.h / 2);
          ctx.lineTo(0, -p.h / 2); // pointy top
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(0, p.h / 2);
          ctx.lineTo(4, p.h / 2);
          ctx.lineTo(0, -p.h / 2);
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
