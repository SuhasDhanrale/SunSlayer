// ─────────────────────────────────────────────────────────────────────────────
// BIOME BACKGROUNDS — the 8 finished Mock Lab environments, ported VERBATIM and
// driven by BiomeSystem.js. Each factory returns a stateful instance:
//
//     { reset(), render(ctx, w, h) }
//
// The mock's `frame()` body becomes `render()`; scene arrays + per-frame counters
// (`time`, `distance`) live in the factory closure. They SELF-SCROLL on their own
// internal counters (incremented once per render = once per frame, identical to the
// mock), so they stay pixel-identical to the approved mocks regardless of run speed.
//
// VISUAL ONLY: these replace the environment layer; the game draws the monk,
// obstacles, coins and HUD on top. The water port omits the mock's own swimming
// monk for that reason. Pure canvas — no React, no refs.
//
// Source mocks: src/mocks/screens/{RainyForest, PeacefulVillage, MountainSakura,
// SnowShack, SunsetFireflies, VolcanicDanger, CaveVisualBiomeMockV2,
// WaterVisualBiomeMockV2}.jsx
// ─────────────────────────────────────────────────────────────────────────────

// 🌧️ RAINY FOREST — ported verbatim from RainyForestMock. Stormy indigo sky,
// lightning, storm-bent bamboo parallax, blowing leaves, violent rain, owl eyes.
export function createRainBackground() {
  let time = 0, seeded = false;
  let rainDrops, stormLeaves, layer3, layer2, layer1, owlEyes, clouds, mistWisps;
  let lastLightning, lightningAlpha;

  const seed = () => {
    rainDrops = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 3000 - 500,
      y: Math.random() * 1500 - 500,
      length: Math.random() * 30 + 20,
      speedX: Math.random() * 10 + 15,
      speedY: Math.random() * 20 + 25,
      opacity: Math.random() * 0.35 + 0.15
    }));

    stormLeaves = Array.from({ length: 35 }).map(() => ({
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

    layer3 = generateBamboo(25, 90, 4, 8, 0.8);
    layer2 = generateBamboo(15, 150, 10, 18, 1.8);
    layer1 = generateBamboo(8, 280, 24, 36, 3.5);

    owlEyes = Array.from({ length: 5 }).map(() => ({
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

    clouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 45,
      width: Math.random() * 180 + 130,
      height: 12,
      speed: 0.2 + Math.random() * 0.15
    }));

    mistWisps = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 2000 - 200,
      y: 150 + Math.random() * 450,
      w: 350 + Math.random() * 250,
      h: 80 + Math.random() * 60,
      speed: 0.5 + Math.random() * 0.8,
      opacity: 0.12 + Math.random() * 0.08,
      pulseSpeed: 0.01 + Math.random() * 0.015,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    lastLightning = 0;
    lightningAlpha = 0;
    seeded = true;
  };

  return {
    reset() { seeded = false; time = 0; },
    render(ctx, w, h) {
      if (!seeded) seed();
      time++;
      const groundY = h - 100;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#040b1e');     // Deep dark navy blue
      skyGrad.addColorStop(0.5, '#0f1c3f');   // Rich indigo blue
      skyGrad.addColorStop(1, '#1d2f5f');     // Lighter stormy blue at horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      if (Math.random() < 0.003 && time - lastLightning > 180) {
        lastLightning = time;
        lightningAlpha = Math.random() * 0.6 + 0.35;
      }
      if (lightningAlpha > 0) {
        ctx.fillStyle = `rgba(186, 230, 253, ${lightningAlpha})`;
        ctx.fillRect(0, 0, w, h);
        lightningAlpha -= 0.04;
      }

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
      stormHaze.addColorStop(0.7, 'rgba(38, 58, 108, 0.25)'); // Soft dark blue fog
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

      ctx.fillStyle = '#223152'; // Distant hills silhouette (raised brightness)
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.3, h - 180, w * 0.65, h - 130);
      ctx.quadraticCurveTo(w * 0.85, h - 110, w, h - 140);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

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
          ctx.ellipse(b.x + b.w / 2, h - 5, b.w * 1.5, 4, 0, 0, Math.PI * 2);
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

      // Midground mist layer
      const midMist = ctx.createLinearGradient(0, groundY - 80, 0, h);
      midMist.addColorStop(0, 'rgba(38, 58, 108, 0)');
      midMist.addColorStop(0.6, 'rgba(38, 58, 108, 0.18)');
      midMist.addColorStop(1, 'rgba(38, 58, 108, 0.3)');
      ctx.fillStyle = midMist;
      ctx.fillRect(0, groundY - 80, w, h - (groundY - 80));

      // Midground mist wisps
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

      // Foreground mist wisps
      mistWisps.slice(4, 6).forEach(wisp => {
        wisp.x -= wisp.speed * 1.5;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 74, 93, 143);
      });

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

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.50)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  };
}

// 🌅 SUNSET FIREFLIES — ported verbatim from SunsetFirefliesMock. Golden-hour
// twilight gradient, glowing sun, light shafts, swaying bamboo, pulsing fireflies.
export function createSunsetBackground() {
  let time = 0, seeded = false;
  let fireflies, layer3, layer2, layer1, clouds, mistWisps;

  const seed = () => {
    fireflies = Array.from({ length: 80 }).map(() => ({
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

    layer3 = generateBamboo(25, 90, 4, 8, 0.8);
    layer2 = generateBamboo(15, 150, 10, 18, 1.8);
    layer1 = generateBamboo(8, 280, 24, 36, 3.5);

    clouds = Array.from({ length: 5 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 50,
      width: Math.random() * 150 + 120,
      height: 12,
      speed: 0.15 + Math.random() * 0.1
    }));

    mistWisps = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 2000 - 200,
      y: 120 + Math.random() * 480,
      w: 350 + Math.random() * 250,
      h: 80 + Math.random() * 60,
      speed: 0.4 + Math.random() * 0.6,
      opacity: 0.10 + Math.random() * 0.08,
      pulseSpeed: 0.015 + Math.random() * 0.015,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    seeded = true;
  };

  return {
    reset() { seeded = false; time = 0; },
    render(ctx, w, h) {
      if (!seeded) seed();
      time++;
      const groundY = h - 100;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#02040a');     // Midnight black-blue
      skyGrad.addColorStop(0.35, '#0b132b');   // Deep indigo
      skyGrad.addColorStop(0.65, '#1e294b');   // Indigo-blue
      skyGrad.addColorStop(0.9, '#364d7c');    // Bright twilight steel-blue
      skyGrad.addColorStop(1, '#5370a3');      // Luminous blue-grey at horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      const moonGlow = ctx.createRadialGradient(w * 0.5, h * 0.62, 20, w * 0.5, h * 0.62, 180);
      moonGlow.addColorStop(0, 'rgba(241, 245, 249, 0.95)'); // soft silver-white
      moonGlow.addColorStop(0.2, 'rgba(186, 230, 253, 0.6)'); // cold light blue glow
      moonGlow.addColorStop(0.6, 'rgba(83, 112, 163, 0.18)'); // soft slate-blue shadow
      moonGlow.addColorStop(1, 'rgba(83, 112, 163, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.62, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(241, 245, 249, 0.04)'; // Soft silver clouds
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

      ctx.fillStyle = 'rgba(224, 242, 254, 0.08)'; // Ethereal silver moonlight shafts (brighter)
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

      ctx.fillStyle = '#15223e'; // Distant hazy hills (lighter slate-blue shadow)
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

      // Midground mist layer
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

      // Foreground mist wisps
      mistWisps.slice(4, 6).forEach(wisp => {
        wisp.x -= wisp.speed * 1.5;
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 134, 163, 214);
      });

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
    }
  };
}

// 🏮 PEACEFUL VILLAGE — ported verbatim from PeacefulVillageMock. Twilight sky,
// sky lanterns, chimney smoke, parallax mountain ridges, sakura petals, houses,
// pines, sakura trees, torii gate, stone lanterns.
export function createVillageBackground() {
  let time = 0, seeded = false;
  let petals, skyLanterns, smokePuffs, ridgeFar, ridgeMid, clouds;
  let treesFar, treesNear, housesFar, housesNear, toriiGate;
  const maxSmokePuffs = 80;

  const seed = () => {
    petals = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * 2500 - 500,
      y: Math.random() * 1500 - 500,
      size: Math.random() * 5 + 3,
      speedX: Math.random() * 2.0 + 2.5,
      speedY: Math.random() * 1.2 + 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.06,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01
    }));

    skyLanterns = Array.from({ length: 25 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 800 + 100,
      w: Math.random() * 4 + 4,
      h: Math.random() * 5 + 6,
      speedY: -(Math.random() * 0.4 + 0.3),
      speedX: -(Math.random() * 0.2 + 0.15),
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.02
    }));

    smokePuffs = [];

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

    ridgeFar = generateMountainRidge(30, 85, 75, 0.4, 460);
    ridgeMid = generateMountainRidge(30, 65, 55, 0.55, 510);

    clouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 45,
      width: Math.random() * 140 + 100,
      height: 10,
      speed: 0.1 + Math.random() * 0.1
    }));

    const generateTrees = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * 60 + 160,
        scale: Math.random() * 0.2 + 0.8,
        type: Math.random() > 0.5 ? 'pine' : 'sakura',
        speed
      }));
    };
    treesFar = generateTrees(6, 300, 0.8);
    treesNear = generateTrees(4, 450, 1.8);

    const generateHouses = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.3) + 100,
        width: Math.random() * 20 + 90,
        height: Math.random() * 15 + 65,
        hasLantern: Math.random() > 0.3,
        speed
      }));
    };
    housesFar = generateHouses(4, 420, 0.8);
    housesNear = generateHouses(3, 580, 1.8);

    toriiGate = { x: 350, width: 110, height: 95, speed: 1.8 };

    seeded = true;
  };

  return {
    reset() { seeded = false; time = 0; },
    render(ctx, w, h) {
      if (!seeded) seed();
      time++;
      const groundY = h - 100;

      const spawnSmoke = (x, y) => {
        if (smokePuffs.length >= maxSmokePuffs) return;
        smokePuffs.push({
          x: x,
          y: y,
          vx: -(Math.random() * 0.4 + 0.3),
          vy: -(Math.random() * 0.6 + 0.6),
          radius: Math.random() * 3 + 2,
          life: 1.0,
          decay: Math.random() * 0.006 + 0.004,
          growth: Math.random() * 0.12 + 0.08
        });
      };

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0c0a1a');
      skyGrad.addColorStop(0.3, '#211633');
      skyGrad.addColorStop(0.55, '#411e47');
      skyGrad.addColorStop(0.75, '#7c2a4c');
      skyGrad.addColorStop(0.9, '#c85340');
      skyGrad.addColorStop(1, '#ebd08d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      const sunX = w * 0.65;
      const sunY = h * 0.6;
      const sunR = Math.min(w, h) * 0.2;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR * 1.5);
      sunGlow.addColorStop(0, 'rgba(254, 215, 170, 0.95)');
      sunGlow.addColorStop(0.35, 'rgba(239, 104, 80, 0.5)');
      sunGlow.addColorStop(0.7, 'rgba(219, 39, 119, 0.12)');
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(251, 113, 133, 0.04)';
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

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

        const lGlow = ctx.createRadialGradient(f.x + f.w / 2, f.y + f.h / 2, 1, f.x + f.w / 2, f.y + f.h / 2, f.w * 3.5);
        lGlow.addColorStop(0, 'rgba(253, 186, 116, 0.9)');
        lGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
        lGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = lGlow;
        ctx.beginPath();
        ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w * 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.roundRect(f.x, f.y, f.w, f.h, 1.5);
        ctx.fill();

        ctx.fillStyle = '#270e04';
        ctx.fillRect(f.x + 0.5, f.y + f.h - 1, f.w - 1, 1.5);
        ctx.restore();
      });

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

      drawFadingRidge(ridgeFar, '#291d38', 'rgba(65, 30, 71, 0.45)', 0.2, -40);

      const midFog = ctx.createLinearGradient(0, h * 0.52, 0, h * 0.82);
      midFog.addColorStop(0, 'rgba(74, 30, 73, 0)');
      midFog.addColorStop(1, 'rgba(124, 42, 76, 0.35)');
      ctx.fillStyle = midFog;
      ctx.fillRect(0, h * 0.5, w, h * 0.35);

      drawFadingRidge(ridgeMid, '#3d162f', 'rgba(124, 42, 76, 0.5)', 0.45, -10);

      ctx.fillStyle = '#2b091c';
      ctx.fillRect(0, groundY - 15, w, h - (groundY - 15));
      ctx.fillStyle = '#4c1533';
      ctx.fillRect(0, groundY - 17, w, 2);

      const drawPineTree = (tx, ty, height, scale, trunkColor, foliageColor, snowColor = null) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 4, 0, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-8, -height * 0.3, -3, -height * 0.65);
        ctx.quadraticCurveTo(6, -height * 0.85, 0, -height);
        ctx.stroke();

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

        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(sx, sy, width * 0.52, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#21100b';
        ctx.fillRect(sx - width * 0.42, sy - 6, width * 0.84, 6);
        ctx.fillRect(sx - width * 0.35, sy, 4, 6);
        ctx.fillRect(sx - width * 0.12, sy, 4, 6);
        ctx.fillRect(sx + width * 0.12, sy, 4, 6);
        ctx.fillRect(sx + width * 0.35, sy, 4, 6);

        ctx.fillStyle = '#3a1f16';
        ctx.fillRect(sx - width * 0.38, sy - height, width * 0.76, height - 6);

        const doorW = width * 0.25;
        const doorH = height * 0.52;
        const doorY = sy - doorH - 6;

        const drawShoji = (dx) => {
          ctx.fillStyle = '#fce7f3';
          ctx.fillRect(dx, doorY, doorW, doorH);

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

        const glow = ctx.createRadialGradient(sx, doorY + doorH / 2, 2, sx, doorY + doorH / 2, doorW * 1.5);
        glow.addColorStop(0, 'rgba(253, 186, 116, 0.75)');
        glow.addColorStop(0.5, 'rgba(244, 63, 94, 0.3)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - width * 0.35, doorY - 5, width * 0.7, doorH + 10);

        drawShoji(sx - doorW - 2);
        drawShoji(sx + 2);

        ctx.fillStyle = '#26130d';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.5, sy - height);
        ctx.quadraticCurveTo(sx, sy - height - 10, sx + width * 0.5, sy - height);
        ctx.lineTo(sx + width * 0.42, sy - height - 7);
        ctx.quadraticCurveTo(sx, sy - height - 18, sx - width * 0.42, sy - height - 7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#2e1810';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.46, sy - height - 5);
        ctx.quadraticCurveTo(sx - width * 0.28, sy - height - 20, sx, sy - height - 28);
        ctx.quadraticCurveTo(sx + width * 0.28, sy - height - 20, sx + width * 0.46, sy - height - 5);
        ctx.quadraticCurveTo(sx + width * 0.32, sy - height - 15, sx, sy - height - 22);
        ctx.quadraticCurveTo(sx - width * 0.32, sy - height - 15, sx - width * 0.46, sy - height - 5);
        ctx.closePath();
        ctx.fill();

        const chimneyX = sx - width * 0.25;
        const chimneyY = sy - height - 12;
        ctx.fillStyle = '#1b0d09';
        ctx.fillRect(chimneyX - 3, chimneyY, 7, 12);

        if (time % 12 === 0 && Math.random() > 0.4) {
          spawnSmoke(chimneyX, chimneyY);
        }

        if (hasLantern) {
          const lX = sx - width * 0.28;
          const lY = sy - height + 8;
          const lW = 7;
          const lH = 13;

          ctx.strokeStyle = '#21100b';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(lX, lY - 5);
          ctx.lineTo(lX, lY);
          ctx.stroke();

          const lGlow = ctx.createRadialGradient(lX, lY + lH / 2, 1, lX, lY + lH / 2, 20);
          lGlow.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
          lGlow.addColorStop(0.4, 'rgba(251, 146, 60, 0.45)');
          lGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = lGlow;
          ctx.beginPath();
          ctx.arc(lX, lY + lH / 2, 20, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(lX, lY + lH / 2, lW, lH / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#1c0a06';
          ctx.fillRect(lX - lW * 0.6, lY, lW * 1.2, 1.5);
          ctx.fillRect(lX - lW * 0.6, lY + lH - 1.5, lW * 1.2, 1.5);
        }

        ctx.restore();
      };

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

      const foreFog = ctx.createLinearGradient(0, groundY - 35, 0, groundY + 30);
      foreFog.addColorStop(0, 'rgba(124, 42, 76, 0)');
      foreFog.addColorStop(0.75, 'rgba(124, 42, 76, 0.28)');
      foreFog.addColorStop(1, 'rgba(124, 42, 76, 0.05)');
      ctx.fillStyle = foreFog;
      ctx.fillRect(0, groundY - 45, w, 90);

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

      const drawToriiGate = (gx, gy, width, height) => {
        ctx.save();
        ctx.translate(gx, gy);

        ctx.fillStyle = '#1c0311';
        ctx.beginPath();
        ctx.ellipse(-width * 0.35, 0, 16, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(width * 0.35, 0, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6b122b';
        ctx.fillRect(-width * 0.38, -height, 14, height);
        ctx.fillRect(width * 0.28, -height, 14, height);

        ctx.fillStyle = '#1c0a0d';
        ctx.fillRect(-width * 0.38 - 1, -15, 16, 15);
        ctx.fillRect(width * 0.28 - 1, -15, 16, 15);

        ctx.fillStyle = '#6b122b';
        ctx.fillRect(-width * 0.45, -height + 26, width * 0.9, 10);

        ctx.beginPath();
        ctx.moveTo(-width * 0.52, -height + 6);
        ctx.quadraticCurveTo(0, -height - 12, width * 0.52, -height + 6);
        ctx.lineTo(width * 0.52, -height + 18);
        ctx.quadraticCurveTo(0, -height, -width * 0.52, -height + 18);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1c0a0d';
        ctx.beginPath();
        ctx.moveTo(-width * 0.53, -height + 5);
        ctx.quadraticCurveTo(0, -height - 13, width * 0.53, -height + 5);
        ctx.lineTo(width * 0.53, -height + 10);
        ctx.quadraticCurveTo(0, -height - 8, -width * 0.53, -height + 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1c0a0d';
        ctx.fillRect(-6, -height + 12, 12, 16);

        ctx.restore();
      };

      toriiGate.x -= toriiGate.speed;
      if (toriiGate.x < -toriiGate.width) {
        toriiGate.x = w + 200 + Math.random() * 400;
      }
      drawToriiGate(toriiGate.x, groundY + 12, toriiGate.width, toriiGate.height);

      ctx.fillStyle = '#220314';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(w * 0.25, groundY - 14, w * 0.5, groundY + 4);
      ctx.quadraticCurveTo(w * 0.75, groundY + 18, w, groundY - 2);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      ctx.fillStyle = '#3c0926';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 4);
      ctx.quadraticCurveTo(w * 0.25, groundY - 8, w * 0.5, groundY + 9);
      ctx.quadraticCurveTo(w * 0.75, groundY + 22, w, groundY + 3);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      const drawStoneLantern = (lx, ly, scale) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#331d27';

        ctx.fillRect(-12, -4, 24, 4);
        ctx.fillRect(-7, -15, 14, 11);

        ctx.fillRect(-5, -30, 10, 15);

        ctx.fillRect(-10, -35, 20, 5);

        ctx.fillRect(-8, -48, 16, 13);

        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 12;
        ctx.fillRect(-4, -44, 8, 8);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#331d27';
        ctx.beginPath();
        ctx.moveTo(-13, -48);
        ctx.lineTo(13, -48);
        ctx.lineTo(9, -54);
        ctx.lineTo(-9, -54);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -57, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      const toro1X = (w * 0.15 - time * 1.8) % (w + 400);
      const toro2X = (w * 0.7 - time * 1.8) % (w + 400);
      drawStoneLantern(toro1X < -50 ? toro1X + w + 400 : toro1X, groundY + 20, 0.85);
      drawStoneLantern(toro2X < -50 ? toro2X + w + 400 : toro2X, groundY + 28, 0.78);

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
        ctx.globalAlpha = p.life * 0.15;
        ctx.fillStyle = '#e5e7eb';

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

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

        ctx.fillStyle = 'rgba(244, 63, 94, 0.82)';
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 1.3, -p.size * 0.4, p.size * 0.4, p.size, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.4, p.size, -p.size * 1.3, -p.size * 0.4, 0, -p.size);
        ctx.fill();

        ctx.restore();
      });

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.8);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(20, 5, 18, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  };
}

// 🌸 MOUNTAIN SAKURA — ported verbatim from MountainSakuraMock. Pale rose-cream
// sky, Japanese red sun, sumi-e mountain ridges, three parallax layers of sakura
// trees on procedural ground curves, overhead branches, fluttering petals.
export function createSakuraBackground() {
  let time = 0, seeded = false;
  let petals, ridgeFar, ridgeMid, clouds, overheadBranches, treesFar, treesMid, treesNear, mistWisps;

  const seed = () => {
    petals = Array.from({ length: 90 }).map(() => ({
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

    ridgeFar = generateMountainRidge(30, 80, 80, 0.45, 460);
    ridgeMid = generateMountainRidge(30, 60, 50, 0.6, 520);

    clouds = Array.from({ length: 5 }).map((_, i) => ({
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
    overheadBranches = generateOverheadBranches(4, 550, 4.0);

    const generateTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        worldX: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.2 + 0.8,
        speed
      }));
    };
    treesFar = generateTrees(6, 350, 0.9, 280, 100);
    treesMid = generateTrees(5, 450, 1.8, 200, 70);
    treesNear = generateTrees(3, 700, 3.0, 320, 100);

    mistWisps = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 2000 - 200,
      y: 100 + Math.random() * 500,
      w: 380 + Math.random() * 220,
      h: 80 + Math.random() * 60,
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.12 + Math.random() * 0.10,
      pulseSpeed: 0.01 + Math.random() * 0.01,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    seeded = true;
  };

  return {
    reset() { seeded = false; time = 0; },
    render(ctx, w, h) {
      if (!seeded) seed();
      time++;
      const groundY = h - 100;

      const getFarGroundY = (x, scrollOffset) =>
        groundY - 35 + Math.sin((x + scrollOffset) * 0.002) * 12;

      const getMidgroundY = (x, scrollOffset) =>
        groundY - 15 + Math.sin((x + scrollOffset) * 0.004) * 18 + Math.cos((x + scrollOffset) * 0.008) * 6;

      const getForegroundY = (x, scrollOffset) =>
        groundY + 12 + Math.sin((x + scrollOffset) * 0.003 + 1.2) * 22;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#06020c');      // Almost pitch black-purple
      skyGrad.addColorStop(0.4, '#150a24');    // Deep midnight violet
      skyGrad.addColorStop(0.7, '#35123b');    // Deep menacing magenta
      skyGrad.addColorStop(0.9, '#561a3f');    // Horizon crimson-magenta
      skyGrad.addColorStop(1, '#782654');      // Blood-red twilight glow at horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      const moonGlow = ctx.createRadialGradient(w * 0.5, h * 0.38, 10, w * 0.5, h * 0.38, Math.min(w, h) * 0.55);
      moonGlow.addColorStop(0, 'rgba(239, 68, 68, 0.95)'); // Bright blood-red center glow
      moonGlow.addColorStop(0.3, 'rgba(220, 38, 38, 0.6)'); // Mid-red ring
      moonGlow.addColorStop(0.65, 'rgba(153, 27, 27, 0.22)'); // Fading red haze
      moonGlow.addColorStop(1, 'rgba(153, 27, 27, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, Math.min(w, h) * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#b91c1c'; // Solid deep red moon core
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(220, 38, 38, 0.05)'; // Blood-red tinted clouds
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // Menacing Blood Moon Haze/Fog (adds rich atmospheric glow)
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

      // Foreground mist wisps
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
    }
  };
}

// ❄️ SNOW SHACK — ported verbatim from SnowShackMock. Indigo winter twilight,
// dimmed red sun, Mt. Fuji, sumi-e ridges, snow-laden pines & shacks, snowflakes.
export function createSnowBackground() {
  let time = 0, seeded = false;
  let snowflakes, ridgeFar, ridgeMid, clouds, pineTreesFar, pineTreesNear, shacksFar, shacksNear;

  const seed = () => {
    snowflakes = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * 2000 - 400,
      y: Math.random() * 1000,
      radius: Math.random() * 4 + 1.5,
      density: Math.random() * 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
      speedY: Math.random() * 1.5 + 1.5
    }));

    const generateMountainRidge = (pointsCount, spacing, amp, freq, baseHeight) => {
      const points = [];
      let totalWidth = pointsCount * spacing;
      for (let i = 0; i <= pointsCount; i++) {
        const x = i * spacing;
        const y = baseHeight +
                  Math.sin(i * freq) * amp +
                  Math.sin(i * freq * 2.3) * (amp * 0.4) +
                  Math.cos(i * freq * 0.5) * (amp * 0.6);
        points.push({ x, y });
      }
      points[points.length - 1].y = points[0].y;
      return { points, totalWidth };
    };

    ridgeFar = generateMountainRidge(30, 80, 70, 0.45, 450);
    ridgeMid = generateMountainRidge(30, 60, 50, 0.6, 520);

    clouds = Array.from({ length: 5 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 80 + i * 50,
      width: Math.random() * 150 + 120,
      height: 14,
      speed: 0.15 + Math.random() * 0.1
    }));

    const generatePineTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.15 + 0.85,
        speed
      }));
    };
    pineTreesFar = generatePineTrees(8, 280, 1.2, 250, 120);
    pineTreesNear = generatePineTrees(5, 420, 2.5, 360, 160);

    const generateShacks = (count, spacing, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.3),
        width: Math.random() * 30 + 100,
        height: Math.random() * 20 + 70,
        hasLight: Math.random() > 0.25,
        speed
      }));
    };
    shacksFar = generateShacks(5, 380, 1.2);
    shacksNear = generateShacks(4, 550, 2.5);

    seeded = true;
  };

  return {
    reset() { seeded = false; time = 0; },
    render(ctx, w, h) {
      if (!seeded) seed();
      time++;
      const groundY = h - 100;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0d1a');
      skyGrad.addColorStop(0.4, '#12172b');
      skyGrad.addColorStop(0.8, '#1b2341');
      skyGrad.addColorStop(1, '#2c365d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.35, Math.min(w, h) * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.5, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      const fujiSize = Math.min(w, h) * 0.45;
      const fujiX = w * 0.5;
      const fujiY = groundY - 40;

      ctx.fillStyle = '#181e36';
      ctx.beginPath();
      ctx.moveTo(fujiX - fujiSize * 2.0, fujiY);
      ctx.quadraticCurveTo(fujiX - fujiSize * 0.7, fujiY - fujiSize * 0.2, fujiX - fujiSize * 0.3, fujiY - fujiSize);
      ctx.lineTo(fujiX + fujiSize * 0.3, fujiY - fujiSize);
      ctx.quadraticCurveTo(fujiX + fujiSize * 0.7, fujiY - fujiSize * 0.2, fujiX + fujiSize * 2.0, fujiY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(fujiX - fujiSize * 0.3, fujiY - fujiSize);
      ctx.lineTo(fujiX + fujiSize * 0.3, fujiY - fujiSize);
      ctx.quadraticCurveTo(fujiX + fujiSize * 0.42, fujiY - fujiSize * 0.79, fujiX + fujiSize * 0.6, fujiY - fujiSize * 0.7);
      ctx.lineTo(fujiX + fujiSize * 0.3, fujiY - fujiSize * 0.75);
      ctx.lineTo(fujiX + fujiSize * 0.15, fujiY - fujiSize * 0.85);
      ctx.lineTo(fujiX, fujiY - fujiSize * 0.68);
      ctx.lineTo(fujiX - fujiSize * 0.15, fujiY - fujiSize * 0.82);
      ctx.lineTo(fujiX - fujiSize * 0.3, fujiY - fujiSize * 0.72);
      ctx.quadraticCurveTo(fujiX - fujiSize * 0.42, fujiY - fujiSize * 0.79, fujiX - fujiSize * 0.3, fujiY - fujiSize);
      ctx.closePath();
      ctx.fill();

      const drawFadingRidge = (ridge, colorTop, colorBottom, scrollSpeed, yOffset) => {
        ctx.save();
        const offset = (time * scrollSpeed) % ridge.totalWidth;

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

      drawFadingRidge(ridgeFar, '#2d334e', 'rgba(44, 54, 93, 0.4)', 0.35, -40);

      const midFog = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.8);
      midFog.addColorStop(0, 'rgba(44, 54, 93, 0)');
      midFog.addColorStop(1, 'rgba(44, 54, 93, 0.5)');
      ctx.fillStyle = midFog;
      ctx.fillRect(0, h * 0.5, w, h * 0.35);

      drawFadingRidge(ridgeMid, '#21273d', 'rgba(27, 35, 65, 0.5)', 0.7, 0);

      ctx.fillStyle = '#b8c6dc';
      ctx.fillRect(0, groundY - 15, w, h - (groundY - 15));
      ctx.fillStyle = '#e2eaf5';
      ctx.fillRect(0, groundY - 18, w, 3);

      const drawPineTree = (tx, ty, height, scale) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#181726';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -height * 0.3, -5, -height * 0.65);
        ctx.quadraticCurveTo(12, -height * 0.85, 0, -height);
        ctx.stroke();

        const drawBranchCluster = (bx, by, size) => {
          ctx.fillStyle = '#101426';
          ctx.beginPath();
          ctx.ellipse(bx, by, size, size * 0.45, -0.1, 0, Math.PI * 2);
          ctx.fill();

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

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx, sy, width * 0.55, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#181210';
        ctx.fillRect(sx - width * 0.45, sy - 8, width * 0.9, 8);
        ctx.fillRect(sx - width * 0.38, sy, 5, 8);
        ctx.fillRect(sx - width * 0.15, sy, 5, 8);
        ctx.fillRect(sx + width * 0.15, sy, 5, 8);
        ctx.fillRect(sx + width * 0.38, sy, 5, 8);

        ctx.fillStyle = '#261b17';
        ctx.fillRect(sx - width * 0.4, sy - height, width * 0.8, height - 8);

        ctx.strokeStyle = '#140e0c';
        ctx.lineWidth = 1;
        for (let xPos = sx - width * 0.35; xPos < sx + width * 0.35; xPos += 10) {
          ctx.beginPath();
          ctx.moveTo(xPos, sy - height + 4);
          ctx.lineTo(xPos, sy - 8);
          ctx.stroke();
        }

        const doorW = width * 0.28;
        const doorH = height * 0.55;
        const doorY = sy - doorH - 8;

        const drawShoji = (dx) => {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(dx, doorY, doorW, doorH);
          ctx.strokeStyle = '#181210';
          ctx.lineWidth = 1.5;
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

        if (hasLight) {
          const glow = ctx.createRadialGradient(sx, doorY + doorH / 2, 2, sx, doorY + doorH / 2, doorW * 1.6);
          glow.addColorStop(0, 'rgba(249, 115, 22, 0.6)');
          glow.addColorStop(0.6, 'rgba(249, 115, 22, 0.25)');
          glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(sx - width * 0.4, doorY - 10, width * 0.8, doorH + 18);
        }

        drawShoji(sx - doorW - 2);
        drawShoji(sx + 2);

        ctx.fillStyle = '#1c1512';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.54, sy - height);
        ctx.quadraticCurveTo(sx, sy - height - 12, sx + width * 0.54, sy - height);
        ctx.lineTo(sx + width * 0.45, sy - height - 8);
        ctx.quadraticCurveTo(sx, sy - height - 20, sx - width * 0.45, sy - height - 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1e1411';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.5, sy - height - 6);
        ctx.quadraticCurveTo(sx - width * 0.3, sy - height - 22, sx, sy - height - 32);
        ctx.quadraticCurveTo(sx + width * 0.3, sy - height - 22, sx + width * 0.5, sy - height - 6);
        ctx.quadraticCurveTo(sx + width * 0.35, sy - height - 18, sx, sy - height - 25);
        ctx.quadraticCurveTo(sx - width * 0.35, sy - height - 18, sx - width * 0.5, sy - height - 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(sx - width * 0.52, sy - height - 9);
        ctx.quadraticCurveTo(sx - width * 0.3, sy - height - 26, sx, sy - height - 36);
        ctx.quadraticCurveTo(sx + width * 0.3, sy - height - 26, sx + width * 0.52, sy - height - 9);
        ctx.quadraticCurveTo(sx + width * 0.3, sy - height - 18, sx, sy - height - 27);
        ctx.quadraticCurveTo(sx - width * 0.3, sy - height - 18, sx - width * 0.52, sy - height - 9);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx - width * 0.28, sy - height - 13, 5, 0, Math.PI * 2);
        ctx.arc(sx + 5, sy - height - 23, 7, 0, Math.PI * 2);
        ctx.arc(sx + width * 0.32, sy - height - 11, 4, 0, Math.PI * 2);
        ctx.fill();

        if (hasLight) {
          const lX = sx - width * 0.32;
          const lY = sy - height + 8;
          const lW = 8;
          const lH = 14;

          ctx.strokeStyle = '#181210';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lX, lY - 6);
          ctx.lineTo(lX, lY);
          ctx.stroke();

          const lGlow = ctx.createRadialGradient(lX, lY + lH / 2, 2, lX, lY + lH / 2, 25);
          lGlow.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
          lGlow.addColorStop(0.3, 'rgba(249, 115, 22, 0.5)');
          lGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = lGlow;
          ctx.beginPath();
          ctx.arc(lX, lY + lH / 2, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(lX, lY + lH / 2, lW, lH / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#181210';
          ctx.fillRect(lX - lW * 0.65, lY, lW * 1.3, 2);
          ctx.fillRect(lX - lW * 0.65, lY + lH - 2, lW * 1.3, 2);
        }

        ctx.restore();
      };

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

      const foregroundFog = ctx.createLinearGradient(0, groundY - 40, 0, groundY + 30);
      foregroundFog.addColorStop(0, 'rgba(44, 54, 93, 0)');
      foregroundFog.addColorStop(0.7, 'rgba(44, 54, 93, 0.35)');
      foregroundFog.addColorStop(1, 'rgba(44, 54, 93, 0.1)');
      ctx.fillStyle = foregroundFog;
      ctx.fillRect(0, groundY - 50, w, 100);

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

      ctx.fillStyle = '#c5d2e8';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(w * 0.25, groundY - 15, w * 0.5, groundY + 5);
      ctx.quadraticCurveTo(w * 0.75, groundY + 20, w, groundY);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 6);
      ctx.quadraticCurveTo(w * 0.25, groundY - 8, w * 0.5, groundY + 11);
      ctx.quadraticCurveTo(w * 0.75, groundY + 25, w, groundY + 7);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      snowflakes.forEach(f => {
        f.sway += f.swaySpeed;
        f.x += Math.sin(f.sway) * 0.6 - 0.7;
        f.y += f.speedY;

        if (f.y > h + 10 || f.x < -20 || f.x > w + 20) {
          f.y = -20;
          f.x = Math.random() * (w + 40) - 20;
        }

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);

        if (f.radius > 3.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity * 0.55})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        }

        ctx.fill();
      });

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(10, 13, 26, 0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  };
}

// 🌋 VOLCANIC DANGER — ported verbatim from VolcanicDangerMock. Black-red ash sky,
// towering volcano with lava veins, scorched trees, glowing earth cracks, embers,
// ash flakes, lurking beast eyes, fiery vignette.
export function createVolcanoBackground() {
  let time = 0, seeded = false;
  let embers, ashFlakes, treesFar, treesNear, ashClouds, beastEyes;

  const seed = () => {
    embers = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000 + 200,
      size: Math.random() * 3 + 1.5,
      speedX: -(Math.random() * 3 + 3),
      speedY: -(Math.random() * 2 + 1),
      opacity: Math.random() * 0.8 + 0.2,
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.1 + 0.05
    }));

    ashFlakes = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000 - 200,
      size: Math.random() * 4 + 2,
      speedX: -(Math.random() * 4 + 6),
      speedY: Math.random() * 2 + 1.5,
      opacity: Math.random() * 0.4 + 0.1,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.04 + 0.02
    }));

    const generateScorchedTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        worldX: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.2 + 0.85,
        speed
      }));
    };
    treesFar = generateScorchedTrees(6, 300, 1.0, 260, 120);
    treesNear = generateScorchedTrees(4, 500, 2.5, 380, 150);

    ashClouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 50 + i * 45,
      width: Math.random() * 200 + 150,
      height: 15,
      speed: 0.25 + Math.random() * 0.15
    }));

    beastEyes = Array.from({ length: 4 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 150 + 430,
      size: Math.random() * 0.8 + 1.2,
      color: '#f97316',
      opacity: 0.35,
      blinkState: 'open',
      blinkTimer: Math.random() * 400 + 300,
      closedTimer: 0,
      speed: 1.0
    }));

    seeded = true;
  };

  return {
    reset() { seeded = false; time = 0; },
    render(ctx, w, h) {
      if (!seeded) seed();
      time++;
      const groundY = h - 100;

      const getMidgroundY = (x, scrollOffset) =>
        groundY - 15 + Math.sin((x + scrollOffset) * 0.005) * 15 + Math.cos((x + scrollOffset) * 0.01) * 5;

      const getForegroundY = (x, scrollOffset) =>
        groundY + 12 + Math.sin((x + scrollOffset) * 0.004 + 2.0) * 18;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0c0404');
      skyGrad.addColorStop(0.4, '#1c0a0a');
      skyGrad.addColorStop(0.7, '#3b1111');
      skyGrad.addColorStop(1, '#681c1c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(15, 15, 20, 0.45)';
      ashClouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.4, c.width * 0.5, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      const volSize = Math.min(w, h) * 0.6;
      const volX = w * 0.5;
      const volY = groundY - 10;

      ctx.fillStyle = '#140808';
      ctx.beginPath();
      ctx.moveTo(volX - volSize * 1.8, volY);
      ctx.quadraticCurveTo(volX - volSize * 0.7, volY - volSize * 0.15, volX - volSize * 0.25, volY - volSize * 0.9);
      ctx.lineTo(volX + volSize * 0.25, volY - volSize * 0.9);
      ctx.quadraticCurveTo(volX + volSize * 0.7, volY - volSize * 0.15, volX + volSize * 1.8, volY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 3;

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(volX, volY - volSize * 0.9, volSize * 0.22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const drawLavaVein = (sx, sy, ex, ey) => {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx + ex) / 2 + Math.sin(time * 0.02) * 10, (sy + ey) / 2, ex, ey);
        ctx.stroke();
      };
      drawLavaVein(volX - volSize * 0.1, volY - volSize * 0.9, volX - volSize * 0.3, volY - volSize * 0.5);
      drawLavaVein(volX + volSize * 0.15, volY - volSize * 0.9, volX + volSize * 0.4, volY - volSize * 0.4);

      const haze = ctx.createLinearGradient(0, h * 0.4, 0, h);
      haze.addColorStop(0, 'rgba(104, 28, 28, 0)');
      haze.addColorStop(0.8, 'rgba(104, 28, 28, 0.45)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, h * 0.35, w, h * 0.5);

      beastEyes.forEach(eye => {
        eye.x -= eye.speed;
        if (eye.x < -100) {
          eye.x = w + 100 + Math.random() * 200;
          eye.y = Math.random() * 150 + 430;
        }

        if (eye.blinkState === 'open') {
          eye.blinkTimer--;
          if (eye.blinkTimer <= 0) eye.blinkState = 'closing';
        } else if (eye.blinkState === 'closing') {
          eye.opacity -= 0.05;
          if (eye.opacity <= 0) {
            eye.opacity = 0;
            eye.blinkState = 'closed';
            eye.closedTimer = Math.random() * 150 + 50;
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

          const drawSlantedEye = (cx, cy, direction) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(direction * 0.3);

            const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, eye.size * 2.5);
            glow.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
            glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.ellipse(0, 0, eye.size * 2.5, eye.size * 1.3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = eye.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, eye.size * 1.5, eye.size * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(0, -eye.size * 0.5);
            ctx.lineTo(0, eye.size * 0.5);
            ctx.stroke();

            ctx.restore();
          };

          drawSlantedEye(eye.x - eye.size * 2.5, eye.y, 1);
          drawSlantedEye(eye.x + eye.size * 2.5, eye.y, -1);

          ctx.restore();
        }
      });

      const drawScorchedTree = (tx, ty, height, scale, color) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-20, -height * 0.3, -8, -height * 0.6);
        ctx.quadraticCurveTo(15, -height * 0.8, 0, -height);
        ctx.stroke();

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

      treesFar.forEach(t => {
        const loopWidth = w + 400;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        const ty = getMidgroundY(screenX, time * t.speed) - 5;
        drawScorchedTree(screenX, ty, t.height, t.scale * 0.75, '#120505');
      });

      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getMidgroundY(x, time * 1.8));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(239, 68, 68, ${Math.sin(time * 0.05) * 0.35 + 0.65})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 30) {
        const gy = getMidgroundY(x, time * 1.8);
        if (x === 0) ctx.moveTo(x, gy + 5);
        else ctx.lineTo(x, gy + 5 + Math.sin(x * 0.02 + time * 0.04) * 4);
      }
      ctx.stroke();

      treesNear.forEach(t => {
        const loopWidth = w + 500;
        let screenX = (t.worldX - time * t.speed) % loopWidth;
        if (screenX < -200) screenX += loopWidth;

        const ty = getForegroundY(screenX, time * t.speed) - 5;
        drawScorchedTree(screenX, ty, t.height, t.scale * 1.1, '#0a0202');
      });

      ctx.fillStyle = '#080101';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, getForegroundY(x, time * 3.0));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(249, 115, 22, ${Math.sin(time * 0.08) * 0.3 + 0.7})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        const gy = getForegroundY(x, time * 3.0);
        if (x === 0) ctx.moveTo(x, gy + 8);
        else ctx.lineTo(x, gy + 8 + (x % 40 === 0 ? 6 : -4));
      }
      ctx.stroke();

      embers.forEach(e => {
        e.x += e.speedX;
        e.y += e.speedY;

        if (e.x < -50 || e.y < -50) {
          e.x = w + 100 + Math.random() * 200;
          e.y = h - Math.random() * 300;
        }

        const pulse = Math.sin(time * e.pulseSpeed + e.pulseOffset) * 0.4 + 0.6;

        ctx.save();
        const glow = ctx.createRadialGradient(e.x, e.y, 0.5, e.x, e.y, e.size * 3.5 * pulse);
        glow.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
        glow.addColorStop(0.3, 'rgba(249, 115, 22, 0.7)');
        glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 3.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
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
        ctx.arc(0, 0, a.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(0.7, 'rgba(120, 10, 10, 0.2)');
      vignette.addColorStop(1, 'rgba(40, 2, 2, 0.75)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  };
}

// 🪨 CAVE (V2) — ported verbatim from CaveVisualBiomeMockV2. THE TRANSITION TUNNEL
// between biomes: a finite journey (open prelude → entrance → main cave with sacred
// boulder shrines → exit → open sky). Self-scrolls on its own `distance` at
// `scrollSpeed` and is KEPT ONE-SHOT — reset() replays the journey from the start
// each time the cave leg begins.
//
// V2 (huge update, ported from the rebuilt mock): depth-sorted parallax background
// rocks anchored to the live ceiling/floor contour with atmospheric fade + soft base
// blending, drifting fog patches, ceiling water droplets that splash into floor
// ripples, multi-layer bokeh embers (drawn behind AND in front of the foreground
// floor), and 1.6× ceiling-anchored wall lanterns with hanging strings.
//
// GAME-CONTRACT ADAPTATIONS (the standalone mock lacks these): the mock's
// `clearRect` (transparent) is replaced by an OPAQUE dark base fill so the cave
// OCCLUDES the biome swap during a transition (transparency would leak the biome
// behind it). `journey` + `edgeScreenX` + `edgeNoise` + run-driven `externalDistance`
// keep the spatial-wipe geometry intact (leg lengths + edge-noise are identical to
// the mock, so the entrance/exit rock mouths line up exactly).
export function createCaveBackground(opts = {}) {
  const scrollSpeed = opts.scrollSpeed ?? 1.5;

  // Expanded Cave Length Parameters (closure-level: getCeilingHeight needs them)
  const preludeLen = 2000;
  const entryDropLen = 600;
  const entryExpandLen = 800;
  const mainCaveLen = 9600;
  const exitNarrowLen = 800;
  const exitRiseLen = 600;
  const totalCaveLen = preludeLen + entryDropLen + entryExpandLen + mainCaveLen + exitNarrowLen + exitRiseLen;

  // Shared organic wobble for the cave-mouth edges so the entrance/exit seams read as
  // carved rock. Used by the render AND by edgeScreenX() (which BiomeSystem clips the
  // neighbouring biomes against, so old/new biome meets the TAPERED rock mouth instead
  // of a straight vertical clip line).
  const edgeNoise = (y) => Math.sin(y * 0.05) * 15 + Math.cos(y * 0.12) * 8 + Math.sin(y * 0.015) * 20;

  let time = 0, distance = 0, seeded = false;
  let bgRocks, lilyClusters, wallLanterns, shrines, lightShafts, ambientEmbers, fogPatches;
  // Per-frame transients (ceiling drips + their floor splashes). Reset with the leg.
  let waterDroplets = [];
  let floorRipples = [];

  const seed = () => {
    // Highly detailed organic background rocks, spaced to cover the longer cave with
    // true depth layering (0 = furthest back, 1 = closest foreground of background).
    const totalBgRocks = 80;
    bgRocks = Array.from({ length: totalBgRocks }).map((_, i) => {
      const depth = Math.random();
      const isCeiling = Math.random() > 0.5;

      const scale = 0.45 + depth * 0.55; // 0.45x to 1.0x
      const width = (80 + Math.random() * 110) * scale;
      const height = (220 + Math.random() * 260) * scale;

      const numSteps = 16; // Smoother curves
      const leftSide = [];
      const rightSide = [];

      for (let j = 0; j <= numSteps; j++) {
        const t = j / numSteps;
        const baseWidth = width * (1 - t * 0.9);
        const noiseScale = 8 * scale;
        const noiseL = (Math.sin(t * 10) + Math.cos(t * 5)) * noiseScale + (Math.random() - 0.5) * (6 * scale);
        const noiseR = (Math.cos(t * 8) + Math.sin(t * 4)) * noiseScale + (Math.random() - 0.5) * (6 * scale);

        leftSide.push({ t, xOffset: -baseWidth / 2 + noiseL });
        rightSide.push({ t, xOffset: baseWidth / 2 + noiseR });
      }

      const cracks = Array.from({ length: 3 }).map(() => ({
        t: 0.2 + Math.random() * 0.6,
        length: (20 + Math.random() * 30) * scale,
        angle: (Math.random() - 0.5) * 0.4,
      }));

      return {
        worldX: 2200 + i * 155 + Math.random() * 70,
        width,
        height,
        isCeiling,
        leftSide,
        rightSide,
        cracks,
        colorIndex: Math.floor(Math.random() * 3),
        depth,
      };
    });

    // Sort background rocks back-to-front by depth
    bgRocks.sort((a, b) => a.depth - b.depth);

    const totalClusters = 28;
    lilyClusters = Array.from({ length: totalClusters }).map((_, i) => {
      const clusterWorldX = 3300 + i * 360 + Math.random() * 150;
      const clusterSize = 2 + Math.floor(Math.random() * 3);
      const lilies = Array.from({ length: clusterSize }).map((_, j) => ({
        offsetX: (j - (clusterSize - 1) / 2) * 20 + (Math.random() - 0.5) * 8,
        drop: 15 + Math.random() * 25,
        wobbleSpeed: Math.random() * 0.04 + 0.02,
        wobbleOffset: Math.random() * Math.PI * 2,
        pulseOffset: Math.random() * Math.PI * 2,
      }));
      return { worldX: clusterWorldX, lilies };
    });

    const totalLanterns = 32;
    wallLanterns = Array.from({ length: totalLanterns }).map((_, i) => ({
      worldX: 3200 + i * 320 + Math.random() * 80,
      yOffset: Math.random() * 60 - 30,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      wobbleOffset: Math.random() * Math.PI * 2,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    shrines = [
      { worldX: 3800, type: 'single_boulder', scale: 2.8, liliesCount: 10 },
      { worldX: 5800, type: 'torii_boulder', scale: 2.6, liliesCount: 8 },
      { worldX: 7800, type: 'split_boulder', scale: 2.9, liliesCount: 14 },
      { worldX: 9800, type: 'sword_boulder', scale: 2.8, liliesCount: 12 },
      { worldX: 11800, type: 'lantern_boulder', scale: 2.7, liliesCount: 9 }
    ];

    const totalLightShafts = 12;
    lightShafts = Array.from({ length: totalLightShafts }).map((_, i) => ({
      worldX: 3500 + i * 850 + Math.random() * 250,
      width: 70 + Math.random() * 80,
      angle: 0.10 + Math.random() * 0.08,
      opacity: 0.04 + Math.random() * 0.03,
    }));

    // Ambient embers with multi-layered depth (0 = far background, 1 = foreground bokeh)
    ambientEmbers = Array.from({ length: 85 }).map(() => {
      const depth = Math.random();
      const size = depth < 0.3
        ? Math.random() * 0.8 + 0.4
        : depth < 0.8
          ? Math.random() * 1.5 + 1.2
          : Math.random() * 3.5 + 3.0;

      return {
        worldX: 2000 + Math.random() * 11000,
        worldY: 100 + Math.random() * 400,
        size,
        speedY: (Math.random() - 0.5) * 0.3 * (0.5 + depth),
        speedX: ((Math.random() - 0.5) * 0.3 - 0.2) * (0.5 + depth),
        wobbleOffset: Math.random() * Math.PI * 2,
        isBlue: Math.random() > 0.45,
        depth,
      };
    });

    // Drifting atmospheric fog patches (mid-ground depth)
    fogPatches = Array.from({ length: 12 }).map((_, i) => ({
      worldX: 2200 + i * 900 + Math.random() * 400,
      worldY: 200 + Math.random() * 250,
      radiusX: 180 + Math.random() * 120,
      radiusY: 80 + Math.random() * 60,
      driftOffset: Math.random() * Math.PI * 2,
      driftSpeed: 0.005 + Math.random() * 0.01,
      opacity: 0.04 + Math.random() * 0.04,
      parallax: 0.5 + Math.random() * 0.25,
    }));

    waterDroplets = [];
    floorRipples = [];

    seeded = true;
  };

  return {
    // The cave's finite journey, in its own world units. BiomeSystem reads this to
    // map run-distance through the prelude→entrance→main→exit legs and to know where
    // the entrance/exit rock edges sit on screen (the spatial wipe seams).
    journey: { preludeLen, entryDropLen, entryExpandLen, mainCaveLen, exitNarrowLen, exitRiseLen, totalCaveLen },
    // Screen X of the cave-mouth rock edge at row y, for a given run-driven caveDist.
    // BiomeSystem clips the OLD/NEW biome against this so they meet the tapered rock
    // mouth instead of a vertical seam. side: 'entrance' (left) | 'exit' (right).
    edgeScreenX(side, y, h, caveDist) {
      const groundY = h - 100;
      const yy = y < 0 ? 0 : y > groundY ? groundY : y; // edge is defined over the wall height
      const t = yy / groundY;
      const worldX = side === 'entrance'
        ? preludeLen + t * 500 + edgeNoise(yy)
        : totalCaveLen - t * 500 - edgeNoise(yy);
      return worldX - caveDist;
    },
    reset() { seeded = false; time = 0; distance = 0; waterDroplets = []; floorRipples = []; },
    // externalDistance (optional): when provided, the caller OWNS the cave's progress
    // along its journey (drives it off run distance for the transition). When omitted
    // it self-scrolls at scrollSpeed, identical to the standalone mock.
    render(ctx, w, h, externalDistance) {
      if (!seeded) seed();
      time++;
      if (externalDistance != null) distance = externalDistance;
      else distance += scrollSpeed;

      const groundY = h - 100;

      const drawBoulder = (cx, cy, r, color1, color2) => {
        ctx.beginPath();
        const numPoints = 14;
        for (let j = 0; j < numPoints; j++) {
          const angle = (j / numPoints) * Math.PI * 2;
          const dist = r + Math.sin(angle * 3.5) * (r * 0.07) + Math.cos(angle * 5) * (r * 0.03);
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        grad.addColorStop(0, color1);
        grad.addColorStop(0.7, color2);
        grad.addColorStop(1, '#020305');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.3, cy - r * 0.4);
        ctx.lineTo(cx - r * 0.1, cy - r * 0.1);
        ctx.lineTo(cx - r * 0.25, cy + r * 0.3);
        ctx.moveTo(cx + r * 0.2, cy - r * 0.3);
        ctx.lineTo(cx + r * 0.1, cy + r * 0.1);
        ctx.lineTo(cx + r * 0.35, cy + r * 0.35);
        ctx.stroke();
      };

      const drawShimenawa = (cx, cy, r, rotation = 0.03) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        const ropeWidth = r * 1.8;
        const numBraids = 12;

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(-ropeWidth / 2, 0);
        ctx.quadraticCurveTo(0, r * 0.15, ropeWidth / 2, 0);
        ctx.stroke();

        ctx.fillStyle = '#cfbe95';
        ctx.strokeStyle = '#7c6d48';
        ctx.lineWidth = 1.2;

        for (let i = 0; i < numBraids; i++) {
          const tx = -ropeWidth / 2 + (i / (numBraids - 1)) * ropeWidth;
          const ty = (r * 0.15) * Math.sin((i / (numBraids - 1)) * Math.PI);

          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(0.25 * Math.sin(i * 1.6));
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        const shideX = [-ropeWidth * 0.35, -ropeWidth * 0.12, ropeWidth * 0.12, ropeWidth * 0.35];
        shideX.forEach((sx) => {
          const sy = (r * 0.15) * Math.sin(((sx + ropeWidth / 2) / ropeWidth) * Math.PI);
          ctx.save();
          ctx.translate(sx, sy + 3);

          ctx.fillStyle = '#f3f4f6';
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(-3, 0);
          ctx.lineTo(4, 2);
          ctx.lineTo(-1, 8);
          ctx.lineTo(6, 10);
          ctx.lineTo(1, 20);
          ctx.lineTo(-3, 17);
          ctx.lineTo(2, 9);
          ctx.lineTo(-3, 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        });

        ctx.restore();
      };

      const drawTorii = (tx, ty, tHeight) => {
        ctx.save();
        ctx.translate(tx, ty);

        ctx.fillStyle = '#c2410c';
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.5;

        ctx.fillRect(-35, -tHeight, 8, tHeight);
        ctx.strokeRect(-35, -tHeight, 8, tHeight);
        ctx.fillRect(27, -tHeight, 8, tHeight);
        ctx.strokeRect(27, -tHeight, 8, tHeight);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-37, -4, 12, 4);
        ctx.fillRect(25, -4, 12, 4);

        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.moveTo(-52, -tHeight - 6);
        ctx.quadraticCurveTo(0, -tHeight - 2, 52, -tHeight - 6);
        ctx.lineTo(50, -tHeight);
        ctx.quadraticCurveTo(0, -tHeight + 3, -50, -tHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-54, -tHeight - 8);
        ctx.quadraticCurveTo(0, -tHeight - 4, 54, -tHeight - 8);
        ctx.lineTo(52, -tHeight - 5);
        ctx.quadraticCurveTo(0, -tHeight - 1, -52, -tHeight - 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#c2410c';
        ctx.fillRect(-42, -tHeight + 12, 84, 6);
        ctx.strokeRect(-42, -tHeight + 12, 84, 6);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-4, -tHeight + 3, 8, 9);

        ctx.restore();
      };

      const drawStoneLantern = (lx, ly, lHeight = 70) => {
        ctx.save();
        ctx.translate(lx, ly);

        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1.5;

        ctx.fillRect(-14, -8, 28, 8);
        ctx.strokeRect(-14, -8, 28, 8);

        ctx.fillRect(-5, -32, 10, 24);
        ctx.strokeRect(-5, -32, 10, 24);

        ctx.fillRect(-12, -38, 24, 6);
        ctx.strokeRect(-12, -38, 24, 6);

        const fireGlow = ctx.createRadialGradient(0, -48, 1, 0, -48, 14);
        fireGlow.addColorStop(0, '#fef08a');
        fireGlow.addColorStop(0.4, '#f97316');
        fireGlow.addColorStop(1, 'rgba(249,115,22,0)');
        ctx.fillStyle = fireGlow;
        ctx.beginPath();
        ctx.arc(0, -48, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-8, -56, 4, 18);
        ctx.fillRect(4, -56, 4, 18);

        ctx.beginPath();
        ctx.moveTo(-16, -56);
        ctx.lineTo(16, -56);
        ctx.lineTo(10, -67);
        ctx.lineTo(-10, -67);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -70, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      };

      const drawKatana = (kx, ky) => {
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(-0.35);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -32);
        ctx.stroke();

        ctx.strokeStyle = '#f0f9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -32);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-5, -32, 10, 2.5);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-2, -45, 4, 13);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-2, -42); ctx.lineTo(2, -40);
        ctx.moveTo(-2, -37); ctx.lineTo(2, -35);
        ctx.stroke();

        ctx.restore();
      };

      const drawBlueLilies = (cx, cy, count, areaWidth) => {
        ctx.save();
        ctx.translate(cx, cy);

        for (let i = 0; i < count; i++) {
          const seedV = Math.sin(cx * 0.05 + i * 1.7);
          const lx = seedV * (areaWidth * 0.5);
          const ly = Math.abs(Math.cos(cx * 0.1 + i * 2.3)) * 6 - 3;

          const lilyHeight = 12 + Math.abs(seedV) * 12;
          const sway = Math.sin(time * 0.025 + i * 1.2) * 2.5;
          const pulse = Math.sin(time * 0.04 + i * 2.1) * 0.35 + 0.65;

          const glow = ctx.createRadialGradient(lx + sway, ly - lilyHeight, 0, lx + sway, ly - lilyHeight, 18 * pulse);
          glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(lx + sway, ly - lilyHeight, 18 * pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#064e3b';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.quadraticCurveTo(lx + sway * 0.5, ly - lilyHeight * 0.5, lx + sway, ly - lilyHeight);
          ctx.stroke();

          ctx.strokeStyle = `rgba(186, 232, 255, ${0.75 + pulse * 0.25})`;
          ctx.lineWidth = 1.2;
          const fx = lx + sway;
          const fy = ly - lilyHeight;

          ctx.beginPath();
          for (let p = 0; p < 5; p++) {
            const angle = -Math.PI / 6 - (p / 4) * (Math.PI * 2 / 3);
            const px = fx + Math.cos(angle) * 7;
            const py = fy + Math.sin(angle) * 7 - 2;
            ctx.moveTo(fx, fy);
            ctx.quadraticCurveTo(fx + Math.cos(angle) * 3, fy + Math.sin(angle) * 3, px, py);
          }
          ctx.stroke();
        }

        ctx.restore();
      };

      const getCeilingHeight = (worldX) => {
        const narrowCeilingY = groundY - 140;
        const bigCaveCeilingY = 60;
        const outOfBoundsCeiling = -1500;

        const entranceStart = preludeLen;
        const narrowStart = entranceStart + entryDropLen;
        const expandEnd = narrowStart + entryExpandLen;
        const exitStart = expandEnd + mainCaveLen;
        const narrowEnd = exitStart + exitNarrowLen;
        const exitEnd = narrowEnd + exitRiseLen;

        let baseY = outOfBoundsCeiling;

        if (worldX < entranceStart) {
          baseY = outOfBoundsCeiling;
        } else if (worldX >= entranceStart && worldX < narrowStart) {
          const t = (worldX - entranceStart) / entryDropLen;
          const smoothT = 0.5 - Math.cos(t * Math.PI) * 0.5;
          baseY = outOfBoundsCeiling + smoothT * (narrowCeilingY - outOfBoundsCeiling);
        } else if (worldX >= narrowStart && worldX < expandEnd) {
          const t = (worldX - narrowStart) / entryExpandLen;
          const smoothT = 0.5 - Math.cos(t * Math.PI) * 0.5;
          baseY = narrowCeilingY + smoothT * (bigCaveCeilingY - narrowCeilingY);
        } else if (worldX >= expandEnd && worldX < exitStart) {
          baseY = bigCaveCeilingY;
        } else if (worldX >= exitStart && worldX < narrowEnd) {
          const t = (worldX - exitStart) / exitNarrowLen;
          const smoothT = 0.5 - Math.cos(t * Math.PI) * 0.5;
          baseY = bigCaveCeilingY + smoothT * (narrowCeilingY - bigCaveCeilingY);
        } else if (worldX >= narrowEnd && worldX < exitEnd) {
          const t = (worldX - narrowEnd) / exitRiseLen;
          const smoothT = 0.5 - Math.cos(t * Math.PI) * 0.5;
          baseY = narrowCeilingY + smoothT * (outOfBoundsCeiling - narrowCeilingY);
        } else {
          baseY = outOfBoundsCeiling;
        }

        if (worldX > entranceStart && worldX < exitEnd) {
          baseY += Math.sin(worldX * 0.01) * 20 + Math.cos(worldX * 0.025) * 10;
        }

        return baseY;
      };

      // Deep cave dark. The cave's own placeholder "outdoor" backdrop — a moonlit sky
      // gradient, a moon, and blue parallax mountains/hills — was REMOVED: it read as a
      // separate moonlit biome and produced the hard vertical seam where the clip met
      // the neighbouring biome. A flat dark fill still OCCLUDES the swap, but stays
      // dark-on-dark with whatever it borders, so the seam all but disappears. The rock
      // walls / boulders / lanterns / light shafts below are the cave's real identity.
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#05070d');
      bgGrad.addColorStop(1, '#0b111d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const wallStartX = preludeLen;
      const wallEndX = totalCaveLen;

      const screenWallStartX = wallStartX - distance;
      const screenWallEndX = wallEndX - distance;

      // Organic cave-mouth edges (entrance + exit), traced with per-row noise so the
      // back-wall reads as carved rock rather than a flat slab.
      const getLeftEdgeWorldX = (y) => preludeLen + (y / groundY) * 500 + edgeNoise(y);
      const getRightEdgeWorldX = (y) => totalCaveLen - (y / groundY) * 500 - edgeNoise(y);

      if (screenWallStartX < w + 500 && screenWallEndX > -500) {
        ctx.save();

        // Base cave back-wall with atmospheric depth, traced along the organic edges
        const wallGrad = ctx.createLinearGradient(0, 0, 0, groundY);
        wallGrad.addColorStop(0, '#111827');
        wallGrad.addColorStop(0.5, '#0f172a');
        wallGrad.addColorStop(1, '#020617');
        ctx.fillStyle = wallGrad;
        ctx.beginPath();
        ctx.moveTo(getLeftEdgeWorldX(0) - distance, 0);
        const wallEdgeSteps = 30;
        for (let i = 1; i <= wallEdgeSteps; i++) {
          const y = (i / wallEdgeSteps) * groundY;
          ctx.lineTo(getLeftEdgeWorldX(y) - distance, y);
        }
        for (let i = wallEdgeSteps; i >= 0; i--) {
          const y = (i / wallEdgeSteps) * groundY;
          ctx.lineTo(getRightEdgeWorldX(y) - distance, y);
        }
        ctx.closePath();
        ctx.fill();

        // Moonlit highlight on the cave-mouth entrance edge
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(getLeftEdgeWorldX(0) - distance, 0);
        for (let i = 1; i <= wallEdgeSteps; i++) {
          const y = (i / wallEdgeSteps) * groundY;
          ctx.lineTo(getLeftEdgeWorldX(y) - distance, y);
        }
        ctx.stroke();

        // Moonlit highlight on the cave-mouth exit edge
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(getRightEdgeWorldX(0) - distance, 0);
        for (let i = 1; i <= wallEdgeSteps; i++) {
          const y = (i / wallEdgeSteps) * groundY;
          ctx.lineTo(getRightEdgeWorldX(y) - distance, y);
        }
        ctx.stroke();

        wallLanterns.forEach((lantern) => {
          const lx = lantern.worldX - distance;
          if (lx > -150 && lx < w + 150) {
            const sway = Math.sin(time * lantern.wobbleSpeed + lantern.wobbleOffset) * 10;
            const ly = h * 0.45 + lantern.yOffset;
            const pulse = Math.sin(time * 0.05 + lantern.pulseOffset) * 0.25 + 0.75;

            const glowX = lx + sway;
            const glowY = ly + 32; // Centered on the 1.6x larger lantern cap
            const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 200 * pulse);
            glow.addColorStop(0, 'rgba(220, 38, 38, 0.16)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(glowX, glowY, 200 * pulse, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        shrines.forEach((shrine) => {
          const sx = shrine.worldX - distance;
          if (sx > -200 && sx < w + 200) {
            const sy = groundY - 80;
            const pulse = Math.sin(time * 0.03 + sx) * 0.15 + 0.85;

            let glowColor = 'rgba(56, 189, 248, 0.14)';
            if (shrine.type === 'lantern_boulder') {
              glowColor = 'rgba(249, 115, 22, 0.16)';
            } else if (shrine.type === 'torii_boulder') {
              glowColor = 'rgba(220, 38, 38, 0.12)';
            } else if (shrine.type === 'sword_boulder') {
              glowColor = 'rgba(56, 189, 248, 0.20)';
            }

            const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 350 * pulse);
            glow.addColorStop(0, glowColor);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(sx, sy, 350 * pulse, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        lilyClusters.forEach((cluster) => {
          const cx = cluster.worldX - distance;
          if (cx > -100 && cx < w + 100) {
            const cy = getCeilingHeight(cluster.worldX);
            if (cy > -50) {
              const glow = ctx.createRadialGradient(cx, cy + 20, 0, cx, cy + 20, 120);
              glow.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
              glow.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(cx, cy + 20, 120, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        // Background Rock Formations (organic depth layer). Parallax + size scale by
        // depth; anchored to the live ceiling/floor contour, then faded into the back
        // wall by an atmospheric overlay + a soft base-blend gradient so distant rock
        // dissolves into the dark instead of reading as a hard silhouette.
        bgRocks.forEach((rock) => {
          const parallaxFactor = 0.45 + rock.depth * 0.4; // furthest 0.45 → closest 0.85
          const rx = rock.worldX - distance * parallaxFactor;

          if (rx > -rock.width && rx < w + rock.width) {
            let cy, fy;
            let ry1, ry2;

            if (rock.isCeiling) {
              cy = getCeilingHeight(distance + rx);
              ry1 = -150;
              ry2 = Math.max(getCeilingHeight(rock.worldX), -50) + rock.height;
            } else {
              fy = groundY + Math.sin((distance + rx) * 0.05) * 3 + Math.cos((distance + rx) * 0.01) * 2;
              ry1 = h + 150;
              const floorY_at_worldX = groundY + Math.sin(rock.worldX * 0.05) * 3 + Math.cos(rock.worldX * 0.01) * 2;
              ry2 = floorY_at_worldX - rock.height;
            }

            const adjustedHeight = Math.abs(ry2 - ry1);

            ctx.save();
            const rockGrad = ctx.createLinearGradient(rx - rock.width / 2, 0, rx + rock.width / 2, 0);

            let c1 = '#3f3f46';
            let c2 = '#27272a';
            let c3 = '#18181b';
            if (rock.colorIndex === 1) {
              c1 = '#4b5563';
              c2 = '#374151';
              c3 = '#1f2937';
            } else if (rock.colorIndex === 2) {
              c1 = '#475569';
              c2 = '#334155';
              c3 = '#1e293b';
            }

            rockGrad.addColorStop(0, c1);
            rockGrad.addColorStop(0.5, c2);
            rockGrad.addColorStop(1, c3);
            ctx.fillStyle = rockGrad;

            ctx.beginPath();
            const steps = rock.leftSide.length - 1;

            if (rock.isCeiling) {
              ctx.moveTo(rx + rock.leftSide[0].xOffset, ry1);
              for (let j = 1; j <= steps; j++) {
                const py = ry1 + rock.leftSide[j].t * adjustedHeight;
                ctx.lineTo(rx + rock.leftSide[j].xOffset, py);
              }
              for (let j = steps; j >= 0; j--) {
                const py = ry1 + rock.rightSide[j].t * adjustedHeight;
                ctx.lineTo(rx + rock.rightSide[j].xOffset, py);
              }
            } else {
              ctx.moveTo(rx + rock.leftSide[0].xOffset, ry1);
              for (let j = 1; j <= steps; j++) {
                const py = ry1 - rock.leftSide[j].t * adjustedHeight;
                ctx.lineTo(rx + rock.leftSide[j].xOffset, py);
              }
              for (let j = steps; j >= 0; j--) {
                const py = ry1 - rock.rightSide[j].t * adjustedHeight;
                ctx.lineTo(rx + rock.rightSide[j].xOffset, py);
              }
            }
            ctx.closePath();
            ctx.fill();

            // 1. Atmospheric fog overlay (fades rock colors into background by depth)
            const atmosColor = rock.isCeiling ? '#111827' : '#020617';
            ctx.fillStyle = atmosColor;
            ctx.globalAlpha = (1 - rock.depth) * 0.75;
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // 2. Soft edge blend (fades the rock base seamlessly into the back wall)
            const visibleBaseY = rock.isCeiling ? cy : fy;
            const blendGrad = ctx.createLinearGradient(0, visibleBaseY, 0, ry2);
            if (rock.isCeiling) {
              blendGrad.addColorStop(0, '#111827');
              blendGrad.addColorStop(0.35, 'rgba(17, 24, 39, 0.45)');
              blendGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
            } else {
              blendGrad.addColorStop(0, '#020617');
              blendGrad.addColorStop(0.35, 'rgba(2, 6, 23, 0.45)');
              blendGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = blendGrad;
            ctx.fill();

            // 3. Outline highlight, fading near the visible base
            const strokeGrad = ctx.createLinearGradient(0, visibleBaseY, 0, ry2);
            strokeGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            strokeGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
            strokeGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.12)');
            ctx.strokeStyle = strokeGrad;
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            if (rock.isCeiling) {
              ctx.moveTo(rx + rock.leftSide[0].xOffset, ry1);
              for (let j = 1; j <= steps; j++) {
                ctx.lineTo(rx + rock.leftSide[j].xOffset, ry1 + rock.leftSide[j].t * adjustedHeight);
              }
            } else {
              ctx.moveTo(rx + rock.leftSide[0].xOffset, ry1);
              for (let j = 1; j <= steps; j++) {
                ctx.lineTo(rx + rock.leftSide[j].xOffset, ry1 - rock.leftSide[j].t * adjustedHeight);
              }
            }
            ctx.stroke();

            // Horizontal sediment cracks
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.lineWidth = 1;
            rock.cracks.forEach((crack) => {
              const cyOffset = rock.isCeiling ? ry1 + crack.t * adjustedHeight : ry1 - crack.t * adjustedHeight;
              if (cyOffset > Math.min(ry1, ry2) && cyOffset < Math.max(ry1, ry2)) {
                ctx.beginPath();
                ctx.moveTo(rx - crack.length / 2, cyOffset);
                ctx.lineTo(rx + crack.length / 2, cyOffset + Math.tan(crack.angle) * crack.length);
                ctx.stroke();
              }
            });

            ctx.restore();
          }
        });

        // Drifting atmospheric fog patches
        fogPatches.forEach((fog) => {
          const fx = fog.worldX - distance * fog.parallax + Math.sin(time * fog.driftSpeed + fog.driftOffset) * 40;
          if (fx > -fog.radiusX * 2 && fx < w + fog.radiusX * 2) {
            ctx.save();
            ctx.translate(fx, fog.worldY);

            const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, fog.radiusX);
            grad.addColorStop(0, `rgba(56, 189, 248, ${fog.opacity})`);
            grad.addColorStop(0.3, `rgba(17, 24, 39, ${fog.opacity * 0.6})`);
            grad.addColorStop(1, 'rgba(17, 24, 39, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, fog.radiusX, fog.radiusY, 0.05 * Math.sin(time * 0.002 + fog.driftOffset), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        lightShafts.forEach((shaft) => {
          const sx = shaft.worldX - distance;
          if (sx > -200 && sx < w + 200) {
            ctx.save();
            ctx.translate(sx, 0);

            const topW = shaft.width;
            const botW = shaft.width * 1.8;
            const dx = Math.tan(shaft.angle) * groundY;

            const beamGrad = ctx.createLinearGradient(0, 0, dx, groundY);
            beamGrad.addColorStop(0, `rgba(186, 230, 253, ${shaft.opacity})`);
            beamGrad.addColorStop(0.5, `rgba(186, 230, 253, ${shaft.opacity * 0.4})`);
            beamGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(-topW / 2, 0);
            ctx.lineTo(topW / 2, 0);
            ctx.lineTo(dx + botW / 2, groundY);
            ctx.lineTo(dx - botW / 2, groundY);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          }
        });

        shrines.forEach((shrine) => {
          const sx = shrine.worldX - distance;
          if (sx > -300 && sx < w + 300) {
            ctx.save();
            ctx.translate(sx, groundY);
            ctx.scale(shrine.scale, shrine.scale);

            switch (shrine.type) {
              case 'single_boulder':
                drawBoulder(0, -38, 48, '#4b5563', '#1f2937');
                drawShimenawa(0, -38, 48);
                break;

              case 'torii_boulder':
                drawTorii(0, 0, 75);
                drawBoulder(15, -28, 38, '#374151', '#111827');
                drawShimenawa(15, -28, 38, -0.05);
                break;

              case 'split_boulder':
                ctx.save();
                ctx.translate(-15, 0);
                drawBoulder(-10, -38, 45, '#4b5563', '#1f2937');
                drawShimenawa(-10, -38, 45, 0.05);
                ctx.restore();

                ctx.save();
                ctx.translate(15, 0);
                drawBoulder(10, -35, 42, '#374151', '#111827');
                drawShimenawa(10, -35, 42, -0.04);
                ctx.restore();
                break;

              case 'sword_boulder':
                drawBoulder(0, -42, 52, '#4b5563', '#111827');
                drawShimenawa(0, -42, 52, 0.02);
                drawKatana(0, -90);
                break;

              case 'lantern_boulder':
                drawBoulder(-20, -32, 40, '#374151', '#111827');
                drawShimenawa(-20, -32, 40, 0.04);
                drawStoneLantern(22, 0, 65);
                break;
            }

            drawBlueLilies(0, 0, shrine.liliesCount, 120);

            ctx.restore();
          }
        });

        // Wall lanterns (ceiling-anchored, 1.6x larger) with a hanging string that
        // runs from the ceiling contour down to the swaying lantern cap.
        wallLanterns.forEach((lantern) => {
          const lx = lantern.worldX - distance;
          if (lx > -50 && lx < w + 50) {
            const sway = Math.sin(time * lantern.wobbleSpeed + lantern.wobbleOffset) * 10;
            const ly = h * 0.45 + lantern.yOffset;
            const pulse = Math.sin(time * 0.05 + lantern.pulseOffset) * 0.25 + 0.75;
            const cy = getCeilingHeight(lantern.worldX);

            // String hanging from the ceiling Y down to the cap of the lantern (ly + 16)
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(lx, cy);
            ctx.quadraticCurveTo(lx + sway * 0.4, cy + (ly + 16 - cy) * 0.5, lx + sway, ly + 16);
            ctx.stroke();

            ctx.save();
            ctx.translate(lx + sway, ly);
            ctx.scale(1.6, 1.6);

            // Glow
            const glow = ctx.createRadialGradient(0, 20, 0, 0, 20, 60 * pulse);
            glow.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 20, 60 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Cap
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(0, 10, 10, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.roundRect(-8, 11, 16, 22, 3);
            ctx.fill();

            // Inner glow
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.roundRect(-4, 15, 8, 14, 2);
            ctx.fill();

            // Struts
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(-5, 11); ctx.lineTo(-5, 33);
            ctx.moveTo(5, 11); ctx.lineTo(5, 33);
            ctx.stroke();

            // Tassel
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(-1.5, 33, 3, 8);

            ctx.restore();
          }
        });

        ctx.restore();
      }

      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let x = 0; x <= w; x += 10) {
        const worldX = distance + x;
        const cy = getCeilingHeight(worldX);
        ctx.lineTo(x, cy);
      }

      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fill();

      // Slate contour highlight so the canopy shape reads against the dark ceiling
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        const worldX = distance + x;
        const cy = getCeilingHeight(worldX);
        if (x === 0) ctx.moveTo(x, cy);
        else ctx.lineTo(x, cy);
      }
      ctx.stroke();

      // Bioluminescent light-blue glow highlight from the ceiling lilies
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        const worldX = distance + x;
        const cy = getCeilingHeight(worldX);
        if (x === 0) ctx.moveTo(x, cy);
        else ctx.lineTo(x, cy);
      }
      ctx.stroke();

      lilyClusters.forEach((cluster) => {
        const cx = cluster.worldX - distance;
        if (cx > -100 && cx < w + 100) {
          cluster.lilies.forEach((lily) => {
            const lx = cx + lily.offsetX;
            const cy = getCeilingHeight(cluster.worldX + lily.offsetX);

            if (cy > -50) {
              const pulse = Math.sin(time * 0.04 + lily.pulseOffset) * 0.5 + 0.5;
              const sway = Math.sin(time * lily.wobbleSpeed + lily.wobbleOffset) * 8;

              ctx.save();
              ctx.translate(lx, cy);

              ctx.strokeStyle = '#064e3b';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(sway * 0.5, lily.drop * 0.5, sway, lily.drop);
              ctx.stroke();

              const glow = ctx.createRadialGradient(sway, lily.drop, 0, sway, lily.drop, 35 * pulse);
              glow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
              glow.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(sway, lily.drop, 35 * pulse, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = `rgba(186, 232, 255, ${0.8 + pulse * 0.2})`;
              ctx.lineWidth = 1.5;
              const fx = sway;
              const fy = lily.drop;

              ctx.beginPath();
              for (let p = 0; p < 5; p++) {
                const angle = Math.PI / 3 + (p / 4) * (Math.PI * 1 / 3);
                const px = fx + Math.cos(angle) * 7;
                const py = fy + Math.sin(angle) * 7 + 2;
                ctx.moveTo(fx, fy);
                ctx.quadraticCurveTo(fx + Math.cos(angle) * 3, fy + Math.sin(angle) * 3, px, py);
              }
              ctx.stroke();

              ctx.restore();
            }
          });
        }
      });

      // Spawn ceiling water droplets periodically (from a random ceiling rock tip)
      if (time % 18 === 0 && waterDroplets.length < 10) {
        const ceilingRocks = bgRocks.filter((r) => r.isCeiling);
        if (ceilingRocks.length > 0) {
          const sourceRock = ceilingRocks[Math.floor(Math.random() * ceilingRocks.length)];
          const parallaxFactor = 0.45 + sourceRock.depth * 0.4;
          const rx = sourceRock.worldX - distance * parallaxFactor;

          if (rx > 50 && rx < w - 50) {
            const tipY = Math.max(getCeilingHeight(sourceRock.worldX), -50) + sourceRock.height;
            if (tipY < groundY - 100) {
              waterDroplets.push({
                x: rx,
                y: tipY,
                speedY: 0.5,
                worldX: sourceRock.worldX,
                parallaxFactor,
              });
            }
          }
        }
      }

      // Update and draw water droplets
      waterDroplets = waterDroplets.filter((drip) => {
        const rx = drip.worldX - distance * drip.parallaxFactor;
        drip.x = rx;

        const fy = groundY + Math.sin((distance + drip.x) * 0.05) * 3 + Math.cos((distance + drip.x) * 0.01) * 2;

        drip.speedY += 0.22;
        drip.y += drip.speedY;

        ctx.fillStyle = 'rgba(186, 230, 253, 0.7)';
        ctx.beginPath();
        ctx.arc(drip.x, drip.y, 1.8, 0, Math.PI * 2);
        ctx.fill();

        if (drip.y >= fy) {
          floorRipples.push({
            worldX: drip.worldX,
            y: fy,
            radius: 1,
            maxRadius: 10 + Math.random() * 8,
            opacity: 0.75,
            parallaxFactor: drip.parallaxFactor,
          });
          return false;
        }

        return drip.y < h && drip.x > -10 && drip.x < w + 10;
      });

      // Update and draw floor ripples
      floorRipples = floorRipples.filter((ripple) => {
        const rx = ripple.worldX - distance * ripple.parallaxFactor;
        ripple.x = rx;

        ripple.radius += 0.45;
        ripple.opacity -= 0.02;

        if (ripple.opacity > 0) {
          ctx.strokeStyle = `rgba(186, 230, 253, ${ripple.opacity})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        return ripple.opacity > 0 && ripple.x > -ripple.radius && ripple.x < w + ripple.radius;
      });

      // Depth-aware ember helper (parallax + brightness scale with the ember's depth)
      const drawEmber = (ember) => {
        const parallaxFactor = 0.35 + ember.depth * 0.85;
        let ex = ember.worldX - distance * parallaxFactor;

        if (ex < -100) {
          ember.worldX = distance * parallaxFactor + w + 100 + Math.random() * 50;
          ember.worldY = Math.random() * (groundY - 100) + 50;
          ex = ember.worldX - distance * parallaxFactor;
        }
        if (ex > w + 100) {
          ember.worldX = distance * parallaxFactor - 100 - Math.random() * 50;
          ex = ember.worldX - distance * parallaxFactor;
        }

        ember.worldY += ember.speedY;
        const localCeiling = getCeilingHeight(distance * parallaxFactor + ex);
        const localFloor = groundY + Math.sin((distance * parallaxFactor + ex) * 0.05) * 3;

        if (ember.worldY < localCeiling + 10) ember.worldY = localCeiling + 15;
        if (ember.worldY > localFloor - 10) ember.worldY = localFloor - 15;

        const wobble = Math.sin(time * 0.05 + ember.wobbleOffset) * 2.5;

        ctx.save();
        const alpha = 0.3 + ember.depth * 0.6;
        if (ember.isBlue) {
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = ember.size * 1.5;
        } else {
          ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.shadowColor = '#b91c1c';
          ctx.shadowBlur = ember.size * 1.5;
        }
        ctx.beginPath();
        ctx.arc(ex + wobble, ember.worldY, ember.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      // Background + midground embers (depth < 0.75) — drawn behind the foreground floor
      ambientEmbers.forEach((ember) => {
        if (ember.depth < 0.75) drawEmber(ember);
      });

      // Clean foreground ground
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 15) {
        const worldX = distance + x;
        const floorY = groundY + Math.sin(worldX * 0.05) * 3 + Math.cos(worldX * 0.01) * 2;
        ctx.lineTo(x, floorY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 15) {
        const worldX = distance + x;
        const floorY = groundY + Math.sin(worldX * 0.05) * 3 + Math.cos(worldX * 0.01) * 2;
        if (x === 0) ctx.moveTo(x, floorY);
        else ctx.lineTo(x, floorY);
      }
      ctx.stroke();

      // Foreground bokeh embers (depth >= 0.75) — rendered in front of everything
      ambientEmbers.forEach((ember) => {
        if (ember.depth >= 0.75) drawEmber(ember);
      });
    }
  };
}

// 🌊 WATER (V2) — ported verbatim from WaterVisualBiomeMockV2. Rainy stormy night:
// dark sky with lightning + faded stars + rain-clouds, a teal-lit water column with
// submerged torii gates, moonbeam shafts, spirit koi, glowing seabed lilies, kelp
// parallax, plankton, rising bubbles, surface ripples from rain, and floating Toro
// Nagashi lanterns. The mock's own swimming monk + its bubble trail are OMITTED —
// the game draws the real monk on the water lane (surface = h*0.40, matching
// WATER_SURFACE_FRAC). laneType 'water' in the registry.
export function createWaterBackground(opts = {}) {
  const scrollSpeed = opts.scrollSpeed ?? 1.5;
  let time = 0, distance = 0, seeded = false;
  let rainDrops, ripples, floatingLanterns, toriiGates, plankton, ambientBubbles;
  let koiFish, kelpFar, kelpMid, kelpNear, stars;
  let lightningTime, lightningMaxTime, nextLightningTime;

  const seed = () => {
    rainDrops = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 3000 - 500,
      y: Math.random() * 1500 - 500,
      length: Math.random() * 30 + 20,
      speedX: Math.random() * 10 + 15,
      speedY: Math.random() * 20 + 25,
      opacity: Math.random() * 0.35 + 0.15,
    }));

    ripples = [];

    floatingLanterns = Array.from({ length: 6 }).map((_, i) => ({
      worldX: 300 + i * 400 + Math.random() * 150,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 0.03 + Math.random() * 0.02,
      driftSpeed: 0.3 + Math.random() * 0.2,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    toriiGates = Array.from({ length: 8 }).map((_, i) => ({
      worldX: 500 + i * 2000 + Math.random() * 200,
      scale: 1.6,
      swayOffset: Math.random() * Math.PI * 2,
    }));

    plankton = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 500,
      size: Math.random() * 2 + 1,
      speedY: (Math.random() - 0.5) * 0.3,
      speedX: (Math.random() - 0.5) * 0.3 - 0.2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    ambientBubbles = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 800 + 100,
      size: Math.random() * 3.5 + 1.5,
      speedY: -(Math.random() * 0.8 + 0.3),
      wobbleSpeed: Math.random() * 0.03 + 0.015,
      wobbleRange: Math.random() * 1.5 + 0.5,
      wobbleOffset: Math.random() * Math.PI * 2,
    }));

    koiFish = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600 + 400,
      yOffset: 0.2 + Math.random() * 0.5,
      size: 16 + Math.random() * 14,
      speed: 0.7 + Math.random() * 0.5,
      wiggleSpeed: 0.06 + Math.random() * 0.04,
      wiggleOffset: Math.random() * Math.PI * 2,
      bobRange: 6 + Math.random() * 6,
      isWhite: i % 2 === 0,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    const generateKelp = (count, spacing, speed, minH, varH) =>
      Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.5),
        height: Math.random() * varH + minH,
        width: Math.random() * 10 + 8,
        speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.01 + 0.004,
      }));
    kelpFar = generateKelp(10, 180, 0.5, 200, 120);
    kelpMid = generateKelp(7, 280, 1.2, 300, 150);
    kelpNear = generateKelp(4, 420, 2.2, 380, 180);

    stars = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 400,
      size: Math.random() * 1.2 + 0.4,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    lightningTime = 0;
    lightningMaxTime = 0;
    nextLightningTime = 120 + Math.random() * 300;
    seeded = true;
  };

  return {
    reset() { seeded = false; time = 0; distance = 0; },
    // surfaceOverride (optional): the screen Y of the water surface line. The whole
    // scene flows from it (sky 0→surface, water surface→bottom, monk swims at it), so
    // the caller can FLOOD/DRAIN the world by animating it — BiomeSystem drives this
    // during a cave→water entry (surface rises from the floor to its resting height)
    // and a water→cave exit (it drains back down). Omitted = the standalone resting
    // framing (h*0.4), identical to the mock.
    render(ctx, w, h, surfaceOverride) {
      if (!seeded) seed();
      time++;
      distance += scrollSpeed;

      const surfaceY = surfaceOverride != null ? surfaceOverride : h * 0.4;
      const skyH = surfaceY;
      const waterH = h - surfaceY;

      const drawToriiGate = (tx, ty, tHeight, scale, isSubmerged) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);
        if (isSubmerged) { ctx.fillStyle = '#0f2434'; ctx.strokeStyle = '#050f16'; }
        else { ctx.fillStyle = '#9a3412'; ctx.strokeStyle = '#5c1e0a'; }
        ctx.lineWidth = 1.2;
        ctx.fillRect(-22, 0, 5, tHeight); ctx.strokeRect(-22, 0, 5, tHeight);
        ctx.fillRect(17, 0, 5, tHeight); ctx.strokeRect(17, 0, 5, tHeight);
        if (!isSubmerged) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-23.5, 0, 8, 4);
          ctx.fillStyle = '#9a3412';
          ctx.beginPath();
          ctx.moveTo(-35, -tHeight - 4);
          ctx.quadraticCurveTo(0, -tHeight - 1, 35, -tHeight - 4);
          ctx.lineTo(33, -tHeight);
          ctx.quadraticCurveTo(0, -tHeight + 2, -33, -tHeight);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.moveTo(-36, -tHeight - 5);
          ctx.quadraticCurveTo(0, -tHeight - 2.5, 36, -tHeight - 5);
          ctx.lineTo(35, -tHeight - 3.5);
          ctx.quadraticCurveTo(0, -tHeight - 1, -35, -tHeight - 3.5);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#9a3412';
          ctx.fillRect(-28, -tHeight + 8, 56, 4); ctx.strokeRect(-28, -tHeight + 8, 56, 4);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-3, -tHeight + 2, 6, 6);
        }
        ctx.restore();
      };

      if (lightningTime > 0) {
        lightningTime--;
      } else {
        nextLightningTime--;
        if (nextLightningTime <= 0) {
          lightningTime = Math.random() > 0.4 ? 12 : 6;
          lightningMaxTime = lightningTime;
          nextLightningTime = 350 + Math.random() * 500;
        }
      }

      // 1. SKY PARTITION (0 → h*0.4)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, skyH);
      ctx.clip();

      const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
      if (lightningTime > 0 && (lightningTime > 8 || lightningTime < 4)) {
        skyGrad.addColorStop(0, '#3b2f54');
        skyGrad.addColorStop(0.5, '#4c3b70');
        skyGrad.addColorStop(1, '#5b4a85');
      } else {
        skyGrad.addColorStop(0, '#02040a');
        skyGrad.addColorStop(0.6, '#080c16');
        skyGrad.addColorStop(1, '#0e111d');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, skyH);

      ctx.fillStyle = lightningTime > 0 ? 'rgba(91, 74, 133, 0.25)' : 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 30) {
        const cloudY = skyH * 0.25 + Math.sin((x + distance * 0.3) * 0.008) * 35 + Math.cos((x - distance * 0.1) * 0.004) * 20;
        ctx.lineTo(x, cloudY);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      stars.forEach(star => {
        if (star.y < skyH) {
          const sx = (star.x - distance * 0.03) % (w + 20);
          const screenX = sx < -20 ? sx + w + 40 : sx;
          const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
          ctx.globalAlpha = twinkle * 0.35;
          ctx.beginPath();
          ctx.arc(screenX, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      toriiGates.forEach((gate) => {
        const gx = gate.worldX - distance * 0.75;
        if (gx > -150 && gx < w + 150) {
          drawToriiGate(gx, surfaceY, 110, gate.scale, false);
          const sway = Math.sin(time * 0.03 + gate.swayOffset) * 8;
          const lx = gx + 2 * gate.scale + sway;
          const ly = surfaceY - 55 * gate.scale + Math.cos(time * 0.03 + gate.swayOffset) * 2;
          const pulse = Math.sin(time * 0.06 + gate.swayOffset) * 0.2 + 0.8;
          const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 50 * pulse);
          glow.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
          glow.addColorStop(0.4, 'rgba(217, 119, 6, 0.25)');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(lx, ly, 50 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#374151';
          ctx.fillRect(lx - 5, ly - 6, 10, 12);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(lx - 3, ly - 4, 6, 8);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(lx - 6, ly - 8, 12, 2);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx + 2 * gate.scale, surfaceY - 80 * gate.scale);
          ctx.lineTo(lx, ly - 8);
          ctx.stroke();
        }
      });

      ctx.fillStyle = lightningTime > 0 ? '#1b1b32' : '#04060c';
      ctx.beginPath();
      ctx.moveTo(0, skyH);
      for (let x = 0; x <= w; x += 10) {
        const worldX = distance * 0.08 + x;
        const y = skyH - 35 + Math.sin(worldX * 0.004) * 25 + Math.cos(worldX * 0.014) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, skyH);
      ctx.closePath();
      ctx.fill();

      if (lightningTime > 0) {
        const flashAlpha = (lightningTime / lightningMaxTime) * 0.45;
        ctx.fillStyle = `rgba(224, 204, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, w, skyH);
      }
      ctx.restore(); // End Sky Partition

      // 2. WATER PARTITION (h*0.4 → h)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, surfaceY, w, waterH);
      ctx.clip();

      const waterGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
      waterGrad.addColorStop(0, '#091523');
      waterGrad.addColorStop(0.35, '#072439');
      waterGrad.addColorStop(0.75, '#041624');
      waterGrad.addColorStop(1, '#01050a');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, surfaceY, w, waterH);

      toriiGates.forEach((gate) => {
        const gx = gate.worldX - distance * 0.75;
        if (gx > -150 && gx < w + 150) drawToriiGate(gx, surfaceY, 110, gate.scale, true);
      });

      // Moonbeams
      ctx.save();
      const pulse1 = Math.sin(time * 0.015) * 0.4 + 0.6;
      const pulse2 = Math.sin(time * 0.02 + 2.5) * 0.35 + 0.65;
      const pulse3 = Math.sin(time * 0.008 + 4.1) * 0.45 + 0.55;
      const drawRay = (startX, width, opacityPulse) => {
        ctx.save();
        const rayGrad = ctx.createLinearGradient(startX, surfaceY, startX - waterH * 0.35, h);
        rayGrad.addColorStop(0, `rgba(56, 189, 248, ${0.12 * opacityPulse})`);
        rayGrad.addColorStop(0.5, `rgba(14, 165, 233, ${0.05 * opacityPulse})`);
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(startX, surfaceY);
        ctx.lineTo(startX + width, surfaceY);
        ctx.lineTo(startX + width - waterH * 0.35, h);
        ctx.lineTo(startX - waterH * 0.35, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      const rayOffset = -(distance * 0.25) % w;
      drawRay(w * 0.15 + rayOffset, 80, pulse1);
      drawRay(w * 0.15 + rayOffset + w, 80, pulse1);
      drawRay(w * 0.50 + rayOffset, 140, pulse2);
      drawRay(w * 0.50 + rayOffset + w, 140, pulse2);
      drawRay(w * 0.85 + rayOffset, 70, pulse3);
      drawRay(w * 0.85 + rayOffset + w, 70, pulse3);
      ctx.restore();

      // Toro Nagashi underwater light cones
      floatingLanterns.forEach((lat) => {
        const bob = Math.sin(time * lat.bobSpeed + lat.bobOffset) * 4;
        const lx = (lat.worldX - distance * 0.95) % (w + 160);
        const screenX = lx < -80 ? lx + w + 160 : lx;
        const pulse = Math.sin(time * 0.04 + lat.pulseOffset) * 0.2 + 0.8;
        const coneGrad = ctx.createLinearGradient(screenX, surfaceY + bob, screenX - 50, surfaceY + bob + 180);
        coneGrad.addColorStop(0, `rgba(245, 158, 11, ${0.25 * pulse})`);
        coneGrad.addColorStop(0.4, `rgba(217, 119, 6, ${0.08 * pulse})`);
        coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(screenX - 10, surfaceY + bob);
        ctx.lineTo(screenX + 10, surfaceY + bob);
        ctx.lineTo(screenX + 35, surfaceY + bob + 180);
        ctx.lineTo(screenX - 75, surfaceY + bob + 180);
        ctx.closePath();
        ctx.fill();
      });

      // Seabed silhouettes + glowing lilies
      ctx.save();
      ctx.fillStyle = '#030c14';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 15) {
        const sx = distance * 0.4 + x;
        const sy = h - 60 + Math.sin(sx * 0.005) * 15 + Math.cos(sx * 0.015) * 5;
        ctx.lineTo(x, sy);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      for (let x = 40; x < w; x += 140) {
        const sx = distance * 0.4 + x;
        const sy = h - 60 + Math.sin(sx * 0.005) * 15 + Math.cos(sx * 0.015) * 5;
        const pulse = Math.sin(time * 0.03 + x) * 0.3 + 0.7;
        ctx.save();
        ctx.translate(x, sy - 4);
        const flowerGlow = ctx.createRadialGradient(0, -5, 0, 0, -5, 20 * pulse);
        flowerGlow.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        flowerGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flowerGlow;
        ctx.beginPath();
        ctx.arc(0, -5, 20 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, -4);
        ctx.stroke();
        ctx.strokeStyle = `rgba(186, 230, 253, ${0.7 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, -4); ctx.quadraticCurveTo(-4, -12, -6, -10);
        ctx.moveTo(0, -4); ctx.quadraticCurveTo(0, -15, 0, -14);
        ctx.moveTo(0, -4); ctx.quadraticCurveTo(4, -12, 6, -10);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      const drawKelpLayer = (layer, color, heightMultiplier) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        layer.forEach((k) => {
          k.x -= k.speed * scrollSpeed * 0.35;
          if (k.x < -100) k.x = w + 100 + Math.random() * 50;
          const sway = Math.sin(time * k.swaySpeed + k.swayOffset) * 25;
          const startY = h;
          let targetY = h - k.height * heightMultiplier;
          if (targetY < surfaceY + 20) targetY = surfaceY + 20;
          ctx.beginPath();
          ctx.moveTo(k.x - k.width * 0.5, startY);
          ctx.quadraticCurveTo(k.x + sway * 0.5, startY - k.height * 0.5, k.x + sway, targetY);
          ctx.lineTo(k.x + sway + k.width, targetY);
          ctx.quadraticCurveTo(k.x + sway * 0.5 + k.width, startY - k.height * 0.5, k.x + k.width * 0.5, startY);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      };

      drawKelpLayer(kelpFar, '#011c16', 0.8);

      // Spirit Koi
      ctx.save();
      koiFish.forEach((k) => {
        k.x -= (k.speed + scrollSpeed * 0.4);
        if (k.x < -150) k.x = w + 150 + Math.random() * 300;
        const fishY = surfaceY + waterH * k.yOffset;
        const wiggle = Math.sin(time * k.wiggleSpeed + k.wiggleOffset);
        const bob = Math.sin(time * 0.02 + k.wiggleOffset) * k.bobRange;
        const pulse = Math.sin(time * 0.04 + k.pulseOffset) * 0.2 + 0.8;
        ctx.save();
        ctx.translate(k.x, fishY + bob);
        const spiritGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, k.size * 2.2);
        if (k.isWhite) {
          spiritGlow.addColorStop(0, `rgba(56, 189, 248, ${0.35 * pulse})`);
          spiritGlow.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
          spiritGlow.addColorStop(0, `rgba(249, 115, 22, ${0.35 * pulse})`);
          spiritGlow.addColorStop(1, 'rgba(0,0,0,0)');
        }
        ctx.fillStyle = spiritGlow;
        ctx.beginPath();
        ctx.arc(0, 0, k.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = k.isWhite ? '#e2e8f0' : '#f97316';
        ctx.beginPath();
        ctx.ellipse(0, 0, k.size, k.size * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = k.isWhite ? '#0284c7' : '#b91c1c';
        ctx.beginPath();
        ctx.arc(-k.size * 0.3, -k.size * 0.12, k.size * 0.16, 0, Math.PI * 2);
        ctx.arc(k.size * 0.15, k.size * 0.08, k.size * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = k.isWhite ? '#bae6fd' : '#fdba74';
        ctx.beginPath();
        const tx = -k.size;
        ctx.moveTo(tx, 0);
        ctx.quadraticCurveTo(tx - k.size * 0.4, -k.size * 0.3 + wiggle * 8, tx - k.size * 0.8, -k.size * 0.5 + wiggle * 10);
        ctx.lineTo(tx - k.size * 0.65, wiggle * 4);
        ctx.lineTo(tx - k.size * 0.8, k.size * 0.5 + wiggle * 10);
        ctx.quadraticCurveTo(tx - k.size * 0.4, k.size * 0.3 + wiggle * 8, tx, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(k.size * 0.2, -k.size * 0.2);
        ctx.quadraticCurveTo(k.size * 0.1, -k.size * 0.6, -k.size * 0.2, -k.size * 0.55);
        ctx.quadraticCurveTo(0, -k.size * 0.3, k.size * 0.2, -k.size * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(k.size * 0.2, k.size * 0.2);
        ctx.quadraticCurveTo(k.size * 0.1, k.size * 0.6, -k.size * 0.2, k.size * 0.55);
        ctx.quadraticCurveTo(0, k.size * 0.3, k.size * 0.2, k.size * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(k.size * 0.72, -k.size * 0.16, 2, 0, Math.PI * 2);
        ctx.arc(k.size * 0.72, k.size * 0.16, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      drawKelpLayer(kelpMid, '#023c2a', 0.95);
      // (swimming monk + its bubble trail intentionally omitted — game draws the monk)
      drawKelpLayer(kelpNear, '#011c16', 1.15);

      // Plankton
      plankton.forEach((p) => {
        const px = p.x - distance * 0.9;
        if (px < -30) p.x = distance + w + 30 + Math.random() * 50;
        if (px > w + 30) p.x = distance - 30 - Math.random() * 50;
        p.y += p.speedY;
        if (p.y < 30) p.y = waterH - 30;
        if (p.y > waterH - 10) p.y = 30;
        const py = surfaceY + p.y;
        const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.4 + 0.6;
        ctx.save();
        ctx.fillStyle = `rgba(56, 189, 248, ${0.55 * pulse})`;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(px + Math.sin(time * 0.03 + p.pulseOffset) * 6, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Ambient bubbles
      ctx.save();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.38)';
      ctx.lineWidth = 1.2;
      ambientBubbles.forEach((b) => {
        b.y += b.speedY;
        const wobble = Math.sin(time * b.wobbleSpeed + b.wobbleOffset) * b.wobbleRange;
        if (b.y < surfaceY) { b.y = h + Math.random() * 100; b.x = Math.random() * w; }
        const bx = b.x + wobble;
        ctx.beginPath();
        ctx.arc(bx, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(bx - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.18, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      const vignette = ctx.createRadialGradient(w / 2, surfaceY + waterH / 2, waterH * 0.2, w / 2, surfaceY + waterH / 2, waterH * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, surfaceY, w, waterH);

      if (lightningTime > 0) {
        const flashAlpha = (lightningTime / lightningMaxTime) * 0.15;
        ctx.fillStyle = `rgba(224, 204, 255, ${flashAlpha})`;
        ctx.fillRect(0, surfaceY, w, waterH);
      }
      ctx.restore(); // End Water Partition

      // 3. SURFACE & WEATHER — ripples, lanterns, rain
      // Rain ripples (random + rain-impact spawned below)
      if (Math.random() < 0.3) {
        ripples.push({
          x: Math.random() * w,
          y: surfaceY + (Math.random() * 8 - 4),
          radius: 0,
          maxRadius: 10 + Math.random() * 12,
          opacity: 0.7,
          speed: 0.5 + Math.random() * 0.4,
        });
      }
      ctx.save();
      ctx.lineWidth = 1;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.opacity -= 0.018;
        if (r.opacity <= 0) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(186, 230, 253, ${r.opacity})`;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Floating Toro Nagashi lanterns
      ctx.save();
      floatingLanterns.forEach((lat) => {
        lat.worldX -= lat.driftSpeed;
        let lx = (lat.worldX - distance * 0.95) % (w + 160);
        if (lx < -80) lat.worldX = distance + w + 80 + Math.random() * 100;
        if (lx > w + 80) lat.worldX = distance - 80 - Math.random() * 100;
        const screenX = lx < -80 ? lx + w + 160 : lx;
        const bob = Math.sin(time * lat.bobSpeed + lat.bobOffset) * 4;
        const ly = surfaceY + bob;
        const pulse = Math.sin(time * 0.04 + lat.pulseOffset) * 0.25 + 0.75;
        ctx.save();
        ctx.translate(screenX, ly);
        ctx.fillStyle = `rgba(245, 158, 11, ${0.35 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(0, 4, 25 * pulse, 6 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-14, 0, 28, 4);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-10, -18, 20, 18);
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(-11, -19, 2, 20);
        ctx.fillRect(9, -19, 2, 20);
        ctx.fillRect(-11, -21, 22, 3);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -9, 5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      // Falling rain (spawns surface ripples on impact)
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.8;
      rainDrops.forEach((d) => {
        d.y += d.speedY;
        d.x -= d.speedX;
        if (d.y > surfaceY || d.x < -200) {
          if (d.x > 0 && d.x < w) {
            ripples.push({
              x: d.x,
              y: surfaceY + (Math.random() * 6 - 3),
              radius: 0,
              maxRadius: 12 + Math.random() * 10,
              opacity: 0.65,
              speed: 0.6 + Math.random() * 0.3,
            });
          }
          d.y = -Math.random() * 200 - 50;
          d.x = Math.random() * w * 1.6;
        }
        ctx.strokeStyle = `rgba(200, 230, 255, ${d.opacity})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.speedX * 0.45, d.y + d.speedY * 0.45);
        ctx.stroke();
      });
      ctx.restore();
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY — the visual biomes as data. BiomeSystem builds one stateful instance
// per entry and sequences them off the authored schedule. `laneType` declares the
// monk's travel line: 'ground' runs on the floor, 'water' swims at the surface —
// the cave transition ramps between the two so water↔ground never snaps.
//
// The CAVE is NOT in this map: it isn't a destination biome, it's the connective
// transition tunnel inserted between every pair (see CAVE_FACTORY / BiomeSystem).
// ─────────────────────────────────────────────────────────────────────────────
export const VISUAL_BIOMES = {
  rain:    { make: createRainBackground,    laneType: 'ground' },
  sunset:  { make: createSunsetBackground,  laneType: 'ground' },
  village: { make: createVillageBackground, laneType: 'ground' },
  sakura:  { make: createSakuraBackground,  laneType: 'ground' },
  snow:    { make: createSnowBackground,    laneType: 'ground' },
  volcano: { make: createVolcanoBackground, laneType: 'ground' },
  water:   { make: createWaterBackground,   laneType: 'water'  }, // V2 — swim lane
};

// The transition tunnel. Kept separate so BiomeSystem can drive its journey off run
// distance for the spatial scroll-in wipe.
export const CAVE_FACTORY = createCaveBackground;
