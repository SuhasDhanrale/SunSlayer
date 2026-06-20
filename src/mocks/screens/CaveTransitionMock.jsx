import { useEffect, useRef } from 'react';

export const CaveTransitionMock = ({ state, setState }) => {
  const canvasRef = useRef(null);

  // Configuration settings
  const settings = {
    scrollSpeed: state.scrollSpeed ?? 1.5,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 400) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 700) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf;
    let time = 0;
    let distance = 0; // World x position

    // Define the Cave Layout
    const caveStartX = 500;
    const caveEndX = 2500;
    
    // Background Pillars (Dark slate, parallax slower)
    const bgPillars = [
      { x: 700, w: 300, h: 500, ceil: true, c: '#0f172a', p: 0.5 },
      { x: 1100, w: 400, h: 400, ceil: false, c: '#0f172a', p: 0.6 },
      { x: 1500, w: 250, h: 450, ceil: true, c: '#0f172a', p: 0.55 },
      { x: 1900, w: 350, h: 300, ceil: false, c: '#0f172a', p: 0.65 },
      { x: 2300, w: 280, h: 550, ceil: true, c: '#0f172a', p: 0.6 },
    ];

    // Waterfalls and their anchoring rocks
    const waterfalls = [
      { x: 800, p: 0.6, sourceRockH: 120, baseRockH: 160, w: 25, speed: 1.2, isMain: false },
      { x: 1200, p: 0.5, sourceRockH: 180, baseRockH: 80, w: 15, speed: 0.8, isMain: false },
      { x: 1500, p: 1.0, sourceRockH: 90, baseRockH: 40, w: 140, speed: 2.0, isMain: true },
      { x: 1850, p: 0.7, sourceRockH: 100, baseRockH: 220, w: 40, speed: 1.5, isMain: false },
      { x: 2150, p: 0.65, sourceRockH: 150, baseRockH: 120, w: 20, speed: 1.1, isMain: false },
      { x: 2450, p: 0.55, sourceRockH: 110, baseRockH: 180, w: 30, speed: 1.4, isMain: false }
    ];

    // Foreground Pillars (Pure black, frame the cave, parallax 1.0)
    const fgPillars = [
      // Entrance Archway
      { x: 450, w: 400, h: 550, ceil: true, c: '#020617' },
      { x: 550, w: 350, h: 400, ceil: false, c: '#020617' },
      { x: 700, w: 200, h: 300, ceil: true, c: '#020617' },

      // Midground details overlapping the waterfalls
      { x: 1050, w: 180, h: 250, ceil: false, c: '#020617' },
      { x: 1350, w: 220, h: 400, ceil: true, c: '#020617' },
      { x: 1650, w: 190, h: 200, ceil: false, c: '#020617' },
      { x: 2050, w: 240, h: 320, ceil: true, c: '#020617' },

      // Exit Archway
      { x: 2350, w: 250, h: 350, ceil: false, c: '#020617' },
      { x: 2450, w: 450, h: 600, ceil: true, c: '#020617' },
      { x: 2550, w: 350, h: 450, ceil: false, c: '#020617' },
    ];

    // Helper: Draw stylized vector rock pillar
    const drawRockPillar = (x, y, width, height, isCeiling, color) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      const dir = isCeiling ? 1 : -1;
      
      // Start at base
      ctx.moveTo(x - width / 2, y);
      
      // Clean angular facets
      ctx.lineTo(x - width * 0.25, y + height * 0.45 * dir);
      ctx.lineTo(x - width * 0.05, y + height * 0.85 * dir);
      ctx.lineTo(x + width * 0.15, y + height * 0.95 * dir);
      ctx.lineTo(x + width * 0.35, y + height * 0.5 * dir);
      
      // Back to base
      ctx.lineTo(x + width / 2, y);
      ctx.closePath();
      ctx.fill();
      
      // Flat shading overlay for a sleek vector look
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.moveTo(x - width * 0.05, y + height * 0.85 * dir);
      ctx.lineTo(x + width * 0.15, y + height * 0.95 * dir);
      ctx.lineTo(x + width * 0.35, y + height * 0.5 * dir);
      ctx.lineTo(x + width / 2, y);
      ctx.lineTo(x - width * 0.05, y);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw waterfall
    const drawWaterfall = (x, topY, width, height, speedMultiplier, isMain) => {
      ctx.save();
      
      // Soft glowing stream base
      const grad = ctx.createLinearGradient(x, topY, x, topY + height);
      grad.addColorStop(0, 'rgba(165, 243, 252, 0.0)');
      grad.addColorStop(0.1, isMain ? 'rgba(34, 211, 238, 0.8)' : 'rgba(34, 211, 238, 0.4)');
      grad.addColorStop(0.8, isMain ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, topY);
      ctx.lineTo(x + width / 2, topY);
      ctx.lineTo(x + width / 2 + (isMain ? 15 : 5), topY + height); // Slight spread at bottom
      ctx.lineTo(x - width / 2 - (isMain ? 15 : 5), topY + height);
      ctx.fill();

      // Falling water lines (simulate motion)
      ctx.fillStyle = isMain ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)';
      const numLines = isMain ? 10 : 4;
      for (let i = 0; i < numLines; i++) {
        const lineX = x - width / 2 + (i / (numLines - 1)) * width + Math.sin(i * 12) * 4;
        const progress = (time * speedMultiplier * 3 + i * 40) % height;
        ctx.fillRect(lineX, topY + progress, isMain ? 2.5 : 1.5, isMain ? 45 : 25);
      }

      // Ambient glow and rising mist for main waterfall
      if (isMain) {
        // Soft splash mist at the base
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x, topY + height, width * 1.4, width * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        const glow = ctx.createRadialGradient(x, topY + height / 2, 20, x, topY + height / 2, 300);
        glow.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, topY + height / 2, 300, 0, Math.PI * 2);
        ctx.fill();

        // Rising mist particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for(let i=0; i<12; i++) {
          const px = x + Math.sin(time*0.02 + i) * width * 1.2;
          const py = (topY + height) - ((time * 0.8 + i * 25) % 200);
          ctx.beginPath();
          ctx.arc(px, py, 1.5 + (i%2), 0, Math.PI*2);
          ctx.fill();
        }
      }
      
      ctx.restore();
    };

    // Rendering Loop
    const frame = () => {
      time++;
      distance += settings.scrollSpeed;

      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 60; // Slightly thicker floor
      const ceilingY = 60;    // Slightly thicker ceiling

      // 1. OUTDOOR WHITE BACKGROUND (Always fills the back)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // 2. CAVE INTERIOR BACKWALL (Only visible within the cave limits)
      const leftMaskX = caveStartX - distance;
      const rightMaskX = caveEndX - distance;
      
      // Draw the dark cavern interior
      ctx.save();
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
      wallGrad.addColorStop(0, '#020617'); // Dark slate
      wallGrad.addColorStop(0.5, '#0f172a'); // Slightly lighter slate
      wallGrad.addColorStop(1, '#020617'); // Dark slate
      
      ctx.fillStyle = wallGrad;
      // We fill a large rectangle that represents the cave interior
      // It is bordered by the white outdoors.
      ctx.fillRect(leftMaskX, 0, rightMaskX - leftMaskX, h);
      ctx.restore();

      // 3. BACKGROUND PILLARS (Parallax)
      bgPillars.forEach(p => {
        const px = p.x - distance * p.p;
        if (px > -p.w && px < w + p.w) {
          const y = p.ceil ? ceilingY : groundY;
          drawRockPillar(px, y, p.w, p.h, p.ceil, p.c);
        }
      });

      // 4. WATERFALL STREAMS (Drawn behind the base rocks)
      waterfalls.forEach(wf => {
        const wx = wf.x - distance * wf.p;
        if (wx > -100 && wx < w + 100) {
          const topY = ceilingY + wf.sourceRockH * 0.85; // hidden inside source rock
          const bottomY = groundY;  // flow all the way down, hidden behind base rock
          drawWaterfall(wx, topY, wf.w, bottomY - topY, wf.speed, wf.isMain);
        }
      });

      // 5. BASE ROCKS (Hide the bottoms of the waterfalls)
      waterfalls.forEach(wf => {
        const wx = wf.x - distance * wf.p;
        if (wx > -100 && wx < w + 100 && wf.baseRockH > 0) {
          const rockColor = wf.isMain ? '#020617' : '#0f172a';
          drawRockPillar(wx, groundY, wf.w * 6, wf.baseRockH, false, rockColor);
        }
      });

      // 5b. SOURCE ROCKS (Hide the top origin of the waterfalls)
      waterfalls.forEach(wf => {
        const wx = wf.x - distance * wf.p;
        if (wx > -100 && wx < w + 100 && wf.sourceRockH > 0) {
          const rockColor = wf.isMain ? '#020617' : '#0f172a';
          drawRockPillar(wx, ceilingY, wf.w * 5, wf.sourceRockH, true, rockColor);
        }
      });

      // 6. FOREGROUND PILLARS (Creates the Cave Entrance/Exit Arches)
      fgPillars.forEach(p => {
        const px = p.x - distance; // Parallax 1.0
        if (px > -p.w && px < w + p.w) {
          const y = p.ceil ? ceilingY : groundY;
          drawRockPillar(px, y, p.w, p.h, p.ceil, p.c);
        }
      });

      // 7. SOLID FOREGROUND CEILING & FLOOR (Seamless borders)
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, ceilingY);
      ctx.fillRect(0, groundY, w, h - groundY);

      // Clean rim highlight on the floor
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      raf = requestAnimationFrame(frame);
    };
    
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [settings.scrollSpeed]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'white' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#1c1917', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}>
        Short Cave Biome Transition Mock (Clean Stylized Vectors & Small Background Waterfalls)
      </div>
    </div>
  );
};
