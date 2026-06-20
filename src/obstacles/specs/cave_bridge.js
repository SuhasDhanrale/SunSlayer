import { checkSegmentCircle } from '../helpers.js';

// Cave SOLVE re-skin of the bridge read: a hinged DRAWBRIDGE. The near (left) end
// is anchored to the ledge; the far (right) end is HOISTED UP, held aloft by a
// single rope to the cave ceiling. Slicing the rope (the red knot, a HIGH aim)
// snaps the hoist and the plank swings down around its hinge to span the pit.
// Same pit mechanic as the flat bridge — `spec.gap` carves the floor (FloorRenderer)
// and the open span is lethal un-cut (PhysicsSystem); cut → plank covers it → safe.
const HINGE_X = 80;       // left inner ledge corner — the hinge pivot
const HINGE_Y = 140;
const PLANK_LEN = 140;    // flat far end reaches x=220 (right ledge top)
const RAISED_ANGLE = -0.82; // hoisted ~47° above horizontal
const FAR_X = HINGE_X + PLANK_LEN * Math.cos(RAISED_ANGLE); // ≈175.5
const FAR_Y = HINGE_Y + PLANK_LEN * Math.sin(RAISED_ANGLE); // ≈38
const KNOT = { x: FAR_X, y: (FAR_Y + 6) / 2, r: 14 };       // rope midpoint, ceiling at y=6

export const CaveBridgeObstacle = {
    id: 'cave_bridge',
    name: 'Cave Drawbridge',
    biome: 'cave',
    desc: 'Hinged drawbridge over a pit — near end anchored, far end hoisted up by a ceiling rope. Slice the rope (a high aim) and the plank swings down to bridge the gap; leave it raised and the monk falls in.',
    // Ledges are local 0–80 / 220–300, so the open pit is 80–220 (same as the
    // flat bridge — the plank spans it once it has swung down).
    gap: [80 / 300, 220 / 300],
    init: () => {
      return { angle: RAISED_ANGLE, ropeScaleY: 1.0 };
    },
    checkCut: (p1, p2) => {
      return checkSegmentCircle(p1, p2, KNOT.x, KNOT.y, KNOT.r);
    },
    onCut: (sim) => {
      // Rope fibres + a few rock chips burst off the snapped hoist.
      for (let i = 0; i < 14; i++) {
        sim.particles.push({
          x: KNOT.x,
          y: KNOT.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 4 - 2,
          r: 1.5 + Math.random() * 2,
          color: i % 3 === 0 ? '#ef4444' : (i % 3 === 1 ? '#a8763e' : '#cbb896'),
          opacity: 1,
          decay: 0.02,
          gravity: 0.18
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Deep cave backdrop (skipped in-game by the gameplay ctx; shows in gallery).
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#0a0814');
      cave.addColorStop(1, '#17132a');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Floor band + ledges (also gallery-only; the live FloorRenderer carves the
      // ditch under the pit and draws the real floor in its place).
      ctx.fillStyle = '#07080d';
      ctx.fillRect(0, 150, 300, 50);
      ctx.fillStyle = '#26303d';
      ctx.fillRect(0, HINGE_Y, 80, 60);
      ctx.fillRect(220, HINGE_Y, 80, 60);
      ctx.fillStyle = '#3b4757';
      ctx.fillRect(0, HINGE_Y - 5, 80, 5);
      ctx.fillRect(220, HINGE_Y - 5, 80, 5);

      // Resolve the plank angle: held at RAISED_ANGLE until cut, then swing down to
      // flat (0) with an easeOut + a small settle bounce at the bottom.
      let angle = RAISED_ANGLE;
      if (sim.isCut) {
        const t = sim.timeSinceCut;
        const swing = Math.min(1, t * 2.4);
        const eased = 1 - Math.pow(1 - swing, 3);
        angle = RAISED_ANGLE * (1 - eased);
        if (swing >= 1) {
          // tiny damped bounce as it slams onto the far ledge
          angle = -Math.abs(Math.cos((t - 0.42) * 16)) * Math.max(0, 0.05 - (t - 0.42) * 0.12);
        }
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 5);
      } else {
        sim.extra.ropeScaleY = 1;
      }
      sim.extra.angle = angle;

      // Hoist rope: full while raised, retracting up to the ceiling once cut.
      if (sim.extra.ropeScaleY > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(FAR_X, 6);
        if (!sim.isCut) {
          ctx.lineTo(FAR_X, FAR_Y);
        } else {
          ctx.lineTo(FAR_X, 6 + (FAR_Y - 6) * sim.extra.ropeScaleY);
        }
        ctx.stroke();
      }

      // The plank: dark cave timber with rope-lashed cross planks, pivoting on the hinge.
      ctx.save();
      ctx.translate(HINGE_X, HINGE_Y);
      ctx.rotate(angle);

      ctx.fillStyle = '#5b3d22';
      ctx.strokeStyle = '#2a1a0d';
      ctx.lineWidth = 2;
      ctx.fillRect(0, -6, PLANK_LEN, 12);
      ctx.strokeRect(0, -6, PLANK_LEN, 12);

      // Cross-plank slats + faint blue cave sheen on the timber.
      ctx.fillStyle = '#7a5230';
      for (let ix = 12; ix < PLANK_LEN; ix += 20) {
        ctx.fillRect(ix, -5, 4, 10);
      }
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(PLANK_LEN, -6);
      ctx.stroke();
      ctx.restore();

      // Hinge pin at the anchored end.
      ctx.fillStyle = '#1c2531';
      ctx.beginPath(); ctx.arc(HINGE_X, HINGE_Y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.arc(HINGE_X, HINGE_Y, 3, 0, Math.PI * 2); ctx.fill();

      // Blue hoist knot — the slice target — while still raised. Soft pulse so it
      // reads as the one thing to cut.
      if (!sim.isCut) {
        const pulse = 0.5 + Math.sin(time * 5) * 0.5;
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8 + pulse * 8;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(KNOT.x, KNOT.y, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath(); ctx.arc(KNOT.x - 4, KNOT.y - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  };

export default CaveBridgeObstacle;
