import { useEffect, useRef } from 'react';

export const MountainSakuraMock = () => {
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

    // Sakura particles
    const petals = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * 2500 - 500,
      y: Math.random() * 1500 - 500,
      size: Math.random() * 6 + 4,
      speedX: Math.random() * 2.5 + 3.5, // wind blowing left
      speedY: Math.random() * 1.5 + 1.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.03 + 0.015
    }));

    // Generate seamless organic mountain ridges using wave functions
    const generateMountainRidge = (pointsCount, spacing, amp, freq, baseHeight) => {
      const points = [];
      let totalWidth = pointsCount * spacing;
      for (let i = 0; i <= pointsCount; i++) {
        const x = i * spacing;
        const y = baseHeight + 
                  Math.sin(i * freq) * amp + 
                  Math.sin(i * freq * 2.1) * (amp * 0.35) + 
                  Math.cos(i * freq * 0.4) * (amp * 0.5);
        points.push({ x, y });
      }
      points[points.length - 1].y = points[0].y;
      return { points, totalWidth };
    };

    // Define ridges
    const ridgeFar = generateMountainRidge(30, 80, 80, 0.45, 460); // Distant hills
    const ridgeMid = generateMountainRidge(30, 60, 50, 0.6, 520);  // Fading midground ridge

    // Japanese Clouds (Parallax coordinates)
    const clouds = Array.from({ length: 5 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 70 + i * 50,
      width: Math.random() * 160 + 110,
      height: 12,
      speed: 0.15 + Math.random() * 0.1
    }));

    // Overhead scrolling branches (spawns at top, scrolls fast in foreground)
    const generateOverheadBranches = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.3),
        scale: Math.random() * 0.2 + 0.8,
        type: i % 3, // 3 different types of branch designs
        speed
      }));
    };
    const overheadBranches = generateOverheadBranches(4, 550, 4.0); // fast foreground speed

    // Tree coordinates (World space, will wrap)
    const generateTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        worldX: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.2 + 0.8,
        speed
      }));
    };
    // Three layers of trees for deep parallax scroll
    const treesFar = generateTrees(6, 350, 0.9, 280, 100);  // Background (slow)
    const treesMid = generateTrees(5, 450, 1.8, 200, 70);   // Midground (medium)
    const treesNear = generateTrees(3, 700, 3.0, 320, 100);  // Foreground (fast)

    let raf;
    let time = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // Mathematical ground curves (scrolls with time * speed)
      const getFarGroundY = (x, scrollOffset) => 
        groundY - 35 + Math.sin((x + scrollOffset) * 0.002) * 12;

      const getMidgroundY = (x, scrollOffset) => 
        groundY - 15 + Math.sin((x + scrollOffset) * 0.004) * 18 + Math.cos((x + scrollOffset) * 0.008) * 6;

      const getForegroundY = (x, scrollOffset) => 
        groundY + 12 + Math.sin((x + scrollOffset) * 0.003 + 1.2) * 22;

      // 1. SKY GRADIENT (Almost pitch black-purple)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#040108');      // Almost pitch black-purple
      skyGrad.addColorStop(0.4, '#0f071a');    // Deep midnight violet
      skyGrad.addColorStop(0.8, '#200a26');    // Menacing dark magenta
      skyGrad.addColorStop(1, '#380e21');      // Deep maroon horizon glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. JAPANESE BLOOD MOON (Red moon with red glow)
      ctx.save();
      const moonGlow = ctx.createRadialGradient(w * 0.5, h * 0.38, 10, w * 0.5, h * 0.38, Math.min(w, h) * 0.45);
      moonGlow.addColorStop(0, 'rgba(239, 68, 68, 0.95)'); // Bright blood-red center glow
      moonGlow.addColorStop(0.35, 'rgba(185, 28, 28, 0.55)'); // Mid-red ring
      moonGlow.addColorStop(0.7, 'rgba(127, 29, 29, 0.15)'); // Fading dark red haze
      moonGlow.addColorStop(1, 'rgba(127, 29, 29, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, Math.min(w, h) * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#b91c1c'; // Solid deep red moon core
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. JAPANESE CLOUDS (Traditional Ukiyo-e bands)
      ctx.fillStyle = 'rgba(220, 38, 38, 0.05)'; // Blood-red tinted clouds
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // 4. PARALLAX FADING MOUNTAINS (Ink-wash Sumi-e look)
      const drawFadingRidge = (ridge, colorTop, colorBottom, scrollSpeed, yOffset) => {
        ctx.save();
        const offset = (time * scrollSpeed) % ridge.totalWidth;
        
        // Linear gradient to make mountains fade gracefully towards the bottom
        const mGradient = ctx.createLinearGradient(0, yOffset - 80, 0, h);
        mGradient.addColorStop(0, colorTop);
        mGradient.addColorStop(0.7, colorBottom);
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

      // Far ridge (Very slow, highly faded grey-pink)
      drawFadingRidge(ridgeFar, '#160a16', 'rgba(24, 10, 24, 0.45)', 0.3, -30);

      // Soft fog layer between distant mountains
      const midFog = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.8);
      midFog.addColorStop(0, 'rgba(24, 10, 24, 0)');
      midFog.addColorStop(1, 'rgba(40, 15, 30, 0.5)');
      ctx.fillStyle = midFog;
      ctx.fillRect(0, h * 0.45, w, h * 0.35);

      // Mid ridge (Slightly faster, darker slate-grey, fading out at base)
      drawFadingRidge(ridgeMid, '#0e050e', 'rgba(15, 5, 15, 0.55)', 0.7, 10);

      // 5. FAR BACKGROUND GROUND
      ctx.fillStyle = '#140c15';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 15) {
        ctx.lineTo(x, getFarGroundY(x, time * 0.9));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Sakura Tree rendering function (adaptive to terrain height and color)
      const drawSakuraTree = (tx, ty, height, scale, trunkColor, leafColorBase, leafColorHighlight, moundColor) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        // Ground anchor mound under tree so it never floats
        ctx.fillStyle = moundColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Curved trunk
        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -height * 0.3, -5, -height * 0.65);
        ctx.quadraticCurveTo(10, -height * 0.85, 0, -height);
        ctx.stroke();

        // Branch splits
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(-8, -height * 0.45);
        ctx.quadraticCurveTo(-22, -height * 0.6, -26, -height * 0.78);
        ctx.moveTo(4, -height * 0.72);
        ctx.quadraticCurveTo(18, -height * 0.85, 22, -height * 0.95);
        ctx.stroke();

        // Soft pink sakura foliage clusters
        const drawSakuraCluster = (bx, by, size) => {
          ctx.fillStyle = leafColorBase;
          ctx.beginPath();
          ctx.arc(bx, by, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = leafColorHighlight;
          ctx.beginPath();
          ctx.arc(bx - size * 0.22, by - size * 0.22, size * 0.68, 0, Math.PI * 2);
          ctx.fill();
        };

        drawSakuraCluster(-26, -height * 0.78, 22);
        drawSakuraCluster(22, -height * 0.95, 17);
        drawSakuraCluster(0, -height, 28);

        ctx.restore();
      };

      // Draw Far Sakura Trees (standing on far ground)
      treesFar.forEach(t => {
        const loopWidth = w + 400;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        // Grounded dynamically
        const ty = getFarGroundY(screenX, time * t.speed);
        drawSakuraTree(
          screenX, 
          ty, 
          t.height, 
          t.scale * 0.75, 
          '#1e1420', // dark slate purple trunk
          'rgba(185, 28, 28, 0.35)', // blood-red tinted
          'rgba(244, 63, 94, 0.55)', // pinkish-red glow
          '#140c15'
        );
      });

      // 6. MIDGROUND GROUND (anchors midground trees)
      ctx.fillStyle = '#0a060b';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getMidgroundY(x, time * 1.8));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Draw Midground Sakura Trees (standing on midground curve)
      treesMid.forEach(t => {
        const loopWidth = w + 400;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        const ty = getMidgroundY(screenX, time * t.speed);
        drawSakuraTree(
          screenX, 
          ty, 
          t.height, 
          t.scale * 0.9, 
          '#0d080f', // darker trunk
          'rgba(220, 38, 38, 0.75)', // richer red
          'rgba(251, 113, 133, 0.85)',
          '#0a060b'
        );
      });

      // Draw Near Sakura Trees (standing on foreground ground, drawn behind ground overlay)
      treesNear.forEach(t => {
        const loopWidth = w + 500;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        const ty = getForegroundY(screenX, time * t.speed);
        drawSakuraTree(
          screenX, 
          ty, 
          t.height, 
          t.scale * 1.15, 
          '#050306', // dark slate trunk
          'rgba(153, 27, 27, 0.85)', // deep red base
          'rgba(225, 29, 72, 0.95)', // vibrant red highlight
          '#050306'
        );
      });

      // 7. FOREGROUND GROUND OVERLAY
      ctx.fillStyle = '#050306';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getForegroundY(x, time * 3.0));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 8. FOREGROUND OVERHEAD SAKURA BRANCHES (Scrolling Ukiyo-e framing)
      const drawOverheadBranch = (bx, scale, type) => {
        ctx.save();
        ctx.translate(bx, 0);
        ctx.scale(scale, scale);

        ctx.strokeStyle = '#050306'; // Dark black silhouette trunk
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const drawHangingCluster = (cx, cy, size) => {
          ctx.fillStyle = 'rgba(251, 113, 133, 0.85)'; // Rose-400
          ctx.beginPath();
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(254, 205, 211, 0.98)'; // Rose-200
          ctx.beginPath();
          ctx.arc(cx - size * 0.22, cy - size * 0.22, size * 0.68, 0, Math.PI * 2);
          ctx.fill();
        };

        if (type === 0) {
          // Type A: Long swept branch
          ctx.lineWidth = 9;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.quadraticCurveTo(-100, 60, -220, 40);
          ctx.quadraticCurveTo(-280, 30, -340, 80);
          ctx.stroke();

          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-120, 50);
          ctx.quadraticCurveTo(-180, 100, -220, 110);
          ctx.stroke();

          drawHangingCluster(-220, 40, 22);
          drawHangingCluster(-340, 80, 17);
          drawHangingCluster(-220, 110, 15);
          drawHangingCluster(-150, 60, 19);
        } else if (type === 1) {
          // Type B: Steeper dropping branch
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.quadraticCurveTo(-60, 85, -160, 120);
          ctx.stroke();

          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-70, 60);
          ctx.quadraticCurveTo(-110, 130, -135, 150);
          ctx.stroke();

          drawHangingCluster(-160, 120, 25);
          drawHangingCluster(-135, 150, 18);
          drawHangingCluster(-90, 95, 16);
        } else {
          // Type C: Shorter double branch
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.quadraticCurveTo(-80, 40, -160, 25);
          ctx.stroke();

          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(-50, 20);
          ctx.quadraticCurveTo(-90, 75, -115, 80);
          ctx.stroke();

          drawHangingCluster(-160, 25, 19);
          drawHangingCluster(-115, 80, 20);
          drawHangingCluster(-80, 40, 15);
        }

        ctx.restore();
      };

      overheadBranches.forEach(b => {
        b.x -= b.speed;
        if (b.x < -100) b.x = w + 400 + Math.random() * 200; // spawn off-screen right
        drawOverheadBranch(b.x, b.scale, b.type);
      });

      // 8. SAKURA PETALS (Fluttering and swaying)
      petals.forEach(p => {
        p.sway += p.swaySpeed;
        const currentSpeedX = p.speedX + Math.sin(p.sway) * 1.5;
        
        p.x -= currentSpeedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Wrap around
        if (p.y > h + 50 || p.x < -100) {
          p.y = -50;
          p.x = w + Math.random() * 500;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Petal shape
        ctx.fillStyle = 'rgba(251, 113, 133, 0.85)'; // Rose-400
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 1.5, -p.size * 0.5, p.size * 0.5, p.size, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.5, p.size, -p.size * 1.5, -p.size * 0.5, 0, -p.size);
        ctx.fill();
        
        ctx.restore();
      });

      // 9. VIGNETTE OVERLAY
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(5, 1, 8, 0.75)'); // Dark blood moon vignette
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
    <div className="relative h-full w-full overflow-hidden bg-slate-50">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};
