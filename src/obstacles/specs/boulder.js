import { checkSegmentCircle } from '../helpers.js';

export const BoulderObstacle = {
    id: 'boulder',
    name: 'Suspended Boulder',
    biome: 'normal',
    desc: 'Heavy faceted granite trap rock held by a vertical rope. Slicing the target snaps the rope (goes up) and drops the boulder.',
    init: () => {
      return { boulderY: 90, velocityY: 0, rollX: 150, rollSpeed: 0, hitFloor: false, ropeScaleY: 1.0 };
    },
    checkCut: (p1, p2, sim) => {
      // Circular target on vertical rope at x=150, y=50 (radius 14)
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
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 200);
      sky.addColorStop(0, '#0a0d16');
      sky.addColorStop(1, '#2d3748');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 300, 200);

      // Floor ground
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 165, 300, 35);

      const r = 32;

      // Inner helper to draw the highly detailed sealed boulder
      const drawDetailedBoulder = (x, y, rotation) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Boulder body shape (Grey granite)
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const numSides = 7;
        for (let i = 0; i < numSides; i++) {
          const theta = (i * Math.PI * 2) / numSides;
          const rad = r * (0.92 + Math.sin(i * 1.8) * 0.07);
          ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing molten core
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.85);
        glow.addColorStop(0, 'rgba(253, 186, 116, 0.95)'); // Molten light orange
        glow.addColorStop(0.4, 'rgba(239, 68, 68, 0.7)'); // Red
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();

        // Molten cracks
        ctx.strokeStyle = '#fde047'; // Bright yellow energy
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-12, -8); ctx.lineTo(-20, -6);
        ctx.moveTo(0, 0); ctx.lineTo(10, 12); ctx.lineTo(8, 22);
        ctx.moveTo(0, 0); ctx.lineTo(-8, 12);
        ctx.moveTo(0, 0); ctx.lineTo(14, -10); ctx.lineTo(24, -8);
        ctx.stroke();

        // Facet lines (Light Slate detailing)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.2); ctx.lineTo(0, 0); ctx.lineTo(r * 0.5, -r * 0.3);
        ctx.moveTo(0, 0); ctx.lineTo(-r * 0.1, r * 0.8);
        ctx.stroke();

        // Highlight edge
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(0) * r * 0.95, Math.sin(0) * r * 0.95);
        for (let i = 1; i <= 3; i++) {
          const theta = (i * Math.PI * 2) / numSides;
          const rad = r * (0.92 + Math.sin(i * 1.8) * 0.07);
          ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
        }
        ctx.stroke();

        // Rope harness bindings (Holding the heavy boulder)
        ctx.strokeStyle = '#7c2d12'; // Warm brown rope
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.9, r * 0.3, 0.25, 0, Math.PI * 2);
        ctx.ellipse(0, 0, r * 0.3, r * 0.9, -0.2, 0, Math.PI * 2);
        ctx.stroke();

        // Rope knot at the top
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(0, -r + 2, 4, 0, Math.PI * 2); ctx.fill();

        // Paper Talisman (Ofuda) sealing the boulder
        ctx.save();
        ctx.translate(14, 10);
        ctx.rotate(0.15 + Math.sin(time * 3) * 0.1); // Fluttering
        
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.0;
        ctx.fillRect(-6, 0, 12, 22);
        ctx.strokeRect(-6, 0, 12, 22);
        
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 3); ctx.lineTo(0, 19);
        ctx.moveTo(-3, 6); ctx.lineTo(3, 6);
        ctx.moveTo(-3, 11); ctx.lineTo(3, 11);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      };

      if (!sim.isCut) {
        // Draw rope from ceiling to boulder center
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(150, 10);
        ctx.lineTo(150, 90);
        ctx.stroke();

        // Red target on rope
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(150, 50, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(146, 46, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw boulder hanging
        drawDetailedBoulder(150, 90, 0);
      } else {
        // Cut state: Rope retracts upward (goes up)
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4.5);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(150, 10);
          ctx.lineTo(150, 10 + 40 * sim.extra.ropeScaleY);
          ctx.stroke();
        }

        // Boulder falling physics
        if (!sim.extra.hitFloor) {
          sim.extra.velocityY += 0.45; // gravity
          sim.extra.boulderY += sim.extra.velocityY;

          // Spawn trailing molten sparks while falling
          if (Math.random() < 0.4) {
            sim.particles.push({
              x: sim.extra.rollX + (Math.random() - 0.5) * 15,
              y: sim.extra.boulderY - 10,
              vx: (Math.random() - 0.5) * 3,
              vy: -1 - Math.random() * 2,
              r: 1.5 + Math.random() * 2,
              color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
              opacity: 0.9,
              decay: 0.03,
              gravity: 0.05
            });
          }

          // Hits floor ground (y=165 - r=32 => y=133)
          if (sim.extra.boulderY >= 133) {
            sim.extra.boulderY = 133;
            sim.extra.hitFloor = true;
            sim.extra.rollSpeed = 3.5; // Starts rolling right
            
            // Dust burst on impact (Gray dust + sparks)
            for (let i = 0; i < 12; i++) {
              sim.particles.push({
                x: 150 + (Math.random() - 0.5) * 20,
                y: 165,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 3 - 1,
                r: 2 + Math.random() * 3,
                color: i % 3 === 0 ? '#f97316' : '#64748b',
                opacity: 0.8,
                decay: 0.03,
                gravity: 0.15
              });
            }
          }
        } else {
          // Rolling physics
          sim.extra.rollX += sim.extra.rollSpeed;
          sim.extra.rollSpeed *= 0.985; // friction

          // Spawn rolling ground sparks
          if (sim.extra.rollSpeed > 0.5 && Math.random() < 0.3) {
            sim.particles.push({
              x: sim.extra.rollX - 10,
              y: 163,
              vx: -1 - Math.random() * 2,
              vy: -0.5 - Math.random() * 1.5,
              r: 1.5,
              color: '#f97316',
              opacity: 0.9,
              decay: 0.04,
              gravity: 0.1
            });
          }
        }

        // Draw boulder rolling/falling
        const rollRotation = (sim.extra.rollX - 150) * 0.03;
        drawDetailedBoulder(sim.extra.rollX, sim.extra.boulderY, rollRotation);
      }
    }
  };

export default BoulderObstacle;
