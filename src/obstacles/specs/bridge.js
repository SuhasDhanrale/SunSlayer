import { checkSegmentCircle } from '../helpers.js';

export const BridgeObstacle = {
    id: 'bridge',
    name: 'Suspended Platform Bridge',
    biome: 'normal',
    desc: 'Horizontal wooden bridge suspended mid-air. Slicing the target snaps the center rope, dropping the platform vertically to fill the gap.',
    // The open pit, as [start, end] fractions of the local 300-wide box. The floor
    // is carved away here (FloorRenderer) and an uncut bridge over it is lethal
    // (PhysicsSystem). Ledges are local 0–80 / 220–300, so the gap is 80–220.
    gap: [80 / 300, 220 / 300],
    ceilingTethers: (sim) => sim.isCut ? [] : [
      { x: 150, y: 0, strokeStyle: '#38bdf8', lineWidth: 3 },
    ],
    init: () => {
      return { ropeScaleY: 1.0, dropY: 80 };
    },
    checkCut: (p1, p2, sim) => {
      // Red target holding bridge at x=150, y=40 (radius 14)
      return checkSegmentCircle(p1, p2, 150, 40, 14);
    },
    onCut: (sim, hitX, hitY, angle) => {
      for (let i = 0; i < 15; i++) {
        sim.particles.push({
          x: 150,
          y: 40,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 4 - 2,
          r: 2,
          color: i % 2 === 0 ? '#38bdf8' : '#e0f2fe',
          opacity: 1,
          decay: 0.02,
          gravity: 0.15
        });
      }
    },
    draw: (ctx, sim, time) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 200);
      bg.addColorStop(0, '#090a12');
      bg.addColorStop(1, '#1b1b2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#07080d';
      ctx.fillRect(0, 150, 300, 50);

      // Left ledge (Slate stone, gray detail trim)
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 145, 80, 55);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 140, 80, 6);

      // Right ledge
      ctx.fillStyle = '#334155';
      ctx.fillRect(220, 145, 80, 55);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(220, 140, 80, 6);

      const brLength = 140;
      const leftX = 80;
      const targetYFloor = 143; // Where it needs to land

      if (!sim.isCut) {
        sim.extra.dropY = 80 + Math.sin(time * 2) * 3; // Bobbing slightly in air

        // The sliceable string — vivid blue so it reads as "cut me", running all
        // the way up to the ceiling (top of the box) so it clearly hangs from above.
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, 0);
        ctx.lineTo(150, sim.extra.dropY);
        ctx.stroke();

        // Support ropes to ends (blue to match the cut string)
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, sim.extra.dropY - 15);
        ctx.lineTo(85, sim.extra.dropY);
        ctx.moveTo(150, sim.extra.dropY - 15);
        ctx.lineTo(215, sim.extra.dropY);
        ctx.stroke();

        // Blue cut-knot (the slice target) with a soft pulsing glow.
        const pulse = 0.5 + Math.sin(time * 5) * 0.5;
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8 + pulse * 8;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(150, 40, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath(); ctx.arc(146, 36, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(150, 0);
          ctx.lineTo(150, 40 * sim.extra.ropeScaleY);
          ctx.stroke();
        }

        // Drop physics
        const gravity = 800;
        let dY = 80 + 0.5 * gravity * t * t;
        if (dY > targetYFloor) {
          // Bounce
          dY = targetYFloor - Math.abs(Math.cos(t * 12) * Math.max(0, 20 - t * 30));
        }
        sim.extra.dropY = dY;
      }

      // Draw Bridge Platform (Vermilion lacquered planks)
      ctx.fillStyle = '#c2410c';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.fillRect(leftX, sim.extra.dropY - 6, brLength, 12);
      ctx.strokeRect(leftX, sim.extra.dropY - 6, brLength, 12);

      ctx.fillStyle = '#fdba74';
      for (let ix = leftX + 10; ix < leftX + brLength; ix += 18) {
        ctx.fillRect(ix, sim.extra.dropY - 5, 3, 10);
      }
    }
  };

export default BridgeObstacle;
