import { useEffect, useRef } from 'react';
import { PALETTE } from '../../config/constants.js';

export const WaterVisualBiomeMockV2 = ({ state, setState }) => {
  const canvasRef = useRef(null);

  // Configuration settings
  const settings = {
    scrollSpeed: state.scrollSpeed ?? 1.5,
    showRain: state.showRain ?? true,
    showKoi: state.showKoi ?? true,
    showBubbles: state.showBubbles ?? true,
    showLanterns: state.showLanterns ?? true,
  };

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

    // Rain Particle System (Copied from Rainy Forest biome)
    const rainDrops = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 3000 - 500,
      y: Math.random() * 1500 - 500,
      length: Math.random() * 30 + 20,
      speedX: Math.random() * 10 + 15, // Blown hard to the left
      speedY: Math.random() * 20 + 25, // Falling fast
      opacity: Math.random() * 0.35 + 0.15,
    }));

    // Surface Ripple System (spawns when rain hits water)
    let ripples = [];

    // Floating Japanese Paper Lanterns (Toro Nagashi)
    const floatingLanterns = Array.from({ length: 6 }).map((_, i) => ({
      worldX: 300 + i * 400 + Math.random() * 150,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 0.03 + Math.random() * 0.02,
      driftSpeed: 0.3 + Math.random() * 0.2,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    // Submerged Torii Gates (repeat every 2000px)
    const toriiGates = Array.from({ length: 8 }).map((_, i) => ({
      worldX: 500 + i * 2000 + Math.random() * 200,
      scale: 1.6,
      swayOffset: Math.random() * Math.PI * 2,
    }));

    // Bioluminescent Plankton particles (Teal glows in water)
    const plankton = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 500, // randomized within water height later
      size: Math.random() * 2 + 1,
      speedY: (Math.random() - 0.5) * 0.3,
      speedX: (Math.random() - 0.5) * 0.3 - 0.2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    // Rising bubbles
    const ambientBubbles = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 800 + 100,
      size: Math.random() * 3.5 + 1.5,
      speedY: -(Math.random() * 0.8 + 0.3),
      wobbleSpeed: Math.random() * 0.03 + 0.015,
      wobbleRange: Math.random() * 1.5 + 0.5,
      wobbleOffset: Math.random() * Math.PI * 2,
    }));

    // Bubble trail behind swimming monk
    let monkBubbles = [];

    // Swimming Spirit Koi fish (glowing soft orange/white outlines)
    const koiFish = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600 + 400,
      yOffset: 0.2 + Math.random() * 0.5, // percentage of water height
      size: 16 + Math.random() * 14,
      speed: 0.7 + Math.random() * 0.5,
      wiggleSpeed: 0.06 + Math.random() * 0.04,
      wiggleOffset: Math.random() * Math.PI * 2,
      bobRange: 6 + Math.random() * 6,
      isWhite: i % 2 === 0,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    // Parallax Seaweed / Kelp
    const generateKelp = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.5),
        height: Math.random() * varH + minH,
        width: Math.random() * 10 + 8,
        speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.01 + 0.004,
      }));
    };
    const kelpFar = generateKelp(10, 180, 0.5, 200, 120);
    const kelpMid = generateKelp(7, 280, 1.2, 300, 150);
    const kelpNear = generateKelp(4, 420, 2.2, 380, 180);

    // Stars (faded in stormy night)
    const stars = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 400,
      size: Math.random() * 1.2 + 0.4,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Lightning Flash State
    let lightningTime = 0;
    let lightningMaxTime = 0;
    let nextLightningTime = 120 + Math.random() * 300; // frames until next flash

    let raf;
    let time = 0;
    let distance = 0;

    // --- Helper Drawing Functions ---

    // Draws Torii Gate. Underwater part can be tinted.
    const drawToriiGate = (tx, ty, tHeight, scale, isSubmerged) => {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);
      
      // Submerged colors vs sky colors
      if (isSubmerged) {
        ctx.fillStyle = '#0f2434'; // tinted dark teal
        ctx.strokeStyle = '#050f16';
      } else {
        ctx.fillStyle = '#9a3412'; // dark rusty orange
        ctx.strokeStyle = '#5c1e0a';
      }
      ctx.lineWidth = 1.2;

      // Pillars
      ctx.fillRect(-22, 0, 5, tHeight);
      ctx.strokeRect(-22, 0, 5, tHeight);
      ctx.fillRect(17, 0, 5, tHeight);
      ctx.strokeRect(17, 0, 5, tHeight);

      if (!isSubmerged) {
        // Black bases
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-23.5, 0, 8, 4);

        // Kasagi (top curved lintel)
        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.moveTo(-35, -tHeight - 4);
        ctx.quadraticCurveTo(0, -tHeight - 1, 35, -tHeight - 4);
        ctx.lineTo(33, -tHeight);
        ctx.quadraticCurveTo(0, -tHeight + 2, -33, -tHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Top black roof on Kasagi
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-36, -tHeight - 5);
        ctx.quadraticCurveTo(0, -tHeight - 2.5, 36, -tHeight - 5);
        ctx.lineTo(35, -tHeight - 3.5);
        ctx.quadraticCurveTo(0, -tHeight - 1, -35, -tHeight - 3.5);
        ctx.closePath();
        ctx.fill();

        // Lower straight crossbar
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(-28, -tHeight + 8, 56, 4);
        ctx.strokeRect(-28, -tHeight + 8, 56, 4);

        // Center plaque
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-3, -tHeight + 2, 6, 6);
      }

      ctx.restore();
    };

    // --- Main Loop ---

    const frame = () => {
      time++;
      distance += settings.scrollSpeed;

      const w = canvas.width;
      const h = canvas.height;
      
      const skyH = h * 0.4;
      const waterH = h * 0.6;
      const surfaceY = skyH;

      // Update Lightning Flash
      if (lightningTime > 0) {
        lightningTime--;
      } else {
        nextLightningTime--;
        if (nextLightningTime <= 0) {
          // Double-flash trigger
          lightningTime = Math.random() > 0.4 ? 12 : 6; 
          lightningMaxTime = lightningTime;
          nextLightningTime = 350 + Math.random() * 500; // next flash in 6-12s
        }
      }

      // 1. SKY PARTITION (0 to h*0.4)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, skyH);
      ctx.clip();

      // Sky base gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
      if (lightningTime > 0 && (lightningTime > 8 || lightningTime < 4)) {
        // Bright lightning flash color
        skyGrad.addColorStop(0, '#3b2f54'); 
        skyGrad.addColorStop(0.5, '#4c3b70'); 
        skyGrad.addColorStop(1, '#5b4a85');
      } else {
        skyGrad.addColorStop(0, '#02040a'); // Very dark stormy night
        skyGrad.addColorStop(0.6, '#080c16'); 
        skyGrad.addColorStop(1, '#0e111d'); 
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, skyH);

      // Rain-clouds
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

      // Stormy Stars (faded out behind clouds)
      ctx.fillStyle = '#ffffff';
      stars.forEach(star => {
        if (star.y < skyH) {
          const sx = (star.x - distance * 0.03) % (w + 20);
          const screenX = sx < -20 ? sx + w + 40 : sx;
          const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
          ctx.globalAlpha = twinkle * 0.35; // heavily dimmed
          ctx.beginPath();
          ctx.arc(screenX, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // Submerged Torii Gate - TOP HALF (drawn in sky)
      toriiGates.forEach((gate) => {
        const gx = gate.worldX - distance * 0.75;
        if (gx > -150 && gx < w + 150) {
          // Bottom of Top Half sits at surfaceY
          drawToriiGate(gx, surfaceY, 110, gate.scale, false);
          
          // Swaying paper lantern hanging from Torii
          const sway = Math.sin(time * 0.03 + gate.swayOffset) * 8;
          const lx = gx + 2 * gate.scale + sway;
          const ly = surfaceY - 55 * gate.scale + Math.cos(time * 0.03 + gate.swayOffset) * 2;
          const pulse = Math.sin(time * 0.06 + gate.swayOffset) * 0.2 + 0.8;

          // Lantern glow (warm gold)
          const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 50 * pulse);
          glow.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
          glow.addColorStop(0.4, 'rgba(217, 119, 6, 0.25)');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(lx, ly, 50 * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Wooden lantern box
          ctx.fillStyle = '#374151';
          ctx.fillRect(lx - 5, ly - 6, 10, 12);
          ctx.fillStyle = '#fbbf24'; // Yellow core
          ctx.fillRect(lx - 3, ly - 4, 6, 8);
          ctx.fillStyle = '#1e293b'; // Cap/wire
          ctx.fillRect(lx - 6, ly - 8, 12, 2);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx + 2 * gate.scale, surfaceY - 80 * gate.scale);
          ctx.lineTo(lx, ly - 8);
          ctx.stroke();
        }
      });

      // Mountain Parallax in Sky
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

      // Cloud Lightning Overlay (Purple-white glow during flash)
      if (lightningTime > 0) {
        const flashAlpha = (lightningTime / lightningMaxTime) * 0.45;
        ctx.fillStyle = `rgba(224, 204, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, w, skyH);
      }

      ctx.restore(); // End Sky Partition

      // 2. WATER PARTITION (h*0.4 to h)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, surfaceY, w, waterH);
      ctx.clip();

      // Water Base Gradient (Well-lit Rainy Night)
      const waterGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
      waterGrad.addColorStop(0, '#091523');   // luminous slate-teal surface
      waterGrad.addColorStop(0.35, '#072439'); // deep emerald-teal
      waterGrad.addColorStop(0.75, '#041624'); // deep indigo-teal
      waterGrad.addColorStop(1, '#01050a');    // deep abyss black
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, surfaceY, w, waterH);

      // Submerged Torii Gate - BOTTOM HALF (drawn in water)
      toriiGates.forEach((gate) => {
        const gx = gate.worldX - distance * 0.75;
        if (gx > -150 && gx < w + 150) {
          // Bottom half sits at surfaceY and drops down
          drawToriiGate(gx, surfaceY, 110, gate.scale, true);
        }
      });

      // MOONBEAMS / LIGHT SHAFTS (Brighter, beautiful teal-blue moonbeams)
      ctx.save();
      const pulse1 = Math.sin(time * 0.015) * 0.4 + 0.6;
      const pulse2 = Math.sin(time * 0.02 + 2.5) * 0.35 + 0.65;
      const pulse3 = Math.sin(time * 0.008 + 4.1) * 0.45 + 0.55;

      const drawRay = (startX, width, opacityPulse) => {
        ctx.save();
        // Bright cyan-blue glow
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

      // Toro Nagashi surface light shaft reflections (warm yellow rays under water)
      if (settings.showLanterns) {
        floatingLanterns.forEach((lat) => {
          const bob = Math.sin(time * lat.bobSpeed + lat.bobOffset) * 4;
          const lx = (lat.worldX - distance * 0.95) % (w + 160);
          const screenX = lx < -80 ? lx + w + 160 : lx;
          const pulse = Math.sin(time * 0.04 + lat.pulseOffset) * 0.2 + 0.8;

          // Warm orange-yellow glow cone bleeding into the water
          const coneGrad = ctx.createLinearGradient(screenX, surfaceY + bob, screenX - 50, surfaceY + bob + 180);
          coneGrad.addColorStop(0, `rgba(245, 158, 11, ${0.25 * pulse})`); // Amber
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
      }

      // SEABED PARALLAX SILHOUETTES
      ctx.save();
      ctx.fillStyle = '#030c14'; // dark navy silhouette
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

      // Draw glowing blue seabed flowers/lilies
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      for (let x = 40; x < w; x += 140) {
        const sx = distance * 0.4 + x;
        const sy = h - 60 + Math.sin(sx * 0.005) * 15 + Math.cos(sx * 0.015) * 5;
        const pulse = Math.sin(time * 0.03 + x) * 0.3 + 0.7;

        // Seabed lily bulb
        ctx.save();
        ctx.translate(x, sy - 4);
        const flowerGlow = ctx.createRadialGradient(0, -5, 0, 0, -5, 20 * pulse);
        flowerGlow.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        flowerGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flowerGlow;
        ctx.beginPath();
        ctx.arc(0, -5, 20 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Stems & Petals
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

      // KELP LAYERS
      const drawKelpLayer = (layer, color, heightMultiplier) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        layer.forEach((k) => {
          k.x -= k.speed * settings.scrollSpeed * 0.35;
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

      // KOI FISH (Spirit Koi: Luminous outline + glow)
      if (settings.showKoi) {
        ctx.save();
        koiFish.forEach((k) => {
          k.x -= (k.speed + settings.scrollSpeed * 0.4);
          if (k.x < -150) {
            k.x = w + 150 + Math.random() * 300;
          }

          const fishY = surfaceY + waterH * k.yOffset;
          const wiggle = Math.sin(time * k.wiggleSpeed + k.wiggleOffset);
          const bob = Math.sin(time * 0.02 + k.wiggleOffset) * k.bobRange;
          const pulse = Math.sin(time * 0.04 + k.pulseOffset) * 0.2 + 0.8;

          ctx.save();
          ctx.translate(k.x, fishY + bob);

          // Spirit Glow (Blue/Teal or Orange)
          const spiritGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, k.size * 2.2);
          if (k.isWhite) {
            spiritGlow.addColorStop(0, `rgba(56, 189, 248, ${0.35 * pulse})`); // Teal glow
            spiritGlow.addColorStop(1, 'rgba(0,0,0,0)');
          } else {
            spiritGlow.addColorStop(0, `rgba(249, 115, 22, ${0.35 * pulse})`); // Orange glow
            spiritGlow.addColorStop(1, 'rgba(0,0,0,0)');
          }
          ctx.fillStyle = spiritGlow;
          ctx.beginPath();
          ctx.arc(0, 0, k.size * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Fish Body
          ctx.fillStyle = k.isWhite ? '#e2e8f0' : '#f97316';
          ctx.beginPath();
          ctx.ellipse(0, 0, k.size, k.size * 0.36, 0, 0, Math.PI * 2);
          ctx.fill();

          // Fish Spots
          ctx.fillStyle = k.isWhite ? '#0284c7' : '#b91c1c';
          ctx.beginPath();
          ctx.arc(-k.size * 0.3, -k.size * 0.12, k.size * 0.16, 0, Math.PI * 2);
          ctx.arc(k.size * 0.15, k.size * 0.08, k.size * 0.14, 0, Math.PI * 2);
          ctx.fill();

          // Tail fin
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

          // Side Fins
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

          // Eyes
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(k.size * 0.72, -k.size * 0.16, 2, 0, Math.PI * 2);
          ctx.arc(k.size * 0.72, k.size * 0.16, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
        ctx.restore();
      }

      drawKelpLayer(kelpMid, '#023c2a', 0.95);

      // SWIMMING MONK CHARACTER (At the surface)
      ctx.save();
      const mx = w * 0.25;
      const my = surfaceY + Math.sin(time * 0.035) * 8;
      ctx.translate(mx, my);
      ctx.scale(1.2, 1.2);
      ctx.rotate(0.08);

      ctx.fillStyle = PALETTE.ink;
      const swimCycle = time * 0.05;

      ctx.beginPath(); 
      ctx.moveTo(-15, 2); 
      ctx.lineTo(12, 5); 
      ctx.lineTo(16, -18); 
      ctx.lineTo(-12, -18); 
      ctx.fill();

      ctx.beginPath(); 
      ctx.arc(8, -27, 10, 0, Math.PI*2); 
      ctx.fill();

      ctx.strokeStyle = PALETTE.emerald;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4, -22);
      const scarfSway1 = Math.sin(time * 0.08) * 6;
      const scarfSway2 = Math.cos(time * 0.09) * 10;
      ctx.quadraticCurveTo(-30, -14 + scarfSway1, -55, -18 + scarfSway2);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.strokeStyle = PALETTE.ink;
      const kick1 = Math.sin(swimCycle) * 0.48 - 0.2;
      const kick2 = Math.sin(swimCycle + Math.PI) * 0.48 - 0.2;

      ctx.save();
      ctx.translate(-10, -5);
      ctx.rotate(Math.PI * 0.5 + kick1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
      ctx.translate(0, 16);
      ctx.rotate(-0.3 + Math.abs(kick1) * 0.4);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(-6, -8);
      ctx.rotate(Math.PI * 0.5 + kick2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
      ctx.translate(0, 16);
      ctx.rotate(-0.3 + Math.abs(kick2) * 0.4);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
      ctx.restore();

      ctx.lineWidth = 3.5;
      const armAngle = Math.sin(swimCycle) * 0.35 + 0.1;
      ctx.save();
      ctx.translate(5, -12);
      ctx.rotate(armAngle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 10); ctx.stroke();
      ctx.restore();

      ctx.restore();

      // Monk Bubbles
      if (settings.showBubbles && time % 6 === 0) {
        monkBubbles.push({
          x: mx - 15,
          y: my - 12,
          size: Math.random() * 2.2 + 1,
          speedX: -(Math.random() * 1.5 + 2.5),
          speedY: -(Math.random() * 0.8 + 0.3),
          wobbleOffset: Math.random() * Math.PI * 2,
          opacity: 0.85,
        });
      }

      if (settings.showBubbles) {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 1;
        for (let i = monkBubbles.length - 1; i >= 0; i--) {
          const mb = monkBubbles[i];
          mb.x += mb.speedX;
          mb.y += mb.speedY + Math.sin(time * 0.08 + mb.wobbleOffset) * 0.6;
          mb.opacity -= 0.016;

          if (mb.opacity <= 0 || mb.x < -20 || mb.y < surfaceY) {
            monkBubbles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = mb.opacity;
          ctx.beginPath();
          ctx.arc(mb.x, mb.y, mb.size, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mb.x - mb.size * 0.3, mb.y - mb.size * 0.3, mb.size * 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      drawKelpLayer(kelpNear, '#011c16', 1.15);

      // Bioluminescent Plankton
      plankton.forEach((p) => {
        let px = p.x - distance * 0.9;
        if (px < -30) p.x = distance + w + 30 + Math.random() * 50;
        if (px > w + 30) p.x = distance - 30 - Math.random() * 50;

        p.y += p.speedY;
        // Keep in water limits
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

      // Ambient Bubbles
      if (settings.showBubbles) {
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.38)';
        ctx.lineWidth = 1.2;

        ambientBubbles.forEach((b) => {
          b.y += b.speedY;
          const wobble = Math.sin(time * b.wobbleSpeed + b.wobbleOffset) * b.wobbleRange;
          
          if (b.y < surfaceY) {
            b.y = h + Math.random() * 100;
            b.x = Math.random() * w;
          }

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
      }

      // VIGNETTE UNDERWATER
      const vignette = ctx.createRadialGradient(w/2, surfaceY + waterH/2, waterH*0.2, w/2, surfaceY + waterH/2, waterH*0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, surfaceY, w, waterH);

      // Brief underwater lightning illuminate
      if (lightningTime > 0) {
        const flashAlpha = (lightningTime / lightningMaxTime) * 0.15;
        ctx.fillStyle = `rgba(224, 204, 255, ${flashAlpha})`;
        ctx.fillRect(0, surfaceY, w, waterH);
      }

      ctx.restore(); // End Water Partition

      // ===========================
      // 3. SURFACE & WEATHER LAYER (ripples, rain, floating lanterns)
      // ===========================

      // Update & Draw Rain ripples
      if (settings.showRain) {
        ctx.save();
        
        // Occasionally spawn ripples randomly
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

        ctx.lineWidth = 1;
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.radius += r.speed;
          r.opacity -= 0.018;

          if (r.opacity <= 0) {
            ripples.splice(i, 1);
            continue;
          }

          ctx.strokeStyle = `rgba(186, 230, 253, ${r.opacity})`;
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.25, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Floating Toro Nagashi Paper Lanterns
      if (settings.showLanterns) {
        ctx.save();
        floatingLanterns.forEach((lat) => {
          // Drift left slowly
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

          // Surface Reflection under lantern
          ctx.fillStyle = `rgba(245, 158, 11, ${0.35 * pulse})`;
          ctx.beginPath();
          ctx.ellipse(0, 4, 25 * pulse, 6 * pulse, 0, 0, Math.PI * 2);
          ctx.fill();

          // Lantern wooden base
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-14, 0, 28, 4);

          // Glowing paper box body
          ctx.fillStyle = '#fbbf24'; // Yellow-gold
          ctx.fillRect(-10, -18, 20, 18);

          // Dark wooden frames
          ctx.fillStyle = '#3f3f46';
          ctx.fillRect(-11, -19, 2, 20); // Left pillar
          ctx.fillRect(9, -19, 2, 20);  // Right pillar
          ctx.fillRect(-11, -21, 22, 3); // Roof

          // Core warm candle glow
          ctx.fillStyle = '#fef08a'; // Bright yellow core
          ctx.beginPath();
          ctx.arc(0, -9, 5 * pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
        ctx.restore();
      }

      // Draw Falling Raindrops (Copied from Rainy Forest biome style)
      if (settings.showRain) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.8;

        rainDrops.forEach((d) => {
          d.y += d.speedY;
          d.x -= d.speedX;

          // Wrap/collide at surfaceY
          if (d.y > surfaceY || d.x < -200) {
            // Spawn a ripple at the surface where it hit!
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

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [settings.scrollSpeed, settings.showRain, settings.showKoi, settings.showBubbles, settings.showLanterns]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#02040a' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontFamily: 'monospace', textShadow: '1px 1px 2px black' }}>
        Water Biome V2 (Rainy Night, Toro Nagashi Lanterns, Submerged Torii)
      </div>
    </div>
  );
};
