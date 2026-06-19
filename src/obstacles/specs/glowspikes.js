import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const GlowspikesObstacle = {
    id: 'glowspikes',
    name: 'Glowing Cave Spikes',
    biome: 'cave',
    desc: 'Bioluminescent ceiling stalactite with fluid droplets. Slicing snaps the stone (generous capsule collision), dropping it to shatter on the floor.',
    init: () => {
      return { dripY: 10, dripActive: false, dripSpeed: 0 };
    },
    checkCut: (p1, p2, sim) => {
      // Vertical stalactite centerline x=150, y=0 to 110. Generous capsule width=24.
      return checkThickLineCut(p1, p2, 150, 0, 110, 24);
    },
    onCut: (sim, hitX, hitY, angle) => {
      // Spawn falling bottom half
      sim.pieces.push({
        type: 'stalactite-bottom',
        x: 150,
        y: (hitY + 115) / 2,
        h: 115 - hitY,
        vy: 2.0,
        rotation: 0,
        rotSpeed: 0.03,
        shattered: false
      });

      // Sparks & dust
      for (let i = 0; i < 10; i++) {
        sim.particles.push({
          x: 150,
          y: hitY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 3 - 1,
          r: 2 + Math.random() * 3,
          color: '#111215',
          opacity: 1,
          decay: 0.02,
          gravity: 0.2
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Deep cave background
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#0a0814');
      cave.addColorStop(1, '#17132a');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Floor
      ctx.fillStyle = '#110e20';
      ctx.fillRect(0, 175, 300, 25);

      // Water drip update
      if (!sim.isCut) {
        if (!sim.extra.dripActive) {
          sim.extra.dripY = 115;
          sim.extra.dripSpeed = 0;
          if (Math.random() < 0.015) sim.extra.dripActive = true;
        } else {
          sim.extra.dripSpeed += 0.35;
          sim.extra.dripY += sim.extra.dripSpeed;
          if (sim.extra.dripY >= 175) {
            sim.extra.dripActive = false;
            for (let i = 0; i < 4; i++) {
              sim.particles.push({
                x: 150,
                y: 175,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2 - 1,
                r: 1.5,
                color: '#38bdf8',
                opacity: 1,
                decay: 0.05,
                gravity: 0.2
              });
            }
          }
        }
      }

      if (sim.extra.dripActive && !sim.isCut) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(150, sim.extra.dripY, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      const drawStalactiteShape = (yMin, yMax) => {
        ctx.beginPath();
        ctx.moveTo(135, yMin);
        ctx.lineTo(138, yMin + (yMax - yMin) * 0.3);
        ctx.lineTo(144, yMin + (yMax - yMin) * 0.6);
        ctx.lineTo(150, yMax);
        ctx.lineTo(156, yMin + (yMax - yMin) * 0.6);
        ctx.lineTo(162, yMin + (yMax - yMin) * 0.3);
        ctx.lineTo(165, yMin);
        ctx.closePath(); ctx.fill();

        // Bioluminescent veins
        const pulse = 0.5 + Math.sin(time * 4) * 0.35;
        ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(150, yMin); ctx.lineTo(150, yMin + (yMax - yMin) * 0.85);
        ctx.stroke();
      };

      if (!sim.isCut) {
        ctx.fillStyle = '#334155'; // Grey-blue slate stalactite
        drawStalactiteShape(0, 115);
      } else {
        ctx.fillStyle = '#334155';
        drawStalactiteShape(0, sim.cutY);

        sim.pieces.forEach(p => {
          if (!p.shattered) {
            p.vy += 0.45;
            p.y += p.vy;
            p.rotation += p.rotSpeed;

            const tipRealY = p.y + p.h / 2;
            if (tipRealY >= 175) {
              p.shattered = true;
              for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 5;
                sim.particles.push({
                  x: p.x,
                  y: 172,
                  vx: Math.cos(angle) * speed,
                  vy: -Math.abs(Math.sin(angle)) * speed - 1.5,
                  r: 1.5 + Math.random() * 3,
                  color: Math.random() > 0.4 ? '#111215' : '#38bdf8',
                  opacity: 1,
                  decay: 0.02,
                  gravity: 0.25
                });
              }
            } else {
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rotation);
              ctx.fillStyle = '#334155';
              const halfH = p.h / 2;
              ctx.beginPath();
              ctx.moveTo(-10, -halfH); ctx.lineTo(10, -halfH); ctx.lineTo(6, -halfH + p.h * 0.4); ctx.lineTo(0, halfH); ctx.lineTo(-6, -halfH + p.h * 0.4);
              ctx.closePath(); ctx.fill();

              const pulse = 0.5 + Math.sin(time * 5) * 0.35;
              ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.moveTo(0, -halfH); ctx.lineTo(0, halfH - 4); ctx.stroke();
              ctx.restore();
            }
          }
        });
      }
    }
  };

export default GlowspikesObstacle;
