import React, { useState, useEffect, useRef } from 'react';

// --- INLINE SVG ICONS (Bulletproof, no dependencies) ---
const IconReset = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
  </svg>
);

const IconSlash = () => (
  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.121 14.121L19 19m-7-7L5 5m7 7l-2 8-4-4 4-4 8-2z" />
  </svg>
);

const IconInfo = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

// --- COLLISION HELPER MATH ---

// Point-to-segment distance helper
function getPointSegmentDistance(pt, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(pt.x - p1.x, pt.y - p1.y);
  }
  let t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(pt.x - (p1.x + t * dx), pt.y - (p1.y + t * dy));
}

// Generous capsule collision for vertical lines (e.g. spikes, vines)
function checkThickLineCut(p1, p2, lx, ly1, ly2, thickness = 22) {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const ly = ly1 + (ly2 - ly1) * (i / steps);
    const dist = getPointSegmentDistance({ x: lx, y: ly }, p1, p2);
    if (dist < thickness) {
      return { x: lx, y: ly };
    }
  }
  return null;
}

// Check intersection between swipe and a circular target
function checkSegmentCircle(p1, p2, cx, cy, r) {
  const dist = getPointSegmentDistance({ x: cx, y: cy }, p1, p2);
  return dist < r ? { x: cx, y: cy } : null;
}

// Check intersection with horizontal line
function checkSegmentHorizontalLine(p1, p2, targetY, targetXMin, targetXMax) {
  if ((p1.y - targetY) * (p2.y - targetY) <= 0 && p1.y !== p2.y) {
    const t = (targetY - p1.y) / (p2.y - p1.y);
    const intersectX = p1.x + t * (p2.x - p1.x);
    if (intersectX >= targetXMin && intersectX <= targetXMax) {
      return { x: intersectX, y: targetY };
    }
  }
  // Fallback to point check
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const lx = targetXMin + (targetXMax - targetXMin) * (i / steps);
    const dist = getPointSegmentDistance({ x: lx, y: targetY }, p1, p2);
    if (dist < 15) {
      return { x: lx, y: targetY };
    }
  }
  return null;
}

// --- SPECIFIED ASSETS AND VISUALIZATIONS ---
const ASSETS_SPECS = [
  // ==================== NORMAL BIOME ====================
  {
    id: 'spike',
    name: 'Bamboo Spikes',
    biome: 'normal',
    desc: 'A cluster of sharp, pointy ground stakes. Swipe to cleanly sever the tips and send them flying out.',
    init: () => {
      // 3 pointy spikes
      return {
        spikes: [
          { x: 135, yBase: 175, h: 80 },
          { x: 150, yBase: 175, h: 100 },
          { x: 165, yBase: 175, h: 70 }
        ]
      };
    },
    checkCut: (p1, p2, sim) => {
      // Check collision over the general spike area
      return checkThickLineCut(p1, p2, 150, 75, 175, 40);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces = [];
      sim.extra.spikes.forEach(s => {
        // If cut is above the base, separate the top
        if (hitY < s.yBase) {
          const cutH = hitY - (s.yBase - s.h);
          if (cutH > 0) {
            sim.pieces.push({
              x: s.x,
              y: hitY - cutH / 2,
              w: 8,
              h: cutH,
              vx: Math.cos(angle) * (3 + Math.random() * 3),
              vy: Math.sin(angle) * 3 - 2 - Math.random() * 2,
              rotation: 0,
              rotSpeed: (Math.random() - 0.5) * 0.3
            });
            s.h = s.yBase - hitY; // shorten base stump
          }
        }
      });
      // Charcoal/silver wood chips
      for (let i = 0; i < 15; i++) {
        const pAngle = angle + (Math.random() - 0.5) * Math.PI;
        sim.particles.push({
          x: hitX + (Math.random() - 0.5) * 20,
          y: hitY + (Math.random() - 0.5) * 10,
          vx: Math.cos(pAngle) * (2 + Math.random() * 4),
          vy: Math.sin(pAngle) * (2 + Math.random() * 4) - 1,
          r: 2 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#cbd5e1' : '#374151',
          opacity: 1,
          decay: 0.02 + Math.random() * 0.02,
          gravity: 0.25
        });
      }
    },
    draw: (ctx, sim, time) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
      skyGrad.addColorStop(0, '#090e15');
      skyGrad.addColorStop(1, '#1b263b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 175, 300, 25);

      const drawPointySpike = (x, yBase, h) => {
        // Sharp pointy polygon (warm terracotta brown)
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.moveTo(x - 5, yBase);
        ctx.lineTo(x + 5, yBase);
        ctx.lineTo(x, yBase - h); // pointy tip
        ctx.closePath();
        ctx.fill();

        // Shading/Highlight (warm amber)
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(x, yBase);
        ctx.lineTo(x + 5, yBase);
        ctx.lineTo(x, yBase - h);
        ctx.closePath();
        ctx.fill();

        // Golden/Yellow accent line
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yBase);
        ctx.lineTo(x, yBase - h);
        ctx.stroke();
      };

      // Draw base stumps
      sim.extra.spikes.forEach(s => {
        drawPointySpike(s.x, s.yBase, s.h);
        // If cut, draw flat light wood-gray top
        if (sim.isCut) {
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.ellipse(s.x, s.yBase - s.h, 5 * (s.h / 100 + 0.1), 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw flying tips
      if (sim.isCut) {
        sim.pieces.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          ctx.fillStyle = '#7c2d12';
          ctx.beginPath();
          ctx.moveTo(-4, p.h / 2);
          ctx.lineTo(4, p.h / 2);
          ctx.lineTo(0, -p.h / 2); // pointy top
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(0, p.h / 2);
          ctx.lineTo(4, p.h / 2);
          ctx.lineTo(0, -p.h / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, p.h / 2);
          ctx.lineTo(0, -p.h / 2);
          ctx.stroke();
          
          ctx.restore();
        });
      }
    }
  },
  {
    id: 'bridge',
    name: 'Suspended Platform Bridge',
    biome: 'normal',
    desc: 'Horizontal wooden bridge suspended mid-air. Slicing the target snaps the center rope, dropping the platform vertically to fill the gap.',
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
          color: i % 2 === 0 ? '#ef4444' : '#d4d4d8',
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

        // Rope to ceiling
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, 10);
        ctx.lineTo(150, sim.extra.dropY);
        ctx.stroke();

        // Support ropes to ends
        ctx.beginPath();
        ctx.moveTo(150, sim.extra.dropY - 15);
        ctx.lineTo(85, sim.extra.dropY);
        ctx.moveTo(150, sim.extra.dropY - 15);
        ctx.lineTo(215, sim.extra.dropY);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(150, 40, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(146, 36, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(150, 10);
          ctx.lineTo(150, 10 + 30 * sim.extra.ropeScaleY);
          ctx.stroke();
        }

        // Drop physics
        const gravity = 800;
        let dY = 80 + 0.5 * gravity * t * t;
        if (dY > targetYFloor) {
          // Bounce
          const over = dY - targetYFloor;
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
  },
  {
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
  },

  // ==================== CAVE BIOME ====================
  {
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
  },
  {
    id: 'drawbridge',
    name: 'One-Side Hanging Bridge',
    biome: 'cave',
    desc: 'Suspended drawbridge held high. Cutting the rope (goes up) causes the bridge to fall down to horizontal, bridging the cave gap.',
    init: () => {
      return { ropeScaleY: 1.0 };
    },
    checkCut: (p1, p2, sim) => {
      // Red target holding bridge at x=190, y=70 (radius 14)
      return checkSegmentCircle(p1, p2, 190, 70, 14);
    },
    onCut: (sim, hitX, hitY, angle) => {
      for (let i = 0; i < 15; i++) {
        sim.particles.push({
          x: 190,
          y: 70,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 4 - 2,
          r: 2,
          color: i % 2 === 0 ? '#ef4444' : '#e2e8f0',
          opacity: 1,
          decay: 0.02,
          gravity: 0.15
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Cavern
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#100b19');
      cave.addColorStop(1, '#22182e');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Deep dark gap
      ctx.fillStyle = '#08050c';
      ctx.fillRect(0, 160, 300, 40);

      // Left ledge support (Slate rock with gray trim)
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 140, 65, 35);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 137, 65, 3);

      // Right cliff destination
      ctx.fillStyle = '#334155';
      ctx.fillRect(215, 140, 85, 35);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(215, 137, 85, 3);

      const pivotX = 60;
      const pivotY = 142;
      const bridgeLen = 156;

      if (!sim.isCut) {
        // Draw bridge tilted up at -65 deg
        const tiltAngle = -Math.PI / 2.8;
        const tipX = pivotX + bridgeLen * Math.cos(tiltAngle);
        const tipY = pivotY + bridgeLen * Math.sin(tiltAngle);

        // Rope to left ceiling (190, 15)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(190, 15);
        ctx.stroke();

        // Red target
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(190, 70, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(186, 66, 4, 0, Math.PI * 2); ctx.fill();

        // Draw bridge boards (Vermilion planks)
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(tiltAngle);

        ctx.fillStyle = '#c2410c';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, bridgeLen, 12);
        ctx.strokeRect(0, -6, bridgeLen, 12);

        ctx.fillStyle = '#fdba74';
        for (let ix = 15; ix < bridgeLen; ix += 20) {
          ctx.fillRect(ix, -5, 3, 10);
        }
        ctx.restore();

        // hinge pin
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        // Cut: Rope snaps going up (retracts)
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(190, 10);
          ctx.lineTo(190, 10 + 60 * sim.extra.ropeScaleY);
          ctx.stroke();
        }

        // Bridge rotates down to horizontal (0 deg) with elastic bounce
        const restAngle = 0;
        const startAngle = -Math.PI / 2.8;
        const diff = restAngle - startAngle;
        const currentAngle = restAngle - diff * Math.cos(t * 7.5) * Math.exp(-t * 2.2);

        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(currentAngle);

        ctx.fillStyle = '#c2410c';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, bridgeLen, 12);
        ctx.strokeRect(0, -6, bridgeLen, 12);

        ctx.fillStyle = '#fdba74';
        for (let ix = 15; ix < bridgeLen; ix += 20) {
          ctx.fillRect(ix, -5, 3, 10);
        }
        ctx.restore();

        // hinge pin
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  {
    id: 'smallbridges',
    name: 'Small Log Bridges',
    biome: 'cave',
    desc: 'Two log bridges raised in a V-shape. Slicing the target snaps the center rope (goes up) and drops both logs flat to span the pit.',
    init: () => {
      return { ropeScaleY: 1.0 };
    },
    checkCut: (p1, p2, sim) => {
      // Red target at x=150, y=70 (radius 14) holding logs
      return checkSegmentCircle(p1, p2, 150, 70, 14);
    },
    onCut: (sim, hitX, hitY, angle) => {
      for (let i = 0; i < 15; i++) {
        sim.particles.push({
          x: 150,
          y: 70,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 4 - 2,
          r: 2,
          color: i % 2 === 0 ? '#ef4444' : '#e4e4e7',
          opacity: 1,
          decay: 0.02,
          gravity: 0.15
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Cave
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#100b1a');
      cave.addColorStop(1, '#1d1428');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Gorge
      ctx.fillStyle = '#08050c';
      ctx.fillRect(0, 160, 300, 40);

      // Cliffs (Slate stone)
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 135, 60, 35);
      ctx.fillRect(240, 135, 60, 35);

      const leftPivot = { x: 60, y: 143 };
      const rightPivot = { x: 240, y: 143 };
      const logLen = 92;

      if (!sim.isCut) {
        // Draw logs in V-shape: left log raised at -45 deg, right log raised at -135 deg
        const lAngle = -Math.PI / 4.5;  // ~ -40 deg
        const rAngle = -Math.PI * 0.78; // ~ -140 deg

        const lTipX = leftPivot.x + logLen * Math.cos(lAngle);
        const lTipY = leftPivot.y + logLen * Math.sin(lAngle);
        const rTipX = rightPivot.x + logLen * Math.cos(rAngle);
        const rTipY = rightPivot.y + logLen * Math.sin(rAngle);

        // Center vertical rope to ceiling
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, 70);
        ctx.lineTo(150, 10);
        ctx.moveTo(150, 70);
        ctx.lineTo(lTipX, lTipY);
        ctx.moveTo(150, 70);
        ctx.lineTo(rTipX, rTipY);
        ctx.stroke();

        // Red target
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(150, 70, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(146, 66, 4, 0, Math.PI * 2); ctx.fill();

        // Draw Left Log (Warm amber wood log)
        ctx.save();
        ctx.translate(leftPivot.x, leftPivot.y);
        ctx.rotate(lAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        // Bark detail lines
        ctx.fillStyle = '#fde047';
        ctx.fillRect(10, -3, logLen - 20, 1.5);
        ctx.restore();

        // Draw Right Log
        ctx.save();
        ctx.translate(rightPivot.x, rightPivot.y);
        ctx.rotate(rAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(10, -3, logLen - 20, 1.5);
        ctx.restore();
      } else {
        // Cut: Rope snaps going up (retracts)
        const t = sim.timeSinceCut;
        sim.extra.ropeScaleY = Math.max(0, 1 - t * 4);

        if (sim.extra.ropeScaleY > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(150, 10);
          ctx.lineTo(150, 10 + 60 * sim.extra.ropeScaleY);
          ctx.stroke();
        }

        // Both logs swing down to horizontal flat: left log to 0 deg, right log to -180 deg
        const lRest = 0;
        const lStart = -Math.PI / 4.5;
        const lAngle = lRest - (lRest - lStart) * Math.cos(t * 8.5) * Math.exp(-t * 2.5);

        const rRest = -Math.PI;
        const rStart = -Math.PI * 0.78;
        const rAngle = rRest - (rRest - rStart) * Math.cos(t * 8.5) * Math.exp(-t * 2.5);

        // Draw Left Log
        ctx.save();
        ctx.translate(leftPivot.x, leftPivot.y);
        ctx.rotate(lAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        ctx.restore();

        // Draw Right Log
        ctx.save();
        ctx.translate(rightPivot.x, rightPivot.y);
        ctx.rotate(rAngle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(0, -6, logLen, 12);
        ctx.strokeRect(0, -6, logLen, 12);
        ctx.restore();
      }
    }
  },
  {
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
  },
  {
    id: 'glowspikes',
    name: 'Glowing Cave Spikes',
    biome: 'cave',
    desc: 'Bioluminescent ceiling stalactite with fluid droplets. Slicing snaps the stone (generous capsule collision), dropping it to shatter on the floor.',
    init: () => {
      return { dripY: 10, dripActive: false, dripSpeed: 0 };
    },
    checkCut: (p1, p2, sim) => {
      // Vertical stalactite centerline x=150, y=0 to 110. Generous capsule width=24.
      return checkThickLineCut(p1, p2, 150, 0, 110, 24);
    },
    onCut: (sim, hitX, hitY, angle) => {
      // Spawn falling bottom half
      sim.pieces.push({
        type: 'stalactite-bottom',
        x: 150,
        y: (hitY + 115) / 2,
        h: 115 - hitY,
        vy: 2.0,
        rotation: 0,
        rotSpeed: 0.03,
        shattered: false
      });

      // Sparks & dust
      for (let i = 0; i < 10; i++) {
        sim.particles.push({
          x: 150,
          y: hitY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 3 - 1,
          r: 2 + Math.random() * 3,
          color: '#111215',
          opacity: 1,
          decay: 0.02,
          gravity: 0.2
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Deep cave background
      const cave = ctx.createLinearGradient(0, 0, 0, 200);
      cave.addColorStop(0, '#0a0814');
      cave.addColorStop(1, '#17132a');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, 300, 200);

      // Floor
      ctx.fillStyle = '#110e20';
      ctx.fillRect(0, 175, 300, 25);

      // Water drip update
      if (!sim.isCut) {
        if (!sim.extra.dripActive) {
          sim.extra.dripY = 115;
          sim.extra.dripSpeed = 0;
          if (Math.random() < 0.015) sim.extra.dripActive = true;
        } else {
          sim.extra.dripSpeed += 0.35;
          sim.extra.dripY += sim.extra.dripSpeed;
          if (sim.extra.dripY >= 175) {
            sim.extra.dripActive = false;
            for (let i = 0; i < 4; i++) {
              sim.particles.push({
                x: 150,
                y: 175,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2 - 1,
                r: 1.5,
                color: '#38bdf8',
                opacity: 1,
                decay: 0.05,
                gravity: 0.2
              });
            }
          }
        }
      }

      if (sim.extra.dripActive && !sim.isCut) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(150, sim.extra.dripY, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      const drawStalactiteShape = (yMin, yMax) => {
        ctx.beginPath();
        ctx.moveTo(135, yMin);
        ctx.lineTo(138, yMin + (yMax - yMin) * 0.3);
        ctx.lineTo(144, yMin + (yMax - yMin) * 0.6);
        ctx.lineTo(150, yMax);
        ctx.lineTo(156, yMin + (yMax - yMin) * 0.6);
        ctx.lineTo(162, yMin + (yMax - yMin) * 0.3);
        ctx.lineTo(165, yMin);
        ctx.closePath(); ctx.fill();

        // Bioluminescent veins
        const pulse = 0.5 + Math.sin(time * 4) * 0.35;
        ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(150, yMin); ctx.lineTo(150, yMin + (yMax - yMin) * 0.85);
        ctx.stroke();
      };

      if (!sim.isCut) {
        ctx.fillStyle = '#334155'; // Grey-blue slate stalactite
        drawStalactiteShape(0, 115);
      } else {
        ctx.fillStyle = '#334155';
        drawStalactiteShape(0, sim.cutY);

        sim.pieces.forEach(p => {
          if (!p.shattered) {
            p.vy += 0.45;
            p.y += p.vy;
            p.rotation += p.rotSpeed;

            const tipRealY = p.y + p.h / 2;
            if (tipRealY >= 175) {
              p.shattered = true;
              for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 5;
                sim.particles.push({
                  x: p.x,
                  y: 172,
                  vx: Math.cos(angle) * speed,
                  vy: -Math.abs(Math.sin(angle)) * speed - 1.5,
                  r: 1.5 + Math.random() * 3,
                  color: Math.random() > 0.4 ? '#111215' : '#38bdf8',
                  opacity: 1,
                  decay: 0.02,
                  gravity: 0.25
                });
              }
            } else {
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rotation);
              ctx.fillStyle = '#334155';
              const halfH = p.h / 2;
              ctx.beginPath();
              ctx.moveTo(-10, -halfH); ctx.lineTo(10, -halfH); ctx.lineTo(6, -halfH + p.h * 0.4); ctx.lineTo(0, halfH); ctx.lineTo(-6, -halfH + p.h * 0.4);
              ctx.closePath(); ctx.fill();

              const pulse = 0.5 + Math.sin(time * 5) * 0.35;
              ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.moveTo(0, -halfH); ctx.lineTo(0, halfH - 4); ctx.stroke();
              ctx.restore();
            }
          }
        });
      }
    }
  },

  // ==================== WATER BIOME ====================
  {
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
  },
  {
    id: 'spikedboulder',
    name: 'Spike Floated Boulder',
    biome: 'water',
    desc: 'Spiky naval hazard floating below the surface, bobbing slowly and anchored. Slice to split rock, dispersing spikes.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      // Circle at x=150, y=bobY, r=32
      const bobY = 110 + Math.sin(sim.time * 1.8) * 6;
      return checkSegmentCircle(p1, p2, 150, bobY, 32);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces.push({
        side: 'left',
        x: 150,
        y: hitY,
        vx: -1.2,
        vy: 0.8,
        rotation: 0,
        rotSpeed: -0.02
      });
      sim.pieces.push({
        side: 'right',
        x: 150,
        y: hitY,
        vx: 1.2,
        vy: 0.8,
        rotation: 0,
        rotSpeed: 0.02
      });

      // Floating spikes (Black needles with gray tips)
      for (let i = 0; i < 10; i++) {
        const spAngle = (i * Math.PI * 2) / 10 + (Math.random() - 0.5) * 0.4;
        sim.particles.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(spAngle) * 2.5,
          vy: Math.sin(spAngle) * 1.8 - 0.4,
          r: 1,
          h: 22 + Math.random() * 8,
          color: '#cbd5e1', // silver/gray tip color for particles
          opacity: 1,
          decay: 0.015,
          gravity: -0.01,
          shape: 'spike_needle',
          rotation: spAngle + Math.PI / 2,
          rotSpeed: (Math.random() - 0.5) * 0.08
        });
      }
    },
    draw: (ctx, sim, time) => {
      // Water
      const water = ctx.createLinearGradient(0, 0, 0, 200);
      water.addColorStop(0, '#06283b');
      water.addColorStop(1, '#02131e');
      ctx.fillStyle = water;
      ctx.fillRect(0, 0, 300, 200);

      const bobY = 110 + Math.sin(time * 1.8) * 6;
      const r = 28;

      if (!sim.isCut) {
        // Chain to seabed (Gray)
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(150, bobY); ctx.lineTo(150, 195); ctx.stroke();

        ctx.save();
        ctx.translate(150, bobY);

        // Radially spikes (Black spikes with gray stroke)
        ctx.strokeStyle = '#08090b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12 + time * 0.12;
          const tipLen = r + 20;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
        }
        // Silver tips
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12 + time * 0.12;
          const tipLen = r + 20;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * (r + 14), Math.sin(angle) * (r + 14)); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
        }

        // Boulder body (Slate steel grey)
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Facet details
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.3); ctx.lineTo(0, 0); ctx.lineTo(r * 0.4, -r * 0.2);
        ctx.moveTo(0, 0); ctx.lineTo(0, r * 0.6);
        ctx.stroke();

        // Seaweed hanging (Vibrant green seaweed)
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.5);
        ctx.quadraticCurveTo(-r * 0.8, r * 0.9 + Math.sin(time * 2) * 4, -r * 0.6, r * 1.5);
        ctx.stroke();

        ctx.restore();
      } else {
        sim.pieces.forEach(p => {
          p.vy = Math.min(1.2, p.vy + 0.06);
          p.y += p.vy; p.x += p.vx;
          p.rotation += p.rotSpeed;

          if (p.y < 230) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            // Spikes (Black with silver tips)
            ctx.strokeStyle = '#08090b';
            ctx.lineWidth = 3;
            const startIdx = p.side === 'left' ? 3 : 9;
            for (let i = startIdx; i < startIdx + 6; i++) {
              const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
              const tipLen = r + 15;
              ctx.beginPath(); ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
            }
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            for (let i = startIdx; i < startIdx + 6; i++) {
              const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
              const tipLen = r + 15;
              ctx.beginPath(); ctx.moveTo(Math.cos(angle) * (r + 9), Math.sin(angle) * (r + 9)); ctx.lineTo(Math.cos(angle) * tipLen, Math.sin(angle) * tipLen); ctx.stroke();
            }

            // Boulder body (Slate steel grey)
            ctx.fillStyle = '#4b5563';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (p.side === 'left') ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, false);
            else ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            ctx.restore();
          }
        });
      }
    }
  },
  {
    id: 'spikebarrel',
    name: 'Spiked Float Barrel',
    biome: 'water',
    desc: 'Spiked explosive barrel bobbing near the surface. Slicing triggers an expanding underwater bubble blast.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      const bobY = 95 + Math.sin(sim.time * 2.2) * 7;
      return checkSegmentCircle(p1, p2, 150, bobY, 26);
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.extra.explosionActive = true;
      sim.extra.explosionY = hitY;

      for (let i = 0; i < 30; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        sim.particles.push({
          x: 150,
          y: hitY,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed - 0.5,
          r: 2 + Math.random() * 4,
          color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
          opacity: 1,
          decay: 0.02,
          gravity: -0.06
        });
      }
    },
    draw: (ctx, sim, time) => {
      const water = ctx.createLinearGradient(0, 0, 0, 200);
      water.addColorStop(0, '#0284c7');
      water.addColorStop(1, '#073e5a');
      ctx.fillStyle = water;
      ctx.fillRect(0, 0, 300, 200);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 60); ctx.quadraticCurveTo(75, 55 + Math.sin(time * 3) * 3, 150, 60);
      ctx.quadraticCurveTo(225, 65 + Math.sin(time * 3 + 1) * 3, 300, 60);
      ctx.stroke();

      const bobY = 100 + Math.sin(time * 2.2) * 7;

      if (!sim.isCut) {
        ctx.strokeStyle = '#64748b'; // Chain/rope
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(150, bobY + 15); ctx.lineTo(150, 200); ctx.stroke();

        ctx.save();
        ctx.translate(150, bobY);

        // Spikes (Black with silver tips)
        ctx.strokeStyle = '#08090b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 + time * 0.25;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 16); ctx.lineTo(Math.cos(angle) * 26, Math.sin(angle) * 26); ctx.stroke();
        }
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 + time * 0.25;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20); ctx.lineTo(Math.cos(angle) * 26, Math.sin(angle) * 26); ctx.stroke();
        }

        // Barrel body (Warm oak wood brown)
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Iron hoops/bands (Steel silver)
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 18, -Math.PI / 4, Math.PI / 4); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 18, Math.PI * 0.75, Math.PI * 1.25); ctx.stroke();

        ctx.restore();
      } else {
        const eAge = sim.timeSinceCut * 60;
        if (eAge < 10) {
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - eAge / 10})`;
          ctx.beginPath(); ctx.arc(150, sim.extra.explosionY, eAge * 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(150, sim.extra.explosionY, eAge * 6, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
  },
  {
    id: 'net',
    name: 'Fishing Net',
    biome: 'water',
    desc: 'Woven rope barrier blocking the path. Slice to cleanly tear through the mesh like cloth, curling the torn edges away.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      // Net box x=30 to 270, y=50 to 170
      const hit = checkSegmentHorizontalLine(p1, p2, 110, 30, 270);
      if (hit) {
        // Record the cut line for tearing logic
        sim.extra.cutP1 = p1;
        sim.extra.cutP2 = p2;
        sim.extra.cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      }
      return hit;
    },
    onCut: (sim, hitX, hitY, angle) => {
      // Dust/rope fibers from the initial tear (Charcoal/gray)
      for (let i = 0; i < 20; i++) {
        sim.particles.push({
          x: hitX + (Math.random() - 0.5) * 40,
          y: hitY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle + Math.PI / 2) * (Math.random() - 0.5) * 6,
          vy: Math.sin(angle + Math.PI / 2) * (Math.random() - 0.5) * 6,
          r: 1.5 + Math.random() * 2,
          color: i % 2 === 0 ? '#475569' : '#94a3b8',
          opacity: 0.9,
          decay: 0.02,
          gravity: 0.06
        });
      }
    },
    draw: (ctx, sim, time) => {
      const sea = ctx.createLinearGradient(0, 0, 0, 200);
      sea.addColorStop(0, '#0d9488');
      sea.addColorStop(1, '#115e59');
      ctx.fillStyle = sea;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#0f766e';
      ctx.fillRect(0, 0, 300, 45);

      const netLeft = 30;
      const netRight = 270;
      const netTop = 45;
      const netBottom = 170;
      const gridSize = 15;

      const getNetPoint = (x, y) => {
        if (!sim.isCut) return { x, y };

        // Cloth Tear Logic
        // Calculate distance from point to the cut line
        const p1 = sim.extra.cutP1;
        const p2 = sim.extra.cutP2;
        
        // Line normal vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return { x, y };

        const nx = -dy / len;
        const ny = dx / len;

        // Signed distance
        const dist = (x - p1.x) * nx + (y - p1.y) * ny;
        
        // Tearing expands over time
        const t = Math.min(1.5, sim.timeSinceCut);
        const maxTear = 45 * t; // Max displacement

        // If point is within the tear region, displace it outward
        if (Math.abs(dist) < maxTear) {
          const push = maxTear - Math.abs(dist);
          return {
            x: x + nx * push * Math.sign(dist),
            y: y + ny * push * Math.sign(dist)
          };
        }
        return { x, y };
      };

      // Draw Net Mesh (Vibrant glowing orange-amber strings)
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.75)';
      ctx.lineWidth = 1.5;
      
      // We draw the mesh by connecting displaced points
      ctx.beginPath();
      // Vertical lines
      for (let ox = netLeft; ox <= netRight; ox += gridSize) {
        let first = true;
        for (let oy = netTop; oy <= netBottom; oy += gridSize) {
          const p = getNetPoint(ox, oy);
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else { ctx.lineTo(p.x, p.y); }
        }
      }
      // Horizontal lines
      for (let oy = netTop; oy <= netBottom; oy += gridSize) {
        let first = true;
        for (let ox = netLeft; ox <= netRight; ox += gridSize) {
          const p = getNetPoint(ox, oy);
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else { ctx.lineTo(p.x, p.y); }
        }
      }
      ctx.stroke();

      // Top floats (Alternating black and white/gray floats)
      for (let bx = netLeft; bx <= netRight; bx += 40) {
        const bob = Math.sin(time * 2.5 + bx * 0.05) * 3;
        const p = getNetPoint(bx, netTop);
        ctx.fillStyle = (bx / 40) % 2 === 0 ? '#18191e' : '#cbd5e1';
        ctx.beginPath(); ctx.arc(p.x, p.y + bob, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0c0d0f';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  },
  {
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
  },
  {
    id: 'raft',
    name: 'Large Raft & Lantern',
    biome: 'water',
    desc: 'Wide bamboo log raft carrying a large Toro Nagashi lantern. Slicing splits the heavy raft; the lantern plunges into the depths.',
    init: () => {
      return {};
    },
    checkCut: (p1, p2, sim) => {
      const bobY = 135 + Math.sin(sim.time * 1.8) * 4;
      return checkSegmentHorizontalLine(p1, p2, bobY, 60, 240); // wider check
    },
    onCut: (sim, hitX, hitY, angle) => {
      sim.pieces.push({
        type: 'raft-left', x: 80, y: hitY,
        vx: -1.0, vy: 1.5, rotation: -0.05, rotSpeed: -0.015
      });
      sim.pieces.push({
        type: 'raft-right', x: 220, y: hitY,
        vx: 1.0, vy: 1.5, rotation: 0.05, rotSpeed: 0.015
      });

      sim.extra.lanternY = hitY - 30;
      sim.extra.lanternX = 150;
      sim.extra.lanternRot = 0;
      sim.extra.lanternVX = 0.5;
      sim.extra.lanternVY = -3.5; // jumps up a bit before plunging

      for (let i = 0; i < 20; i++) {
        sim.particles.push({
          x: 150 + (Math.random() - 0.5) * 40,
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
      const sky = ctx.createLinearGradient(0, 0, 0, 110);
      sky.addColorStop(0, '#020205'); sky.addColorStop(1, '#0b0f19');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 300, 110);

      const water = ctx.createLinearGradient(0, 110, 0, 200);
      water.addColorStop(0, '#09101f'); water.addColorStop(1, '#03060c');
      ctx.fillStyle = water; ctx.fillRect(0, 110, 300, 90);

      const bobY = 135 + Math.sin(time * 1.8) * 4;

      if (!sim.isCut) {
        const flicker = 1 + Math.sin(time * 12) * 0.15;
        const glowRad = 70 * flicker;
        const glowGrad = ctx.createRadialGradient(150, bobY - 30, 2, 150, bobY - 30, glowRad);
        glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
        glowGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.15)');
        glowGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(150, bobY - 30, glowRad, 0, Math.PI * 2); ctx.fill();

        ctx.save(); ctx.translate(150, bobY);

        // Wider raft base (Fresh green bamboo logs)
        ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2.5;
        const logCount = 8;
        const raftW = 160;
        const logW = raftW / logCount;
        for (let i = 0; i < logCount; i++) {
          const lx = -raftW / 2 + i * logW;
          ctx.beginPath(); ctx.ellipse(lx + logW / 2, 0, logW / 2 - 1, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        // Wood bindings
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-60, -8, 4, 16); ctx.fillRect(56, -8, 4, 16);

        // Larger, more detailed Lantern
        ctx.translate(0, -9);
        ctx.fillStyle = '#451a03'; ctx.fillRect(-18, -6, 36, 6); // base
        ctx.fillStyle = '#fef08a'; ctx.fillRect(-15, -40, 30, 34); // paper
        ctx.strokeStyle = '#78350f'; ctx.strokeRect(-15, -40, 30, 34); // frame
        ctx.beginPath(); ctx.moveTo(-15, -23); ctx.lineTo(15, -23); ctx.stroke(); // inner frame
        ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, -6); ctx.stroke();
        
        ctx.fillStyle = '#451a03'; // roof
        ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(12, -48); ctx.lineTo(-12, -48); ctx.closePath(); ctx.fill();

        ctx.restore();
      } else {
        sim.pieces.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed;
          p.y = Math.min(145, p.y + 0.1);

          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
          ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2.5;
          const logW = 20;
          for (let i = 0; i < 4; i++) {
            const lx = -40 + i * logW;
            ctx.beginPath(); ctx.ellipse(lx + logW / 2, 0, logW / 2 - 1, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
          ctx.restore();
        });

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

          ctx.save(); ctx.translate(sim.extra.lanternX, sim.extra.lanternY); ctx.rotate(sim.extra.lanternRot);
          ctx.globalAlpha = lOpacity;
          ctx.fillStyle = '#451a03'; ctx.fillRect(-18, -6, 36, 6);
          ctx.fillStyle = '#fef08a'; ctx.fillRect(-15, -40, 30, 34);
          ctx.strokeStyle = '#78350f'; ctx.strokeRect(-15, -40, 30, 34);
          ctx.fillStyle = '#451a03'; ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(12, -48); ctx.lineTo(-12, -48); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
    }
  },
  {
    id: 'bamboo_thin',
    name: 'Thin Bamboo Stalk',
    biome: 'normal',
    desc: 'Classic environmental filler bamboo. A single clean swipe severs the stalk, splitting it into tumbling segments.',
    init: () => {
      return {
        x: 150,
        yBase: 175,
        h: 130,
        width: 10
      };
    },
    checkCut: (p1, p2, sim) => {
      return checkThickLineCut(p1, p2, 150, 45, 175, 12);
    },
    onCut: (sim, hitX, hitY, angle) => {
      const topH = hitY - (175 - 130);
      if (topH > 0) {
        sim.pieces.push({
          type: 'bamboo-top',
          x: 150,
          y: hitY - topH / 2,
          w: 10,
          h: topH,
          vx: Math.cos(angle) * (3 + Math.random() * 2),
          vy: Math.sin(angle) * 2 - 2 - Math.random() * 2,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.15
        });
      }

      for (let i = 0; i < 15; i++) {
        const pAngle = angle + (Math.random() - 0.5) * Math.PI;
        sim.particles.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(pAngle) * (2 + Math.random() * 4),
          vy: Math.sin(pAngle) * (2 + Math.random() * 4) - 1,
          r: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#22c55e' : '#15803d',
          opacity: 1.0,
          decay: 0.025,
          gravity: 0.2
        });
      }
    },
    draw: (ctx, sim, time) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 200);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(1, '#1e293b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 175, 300, 25);

      const drawBambooStalk = (x, yBase, h, w, cutHeight = null) => {
        const drawSegment = (syBase, sh) => {
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(x - w / 2, syBase - sh, w, sh);

          ctx.fillStyle = '#4ade80';
          ctx.fillRect(x - w / 2, syBase - sh, w * 0.25, sh);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(x + w / 2 - w * 0.25, syBase - sh, w * 0.25, sh);

          ctx.fillStyle = '#14532d';
          for (let ny = syBase - 5; ny > syBase - sh; ny -= 35) {
            ctx.fillRect(x - w / 2 - 1, ny, w + 2, 2);
            ctx.fillStyle = '#86efac';
            ctx.fillRect(x - w / 2 - 1, ny - 1, w + 2, 1);
            ctx.fillStyle = '#14532d';
          }
        };

        if (cutHeight !== null) {
          const stumpH = yBase - cutHeight;
          if (stumpH > 0) {
            drawSegment(yBase, stumpH);
            
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 4, 1, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          drawSegment(yBase, h);
        }
      };

      if (!sim.isCut) {
        drawBambooStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width);
      } else {
        drawBambooStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width, sim.cutY);

        sim.pieces.forEach(p => {
          p.vy += 0.3;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.fillStyle = '#16a34a';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

          ctx.fillStyle = '#4ade80';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w * 0.25, p.h);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(p.w / 2 - p.w * 0.25, -p.h / 2, p.w * 0.25, p.h);

          ctx.fillStyle = '#14532d';
          for (let ny = -p.h / 2 + 10; ny < p.h / 2; ny += 35) {
            ctx.fillRect(-p.w / 2 - 1, ny, p.w + 2, 2);
            ctx.fillStyle = '#86efac';
            ctx.fillRect(-p.w / 2 - 1, ny - 1, p.w + 2, 1);
            ctx.fillStyle = '#14532d';
          }

          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, p.h / 2, p.w / 2, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        });
      }
    }
  },
  {
    id: 'bamboo_thick',
    name: 'Thick Bamboo Stalk',
    biome: 'normal',
    desc: 'Dense, reinforced bamboo. Requires 3 slices to cut through. Each slice leaves a notch; the 3rd severs it.',
    init: () => {
      return {
        x: 150,
        yBase: 175,
        h: 140,
        width: 24,
        hp: 3,
        cuts: [],
        lastHitTime: 0
      };
    },
    checkCut: (p1, p2, sim) => {
      const hit = checkThickLineCut(p1, p2, 150, 35, 175, 20);
      if (hit) {
        const now = sim.time;
        if (now - sim.extra.lastHitTime > 0.25) {
          sim.extra.lastHitTime = now;
          sim.extra.hp -= 1;
          
          for (let i = 0; i < 8; i++) {
            const pAngle = Math.random() * Math.PI * 2;
            sim.particles.push({
              x: hit.x,
              y: hit.y,
              vx: Math.cos(pAngle) * (2 + Math.random() * 3),
              vy: Math.sin(pAngle) * (2 + Math.random() * 3) - 1,
              r: 1.5 + Math.random() * 2,
              color: i % 2 === 0 ? '#bef264' : '#22c55e',
              opacity: 1.0,
              decay: 0.04,
              gravity: 0.2
            });
          }

          if (sim.extra.hp > 0) {
            sim.extra.cuts.push({ y: hit.y, x: hit.x });
            return null;
          } else {
            return hit;
          }
        }
      }
      return null;
    },
    onCut: (sim, hitX, hitY, angle) => {
      const topH = hitY - (175 - 140);
      if (topH > 0) {
        sim.pieces.push({
          type: 'bamboo-thick-top',
          x: 150,
          y: hitY - topH / 2,
          w: 24,
          h: topH,
          vx: Math.cos(angle) * (2 + Math.random() * 2),
          vy: -3,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.1
        });
      }

      for (let i = 0; i < 25; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        sim.particles.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(pAngle) * (3 + Math.random() * 4),
          vy: Math.sin(pAngle) * (3 + Math.random() * 4) - 1.5,
          r: 2 + Math.random() * 4,
          color: i % 2 === 0 ? '#22c55e' : (i % 3 === 0 ? '#15803d' : '#bef264'),
          opacity: 1.0,
          decay: 0.02,
          gravity: 0.25
        });
      }
    },
    draw: (ctx, sim, time) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 200);
      bg.addColorStop(0, '#020205');
      bg.addColorStop(1, '#1e1e2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 175, 300, 25);

      const drawThickStalk = (x, yBase, h, w, cutHeight = null) => {
        const drawSegment = (syBase, sh) => {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(x - w / 2, syBase - sh, w, sh);

          ctx.fillStyle = '#22c55e';
          ctx.fillRect(x - w / 2, syBase - sh, w * 0.25, sh);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(x + w / 2 - w * 0.25, syBase - sh, w * 0.25, sh);

          ctx.fillStyle = '#14532d';
          for (let ny = syBase - 5; ny > syBase - sh; ny -= 45) {
            ctx.fillRect(x - w / 2 - 1.5, ny, w + 3, 3);
            ctx.fillStyle = '#bef264';
            ctx.fillRect(x - w / 2 - 1.5, ny - 1, w + 3, 1);
            ctx.fillStyle = '#14532d';
          }
        };

        if (cutHeight !== null) {
          const stumpH = yBase - cutHeight;
          if (stumpH > 0) {
            drawSegment(yBase, stumpH);
            
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.ellipse(x, cutHeight, w / 4, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          drawSegment(yBase, h);
        }
      };

      if (!sim.isCut) {
        drawThickStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width);

        sim.extra.cuts.forEach(c => {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(150 - 12, c.y - 8);
          ctx.lineTo(150 - 2, c.y);
          ctx.lineTo(150 - 12, c.y + 8);

          ctx.moveTo(150 + 12, c.y - 8);
          ctx.lineTo(150 + 2, c.y);
          ctx.lineTo(150 + 12, c.y + 8);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`HP: ${sim.extra.hp}`, 290, 20);
      } else {
        drawThickStalk(sim.extra.x, sim.extra.yBase, sim.extra.h, sim.extra.width, sim.cutY);

        sim.pieces.forEach(p => {
          p.vy += 0.3;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.fillStyle = '#15803d';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

          ctx.fillStyle = '#22c55e';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w * 0.25, p.h);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(p.w / 2 - p.w * 0.25, -p.h / 2, p.w * 0.25, p.h);

          ctx.fillStyle = '#14532d';
          for (let ny = -p.h / 2 + 10; ny < p.h / 2; ny += 45) {
            ctx.fillRect(-p.w / 2 - 1.5, ny, p.w + 3, 3);
            ctx.fillStyle = '#bef264';
            ctx.fillRect(-p.w / 2 - 1.5, ny - 1, p.w + 3, 1);
            ctx.fillStyle = '#14532d';
          }

          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, p.h / 2, p.w / 2, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        });
      }
    }
  }
];

// --- CARD RENDERING WRAPPER COMPONENT ---
const AssetCard = ({ spec, resetTrigger }) => {
  const canvasRef = useRef(null);
  const simStateRef = useRef({
    isCut: false,
    cutAngle: 0,
    cutX: 0,
    cutY: 0,
    particles: [],
    pieces: [],
    swipePoints: [],
    timeSinceCut: 0,
    time: 0,
    extra: {}
  });

  const [isSliced, setIsSliced] = useState(false);
  const dragActiveRef = useRef(false);

  // Initialize/Reset Card
  const resetCard = () => {
    simStateRef.current = {
      isCut: false,
      cutAngle: 0,
      cutX: 0,
      cutY: 0,
      particles: [],
      pieces: [],
      swipePoints: [],
      timeSinceCut: 0,
      time: 0,
      extra: spec.init()
    };
    setIsSliced(false);
    dragActiveRef.current = false;
  };

  useEffect(() => {
    resetCard();
  }, [resetTrigger, spec]);

  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 300,
      y: ((clientY - rect.top) / rect.height) * 200
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleStart = (e) => {
      dragActiveRef.current = true;
      const sim = simStateRef.current;
      sim.swipePoints = [];
      const coords = getCanvasCoords(e, canvas);
      sim.swipePoints.push({ ...coords, age: 1.0 });
    };

    const handleMove = (e) => {
      if (!dragActiveRef.current) return;
      const sim = simStateRef.current;
      const canvasCoords = getCanvasCoords(e, canvas);
      sim.swipePoints.push({ ...canvasCoords, age: 1.0 });

      if (sim.swipePoints.length > 12) {
        sim.swipePoints.shift();
      }

      if (sim.swipePoints.length >= 2 && !sim.isCut) {
        const p1 = sim.swipePoints[sim.swipePoints.length - 2];
        const p2 = sim.swipePoints[sim.swipePoints.length - 1];

        const hit = spec.checkCut(p1, p2, sim);
        if (hit) {
          sim.isCut = true;
          sim.cutX = hit.x;
          sim.cutY = hit.y;

          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          sim.cutAngle = angle;
          sim.timeSinceCut = 0;

          spec.onCut(sim, hit.x, hit.y, angle);
          setIsSliced(true);
        }
      }
    };

    const handleEnd = () => {
      dragActiveRef.current = false;
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    canvas.addEventListener('touchstart', handleStart, { passive: true });
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);

      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [spec]);

  // Main 60fps Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = 300 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    let raf;
    let lastTs = performance.now();

    const loop = (ts) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      const sim = simStateRef.current;
      sim.time += dt;

      if (sim.isCut) {
        sim.timeSinceCut += dt;
      }

      sim.swipePoints.forEach(p => {
        p.age -= dt * 3.5;
      });
      sim.swipePoints = sim.swipePoints.filter(p => p.age > 0);

      sim.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += p.gravity;
        if (p.rotation !== undefined && p.rotSpeed !== undefined) {
          p.rotation += p.rotSpeed;
        }
        p.opacity -= p.decay;
      });
      sim.particles = sim.particles.filter(p => p.opacity > 0);

      ctx.clearRect(0, 0, 300, 200);
      spec.draw(ctx, sim, sim.time);

      sim.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.shape === 'spark') {
          ctx.translate(p.x, p.y);
          ctx.beginPath();
          ctx.moveTo(0, -p.r); ctx.lineTo(p.r / 3, -p.r / 3); ctx.lineTo(p.r, 0); ctx.lineTo(p.r / 3, p.r / 3); ctx.lineTo(0, p.r); ctx.lineTo(-p.r / 3, p.r / 3); ctx.lineTo(-p.r, 0); ctx.lineTo(-p.r / 3, -p.r / 3);
          ctx.closePath(); ctx.fill();
        } else if (p.shape === 'spike_needle') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(0, -p.h / 2); ctx.lineTo(0, p.h / 2); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      });

      if (sim.swipePoints.length >= 2) {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#ffffff';

        for (let i = 1; i < sim.swipePoints.length; i++) {
          const pt1 = sim.swipePoints[i - 1];
          const pt2 = sim.swipePoints[i];
          ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y);
          ctx.lineWidth = pt2.age * 5.5 + 1.0;
          ctx.stroke();
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [spec]);

  const getBadgeStyle = (biome) => {
    switch (biome) {
      case 'normal': return 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-400';
      case 'cave': return 'bg-amber-950/40 border border-amber-800/80 text-amber-400';
      case 'water': return 'bg-sky-950/40 border border-sky-800/80 text-sky-400';
      default: return 'bg-slate-900 border border-slate-800 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-slate-700/80 hover:shadow-2xl group relative">
      <div className="relative aspect-[3/2] w-full bg-slate-950 overflow-hidden select-none cursor-crosshair">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
        
        {isSliced && (
          <div className="absolute top-3 left-3 bg-red-950/80 border border-red-500/50 text-red-400 font-mono text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <IconSlash />
            <span>RESOLVED</span>
          </div>
        )}

        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center justify-center">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 flex items-center gap-1.5 shadow-md">
            <span>🖱️ Swipe to Slice</span>
          </div>
        </div>

        {isSliced && (
          <button
            onClick={resetCard}
            title="Reset obstacle"
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-150 shadow-md backdrop-blur-sm cursor-pointer"
          >
            <IconReset />
          </button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-100 group-hover:text-red-400 transition-colors">
              {spec.name}
            </h3>
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getBadgeStyle(spec.biome)}`}>
              {spec.biome}
            </span>
          </div>
          <p className="text-[11.5px] text-slate-400 mt-2.5 leading-relaxed font-sans font-normal">
            {spec.desc}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <IconInfo />
            <span>Gameplay Element</span>
          </span>
          {isSliced ? (
            <span className="text-[10px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
              <IconCheck />
              <span>Slashed</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono text-red-400/85 font-semibold flex items-center gap-1 animate-pulse">
              <span>●</span>
              <span>Active</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN SCREEN EXPORT ---
export const AssetLibraryMock = () => {
  const [activeBiomeFilter, setActiveBiomeFilter] = useState('all');
  const [resetAllToken, setResetAllToken] = useState(0);

  const totalCount = ASSETS_SPECS.length;
  
  const filteredSpecs = ASSETS_SPECS.filter(spec => {
    if (activeBiomeFilter === 'all') return true;
    return spec.biome === activeBiomeFilter;
  });

  const handleResetAll = () => {
    setResetAllToken(prev => prev + 1);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-6 overflow-y-auto select-none">
      
      {/* Banner Header Area */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-900/60 px-2.5 py-1 rounded-full font-bold">
              Art Board
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
              Interactive Prototypes
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-3 tracking-wide flex items-center gap-2">
            <span>🏮 BAMBOO SLICER ART GALLERY</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            Verify the aesthetics and functionality of the level elements. Slice the ropes to drop bridges (filling the gaps) or drop suspended boulders. Swipe stakes, completely shatter nets, and explore the physics in real-time.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <IconReset />
            <span>Reset All Objects</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs and Count Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/20 border border-slate-900 p-2 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['all', 'normal', 'cave', 'water'].map(biome => (
            <button
              key={biome}
              onClick={() => setActiveBiomeFilter(biome)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeBiomeFilter === biome
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {biome === 'all' ? 'All Biomes' : `${biome} Biome`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-500 shrink-0">
          <span>Showing: <strong className="text-slate-300">{filteredSpecs.length}</strong> / {totalCount} Assets</span>
        </div>
      </div>

      {/* Grid of Interactive Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {filteredSpecs.map(spec => (
          <AssetCard
            key={spec.id}
            spec={spec}
            resetTrigger={resetAllToken}
          />
        ))}
      </div>

    </div>
  );
};
