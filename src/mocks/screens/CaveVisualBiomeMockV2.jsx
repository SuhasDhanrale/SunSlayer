import { useEffect, useRef } from 'react';
import { PALETTE } from '../../config/constants.js';

export const CaveVisualBiomeMockV2 = ({ state, setState }) => {
  const canvasRef = useRef(null);

  // Configuration settings
  const settings = {
    scrollSpeed: state.scrollSpeed ?? 1.5,
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

    let raf;
    let time = 0;
    let distance = 0; // World x position

    // Expanded Cave Length Parameters
    const preludeLen = 2000;
    const entryDropLen = 600;
    const entryExpandLen = 800;
    const mainCaveLen = 9600; // Expanded to 9600px to spread shrines out!
    const exitNarrowLen = 800;
    const exitRiseLen = 600;
    const totalCaveLen = preludeLen + entryDropLen + entryExpandLen + mainCaveLen + exitNarrowLen + exitRiseLen; // 14400px

    // Generate highly detailed organic background rocks
    // Spaced to cover the longer cave length
    const totalBgRocks = 65;
    const bgRocks = Array.from({ length: totalBgRocks }).map((_, i) => {
      const isCeiling = Math.random() > 0.5;
      const width = 80 + Math.random() * 110;
      const height = 220 + Math.random() * 260;
      
      const numSteps = 8;
      const leftSide = [];
      const rightSide = [];
      
      for (let j = 0; j <= numSteps; j++) {
        const t = j / numSteps;
        const baseWidth = width * (1 - t * 0.9);
        const noiseL = (Math.sin(t * 10) + Math.cos(t * 5)) * 8 + (Math.random() - 0.5) * 6;
        const noiseR = (Math.cos(t * 8) + Math.sin(t * 4)) * 8 + (Math.random() - 0.5) * 6;
        
        leftSide.push({ t, xOffset: -baseWidth / 2 + noiseL });
        rightSide.push({ t, xOffset: baseWidth / 2 + noiseR });
      }

      const cracks = Array.from({ length: 3 }).map(() => ({
        t: 0.2 + Math.random() * 0.6,
        length: 20 + Math.random() * 30,
        angle: (Math.random() - 0.5) * 0.4,
      }));
      
      return {
        worldX: 2200 + i * 180 + Math.random() * 100,
        width,
        height,
        isCeiling,
        leftSide,
        rightSide,
        cracks,
        colorIndex: Math.floor(Math.random() * 3),
      };
    });

    // Lily clusters hanging from the ceiling
    const totalClusters = 28;
    const lilyClusters = Array.from({ length: totalClusters }).map((_, i) => {
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

    // Wall Lanterns (red path lanterns)
    const totalLanterns = 32;
    const wallLanterns = Array.from({ length: totalLanterns }).map((_, i) => ({
      worldX: 3200 + i * 320 + Math.random() * 80,
      yOffset: Math.random() * 60 - 30,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      wobbleOffset: Math.random() * Math.PI * 2,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    // Shrines configuration (SPACED BY 2000px!)
    const shrines = [
      {
        worldX: 3800,
        type: 'single_boulder',
        scale: 2.8,
        liliesCount: 10,
      },
      {
        worldX: 5800,
        type: 'torii_boulder',
        scale: 2.6,
        liliesCount: 8,
      },
      {
        worldX: 7800,
        type: 'split_boulder',
        scale: 2.9,
        liliesCount: 14,
      },
      {
        worldX: 9800,
        type: 'sword_boulder',
        scale: 2.8,
        liliesCount: 12,
      },
      {
        worldX: 11800,
        type: 'lantern_boulder',
        scale: 2.7,
        liliesCount: 9,
      }
    ];

    // Light shafts filtering from ceiling cracks
    const totalLightShafts = 12;
    const lightShafts = Array.from({ length: totalLightShafts }).map((_, i) => ({
      worldX: 3500 + i * 850 + Math.random() * 250,
      width: 70 + Math.random() * 80,
      angle: 0.10 + Math.random() * 0.08,
      opacity: 0.04 + Math.random() * 0.03,
    }));

    // Ambient embers (red and blue glowing particles)
    const ambientEmbers = Array.from({ length: 65 }).map(() => ({
      worldX: 2000 + Math.random() * 11000,
      worldY: 100 + Math.random() * 400,
      size: Math.random() * 2 + 1,
      speedY: (Math.random() - 0.5) * 0.4,
      speedX: (Math.random() - 0.5) * 0.4 - 0.25,
      wobbleOffset: Math.random() * Math.PI * 2,
      isBlue: Math.random() > 0.4,
    }));

    // --- Helper Drawing Functions ---

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
        const seed = Math.sin(cx * 0.05 + i * 1.7);
        const lx = seed * (areaWidth * 0.5);
        const ly = Math.abs(Math.cos(cx * 0.1 + i * 2.3)) * 6 - 3;
        
        const lilyHeight = 12 + Math.abs(seed) * 12;
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

    // --- Main Rendering Loop ---

    const frame = () => {
      time++;
      distance += settings.scrollSpeed;

      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // Dynamic Ceiling Height Profile (Unified definition for all components)
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

      // 1. SKY & OUTDOOR BACKGROUND (Always drawn, physically obscured later)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(1, '#334155');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.3, 40, 0, Math.PI * 2);
      ctx.fill();

      // Distant Parallax Mountains
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 20) {
        const worldX = distance * 0.2 + x;
        const mountainY = groundY - 150 + Math.sin(worldX * 0.003) * 60 + Math.sin(worldX * 0.008) * 30;
        ctx.lineTo(x, mountainY);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // Near Parallax Trees/Hills
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 15) {
        const worldX = distance * 0.4 + x;
        const hillY = groundY - 50 + Math.sin(worldX * 0.005) * 40;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // 2. CAVE WALL PARALLAX (Mid-ground)
      const wallStartX = preludeLen;
      const wallEndX = totalCaveLen;
      
      const screenWallStartX = wallStartX - distance;
      const screenWallEndX = wallEndX - distance;
      
      if (screenWallStartX < w && screenWallEndX > 0) {
        ctx.save();
        
        // Base dark cave back-wall
        ctx.fillStyle = '#040508';
        ctx.beginPath();
        ctx.moveTo(Math.max(screenWallStartX, 0), 0);
        ctx.lineTo(Math.min(screenWallEndX, w), 0);
        ctx.lineTo(Math.min(screenWallEndX, w), groundY);
        ctx.lineTo(Math.max(screenWallStartX, 0), groundY);
        ctx.closePath();
        ctx.fill();

        // Draw Ambient Radial Glows (Wall Lanterns)
        wallLanterns.forEach((lantern) => {
          const lx = lantern.worldX - distance;
          if (lx > -150 && lx < w + 150) {
            const ly = h * 0.45 + lantern.yOffset;
            const pulse = Math.sin(time * 0.05 + lantern.pulseOffset) * 0.25 + 0.75;
            
            const glow = ctx.createRadialGradient(lx, ly + 15, 0, lx, ly + 15, 160 * pulse);
            glow.addColorStop(0, 'rgba(220, 38, 38, 0.14)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(lx, ly + 15, 160 * pulse, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Draw Ambient Radial Glows (Shrines - 350px glow)
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

        // Draw Ambient Radial Glows (Ceiling Lily Clusters)
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

        // Draw Background Rock Formations (Organic Depth Layer)
        bgRocks.forEach((rock) => {
          const rx = rock.worldX - distance * 0.8;
          if (rx > -rock.width && rx < w + rock.width) {
            const cy = getCeilingHeight(rock.worldX);
            let ry1, ry2;
            
            if (rock.isCeiling) {
              ry1 = Math.max(cy, -50);
              ry2 = ry1 + rock.height;
            } else {
              ry1 = groundY;
              ry2 = ry1 - rock.height;
            }
            
            ctx.save();
            const rockGrad = ctx.createLinearGradient(rx - rock.width / 2, 0, rx + rock.width / 2, 0);
            
            let c1 = '#090c12';
            let c2 = '#05070a';
            let c3 = '#010203';
            if (rock.colorIndex === 1) {
              c1 = '#07060e';
              c2 = '#040307';
              c3 = '#000002';
            } else if (rock.colorIndex === 2) {
              c1 = '#050a0a';
              c2 = '#020505';
              c3 = '#000101';
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
                const py = ry1 + rock.leftSide[j].t * rock.height;
                ctx.lineTo(rx + rock.leftSide[j].xOffset, py);
              }
              for (let j = steps; j >= 0; j--) {
                const py = ry1 + rock.rightSide[j].t * rock.height;
                ctx.lineTo(rx + rock.rightSide[j].xOffset, py);
              }
            } else {
              ctx.moveTo(rx + rock.leftSide[0].xOffset, ry1);
              for (let j = 1; j <= steps; j++) {
                const py = ry1 - rock.leftSide[j].t * rock.height;
                ctx.lineTo(rx + rock.leftSide[j].xOffset, py);
              }
              for (let j = steps; j >= 0; j--) {
                const py = ry1 - rock.rightSide[j].t * rock.height;
                ctx.lineTo(rx + rock.rightSide[j].xOffset, py);
              }
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (rock.isCeiling) {
              ctx.moveTo(rx + rock.leftSide[0].xOffset, ry1);
              for (let j = 1; j <= steps; j++) {
                ctx.lineTo(rx + rock.leftSide[j].xOffset, ry1 + rock.leftSide[j].t * rock.height);
              }
            } else {
              ctx.moveTo(rx + rock.leftSide[0].xOffset, ry1);
              for (let j = 1; j <= steps; j++) {
                ctx.lineTo(rx + rock.leftSide[j].xOffset, ry1 - rock.leftSide[j].t * rock.height);
              }
            }
            ctx.stroke();

            // Horizontal sediment cracks
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.lineWidth = 1;
            rock.cracks.forEach((crack) => {
              const cyOffset = rock.isCeiling ? ry1 + crack.t * rock.height : ry1 - crack.t * rock.height;
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

        // Draw Light Shafts
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

        // Draw Shrines (Sacred Boulders - SPACED BY 2000px)
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

        // Draw Wall Lanterns
        wallLanterns.forEach((lantern) => {
          const lx = lantern.worldX - distance;
          if (lx > -50 && lx < w + 50) {
            const sway = Math.sin(time * lantern.wobbleSpeed + lantern.wobbleOffset) * 10;
            const ly = h * 0.45 + lantern.yOffset;
            const pulse = Math.sin(time * 0.05 + lantern.pulseOffset) * 0.25 + 0.75;
            
            ctx.save();
            ctx.translate(lx, ly);
            
            const glow = ctx.createRadialGradient(sway, 15, 0, sway, 15, 60 * pulse);
            glow.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(sway, 15, 60 * pulse, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.quadraticCurveTo(sway * 0.4, -5, sway, 10);
            ctx.stroke();
            
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(sway, 10, 10, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.roundRect(sway - 8, 11, 16, 22, 3);
            ctx.fill();
            
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.roundRect(sway - 4, 15, 8, 14, 2);
            ctx.fill();
            
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sway - 5, 11); ctx.lineTo(sway - 5, 33);
            ctx.moveTo(sway + 5, 11); ctx.lineTo(sway + 5, 33);
            ctx.stroke();
            
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(sway - 1.5, 33, 3, 8);
            
            ctx.restore();
          }
        });

        ctx.restore();
      }

      // 3. PHYSICAL CAVE CEILING (Foreground)
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

      // Ceiling Blue Lilies (Foreground Clusters)
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

      // Embers/Particles inside the cave
      ambientEmbers.forEach((ember) => {
        let ex = ember.worldX - distance;
        
        if (ex < -50) {
          ember.worldX = distance + w + 50 + Math.random() * 100;
          ember.worldY = Math.random() * (groundY - 100) + 50;
          ex = ember.worldX - distance;
        }
        if (ex > w + 100) {
          ember.worldX = distance - 50 - Math.random() * 100;
          ex = ember.worldX - distance;
        }
        
        ember.worldY += ember.speedY;
        ember.worldX += ember.speedX;
        
        const wobble = Math.sin(time * 0.05 + ember.wobbleOffset) * 2.5;
        const cy = getCeilingHeight(ember.worldX);
        
        if (ember.worldY < cy + 10) ember.worldY = cy + 15;
        if (ember.worldY > groundY - 10) ember.worldY = groundY - 15;
        
        ctx.save();
        if (ember.isBlue) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
          ctx.shadowColor = '#b91c1c';
          ctx.shadowBlur = 4;
        }
        ctx.beginPath();
        ctx.arc(ex + wobble, ember.worldY, ember.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. CLEAN FOREGROUND GROUND
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

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [settings.scrollSpeed]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontFamily: 'monospace', textShadow: '1px 1px 2px black' }}>
        Cave Biome V2 (Clean Floor, Physical Transitions, Demon Slayer Aesthetic)
      </div>
    </div>
  );
};
