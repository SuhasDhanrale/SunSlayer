import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const TntObstacle = {
    id: 'tnt',
    name: 'TNT Obstacle Blockade',
    biome: 'cave',
    desc: 'Heavy wood barrier blocking tunnels. Slicing the TNT triggers a blast that shatters the wooden barrier into flying planks.',
    init: () => {
      return { exploded: false, flashAge: 0 };
    },
    checkCut: (p1, p2, sim) => {
      // TNT bundle at x=150, y=145 (radius 25)
      return checkSegmentCircle(p1, p2, 150, 145, 25);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.extra.exploded = true;
      // Explode wooden planks of the barrier
      // Barrier is at x=110 to 190, y=100 to 175
      const plankHeights = [110, 125, 140, 155];
      plankHeights.forEach((py, idx) => {
        // Left piece
        sim.pieces.push({
          type: 'plank',
          x: 130,
          y: py,
          w: 40,
          h: 12,
          vx: -4 - Math.random() * 4,
          vy: -3 - Math.random() * 3,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.3
        });
        // Right piece
        sim.pieces.push({
          type: 'plank',
          x: 170,
          y: py,
          w: 40,
          h: 12,
          vx: 4 + Math.random() * 4,
          vy: -3 - Math.random() * 3,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.3
        });
      });

      // Explosion sparks and soot particles
      for (let i = 0; i < 35; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        sim.particles.push({
          x: 150,
          y: 145,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed - 1.5,
          r: 5 + Math.random() * 10,
          color: Math.random() > 0.6 ? '#dc2626' : (Math.random() > 0.3 ? '#ea580c' : '#334155'),
          opacity: 1,
          decay: 0.02 + Math.random() * 0.02,
          gravity: -0.05
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Cavern background
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#100b1a');
      cave.addColorStop(1, '#231932');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Cave floor
      ctx.fillStyle = '#171022';
      ctx.fillRect(0, 170, 300, 30);

      const drawBarrier = () => {
        ctx.fillStyle = '#b45309'; // Warm amber/redwood planks
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;

        // Draw vertical posts
        ctx.fillRect(100, 95, 12, 75);
        ctx.strokeRect(100, 95, 12, 75);
        ctx.fillRect(188, 95, 12, 75);
        ctx.strokeRect(188, 95, 12, 75);

        // Draw horizontal planks
        const plankHeights = [105, 120, 135, 150];
        plankHeights.forEach(py => {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(96, py, 108, 12);
          ctx.strokeRect(96, py, 108, 12);
          // wood details (highlight grain)
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(115, py + 4, 70, 2);
        });
      };

      if (!sim.isCut) {
        drawBarrier();

        // Draw TNT on top of the barrier
        ctx.save();
        ctx.translate(150, 145);

        // Dynamite bundle
        const drawStick = (xOff) => {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(xOff - 5, -16, 10, 32);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(xOff + 1, -16, 3, 32);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(xOff - 5, -16, 3, 32);
        };
        drawStick(-9);
        drawStick(9);
        drawStick(0); // middle

        // Write "TNT" on the dynamite sticks
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T', -9, -6);
        ctx.fillText('N', -9, 1);
        ctx.fillText('T', -9, 8);

        ctx.fillText('T', 0, -6);
        ctx.fillText('N', 0, 1);
        ctx.fillText('T', 0, 8);

        ctx.fillText('T', 9, -6);
        ctx.fillText('N', 9, 1);
        ctx.fillText('T', 9, 8);

        // Bands
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-14, -8, 28, 3);
        ctx.fillRect(-14, 5, 28, 3);

        // Fuse spark
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(8, -26, 10, -32); ctx.stroke();

        const flare = 3 + Math.sin(time * 30) * 1.5;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(10, -32, flare, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      } else {
        // Animate exploding barrier pieces (Black planks)
        sim.pieces.forEach(p => {
          p.vy += 0.3; // gravity
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          if (p.y < 230) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#1e1e24';
            ctx.strokeStyle = '#0c0d0f';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
          }
        });

        // Detonation screen flash
        const flashAge = sim.timeSinceCut * 60;
        if (flashAge < 8) {
          ctx.fillStyle = `rgba(255,255,255, ${0.9 - flashAge / 8})`;
          ctx.fillRect(0, 0, 300, 200);

          const fireRad = flashAge * 15;
          const fireGrad = ctx.createRadialGradient(150, 145, 2, 150, 145, fireRad);
          fireGrad.addColorStop(0, '#ffffff');
          fireGrad.addColorStop(0.3, '#fef08a');
          fireGrad.addColorStop(0.7, '#f97316');
          fireGrad.addColorStop(1, 'rgba(220,38,38,0)');
          ctx.fillStyle = fireGrad;
          ctx.beginPath(); ctx.arc(150, 145, fireRad, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  };

export default TntObstacle;
