import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const SmallbridgesObstacle = {
    id: 'smallbridges',
    name: 'Small Log Bridges',
    biome: 'cave',
    desc: 'Two log bridges raised in a V-shape. Slicing the target snaps the center rope (goes up) and drops both logs flat to span the pit.',
    init: () => {
      return { ropeScaleY: 1.0 };
    },
    checkCut: (p1, p2, sim) => {
      // Red target at x=150, y=70 (radius 14) holding logs
      return checkSegmentCircle(p1, p2, 150, 70, 14);
    },
    onCut: (sim, hitX, hitY, angle) => {
      for (let i = 0; i < 15; i++) {
        sim.particles.push({
          x: 150,
          y: 70,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 4 - 2,
          r: 2,
          color: i % 2 === 0 ? '#ef4444' : '#e4e4e7',
          opacity: 1,
          decay: 0.02,
          gravity: 0.15
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Cave
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#100b1a');
      cave.addColorStop(1, '#1d1428');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Gorge
      ctx.fillStyle = '#08050c';
      ctx.fillRect(0, 160, 300, 40);

      // Cliffs (Slate stone)
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 135, 60, 35);
      ctx.fillRect(240, 135, 60, 35);

      const leftPivot = { x: 60, y: 143 };
      const rightPivot = { x: 240, y: 143 };
      const logLen = 92;

      if (!sim.isCut) {
        // Draw logs in V-shape: left log raised at -45 deg, right log raised at -135 deg
        const lAngle = -Math.PI / 4.5;  // ~ -40 deg
        const rAngle = -Math.PI * 0.78; // ~ -140 deg

        const lTipX = leftPivot.x + logLen * Math.cos(lAngle);
        const lTipY = leftPivot.y + logLen * Math.sin(lAngle);
        const rTipX = rightPivot.x + logLen * Math.cos(rAngle);
        const rTipY = rightPivot.y + logLen * Math.sin(rAngle);

        // Center vertical rope to ceiling
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, 70);
        ctx.lineTo(150, 10);
        ctx.moveTo(150, 70);
        ctx.lineTo(lTipX, lTipY);
        ctx.moveTo(150, 70);
        ctx.lineTo(rTipX, rTipY);
        ctx.stroke();

        // Red target
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(150, 70, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(146, 66, 4, 0, Math.PI * 2); ctx.fill();

        // Draw Left Log (Warm amber wood log)
        ctx.save();
        ctx.translate(leftPivot.x, leftPivot.y);
        ctx.rotate(lAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        // Bark detail lines
        ctx.fillStyle = '#fde047';
        ctx.fillRect(10, -3, logLen - 20, 1.5);
        ctx.restore();

        // Draw Right Log
        ctx.save();
        ctx.translate(rightPivot.x, rightPivot.y);
        ctx.rotate(rAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(10, -3, logLen - 20, 1.5);
        ctx.restore();
      } else {
        // Cut: Rope snaps going up (retracts)
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(150, 10);
          ctx.lineTo(150, 10 + 60 * sim.extra.ropeScaleY);
          ctx.stroke();
        }

        // Both logs swing down to horizontal flat: left log to 0 deg, right log to -180 deg
        const lRest = 0;
        const lStart = -Math.PI / 4.5;
        const lAngle = lRest - (lRest - lStart) * Math.cos(t * 8.5) * Math.exp(-t * 2.5);

        const rRest = -Math.PI;
        const rStart = -Math.PI * 0.78;
        const rAngle = rRest - (rRest - rStart) * Math.cos(t * 8.5) * Math.exp(-t * 2.5);

        // Draw Left Log
        ctx.save();
        ctx.translate(leftPivot.x, leftPivot.y);
        ctx.rotate(lAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        ctx.restore();

        // Draw Right Log
        ctx.save();
        ctx.translate(rightPivot.x, rightPivot.y);
        ctx.rotate(rAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        ctx.restore();
      }
    }
  };

export default SmallbridgesObstacle;
