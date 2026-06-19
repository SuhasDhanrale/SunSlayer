import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const RaftObstacle = {
    id: 'raft',
    name: 'Large Raft & Lantern',
    biome: 'water',
    desc: 'Wide bamboo log raft carrying a large Toro Nagashi lantern. Slicing splits the heavy raft; the lantern plunges into the depths.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      const bobY = 135 + Math.sin(sim.time * 1.8) * 4;
      return checkSegmentHorizontalLine(p1, p2, bobY, 60, 240); // wider check
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces.push({
        type: 'raft-left', x: 80, y: hitY,
        vx: -1.0, vy: 1.5, rotation: -0.05, rotSpeed: -0.015
      });
      sim.pieces.push({
        type: 'raft-right', x: 220, y: hitY,
        vx: 1.0, vy: 1.5, rotation: 0.05, rotSpeed: 0.015
      });

      sim.extra.lanternY = hitY - 30;
      sim.extra.lanternX = 150;
      sim.extra.lanternRot = 0;
      sim.extra.lanternVX = 0.5;
      sim.extra.lanternVY = -3.5; // jumps up a bit before plunging

      for (let i = 0; i < 20; i++) {
        sim.particles.push({
          x: 150 + (Math.random() - 0.5) * 40,
          y: hitY,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 5 - 1,
          r: 2 + Math.random() * 4,
          color: '#e0f2fe',
          opacity: 1,
          decay: 0.02,
          gravity: 0.22
        });
      }
    },
    draw: (ctx, sim, time) => {
      const sky = ctx.createLinearGradient(0, 0, 0, 110);
      sky.addColorStop(0, '#020205'); sky.addColorStop(1, '#0b0f19');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 300, 110);

      const water = ctx.createLinearGradient(0, 110, 0, 200);
      water.addColorStop(0, '#09101f'); water.addColorStop(1, '#03060c');
      ctx.fillStyle = water; ctx.fillRect(0, 110, 300, 90);

      const bobY = 135 + Math.sin(time * 1.8) * 4;

      if (!sim.isCut) {
        const flicker = 1 + Math.sin(time * 12) * 0.15;
        const glowRad = 70 * flicker;
        const glowGrad = ctx.createRadialGradient(150, bobY - 30, 2, 150, bobY - 30, glowRad);
        glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
        glowGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.15)');
        glowGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(150, bobY - 30, glowRad, 0, Math.PI * 2); ctx.fill();

        ctx.save(); ctx.translate(150, bobY);

        // Wider raft base (Fresh green bamboo logs)
        ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2.5;
        const logCount = 8;
        const raftW = 160;
        const logW = raftW / logCount;
        for (let i = 0; i < logCount; i++) {
          const lx = -raftW / 2 + i * logW;
          ctx.beginPath(); ctx.ellipse(lx + logW / 2, 0, logW / 2 - 1, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        // Wood bindings
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-60, -8, 4, 16); ctx.fillRect(56, -8, 4, 16);

        // Larger, more detailed Lantern
        ctx.translate(0, -9);
        ctx.fillStyle = '#451a03'; ctx.fillRect(-18, -6, 36, 6); // base
        ctx.fillStyle = '#fef08a'; ctx.fillRect(-15, -40, 30, 34); // paper
        ctx.strokeStyle = '#78350f'; ctx.strokeRect(-15, -40, 30, 34); // frame
        ctx.beginPath(); ctx.moveTo(-15, -23); ctx.lineTo(15, -23); ctx.stroke(); // inner frame
        ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, -6); ctx.stroke();
        
        ctx.fillStyle = '#451a03'; // roof
        ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(12, -48); ctx.lineTo(-12, -48); ctx.closePath(); ctx.fill();

        ctx.restore();
      } else {
        sim.pieces.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed;
          p.y = Math.min(145, p.y + 0.1);

          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
          ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2.5;
          const logW = 20;
          for (let i = 0; i < 4; i++) {
            const lx = -40 + i * logW;
            ctx.beginPath(); ctx.ellipse(lx + logW / 2, 0, logW / 2 - 1, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
          ctx.restore();
        });

        sim.extra.lanternVY = Math.min(3.5, sim.extra.lanternVY + 0.25);
        sim.extra.lanternY += sim.extra.lanternVY;
        sim.extra.lanternX += sim.extra.lanternVX;
        sim.extra.lanternRot += 0.08;

        const glowAge = sim.timeSinceCut;
        if (glowAge < 3.0) {
          const lOpacity = Math.max(0, 1 - glowAge / 3.0);
          const glowRad = Math.max(0, 45 * (1 - glowAge / 3.0));
          const glowGrad = ctx.createRadialGradient(sim.extra.lanternX, sim.extra.lanternY, 2, sim.extra.lanternX, sim.extra.lanternY, glowRad);
          glowGrad.addColorStop(0, `rgba(56, 189, 248, ${0.5 * lOpacity})`);
          glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath(); ctx.arc(sim.extra.lanternX, sim.extra.lanternY, glowRad, 0, Math.PI * 2); ctx.fill();

          ctx.save(); ctx.translate(sim.extra.lanternX, sim.extra.lanternY); ctx.rotate(sim.extra.lanternRot);
          ctx.globalAlpha = lOpacity;
          ctx.fillStyle = '#451a03'; ctx.fillRect(-18, -6, 36, 6);
          ctx.fillStyle = '#fef08a'; ctx.fillRect(-15, -40, 30, 34);
          ctx.strokeStyle = '#78350f'; ctx.strokeRect(-15, -40, 30, 34);
          ctx.fillStyle = '#451a03'; ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(12, -48); ctx.lineTo(-12, -48); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
    }
  };

export default RaftObstacle;
