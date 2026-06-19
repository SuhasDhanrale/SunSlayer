import { checkThickLineCut } from '../helpers.js';

const INK = '#1c1917';
const PAPER = '#f4f1ea';
const FADED_INK = '#78716c';

export const BambooThinObstacle = {
  id: 'bamboo_thin',
  name: 'Thin Bamboo Stalk',
  biome: 'normal',
  desc: 'Classic in-game bamboo stalk. A single clean swipe severs the stalk into tumbling ink-style segments.',
  init: () => ({
    x: 150,
    yBase: 175,
    h: 125,
    width: 38,
  }),
  checkCut: (p1, p2) => checkThickLineCut(p1, p2, 150, 50, 175, 14),
  onCut: (sim, hitX, hitY, angle) => {
    const { yBase, h, width } = sim.extra;
    const topH = hitY - (yBase - h);
    if (topH > 0) {
      sim.pieces.push({
        type: 'bamboo-top',
        x: 150,
        y: hitY - topH / 2,
        w: width,
        h: topH,
        vx: Math.cos(angle) * (3 + Math.random() * 2),
        vy: Math.sin(angle) * 2 - 2 - Math.random() * 2,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.15,
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
        color: Math.random() > 0.5 ? INK : FADED_INK,
        opacity: 1,
        decay: 0.025,
        gravity: 0.2,
      });
    }
  },
  draw: (ctx, sim, time) => {
    const drawSegmentBands = (x, topY, bottomY, width) => {
      ctx.fillStyle = PAPER;
      for (let y = topY + 28; y < bottomY; y += 38) {
        ctx.fillRect(x - width / 2 - 2, y, width + 4, 2);
      }
    };

    const drawStalk = (x, yBase, h, width, cutY = null) => {
      const topY = yBase - h;
      const visibleTop = cutY ?? topY;
      const visibleHeight = yBase - visibleTop;
      if (visibleHeight <= 0) return;

      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(x - width * 0.42, yBase);
      ctx.lineTo(x + width * 0.42, yBase);
      ctx.lineTo(x + width * 0.34, visibleTop);
      ctx.lineTo(x - width * 0.34, visibleTop);
      ctx.closePath();
      ctx.fill();
      drawSegmentBands(x, visibleTop, yBase, width);

      if (cutY !== null) {
        ctx.fillStyle = PAPER;
        ctx.beginPath();
        ctx.ellipse(x, cutY, width / 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (!sim.isCut) {
      const sway = Math.sin(time * 2 + sim.extra.x) * 0.04;
      ctx.save();
      ctx.translate(sim.extra.x, sim.extra.yBase);
      ctx.rotate(sway);
      ctx.translate(-sim.extra.x, -sim.extra.yBase);
      drawStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width);
      ctx.restore();
      return;
    }

    drawStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width, sim.cutY);
    sim.pieces.forEach((p) => {
      p.vy += 0.3;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = INK;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      drawSegmentBands(0, -p.h / 2, p.h / 2, p.w);
      ctx.restore();
    });
  },
};

export default BambooThinObstacle;
