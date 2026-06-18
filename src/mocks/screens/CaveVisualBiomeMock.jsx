import { useEffect, useRef } from 'react';
import { PALETTE } from '../../config/constants.js';

export const CaveVisualBiomeMock = ({ state, setState }) => {
  const canvasRef = useRef(null);

  // Default configuration settings
  const settings = {
    scrollSpeed: state.scrollSpeed ?? 1.5,
    forcePhase: state.forcePhase ?? 'auto',
    preludeLen: state.preludeLen ?? 800,
    entranceLen: state.entranceLen ?? 800,
    deepLen: state.deepLen ?? 2800,
    exitLen: state.exitLen ?? 800,
  };

  const CYCLE_LEN = settings.preludeLen + settings.entranceLen + settings.deepLen + settings.exitLen;

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

    // Wisteria
    const wisteria = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * (settings.entranceLen + settings.deepLen + settings.exitLen) + settings.preludeLen - 200,
      length: Math.random() * 80 + 40,
      size: Math.random() * 3 + 2,
      swayOffset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? '#d8b4e2' : '#c084fc',
    }));

    // Spider Lilies
    const lilies = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * (settings.entranceLen + settings.deepLen + settings.exitLen) + settings.preludeLen - 200,
      size: Math.random() * 0.8 + 0.6,
      swayOffset: Math.random() * Math.PI * 2,
    }));

    // Lanterns
    const lanterns = Array.from({ length: 15 }).map(() => ({
      x: Math.random() * settings.deepLen + settings.preludeLen + settings.entranceLen,
      yOffset: Math.random() * 20 + 20, // hanging distance from ceiling
      swayOffset: Math.random() * Math.PI * 2,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    // Glowing Spores
    const spores = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 800,
      size: Math.random() * 2 + 1,
      speedX: -(Math.random() * 0.4 + 0.2), // float left
      speedY: -(Math.random() * 0.5 + 0.1), // drift up
      pulseSpeed: Math.random() * 0.05 + 0.02,
      pulseOffset: Math.random() * Math.PI * 2,
      color: '#fef08a', // warm firefly glow
    }));

    let raf;
    let time = 0;
    let distance = 0;

    const getGroundHeight = (x) => {
      const baseGroundY = 100;
      return baseGroundY + Math.sin(x * 0.005) * 8 + Math.cos(x * 0.015) * 4;
    };

    const getCeilingHeight = (x) => {
      const localX = x % CYCLE_LEN;

      // Prelude
      if (localX < settings.preludeLen) {
        return -300; 
      }

      // Entrance (Sloping down rock shelf)
      const entranceStart = settings.preludeLen;
      if (localX < entranceStart + settings.entranceLen) {
        const p = (localX - entranceStart) / settings.entranceLen;
        // Ease in out cubic for smooth slope
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const targetCeiling = 80 + Math.sin(x * 0.008) * 15 + Math.cos(x * 0.02) * 5;
        return -300 * (1 - ease) + targetCeiling * ease;
      }

      // Deep Cave
      const deepStart = entranceStart + settings.entranceLen;
      if (localX < deepStart + settings.deepLen) {
        return 80 + Math.sin(x * 0.008) * 15 + Math.cos(x * 0.02) * 5;
      }

      // Exit (Sloping up rock shelf)
      const exitStart = deepStart + settings.deepLen;
      const p = (localX - exitStart) / settings.exitLen;
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const targetCeiling = 80 + Math.sin(x * 0.008) * 15 + Math.cos(x * 0.02) * 5;
      return targetCeiling * (1 - ease) + -300 * ease;
    };

    const frame = () => {
      time++;
      distance += settings.scrollSpeed;

      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      let scrollX = distance;
      if (settings.forcePhase === 'prelude') {
        scrollX = distance % settings.preludeLen;
      } else if (settings.forcePhase === 'entrance') {
        scrollX = settings.preludeLen + (distance % settings.entranceLen);
      } else if (settings.forcePhase === 'deep') {
        scrollX = settings.preludeLen + settings.entranceLen + (distance % settings.deepLen);
      } else if (settings.forcePhase === 'exit') {
        scrollX = settings.preludeLen + settings.entranceLen + settings.deepLen + (distance % settings.exitLen);
      }

      const cycleProgX = scrollX % CYCLE_LEN;

      let caveAlpha = 0;
      if (cycleProgX >= settings.preludeLen && cycleProgX < settings.preludeLen + settings.entranceLen) {
        caveAlpha = (cycleProgX - settings.preludeLen) / settings.entranceLen;
      } else if (cycleProgX >= settings.preludeLen + settings.entranceLen && cycleProgX < settings.preludeLen + settings.entranceLen + settings.deepLen) {
        caveAlpha = 1;
      } else if (cycleProgX >= settings.preludeLen + settings.entranceLen + settings.deepLen) {
        caveAlpha = 1 - (cycleProgX - (settings.preludeLen + settings.entranceLen + settings.deepLen)) / settings.exitLen;
      }

      // 1. SKY / BACKGROUND GRADIENT
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      const topColor = `rgba(${Math.round(59 * (1 - caveAlpha) + 2 * caveAlpha)}, ${Math.round(7 * (1 - caveAlpha) + 6 * caveAlpha)}, ${Math.round(100 * (1 - caveAlpha) + 23 * caveAlpha)}, 1)`;
      const midColor = `rgba(${Math.round(194 * (1 - caveAlpha) + 12 * caveAlpha)}, ${Math.round(65 * (1 - caveAlpha) + 10 * caveAlpha)}, ${Math.round(12 * (1 - caveAlpha) + 26 * caveAlpha)}, 1)`;
      const botColor = `rgba(${Math.round(254 * (1 - caveAlpha) + 18 * caveAlpha)}, ${Math.round(240 * (1 - caveAlpha) + 14 * caveAlpha)}, ${Math.round(138 * (1 - caveAlpha) + 46 * caveAlpha)}, 1)`;

      skyGrad.addColorStop(0, topColor);
      skyGrad.addColorStop(0.5, midColor);
      skyGrad.addColorStop(1, botColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. PARALLAX MOUNTAINS & PAGODA
      if (caveAlpha < 0.98) {
        ctx.save();
        ctx.globalAlpha = 1 - caveAlpha;
        
        ctx.fillStyle = '#4c0519'; // rose-950
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) {
          const worldX = scrollX * 0.4 + x;
          const y = groundY - 50 + Math.sin(worldX * 0.003) * 35 + Math.cos(worldX * 0.008) * 12;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        const pagodaX = (w * 0.7 - scrollX * 0.5) % (w + 400);
        const drawPagoda = (px, py, scale) => {
          ctx.fillStyle = '#2d020e';
          ctx.fillRect(px - 15 * scale, py - 40 * scale, 30 * scale, 40 * scale);
          for (let layer = 0; layer < 4; layer++) {
            const ry = py - 10 * layer * scale - 12 * scale;
            ctx.beginPath();
            ctx.moveTo(px - 25 * scale, ry);
            ctx.quadraticCurveTo(px, ry - 6 * scale, px + 25 * scale, ry);
            ctx.lineTo(px + 20 * scale, ry - 5 * scale);
            ctx.lineTo(px - 20 * scale, ry - 5 * scale);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillRect(px - 1.5, py - 60 * scale, 3, 20 * scale);
        };
        if (pagodaX > -50 && pagodaX < w + 50) {
          drawPagoda(pagodaX, groundY - 40, 1.2);
        }
        ctx.restore();
      }

      // 3. DEEP BACKGROUND CAVE ROCK LAYERS
      if (caveAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = caveAlpha;
        
        ctx.fillStyle = '#1c1817';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 15) {
          const worldX = scrollX * 0.5 + x;
          const cHeight = getCeilingHeight(worldX) + 30;
          ctx.lineTo(x, cHeight);
        }
        for (let x = w; x >= 0; x -= 15) {
          const worldX = scrollX * 0.5 + x;
          const gHeight = h - getGroundHeight(worldX) + 20;
          ctx.lineTo(x, gHeight);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 4. DETAILED TERRAIN (Foreground Ceiling & Ground)
      ctx.fillStyle = '#0c0a09';
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2.5;

      const floorPoints = [];
      const ceilPoints = [];

      for (let sx = -20; sx <= w + 40; sx += 10) {
        const worldX = scrollX + sx;
        const gOffset = getGroundHeight(worldX);
        const cOffset = getCeilingHeight(worldX);

        floorPoints.push({ x: sx, y: h - gOffset, worldX });
        ceilPoints.push({ x: sx, y: cOffset, worldX });
      }

      // Draw Ceiling
      if (caveAlpha > 0.01) {
        ctx.save();
        ctx.fillStyle = '#0c0a09';
        ctx.beginPath();
        ctx.moveTo(-20, -300);
        ceilPoints.forEach((pt) => {
          ctx.lineTo(pt.x, pt.y);
        });
        ctx.lineTo(w + 40, -300);
        ctx.closePath();
        ctx.fill();

        // Wisteria
        wisteria.forEach((wist) => {
          const screenX = wist.x - scrollX % CYCLE_LEN;
          if (screenX > -50 && screenX < w + 50) {
            const ceilY = getCeilingHeight(wist.x);
            if (ceilY > -20) {
              ctx.save();
              const sway = Math.sin(time * 0.02 + wist.swayOffset) * 0.15;
              ctx.translate(screenX, ceilY);
              ctx.rotate(sway);
              
              ctx.fillStyle = wist.color;
              ctx.globalAlpha = 0.8;
              
              // Draw hanging blossoms
              for (let i = 0; i < wist.length; i += 8) {
                const wSway = Math.sin(time * 0.03 + wist.swayOffset + i * 0.1) * 2;
                ctx.beginPath();
                const radius = wist.size * (1 - i / wist.length) + 1;
                ctx.arc(wSway, i, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.arc(wSway - radius * 1.2, i + 2, radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.arc(wSway + radius * 1.2, i + 2, radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
          }
        });

        // Lanterns
        lanterns.forEach((lantern) => {
          const screenX = lantern.x - scrollX % CYCLE_LEN;
          if (screenX > -100 && screenX < w + 100) {
            const ceilY = getCeilingHeight(lantern.x);
            if (ceilY > -20) {
              ctx.save();
              const sway = Math.sin(time * 0.015 + lantern.swayOffset) * 0.1;
              ctx.translate(screenX, ceilY);
              ctx.rotate(sway);

              // String
              ctx.strokeStyle = '#44403c';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(0, lantern.yOffset);
              ctx.stroke();

              // Lantern Body
              ctx.translate(0, lantern.yOffset);
              
              const pulse = Math.sin(time * 0.05 + lantern.pulseOffset) * 0.2 + 0.8;
              
              // Glow
              const glow = ctx.createRadialGradient(0, 15, 0.5, 0, 15, 60 * pulse);
              glow.addColorStop(0, 'rgba(251, 146, 60, 0.4)');
              glow.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(0, 15, 60 * pulse, 0, Math.PI * 2);
              ctx.fill();

              // Paper lantern
              ctx.fillStyle = '#fed7aa'; // warm paper
              ctx.strokeStyle = '#ea580c'; // ribs
              ctx.lineWidth = 1;
              
              ctx.beginPath();
              ctx.ellipse(0, 15, 12, 18, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Ribs
              ctx.beginPath();
              ctx.ellipse(0, 15, 6, 18, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Top & Bottom caps
              ctx.fillStyle = '#292524';
              ctx.fillRect(-8, -4, 16, 4);
              ctx.fillRect(-8, 32, 16, 4);

              // Tassel
              ctx.strokeStyle = '#dc2626';
              ctx.beginPath();
              ctx.moveTo(0, 36);
              ctx.lineTo(0, 48);
              ctx.stroke();

              ctx.restore();
            }
          }
        });

        ctx.restore();
      }

      // Draw Main Ground Floor
      ctx.beginPath();
      ctx.moveTo(-30, h + 200);
      floorPoints.forEach((pt) => {
        ctx.lineTo(pt.x, pt.y);
      });
      ctx.lineTo(w + 30, h + 200);
      ctx.closePath();
      ctx.fill();

      // Stone floor highlights
      ctx.beginPath();
      floorPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Spider Lilies (Red)
      lilies.forEach((lily) => {
        const screenX = lily.x - scrollX % CYCLE_LEN;
        if (screenX > -20 && screenX < w + 20) {
          const flrY = h - getGroundHeight(lily.x);
          ctx.save();
          const sway = Math.sin(time * 0.03 + lily.swayOffset) * 0.15;
          ctx.translate(screenX, flrY);
          ctx.rotate(sway);
          ctx.scale(lily.size, lily.size);

          // Stem
          ctx.strokeStyle = '#064e3b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(5, -15, 0, -30);
          ctx.stroke();

          // Petals (Red)
          ctx.translate(0, -30);
          ctx.strokeStyle = '#dc2626'; // bright crimson
          ctx.lineWidth = 1.5;

          // Drawing iconic spidery petals
          for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(10, -10, 20, 0);
            ctx.stroke();
            
            // Stamen
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(15, -15, 25, -5);
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 1.5;
          }

          ctx.restore();
        }
      });

      // 5. GLOWING SPORES
      spores.forEach((s) => {
        s.x += s.speedX + Math.sin(time * 0.02) * 0.1;
        s.y += s.speedY;

        if (s.x < -20) s.x = w + 20;
        if (s.y < -20) s.y = h + 20;

        const pulse = Math.sin(time * s.pulseSpeed + s.pulseOffset) * 0.45 + 0.55;

        ctx.save();
        ctx.globalAlpha = caveAlpha * 0.8;
        
        const glow = ctx.createRadialGradient(s.x, s.y, 0.5, s.x, s.y, s.size * 4 * pulse);
        glow.addColorStop(0, s.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 4 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${pulse})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 6. MONK CHARACTER (Locomotion)
      ctx.save();
      const mx = w * 0.25;
      const monkWorldX = scrollX + mx;
      
      let my = h - getGroundHeight(monkWorldX);

      ctx.translate(mx, my);
      ctx.scale(1.2, 1.2);

      ctx.fillStyle = PALETTE.ink;
      
      const runCycle = time * settings.scrollSpeed * 0.05;
      const bob = Math.sin(runCycle * 2) * 3.5;
      
      // Running Body
      ctx.beginPath(); 
      ctx.moveTo(-10, bob); 
      ctx.lineTo(15, bob); 
      ctx.lineTo(20, -25 + bob); 
      ctx.lineTo(-5, -25 + bob); 
      ctx.fill();

      // Head
      ctx.beginPath(); 
      ctx.arc(10, -35 + bob, 11, 0, Math.PI*2); 
      ctx.fill();

      // Glowing Monk Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(13, -36 + bob, 1.2, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;

      // Emerald Scarf
      const scarfWave = Math.sin(runCycle * 1.5) * 12;
      ctx.beginPath(); 
      ctx.moveTo(0, -30 + bob); 
      ctx.quadraticCurveTo(-25, -20 + scarfWave, -50, -30 - scarfWave);
      ctx.lineWidth = 3; 
      ctx.strokeStyle = PALETTE.emerald; 
      ctx.stroke();

      // Legs
      ctx.lineWidth = 4; 
      ctx.strokeStyle = PALETTE.ink;
      const leg1Angle = Math.sin(runCycle) * 0.75;
      const leg2Angle = Math.sin(runCycle + Math.PI) * 0.75;
      
      ctx.beginPath(); 
      ctx.moveTo(0, bob); 
      ctx.lineTo(Math.sin(leg2Angle) * 14, 14 + Math.cos(leg2Angle) * 8); 
      ctx.stroke();
      
      ctx.beginPath(); 
      ctx.moveTo(5, bob); 
      ctx.lineTo(5 + Math.sin(leg1Angle) * 14, 14 + Math.cos(leg1Angle) * 8); 
      ctx.stroke();

      ctx.restore();

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [state.scrollSpeed, state.forcePhase]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
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
