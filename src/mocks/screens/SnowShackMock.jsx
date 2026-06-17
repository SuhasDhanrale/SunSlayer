import { useEffect, useRef } from 'react';

export const SnowShackMock = () => {
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

    // Initialize snow particles
    const snowflakes = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * 2000 - 400,
      y: Math.random() * 1000,
      radius: Math.random() * 4 + 1.5,
      density: Math.random() * 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
      speedY: Math.random() * 1.5 + 1.5
    }));

    // Generate seamless organic mountain ridges using wave functions
    const generateMountainRidge = (pointsCount, spacing, amp, freq, baseHeight) => {
      const points = [];
      let totalWidth = pointsCount * spacing;
      for (let i = 0; i <= pointsCount; i++) {
        const x = i * spacing;
        // Combine multiple sine waves for rugged mountain peaks
        const y = baseHeight + 
                  Math.sin(i * freq) * amp + 
                  Math.sin(i * freq * 2.3) * (amp * 0.4) + 
                  Math.cos(i * freq * 0.5) * (amp * 0.6);
        points.push({ x, y });
      }
      // Guarantee seamless looping by forcing the last point to match the first
      points[points.length - 1].y = points[0].y;
      return { points, totalWidth };
    };

    // Define ridges
    const ridgeFar = generateMountainRidge(30, 80, 70, 0.45, 450); // Distant gray hills
    const ridgeMid = generateMountainRidge(30, 60, 50, 0.6, 520);  // Fading midground ridge

    // Japanese Clouds (Parallax coordinates)
    const clouds = Array.from({ length: 5 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 80 + i * 50,
      width: Math.random() * 150 + 120,
      height: 14,
      speed: 0.15 + Math.random() * 0.1
    }));

    // Trees (Matsu/Pine style)
    const generatePineTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.15 + 0.85,
        speed
      }));
    };
    const pineTreesFar = generatePineTrees(8, 280, 1.2, 250, 120);   // 250 - 370 height
    const pineTreesNear = generatePineTrees(5, 420, 2.5, 360, 160);  // 360 - 520 height

    // Wooden Shacks (Minka style)
    const generateShacks = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.3),
        width: Math.random() * 30 + 100,
        height: Math.random() * 20 + 70,
        hasLight: Math.random() > 0.25,
        speed
      }));
    };
    const shacksFar = generateShacks(5, 380, 1.2);
    const shacksNear = generateShacks(4, 550, 2.5);

    let raf;
    let time = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // 1. SKY GRADIENT (Indigo winter twilight)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0d1a'); // Dark ink sky
      skyGrad.addColorStop(0.4, '#12172b'); 
      skyGrad.addColorStop(0.8, '#1b2341'); // Deep twilight
      skyGrad.addColorStop(1, '#2c365d');   // Soft indigo haze at ground
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. JAPANESE RED SUN (Slightly dimmed / misty version for winter)
      ctx.save();
      ctx.fillStyle = '#b91c1c'; // Moody deep red
      ctx.beginPath();
      // Stationary sun in center
      ctx.arc(w * 0.5, h * 0.35, Math.min(w, h) * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. JAPANESE CLOUDS (Traditional Ukiyo-e bands)
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // 4. DISTANT MT. FUJI (Static / Very slow scroll)
      const fujiSize = Math.min(w, h) * 0.45;
      const fujiX = w * 0.5;
      const fujiY = groundY - 40;
      
      // Fuji base body
      ctx.fillStyle = '#181e36'; // Dark ink silhouette
      ctx.beginPath();
      ctx.moveTo(fujiX - fujiSize * 2.0, fujiY);
      ctx.quadraticCurveTo(fujiX - fujiSize * 0.7, fujiY - fujiSize * 0.2, fujiX - fujiSize * 0.3, fujiY - fujiSize); 
      ctx.lineTo(fujiX + fujiSize * 0.3, fujiY - fujiSize); // Flat top peak
      ctx.quadraticCurveTo(fujiX + fujiSize * 0.7, fujiY - fujiSize * 0.2, fujiX + fujiSize * 2.0, fujiY);
      ctx.closePath();
      ctx.fill();

      // Fuji snow cap
      ctx.fillStyle = '#e2e8f0'; // Off-white snow
      ctx.beginPath();
      ctx.moveTo(fujiX - fujiSize * 0.3, fujiY - fujiSize);
      ctx.lineTo(fujiX + fujiSize * 0.3, fujiY - fujiSize);
      ctx.quadraticCurveTo(fujiX + fujiSize * 0.42, fujiY - fujiSize * 0.79, fujiX + fujiSize * 0.6, fujiY - fujiSize * 0.7);
      // Detailed snow-line curves
      ctx.lineTo(fujiX + fujiSize * 0.3, fujiY - fujiSize * 0.75);
      ctx.lineTo(fujiX + fujiSize * 0.15, fujiY - fujiSize * 0.85);
      ctx.lineTo(fujiX, fujiY - fujiSize * 0.68);
      ctx.lineTo(fujiX - fujiSize * 0.15, fujiY - fujiSize * 0.82);
      ctx.lineTo(fujiX - fujiSize * 0.3, fujiY - fujiSize * 0.72);
      ctx.quadraticCurveTo(fujiX - fujiSize * 0.42, fujiY - fujiSize * 0.79, fujiX - fujiSize * 0.3, fujiY - fujiSize);
      ctx.closePath();
      ctx.fill();

      // 5. PARALLAX FADING MOUNTAINS (Ink-wash Sumi-e look)
      const drawFadingRidge = (ridge, colorTop, colorBottom, scrollSpeed, yOffset) => {
        ctx.save();
        const offset = (time * scrollSpeed) % ridge.totalWidth;
        
        // Linear gradient to make mountains fade gracefully towards the bottom
        const mGradient = ctx.createLinearGradient(0, yOffset - 80, 0, h);
        mGradient.addColorStop(0, colorTop);
        mGradient.addColorStop(0.65, colorBottom);
        ctx.fillStyle = mGradient;
        
        ctx.beginPath();
        ctx.moveTo(0, h);
        
        let drawnX = -offset;
        for (let loop = 0; loop < 2; loop++) {
          for (let i = 0; i < ridge.points.length; i++) {
            const p = ridge.points[i];
            ctx.lineTo(drawnX + p.x, p.y + yOffset);
          }
          drawnX += ridge.totalWidth;
        }
        
        ctx.lineTo(drawnX, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      // Far ridge (Very slow, highly faded grey-indigo)
      drawFadingRidge(ridgeFar, '#2d334e', 'rgba(44, 54, 93, 0.4)', 0.35, -40);

      // Soft fog layer between distant mountains
      const midFog = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.8);
      midFog.addColorStop(0, 'rgba(44, 54, 93, 0)');
      midFog.addColorStop(1, 'rgba(44, 54, 93, 0.5)');
      ctx.fillStyle = midFog;
      ctx.fillRect(0, h * 0.5, w, h * 0.35);

      // Mid ridge (Slightly faster, darker slate blue-grey, fading out at base)
      drawFadingRidge(ridgeMid, '#21273d', 'rgba(27, 35, 65, 0.5)', 0.7, 0);

      // NEW: Midground Snow Plane (so the far shacks have a solid ground behind them)
      ctx.fillStyle = '#b8c6dc'; // Slate blue/gray snow shadow
      ctx.fillRect(0, groundY - 15, w, h - (groundY - 15));
      ctx.fillStyle = '#e2eaf5'; // Light snow top highlight for midground
      ctx.fillRect(0, groundY - 18, w, 3);

      // 6. FAR SCENERY (Shacks & Pines scrolling slowly)
      const drawPineTree = (tx, ty, height, scale) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        // Draw a small snow mound under the tree base to anchor it
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Curved trunk
        ctx.strokeStyle = '#181726';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -height * 0.3, -5, -height * 0.65);
        ctx.quadraticCurveTo(12, -height * 0.85, 0, -height);
        ctx.stroke();

        // Branch clusters (proportional to height)
        const drawBranchCluster = (bx, by, size) => {
          // Dark foliage base
          ctx.fillStyle = '#101426';
          ctx.beginPath();
          ctx.ellipse(bx, by, size, size * 0.45, -0.1, 0, Math.PI * 2);
          ctx.fill();

          // Snow cap on branch
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(bx, by - size * 0.1, size * 0.95, size * 0.25, -0.1, Math.PI, Math.PI * 2);
          ctx.fill();
        };

        drawBranchCluster(-15, -height * 0.6, 28);
        drawBranchCluster(15, -height * 0.78, 24);
        drawBranchCluster(0, -height, 34);

        ctx.restore();
      };

      const drawDetailedShack = (sx, sy, width, height, hasLight) => {
        ctx.save();

        // Draw an anchoring snow mound under the stilts
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx, sy, width * 0.55, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden Stilts & Floor base
        ctx.fillStyle = '#181210';
        ctx.fillRect(sx - width * 0.45, sy - 8, width * 0.9, 8);
        ctx.fillRect(sx - width * 0.38, sy, 5, 8);
        ctx.fillRect(sx - width * 0.15, sy, 5, 8);
        ctx.fillRect(sx + width * 0.15, sy, 5, 8);
        ctx.fillRect(sx + width * 0.38, sy, 5, 8);

        // Wall construction
        ctx.fillStyle = '#261b17';
        ctx.fillRect(sx - width * 0.4, sy - height, width * 0.8, height - 8);

        // Wooden plank textures (vertical lines)
        ctx.strokeStyle = '#140e0c';
        ctx.lineWidth = 1;
        for (let xPos = sx - width * 0.35; xPos < sx + width * 0.35; xPos += 10) {
          ctx.beginPath();
          ctx.moveTo(xPos, sy - height + 4);
          ctx.lineTo(xPos, sy - 8);
          ctx.stroke();
        }

        // Shoji Sliding Door (Paper screen doors)
        const doorW = width * 0.28;
        const doorH = height * 0.55;
        const doorY = sy - doorH - 8;

        const drawShoji = (dx) => {
          ctx.fillStyle = '#e2e8f0'; // Paper white
          ctx.fillRect(dx, doorY, doorW, doorH);
          ctx.strokeStyle = '#181210';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(dx, doorY, doorW, doorH);
          // Shoji Grids
          ctx.beginPath();
          ctx.moveTo(dx + doorW / 2, doorY);
          ctx.lineTo(dx + doorW / 2, doorY + doorH);
          ctx.moveTo(dx, doorY + doorH * 0.33);
          ctx.lineTo(dx + doorW, doorY + doorH * 0.33);
          ctx.moveTo(dx, doorY + doorH * 0.66);
          ctx.lineTo(dx + doorW, doorY + doorH * 0.66);
          ctx.stroke();
        };

        if (hasLight) {
          // Warm interior candle glow emanating behind doors
          const glow = ctx.createRadialGradient(sx, doorY + doorH / 2, 2, sx, doorY + doorH / 2, doorW * 1.6);
          glow.addColorStop(0, 'rgba(249, 115, 22, 0.6)'); // Warm orange
          glow.addColorStop(0.6, 'rgba(249, 115, 22, 0.25)');
          glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(sx - width * 0.4, doorY - 10, width * 0.8, doorH + 18);
        }

        drawShoji(sx - doorW - 2);
        drawShoji(sx + 2);

        // Traditional gabled roof (Curved sloped)
        ctx.fillStyle = '#1c1512';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.54, sy - height);
        ctx.quadraticCurveTo(sx, sy - height - 12, sx + width * 0.54, sy - height);
        ctx.lineTo(sx + width * 0.45, sy - height - 8);
        ctx.quadraticCurveTo(sx, sy - height - 20, sx - width * 0.45, sy - height - 8);
        ctx.closePath();
        ctx.fill();

        // Heavy thatched roof structure
        ctx.fillStyle = '#1e1411';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.5, sy - height - 6);
        ctx.quadraticCurveTo(sx - width * 0.3, sy - height - 22, sx, sy - height - 32);
        ctx.quadraticCurveTo(sx + width * 0.3, sy - height - 22, sx + width * 0.5, sy - height - 6);
        ctx.quadraticCurveTo(sx + width * 0.35, sy - height - 18, sx, sy - height - 25);
        ctx.quadraticCurveTo(sx - width * 0.35, sy - height - 18, sx - width * 0.5, sy - height - 6);
        ctx.closePath();
        ctx.fill();

        // Thick snow load piled on top of the roof
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.52, sy - height - 9);
        ctx.quadraticCurveTo(sx - width * 0.3, sy - height - 26, sx, sy - height - 36);
        ctx.quadraticCurveTo(sx + width * 0.3, sy - height - 26, sx + width * 0.52, sy - height - 9);
        ctx.quadraticCurveTo(sx + width * 0.3, sy - height - 18, sx, sy - height - 27);
        ctx.quadraticCurveTo(sx - width * 0.3, sy - height - 18, sx - width * 0.52, sy - height - 9);
        ctx.closePath();
        ctx.fill();

        // Small snow tufts dripping off eaves
        ctx.beginPath();
        ctx.arc(sx - width * 0.28, sy - height - 13, 5, 0, Math.PI * 2);
        ctx.arc(sx + 5, sy - height - 23, 7, 0, Math.PI * 2);
        ctx.arc(sx + width * 0.32, sy - height - 11, 4, 0, Math.PI * 2);
        ctx.fill();

        // Hanging Chochin (Japanese Lantern)
        if (hasLight) {
          const lX = sx - width * 0.32;
          const lY = sy - height + 8;
          const lW = 8;
          const lH = 14;

          // Wire
          ctx.strokeStyle = '#181210';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lX, lY - 6);
          ctx.lineTo(lX, lY);
          ctx.stroke();

          // Radial lantern glow
          const lGlow = ctx.createRadialGradient(lX, lY + lH / 2, 2, lX, lY + lH / 2, 25);
          lGlow.addColorStop(0, 'rgba(239, 68, 68, 0.85)'); // Red center
          lGlow.addColorStop(0.3, 'rgba(249, 115, 22, 0.5)'); // Orange
          lGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = lGlow;
          ctx.beginPath();
          ctx.arc(lX, lY + lH / 2, 22, 0, Math.PI * 2);
          ctx.fill();

          // Lantern body
          ctx.fillStyle = '#dc2626'; // Bright Ukiyo-e Red
          ctx.beginPath();
          ctx.ellipse(lX, lY + lH / 2, lW, lH / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Top/bottom dark wood caps
          ctx.fillStyle = '#181210';
          ctx.fillRect(lX - lW * 0.65, lY, lW * 1.3, 2);
          ctx.fillRect(lX - lW * 0.65, lY + lH - 2, lW * 1.3, 2);
        }

        ctx.restore();
      };

      // Draw Far Scenery (Pines & Shacks scrolling slowly)
      pineTreesFar.forEach(t => {
        t.x -= t.speed;
        if (t.x < -100) t.x = w + 100 + Math.random() * 80;
        drawPineTree(t.x, groundY - 15, t.height, t.scale * 0.7);
      });

      shacksFar.forEach(s => {
        s.x -= s.speed;
        if (s.x < -s.width) s.x = w + 100 + Math.random() * 120;
        drawDetailedShack(s.x, groundY - 15, s.width * 0.85, s.height * 0.85, s.hasLight);
      });

      // Ambient Fog between background and foreground shacks
      const foregroundFog = ctx.createLinearGradient(0, groundY - 40, 0, groundY + 30);
      foregroundFog.addColorStop(0, 'rgba(44, 54, 93, 0)');
      foregroundFog.addColorStop(0.7, 'rgba(44, 54, 93, 0.35)');
      foregroundFog.addColorStop(1, 'rgba(44, 54, 93, 0.1)');
      ctx.fillStyle = foregroundFog;
      ctx.fillRect(0, groundY - 50, w, 100);

      // 7. NEAR SCENERY (Shacks & Pines scrolling faster)
      pineTreesNear.forEach(t => {
        t.x -= t.speed;
        if (t.x < -120) t.x = w + 120 + Math.random() * 100;
        drawPineTree(t.x, groundY + 5, t.height, t.scale * 1.05);
      });

      shacksNear.forEach(s => {
        s.x -= s.speed;
        if (s.x < -s.width) s.x = w + 100 + Math.random() * 150;
        drawDetailedShack(s.x, groundY + 15, s.width, s.height, s.hasLight);
      });

      // 8. FOREGROUND SNOW GROUND (Curved overlay)
      ctx.fillStyle = '#c5d2e8'; // Shaded blue-gray snow
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(w * 0.25, groundY - 15, w * 0.5, groundY + 5);
      ctx.quadraticCurveTo(w * 0.75, groundY + 20, w, groundY);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Top pure white crisp snow cap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 6);
      ctx.quadraticCurveTo(w * 0.25, groundY - 8, w * 0.5, groundY + 11);
      ctx.quadraticCurveTo(w * 0.75, groundY + 25, w, groundY + 7);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // 9. TRADITIONAL JAPANESE SNOWFLAKES (Varying blurs and shapes)
      snowflakes.forEach(f => {
        f.sway += f.swaySpeed;
        f.x += Math.sin(f.sway) * 0.6 - 0.7; // Wind blowing left
        f.y += f.speedY;

        // Wrap particles
        if (f.y > h + 10 || f.x < -20 || f.x > w + 20) {
          f.y = -20;
          f.x = Math.random() * (w + 40) - 20;
        }

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        
        // Simulating depth with transparency on larger snowflakes
        if (f.radius > 3.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity * 0.55})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        }
        
        ctx.fill();
      });

      // 10. VIGNETTE OVERLAY
      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(10, 13, 26, 0.45)');
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
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};
