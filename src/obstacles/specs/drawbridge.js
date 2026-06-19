import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const DrawbridgeObstacle = {
    id: 'drawbridge',
    name: 'One-Side Hanging Bridge',
    biome: 'cave',
    desc: 'Suspended drawbridge held high. Cutting the rope (goes up) causes the bridge to fall down to horizontal, bridging the cave gap.',
    init: () => {
      return { ropeScaleY: 1.0 };
    },
    checkCut: (p1, p2, sim) => {
      // Red target holding bridge at x=190, y=70 (radius 14)
      return checkSegmentCircle(p1, p2, 190, 70, 14);
    },
    onCut: (sim, hitX, hitY, angle) => {
      for (let i = 0; i < 15; i++) {
        sim.particles.push({
          x: 190,
          y: 70,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 4 - 2,
          r: 2,
          color: i % 2 === 0 ? '#ef4444' : '#e2e8f0',
          opacity: 1,
          decay: 0.02,
          gravity: 0.15
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Cavern
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#100b19');
      cave.addColorStop(1, '#22182e');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Deep dark gap
      ctx.fillStyle = '#08050c';
      ctx.fillRect(0, 160, 300, 40);

      // Left ledge support (Slate rock with gray trim)
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 140, 65, 35);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 137, 65, 3);

      // Right cliff destination
      ctx.fillStyle = '#334155';
      ctx.fillRect(215, 140, 85, 35);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(215, 137, 85, 3);

      const pivotX = 60;
      const pivotY = 142;
      const bridgeLen = 156;

      if (!sim.isCut) {
        // Draw bridge tilted up at -65 deg
        const tiltAngle = -Math.PI / 2.8;
        const tipX = pivotX + bridgeLen * Math.cos(tiltAngle);
        const tipY = pivotY + bridgeLen * Math.sin(tiltAngle);

        // Rope to left ceiling (190, 15)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(190, 15);
        ctx.stroke();

        // Red target
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(190, 70, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(186, 66, 4, 0, Math.PI * 2); ctx.fill();

        // Draw bridge boards (Vermilion planks)
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(tiltAngle);

        ctx.fillStyle = '#c2410c';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, bridgeLen, 12);
        ctx.strokeRect(0, -6, bridgeLen, 12);

        ctx.fillStyle = '#fdba74';
        for (let ix = 15; ix < bridgeLen; ix += 20) {
          ctx.fillRect(ix, -5, 3, 10);
        }
        ctx.restore();

        // hinge pin
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        // Cut: Rope snaps going up (retracts)
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(190, 10);
          ctx.lineTo(190, 10 + 60 * sim.extra.ropeScaleY);
          ctx.stroke();
        }

        // Bridge rotates down to horizontal (0 deg) with elastic bounce
        const restAngle = 0;
        const startAngle = -Math.PI / 2.8;
        const diff = restAngle - startAngle;
        const currentAngle = restAngle - diff * Math.cos(t * 7.5) * Math.exp(-t * 2.2);

        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(currentAngle);

        ctx.fillStyle = '#c2410c';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, bridgeLen, 12);
        ctx.strokeRect(0, -6, bridgeLen, 12);

        ctx.fillStyle = '#fdba74';
        for (let ix = 15; ix < bridgeLen; ix += 20) {
          ctx.fillRect(ix, -5, 3, 10);
        }
        ctx.restore();

        // hinge pin
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
  };

export default DrawbridgeObstacle;
