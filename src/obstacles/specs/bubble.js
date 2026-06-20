import { checkSegmentCircle } from '../helpers.js';

// Local-space bubble geometry. The worldBox is authored 3:2 (see placeBubble) so a
// circle here stays a circle on screen (equal x/y scale), and the cut hit-test and
// the drawn sphere share this one radius.
const CX = 150;
const CY = 100;
const R = 92;

// ─────────────────────────────────────────────────────────────────────────────
// Bubble — the WATER "below" threat. A big air pocket wells up from the seabed and
// RISES toward the swimming monk (a mover, dir:-1, PhysicsSystem). Its long climb
// through the open water column IS the slice window: slash it on the way up and it
// POPS (safe). Ignore it and it engulfs the monk and FLINGS him upward — a vertical
// knock that costs tempo and feeds the samurai (PhysicsSystem lift). Non-lethal:
// water is the breather. Pairs with the surface raft to make the player watch both
// above and below. // SPRITE-READY
// ─────────────────────────────────────────────────────────────────────────────
export const BubbleObstacle = {
  id: 'bubble',
  name: 'Updraft Bubble',
  biome: 'water',
  desc: 'A swollen air pocket that rises from the seabed straight up at the monk. Slice it during its climb to POP it; ignore it and it scoops him up and flings him toward the surface (a tempo loss, not a death). The watch-below half of the water read.',
  init: () => ({ wobble: Math.random() * Math.PI * 2 }),

  // Generous circular swipe test — the wobble only nudges the drawn skin, the cut
  // hit-box stays on the true centre so it reads as fair.
  checkCut: (p1, p2, sim) => checkSegmentCircle(p1, p2, CX, CY, R),

  onCut: (sim) => {
    // Burst into a spray of foam droplets that fan out and rise.
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      sim.particles.push({
        x: CX + Math.cos(a) * R * 0.5,
        y: CY + Math.sin(a) * R * 0.5,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 1.5,
        r: 2 + Math.random() * 5,
        color: '#bae6fd',
        opacity: 1,
        decay: 0.025,
        gravity: -0.04,
      });
    }
  },

  draw: (ctx, sim, time) => {
    if (sim.isCut) return; // popped — only the foam particles remain (drawn by the gallery)

    const wob = sim.extra.wobble || 0;
    const sx = 1 + Math.sin(time * 4 + wob) * 0.06;       // gentle squash/stretch as it rises
    const sy = 1 - Math.sin(time * 4 + wob) * 0.06;

    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(sx, sy);

    // Translucent body — bright skin fading to a clear centre.
    const body = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
    body.addColorStop(0, 'rgba(224, 247, 255, 0.55)');
    body.addColorStop(0.6, 'rgba(56, 189, 248, 0.22)');
    body.addColorStop(1, 'rgba(14, 116, 144, 0.30)');
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();

    // Rim — a soft cyan membrane edge.
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, Math.PI * 2); ctx.stroke();

    // Specular highlight (top-left) — the read that it's a glassy air pocket.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath(); ctx.ellipse(-R * 0.38, -R * 0.42, R * 0.16, R * 0.1, -0.7, 0, Math.PI * 2); ctx.fill();

    // A couple of smaller air pockets clinging inside.
    ctx.fillStyle = 'rgba(224, 247, 255, 0.5)';
    ctx.beginPath(); ctx.arc(R * 0.3, R * 0.2, R * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(R * 0.05, R * 0.45, R * 0.1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },
};

export default BubbleObstacle;
