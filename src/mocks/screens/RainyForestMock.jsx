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
      speedX: Math.random() * 10 + 15, // Blown hard to the left
      speedY: Math.random() * 20 + 25, // Falling fast
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

    // Blinking lurking owl eyes in the dark background (highly subtle)
    const owlEyes = Array.from({ length: 5 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 250 + 180, // forest height
      size: Math.random() * 0.8 + 1.2, // much smaller eyes
      color: '#eab308', // owl yellow
      opacity: 0.3, // starting opacity
      blinkState: 'open',
      blinkTimer: Math.random() * 400 + 300, // blink less frequently
      closedTimer: 0,
      speed: 0.8 // far background scroll speed
    }));

    // Traditional Japanese Clouds
    const clouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 45,
      width: Math.random() * 180 + 130,
      height: 12,
      speed: 0.2 + Math.random() * 0.15
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
      skyGrad.addColorStop(0, '#020617'); // slate-950
      skyGrad.addColorStop(0.5, '#0f172a'); // slate-900
      skyGrad.addColorStop(1, '#1e293b'); // slate-800
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. LIGHTNING FLASH
      if (Math.random() < 0.003 && time - lastLightning > 180) {
        lastLightning = time;
        lightningAlpha = Math.random() * 0.6 + 0.35;
      }
      if (lightningAlpha > 0) {
        // Flash sky color
        ctx.fillStyle = `rgba(186, 230, 253, ${lightningAlpha})`; // pale sky blue
        ctx.fillRect(0, 0, w, h);
        lightningAlpha -= 0.04;
      }

      // 3. JAPANESE CLOUDS (Traditional Ukiyo-e bands)
      // Flash bright during lightning
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

      // 4. DISTANT RIDGE (Fading ink look)
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.3, h - 180, w * 0.65, h - 130);
      ctx.quadraticCurveTo(w * 0.85, h - 110, w, h - 140);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 4.5 LURKING OWL EYES (Blinking in the shadows)
      owlEyes.forEach(eye => {
        eye.x -= eye.speed;
        if (eye.x < -100) {
          eye.x = w + 100 + Math.random() * 200;
          eye.y = Math.random() * 250 + 180;
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
            eye.closedTimer = Math.random() * 120 + 30; // stays closed longer
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
          
          // Subtle glow
          const glow = ctx.createRadialGradient(eye.x, eye.y, 0.5, eye.x, eye.y, eye.size * 2.5);
          glow.addColorStop(0, 'rgba(234, 179, 8, 0.35)');
          glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(eye.x - eye.size * 1.5, eye.y, eye.size * 2.5, 0, Math.PI * 2);
          ctx.arc(eye.x + eye.size * 1.5, eye.y, eye.size * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Yellow pupils
          ctx.fillStyle = eye.color;
          ctx.beginPath();
          ctx.arc(eye.x - eye.size * 1.5, eye.y, eye.size, 0, Math.PI * 2);
          ctx.arc(eye.x + eye.size * 1.5, eye.y, eye.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      });

      // 5. STORM-TOSSED BAMBOO (Bends heavily leftward)
      const drawBambooLayer = (layer, stalkColor, leafColor, heightFactor) => {
        ctx.fillStyle = stalkColor;
        
        layer.forEach(b => {
          b.x -= b.speed;
          if (b.x < -b.w - 150) b.x = w + 100 + Math.random() * 50;

          // Wind bending logic: Bends heavily leftward with storm buffeting
          const windSway = Math.sin(b.swayOffset + time * b.swaySpeed) * 8;
          const maxSway = -35 + windSway; // Permanently bent left (-35px base offset) + sway oscillation

          const stalkHeight = h * heightFactor;
          const startY = h - stalkHeight;

          // Draw ground anchor mound for bamboo
          ctx.fillStyle = stalkColor;
          ctx.beginPath();
          ctx.ellipse(b.x + b.w/2, h - 5, b.w * 1.5, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw swaying stalk (curved rectangle bent left)
          ctx.fillStyle = stalkColor;
          ctx.beginPath();
          ctx.moveTo(b.x, h);
          ctx.quadraticCurveTo(b.x - 10, h - stalkHeight * 0.5, b.x + maxSway, startY);
          ctx.lineTo(b.x + b.w + maxSway, startY);
          ctx.quadraticCurveTo(b.x + b.w - 10, h - stalkHeight * 0.5, b.x + b.w, h);
          ctx.closePath();
          ctx.fill();

          // Joints
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1.5;
          const jointSpacing = b.w * 3.2;
          let currentY = h;
          while (currentY > startY) {
            const t = (h - currentY) / stalkHeight;
            // Interpolated X along quadratic curve
            const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 10) * (1 - t) * t + (b.x + maxSway) * t * t;
            
            ctx.beginPath();
            ctx.moveTo(currentX - 1, currentY);
            ctx.lineTo(currentX + b.w + 1, currentY - 3);
            ctx.stroke();

            currentY -= jointSpacing;
          }

          // Leaves (Blown hard to the left by wind)
          ctx.fillStyle = leafColor;
          b.leaves.forEach(leaf => {
            const t = leaf.relY;
            const currentY = h - stalkHeight * t;
            const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 10) * (1 - t) * t + (b.x + maxSway) * t * t;

            ctx.save();
            ctx.translate(currentX + b.w / 2, currentY);
            
            // Force leaves to point leftwards due to wind force
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

      // Far bamboo (ink silhouettes)
      drawBambooLayer(layer3, '#0f172a', '#020617', 0.8);

      // Midground bamboo
      drawBambooLayer(layer2, '#1e293b', '#0f172a', 0.95);

      // Midground Ground (anchors midground)
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(0, groundY - 15);
      ctx.quadraticCurveTo(w * 0.35, groundY - 25, w * 0.7, groundY + 5);
      ctx.quadraticCurveTo(w * 0.85, groundY + 15, w, groundY - 8);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Foreground bamboo
      drawBambooLayer(layer1, '#334155', '#1e293b', 1.15);

      // Foreground Ground
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 8);
      ctx.quadraticCurveTo(w * 0.35, groundY - 5, w * 0.7, groundY + 20);
      ctx.quadraticCurveTo(w * 0.85, groundY + 30, w, groundY + 12);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // 6. BLOWING LEAVES (Torn leaves sweeping left)
      ctx.fillStyle = 'rgba(30, 41, 59, 0.75)'; // slate-700 leaves
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

      // 8. PLUM/SLATE VIGNETTE
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.65)');
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
