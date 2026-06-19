import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const FishObstacle = {
    id: 'fish',
    name: 'Swimming Koi Fish',
    biome: 'water',
    desc: 'Gracefully swimming red/white Koi. Slicing triggers a splash of sumi-e ink and splits the fish into drifting halves.',
    init: () => {
      return { fx: 150, fy: 100 };
    },
    checkCut: (p1, p2, sim) => {
      const fx = sim.extra.fx ?? 150;
      const fy = sim.extra.fy ?? 100;
      return checkSegmentCircle(p1, p2, fx, fy, 22);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces.push({
        side: 'head',
        x: hitX,
        y: hitY,
        vx: Math.cos(angle - Math.PI / 4) * 4,
        vy: Math.sin(angle - Math.PI / 4) * 4,
        rotation: angle
      });
      sim.pieces.push({
        side: 'tail',
        x: hitX,
        y: hitY,
        vx: -Math.cos(angle + Math.PI / 4) * 4,
        vy: -Math.sin(angle + Math.PI / 4) * 4,
        rotation: angle
      });

      // Sumi-e ink particles (Black, gray, white splashes)
      for (let i = 0; i < 20; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5;
        sim.particles.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed - 0.5,
          r: 2.5 + Math.random() * 5,
          color: Math.random() > 0.6 ? '#020617' : (Math.random() > 0.3 ? '#64748b' : '#f8fafc'),
          opacity: 1,
          decay: 0.02,
          gravity: 0.08
        });
      }
    },
    draw: (ctx, sim, time) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 200);
      bg.addColorStop(0, '#0c4a6e');
      bg.addColorStop(1, '#0c1d30');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 300, 200);

      if (!sim.isCut) {
        const scaleX = 75;
        const scaleY = 32;
        const speed = 1.3;
        const fx = 150 + Math.cos(time * speed) * scaleX;
        const fy = 100 + Math.sin(time * speed * 2) * scaleY;

        sim.extra.fx = fx;
        sim.extra.fy = fy;

        const dx = -Math.sin(time * speed) * scaleX * speed;
        const dy = Math.cos(time * speed * 2) * scaleY * speed * 2;
        const heading = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(heading);

        const tailWiggle = Math.sin(time * 12) * 0.35;

        // Pectoral fins (White with black/gray detailing)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(4, -8, 8, 12, -Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(4, 8, 8, 12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.ellipse(5, -10, 3, 6, -Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(5, 10, 3, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // White Body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2); ctx.fill();

        // Ink patches (Vibrant orange and red patches)
        ctx.fillStyle = '#ea580c'; // Vibrant orange patches
        ctx.beginPath(); ctx.ellipse(-4, -2, 6, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#dc2626'; // Crimson red patches
        ctx.beginPath(); ctx.ellipse(6, 2, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.beginPath(); ctx.arc(-5, 3, 2, 0, Math.PI * 2); ctx.arc(3, -3, 1.5, 0, Math.PI * 2); ctx.fill();

        // eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(10, -5, 1.5, 0, Math.PI * 2); ctx.arc(10, 5, 1.5, 0, Math.PI * 2); ctx.fill();

        // Tail
        ctx.save();
        ctx.translate(-14, 0);
        ctx.rotate(tailWiggle);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(-4, 0, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-18, -10, -22, -12); ctx.quadraticCurveTo(-18, 0, -26, 0); ctx.quadraticCurveTo(-18, 0, -22, 12);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        ctx.restore();
      } else {
        sim.pieces.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.95; p.vy *= 0.95;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, 1 - sim.timeSinceCut * 1.5);

          if (p.side === 'head') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ea580c'; // Orange patch on head
            ctx.beginPath(); ctx.ellipse(-4, -2, 6, 4, 0.3, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(-14, 0, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        });
      }
    }
  };

export default FishObstacle;
