import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const BambooThickObstacle = {
    id: 'bamboo_thick',
    name: 'Thick Bamboo Stalk',
    biome: 'normal',
    desc: 'Dense, reinforced bamboo. Requires 3 slices to cut through. Each slice leaves a notch; the 3rd severs it.',
    init: () => {
      return {
        x: 150,
        yBase: 175,
        h: 140,
        width: 24,
        hp: 3,
        cuts: [],
        lastHitTime: 0
      };
    },
    checkCut: (p1, p2, sim) => {
      const hit = checkThickLineCut(p1, p2, 150, 35, 175, 20);
      if (hit) {
        const now = sim.time;
        if (now - sim.extra.lastHitTime > 0.25) {
          sim.extra.lastHitTime = now;
          sim.extra.hp -= 1;
          
          for (let i = 0; i < 8; i++) {
            const pAngle = Math.random() * Math.PI * 2;
            sim.particles.push({
              x: hit.x,
              y: hit.y,
              vx: Math.cos(pAngle) * (2 + Math.random() * 3),
              vy: Math.sin(pAngle) * (2 + Math.random() * 3) - 1,
              r: 1.5 + Math.random() * 2,
              color: i % 2 === 0 ? '#bef264' : '#22c55e',
              opacity: 1.0,
              decay: 0.04,
              gravity: 0.2
            });
          }

          if (sim.extra.hp > 0) {
            sim.extra.cuts.push({ y: hit.y, x: hit.x });
            return null;
          } else {
            return hit;
          }
        }
      }
      return null;
    },
    onCut: (sim, hitX, hitY, angle) => {
      const topH = hitY - (175 - 140);
      if (topH > 0) {
        sim.pieces.push({
          type: 'bamboo-thick-top',
          x: 150,
          y: hitY - topH / 2,
          w: 24,
          h: topH,
          vx: Math.cos(angle) * (2 + Math.random() * 2),
          vy: -3,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.1
        });
      }

      for (let i = 0; i < 25; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        sim.particles.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(pAngle) * (3 + Math.random() * 4),
          vy: Math.sin(pAngle) * (3 + Math.random() * 4) - 1.5,
          r: 2 + Math.random() * 4,
          color: i % 2 === 0 ? '#22c55e' : (i % 3 === 0 ? '#15803d' : '#bef264'),
          opacity: 1.0,
          decay: 0.02,
          gravity: 0.25
        });
      }
    },
    draw: (ctx, sim, time) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 200);
      bg.addColorStop(0, '#020205');
      bg.addColorStop(1, '#1e1e2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 175, 300, 25);

      const drawThickStalk = (x, yBase, h, w, cutHeight = null) => {
        const drawSegment = (syBase, sh) => {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(x - w / 2, syBase - sh, w, sh);

          ctx.fillStyle = '#22c55e';
          ctx.fillRect(x - w / 2, syBase - sh, w * 0.25, sh);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(x + w / 2 - w * 0.25, syBase - sh, w * 0.25, sh);

          ctx.fillStyle = '#14532d';
          for (let ny = syBase - 5; ny > syBase - sh; ny -= 45) {
            ctx.fillRect(x - w / 2 - 1.5, ny, w + 3, 3);
            ctx.fillStyle = '#bef264';
            ctx.fillRect(x - w / 2 - 1.5, ny - 1, w + 3, 1);
            ctx.fillStyle = '#14532d';
          }
        };

        if (cutHeight !== null) {
          const stumpH = yBase - cutHeight;
          if (stumpH > 0) {
            drawSegment(yBase, stumpH);
            
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 4, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          drawSegment(yBase, h);
        }
      };

      if (!sim.isCut) {
        drawThickStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width);

        sim.extra.cuts.forEach(c => {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(150 - 12, c.y - 8);
          ctx.lineTo(150 - 2, c.y);
          ctx.lineTo(150 - 12, c.y + 8);

          ctx.moveTo(150 + 12, c.y - 8);
          ctx.lineTo(150 + 2, c.y);
          ctx.lineTo(150 + 12, c.y + 8);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`HP: ${sim.extra.hp}`, 290, 20);
      } else {
        drawThickStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width, sim.cutY);

        sim.pieces.forEach(p => {
          p.vy += 0.3;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.fillStyle = '#15803d';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

          ctx.fillStyle = '#22c55e';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w * 0.25, p.h);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(p.w / 2 - p.w * 0.25, -p.h / 2, p.w * 0.25, p.h);

          ctx.fillStyle = '#14532d';
          for (let ny = -p.h / 2 + 10; ny < p.h / 2; ny += 45) {
            ctx.fillRect(-p.w / 2 - 1.5, ny, p.w + 3, 3);
            ctx.fillStyle = '#bef264';
            ctx.fillRect(-p.w / 2 - 1.5, ny - 1, p.w + 3, 1);
            ctx.fillStyle = '#14532d';
          }

          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, p.h / 2, p.w / 2, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        });
      }
    }
  };

export default BambooThickObstacle;
