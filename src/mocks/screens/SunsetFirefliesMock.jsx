import { useEffect, useRef } from 'react';

export const SunsetFirefliesMock = () => {
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

    // Fireflies particles
    const fireflies = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000,
      size: Math.random() * 2.5 + 1.5,
      angle: Math.random() * Math.PI * 2,
      speedX: -(Math.random() * 0.8 + 0.8),
      speedY: Math.random() * 0.6 - 0.3,
      pulseSpeed: Math.random() * 0.05 + 0.02,
      pulseOffset: Math.random() * Math.PI * 2,
      swayRange: Math.random() * 1.5 + 0.5,
      swaySpeed: Math.random() * 0.02 + 0.01
    }));

    const generateBamboo = (count, spacing, minW, maxW, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.5),
        w: Math.random() * (maxW - minW) + minW,
        speed: speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.015 + 0.005,
        leaves: Array.from({ length: 9 }).map(() => ({
          relY: Math.random() * 0.85 + 0.1,
          side: Math.random() > 0.5 ? 1 : -1,
          size: Math.random() * 15 + 10,
          angle: (Math.random() - 0.5) * 0.4
        }))
      }));
    };

    const layer3 = generateBamboo(25, 90, 4, 8, 0.8);
    const layer2 = generateBamboo(15, 150, 10, 18, 1.8);
    const layer1 = generateBamboo(8, 280, 24, 36, 3.5);

    const clouds = Array.from({ length: 5 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 50,
      width: Math.random() * 150 + 120,
      height: 12,
      speed: 0.15 + Math.random() * 0.1
    }));

    const mistWisps = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 2000 - 200,
      y: 120 + Math.random() * 480,
      w: 350 + Math.random() * 250,
      h: 80 + Math.random() * 60,
      speed: 0.4 + Math.random() * 0.6,
      opacity: 0.10 + Math.random() * 0.08,
      pulseSpeed: 0.015 + Math.random() * 0.015,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    let raf;
    let time = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // 1. SKY GRADIENT (Indigo night sky)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#02040a');
      skyGrad.addColorStop(0.35, '#0b132b');
      skyGrad.addColorStop(0.65, '#1e294b');
      skyGrad.addColorStop(0.9, '#364d7c');
      skyGrad.addColorStop(1, '#5370a3');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Silver full moon
      ctx.save();
      const moonGlow = ctx.createRadialGradient(w * 0.5, h * 0.62, 20, w * 0.5, h * 0.62, 180);
      moonGlow.addColorStop(0, 'rgba(241, 245, 249, 0.95)');
      moonGlow.addColorStop(0.2, 'rgba(186, 230, 253, 0.6)');
      moonGlow.addColorStop(0.6, 'rgba(83, 112, 163, 0.18)');
      moonGlow.addColorStop(1, 'rgba(83, 112, 163, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.62, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(241, 245, 249, 0.04)';
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // Ethereal silver moonlight haze/fog (proper atmospheric haze)
      const moonHaze = ctx.createLinearGradient(0, h * 0.4, 0, h);
      moonHaze.addColorStop(0, 'rgba(83, 112, 163, 0)');
      moonHaze.addColorStop(0.6, 'rgba(83, 112, 163, 0.15)'); // Soft silver-blue haze
      moonHaze.addColorStop(1, 'rgba(83, 112, 163, 0.35)');
      ctx.fillStyle = moonHaze;
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

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
        drawMistWisp(wisp, 83, 112, 163);
      });

      // Moonlight shafts
      ctx.fillStyle = 'rgba(224, 242, 254, 0.08)';
      ctx.beginPath();
      const drawShaft = (startX, width) => {
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + width, 0);
        ctx.lineTo(startX + width - h * 0.5, h);
        ctx.lineTo(startX - h * 0.5, h);
        ctx.closePath();
      };
      drawShaft(w * 0.35, 70);
      drawShaft(w * 0.6, 110);
      drawShaft(w * 0.85, 60);
      ctx.fill();

      // Distant hills
      ctx.fillStyle = '#15223e';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.35, h - 170, w * 0.7, h - 130);
      ctx.quadraticCurveTo(w * 0.85, h - 110, w, h - 150);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      const drawBambooLayer = (layer, stalkColor, leafColor, heightFactor) => {
        ctx.fillStyle = stalkColor;
        layer.forEach(b => {
          b.x -= b.speed;
          if (b.x < -b.w - 100) b.x = w + 100 + Math.random() * 50;

          const swayAngle = b.swayOffset + time * b.swaySpeed;
          const maxSway = Math.sin(swayAngle) * 20;
          const stalkHeight = h * heightFactor;
          const startY = h - stalkHeight;

          ctx.beginPath();
          ctx.moveTo(b.x, h);
          ctx.quadraticCurveTo(b.x, h - stalkHeight * 0.5, b.x + maxSway, startY);
          ctx.lineTo(b.x + b.w + maxSway, startY);
          ctx.quadraticCurveTo(b.x + b.w, h - stalkHeight * 0.5, b.x + b.w, h);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.lineWidth = 1.5;
          const jointSpacing = b.w * 3.5;
          let currentY = h;
          while (currentY > startY) {
            const t = (h - currentY) / stalkHeight;
            const currentX = b.x * (1 - t) * (1 - t) + 2 * b.x * (1 - t) * t + (b.x + maxSway) * t * t;
            ctx.beginPath();
            ctx.moveTo(currentX - 1, currentY);
            ctx.lineTo(currentX + b.w + 1, currentY - 2.5);
            ctx.stroke();
            currentY -= jointSpacing;
          }

          ctx.fillStyle = leafColor;
          b.leaves.forEach(leaf => {
            const t = leaf.relY;
            const currentY = h - stalkHeight * t;
            const currentX = b.x * (1 - t) * (1 - t) + 2 * b.x * (1 - t) * t + (b.x + maxSway) * t * t;

            ctx.save();
            ctx.translate(currentX + b.w / 2, currentY);
            ctx.rotate(leaf.angle + (maxSway * 0.004) * leaf.side);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(leaf.side * leaf.size * 0.55, -leaf.size * 0.45, leaf.side * leaf.size, -leaf.size * 0.2);
            ctx.quadraticCurveTo(leaf.side * leaf.size * 0.5, leaf.size * 0.1, 0, 0);
            ctx.fill();
            ctx.restore();
          });
        });
      };

      drawBambooLayer(layer3, '#18253f', '#0a1122', 0.8);
      drawBambooLayer(layer2, '#2a3c5f', '#15213a', 0.95);

      const midMist = ctx.createLinearGradient(0, groundY - 80, 0, h);
      midMist.addColorStop(0, 'rgba(83, 112, 163, 0)');
      midMist.addColorStop(0.6, 'rgba(83, 112, 163, 0.15)');
      midMist.addColorStop(1, 'rgba(83, 112, 163, 0.28)');
      ctx.fillStyle = midMist;
      ctx.fillRect(0, groundY - 80, w, h - (groundY - 80));

      mistWisps.slice(2, 4).forEach(wisp => {
        wisp.x -= wisp.speed * 0.8;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 110, 139, 191);
      });

      ctx.fillStyle = '#101a2e';
      ctx.beginPath();
      ctx.moveTo(0, groundY - 15);
      ctx.quadraticCurveTo(w * 0.35, groundY - 25, w * 0.7, groundY + 5);
      ctx.quadraticCurveTo(w * 0.85, groundY + 15, w, groundY - 8);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      drawBambooLayer(layer1, '#435a87', '#223150', 1.15);

      ctx.fillStyle = '#0a1120';
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
        drawMistWisp(wisp, 134, 163, 214);
      });

      // Fireflies
      fireflies.forEach(f => {
        f.angle += f.swaySpeed;
        f.x += f.speedX + Math.sin(f.angle) * f.swayRange;
        f.y += f.speedY;

        if (f.x < -100) {
          f.x = w + 100;
          f.y = Math.random() * h;
        }
        if (f.y < -100 || f.y > h + 100) {
          f.y = Math.random() * h;
        }

        const pulse = Math.sin(time * f.pulseSpeed + f.pulseOffset) * 0.5 + 0.5;

        ctx.save();
        const fGlow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.size * 5.5 * pulse);
        fGlow.addColorStop(0, 'rgba(234, 250, 21, 0.95)');
        fGlow.addColorStop(0.35, 'rgba(132, 204, 22, 0.5)');
        fGlow.addColorStop(1, 'rgba(132, 204, 22, 0)');
        ctx.fillStyle = fGlow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 5.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.9})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 4, 12, 0.5)');
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
