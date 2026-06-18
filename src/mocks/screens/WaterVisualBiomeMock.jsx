import { useEffect, useRef } from 'react';
import { PALETTE } from '../../config/constants.js';

export const WaterVisualBiomeMock = ({ state, setState }) => {
  const canvasRef = useRef(null);

  // Configuration settings
  const settings = {
    scrollSpeed: state.scrollSpeed ?? 1.5,
    showRays: state.showRays ?? true,
    showKoi: state.showKoi ?? true,
    showBubbles: state.showBubbles ?? true,
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

    // Rising bubbles (ambient)
    const ambientBubbles = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 800 + 100, // initialized relative to bottom 60% later
      size: Math.random() * 4 + 1.5,
      speedY: -(Math.random() * 1.0 + 0.4),
      wobbleSpeed: Math.random() * 0.03 + 0.015,
      wobbleRange: Math.random() * 1.5 + 0.5,
      wobbleOffset: Math.random() * Math.PI * 2,
    }));

    // Bubble trail behind the Monk
    let monkBubbles = [];

    // Swimming Koi fish / carps
    const koiFish = Array.from({ length: 7 }).map((_, i) => ({
      x: Math.random() * 1500 + 400,
      yOffset: Math.random() * 0.4 + 0.1, // percentage of water height
      size: Math.random() * 15 + 18,
      speed: Math.random() * 0.6 + 0.8,
      wiggleSpeed: Math.random() * 0.08 + 0.05,
      wiggleOffset: Math.random() * Math.PI * 2,
      bobRange: Math.random() * 10 + 5,
      color: i % 3 === 0 ? '#ea580c' : (i % 3 === 1 ? '#f97316' : '#ffffff'), // orange, light orange, white
      spotColor: i % 3 === 2 ? '#ef4444' : '#1e293b', // red vs dark spots
    }));

    // Parallax Seaweed / Kelp ribbons
    const generateKelp = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.5),
        height: Math.random() * varH + minH,
        width: Math.random() * 12 + 10,
        speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.012 + 0.005,
      }));
    };
    const kelpFar = generateKelp(12, 160, 0.6, 250, 150);
    const kelpMid = generateKelp(8, 250, 1.4, 350, 180);
    const kelpNear = generateKelp(5, 380, 2.5, 450, 200);

    // Floating cherry blossom petals on water surface
    const petals = Array.from({ length: 15 }).map(() => ({
      x: Math.random() * 1600,
      size: Math.random() * 5 + 4,
      speedX: -(Math.random() * 0.5 + 0.6),
      bobOffset: Math.random() * Math.PI * 2,
    }));

    // Stars
    const stars = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 500, // constrained to sky later
      size: Math.random() * 1.5 + 0.5,
      twinkleSpeed: Math.random() * 0.05 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    let raf;
    let time = 0;
    let distance = 0;

    const frame = () => {
      time++;
      distance += settings.scrollSpeed;

      const w = canvas.width;
      const h = canvas.height;
      
      const skyH = h * 0.4;
      const waterH = h * 0.6;
      const surfaceY = skyH;

      // ===========================
      // 1. SKY PARTITION (0 to h*0.4)
      // ===========================
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, skyH);
      ctx.clip();

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
      skyGrad.addColorStop(0, '#020617'); // dark slate
      skyGrad.addColorStop(0.5, '#0f172a'); // lighter slate
      skyGrad.addColorStop(1, '#1e1b4b'); // deep violet at horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, skyH);

      // Sky Fog / Haze (adds dangerous vibe)
      ctx.save();
      const fogGrad = ctx.createLinearGradient(0, 0, 0, skyH);
      fogGrad.addColorStop(0, 'rgba(28, 25, 23, 0.6)'); // dark stone
      fogGrad.addColorStop(1, 'rgba(63, 63, 70, 0.2)'); // misty zinc
      
      // Animate fog movement with large sine waves
      ctx.fillStyle = fogGrad;
      ctx.beginPath();
      ctx.moveTo(0, skyH);
      for (let x = 0; x <= w; x += 20) {
        const fogY = skyH * 0.2 + Math.sin((x + distance * 0.5) * 0.005) * 80 + Math.cos((x - distance * 0.2) * 0.002) * 40;
        ctx.lineTo(x, fogY);
      }
      ctx.lineTo(w, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Stars
      ctx.fillStyle = '#ffffff';
      stars.forEach(star => {
        if (star.y < skyH) {
          const sx = (star.x - distance * 0.05) % (w + 20);
          const screenX = sx < -20 ? sx + w + 40 : sx;
          const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
          ctx.globalAlpha = twinkle * 0.8; // dimmed by fog
          ctx.beginPath();
          ctx.arc(screenX, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // Red Blood Moon
      const moonX = w * 0.8;
      const moonY = skyH * 0.4;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 150);
      moonGlow.addColorStop(0, 'rgba(220, 38, 38, 0.8)'); // red-600
      moonGlow.addColorStop(0.3, 'rgba(153, 27, 27, 0.2)'); // red-800
      moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fca5a5'; // reddish pale core
      ctx.beginPath();
      ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
      ctx.fill();

      // Mountain Parallax in Sky
      ctx.fillStyle = '#09090b'; // almost black silhouette
      ctx.beginPath();
      ctx.moveTo(0, skyH);
      for (let x = 0; x <= w; x += 10) {
        const worldX = distance * 0.1 + x;
        const y = skyH - 30 + Math.sin(worldX * 0.005) * 20 + Math.cos(worldX * 0.015) * 10;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, skyH);
      ctx.closePath();
      ctx.fill();

      ctx.restore(); // End Sky Partition

      // ===========================
      // 2. WATER PARTITION (h*0.4 to h)
      // ===========================
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, surfaceY, w, waterH);
      ctx.clip();

      // Water Gradient
      const waterGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
      waterGrad.addColorStop(0, '#0c0a1f');   // surface dark indigo
      waterGrad.addColorStop(0.35, '#041d30'); // deep blue-teal
      waterGrad.addColorStop(0.75, '#020f18'); // dark navy
      waterGrad.addColorStop(1, '#01050a');    // deep abyss black
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, surfaceY, w, waterH);

      // Moon reflection on water surface (Reddish)
      const reflectGlow = ctx.createRadialGradient(moonX, surfaceY, 10, moonX, surfaceY, 200);
      reflectGlow.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); // red-500
      reflectGlow.addColorStop(0.5, 'rgba(153, 27, 27, 0.1)'); // red-800
      reflectGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = reflectGlow;
      ctx.beginPath();
      ctx.arc(moonX, surfaceY, 200, 0, Math.PI * 2);
      ctx.fill();

      // MOONBEAMS (Diagonal red rays slicing down-left from surface)
      if (settings.showRays) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.025)'; // faint red
        
        const drawRay = (startX, width, opacityPulse) => {
          ctx.save();
          ctx.globalAlpha = opacityPulse;
          ctx.beginPath();
          ctx.moveTo(startX, surfaceY);
          ctx.lineTo(startX + width, surfaceY);
          ctx.lineTo(startX + width - waterH * 0.45, h);
          ctx.lineTo(startX - waterH * 0.45, h);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        };

        const pulse1 = Math.sin(time * 0.015) * 0.4 + 0.6;
        const pulse2 = Math.sin(time * 0.02 + 2.5) * 0.35 + 0.65;
        const pulse3 = Math.sin(time * 0.008 + 4.1) * 0.45 + 0.55;

        const rayOffset = -(distance * 0.25) % w;

        drawRay(w * 0.2 + rayOffset, 65, pulse1);
        drawRay(w * 0.2 + rayOffset + w, 65, pulse1);

        drawRay(w * 0.55 + rayOffset, 120, pulse2);
        drawRay(w * 0.55 + rayOffset + w, 120, pulse2);

        drawRay(w * 0.8 + rayOffset, 50, pulse3);
        drawRay(w * 0.8 + rayOffset + w, 50, pulse3);

        ctx.restore();
      }

      // SEABED PARALLAX SILHOUETTES
      ctx.save();
      ctx.fillStyle = '#060f1c'; // deep ink blue silhouette
      
      // Seabed ground silhouette
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
      ctx.restore();

      // KELP LAYERS
      const drawKelpLayer = (layer, color, heightMultiplier) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        layer.forEach((k) => {
          k.x -= k.speed * settings.scrollSpeed * 0.35;
          if (k.x < -100) k.x = w + 100 + Math.random() * 50;

          const sway = Math.sin(time * k.swaySpeed + k.swayOffset) * 25;
          const startY = h;
          // limit height to not go above surface
          let targetY = h - k.height * heightMultiplier;
          if (targetY < surfaceY + 20) targetY = surfaceY + 20;

          ctx.beginPath();
          ctx.moveTo(k.x - k.width * 0.5, startY);
          ctx.quadraticCurveTo(k.x + sway * 0.5, startY - k.height * 0.5, k.x + sway, targetY);
          ctx.lineTo(k.x + sway + k.width, targetY);
          ctx.quadraticCurveTo(k.x + sway * 0.5 + k.width, startY - k.height * 0.5, k.x + k.width * 0.5, startY);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      };
      
      drawKelpLayer(kelpFar, '#022c22', 0.8);

      // KOI FISH
      if (settings.showKoi) {
        ctx.save();
        koiFish.forEach((k) => {
          k.x -= (k.speed + settings.scrollSpeed * 0.4);
          if (k.x < -150) {
            k.x = w + 150 + Math.random() * 300;
          }

          // constrain Y to water partition
          const fishY = surfaceY + waterH * k.yOffset;

          const wiggle = Math.sin(time * k.wiggleSpeed + k.wiggleOffset);
          const bob = Math.sin(time * 0.02 + k.wiggleOffset) * k.bobRange;

          ctx.save();
          ctx.translate(k.x, fishY + bob);
          
          ctx.fillStyle = 'rgba(1, 15, 20, 0.12)';
          ctx.save();
          ctx.translate(-5, 20);
          ctx.scale(1, 0.4);
          ctx.beginPath();
          ctx.ellipse(0, 0, k.size, k.size * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = k.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, k.size, k.size * 0.36, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = k.spotColor;
          ctx.beginPath();
          ctx.arc(-k.size * 0.3, -k.size * 0.15, k.size * 0.18, 0, Math.PI*2);
          ctx.arc(k.size * 0.1, k.size * 0.1, k.size * 0.14, 0, Math.PI*2);
          ctx.arc(-k.size * 0.05, -k.size * 0.18, k.size * 0.1, 0, Math.PI*2);
          ctx.fill();

          ctx.fillStyle = k.color;
          ctx.beginPath();
          const tx = -k.size;
          ctx.moveTo(tx, 0);
          ctx.quadraticCurveTo(tx - k.size * 0.4, -k.size * 0.3 + wiggle * 8, tx - k.size * 0.8, -k.size * 0.5 + wiggle * 10);
          ctx.lineTo(tx - k.size * 0.65, wiggle * 4);
          ctx.lineTo(tx - k.size * 0.8, k.size * 0.5 + wiggle * 10);
          ctx.quadraticCurveTo(tx - k.size * 0.4, k.size * 0.3 + wiggle * 8, tx, 0);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(k.size * 0.2, -k.size * 0.2);
          ctx.quadraticCurveTo(k.size * 0.1, -k.size * 0.6, -k.size * 0.2, -k.size * 0.55);
          ctx.quadraticCurveTo(0, -k.size * 0.3, k.size * 0.2, -k.size * 0.2);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(k.size * 0.2, k.size * 0.2);
          ctx.quadraticCurveTo(k.size * 0.1, k.size * 0.6, -k.size * 0.2, k.size * 0.55);
          ctx.quadraticCurveTo(0, k.size * 0.3, k.size * 0.2, k.size * 0.2);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(k.size * 0.72, -k.size * 0.16, 2, 0, Math.PI*2);
          ctx.arc(k.size * 0.72, k.size * 0.16, 2, 0, Math.PI*2);
          ctx.fill();

          ctx.restore();
        });
        ctx.restore();
      }

      drawKelpLayer(kelpMid, '#044e37', 0.95);

      // SWIMMING MONK CHARACTER (At the surface)
      ctx.save();
      const mx = w * 0.25;
      const my = surfaceY + Math.sin(time * 0.035) * 8;
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
      const kick2 = Math.sin(swimCycle + Math.PI) * 0.48 - 0.2;

      ctx.save();
      ctx.translate(-10, -5);
      ctx.rotate(Math.PI * 0.5 + kick1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
      ctx.translate(0, 16);
      ctx.rotate(-0.3 + Math.abs(kick1) * 0.4);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(-6, -8);
      ctx.rotate(Math.PI * 0.5 + kick2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
      ctx.translate(0, 16);
      ctx.rotate(-0.3 + Math.abs(kick2) * 0.4);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
      ctx.restore();

      ctx.lineWidth = 3.5;
      const armAngle = Math.sin(swimCycle) * 0.35 + 0.1;
      ctx.save();
      ctx.translate(5, -12);
      ctx.rotate(armAngle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 10); ctx.stroke();
      ctx.restore();

      ctx.restore();

      // Spawn Monk Bubbles
      if (settings.showBubbles && time % 6 === 0) {
        monkBubbles.push({
          x: mx - 15,
          y: my - 12,
          size: Math.random() * 2.2 + 1,
          speedX: -(Math.random() * 1.5 + 2.5),
          speedY: -(Math.random() * 0.8 + 0.3),
          wobbleOffset: Math.random() * Math.PI * 2,
          opacity: 0.85,
        });
      }

      if (settings.showBubbles) {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = monkBubbles.length - 1; i >= 0; i--) {
          const mb = monkBubbles[i];
          mb.x += mb.speedX;
          mb.y += mb.speedY + Math.sin(time * 0.08 + mb.wobbleOffset) * 0.6;
          mb.opacity -= 0.016;

          if (mb.opacity <= 0 || mb.x < -20 || mb.y < surfaceY) {
            monkBubbles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = mb.opacity;
          ctx.beginPath();
          ctx.arc(mb.x, mb.y, mb.size, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mb.x - mb.size * 0.3, mb.y - mb.size * 0.3, mb.size * 0.15, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
      }

      drawKelpLayer(kelpNear, '#022c22', 1.15);

      if (settings.showBubbles) {
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.38)';
        ctx.lineWidth = 1.2;

        ambientBubbles.forEach((b) => {
          b.y += b.speedY;
          const wobble = Math.sin(time * b.wobbleSpeed + b.wobbleOffset) * b.wobbleRange;
          
          if (b.y < surfaceY) {
            b.y = h + Math.random() * 100;
            b.x = Math.random() * w;
          }

          const bx = b.x + wobble;

          ctx.beginPath();
          ctx.arc(bx, b.y, b.size, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.arc(bx - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.18, 0, Math.PI*2);
          ctx.fill();
        });
        ctx.restore();
      }

      // VIGNETTE UNDERWATER
      const vignette = ctx.createRadialGradient(w/2, surfaceY + waterH/2, waterH*0.2, w/2, surfaceY + waterH/2, waterH*0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.62)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, surfaceY, w, waterH);

      ctx.restore(); // End Water Partition

      // ===========================
      // 3. SURFACE LAYER (petals, dividing line)
      // ===========================
      
      // Floating petals on water surface
      ctx.save();
      ctx.fillStyle = '#f472b6'; // pink sakura
      petals.forEach((p) => {
        p.x += p.speedX;
        if (p.x < -30) p.x = w + 30;

        const bobY = surfaceY + Math.sin(time * 0.04 + p.bobOffset) * 4;
        
        ctx.save();
        ctx.translate(p.x, bobY);
        ctx.rotate(Math.sin(time * 0.02) * 0.25);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Little water ripple under petal
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.ellipse(p.x, bobY + 2, p.size * 1.5, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [settings.scrollSpeed, settings.showRays, settings.showKoi, settings.showBubbles]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#020617' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
