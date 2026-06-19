import { useEffect, useRef } from 'react';
import { PALETTE } from '../../config/constants.js';

export const BiomeTransitionMock = ({ state, setState }) => {
  const canvasRef = useRef(null);

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
    let distance = 0;

    // Submerged Torii Gates (repeat every 1500px)
    const toriiGates = Array.from({ length: 4 }).map((_, i) => ({
      worldX: 500 + i * 1500 + Math.random() * 200,
      scale: 1.6,
      swayOffset: Math.random() * Math.PI * 2,
    }));

    // Kelp
    const generateKelp = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.5),
        height: Math.random() * varH + minH,
        width: Math.random() * 10 + 8,
        speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.01 + 0.004,
      }));
    };
    const kelpMid = generateKelp(10, 200, 1.2, 300, 150);

    const drawToriiGate = (tx, ty, tHeight, scale, isSubmerged) => {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);
      
      if (isSubmerged) {
        ctx.fillStyle = '#0f2434';
        ctx.strokeStyle = '#050f16';
      } else {
        ctx.fillStyle = '#9a3412';
        ctx.strokeStyle = '#5c1e0a';
      }
      ctx.lineWidth = 1.2;

      ctx.fillRect(-22, 0, 5, tHeight);
      ctx.strokeRect(-22, 0, 5, tHeight);
      ctx.fillRect(17, 0, 5, tHeight);
      ctx.strokeRect(17, 0, 5, tHeight);

      if (!isSubmerged) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-23.5, 0, 8, 4);

        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.moveTo(-35, -tHeight - 4);
        ctx.quadraticCurveTo(0, -tHeight - 1, 35, -tHeight - 4);
        ctx.lineTo(33, -tHeight);
        ctx.quadraticCurveTo(0, -tHeight + 2, -33, -tHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-36, -tHeight - 5);
        ctx.quadraticCurveTo(0, -tHeight - 2.5, 36, -tHeight - 5);
        ctx.lineTo(35, -tHeight - 3.5);
        ctx.quadraticCurveTo(0, -tHeight - 1, -35, -tHeight - 3.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#9a3412';
        ctx.fillRect(-28, -tHeight + 8, 56, 4);
        ctx.strokeRect(-28, -tHeight + 8, 56, 4);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-3, -tHeight + 2, 6, 6);
      }
      ctx.restore();
    };

    const frame = () => {
      time++;
      distance += settings.scrollSpeed;

      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;
      
      // Calculate transition phase
      // 0 to 400: stay at ground level
      // 400 to 1400: smoothly rise to water level
      // > 1400: stay at water level
      const transitionStart = 400;
      const transitionEnd = 1400;
      const targetWaterY = h * 0.4;
      
      let waterSurfaceY = groundY;
      if (time > transitionStart) {
        if (time < transitionEnd) {
          const t = (time - transitionStart) / (transitionEnd - transitionStart);
          const smoothT = t * t * (3 - 2 * t); // ease in-out
          waterSurfaceY = groundY - smoothT * (groundY - targetWaterY);
        } else {
          waterSurfaceY = targetWaterY;
        }
      }

      // --- DRAW BACKGROUND CAVE (behind water) ---
      // Base dark cave
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Distant Parallax Mountains/Cave wall
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 20) {
        const worldX = distance * 0.2 + x;
        const mountainY = groundY - 150 + Math.sin(worldX * 0.003) * 60 + Math.sin(worldX * 0.008) * 30;
        ctx.lineTo(x, mountainY);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // Near Parallax Trees/Rocks
      ctx.fillStyle = '#080f1e';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 15) {
        const worldX = distance * 0.4 + x;
        const hillY = groundY - 50 + Math.sin(worldX * 0.005) * 40;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // Cave Ceiling
      ctx.fillStyle = '#060a14';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 20) {
        const worldX = distance * 0.3 + x;
        const ceilY = 100 + Math.sin(worldX * 0.006) * 40 + Math.cos(worldX * 0.012) * 20;
        ctx.lineTo(x, ceilY);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fill();

      // --- DRAW WATER ---
      // We only draw water below the dynamic waterSurfaceY
      if (waterSurfaceY < h) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, waterSurfaceY, w, h - waterSurfaceY);
        ctx.clip();

        // Water Base Gradient
        const waterGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, h);
        waterGrad.addColorStop(0, 'rgba(9, 21, 35, 0.95)');   // surface
        waterGrad.addColorStop(0.5, 'rgba(7, 36, 57, 0.98)'); // mid
        waterGrad.addColorStop(1, '#01050a');    // deep
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, waterSurfaceY, w, h - waterSurfaceY);

        // Submerged Torii Gates
        toriiGates.forEach((gate) => {
          const gx = gate.worldX - distance * 0.75;
          if (gx > -150 && gx < w + 150) {
            drawToriiGate(gx, waterSurfaceY, 110, gate.scale, true);
          }
        });

        // Seabed Parallax Silhouettes
        ctx.fillStyle = '#030c14'; // dark navy silhouette
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 15) {
          const sx = distance * 0.4 + x;
          const sy = h - 60 + Math.sin(sx * 0.005) * 15 + Math.cos(sx * 0.015) * 5;
          ctx.lineTo(x, sy);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Kelp
        ctx.fillStyle = '#023c2a';
        ctx.strokeStyle = '#023c2a';
        ctx.lineWidth = 1;
        kelpMid.forEach((k) => {
          k.x -= k.speed * settings.scrollSpeed * 0.35;
          if (k.x < -100) k.x = w + 100 + Math.random() * 50;

          const sway = Math.sin(time * k.swaySpeed + k.swayOffset) * 25;
          const startY = h;
          let targetY = h - k.height * 0.95;
          if (targetY < waterSurfaceY + 20) targetY = waterSurfaceY + 20;

          ctx.beginPath();
          ctx.moveTo(k.x - k.width * 0.5, startY);
          ctx.quadraticCurveTo(k.x + sway * 0.5, startY - k.height * 0.5, k.x + sway, targetY);
          ctx.lineTo(k.x + sway + k.width, targetY);
          ctx.quadraticCurveTo(k.x + sway * 0.5 + k.width, startY - k.height * 0.5, k.x + k.width * 0.5, startY);
          ctx.closePath();
          ctx.fill();
        });

        // Underwater Vignette
        const vignette = ctx.createRadialGradient(w/2, waterSurfaceY + (h-waterSurfaceY)/2, (h-waterSurfaceY)*0.2, w/2, waterSurfaceY + (h-waterSurfaceY)/2, (h-waterSurfaceY)*0.75);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(2, 6, 23, 0.55)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, waterSurfaceY, w, h - waterSurfaceY);

        ctx.restore(); // end clip
      }

      // --- SKY ELEMENTS (Only drawn above water) ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, waterSurfaceY);
      ctx.clip();

      // Upper Half of Torii Gates
      toriiGates.forEach((gate) => {
        const gx = gate.worldX - distance * 0.75;
        if (gx > -150 && gx < w + 150) {
          drawToriiGate(gx, waterSurfaceY, 110, gate.scale, false);
        }
      });

      // Character (Monk) floats on the water surface
      ctx.save();
      const mx = w * 0.25;
      const my = waterSurfaceY + Math.sin(time * 0.035) * 8;
      ctx.translate(mx, my);
      ctx.scale(1.2, 1.2);
      ctx.rotate(0.08);

      ctx.fillStyle = PALETTE.ink;
      const swimCycle = time * 0.05;

      ctx.beginPath(); 
      ctx.moveTo(-15, 2); 
      ctx.lineTo(12, 5); 
      ctx.lineTo(16, -18); 
      ctx.lineTo(-12, -18); 
      ctx.fill();

      ctx.beginPath(); 
      ctx.arc(8, -27, 10, 0, Math.PI*2); 
      ctx.fill();

      ctx.strokeStyle = PALETTE.emerald;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4, -22);
      const scarfSway1 = Math.sin(time * 0.08) * 6;
      const scarfSway2 = Math.cos(time * 0.09) * 10;
      ctx.quadraticCurveTo(-30, -14 + scarfSway1, -55, -18 + scarfSway2);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.strokeStyle = PALETTE.ink;
      const kick1 = Math.sin(swimCycle) * 0.48 - 0.2;
      ctx.save();
      ctx.translate(-10, -5);
      ctx.rotate(Math.PI * 0.5 + kick1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
      ctx.restore();

      ctx.lineWidth = 3.5;
      const armAngle = Math.sin(swimCycle) * 0.35 + 0.1;
      ctx.save();
      ctx.translate(5, -12);
      ctx.rotate(armAngle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 10); ctx.stroke();
      ctx.restore();

      ctx.restore(); // end monk
      
      // Water Surface Line (Foam/Ripples on top edge)
      if (waterSurfaceY < h) {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, waterSurfaceY);
        for (let x = 0; x <= w; x += 10) {
           ctx.lineTo(x, waterSurfaceY + Math.sin(time * 0.05 + x * 0.05) * 2);
        }
        ctx.stroke();
      }

      ctx.restore(); // end sky clip

      // Clean Floor (Foreground)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 10) {
        const worldX = distance + x;
        const floorY = groundY + Math.sin(worldX * 0.05) * 3 + Math.cos(worldX * 0.01) * 2;
        ctx.lineTo(x, floorY);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      
      // Ground Highlights (if not fully submerged)
      if (waterSurfaceY > groundY - 20) {
         ctx.strokeStyle = '#334155';
         ctx.lineWidth = 2;
         ctx.beginPath();
         for (let x = 0; x <= w; x += 10) {
            const worldX = distance + x;
            const floorY = groundY + Math.sin(worldX * 0.05) * 3 + Math.cos(worldX * 0.01) * 2;
            if (x === 0) ctx.moveTo(x, floorY);
            else ctx.lineTo(x, floorY);
         }
         ctx.stroke();
      }

      raf = requestAnimationFrame(frame);
    };

    frame();
    return () => cancelAnimationFrame(raf);
  }, [settings.scrollSpeed]);

  return (
    <div className="absolute inset-0 bg-[#020617] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
