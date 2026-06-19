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
      speedX: Math.random() * 2.5 + 3.5,
      speedY: Math.random() * 1.5 + 1.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.03 + 0.015
    }));

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

    const ridgeFar = generateMountainRidge(30, 80, 80, 0.45, 460);
    const ridgeMid = generateMountainRidge(30, 60, 50, 0.6, 520);

    const clouds = Array.from({ length: 5 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 70 + i * 50,
      width: Math.random() * 160 + 110,
      height: 12,
      speed: 0.15 + Math.random() * 0.1
    }));

    const generateOverheadBranches = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.3),
        scale: Math.random() * 0.2 + 0.8,
        type: i % 3,
        speed
      }));
    };
    const overheadBranches = generateOverheadBranches(4, 550, 4.0);

    const generateTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        worldX: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.2 + 0.8,
        speed
      }));
    };
    const treesFar = generateTrees(6, 350, 0.9, 280, 100);
    const treesMid = generateTrees(5, 450, 1.8, 200, 70);
    const treesNear = generateTrees(3, 700, 3.0, 320, 100);

    const mistWisps = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 2000 - 200,
      y: 100 + Math.random() * 500,
      w: 380 + Math.random() * 220,
      h: 80 + Math.random() * 60,
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.12 + Math.random() * 0.10,
      pulseSpeed: 0.01 + Math.random() * 0.01,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    let raf;
    let time = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      const getFarGroundY = (x, scrollOffset) =>
        groundY - 35 + Math.sin((x + scrollOffset) * 0.002) * 12;

      const getMidgroundY = (x, scrollOffset) =>
        groundY - 15 + Math.sin((x + scrollOffset) * 0.004) * 18 + Math.cos((x + scrollOffset) * 0.008) * 6;

      const getForegroundY = (x, scrollOffset) =>
        groundY + 12 + Math.sin((x + scrollOffset) * 0.003 + 1.2) * 22;

      // 1. SKY GRADIENT (Blood Moon Night Sky)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#06020c');
      skyGrad.addColorStop(0.4, '#150a24');
      skyGrad.addColorStop(0.7, '#35123b');
      skyGrad.addColorStop(0.9, '#561a3f');
      skyGrad.addColorStop(1, '#782654');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Blood moon glow
      ctx.save();
      const moonGlow = ctx.createRadialGradient(w * 0.5, h * 0.38, 10, w * 0.5, h * 0.38, Math.min(w, h) * 0.55);
      moonGlow.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
      moonGlow.addColorStop(0.3, 'rgba(220, 38, 38, 0.6)');
      moonGlow.addColorStop(0.65, 'rgba(153, 27, 27, 0.22)');
      moonGlow.addColorStop(1, 'rgba(153, 27, 27, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, Math.min(w, h) * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Blood moon core
      ctx.save();
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(220, 38, 38, 0.05)';
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // Menacing Blood Moon Haze/Fog (proper atmospheric haze)
      const bloodHaze = ctx.createLinearGradient(0, h * 0.3, 0, h);
      bloodHaze.addColorStop(0, 'rgba(120, 38, 84, 0)');
      bloodHaze.addColorStop(0.65, 'rgba(120, 38, 84, 0.22)'); // Soft blood-red haze
      bloodHaze.addColorStop(1, 'rgba(120, 38, 84, 0.45)');
      ctx.fillStyle = bloodHaze;
      ctx.fillRect(0, h * 0.3, w, h * 0.7);

      const drawMistWisp = (wisp, r, g, b) => {
        const alpha = wisp.opacity * (Math.sin(time * wisp.pulseSpeed + wisp.pulseOffset) * 0.3 + 0.7);
        ctx.save();
        ctx.translate(wisp.x, wisp.y);
        ctx.scale(1, wisp.h / wisp.w);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, wisp.w * 0.5);
        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.45})`);
        glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, wisp.w * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      // Far mist wisps (drift)
      mistWisps.slice(0, 2).forEach(wisp => {
        wisp.x -= wisp.speed * 0.3;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 120, 38, 84);
      });

      const drawFadingRidge = (ridge, colorTop, colorBottom, scrollSpeed, yOffset) => {
        ctx.save();
        const offset = (time * scrollSpeed) % ridge.totalWidth;
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

      drawFadingRidge(ridgeFar, '#351c33', 'rgba(53, 28, 51, 0.45)', 0.3, -30);

      const midFog = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.8);
      midFog.addColorStop(0, 'rgba(86, 26, 63, 0)');
      midFog.addColorStop(1, 'rgba(86, 26, 63, 0.3)');
      ctx.fillStyle = midFog;
      ctx.fillRect(0, h * 0.45, w, h * 0.35);

      mistWisps.slice(2, 4).forEach(wisp => {
        wisp.x -= wisp.speed * 0.8;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 150, 48, 105);
      });

      drawFadingRidge(ridgeMid, '#281525', 'rgba(40, 21, 37, 0.55)', 0.7, 10);

      ctx.fillStyle = '#301625';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 15) {
        ctx.lineTo(x, getFarGroundY(x, time * 0.9));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      const drawSakuraTree = (tx, ty, height, scale, trunkColor, leafColorBase, leafColorHighlight, moundColor) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        ctx.fillStyle = moundColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -height * 0.3, -5, -height * 0.65);
        ctx.quadraticCurveTo(10, -height * 0.85, 0, -height);
        ctx.stroke();

        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(-8, -height * 0.45);
        ctx.quadraticCurveTo(-22, -height * 0.6, -26, -height * 0.78);
        ctx.moveTo(4, -height * 0.72);
        ctx.quadraticCurveTo(18, -height * 0.85, 22, -height * 0.95);
        ctx.stroke();

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

      treesFar.forEach(t => {
        const loopWidth = w + 400;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        const ty = getFarGroundY(screenX, time * t.speed);
        drawSakuraTree(
          screenX,
          ty,
          t.height,
          t.scale * 0.75,
          '#4a233b',
          'rgba(220, 38, 38, 0.45)',
          'rgba(251, 113, 133, 0.65)',
          '#301625'
        );
      });

      ctx.fillStyle = '#200d18';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getMidgroundY(x, time * 1.8));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

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
          '#2c1221',
          'rgba(239, 68, 68, 0.8)',
          'rgba(254, 205, 211, 0.9)',
          '#200d18'
        );
      });

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
          '#1c0813',
          'rgba(185, 28, 28, 0.9)',
          'rgba(251, 113, 133, 0.98)',
          '#14040d'
        );
      });

      ctx.fillStyle = '#14040d';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getForegroundY(x, time * 3.0));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      mistWisps.slice(4, 6).forEach(wisp => {
        wisp.x -= wisp.speed * 1.5;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 185, 28, 28);
      });

      const drawOverheadBranch = (bx, scale, type) => {
        ctx.save();
        ctx.translate(bx, 0);
        ctx.scale(scale, scale);
        ctx.strokeStyle = '#1c0813';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const drawHangingCluster = (cx, cy, size) => {
          ctx.fillStyle = 'rgba(251, 113, 133, 0.85)';
          ctx.beginPath();
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(254, 205, 211, 0.98)';
          ctx.beginPath();
          ctx.arc(cx - size * 0.22, cy - size * 0.22, size * 0.68, 0, Math.PI * 2);
          ctx.fill();
        };

        if (type === 0) {
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
        if (b.x < -100) b.x = w + 400 + Math.random() * 200;
        drawOverheadBranch(b.x, b.scale, b.type);
      });

      petals.forEach(p => {
        p.sway += p.swaySpeed;
        const currentSpeedX = p.speedX + Math.sin(p.sway) * 1.5;
        p.x -= currentSpeedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > h + 50 || p.x < -100) {
          p.y = -50;
          p.x = w + Math.random() * 500;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = 'rgba(251, 113, 133, 0.85)';
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 1.5, -p.size * 0.5, p.size * 0.5, p.size, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.5, p.size, -p.size * 1.5, -p.size * 0.5, 0, -p.size);
        ctx.fill();
        ctx.restore();
      });

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(10, 2, 6, 0.55)');
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
