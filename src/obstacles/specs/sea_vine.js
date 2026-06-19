import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const SeaVineObstacle = {
    id: 'sea_vine',
    name: 'Growing Sea Vine',
    biome: 'water',
    desc: 'Luminous underwater vine swaying in tides. Severing cuts the stem: top floats up while bottom sways.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      // Swaying centerline (generous check at x=150, y=60 to 200)
      return checkThickLineCut(p1, p2, 150, 60, 200, 24);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces.push({
        type: 'vine-top',
        y: hitY,
        opacity: 1.0,
        driftX: 0,
        driftY: 0
      });

      for (let i = 0; i < 10; i++) {
        sim.particles.push({
          x: 150,
          y: hitY,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3 - 0.8,
          r: 2 + Math.random() * 3.5,
          color: '#059669',
          opacity: 1,
          decay: 0.012,
          gravity: -0.02
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Ocean water
      const sea = ctx.createLinearGradient(0, 0, 0, 200);
      sea.addColorStop(0, '#083344');
      sea.addColorStop(1, '#021520');
      ctx.fillStyle = sea;
      ctx.fillRect(0, 0, 300, 200);

      // caustics
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(140, 0); ctx.lineTo(60, 200); ctx.lineTo(0, 200); ctx.fill();

      // Seabed
      ctx.fillStyle = '#081721'; ctx.fillRect(0, 190, 300, 10);

      const swayOffset = (py) => Math.sin(time * 1.8 + py * 0.03) * 15;

      const drawStem = (yBottom, yTop) => {
        ctx.strokeStyle = '#059669'; // Vibrant emerald stem
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        let first = true;
        for (let y = yBottom; y >= yTop; y -= 5) {
          const sx = 150 + swayOffset(y);
          if (first) { ctx.moveTo(sx, y); first = false; }
          else ctx.lineTo(sx, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#34d399'; // Mint green leaves
        for (let y = yBottom - 10; y >= yTop + 5; y -= 22) {
          const sx = 150 + swayOffset(y);
          ctx.beginPath(); ctx.ellipse(sx - 8, y, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(sx + 8, y, 6, 3, 0.4, 0, Math.PI * 2); ctx.fill();

          const pulse = 3 + Math.sin(time * 5 + y) * 1.5;
          ctx.fillStyle = '#a7f3d0'; // Glowing aquamarine vein center
          ctx.beginPath(); ctx.arc(sx, y, pulse, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#34d399';
        }
      };

      if (!sim.isCut) {
        drawStem(195, 60);
      } else {
        drawStem(195, sim.cutY);

        sim.pieces.forEach(p => {
          p.driftY -= 0.6;
          p.driftX = Math.sin(time * 1.2) * 8;
          p.opacity -= 0.012;

          if (p.opacity > 0) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.driftX, p.driftY);

            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            let first = true;
            for (let y = p.y; y >= 60; y -= 5) {
              const sx = 150 + swayOffset(y);
              if (first) { ctx.moveTo(sx, y); first = false; }
              else ctx.lineTo(sx, y);
            }
            ctx.stroke();

            ctx.fillStyle = '#34d399';
            for (let y = p.y - 10; y >= 65; y -= 22) {
              const sx = 150 + swayOffset(y);
              ctx.beginPath(); ctx.ellipse(sx - 8, y, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.ellipse(sx + 8, y, 6, 3, 0.4, 0, Math.PI * 2); ctx.fill();
              const pulse = 3 + Math.sin(time * 5 + y) * 1.5;
              ctx.fillStyle = '#a7f3d0';
              ctx.beginPath(); ctx.arc(sx, y, pulse, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#34d399';
            }
            ctx.restore();
          }
        });
      }
    }
  };

export default SeaVineObstacle;
