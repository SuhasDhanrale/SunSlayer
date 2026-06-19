import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const CaveboulderObstacle = {
    id: 'caveboulder',
    name: 'Sacred Cave Boulder',
    biome: 'cave',
    desc: 'Suspended sacred rock bound with Shimenawa rope. Cutting the rope (goes up) drops it, shattering crystals into glowing particles.',
    init: () => {
      return { boulderY: 90, velocityY: 0, rollX: 150, rollSpeed: 0, hitFloor: false, ropeScaleY: 1.0 };
    },
    checkCut: (p1, p2, sim) => {
      // Circular target on rope at x=150, y=50 (radius 14)
      return checkSegmentCircle(p1, p2, 150, 50, 14);
    },
    onCut: (sim, hitX, hitY, angle) => {
      // Rope sparks
      for (let i = 0; i < 15; i++) {
        sim.particles.push({
          x: 150,
          y: 50,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 4 - 2,
          r: 2,
          color: i % 2 === 0 ? '#ef4444' : '#e4e4e7',
          opacity: 1,
          decay: 0.02,
          gravity: 0.1
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Deep cave background
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#0c0717');
      cave.addColorStop(1, '#181026');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Floor
      ctx.fillStyle = '#140c20';
      ctx.fillRect(0, 165, 300, 35);

      const r = 36;

      if (!sim.isCut) {
        // Rope
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(150, 10); ctx.lineTo(150, 90); ctx.stroke();

        // Red target
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(150, 50, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(146, 46, 4, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(150, 90);

        // Draw crystals behind boulder (glowing pale cyan/silver)
        const pulse = 1 + Math.sin(time * 3) * 0.06;
        ctx.fillStyle = `rgba(56, 189, 248, ${0.7 + Math.sin(time * 3) * 0.2})`; // glowing cyan
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.4); ctx.lineTo(-r * 1.1 * pulse, -r * 1.0 * pulse); ctx.lineTo(-r * 0.3, -r * 0.8);
        ctx.moveTo(r * 0.5, -r * 0.1); ctx.lineTo(r * 1.2 * pulse, -r * 0.5 * pulse); ctx.lineTo(r * 0.7, r * 0.3);
        ctx.closePath(); ctx.fill();

        // Draw boulder shape (Grey granite rock)
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const numSides = 8;
        for (let i = 0; i < numSides; i++) {
          const theta = (i * Math.PI * 2) / numSides;
          const rad = r * (0.92 + Math.sin(i * 2.3) * 0.06);
          ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Facet details
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.2); ctx.lineTo(0, 0); ctx.lineTo(r * 0.5, -r * 0.3);
        ctx.moveTo(0, 0); ctx.lineTo(-r * 0.1, r * 0.8);
        ctx.stroke();

        // Shimenawa rope wrapped around center (Braided golden rope)
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.quadraticCurveTo(0, r * 0.3, r * 0.9, 0); ctx.stroke();
        
        ctx.strokeStyle = '#d97706'; // darker braids
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.quadraticCurveTo(0, r * 0.3, r * 0.9, 0); ctx.stroke();
        ctx.setLineDash([]); // reset

        // Paper streamers (Shide) hanging down (White with gray outlines)
        const drawShide = (xOff) => {
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xOff, r * 0.15); ctx.lineTo(xOff - 6, r * 0.4); ctx.lineTo(xOff, r * 0.45);
          ctx.lineTo(xOff - 6, r * 0.7); ctx.lineTo(xOff + 4, r * 0.75); ctx.lineTo(xOff + 2, r * 0.4);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        };
        drawShide(-18); drawShide(0); drawShide(18);

        ctx.restore();
      } else {
        // Cut: Rope snaps up
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4.5);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(150, 10); ctx.lineTo(150, 10 + 40 * sim.extra.ropeScaleY); ctx.stroke();
        }

        // Falling & splitting physics
        if (!sim.extra.hitFloor) {
          sim.extra.velocityY += 0.45; // gravity
          sim.extra.boulderY += sim.extra.velocityY;

          // Hits ground (y=165 - r=36 => y=129)
          if (sim.extra.boulderY >= 129) {
            sim.extra.boulderY = 129;
            sim.extra.hitFloor = true;
            
            // Shatter crystals into glowing cyan/blue sparks
            for (let i = 0; i < 28; i++) {
              const pAngle = Math.random() * Math.PI * 2;
              const speed = 2 + Math.random() * 6;
              sim.particles.push({
                x: 150,
                y: 165,
                vx: Math.cos(pAngle) * speed,
                vy: Math.sin(pAngle) * speed - 1.5,
                r: 3 + Math.random() * 4,
                color: i % 2 === 0 ? '#e0f2fe' : '#38bdf8',
                opacity: 1,
                decay: 0.02,
                gravity: 0.15,
                shape: 'spark'
              });
            }

            // Split pieces tumble apart
            sim.pieces.push({
              side: 'left',
              x: 150,
              y: 129,
              vx: -2.5,
              vy: -2.0,
              rotation: 0,
              rotSpeed: -0.05
            });
            sim.pieces.push({
              side: 'right',
              x: 150,
              y: 129,
              vx: 2.5,
              vy: -2.0,
              rotation: 0,
              rotSpeed: 0.05
            });
          }
        }

        if (!sim.extra.hitFloor) {
          // Draw falling boulder intact (Grey granite)
          ctx.save();
          ctx.translate(150, sim.extra.boulderY);
          ctx.fillStyle = '#4b5563';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const numSides = 8;
          for (let i = 0; i < numSides; i++) {
            const theta = (i * Math.PI * 2) / numSides;
            const rad = r * (0.92 + Math.sin(i * 2.3) * 0.06);
            ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
        } else {
          // Draw split pieces (Black)
          sim.pieces.forEach(p => {
            p.vy += 0.3; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            ctx.fillStyle = '#4b5563';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (p.side === 'left') {
              ctx.moveTo(0, -r);
              for (let i = 5; i <= 8; i++) {
                const theta = (i * Math.PI * 2 - Math.PI) / 8;
                const rad = r * (0.92 + Math.sin(i * 2.3) * 0.06);
                ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
              }
              ctx.lineTo(0, r);
            } else {
              ctx.moveTo(0, r);
              for (let i = 0; i <= 4; i++) {
                const theta = (i * Math.PI * 2 - Math.PI) / 8;
                const rad = r * (0.92 + Math.sin(i * 2.3) * 0.06);
                ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
              }
              ctx.lineTo(0, -r);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();

            // Broken rope segment (Gold)
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 3;
            ctx.beginPath();
            if (p.side === 'left') {
              ctx.moveTo(-r * 0.7, 0); ctx.quadraticCurveTo(-r * 0.4, r * 0.3, -5, r * 0.4);
            } else {
              ctx.moveTo(r * 0.7, 0); ctx.quadraticCurveTo(r * 0.4, r * 0.3, 5, r * 0.4);
            }
            ctx.stroke();

            ctx.restore();
          });
        }
      }
    }
  };

export default CaveboulderObstacle;
