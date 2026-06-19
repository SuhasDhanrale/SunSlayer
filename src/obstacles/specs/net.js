import { checkThickLineCut, checkSegmentCircle, checkSegmentHorizontalLine } from '../helpers.js';

export const NetObstacle = {
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
  };

export default NetObstacle;
