import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const SpikedboulderObstacle = {
    id: 'spikedboulder',
    name: 'Spike Floated Boulder',
    biome: 'water',
    desc: 'Spiky naval hazard floating below the surface, bobbing slowly and anchored. Slice to split rock, dispersing spikes.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      // Circle at x=150, y=bobY, r=32
      const bobY = 110 + Math.sin(sim.time * 1.8) * 6;
      return checkSegmentCircle(p1, p2, 150, bobY, 32);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces.push({
        side: 'left',
        x: 150,
        y: hitY,
        vx: -1.2,
        vy: 0.8,
        rotation: 0,
        rotSpeed: -0.02
      });
      sim.pieces.push({
        side: 'right',
        x: 150,
        y: hitY,
        vx: 1.2,
        vy: 0.8,
        rotation: 0,
        rotSpeed: 0.02
      });

      // Floating spikes (Black needles with gray tips)
      for (let i = 0; i < 10; i++) {
        const spAngle = (i * Math.PI * 2) / 10 + (Math.random() - 0.5) * 0.4;
        sim.particles.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(spAngle) * 2.5,
          vy: Math.sin(spAngle) * 1.8 - 0.4,
          r: 1,
          h: 22 + Math.random() * 8,
          color: '#cbd5e1', // silver/gray tip color for particles
          opacity: 1,
          decay: 0.015,
          gravity: -0.01,
          shape: 'spike_needle',
          rotation: spAngle + Math.PI / 2,
          rotSpeed: (Math.random() - 0.5) * 0.08
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Water
      const water = ctx.createLinearGradient(0, 0, 0, 200);
      water.addColorStop(0, '#06283b');
      water.addColorStop(1, '#02131e');
      ctx.fillStyle = water;
      ctx.fillRect(0, 0, 300, 200);

      const bobY = 110 + Math.sin(time * 1.8) * 6;
      const r = 28;

      if (!sim.isCut) {
        // Chain to seabed (Gray)
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(150, bobY); ctx.lineTo(150, 195); ctx.stroke();

        ctx.save();
        ctx.translate(150, bobY);

        // Radially spikes (Black spikes with gray stroke)
        ctx.strokeStyle = '#08090b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12 + time * 0.12;
          const tipLen = r + 20;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
        }
        // Silver tips
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12 + time * 0.12;
          const tipLen = r + 20;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * (r + 14), Math.sin(angle) * (r + 14)); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
        }

        // Boulder body (Slate steel grey)
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Facet details
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.3); ctx.lineTo(0, 0); ctx.lineTo(r * 0.4, -r * 0.2);
        ctx.moveTo(0, 0); ctx.lineTo(0, r * 0.6);
        ctx.stroke();

        // Seaweed hanging (Vibrant green seaweed)
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.5);
        ctx.quadraticCurveTo(-r * 0.8, r * 0.9 + Math.sin(time * 2) * 4, -r * 0.6, r * 1.5);
        ctx.stroke();

        ctx.restore();
      } else {
        sim.pieces.forEach(p => {
          p.vy = Math.min(1.2, p.vy + 0.06);
          p.y += p.vy; p.x += p.vx;
          p.rotation += p.rotSpeed;

          if (p.y < 230) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            // Spikes (Black with silver tips)
            ctx.strokeStyle = '#08090b';
            ctx.lineWidth = 3;
            const startIdx = p.side === 'left' ? 3 : 9;
            for (let i = startIdx; i < startIdx + 6; i++) {
              const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
              const tipLen = r + 15;
              ctx.beginPath(); ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
            }
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            for (let i = startIdx; i < startIdx + 6; i++) {
              const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
              const tipLen = r + 15;
              ctx.beginPath(); ctx.moveTo(Math.cos(angle) * (r + 9), Math.sin(angle) * (r + 9)); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
            }

            // Boulder body (Slate steel grey)
            ctx.fillStyle = '#4b5563';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (p.side === 'left') ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, false);
            else ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            ctx.restore();
          }
        });
      }
    }
  };

export default SpikedboulderObstacle;
