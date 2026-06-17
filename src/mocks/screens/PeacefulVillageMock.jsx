import { useEffect, useRef } from 'react';

export const PeacefulVillageMock = () => {
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

    // 1. Sakura Petals
    const petals = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * 2500 - 500,
      y: Math.random() * 1500 - 500,
      size: Math.random() * 5 + 3,
      speedX: Math.random() * 2.0 + 2.5, // wind blowing left
      speedY: Math.random() * 1.2 + 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.06,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01
    }));

    // 2. Sky Lanterns (drifting slowly up and left in background)
    const skyLanterns = Array.from({ length: 25 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 800 + 100,
      w: Math.random() * 4 + 4,
      h: Math.random() * 5 + 6,
      speedY: -(Math.random() * 0.4 + 0.3),
      speedX: -(Math.random() * 0.2 + 0.15),
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.02
    }));

    // 3. Chimney Smoke Particles
    const smokePuffs = [];
    const maxSmokePuffs = 80;

    const spawnSmoke = (x, y) => {
      if (smokePuffs.length >= maxSmokePuffs) return;
      smokePuffs.push({
        x: x,
        y: y,
        vx: -(Math.random() * 0.4 + 0.3), // Drifts left
        vy: -(Math.random() * 0.6 + 0.6), // Drifts up
        radius: Math.random() * 3 + 2,
        life: 1.0,
        decay: Math.random() * 0.006 + 0.004,
        growth: Math.random() * 0.12 + 0.08
      });
    };

    // 4. Parallax Mountain Ridges (Sumi-e inspired wave functions)
    const generateMountainRidge = (pointsCount, spacing, amp, freq, baseHeight) => {
      const points = [];
      let totalWidth = pointsCount * spacing;
      for (let i = 0; i <= pointsCount; i++) {
        const x = i * spacing;
        const y = baseHeight + 
                  Math.sin(i * freq) * amp + 
                  Math.sin(i * freq * 2.2) * (amp * 0.4) + 
                  Math.cos(i * freq * 0.5) * (amp * 0.55);
        points.push({ x, y });
      }
      points[points.length - 1].y = points[0].y;
      return { points, totalWidth };
    };

    const ridgeFar = generateMountainRidge(30, 85, 75, 0.4, 460); 
    const ridgeMid = generateMountainRidge(30, 65, 55, 0.55, 510);

    // 5. Japanese Clouds
    const clouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 45,
      width: Math.random() * 140 + 100,
      height: 10,
      speed: 0.1 + Math.random() * 0.1
    }));

    // 6. Scenery entities (wrapping coords)
    // Trees (Pine & Sakura)
    const generateTrees = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * 60 + 160,
        scale: Math.random() * 0.2 + 0.8,
        type: Math.random() > 0.5 ? 'pine' : 'sakura',
        speed
      }));
    };
    const treesFar = generateTrees(6, 300, 0.8);
    const treesNear = generateTrees(4, 450, 1.8);

    // Shacks / houses
    const generateHouses = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.3) + 100,
        width: Math.random() * 20 + 90,
        height: Math.random() * 15 + 65,
        hasLantern: Math.random() > 0.3,
        speed
      }));
    };
    const housesFar = generateHouses(4, 420, 0.8);
    const housesNear = generateHouses(3, 580, 1.8);

    // Torii gate
    const toriiGate = {
      x: 350,
      width: 110,
      height: 95,
      speed: 1.8
    };

    let raf;
    let time = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // --- 1. SKY GRADIENT (Cozy sunrise / sunset twilight) ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0c0a1a');      // Dark midnight violet
      skyGrad.addColorStop(0.3, '#211633');    // Deep plum
      skyGrad.addColorStop(0.55, '#411e47');   // Dusk red-purple
      skyGrad.addColorStop(0.75, '#7c2a4c');   // Antique rose
      skyGrad.addColorStop(0.9, '#c85340');    // Muted sunrise orange
      skyGrad.addColorStop(1, '#ebd08d');      // Pale peach horizon glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // --- 2. SOFT GLOWING SUN ---
      ctx.save();
      const sunX = w * 0.65;
      const sunY = h * 0.6;
      const sunR = Math.min(w, h) * 0.2;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR * 1.5);
      sunGlow.addColorStop(0, 'rgba(254, 215, 170, 0.95)'); // soft light peach
      sunGlow.addColorStop(0.35, 'rgba(239, 104, 80, 0.5)'); // warm sun-glow
      sunGlow.addColorStop(0.7, 'rgba(219, 39, 119, 0.12)'); // violet fringe
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- 3. JAPANESE CLOUDS ---
      ctx.fillStyle = 'rgba(251, 113, 133, 0.04)'; // Soft peach/rose cloud bands
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // --- 4. SKY LANTERNS (Floating up from the background) ---
      skyLanterns.forEach(f => {
        f.x += f.speedX;
        f.y += f.speedY;
        if (f.y < -30 || f.x < -30) {
          f.y = groundY - 20 - Math.random() * 100;
          f.x = w + Math.random() * 300;
        }

        const pulse = Math.sin(time * f.pulseSpeed + f.pulseOffset) * 0.15 + 0.85;
        
        ctx.save();
        ctx.globalAlpha = pulse * 0.65;
        
        // Glow radial
        const lGlow = ctx.createRadialGradient(f.x + f.w/2, f.y + f.h/2, 1, f.x + f.w/2, f.y + f.h/2, f.w * 3.5);
        lGlow.addColorStop(0, 'rgba(253, 186, 116, 0.9)'); // bright orange
        lGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)'); // warm red
        lGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = lGlow;
        ctx.beginPath();
        ctx.arc(f.x + f.w/2, f.y + f.h/2, f.w * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Lantern rectangle
        ctx.fillStyle = '#ea580c'; // Warm orange
        ctx.beginPath();
        ctx.roundRect(f.x, f.y, f.w, f.h, 1.5);
        ctx.fill();

        // Dark base
        ctx.fillStyle = '#270e04';
        ctx.fillRect(f.x + 0.5, f.y + f.h - 1, f.w - 1, 1.5);
        ctx.restore();
      });

      // --- 5. PARALLAX FADING MOUNTAINS ---
      const drawFadingRidge = (ridge, colorTop, colorBottom, scrollSpeed, yOffset) => {
        ctx.save();
        const offset = (time * scrollSpeed) % ridge.totalWidth;
        const mGradient = ctx.createLinearGradient(0, yOffset - 50, 0, h);
        mGradient.addColorStop(0, colorTop);
        mGradient.addColorStop(0.75, colorBottom);
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

      // Far ridge (Very slow, dark violet-grey fading into horizon)
      drawFadingRidge(ridgeFar, '#291d38', 'rgba(65, 30, 71, 0.45)', 0.2, -40);

      // Midground fog layer
      const midFog = ctx.createLinearGradient(0, h * 0.52, 0, h * 0.82);
      midFog.addColorStop(0, 'rgba(74, 30, 73, 0)');
      midFog.addColorStop(1, 'rgba(124, 42, 76, 0.35)');
      ctx.fillStyle = midFog;
      ctx.fillRect(0, h * 0.5, w, h * 0.35);

      // Mid ridge (Slightly faster, warmer plum-maroon)
      drawFadingRidge(ridgeMid, '#3d162f', 'rgba(124, 42, 76, 0.5)', 0.45, -10);

      // Midground Ground Plane
      ctx.fillStyle = '#2b091c'; // Deep plum-shadow ground
      ctx.fillRect(0, groundY - 15, w, h - (groundY - 15));
      ctx.fillStyle = '#4c1533';
      ctx.fillRect(0, groundY - 17, w, 2);

      // --- 6. RENDER FAR SCENERY (Trees and Shacks) ---
      const drawPineTree = (tx, ty, height, scale, trunkColor, foliageColor, snowColor = null) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        // Ground anchor mound
        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Curved trunk
        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10, -height * 0.3, -4, -height * 0.65);
        ctx.quadraticCurveTo(8, -height * 0.85, 0, -height);
        ctx.stroke();

        const drawBranchCluster = (bx, by, size) => {
          ctx.fillStyle = foliageColor;
          ctx.beginPath();
          ctx.ellipse(bx, by, size, size * 0.45, -0.08, 0, Math.PI * 2);
          ctx.fill();

          if (snowColor) {
            ctx.fillStyle = snowColor;
            ctx.beginPath();
            ctx.ellipse(bx, by - size * 0.08, size * 0.9, size * 0.22, -0.08, Math.PI, Math.PI * 2);
            ctx.fill();
          }
        };

        drawBranchCluster(-12, -height * 0.6, 22);
        drawBranchCluster(12, -height * 0.78, 18);
        drawBranchCluster(0, -height, 26);

        ctx.restore();
      };

      const drawSakuraTree = (tx, ty, height, scale, trunkColor, leafColorBase, leafColorHighlight) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        // Ground anchor mound
        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-8, -height * 0.3, -3, -height * 0.65);
        ctx.quadraticCurveTo(6, -height * 0.85, 0, -height);
        ctx.stroke();

        // Branches
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-5, -height * 0.45);
        ctx.quadraticCurveTo(-16, -height * 0.58, -20, -height * 0.75);
        ctx.moveTo(3, -height * 0.7);
        ctx.quadraticCurveTo(14, -height * 0.82, 18, -height * 0.9);
        ctx.stroke();

        const drawSakuraCluster = (bx, by, size) => {
          ctx.fillStyle = leafColorBase;
          ctx.beginPath();
          ctx.arc(bx, by, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = leafColorHighlight;
          ctx.beginPath();
          ctx.arc(bx - size * 0.2, by - size * 0.2, size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        };

        drawSakuraCluster(-20, -height * 0.75, 18);
        drawSakuraCluster(18, -height * 0.9, 14);
        drawSakuraCluster(0, -height, 24);

        ctx.restore();
      };

      const drawDetailedHouse = (sx, sy, width, height, hasLantern) => {
        ctx.save();

        // Ground anchor mound
        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(sx, sy, width * 0.52, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden Stilts
        ctx.fillStyle = '#21100b';
        ctx.fillRect(sx - width * 0.42, sy - 6, width * 0.84, 6);
        ctx.fillRect(sx - width * 0.35, sy, 4, 6);
        ctx.fillRect(sx - width * 0.12, sy, 4, 6);
        ctx.fillRect(sx + width * 0.12, sy, 4, 6);
        ctx.fillRect(sx + width * 0.35, sy, 4, 6);

        // Wall construction
        ctx.fillStyle = '#3a1f16';
        ctx.fillRect(sx - width * 0.38, sy - height, width * 0.76, height - 6);

        // Shoji Screen Sliding Doors
        const doorW = width * 0.25;
        const doorH = height * 0.52;
        const doorY = sy - doorH - 6;

        const drawShoji = (dx) => {
          ctx.fillStyle = '#fce7f3'; // Soft rose-tinted paper shoji
          ctx.fillRect(dx, doorY, doorW, doorH);

          // Shoji window grids
          ctx.strokeStyle = '#21100b';
          ctx.lineWidth = 1.0;
          ctx.strokeRect(dx, doorY, doorW, doorH);

          ctx.beginPath();
          ctx.moveTo(dx + doorW / 2, doorY);
          ctx.lineTo(dx + doorW / 2, doorY + doorH);
          ctx.moveTo(dx, doorY + doorH * 0.33);
          ctx.lineTo(dx + doorW, doorY + doorH * 0.33);
          ctx.moveTo(dx, doorY + doorH * 0.66);
          ctx.lineTo(dx + doorW, doorY + doorH * 0.66);
          ctx.stroke();
        };

        // Window glow (candle light inside)
        const glow = ctx.createRadialGradient(sx, doorY + doorH/2, 2, sx, doorY + doorH/2, doorW * 1.5);
        glow.addColorStop(0, 'rgba(253, 186, 116, 0.75)'); // orange-300
        glow.addColorStop(0.5, 'rgba(244, 63, 94, 0.3)');  // rose-500
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - width * 0.35, doorY - 5, width * 0.7, doorH + 10);

        drawShoji(sx - doorW - 2);
        drawShoji(sx + 2);

        // Traditional roof frame
        ctx.fillStyle = '#26130d';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.5, sy - height);
        ctx.quadraticCurveTo(sx, sy - height - 10, sx + width * 0.5, sy - height);
        ctx.lineTo(sx + width * 0.42, sy - height - 7);
        ctx.quadraticCurveTo(sx, sy - height - 18, sx - width * 0.42, sy - height - 7);
        ctx.closePath();
        ctx.fill();

        // Thatch roof profile
        ctx.fillStyle = '#2e1810';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.46, sy - height - 5);
        ctx.quadraticCurveTo(sx - width * 0.28, sy - height - 20, sx, sy - height - 28);
        ctx.quadraticCurveTo(sx + width * 0.28, sy - height - 20, sx + width * 0.46, sy - height - 5);
        ctx.quadraticCurveTo(sx + width * 0.32, sy - height - 15, sx, sy - height - 22);
        ctx.quadraticCurveTo(sx - width * 0.32, sy - height - 15, sx - width * 0.46, sy - height - 5);
        ctx.closePath();
        ctx.fill();

        // Small Chimney & Smoke Spawner
        const chimneyX = sx - width * 0.25;
        const chimneyY = sy - height - 12;
        ctx.fillStyle = '#1b0d09';
        ctx.fillRect(chimneyX - 3, chimneyY, 7, 12);
        
        // Spawn smoke puff
        if (time % 12 === 0 && Math.random() > 0.4) {
          spawnSmoke(chimneyX, chimneyY);
        }

        // Hanging Chochin (Red paper lantern)
        if (hasLantern) {
          const lX = sx - width * 0.28;
          const lY = sy - height + 8;
          const lW = 7;
          const lH = 13;

          // Wire
          ctx.strokeStyle = '#21100b';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(lX, lY - 5);
          ctx.lineTo(lX, lY);
          ctx.stroke();

          // Lantern Glow
          const lGlow = ctx.createRadialGradient(lX, lY + lH/2, 1, lX, lY + lH/2, 20);
          lGlow.addColorStop(0, 'rgba(239, 68, 68, 0.85)'); // Red
          lGlow.addColorStop(0.4, 'rgba(251, 146, 60, 0.45)'); // Orange
          lGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = lGlow;
          ctx.beginPath();
          ctx.arc(lX, lY + lH/2, 20, 0, Math.PI * 2);
          ctx.fill();

          // Red Body
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(lX, lY + lH/2, lW, lH/2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Caps
          ctx.fillStyle = '#1c0a06';
          ctx.fillRect(lX - lW * 0.6, lY, lW * 1.2, 1.5);
          ctx.fillRect(lX - lW * 0.6, lY + lH - 1.5, lW * 1.2, 1.5);
        }

        ctx.restore();
      };

      // Draw Far Scenery
      treesFar.forEach(t => {
        t.x -= t.speed;
        if (t.x < -120) t.x = w + 120 + Math.random() * 50;

        if (t.type === 'pine') {
          drawPineTree(t.x, groundY - 15, t.height, t.scale * 0.72, '#381c30', '#1c0314');
        } else {
          drawSakuraTree(t.x, groundY - 15, t.height, t.scale * 0.72, '#381c30', 'rgba(244, 63, 94, 0.4)', 'rgba(251, 113, 133, 0.55)');
        }
      });

      housesFar.forEach(s => {
        s.x -= s.speed;
        if (s.x < -s.width) s.x = w + 100 + Math.random() * 100;
        drawDetailedHouse(s.x, groundY - 15, s.width * 0.82, s.height * 0.82, s.hasLantern);
      });

      // Ambient Fog layer in front of far scenery
      const foreFog = ctx.createLinearGradient(0, groundY - 35, 0, groundY + 30);
      foreFog.addColorStop(0, 'rgba(124, 42, 76, 0)');
      foreFog.addColorStop(0.75, 'rgba(124, 42, 76, 0.28)');
      foreFog.addColorStop(1, 'rgba(124, 42, 76, 0.05)');
      ctx.fillStyle = foreFog;
      ctx.fillRect(0, groundY - 45, w, 90);

      // --- 7. RENDER NEAR SCENERY (Pines, Sakuras, Houses, Torii) ---
      treesNear.forEach(t => {
        t.x -= t.speed;
        if (t.x < -140) t.x = w + 140 + Math.random() * 80;

        if (t.type === 'pine') {
          drawPineTree(t.x, groundY + 5, t.height, t.scale * 1.02, '#210816', '#0a0006');
        } else {
          drawSakuraTree(t.x, groundY + 5, t.height, t.scale * 1.02, '#210816', 'rgba(225, 29, 72, 0.85)', 'rgba(254, 205, 211, 0.96)');
        }
      });

      housesNear.forEach(s => {
        s.x -= s.speed;
        if (s.x < -s.width) s.x = w + 100 + Math.random() * 120;
        drawDetailedHouse(s.x, groundY + 15, s.width, s.height, s.hasLantern);
      });

      // Draw Torii Gate (Near scenery)
      const drawToriiGate = (gx, gy, width, height) => {
        ctx.save();
        ctx.translate(gx, gy);

        // Ground anchor mounds for two pillars
        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(-width*0.35, 0, 16, 4, 0, 0, Math.PI*2);
        ctx.ellipse(width*0.35, 0, 16, 4, 0, 0, Math.PI*2);
        ctx.fill();

        // Posts
        ctx.fillStyle = '#6b122b'; // Deep traditional lacquer red
        ctx.fillRect(-width * 0.38, -height, 14, height);
        ctx.fillRect(width * 0.28, -height, 14, height);

        // Post bases (black)
        ctx.fillStyle = '#1c0a0d';
        ctx.fillRect(-width * 0.38 - 1, -15, 16, 15);
        ctx.fillRect(width * 0.28 - 1, -15, 16, 15);

        // Lower horizontal lintel (Nuki)
        ctx.fillStyle = '#6b122b';
        ctx.fillRect(-width * 0.45, -height + 26, width * 0.9, 10);

        // Upper double lintel (Kasagi + Shimagi)
        ctx.beginPath();
        ctx.moveTo(-width * 0.52, -height + 6);
        ctx.quadraticCurveTo(0, -height - 12, width * 0.52, -height + 6);
        ctx.lineTo(width * 0.52, -height + 18);
        ctx.quadraticCurveTo(0, -height, -width * 0.52, -height + 18);
        ctx.closePath();
        ctx.fill();

        // Black cap on top of the lintel
        ctx.fillStyle = '#1c0a0d';
        ctx.beginPath();
        ctx.moveTo(-width * 0.53, -height + 5);
        ctx.quadraticCurveTo(0, -height - 13, width * 0.53, -height + 5);
        ctx.lineTo(width * 0.53, -height + 10);
        ctx.quadraticCurveTo(0, -height - 8, -width * 0.53, -height + 10);
        ctx.closePath();
        ctx.fill();

        // Central tablet (Gakuzuka)
        ctx.fillStyle = '#1c0a0d';
        ctx.fillRect(-6, -height + 12, 12, 16);

        ctx.restore();
      };

      toriiGate.x -= toriiGate.speed;
      if (toriiGate.x < -toriiGate.width) {
        toriiGate.x = w + 200 + Math.random() * 400;
      }
      drawToriiGate(toriiGate.x, groundY + 12, toriiGate.width, toriiGate.height);

      // --- 8. FOREGROUND GROUND OVERLAY (Crisp wavy ground) ---
      ctx.fillStyle = '#220314'; // shaded foreground
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(w * 0.25, groundY - 14, w * 0.5, groundY + 4);
      ctx.quadraticCurveTo(w * 0.75, groundY + 18, w, groundY - 2);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Top crisp ground lip (highlighted)
      ctx.fillStyle = '#3c0926'; // Deep warm violet lip
      ctx.beginPath();
      ctx.moveTo(0, groundY + 4);
      ctx.quadraticCurveTo(w * 0.25, groundY - 8, w * 0.5, groundY + 9);
      ctx.quadraticCurveTo(w * 0.75, groundY + 22, w, groundY + 3);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Stone Lanterns (Tōrō) on ground
      const drawStoneLantern = (lx, ly, scale) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#331d27'; // Dark stone texture
        
        // Base pedestal (Kiso)
        ctx.fillRect(-12, -4, 24, 4);
        ctx.fillRect(-7, -15, 14, 11);

        // Shaft (Sao)
        ctx.fillRect(-5, -30, 10, 15);

        // Middle platform (Chudai)
        ctx.fillRect(-10, -35, 20, 5);

        // Light box (Hibuki)
        ctx.fillRect(-8, -48, 16, 13);

        // Hibuki Window cutout (Warm glow)
        ctx.fillStyle = '#fef08a'; // yellow-200 glow
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 12;
        ctx.fillRect(-4, -44, 8, 8);
        ctx.shadowBlur = 0;

        // Cap (Kasa) & Finial (Hoju)
        ctx.fillStyle = '#331d27';
        ctx.beginPath();
        ctx.moveTo(-13, -48);
        ctx.lineTo(13, -48);
        ctx.lineTo(9, -54);
        ctx.lineTo(-9, -54);
        ctx.closePath();
        ctx.fill();

        // Round jewel on top
        ctx.beginPath();
        ctx.arc(0, -57, 3.5, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
      };

      // Draw two stone lanterns (moving with foreground speed)
      const toro1X = (w * 0.15 - time * 1.8) % (w + 400);
      const toro2X = (w * 0.7 - time * 1.8) % (w + 400);
      drawStoneLantern(toro1X < -50 ? toro1X + w + 400 : toro1X, groundY + 20, 0.85);
      drawStoneLantern(toro2X < -50 ? toro2X + w + 400 : toro2X, groundY + 28, 0.78);

      // --- 9. RENDER CHIMNEY SMOKE PUFFS ---
      for (let i = smokePuffs.length - 1; i >= 0; i--) {
        const p = smokePuffs[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        p.life -= p.decay;

        if (p.life <= 0) {
          smokePuffs.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life * 0.15; // Soft translucent smoke
        ctx.fillStyle = '#e5e7eb'; // Light gray-white
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- 10. RENDER FLUTTERING SAKURA PETALS ---
      petals.forEach(p => {
        p.sway += p.swaySpeed;
        const currentSpeedX = p.speedX + Math.sin(p.sway) * 1.2;
        p.x -= currentSpeedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > h + 30 || p.x < -60) {
          p.y = -30;
          p.x = w + Math.random() * 400;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Beautiful rose-pink cherry blossom petal path
        ctx.fillStyle = 'rgba(244, 63, 94, 0.82)'; // rose-500
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 1.3, -p.size * 0.4, p.size * 0.4, p.size, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.4, p.size, -p.size * 1.3, -p.size * 0.4, 0, -p.size);
        ctx.fill();

        ctx.restore();
      });

      // --- 11. PLUM VIGNETTE ---
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.8);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(20, 5, 18, 0.55)'); // Dusk plum vignette
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
    <div className="relative h-full w-full overflow-hidden bg-fuchsia-950">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};
