import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const BambooThinObstacle = {
    id: 'bamboo_thin',
    name: 'Thin Bamboo Stalk',
    biome: 'normal',
    desc: 'Classic environmental filler bamboo. A single clean swipe severs the stalk, splitting it into tumbling segments.',
    init: () => {
      return {
        x: 150,
        yBase: 175,
        h: 130,
        width: 10
      };
    },
    checkCut: (p1, p2, sim) => {
      return checkThickLineCut(p1, p2, 150, 45, 175, 12);
    },
    onCut: (sim, hitX, hitY, angle) => {
      const topH = hitY - (175 - 130);
      if (topH > 0) {
        sim.pieces.push({
          type: 'bamboo-top',
          x: 150,
          y: hitY - topH / 2,
          w: 10,
          h: topH,
          vx: Math.cos(angle) * (3 + Math.random() * 2),
          vy: Math.sin(angle) * 2 - 2 - Math.random() * 2,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.15
        });
      }

      for (let i = 0; i < 15; i++) {
        const pAngle = angle + (Math.random() - 0.5) * Math.PI;
        sim.particles.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(pAngle) * (2 + Math.random() * 4),
          vy: Math.sin(pAngle) * (2 + Math.random() * 4) - 1,
          r: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#22c55e' : '#15803d',
          opacity: 1.0,
          decay: 0.025,
          gravity: 0.2
        });
      }
    },
    draw: (ctx, sim, time) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 200);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(1, '#1e293b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 175, 300, 25);

      const drawBambooStalk = (x, yBase, h, w, cutHeight = null) => {
        const drawSegment = (syBase, sh) => {
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(x - w / 2, syBase - sh, w, sh);

          ctx.fillStyle = '#4ade80';
          ctx.fillRect(x - w / 2, syBase - sh, w * 0.25, sh);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(x + w / 2 - w * 0.25, syBase - sh, w * 0.25, sh);

          ctx.fillStyle = '#14532d';
          for (let ny = syBase - 5; ny > syBase - sh; ny -= 35) {
            ctx.fillRect(x - w / 2 - 1, ny, w + 2, 2);
            ctx.fillStyle = '#86efac';
            ctx.fillRect(x - w / 2 - 1, ny - 1, w + 2, 1);
            ctx.fillStyle = '#14532d';
          }
        };

        if (cutHeight !== null) {
          const stumpH = yBase - cutHeight;
          if (stumpH > 0) {
            drawSegment(yBase, stumpH);
            
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 4, 1, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          drawSegment(yBase, h);
        }
      };

      if (!sim.isCut) {
        drawBambooStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width);
      } else {
        drawBambooStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width, sim.cutY);

        sim.pieces.forEach(p => {
          p.vy += 0.3;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.fillStyle = '#16a34a';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

          ctx.fillStyle = '#4ade80';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w * 0.25, p.h);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(p.w / 2 - p.w * 0.25, -p.h / 2, p.w * 0.25, p.h);

          ctx.fillStyle = '#14532d';
          for (let ny = -p.h / 2 + 10; ny < p.h / 2; ny += 35) {
            ctx.fillRect(-p.w / 2 - 1, ny, p.w + 2, 2);
            ctx.fillStyle = '#86efac';
            ctx.fillRect(-p.w / 2 - 1, ny - 1, p.w + 2, 1);
            ctx.fillStyle = '#14532d';
          }

          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, p.h / 2, p.w / 2, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        });
      }
    }
  };

export default BambooThinObstacle;
