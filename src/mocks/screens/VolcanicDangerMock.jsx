import { useEffect, useRef } from 'react';

export const VolcanicDangerMock = () => {
  const canvasRef = useRef(null);

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

    // Ash and Ember particles
    const embers = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000 + 200, // spawn lower down
      size: Math.random() * 3 + 1.5,
      speedX: -(Math.random() * 3 + 3),   // blown left
      speedY: -(Math.random() * 2 + 1),   // rising up
      opacity: Math.random() * 0.8 + 0.2,
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.1 + 0.05
    }));

    const ashFlakes = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000 - 200,
      size: Math.random() * 4 + 2,
      speedX: -(Math.random() * 4 + 6), // blown fast left
      speedY: Math.random() * 2 + 1.5, // falling
      opacity: Math.random() * 0.4 + 0.1,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.04 + 0.02
    }));

    // Generate parallax scorched trees (twisted, bare, tall)
    const generateScorchedTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        worldX: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.2 + 0.85,
        speed
      }));
    };
    const treesFar = generateScorchedTrees(6, 300, 1.0, 260, 120);
    const treesNear = generateScorchedTrees(4, 500, 2.5, 380, 150);

    // Clouds (thick ash plumes)
    const ashClouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 50 + i * 45,
      width: Math.random() * 200 + 150,
      height: 15,
      speed: 0.25 + Math.random() * 0.15
    }));

    // Blinking beast eyes lurking in the volcanic shadows (subtle)
    const beastEyes = Array.from({ length: 4 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 150 + 430, // lower down near ground level
      size: Math.random() * 0.8 + 1.2, // much smaller eyes
      color: '#f97316', // glowing amber-orange
      opacity: 0.35, // starting opacity
      blinkState: 'open',
      blinkTimer: Math.random() * 400 + 300, // blink less frequently
      closedTimer: 0,
      speed: 1.0 // scroll with far trees
    }));

    let raf;
    let time = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // Mathematical ground curves
      const getMidgroundY = (x, scrollOffset) => 
        groundY - 15 + Math.sin((x + scrollOffset) * 0.005) * 15 + Math.cos((x + scrollOffset) * 0.01) * 5;

      const getForegroundY = (x, scrollOffset) => 
        groundY + 12 + Math.sin((x + scrollOffset) * 0.004 + 2.0) * 18;

      // 1. SKY GRADIENT (Volcanic twilight ash sky)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0c0404');   // Pure black-red
      skyGrad.addColorStop(0.4, '#1c0a0a'); 
      skyGrad.addColorStop(0.7, '#3b1111'); // Deep crimson
      skyGrad.addColorStop(1, '#681c1c');   // Burning orange-red horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. SMOKY ASH CLOUDS (Traditional Ukiyo-e bands, but dark and heavy)
      ctx.fillStyle = 'rgba(15, 15, 20, 0.45)'; // Thick dark smoke
      ashClouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.4, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // 3. TOWERING VOLCANO (Mt. Sakurajima / Mt. Aso style)
      const volSize = Math.min(w, h) * 0.6;
      const volX = w * 0.5;
      const volY = groundY - 10;
      
      // Main volcano body (Dark ash silhouette)
      ctx.fillStyle = '#140808';
      ctx.beginPath();
      ctx.moveTo(volX - volSize * 1.8, volY);
      ctx.quadraticCurveTo(volX - volSize * 0.7, volY - volSize * 0.15, volX - volSize * 0.25, volY - volSize * 0.9); 
      ctx.lineTo(volX + volSize * 0.25, volY - volSize * 0.9); // Jagged crater peak
      ctx.quadraticCurveTo(volX + volSize * 0.7, volY - volSize * 0.15, volX + volSize * 1.8, volY);
      ctx.closePath();
      ctx.fill();

      // Glowing lava veins inside the volcano crater/sides
      ctx.strokeStyle = '#ea580c'; // Bright glowing orange
      ctx.lineWidth = 3;
      
      // Draw crater glow
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(volX, volY - volSize * 0.9, volSize * 0.22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lava lines trickling down
      const drawLavaVein = (sx, sy, ex, ey) => {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx+ex)/2 + Math.sin(time*0.02)*10, (sy+ey)/2, ex, ey);
        ctx.stroke();
      };
      drawLavaVein(volX - volSize * 0.1, volY - volSize * 0.9, volX - volSize * 0.3, volY - volSize * 0.5);
      drawLavaVein(volX + volSize * 0.15, volY - volSize * 0.9, volX + volSize * 0.4, volY - volSize * 0.4);

      // Fading volcanic haze
      const haze = ctx.createLinearGradient(0, h * 0.4, 0, h);
      haze.addColorStop(0, 'rgba(104, 28, 28, 0)');
      haze.addColorStop(0.8, 'rgba(104, 28, 28, 0.45)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, h * 0.35, w, h * 0.5);

      // 3.5 LURKING BEAST EYES (Slanted eyes blinking in the smoke/craters)
      beastEyes.forEach(eye => {
        eye.x -= eye.speed;
        if (eye.x < -100) {
          eye.x = w + 100 + Math.random() * 200;
          eye.y = Math.random() * 150 + 430;
        }

        // Blinking state machine
        if (eye.blinkState === 'open') {
          eye.blinkTimer--;
          if (eye.blinkTimer <= 0) {
            eye.blinkState = 'closing';
          }
        } else if (eye.blinkState === 'closing') {
          eye.opacity -= 0.05; // slower blink
          if (eye.opacity <= 0) {
            eye.opacity = 0;
            eye.blinkState = 'closed';
            eye.closedTimer = Math.random() * 150 + 50; // stays closed longer
          }
        } else if (eye.blinkState === 'closed') {
          eye.closedTimer--;
          if (eye.closedTimer <= 0) {
            eye.blinkState = 'opening';
          }
        } else if (eye.blinkState === 'opening') {
          eye.opacity += 0.05;
          if (eye.opacity >= 1) {
            eye.opacity = 1;
            eye.blinkState = 'open';
            eye.blinkTimer = Math.random() * 400 + 300;
          }
        }

        if (eye.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = eye.opacity * 0.35; // Maximum 35% opacity

          // Draw slanted beast-like eyes (wolf/tiger style)
          const drawSlantedEye = (cx, cy, direction) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(direction * 0.3); // Slant rotation
            
            // Soft subtle glow
            const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, eye.size * 2.5);
            glow.addColorStop(0, 'rgba(249, 115, 22, 0.45)'); // Orange core glow
            glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.ellipse(0, 0, eye.size * 2.5, eye.size * 1.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Amber pupil
            ctx.fillStyle = eye.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, eye.size * 1.5, eye.size * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();

            // Slit pupil (vertical black line)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(0, -eye.size * 0.5);
            ctx.lineTo(0, eye.size * 0.5);
            ctx.stroke();

            ctx.restore();
          };

          drawSlantedEye(eye.x - eye.size * 2.5, eye.y, 1);  // Left slanted eye
          drawSlantedEye(eye.x + eye.size * 2.5, eye.y, -1); // Right slanted eye

          ctx.restore();
        }
      });

      // Scorched Tree drawing function (bare trunk, dynamic branches, no leaves)
      const drawScorchedTree = (tx, ty, height, scale, color) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        // Ground anchor mound
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Twisted trunk
        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-20, -height * 0.3, -8, -height * 0.6);
        ctx.quadraticCurveTo(15, -height * 0.8, 0, -height);
        ctx.stroke();

        // Jagged bare branches
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-10, -height * 0.45);
        ctx.lineTo(-35, -height * 0.65);
        ctx.lineTo(-45, -height * 0.6);
        
        ctx.moveTo(6, -height * 0.68);
        ctx.lineTo(32, -height * 0.8);
        ctx.lineTo(42, -height * 0.75);

        ctx.moveTo(-4, -height * 0.85);
        ctx.lineTo(-20, -height * 0.98);
        ctx.stroke();

        ctx.restore();
      };

      // Draw Far Scorched Trees
      treesFar.forEach(t => {
        const loopWidth = w + 400;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        const ty = getMidgroundY(screenX, time * t.speed) - 5;
        drawScorchedTree(screenX, ty, t.height, t.scale * 0.75, '#120505'); // almost pitch black
      });

      // 4. MIDGROUND VOLCANIC GROUND (Scorched earth)
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getMidgroundY(x, time * 1.8));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Pulsing lava veins on midground ground
      ctx.strokeStyle = `rgba(239, 68, 68, ${Math.sin(time * 0.05) * 0.35 + 0.65})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 30) {
        const gy = getMidgroundY(x, time * 1.8);
        if (x === 0) ctx.moveTo(x, gy + 5);
        else ctx.lineTo(x, gy + 5 + Math.sin(x * 0.02 + time * 0.04) * 4);
      }
      ctx.stroke();

      // Draw Near Scorched Trees
      treesNear.forEach(t => {
        const loopWidth = w + 500;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        const ty = getForegroundY(screenX, time * t.speed) - 5;
        drawScorchedTree(screenX, ty, t.height, t.scale * 1.1, '#0a0202');
      });

      // 5. FOREGROUND GROUND (Cracked lava rock)
      ctx.fillStyle = '#080101'; // Deep obsidian black
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getForegroundY(x, time * 3.0));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Glowing cracks in foreground path
      ctx.strokeStyle = `rgba(249, 115, 22, ${Math.sin(time * 0.08) * 0.3 + 0.7})`; // pulsing orange
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        const gy = getForegroundY(x, time * 3.0);
        // Draw zigzag lines representing glowing earth cracks
        if (x === 0) ctx.moveTo(x, gy + 8);
        else ctx.lineTo(x, gy + 8 + (x % 40 === 0 ? 6 : -4));
      }
      ctx.stroke();

      // 6. FLOATING EMBER SPARKS (Pulsing orange dots rising)
      embers.forEach(e => {
        e.x += e.speedX;
        e.y += e.speedY;
        
        // Wrap embers
        if (e.x < -50 || e.y < -50) {
          e.x = w + 100 + Math.random() * 200;
          e.y = h - Math.random() * 300;
        }

        const pulse = Math.sin(time * e.pulseSpeed + e.pulseOffset) * 0.4 + 0.6;
        
        ctx.save();
        const glow = ctx.createRadialGradient(e.x, e.y, 0.5, e.x, e.y, e.size * 3.5 * pulse);
        glow.addColorStop(0, 'rgba(253, 224, 71, 0.95)'); // Yellow core
        glow.addColorStop(0.3, 'rgba(249, 115, 22, 0.7)'); // Orange
        glow.addColorStop(1, 'rgba(239, 68, 68, 0)');      // Red out
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 3.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 7. DRIFTING ASH FLAKES (Grey debris falling fast)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'; // slate-400 ash
      ashFlakes.forEach(a => {
        a.sway += a.swaySpeed;
        a.x += a.speedX + Math.sin(a.sway) * 1.5;
        a.y += a.speedY;

        if (a.x < -50 || a.y > h + 50) {
          a.x = w + 100 + Math.random() * 200;
          a.y = -50 + Math.random() * (h * 0.5);
        }

        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.beginPath();
        // small irregular shape
        ctx.arc(0, 0, a.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 8. FIERY VIGNETTE (Adds intense atmosphere)
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(0.7, 'rgba(120, 10, 10, 0.2)');
      vignette.addColorStop(1, 'rgba(40, 2, 2, 0.75)'); // Burnt/bloody edges
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-stone-950">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};
