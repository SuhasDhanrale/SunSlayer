import { checkSegmentHorizontalLine } from '../helpers.js';
import { drawYokaiMask } from '../../renderer/YokaiRenderer.js';

const RIDER_TYPES = ['oni', 'kitsune', 'noface'];

// Rider seat offsets per count — flanking the central lantern (no rider at x=0)
// so the glowing lantern stays visible between them as the raft's identifier.
// Authored for a ~220-wide deck; scaled to the actual deck width at layout time.
const RIDER_OFFSETS = {
  1: [-46],
  2: [-58, 58],
  3: [-74, -40, 62],
  4: [-82, -46, 46, 82],
};

// FIXED size of one bamboo log (local units). A bigger raft adds MORE logs at this
// same size — it never scales an individual log up — so the raft grows by its bits.
const RAFT_LOG_W = 18;

// Raft geometry derived from the yokai count it ferries: more riders ⇒ more logs ⇒
// a longer deck (built from same-size logs). Shared by checkCut, draw and the
// spawner so the cut hit-box, render and ram width all agree.
export function raftDims(yokaiCount) {
  const n = Math.max(1, Math.min(7, yokaiCount || 3));
  const logCount = 6 + n;                  // 7 logs (smallest) … 13 logs (biggest)
  const raftW = logCount * RAFT_LOG_W;
  return { logCount, raftW, logW: RAFT_LOG_W };
}

function riderLayout(count, raftW) {
  const n = Math.max(1, Math.min(4, count || 3));
  const k = raftW / 220;                    // spread the authored seats across the real deck
  return RIDER_OFFSETS[n].map((dx, i) => ({ dx: dx * k, type: RIDER_TYPES[i % RIDER_TYPES.length] }));
}

export const RaftObstacle = {
    id: 'raft',
    name: 'Yokai War Raft',
    biome: 'water',
    desc: 'A bamboo-log raft, marked by a glowing Toro Nagashi lantern, ferrying a pack of yokai riders. Ignore it and the raft RAMS the monk; slice it and the riders LEAP off straight at him (a yokai burst). The raft SIZE telegraphs how many.',
    init: () => {
      return { riders: null };
    },
    checkCut: (p1, p2, sim) => {
      const bobY = 135 + Math.sin(sim.time * 1.8) * 4;
      const { raftW } = raftDims(sim.extra.yokaiCount);
      return checkSegmentHorizontalLine(p1, p2, bobY, 150 - raftW / 2, 150 + raftW / 2);
    },
    onCut: (sim, hitX, hitY, angle) => {
      // Raft splits into two log halves that drift apart and settle. The riders are
      // NOT animated here — the real yokai wave (DemonSystem.spawnFromRaft) leaps off
      // the deck full-screen, so the riders you saw ARE the wave you now fight.
      sim.pieces.push({
        type: 'raft-left', x: 80, y: hitY,
        vx: -1.0, vy: 1.5, rotation: -0.05, rotSpeed: -0.015
      });
      sim.pieces.push({
        type: 'raft-right', x: 220, y: hitY,
        vx: 1.0, vy: 1.5, rotation: 0.05, rotSpeed: 0.015
      });

      // The lantern (the raft's identifier) springs up then plunges into the depths.
      sim.extra.lanternY = hitY - 30;
      sim.extra.lanternX = 150;
      sim.extra.lanternRot = 0;
      sim.extra.lanternVX = 0.5;
      sim.extra.lanternVY = -3.5;

      for (let i = 0; i < 18; i++) {
        sim.particles.push({
          x: 150 + (Math.random() - 0.5) * 60,
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
      const { logCount, raftW, logW } = raftDims(sim.extra.yokaiCount);
      if (!sim.extra.riders) sim.extra.riders = riderLayout(sim.extra.yokaiCount, raftW);

      const sky = ctx.createLinearGradient(0, 0, 0, 110);
      sky.addColorStop(0, '#020205'); sky.addColorStop(1, '#0b0f19');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 300, 110);

      const water = ctx.createLinearGradient(0, 110, 0, 200);
      water.addColorStop(0, '#09101f'); water.addColorStop(1, '#03060c');
      ctx.fillStyle = water; ctx.fillRect(0, 110, 300, 90);

      const bobY = 135 + Math.sin(time * 1.8) * 4;

      const drawLantern = () => {
        // Toro Nagashi lantern — the raft's identifier, drawn centered on the deck.
        ctx.fillStyle = '#451a03'; ctx.fillRect(-18, -6, 36, 6);      // base
        ctx.fillStyle = '#fef08a'; ctx.fillRect(-15, -40, 30, 34);    // paper
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2; ctx.strokeRect(-15, -40, 30, 34); // frame
        ctx.beginPath(); ctx.moveTo(-15, -23); ctx.lineTo(15, -23); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, -6); ctx.stroke();
        ctx.fillStyle = '#451a03';                                    // roof
        ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(12, -48); ctx.lineTo(-12, -48); ctx.closePath(); ctx.fill();
      };

      if (!sim.isCut) {
        // Warm lantern glow so the raft is identifiable from afar.
        const flicker = 1 + Math.sin(time * 12) * 0.15;
        const glowRad = 80 * flicker;
        const glowGrad = ctx.createRadialGradient(150, bobY - 36, 2, 150, bobY - 36, glowRad);
        glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.42)');
        glowGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.16)');
        glowGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(150, bobY - 36, glowRad, 0, Math.PI * 2); ctx.fill();

        ctx.save(); ctx.translate(150, bobY);

        // Raft base built from same-size bamboo logs — a bigger raft just has MORE
        // of them (logCount/raftW come from the yokai count it ferries).
        ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2.5;
        for (let i = 0; i < logCount; i++) {
          const lx = -raftW / 2 + i * logW;
          ctx.beginPath(); ctx.ellipse(lx + logW / 2, 0, logW / 2 - 1, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        // Wood bindings, lashed near each end of the deck.
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-raftW / 2 + 4, -9, 4, 18); ctx.fillRect(raftW / 2 - 8, -9, 4, 18);

        // Lantern (behind the riders), its glowing top poking above their heads.
        ctx.save(); ctx.translate(0, -10); drawLantern(); ctx.restore();

        ctx.restore();

        // Full-size yokai riders crouched on the deck, masks bobbing — the read is
        // "how many", and these are the same yokai that leap off when sliced.
        sim.extra.riders.forEach((rider, i) => {
          const rx = 150 + rider.dx;
          const sit = bobY - 22 + Math.sin(time * 3 + i) * 1.5;
          ctx.save();
          ctx.translate(rx, sit);
          // hunched dark body beneath the mask
          ctx.fillStyle = '#0b1120';
          ctx.beginPath();
          ctx.moveTo(-20, 30); ctx.quadraticCurveTo(-23, -4, 0, -10);
          ctx.quadraticCurveTo(23, -4, 20, 30); ctx.closePath(); ctx.fill();
          // mask (actual-size yokai)
          ctx.translate(0, -16);
          ctx.rotate(Math.sin(time * 2.2 + i) * 0.08);
          drawYokaiMask(ctx, rider.type, 24, { outlineWidth: 3 });
          ctx.restore();
        });
      } else {
        // Raft log halves drift apart and settle onto the water.
        sim.pieces.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed;
          p.y = Math.min(150, p.y + 0.1);

          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
          ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2.5;
          const logW = 26;
          for (let i = 0; i < 4; i++) {
            const lx = -52 + i * logW;
            ctx.beginPath(); ctx.ellipse(lx + logW / 2, 0, logW / 2 - 1, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
          ctx.restore();
        });

        // The lantern springs up, then plunges and fades into the depths.
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

          ctx.save();
          ctx.translate(sim.extra.lanternX, sim.extra.lanternY);
          ctx.rotate(sim.extra.lanternRot);
          ctx.globalAlpha = lOpacity;
          drawLantern();
          ctx.restore();
        }
      }
    }
  };

export default RaftObstacle;
