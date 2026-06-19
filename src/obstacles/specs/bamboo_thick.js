import { checkThickLineCut } from '../helpers.js';

const INK = '#1c1917';
const PAPER = '#f4f1ea';
const FADED_INK = '#78716c';

export const BambooThickObstacle = {
  id: 'bamboo_thick',
  name: 'Thick Bamboo Stalk',
  biome: 'normal',
  desc: 'Dense in-game bamboo. Requires 3 slices; each failed-to-finish slice leaves a pale notch.',
  init: () => ({
    x: 150,
    yBase: 175,
    h: 150,
    width: 88,
    hp: 3,
    cuts: [],
    lastHitTime: 0,
  }),
  checkCut: (p1, p2, sim) => {
    const hit = checkThickLineCut(p1, p2, 150, 25, 175, 34);
    if (!hit) return null;

    const now = sim.time;
    if (now - sim.extra.lastHitTime <= 0.25) return null;

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
        color: i % 2 === 0 ? PAPER : FADED_INK,
        opacity: 1,
        decay: 0.04,
        gravity: 0.2,
      });
    }

    if (sim.extra.hp > 0) {
      sim.extra.cuts.push({ y: hit.y, x: hit.x });
      return null;
    }
    return hit;
  },
  onCut: (sim, hitX, hitY, angle) => {
    const { yBase, h, width } = sim.extra;
    const topH = hitY - (yBase - h);
    if (topH > 0) {
      sim.pieces.push({
        type: 'bamboo-thick-top',
        x: 150,
        y: hitY - topH / 2,
        w: width,
        h: topH,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: -3,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.1,
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
        color: i % 2 === 0 ? PAPER : FADED_INK,
        opacity: 1,
        decay: 0.02,
        gravity: 0.25,
      });
    }
  },
  draw: (ctx, sim, time) => {
    const drawSegmentBands = (x, topY, bottomY, width) => {
      ctx.fillStyle = PAPER;
      for (let y = topY + 28; y < bottomY; y += 34) {
        ctx.fillRect(x - width / 2 - 3, y, width + 6, 4);
      }
    };

    const drawStalk = (x, yBase, h, width, cutY = null) => {
      const topY = yBase - h;
      const visibleTop = cutY ?? topY;
      const visibleHeight = yBase - visibleTop;
      if (visibleHeight <= 0) return;

      ctx.fillStyle = INK;
      ctx.fillRect(x - width / 2, visibleTop, width, visibleHeight);
      drawSegmentBands(x, visibleTop, yBase, width);

      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = FADED_INK;
      ctx.fillRect(x - width * 0.18, visibleTop, 3, visibleHeight);
      ctx.fillRect(x + width * 0.18, visibleTop, 3, visibleHeight);
      ctx.restore();

      if (cutY !== null) {
        ctx.fillStyle = PAPER;
        ctx.beginPath();
        ctx.ellipse(x, cutY, width / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (!sim.isCut) {
      const sway = Math.sin(time * 2 + sim.extra.x) * 0.025;
      ctx.save();
      ctx.translate(sim.extra.x, sim.extra.yBase);
      ctx.rotate(sway);
      ctx.translate(-sim.extra.x, -sim.extra.yBase);
      drawStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width);
      ctx.restore();

      sim.extra.cuts.forEach((c) => {
        ctx.fillStyle = PAPER;
        ctx.beginPath();
        ctx.moveTo(150 - sim.extra.width / 2, c.y - 8);
        ctx.lineTo(150 - 4, c.y);
        ctx.lineTo(150 - sim.extra.width / 2, c.y + 8);
        ctx.moveTo(150 + sim.extra.width / 2, c.y - 8);
        ctx.lineTo(150 + 4, c.y);
        ctx.lineTo(150 + sim.extra.width / 2, c.y + 8);
        ctx.closePath();
        ctx.fill();
      });
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

export default BambooThickObstacle;
