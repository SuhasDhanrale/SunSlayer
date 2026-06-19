import { useEffect, useRef } from 'react';

export const RainyForestMock = () => {
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

    // Rain particles (violent storm angle)
    const rainDrops = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 3000 - 500,
      y: Math.random() * 1500 - 500,
      length: Math.random() * 30 + 20,
      speedX: Math.random() * 10 + 15,
      speedY: Math.random() * 20 + 25,
      opacity: Math.random() * 0.35 + 0.15
    }));

    // Blowing leaves (torn from bamboo in the storm)
    const stormLeaves = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000,
      size: Math.random() * 10 + 8,
      speedX: Math.random() * 8 + 12,
      speedY: Math.random() * 4 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.08 + 0.04
    }));

    // Generate parallax bamboo (heavily bent by storm winds)
    const generateBamboo = (count, spacing, minW, maxW, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.4),
        w: Math.random() * (maxW - minW) + minW,
        speed: speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.03 + 0.01,
        leaves: Array.from({ length: 7 }).map(() => ({
          relY: Math.random() * 0.8 + 0.15,
          side: Math.random() > 0.5 ? 1 : -1,
          size: Math.random() * 14 + 10,
          angle: (Math.random() - 0.5) * 0.5
        }))
      }));
    };

    const layer3 = generateBamboo(25, 90, 4, 8, 0.8);
    const layer2 = generateBamboo(15, 150, 10, 18, 1.8);
    const layer1 = generateBamboo(8, 280, 24, 36, 3.5);

    // Blinking lurking owl eyes in the dark background
    const owlEyes = Array.from({ length: 5 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 250 + 180,
      size: Math.random() * 0.8 + 1.2,
      color: '#eab308',
      opacity: 0.3,
      blinkState: 'open',
      blinkTimer: Math.random() * 400 + 300,
      closedTimer: 0,
      speed: 0.8
    }));

    // Traditional Japanese Clouds
    const clouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 45,
      width: Math.random() * 180 + 130,
      height: 12,
      speed: 0.2 + Math.random() * 0.15
    }));

    // Dynamic floating mist wisps
    const mistWisps = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 2000 - 200,
      y: 150 + Math.random() * 450,
      w: 350 + Math.random() * 250,
      h: 80 + Math.random() * 60,
      speed: 0.5 + Math.random() * 0.8,
      opacity: 0.12 + Math.random() * 0.08,
      pulseSpeed: 0.01 + Math.random() * 0.015,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    let raf;
    let time = 0;
    let lastLightning = 0;
    let lightningAlpha = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // 1. SKY GRADIENT (Stormy Indigo/Black)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#040b1e');
      skyGrad.addColorStop(0.5, '#0f1c3f');
      skyGrad.addColorStop(1, '#1d2f5f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. LIGHTNING FLASH
      if (Math.random() < 0.003 && time - lastLightning > 180) {
        lastLightning = time;
        lightningAlpha = Math.random() * 0.6 + 0.35;
      }
      if (lightningAlpha > 0) {
        ctx.fillStyle = `rgba(186, 230, 253, ${lightningAlpha})`;
        ctx.fillRect(0, 0, w, h);
        lightningAlpha -= 0.04;
      }

      // 3. JAPANESE CLOUDS
      ctx.fillStyle = lightningAlpha > 0
        ? `rgba(255, 255, 255, ${0.12 + lightningAlpha * 0.4})`
        : 'rgba(255, 255, 255, 0.04)';
      
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.25, c.y - c.height * 0.5, c.width * 0.45, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // Ambient stormy haze/fog in the background
      const stormHaze = ctx.createLinearGradient(0, h * 0.3, 0, h);
      stormHaze.addColorStop(0, 'rgba(29, 47, 95, 0)');
      stormHaze.addColorStop(0.7, 'rgba(38, 58, 108, 0.25)');
      stormHaze.addColorStop(1, 'rgba(47, 72, 130, 0.45)');
      ctx.fillStyle = stormHaze;
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
        drawMistWisp(wisp, 38, 58, 108);
      });

      // 4. DISTANT RIDGE
      ctx.fillStyle = '#223152';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.3, h - 180, w * 0.65, h - 130);
      ctx.quadraticCurveTo(w * 0.85, h - 110, w, h - 140);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 4.5 Blinking owl eyes
      owlEyes.forEach(eye => {
        eye.x -= eye.speed;
        if (eye.x < -100) {
          eye.x = w + 100 + Math.random() * 200;
          eye.y = Math.random() * 250 + 180;
        }

        if (eye.blinkState === 'open') {
          eye.blinkTimer--;
          if (eye.blinkTimer <= 0) eye.blinkState = 'closing';
        } else if (eye.blinkState === 'closing') {
          eye.opacity -= 0.05;
          if (eye.opacity <= 0) {
            eye.opacity = 0;
            eye.blinkState = 'closed';
            eye.closedTimer = Math.random() * 120 + 30;
          }
        } else if (eye.blinkState === 'closed') {
          eye.closedTimer--;
          if (eye.closedTimer <= 0) eye.blinkState = 'opening';
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
          ctx.globalAlpha = eye.opacity * 0.35;
          const glow = ctx.createRadialGradient(eye.x, eye.y, 0.5, eye.x, eye.y, eye.size * 2.5);
          glow.addColorStop(0, 'rgba(234, 179, 8, 0.35)');
          glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(eye.x - eye.size * 1.5, eye.y, eye.size * 2.5, 0, Math.PI * 2);
          ctx.arc(eye.x + eye.size * 1.5, eye.y, eye.size * 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = eye.color;
          ctx.beginPath();
          ctx.arc(eye.x - eye.size * 1.5, eye.y, eye.size, 0, Math.PI * 2);
          ctx.arc(eye.x + eye.size * 1.5, eye.y, eye.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 5. STORM-TOSSED BAMBOO
      const drawBambooLayer = (layer, stalkColor, leafColor, heightFactor) => {
        ctx.fillStyle = stalkColor;
        layer.forEach(b => {
          b.x -= b.speed;
          if (b.x < -b.w - 150) b.x = w + 100 + Math.random() * 50;

          const windSway = Math.sin(b.swayOffset + time * b.swaySpeed) * 8;
          const maxSway = -35 + windSway;
          const stalkHeight = h * heightFactor;
          const startY = h - stalkHeight;

          ctx.fillStyle = stalkColor;
          ctx.beginPath();
          ctx.ellipse(b.x + b.w/2, h - 5, b.w * 1.5, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = stalkColor;
          ctx.beginPath();
          ctx.moveTo(b.x, h);
          ctx.quadraticCurveTo(b.x - 10, h - stalkHeight * 0.5, b.x + maxSway, startY);
          ctx.lineTo(b.x + b.w + maxSway, startY);
          ctx.quadraticCurveTo(b.x + b.w - 10, h - stalkHeight * 0.5, b.x + b.w, h);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1.5;
          const jointSpacing = b.w * 3.2;
          let currentY = h;
          while (currentY > startY) {
            const t = (h - currentY) / stalkHeight;
            const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 10) * (1 - t) * t + (b.x + maxSway) * t * t;
            ctx.beginPath();
            ctx.moveTo(currentX - 1, currentY);
            ctx.lineTo(currentX + b.w + 1, currentY - 3);
            ctx.stroke();
            currentY -= jointSpacing;
          }

          ctx.fillStyle = leafColor;
          b.leaves.forEach(leaf => {
            const t = leaf.relY;
            const currentY = h - stalkHeight * t;
            const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 10) * (1 - t) * t + (b.x + maxSway) * t * t;

            ctx.save();
            ctx.translate(currentX + b.w / 2, currentY);
            const windAngle = -Math.PI * 0.65 + leaf.angle + (maxSway * 0.003);
            ctx.rotate(windAngle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(leaf.size * 0.5, -leaf.size * 0.4, leaf.size, -leaf.size * 0.25);
            ctx.quadraticCurveTo(leaf.size * 0.5, leaf.size * 0.1, 0, 0);
            ctx.fill();
            ctx.restore();
          });
        });
      };

      drawBambooLayer(layer3, '#182847', '#0a1224', 0.8);
      drawBambooLayer(layer2, '#2c3f66', '#142038', 0.95);

      const midMist = ctx.createLinearGradient(0, groundY - 80, 0, h);
      midMist.addColorStop(0, 'rgba(38, 58, 108, 0)');
      midMist.addColorStop(0.6, 'rgba(38, 58, 108, 0.18)');
      midMist.addColorStop(1, 'rgba(38, 58, 108, 0.3)');
      ctx.fillStyle = midMist;
      ctx.fillRect(0, groundY - 80, w, h - (groundY - 80));

      mistWisps.slice(2, 4).forEach(wisp => {
        wisp.x -= wisp.speed * 0.8;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 58, 76, 120);
      });

      ctx.fillStyle = '#121a2e';
      ctx.beginPath();
      ctx.moveTo(0, groundY - 15);
      ctx.quadraticCurveTo(w * 0.35, groundY - 25, w * 0.7, groundY + 5);
      ctx.quadraticCurveTo(w * 0.85, groundY + 15, w, groundY - 8);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      drawBambooLayer(layer1, '#4a5f8c', '#243454', 1.15);

      ctx.fillStyle = '#0a1021';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 8);
      ctx.quadraticCurveTo(w * 0.35, groundY - 5, w * 0.7, groundY + 20);
      ctx.quadraticCurveTo(w * 0.85, groundY + 30, w, groundY + 12);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      mistWisps.slice(4, 6).forEach(wisp => {
        wisp.x -= wisp.speed * 1.5;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 74, 93, 143);
      });

      // 6. BLOWING LEAVES
      ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
      stormLeaves.forEach(leaf => {
        leaf.sway += leaf.swaySpeed;
        leaf.x -= leaf.speedX + Math.sin(leaf.sway) * 2;
        leaf.y += leaf.speedY;
        leaf.rotation += leaf.rotationSpeed;

        if (leaf.x < -50 || leaf.y > h + 50) {
          leaf.x = w + 100 + Math.random() * 200;
          leaf.y = Math.random() * (h * 0.7) - 100;
        }

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(leaf.size * 0.5, -leaf.size * 0.3, leaf.size, -leaf.size * 0.15);
        ctx.quadraticCurveTo(leaf.size * 0.5, leaf.size * 0.1, 0, 0);
        ctx.fill();
        ctx.restore();
      });

      // 7. VIOLENT RAIN STREAKS
      ctx.lineCap = 'round';
      rainDrops.forEach(r => {
        r.x -= r.speedX;
        r.y += r.speedY;
        if (r.y > h || r.x < -200) {
          r.y = -Math.random() * 200 - 50;
          r.x = Math.random() * w * 1.6;
        }
        ctx.strokeStyle = `rgba(200, 230, 255, ${r.opacity})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.speedX * 0.45, r.y + r.speedY * 0.45);
        ctx.stroke();
      });

      // 8. SLATE VIGNETTE
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.50)');
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
