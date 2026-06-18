import React, { useEffect, useRef } from 'react';

export const IntroSequenceMock = () => {
  const canvasRef = useRef(null);

  const stateRef = useRef({
    time: 0,
    sisterY: 0,
    slayerY: 0,
    eyesAlpha: 0,
    glowAlpha: 0,
    fadeAlpha: 0,
    textProgress: 0,
    lightningAlpha: 0,
    lastLightning: 0,
    shake: 0,
    shrineGlow: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 600) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- PATTERNS ---
    const patterns = {};
    const p1 = document.createElement('canvas');
    p1.width = 12; p1.height = 12;
    const c1 = p1.getContext('2d');
    c1.fillStyle = '#065f46'; c1.fillRect(0,0,12,12);
    c1.fillStyle = '#1c1917'; c1.fillRect(0, 0, 6, 6); c1.fillRect(6, 6, 6, 6);
    patterns['checkered_green'] = ctx.createPattern(p1, 'repeat');

    // --- RAINY FOREST DATA ---
    const rainDrops = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 3000 - 500,
      y: Math.random() * 1500 - 500,
      length: Math.random() * 30 + 20,
      speedX: Math.random() * 10 + 15,
      speedY: Math.random() * 20 + 25,
      opacity: Math.random() * 0.35 + 0.15
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
    const layer3 = generateBamboo(25, 90, 4, 8, 0.8);
    const layer2 = generateBamboo(15, 150, 10, 18, 1.8);
    const layer1 = generateBamboo(8, 280, 24, 36, 3.5);

    const clouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 45,
      width: Math.random() * 180 + 130,
      height: 12,
      speed: 0.2 + Math.random() * 0.15
    }));

    // --- PARTICLE SYSTEM ---
    const particles = Array.from({ length: 100 }).map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      color: '',
      alpha: 0,
      life: 0,
      maxLife: 0,
      type: ''
    }));

    const spawnParticle = (x, y, color, type) => {
      const p = particles.find(p => p.life <= 0);
      if (!p) return;
      p.x = x;
      p.y = y;
      p.type = type;
      if (type === 'water') {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 1.0;
        p.size = Math.random() * 4 + 2;
        p.maxLife = Math.random() * 25 + 15;
      } else {
        p.vx = (Math.random() - 0.5) * 6;
        p.vy = (Math.random() - 0.5) * 6 - 2;
        p.size = Math.random() * 3 + 1.5;
        p.maxLife = Math.random() * 20 + 10;
      }
      p.color = color;
      p.alpha = 1;
      p.life = p.maxLife;
    };

    let raf;
    let startTime = Date.now();

    // --- DRAWING HELPERS ---

    const drawBambooLayer = (layer, stalkColor, leafColor, heightFactor, time) => {
      const h = canvas.height;
      const w = canvas.width;
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
        ctx.moveTo(b.x, h);
        ctx.quadraticCurveTo(b.x - 10, h - stalkHeight * 0.5, b.x + maxSway, startY);
        ctx.lineTo(b.x + b.w + maxSway, startY);
        ctx.quadraticCurveTo(b.x + b.w - 10, h - stalkHeight * 0.5, b.x + b.w, h);
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

    const drawBlueSpiderLily = (lx, ly) => {
      ctx.save();
      // Stem
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(lx + (Math.random() - 0.5) * 4, ly - 8, lx, ly - 16);
      ctx.stroke();

      // Curved petals & stamens
      const px = lx;
      const py = ly - 16;
      ctx.strokeStyle = '#3b82f6'; // Bright blue
      ctx.lineWidth = 0.8;
      // Draw 6 fine radiating curly petals
      for (let i = 0; i < 6; i++) {
        const petalAngle = -Math.PI * 0.9 + (i * Math.PI * 0.8) / 5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const cp1x = px + Math.cos(petalAngle) * 6;
        const cp1y = py + Math.sin(petalAngle) * 6 - 4;
        const endX = px + Math.cos(petalAngle) * 12 + Math.cos(petalAngle + 0.3) * 4;
        const endY = py + Math.sin(petalAngle) * 12 + Math.sin(petalAngle + 0.3) * 4;
        ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
        ctx.stroke();

        // Fine curly stamen extending even further
        ctx.save();
        ctx.strokeStyle = '#60a5fa'; // Lighter cyan blue
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const stamenAngle = petalAngle + 0.05;
        const scp1x = px + Math.cos(stamenAngle) * 10;
        const scp1y = py + Math.sin(stamenAngle) * 10 - 8;
        const sendX = px + Math.cos(stamenAngle) * 18;
        const sendY = py + Math.sin(stamenAngle) * 18 - 6;
        ctx.quadraticCurveTo(scp1x, scp1y, sendX, sendY);
        ctx.stroke();

        // Tiny anther at the end of the stamen
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.arc(sendX, sendY, 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    const drawBoulderShrine = (x, y, scale, glowAlpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      
      // Sacred Shrine Glow
      if (glowAlpha > 0) {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 45 * glowAlpha;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 * glowAlpha})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, -10, 75, Math.PI, 0);
        ctx.stroke();

        const glowGrad = ctx.createRadialGradient(0, -35, 5, 0, -35, 120);
        glowGrad.addColorStop(0, `rgba(56, 189, 248, ${0.5 * glowAlpha})`);
        glowGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.15 * glowAlpha})`);
        glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, -35, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- TORII GATE ---
      // Left pillar gradient (dark crimson to almost black at bottom)
      const leftPillarGrad = ctx.createLinearGradient(-95, -100, -95, 0);
      leftPillarGrad.addColorStop(0, '#991b1b');
      leftPillarGrad.addColorStop(0.7, '#7f1d1d');
      leftPillarGrad.addColorStop(1, '#450a0a');

      const rightPillarGrad = ctx.createLinearGradient(85, -100, 85, 0);
      rightPillarGrad.addColorStop(0, '#991b1b');
      rightPillarGrad.addColorStop(0.7, '#7f1d1d');
      rightPillarGrad.addColorStop(1, '#450a0a');

      // Pillars with a slight taper
      ctx.fillStyle = leftPillarGrad;
      ctx.beginPath();
      ctx.moveTo(-94, -90);
      ctx.lineTo(-88, -90);
      ctx.lineTo(-86, 0);
      ctx.lineTo(-96, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rightPillarGrad;
      ctx.beginPath();
      ctx.moveTo(86, -90);
      ctx.lineTo(92, -90);
      ctx.lineTo(94, 0);
      ctx.lineTo(84, 0);
      ctx.closePath();
      ctx.fill();

      // Stone bases (Daiishi/Kamebara) at the bottom of the pillars
      ctx.fillStyle = '#1e293b'; // Slate gray base
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-99, -2, 12, 6, 2);
      ctx.roundRect(85, -2, 12, 6, 2);
      ctx.fill();
      ctx.stroke();

      // Secondary crossbar (Nuki)
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-98, -80, 196, 7);
      // Nuki wood end caps (Kusabi) protruding on sides
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-102, -80, 4, 7);
      ctx.fillRect(98, -80, 4, 7);

      // Top Crossbars (Kasagi and Shimaki)
      // Curved Kasagi curving upwards at the tips
      const kasagiGrad = ctx.createLinearGradient(0, -98, 0, -88);
      kasagiGrad.addColorStop(0, '#450a0a');
      kasagiGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = kasagiGrad;
      ctx.beginPath();
      ctx.moveTo(-110, -96);
      ctx.quadraticCurveTo(0, -91, 110, -96); // top curve
      ctx.lineTo(112, -102); // right tip
      ctx.quadraticCurveTo(0, -97, -112, -102); // left tip
      ctx.closePath();
      ctx.fill();

      // Support strut (Gakuzuka) in the center between Nuki and Shimaki
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-6, -88, 12, 8);
      // Faint gold inscription/plaque on Gakuzuka
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3, -86, 6, 5);

      // --- GIANT SACRED BOULDER ---
      ctx.save();
      const boulderGrad = ctx.createLinearGradient(-70, -70, 70, 10);
      boulderGrad.addColorStop(0, '#334155'); // slate 700
      boulderGrad.addColorStop(0.5, '#1e293b'); // slate 800
      boulderGrad.addColorStop(1, '#0f172a'); // slate 900
      
      // Irregular polygon for the boulder
      ctx.fillStyle = boulderGrad;
      ctx.beginPath();
      ctx.moveTo(-75, 5);
      ctx.quadraticCurveTo(-85, -35, -65, -60);
      ctx.quadraticCurveTo(-45, -78, 0, -80);
      ctx.quadraticCurveTo(45, -78, 68, -58);
      ctx.quadraticCurveTo(82, -35, 75, 5);
      ctx.closePath();
      ctx.fill();

      // Draw rock texture lines and cracks (3D facets)
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      // Left crack facet
      ctx.moveTo(-65, -60);
      ctx.lineTo(-35, -40);
      ctx.lineTo(-45, -10);
      // Right crack facet
      ctx.moveTo(0, -80);
      ctx.lineTo(15, -45);
      ctx.lineTo(35, -20);
      // Top highlight facet
      ctx.moveTo(0, -80);
      ctx.lineTo(-25, -65);
      ctx.lineTo(-35, -40);
      ctx.stroke();

      // Moss patches (layered shapes of dark and light green)
      const drawMoss = (mx, my, r) => {
        ctx.save();
        const mossGrad = ctx.createRadialGradient(mx, my, r * 0.1, mx, my, r);
        mossGrad.addColorStop(0, '#047857'); // emerald 700
        mossGrad.addColorStop(0.8, '#064e3b'); // emerald 900
        mossGrad.addColorStop(1, 'rgba(6, 78, 59, 0)');
        ctx.fillStyle = mossGrad;
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawMoss(-45, -62, 16);
      drawMoss(35, -68, 12);
      drawMoss(-10, -74, 14);
      drawMoss(55, -35, 10);

      // Shimenawa (sacred rope) - BRAIDED!
      ctx.save();
      const ropePoints = [];
      const ropeSteps = 18;
      for (let i = 0; i <= ropeSteps; i++) {
        const t = i / ropeSteps;
        const rx = -68 + 136 * t;
        const ry = -32 + 18 * Math.sin(t * Math.PI) - 5 * t; // sagging curve
        ropePoints.push({ x: rx, y: ry });
      }

      // Draw the braids
      for (let i = 0; i < ropePoints.length; i++) {
        const pt = ropePoints[i];
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(0.15 * Math.sin((i / ropeSteps) * Math.PI * 2));
        
        // Draw braided ellipse
        const ellipseGrad = ctx.createLinearGradient(-4, -6, 4, 6);
        ellipseGrad.addColorStop(0, '#fef08a'); // straw yellow
        ellipseGrad.addColorStop(0.5, '#d97706'); // gold brown
        ellipseGrad.addColorStop(1, '#78350f'); // shadow brown
        ctx.fillStyle = ellipseGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4.5, Math.PI/4 + (i * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Hanging Shide (paper zigzags) - premium detailed folding
      const drawPremiumShide = (sx, sy) => {
        ctx.save();
        ctx.fillStyle = '#f4f4f5';
        ctx.strokeStyle = '#d4d4d8';
        ctx.lineWidth = 0.5;
        
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 4, sy + 7);
        ctx.lineTo(sx + 1, sy + 7);
        ctx.lineTo(sx - 5, sy + 17);
        ctx.lineTo(sx, sy + 17);
        ctx.lineTo(sx - 4, sy + 25);
        ctx.lineTo(sx + 2, sy + 25);
        ctx.lineTo(sx - 1, sy + 32);
        ctx.lineTo(sx + 3, sy + 32);
        ctx.lineTo(sx + 1, sy + 24);
        ctx.lineTo(sx + 5, sy + 24);
        ctx.lineTo(sx + 1, sy + 15);
        ctx.lineTo(sx + 6, sy + 15);
        ctx.lineTo(sx + 2, sy + 6);
        ctx.lineTo(sx + 5, sy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      
      // Hanging straw tassels (Tsusa) between shide
      const drawTassel = (tx, ty) => {
        ctx.save();
        const tasselGrad = ctx.createLinearGradient(tx - 3, ty, tx + 3, ty + 18);
        tasselGrad.addColorStop(0, '#d97706');
        tasselGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = tasselGrad;
        ctx.beginPath();
        ctx.moveTo(tx - 2, ty);
        ctx.lineTo(tx + 2, ty);
        ctx.lineTo(tx + 5, ty + 18);
        ctx.lineTo(tx - 5, ty + 18);
        ctx.closePath();
        ctx.fill();
        
        // Wrap band
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - 3, ty + 2, 6, 2.5);
        ctx.restore();
      };

      drawTassel(-42, -26);
      drawPremiumShide(-28, -25);
      drawTassel(-10, -22);
      drawPremiumShide(10, -22);
      drawTassel(30, -24);
      drawPremiumShide(45, -26);

      ctx.restore(); // Restore boulder save

      // --- SMALL WOODEN HOKORA SHRINE IN FRONT OF BOULDER ---
      ctx.save();
      ctx.translate(0, 12);
      
      // Shadow under shrine
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Base stone platform
      ctx.fillStyle = '#475569';
      ctx.fillRect(-22, 5, 44, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-20, 0, 40, 5);

      // Shrine wood box body
      const woodGrad = ctx.createLinearGradient(-15, -15, 15, 0);
      woodGrad.addColorStop(0, '#b45309'); // warm amber wood
      woodGrad.addColorStop(0.5, '#78350f');
      woodGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(-15, -20, 30, 20);
      
      // Pillars (Sanctuary side pillars)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-17, -20, 3, 20);
      ctx.fillRect(14, -20, 3, 20);
      
      // Doors (two folding wood panels)
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Gold latch/lock on doors
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2.5, -11, 5, 4);

      // Sloping wood roof
      const roofGrad = ctx.createLinearGradient(0, -32, 0, -20);
      roofGrad.addColorStop(0, '#334155'); // dark slate
      roofGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = roofGrad;
      ctx.beginPath();
      ctx.moveTo(-25, -20);
      ctx.lineTo(25, -20);
      ctx.lineTo(18, -32);
      ctx.lineTo(-18, -32);
      ctx.closePath();
      ctx.fill();
      
      // Roof trim ridge (Ridgepole / Chigi decoration)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-18, -34, 36, 3);
      // Curved decorative pieces (Chigi) crossing at the top ends
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-16, -32); ctx.lineTo(-20, -37);
      ctx.moveTo(16, -32); ctx.lineTo(20, -37);
      ctx.stroke();
      
      ctx.restore();
      
      // --- STONE LANTERN (TORO) ---
      ctx.save();
      ctx.translate(-112, 10);
      
      // Base (Kiso)
      ctx.fillStyle = '#334155';
      ctx.fillRect(-10, -3, 20, 4);
      // Pedestal Column (Sao)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, -24, 8, 21);
      // Center Platform (Chudai)
      ctx.fillStyle = '#334155';
      ctx.fillRect(-11, -30, 22, 6);
      
      // Light Chamber (Hibukuro)
      ctx.fillStyle = '#0f172a'; // dark chamber interior
      ctx.fillRect(-8, -44, 16, 14);
      
      if (glowAlpha > 0) {
        ctx.save();
        const lightGlow = ctx.createRadialGradient(0, -37, 2, 0, -37, 28);
        lightGlow.addColorStop(0, `rgba(253, 224, 71, ${0.9 * glowAlpha})`);
        lightGlow.addColorStop(0.3, `rgba(251, 191, 36, ${0.6 * glowAlpha})`);
        lightGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = lightGlow;
        ctx.beginPath();
        ctx.arc(0, -37, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Glowing chamber window slits
        ctx.fillStyle = `rgba(254, 240, 138, ${0.95 * glowAlpha})`;
        ctx.fillRect(-5, -41, 3, 8);
        ctx.fillRect(2, -41, 3, 8);
      }
      
      // Sloped stone roof (Kasa)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-14, -44);
      ctx.lineTo(14, -44);
      ctx.lineTo(9, -53);
      ctx.lineTo(-9, -53);
      ctx.closePath();
      ctx.fill();

      // Top Jewel (Hobi)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -56, 3, 0, Math.PI*2);
      ctx.fill();
      
      ctx.restore();

      // --- BLUE SPIDER LILIES ---
      drawBlueSpiderLily(-108, 10);
      drawBlueSpiderLily(-100, 10);
      drawBlueSpiderLily(-84, 10);
      drawBlueSpiderLily(-76, 10);
      drawBlueSpiderLily(74, 10);
      drawBlueSpiderLily(84, 10);
      drawBlueSpiderLily(-40, 10);
      drawBlueSpiderLily(38, 10);
      
      ctx.restore();
    };

    const drawTreeCanopy = (ctx, w, h, time) => {
      ctx.save();
      // Main branch starting from top-left (0, 0)
      ctx.fillStyle = '#0f172a'; // Dark slate/black wood silhouette
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;

      // Draw thick curved branch
      ctx.beginPath();
      ctx.moveTo(-20, -20);
      ctx.quadraticCurveTo(w * 0.2, h * 0.08, w * 0.35, h * 0.15);
      ctx.quadraticCurveTo(w * 0.2, h * 0.1, -20, h * 0.05);
      ctx.closePath();
      ctx.fill();

      // Sub-branches
      const drawSubBranch = (bx, by, tx, ty, widthVal) => {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = widthVal;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + (tx - bx) * 0.5, by + (ty - by) * 0.8, tx, ty);
        ctx.stroke();
      };
      
      drawSubBranch(w * 0.15, h * 0.06, w * 0.18, h * 0.2, 5);
      drawSubBranch(w * 0.28, h * 0.11, w * 0.32, h * 0.25, 3);

      // Draw cluster of pine needles/leaves around the branch tips
      const drawLeafCluster = (cx, cy, radius, count) => {
        ctx.fillStyle = '#020617'; // Shadow base
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < count; i++) {
          ctx.save();
          ctx.translate(cx + (Math.random() - 0.5) * radius * 1.4, cy + (Math.random() - 0.5) * radius * 1.4);
          ctx.rotate(Math.random() * Math.PI);
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      };

      drawLeafCluster(w * 0.18, h * 0.2, 22, 15);
      drawLeafCluster(w * 0.32, h * 0.25, 25, 20);
      drawLeafCluster(w * 0.35, h * 0.15, 18, 12);
      drawLeafCluster(w * 0.08, h * 0.1, 30, 25);
      
      ctx.restore();
    };

    const drawBox = (ctx, bx, by, scale) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(scale, scale);
      
      // Wooden box body
      ctx.fillStyle = '#451a03'; // Dark brown wood
      ctx.fillRect(-6, -18, 12, 20);
      
      // Gold brass corner brackets
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, -18, 3, 3);
      ctx.fillRect(3, -18, 3, 3);
      ctx.fillRect(-6, 0, 3, 2);
      ctx.fillRect(3, 0, 3, 2);
      
      // Iron strap band
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -9, 12, 2);
      
      // Door latch
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(4, -10, 1.5, 3);
      
      ctx.restore();
    };

    const drawSlayer = (x, y, scale, elapsed) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const currentPattern = patterns['checkered_green'] || '#065f46';

      if (elapsed < 4.5) {
        // --- SITTING/HUDDLING POSE ---
        ctx.translate(0, 10);
        
        // Folded legs
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.stroke();

        // Chest
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(-7, 8); ctx.lineTo(7, 8);
        ctx.lineTo(5, -12); ctx.lineTo(-7, -12);
        ctx.closePath(); ctx.fill();

        // Haori
        ctx.fillStyle = currentPattern;
        ctx.fillRect(-7, -11, 14, 15);

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(-1, -17, 5, 0, Math.PI * 2); ctx.fill();

        // Hair
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.arc(-1, -18, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(-4, -21, 1.8, 0, Math.PI*2);
        ctx.arc(2, -21, 1.5, 0, Math.PI*2);
        ctx.fill();

      } else if (elapsed < 5.5) {
        // --- PROTECTIVE DEFENDING STANCE ---
        // Lunging legs
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-12, 10);
        ctx.moveTo(0, 0); ctx.lineTo(14, 10);
        ctx.stroke();

        // Torso lunging right
        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.15);
        ctx.beginPath();
        ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
        ctx.lineTo(6, -20); ctx.lineTo(-8, -20);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -17, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(3, -25, 5, 0, Math.PI * 2); ctx.fill();

        // Spiky Hair
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.moveTo(3 - 6, -25);
        ctx.lineTo(3 - 8, -31);
        ctx.lineTo(3 - 4, -29);
        ctx.lineTo(3 - 5, -34);
        ctx.lineTo(3, -31);
        ctx.lineTo(3 + 4, -34);
        ctx.lineTo(3 + 3, -29);
        ctx.lineTo(3 + 7, -28);
        ctx.lineTo(3 + 5, -24);
        ctx.lineTo(3 - 1, -26);
        ctx.fill();

        // Black sword with glowing outline
        ctx.strokeStyle = '#22d3ee'; // Cyan glow
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(28, -31);
        ctx.stroke();

        ctx.strokeStyle = '#020617'; // Katana blade metal
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(27, -30);
        ctx.stroke();

        // Extending left hand back to shield Sister
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-6, -14);
        ctx.lineTo(-18, -8);
        ctx.stroke();

      } else if (elapsed < 6.0) {
        // --- REACHING/CATCHING POSE ---
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-10, 10);
        ctx.moveTo(0, 0); ctx.lineTo(15, 10);
        ctx.stroke();

        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.25);
        ctx.beginPath();
        ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
        ctx.lineTo(6, -20); ctx.lineTo(-8, -20);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -17, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(6, -23, 5, 0, Math.PI * 2); ctx.fill();

        // Hair
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.arc(6, -24, 6, 0, Math.PI * 2); ctx.fill();

        // Arms reaching right
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.quadraticCurveTo(20, -10, 24, -2);
        ctx.stroke();

      } else if (elapsed < 11.5) {
        // --- KNEELING AND CATCHING/HOLDING SISTER ---
        ctx.translate(0, 8);

        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(10, 5); ctx.stroke();

        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.25);
        ctx.beginPath();
        ctx.moveTo(-8, 3); ctx.lineTo(8, 3);
        ctx.lineTo(6, -22); ctx.lineTo(-8, -22);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -18, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(4, -20, 5, 0, Math.PI * 2); ctx.fill();

        // Hair
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.arc(4, -20, 6, 0, Math.PI * 2); ctx.fill();

        // Arm holding sister
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(10, -8, 12, -2);
        ctx.stroke();

      } else if (elapsed < 14.5) {
        // --- STANDING CARRYING THE BOX ---
        ctx.translate(0, 0);

        // Legs standing
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(-4, 11);
        ctx.moveTo(4, 0); ctx.lineTo(4, 11);
        ctx.stroke();

        // Torso straight
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
        ctx.lineTo(6, -23); ctx.lineTo(-6, -23);
        ctx.closePath(); ctx.fill();

        // Haori
        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -20, 16, 20);

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -28, 5, 0, Math.PI * 2); ctx.fill();

        // Hair
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.arc(0, -29, 6, 0, Math.PI * 2); ctx.fill();

        // Wood box on back
        drawBox(ctx, -10, -8, 1.0);

      } else {
        // --- NORMAL COMBAT READY STANCE (START GAME) ---
        // Wide athletic legs
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-12, 10);
        ctx.moveTo(0, 0); ctx.lineTo(12, 10);
        ctx.stroke();

        // Torso lunged forward
        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.12);
        ctx.beginPath();
        ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
        ctx.lineTo(6, -20); ctx.lineTo(-8, -20);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -17, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(2, -25, 5, 0, Math.PI * 2); ctx.fill();

        // Hair
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.arc(2, -26, 6, 0, Math.PI * 2); ctx.fill();

        // Katana held forward
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(8, -15);
        ctx.lineTo(26, -22);
        ctx.stroke();

        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(8, -15);
        ctx.lineTo(25, -21);
        ctx.stroke();

        // Wood box on back
        drawBox(ctx, -11, -10, 1.0);
      }

      ctx.restore();
    };

    const drawSister = (x, y, scale, elapsed, stateY) => {
      ctx.save();

      if (elapsed < 4.5) {
        // --- SITTING SISTER ---
        ctx.translate(x, y + 12);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.moveTo(-6, -15); ctx.lineTo(6, -15);
        ctx.lineTo(8, 8); ctx.lineTo(-8, 8);
        ctx.fill();

        ctx.fillStyle = '#dc2626'; // Obi
        ctx.fillRect(-7, -8, 14, 3.5);

        ctx.fillStyle = '#1c1917'; // Hair
        ctx.fillRect(-8, -18, 16, 20);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -18, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(0, -20, 6, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ec4899'; // Hair tips
        ctx.fillRect(-8, 0, 16, 4);

      } else if (elapsed < 5.5) {
        // --- FLOATING/LIFTED SISTER (CURSED) ---
        ctx.translate(x, y + stateY);
        ctx.scale(scale, scale);

        // Red aura sphere
        const grad = ctx.createRadialGradient(0, -10, 0, 0, -10, 25);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
        grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.3)');
        grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, -10, 25, 0, Math.PI * 2); ctx.fill();

        // Kimono hanging
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.moveTo(-6, -18); ctx.lineTo(6, -18);
        ctx.lineTo(7, 10); ctx.lineTo(-7, 10);
        ctx.fill();

        ctx.fillStyle = '#dc2626'; // Obi
        ctx.fillRect(-6.5, -9, 13, 3);

        // Head tilted back
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -22, 5.5, 0, Math.PI * 2); ctx.fill();

        // Bamboo Mouthpiece (Sister Detail!)
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-4, -20, 8, 2);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-4, -20, 8, 2);

        // Long wild hair
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.ellipse(0, -18, 7.5, 12, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-7.5, -12, 15, 20);

        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-7.5, 6, 15, 5);

      } else if (elapsed < 6.0) {
        // --- FAINTING & FALLING FLAT ---
        ctx.translate(x + 10, y + stateY + 14);
        ctx.scale(scale, scale);
        ctx.rotate(Math.PI * 0.45); // Tilted flat

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.moveTo(-6, -15); ctx.lineTo(6, -15);
        ctx.lineTo(7, 8); ctx.lineTo(-7, 8);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-6.5, -8, 13, 3);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -19, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(0, -20, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-7, -15, 14, 20);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-7, 3, 14, 4);

      } else if (elapsed < 11.5) {
        // --- LYING DOWN ON SLAYER'S LAP (CAUGHT) ---
        ctx.translate(x - 12, y + 15);
        ctx.scale(scale, scale);
        ctx.rotate(-Math.PI * 0.35);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.moveTo(-6, -15); ctx.lineTo(6, -15);
        ctx.lineTo(7, 8); ctx.lineTo(-7, 8);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-6.5, -8, 13, 3);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -19, 5, 0, Math.PI * 2); ctx.fill();

        // Bamboo Mouthpiece
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-3.5, -17.5, 7, 1.8);

        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(0, -20, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-7, -15, 14, 20);

        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-7, 3, 14, 4);
      }

      ctx.restore();
    };

    const drawDemonEyes = (cx, cy, w, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;

      const eyeW = w * 0.18;
      const eyeH = eyeW * 0.45;
      const eyeSpacing = w * 0.35;

      const drawEye = (x, y, isRight) => {
        // Red mist / smoke rising from the eye
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const sx = x + (Math.random() - 0.5) * eyeW;
          const sy = y + (Math.random() - 0.5) * eyeH;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.bezierCurveTo(
            sx + (Math.random() - 0.5) * 30, sy - 15,
            sx + (Math.random() - 0.5) * 30, sy - 30,
            sx + (Math.random() - 0.5) * 60, sy - 50 - Math.random() * 30
          );
          ctx.stroke();
        }

        // 1. Red Glow Aura behind eye
        const glow = ctx.createRadialGradient(x, y, eyeW * 0.1, x, y, eyeW * 1.5);
        glow.addColorStop(0, 'rgba(239, 68, 68, 0.75)');
        glow.addColorStop(0.3, 'rgba(220, 38, 38, 0.35)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, eyeW * 1.5, 0, Math.PI * 2); ctx.fill();

        // 2. Eye shape outline / eyelids (sleek, slanted, demonic)
        ctx.fillStyle = '#090505';
        ctx.beginPath();
        if (!isRight) {
          ctx.moveTo(x - eyeW * 0.6, y + eyeH * 0.1);
          ctx.quadraticCurveTo(x - eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y - eyeH * 0.2);
          ctx.quadraticCurveTo(x + eyeW * 0.1, y + eyeH * 0.55, x - eyeW * 0.6, y + eyeH * 0.1);
        } else {
          ctx.moveTo(x - eyeW * 0.6, y - eyeH * 0.2);
          ctx.quadraticCurveTo(x + eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y + eyeH * 0.1);
          ctx.quadraticCurveTo(x - eyeW * 0.1, y + eyeH * 0.55, x - eyeW * 0.6, y - eyeH * 0.2);
        }
        ctx.closePath();
        ctx.fill();

        // 3. Eyeball / Sclera (Very dark blood red gradient)
        ctx.save();
        ctx.clip(); // Keep eyeball inside lids

        const scleraGrad = ctx.createRadialGradient(x, y, eyeW * 0.1, x, y, eyeW * 0.65);
        scleraGrad.addColorStop(0, '#ef4444');
        scleraGrad.addColorStop(0.5, '#7f1d1d');
        scleraGrad.addColorStop(1, '#1c0505');
        ctx.fillStyle = scleraGrad;
        ctx.fillRect(x - eyeW, y - eyeH, eyeW * 2, eyeH * 2);

        // 4. Iris & Pupil
        const irisR = eyeH * 0.42;
        const irisGrad = ctx.createRadialGradient(x, y, 0, x, y, irisR);
        irisGrad.addColorStop(0, '#fef08a'); // Yellow center
        irisGrad.addColorStop(0.5, '#f97316'); // Orange middle
        irisGrad.addColorStop(1, '#dc2626'); // Red outer
        ctx.fillStyle = irisGrad;
        ctx.beginPath(); ctx.arc(x, y, irisR, 0, Math.PI * 2); ctx.fill();

        // Dark radial texture lines in iris
        ctx.strokeStyle = 'rgba(127, 29, 29, 0.45)';
        ctx.lineWidth = 0.8;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(angle) * (irisR * 0.25), y + Math.sin(angle) * (irisR * 0.25));
          ctx.lineTo(x + Math.cos(angle) * irisR, y + Math.sin(angle) * irisR);
          ctx.stroke();
        }

        // 5. Cat Pupil (Vertical Slit)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, y, irisR * 0.18, irisR * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing white core in pupil
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x, y, irisR * 0.04, irisR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 6. Specular eyeball highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x - irisR * 0.35, y - irisR * 0.35, irisR * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + irisR * 0.35, y + irisR * 0.25, irisR * 0.07, 0, Math.PI * 2); ctx.fill();

        // 7. Eyelid highlighting (Red/pink glow line on eyelid edges)
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        if (!isRight) {
          ctx.moveTo(x - eyeW * 0.6, y + eyeH * 0.1);
          ctx.quadraticCurveTo(x - eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y - eyeH * 0.2);
        } else {
          ctx.moveTo(x - eyeW * 0.6, y - eyeH * 0.2);
          ctx.quadraticCurveTo(x + eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y + eyeH * 0.1);
        }
        ctx.stroke();

        ctx.restore(); // Restore clip
      };

      drawEye(cx - eyeSpacing/2, cy, false);
      drawEye(cx + eyeSpacing/2, cy, true);

      ctx.restore();
    };

    const drawLightning = (ctx, startX, startY, endX, endY, color, width) => {
      let x = startX;
      let y = startY;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / steps;
        const targetX = startX + (endX - startX) * t;
        const targetY = startY + (endY - startY) * t;
        
        if (i < steps - 1) {
          x = targetX + (Math.random() - 0.5) * 35;
          y = targetY + (Math.random() - 0.5) * 10;
        } else {
          x = endX;
          y = endY;
        }
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Draw a smaller branch
      if (width > 2.5 && Math.random() < 0.35) {
        const branchAngle = (Math.random() - 0.5) * Math.PI * 0.4;
        const branchLength = (endY - startY) * 0.45;
        const bx = x + Math.sin(branchAngle) * branchLength;
        const by = y + Math.cos(branchAngle) * branchLength;
        drawLightning(ctx, x, y, bx, by, color, width * 0.5);
      }
      ctx.restore();
    };

    const drawSubtitleText = (text, x, y, size, color, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Black outline (anime subtitles style)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, x, y);
      
      // Main text color fill
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    // --- MAIN FRAME LOOP ---
    const frame = () => {
      const st = stateRef.current;
      st.time++;
      const elapsed = (Date.now() - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // --- TIMELINE SEQUENCING ---
      if (elapsed < 3.0) {
        // Scene 1: Shelter & Eyes Appear (steady open)
        st.sisterY = 0;
        st.slayerY = 0;
        st.glowAlpha = 0;
        st.eyesAlpha = Math.min(1.0, elapsed / 2.0); // Eyes fade in over 2s
        st.shrineGlow = 0;
      } else if (elapsed < 4.5) {
        // Scene 2: Steady open gaze (blink removed)
        st.eyesAlpha = 1.0;
        st.glowAlpha = 0;
        st.sisterY = 0;
        st.slayerY = 0;
        st.shrineGlow = 0;
      } else if (elapsed < 5.5) {
        // Scene 3: The Strike & Float/Lift (Curse)
        st.eyesAlpha = 1.0;
        st.glowAlpha = Math.min(0.9, (elapsed - 4.5) * 1.5);
        
        // Sister floats up (lifted) from 4.7 to 5.5
        if (elapsed >= 4.7) {
          const t = (elapsed - 4.7) / 0.8;
          st.sisterY = -140 * Math.sin(t * Math.PI / 2); 
        }
      } else if (elapsed < 7.5) {
        // Scene 4: Faints & Falls flat, Slayer Catches
        st.eyesAlpha = 1.0;
        st.glowAlpha = Math.max(0, 0.9 - (elapsed - 5.5) * 1.2);
        
        // Sister falls flat
        const t = (elapsed - 5.5) / 0.8; // Falls down flat over 0.8s
        st.sisterY = -140 + 140 * Math.min(1.0, t);
      } else if (elapsed < 11.5) {
        // Scene 5: Shrine Glow & Subtitle Guidance (Eyes fade away)
        st.eyesAlpha = Math.max(0, 1.0 - (elapsed - 7.5) * 2.0);
        st.glowAlpha = 0;
        st.sisterY = 0;
        st.slayerY = 0;
        
        const glowProgress = Math.min(1.0, (elapsed - 7.5) * 1.5);
        const pulse = Math.sin(Date.now() * 0.004) * 0.15 + 0.85;
        st.shrineGlow = glowProgress * pulse;
      } else if (elapsed < 14.5) {
        // Scene 6: Putting Sister in the Box
        st.shrineGlow = Math.max(0, st.shrineGlow - 0.05);
        st.eyesAlpha = 0;
        st.glowAlpha = 0;

        // Swirling particles from Sister on ground to Slayer's back
        if (elapsed >= 11.5 && elapsed < 12.5) {
          const startX = w/2 + 28;
          const startY = groundY + 15;
          const endX = w/2 - 40;
          const endY = groundY - 8;
          const progress = (elapsed - 11.5) / 1.0;
          for (let k = 0; k < 2; k++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 20 * (1.0 - progress);
            const sx = startX + (endX - startX) * progress + Math.cos(angle) * r;
            const sy = startY + (endY - startY) * progress + Math.sin(angle) * r;
            spawnParticle(sx, sy, '#fbcfe8', 'water');
          }
        }
      } else {
        // Scene 7: Ready combat stance & final fade to black message
        st.shrineGlow = 0;
        const p = (elapsed - 14.5) / 3.0; // 3 seconds to fade and write text
        st.fadeAlpha = Math.min(1.0, p * 2.0);
        st.textProgress = Math.min(1.0, p * 1.5);
      }

      // --- RENDER CAMERA SHAKE WRAPPER ---
      ctx.save();
      if (st.shake > 0.5) {
        const dx = (Math.random() - 0.5) * st.shake;
        const dy = (Math.random() - 0.5) * st.shake;
        ctx.translate(dx, dy);
        st.shake *= 0.9;
      }

      // 1. SKY GRADIENT
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. AMBIENT LIGHTNING FLASH
      if (Math.random() < 0.003 && st.time - st.lastLightning > 180) {
        st.lastLightning = st.time;
        st.lightningAlpha = Math.random() * 0.6 + 0.35;
      }
      if (st.lightningAlpha > 0) {
        ctx.fillStyle = `rgba(186, 230, 253, ${st.lightningAlpha})`;
        ctx.fillRect(0, 0, w, h);
        st.lightningAlpha -= 0.04;
      }

      // 3. CLOUDS
      ctx.fillStyle = st.lightningAlpha > 0 ? `rgba(255,255,255,${0.12 + st.lightningAlpha * 0.4})` : 'rgba(255,255,255,0.04)';
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.width) c.x = w + 100;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
        ctx.roundRect(c.x + c.width * 0.25, c.y - c.height * 0.5, c.width * 0.45, c.height * 0.8, c.height / 2);
        ctx.fill();
      });

      // 4. DEMON EYES
      if (st.eyesAlpha > 0) {
        drawDemonEyes(w/2, h * 0.3, w, st.eyesAlpha);
      }

      // 5. BAMBOO & GROUND PARALLAX LAYERS
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.3, h - 180, w * 0.65, h - 130);
      ctx.quadraticCurveTo(w * 0.85, h - 110, w, h - 140);
      ctx.lineTo(w, h);
      ctx.fill();

      drawBambooLayer(layer3, '#0f172a', '#020617', 0.8, st.time);
      drawBambooLayer(layer2, '#1e293b', '#0f172a', 0.95, st.time);

      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(0, groundY - 15);
      ctx.quadraticCurveTo(w * 0.35, groundY - 25, w * 0.7, groundY + 5);
      ctx.quadraticCurveTo(w * 0.85, groundY + 15, w, groundY - 8);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      drawBambooLayer(layer1, '#334155', '#1e293b', 1.15, st.time);

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 8);
      ctx.quadraticCurveTo(w * 0.35, groundY - 5, w * 0.7, groundY + 20);
      ctx.quadraticCurveTo(w * 0.85, groundY + 30, w, groundY + 12);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // 6. SACRED SHRINE (Toro & Blue Spider Lilies) - Scaled to 1.1
      drawBoulderShrine(w/2, groundY + 20, 1.1, st.shrineGlow);

      // 6.5 FOREGROUND TREE CANOPY
      drawTreeCanopy(ctx, w, h, st.time);

      // 7. CHARACTERS
      drawSister(w/2 + 40, groundY, 2.0, elapsed, st.sisterY);
      drawSlayer(w/2 - 30, groundY, 2.0, elapsed);

      // 8. EXPLICIT DEMONIC RED THUNDERSTRIKE
      if (elapsed >= 4.5 && elapsed < 5.2) {
        // Sky red flash
        const flashAlpha = Math.max(0, 0.85 - (elapsed - 4.5) * 1.8);
        ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha})`;
        ctx.fillRect(0, 0, w, h);

        // Set screen shake
        st.shake = Math.max(st.shake, 22);

        // Draw lightning bolts from sky/eyes to Sister
        drawLightning(ctx, w/2, h * 0.35, w/2 + 40, groundY + st.sisterY - 20, '#ef4444', 8);
        drawLightning(ctx, w/2, h * 0.35, w/2 + 40, groundY + st.sisterY - 20, '#ffffff', 2.8); // White hot core

        // Spawn a burst of curse particles on strike
        if (Math.random() < 0.6) {
          for (let k = 0; k < 6; k++) {
            spawnParticle(w/2 + 40, groundY + st.sisterY - 20, '#f87171', 'curse');
          }
        }
      }

      // 9. ELEMENTAL SHIELD SWIRL (Shielding/Mitigating the curse)
      if (elapsed >= 4.7 && elapsed < 5.6) {
        const shieldPulse = Math.sin(Date.now() * 0.015) * 0.15 + 0.65;
        ctx.save();
        ctx.strokeStyle = `rgba(34, 211, 238, ${shieldPulse})`;
        ctx.lineWidth = 7;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        // Shield arc over Slayer protecting Sister
        ctx.arc(w/2 + 5, groundY - 25, 48, -Math.PI * 0.85, Math.PI * 0.15);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${shieldPulse + 0.25})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(w/2 + 5, groundY - 25, 48, -Math.PI * 0.85, Math.PI * 0.15);
        ctx.stroke();
        ctx.restore();
      }

      // 10. PARTICLE UPDATES AND DRAWING
      particles.forEach(p => {
        if (p.life <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / p.maxLife;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 11. VIOLENT RAIN STREAKS
      ctx.lineCap = 'round';
      rainDrops.forEach(r => {
        r.x -= r.speedX; r.y += r.speedY;
        if (r.y > h || r.x < -200) { r.y = -Math.random() * 200 - 50; r.x = Math.random() * w * 1.6; }
        ctx.strokeStyle = `rgba(200, 230, 255, ${r.opacity})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.speedX * 0.45, r.y + r.speedY * 0.45);
        ctx.stroke();
      });

      // Restore camera shake before overlays
      ctx.restore();

      // --- ANIME-STYLE FLOATING TEXT OVERLAYS ---
      
      // A: Slayer floating text above head
      if (elapsed >= 4.5 && elapsed < 5.5) {
        // "Sister! No!"
        const alpha = Math.min(1.0, (elapsed - 4.5) * 4.0) * Math.max(0, 1.0 - (elapsed - 5.3) * 5.0);
        drawSubtitleText("Sister! No!", w/2 - 30, groundY - 70, 16, '#ffffff', alpha);
      }
      
      if (elapsed >= 6.0 && elapsed < 7.5) {
        // "Sister... I will save you!"
        const alpha = Math.min(1.0, (elapsed - 6.0) * 3.0) * Math.max(0, 1.0 - (elapsed - 7.0) * 2.0);
        drawSubtitleText("Sister... I will save you!", w/2 - 30, groundY - 55, 17, '#ffffff', alpha);
      }

      // B: Shrine floating guidance text above the shrine
      if (elapsed >= 7.8 && elapsed < 9.5) {
        // "Reach mountain Sagiri before dawn..."
        const alpha = Math.min(1.0, (elapsed - 7.8) * 3.0) * Math.max(0, 1.0 - (elapsed - 9.0) * 2.0);
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        drawSubtitleText("Reach mountain Sagiri before dawn...", w/2, groundY - 145, 18, '#ffffff', alpha);
        ctx.restore();
      }

      if (elapsed >= 9.6 && elapsed < 11.5) {
        // "...to save your sister."
        const alpha = Math.min(1.0, (elapsed - 9.6) * 3.0) * Math.max(0, 1.0 - (elapsed - 11.0) * 2.0);
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        drawSubtitleText("...to save your sister.", w/2, groundY - 145, 18, '#ffffff', alpha);
        ctx.restore();
      }

      // 12. FADE TO BLACK & QUEST TEXT OVERLAY
      if (st.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${st.fadeAlpha})`;
        ctx.fillRect(0, 0, w, h);

        if (st.textProgress > 0) {
          const text = "Reach mountain Sagiri and save your sister.";
          const charsToShow = Math.floor(text.length * st.textProgress);
          const currentText = text.substring(0, charsToShow);

          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, st.textProgress * 2.0)})`;
          const fontSize = Math.min(30, w * 0.045);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.fillText(currentText, w / 2, h / 2);
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-slate-950 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full object-cover shadow-2xl" />
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/20 text-slate-200 rounded font-bold backdrop-blur transition-all shadow-lg"
        >
          Restart Cinematic
        </button>
      </div>
    </div>
  );
};
