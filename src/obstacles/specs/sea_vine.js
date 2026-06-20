import { checkThickLineCut } from '../helpers.js';

export const SeaVineObstacle = {
    id: 'sea_vine',
    name: 'Grasping Sea Vine',
    biome: 'water',
    desc: 'Luminous underwater vine that GROWS up toward the monk to seize him — its tip splits into grasping tendrils as it nears. Sever the stem before it reaches you, or it captures you into a stumble (feeds the samurai). Severing drops the grasp: top floats up while the bottom sways.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      // Swaying centerline — generous full-height check (x=150, y=30 to 200) so the
      // tall grasping stem is easy to sever anywhere along its reach.
      return checkThickLineCut(p1, p2, 150, 30, 200, 28);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces.push({
        type: 'vine-top',
        y: hitY,
        opacity: 1.0,
        driftX: 0,
        driftY: 0
      });

      for (let i = 0; i < 12; i++) {
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
        ctx.lineWidth = 6;
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

      // The grasping CLAW at the tip — three tendrils that open as the vine nears,
      // reading as "about to seize you". `reach` (0→1) widens the grasp.
      const drawGrasp = (tipX, tipY, reach) => {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const spread = 14 + reach * 18;
        const len = 16 + reach * 14;
        for (const dir of [-1, 0, 1]) {
          const curl = Math.sin(time * 3 + dir) * 4 * (1 - reach);
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.quadraticCurveTo(
            tipX + dir * spread * 0.5, tipY - len * 0.6,
            tipX + dir * spread + curl, tipY - len
          );
          ctx.stroke();
        }
        // glowing bud at the base of the grasp
        const pulse = 4 + Math.sin(time * 6) * 1.5;
        ctx.fillStyle = '#6ee7b7';
        ctx.beginPath(); ctx.arc(tipX, tipY, pulse, 0, Math.PI * 2); ctx.fill();
      };

      // GROW toward you: a TALLER stem rises from the seabed (y=195) up toward the
      // monk's surface lane (y=40) over its first second alive, then its tip splits
      // into a grasping claw. Reads as reaching out to seize the monk rather than
      // popping in. Cutting resolves the vine, so the cut branch ignores growth.
      const GROW_SECONDS = 1.0;
      const FULL_TOP = 40;
      const SEABED = 195;
      const t = Math.min(1, time / GROW_SECONDS);
      const grown = 1 - (1 - t) * (1 - t); // ease-out
      const grownTop = SEABED - (SEABED - FULL_TOP) * grown;

      if (!sim.isCut) {
        drawStem(SEABED, grownTop);
        const tipX = 150 + swayOffset(grownTop);
        drawGrasp(tipX, grownTop, grown);
      } else {
        drawStem(SEABED, sim.cutY);

        sim.pieces.forEach(p => {
          p.driftY -= 0.6;
          p.driftX = Math.sin(time * 1.2) * 8;
          p.opacity -= 0.012;

          if (p.opacity > 0) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.driftX, p.driftY);

            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            let first = true;
            for (let y = p.y; y >= 40; y -= 5) {
              const sx = 150 + swayOffset(y);
              if (first) { ctx.moveTo(sx, y); first = false; }
              else ctx.lineTo(sx, y);
            }
            ctx.stroke();

            ctx.fillStyle = '#34d399';
            for (let y = p.y - 10; y >= 45; y -= 22) {
              const sx = 150 + swayOffset(y);
              ctx.beginPath(); ctx.ellipse(sx - 8, y, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.ellipse(sx + 8, y, 6, 3, 0.4, 0, Math.PI * 2); ctx.fill();
              const pulse = 3 + Math.sin(time * 5 + y) * 1.5;
              ctx.fillStyle = '#a7f3d0';
              ctx.beginPath(); ctx.arc(sx, y, pulse, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#34d399';
            }
            // the severed tip's grasp goes limp as it floats up
            drawGrasp(150 + swayOffset(40), 40, 0);
            ctx.restore();
          }
        });
      }
    }
  };

export default SeaVineObstacle;
