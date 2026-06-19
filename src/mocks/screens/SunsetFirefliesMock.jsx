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
      speedX: -(Math.random() * 0.8 + 0.8), // drifting left (opposite of runner)
      speedY: Math.random() * 0.6 - 0.3,
      pulseSpeed: Math.random() * 0.05 + 0.02,
      pulseOffset: Math.random() * Math.PI * 2,
      swayRange: Math.random() * 1.5 + 0.5,
      swaySpeed: Math.random() * 0.02 + 0.01
    }));

    // Generate parallax bamboo (swaying)
    const generateBamboo = (count, spacing, minW, maxW, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.5),
        w: Math.random() * (maxW - minW) + minW,
        speed: speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.015 + 0.005,
        leaves: Array.from({ length: 9 }).map(() => ({
          relY: Math.random() * 0.85 + 0.1, // percentage down the stalk
          side: Math.random() > 0.5 ? 1 : -1,
          size: Math.random() * 15 + 10,
          angle: (Math.random() - 0.5) * 0.4
        }))
      }));
    };

    const layer3 = generateBamboo(25, 90, 4, 8, 0.8);
    const layer2 = generateBamboo(15, 150, 10, 18, 1.8);
    const layer1 = generateBamboo(8, 280, 24, 36, 3.5);

    // Japanese Clouds (Parallax coordinates)
    const clouds = Array.from({ length: 5 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 50,
      width: Math.random() * 150 + 120,
      height: 12,
      speed: 0.15 + Math.random() * 0.1
    }));

    let raf;
    let time = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // 1. SKY GRADIENT (Midnight Twilight)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#02040a');     // Midnight black-blue
      skyGrad.addColorStop(0.35, '#0b132b');   // Deep indigo
      skyGrad.addColorStop(0.65, '#1c2541');   // Dark violet-blue
      skyGrad.addColorStop(0.9, '#2a3b5c');    // Steel twilight blue
      skyGrad.addColorStop(1, '#1b2a4a');      // Deep ocean blue at horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. MOON (Big glowing silver-white full moon)
      ctx.save();
      const moonGlow = ctx.createRadialGradient(w * 0.5, h * 0.62, 20, w * 0.5, h * 0.62, 180);
      moonGlow.addColorStop(0, 'rgba(241, 245, 249, 0.95)'); // soft silver-white
      moonGlow.addColorStop(0.2, 'rgba(186, 230, 253, 0.6)'); // cold light blue glow
      moonGlow.addColorStop(0.6, 'rgba(30, 41, 59, 0.18)'); // soft slate shadow
      moonGlow.addColorStop(1, 'rgba(30, 41, 59, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.62, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2.5 JAPANESE CLOUDS (Traditional Ukiyo-e bands)
      ctx.fillStyle = 'rgba(241, 245, 249, 0.04)'; // Soft silver clouds
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // 3. KOMOREBI (Diagonal Moonlight Shafts slicing down-left through foliage)
      ctx.fillStyle = 'rgba(224, 242, 254, 0.04)'; // Ethereal silver moonlight shafts
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

      // 4. DISTANT HAZY HILLS
      ctx.fillStyle = '#0a0f1d'; // dark navy slate shadow
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.35, h - 170, w * 0.7, h - 130);
      ctx.quadraticCurveTo(w * 0.85, h - 110, w, h - 150);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 5. SWAYING BAMBOO RENDERING
      const drawBambooLayer = (layer, stalkColor, leafColor, heightFactor) => {
        ctx.fillStyle = stalkColor;
        
        layer.forEach(b => {
          b.x -= b.speed;
          if (b.x < -b.w - 100) b.x = w + 100 + Math.random() * 50;

          // Sway algorithm (Sine offset based on individual speeds)
          const swayAngle = b.swayOffset + time * b.swaySpeed;
          const maxSway = Math.sin(swayAngle) * 20; // maximum sway offset at the top

          const stalkHeight = h * heightFactor;
          const startY = h - stalkHeight;

          // Draw swaying stalk (curved rectangle)
          ctx.beginPath();
          ctx.moveTo(b.x, h);
          ctx.quadraticCurveTo(b.x, h - stalkHeight * 0.5, b.x + maxSway, startY);
          ctx.lineTo(b.x + b.w + maxSway, startY);
          ctx.quadraticCurveTo(b.x + b.w, h - stalkHeight * 0.5, b.x + b.w, h);
          ctx.closePath();
          ctx.fill();

          // Draw segments/joints
          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.lineWidth = 1.5;
          const jointSpacing = b.w * 3.5;
          let currentY = h;
          while (currentY > startY) {
            const t = (h - currentY) / stalkHeight;
            // Interpolate X along the quadratic curve
            const currentX = b.x * (1 - t) * (1 - t) + 2 * b.x * (1 - t) * t + (b.x + maxSway) * t * t;
            
            ctx.beginPath();
            ctx.moveTo(currentX - 1, currentY);
            ctx.lineTo(currentX + b.w + 1, currentY - 2.5); // slanted joints
            ctx.stroke();

            currentY -= jointSpacing;
          }

          // Draw Leaves
          ctx.fillStyle = leafColor;
          b.leaves.forEach(leaf => {
            const t = leaf.relY;
            const currentY = h - stalkHeight * t;
            const currentX = b.x * (1 - t) * (1 - t) + 2 * b.x * (1 - t) * t + (b.x + maxSway) * t * t;

            ctx.save();
            ctx.translate(currentX + b.w / 2, currentY);
            ctx.rotate(leaf.angle + (maxSway * 0.004) * leaf.side); // sway forces leaves to rotate

            // Slender bamboo leaf path
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(leaf.side * leaf.size * 0.55, -leaf.size * 0.45, leaf.side * leaf.size, -leaf.size * 0.2);
            ctx.quadraticCurveTo(leaf.side * leaf.size * 0.5, leaf.size * 0.1, 0, 0);
            ctx.fill();

            ctx.restore();
          });
        });
      };

      // Far layer
      drawBambooLayer(layer3, '#0d1321', '#05070d', 0.8);

      // Midground layer
      drawBambooLayer(layer2, '#1e293b', '#0f172a', 0.95);

      // Midground Ground
      ctx.fillStyle = '#060913';
      ctx.beginPath();
      ctx.moveTo(0, groundY - 15);
      ctx.quadraticCurveTo(w * 0.35, groundY - 25, w * 0.7, groundY + 5);
      ctx.quadraticCurveTo(w * 0.85, groundY + 15, w, groundY - 8);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Foreground layer
      drawBambooLayer(layer1, '#334155', '#1e293b', 1.15);

      // Foreground Ground Overlay
      ctx.fillStyle = '#020307';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 8);
      ctx.quadraticCurveTo(w * 0.35, groundY - 5, w * 0.7, groundY + 20);
      ctx.quadraticCurveTo(w * 0.85, groundY + 30, w, groundY + 12);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // 6. FIREFLIES (Hotaru) - Glowing and pulsing
      fireflies.forEach(f => {
        f.angle += f.swaySpeed;
        f.x += f.speedX + Math.sin(f.angle) * f.swayRange;
        f.y += f.speedY;

        // Wrap particles
        if (f.x < -100) {
          f.x = w + 100;
          f.y = Math.random() * h;
        }
        if (f.y < -100 || f.y > h + 100) {
          f.y = Math.random() * h;
        }

        const pulse = Math.sin(time * f.pulseSpeed + f.pulseOffset) * 0.5 + 0.5;

        // Radial glow
        ctx.save();
        const fGlow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.size * 5.5 * pulse);
        fGlow.addColorStop(0, 'rgba(234, 250, 21, 0.95)'); // glow core
        fGlow.addColorStop(0.35, 'rgba(132, 204, 22, 0.5)'); // lime glow
        fGlow.addColorStop(1, 'rgba(132, 204, 22, 0)');
        ctx.fillStyle = fGlow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 5.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // White core dot
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.9})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 7. VIGNETTE OVERLAY
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 4, 12, 0.7)');
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
    <div className="relative h-full w-full overflow-hidden bg-purple-950">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};
