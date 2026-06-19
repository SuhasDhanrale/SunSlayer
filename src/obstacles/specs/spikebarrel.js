import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const SpikebarrelObstacle = {
    id: 'spikebarrel',
    name: 'Spiked Float Barrel',
    biome: 'water',
    desc: 'Spiked explosive barrel bobbing near the surface. Slicing triggers an expanding underwater bubble blast.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      const bobY = 95 + Math.sin(sim.time * 2.2) * 7;
      return checkSegmentCircle(p1, p2, 150, bobY, 26);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.extra.explosionActive = true;
      sim.extra.explosionY = hitY;

      for (let i = 0; i < 30; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        sim.particles.push({
          x: 150,
          y: hitY,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed - 0.5,
          r: 2 + Math.random() * 4,
          color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
          opacity: 1,
          decay: 0.02,
          gravity: -0.06
        });
      }
    },
    draw: (ctx, sim, time) => {
      const water = ctx.createLinearGradient(0, 0, 0, 200);
      water.addColorStop(0, '#0284c7');
      water.addColorStop(1, '#073e5a');
      ctx.fillStyle = water;
      ctx.fillRect(0, 0, 300, 200);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 60); ctx.quadraticCurveTo(75, 55 + Math.sin(time * 3) * 3, 150, 60);
      ctx.quadraticCurveTo(225, 65 + Math.sin(time * 3 + 1) * 3, 300, 60);
      ctx.stroke();

      const bobY = 100 + Math.sin(time * 2.2) * 7;

      if (!sim.isCut) {
        ctx.strokeStyle = '#64748b'; // Chain/rope
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(150, bobY + 15); ctx.lineTo(150, 200); ctx.stroke();

        ctx.save();
        ctx.translate(150, bobY);

        // Spikes (Black with silver tips)
        ctx.strokeStyle = '#08090b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 + time * 0.25;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 16); ctx.lineTo(Math.cos(angle) * 26, Math.sin(angle) * 26); ctx.stroke();
        }
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 + time * 0.25;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20); ctx.lineTo(Math.cos(angle) * 26, Math.sin(angle) * 26); ctx.stroke();
        }

        // Barrel body (Warm oak wood brown)
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Iron hoops/bands (Steel silver)
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 18, -Math.PI / 4, Math.PI / 4); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 18, Math.PI * 0.75, Math.PI * 1.25); ctx.stroke();

        ctx.restore();
      } else {
        const eAge = sim.timeSinceCut * 60;
        if (eAge < 10) {
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - eAge / 10})`;
          ctx.beginPath(); ctx.arc(150, sim.extra.explosionY, eAge * 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(150, sim.extra.explosionY, eAge * 6, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
  };

export default SpikebarrelObstacle;
