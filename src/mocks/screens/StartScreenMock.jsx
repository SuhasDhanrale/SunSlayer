import { useState, useEffect, useRef } from 'react';

const SKINS = [
  {
    id: 'tanjiro',
    name: 'Sun Slayer',
    rarity: 'Legendary',
    colorClass: 'text-emerald-400 border-emerald-600/50 bg-emerald-950/20',
    description: 'Green & black checkered Haori, spiky dark-red hair, and dangling hanafuda card earrings.',
    accentColor: '#10b981', // emerald green
    hairColor: '#450a0a',   // burgundy red
    hairTips: '#991b1b',
    hasEarrings: true,
    patternType: 'checkered_green',
    bgPatternColor: 'bg-emerald-900',
    stats: { breathStyle: 'Sun / Hinokami', elementGlow: 'Emerald' }
  },
  {
    id: 'zenitsu',
    name: 'Thunder Flash',
    rarity: 'Epic',
    colorClass: 'text-amber-400 border-amber-600/50 bg-amber-950/20',
    description: 'Yellow & orange striped Haori, with bright yellow spiky hair that flares orange.',
    accentColor: '#fbbf24', // yellow gold
    hairColor: '#eab308',   // yellow
    hairTips: '#f97316',    // orange tips
    hasEarrings: false,
    patternType: 'striped_yellow',
    bgPatternColor: 'bg-amber-500',
    stats: { breathStyle: 'Thunder / Flash', elementGlow: 'Golden Spark' }
  },
  {
    id: 'nezuko',
    name: 'Blossom Warden',
    rarity: 'Rare',
    colorClass: 'text-pink-400 border-pink-600/50 bg-pink-950/20',
    description: 'Pink & white diamond checkered Haori, with long pink-and-black spiky hair.',
    accentColor: '#f472b6', // pink
    hairColor: '#18181b',   // black
    hairTips: '#ec4899',    // pink tips
    hasEarrings: false,
    patternType: 'diamond_pink',
    bgPatternColor: 'bg-pink-300',
    stats: { breathStyle: 'Blossom / Burst', elementGlow: 'Cherry Pink' }
  },
  {
    id: 'giyu',
    name: 'Water Torrent',
    rarity: 'Epic',
    colorClass: 'text-cyan-400 border-cyan-600/50 bg-cyan-950/20',
    description: 'Deep teal Haori with white waves, and black hair in a low ponytail.',
    accentColor: '#06b6d4', // cyan
    hairColor: '#09090b',   // black
    hairTips: '#0f172a',
    hasEarrings: false,
    patternType: 'wave_blue',
    bgPatternColor: 'bg-sky-600',
    stats: { breathStyle: 'Water / Flow', elementGlow: 'Azure' }
  },
  {
    id: 'rengoku',
    name: 'Flame Pillar',
    rarity: 'Legendary',
    colorClass: 'text-red-400 border-red-600/50 bg-red-950/20',
    description: 'Red & yellow flame-sliced Haori, with wild spiky yellow hair and crimson streaks.',
    accentColor: '#ef4444', // red
    hairColor: '#facc15',   // yellow
    hairTips: '#dc2626',    // red streaks
    hasEarrings: false,
    patternType: 'flame_red',
    bgPatternColor: 'bg-red-700',
    stats: { breathStyle: 'Flame / Fire', elementGlow: 'Crimson' }
  }
];

export const StartScreenMock = () => {
  const canvasRef = useRef(null);
  
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'paused'
  const [selectedSkin, setSelectedSkin] = useState(SKINS[0]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings values
  const [bgmVol, setBgmVol] = useState(70);
  const [sfxVol, setSfxVol] = useState(80);
  const [bgmMuted, setBgmMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [screenShake, setScreenShake] = useState(true);

  // Refs for gameplay variables
  const stateRef = useRef({
    gameState: 'start',
    selectedSkin: SKINS[0],
    time: 0,
    cameraOffset: 0,
    slashTrail: [],
    isSlashing: false,
    bambooObstacles: [],
    debrisParticles: [],
    shakeAmount: 0,
    score: 0,
    distance: 0,
    flashHit: 0,
    flashColor: '255, 255, 255'
  });

  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.selectedSkin = selectedSkin;
  }, [gameState, selectedSkin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 500) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- GEOMETRIC FABRIC PATTERNS ---
    const patterns = {};
    const generatePatterns = () => {
      // 1. Checkered Green
      const p1 = document.createElement('canvas');
      p1.width = 12; p1.height = 12;
      const c1 = p1.getContext('2d');
      c1.fillStyle = '#065f46';
      c1.fillRect(0,0,12,12);
      c1.fillStyle = '#1c1917';
      c1.fillRect(0, 0, 6, 6);
      c1.fillRect(6, 6, 6, 6);
      patterns['checkered_green'] = ctx.createPattern(p1, 'repeat');

      // 2. Yellow Striped
      const p2 = document.createElement('canvas');
      p2.width = 16; p2.height = 16;
      const c2 = p2.getContext('2d');
      c2.fillStyle = '#f59e0b';
      c2.fillRect(0,0,16,16);
      c2.strokeStyle = '#ea580c';
      c2.lineWidth = 4;
      c2.beginPath();
      c2.moveTo(0,0); c2.lineTo(16,16);
      c2.moveTo(-8,8); c2.lineTo(8,24);
      c2.moveTo(8,-8); c2.lineTo(24,8);
      c2.stroke();
      patterns['striped_yellow'] = ctx.createPattern(p2, 'repeat');

      // 3. Pink Diamonds
      const p3 = document.createElement('canvas');
      p3.width = 14; p3.height = 14;
      const c3 = p3.getContext('2d');
      c3.fillStyle = '#fbcfe8';
      c3.fillRect(0,0,14,14);
      c3.fillStyle = '#ffffff';
      c3.beginPath();
      c3.moveTo(7,0); c3.lineTo(14,7); c3.lineTo(7,14); c3.lineTo(0,7);
      c3.closePath(); c3.fill();
      patterns['diamond_pink'] = ctx.createPattern(p3, 'repeat');

      // 4. Blue Waves
      const p4 = document.createElement('canvas');
      p4.width = 18; p4.height = 18;
      const c4 = p4.getContext('2d');
      c4.fillStyle = '#0284c7';
      c4.fillRect(0,0,18,18);
      c4.strokeStyle = '#ffffff';
      c4.lineWidth = 2.5;
      c4.beginPath();
      c4.moveTo(-4, 9); c4.quadraticCurveTo(5, 0, 14, 9);
      c4.moveTo(5, 18); c4.quadraticCurveTo(14, 9, 23, 18);
      c4.stroke();
      patterns['wave_blue'] = ctx.createPattern(p4, 'repeat');

      // 5. Red Flames
      const p5 = document.createElement('canvas');
      p5.width = 20; p5.height = 20;
      const c5 = p5.getContext('2d');
      c5.fillStyle = '#dc2626';
      c5.fillRect(0,0,20,20);
      c5.fillStyle = '#fbbf24';
      c5.beginPath();
      c5.moveTo(0, 20);
      c5.lineTo(4, 8); c5.lineTo(8, 16); c5.lineTo(12, 4); c5.lineTo(16, 14); c5.lineTo(20, 20);
      c5.closePath(); c5.fill();
      patterns['flame_red'] = ctx.createPattern(p5, 'repeat');
    };
    generatePatterns();

    // Bamboos (Rainy Forest)
    const generateBamboos = (count, spacing, width, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.4),
        w: width + Math.random() * (width * 0.4),
        speed: speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        leaves: Array.from({ length: 6 }).map(() => ({
          relY: Math.random() * 0.8 + 0.15,
          side: Math.random() > 0.5 ? 1 : -1,
          size: Math.random() * 12 + 8,
          angle: (Math.random() - 0.5) * 0.4
        }))
      }));
    };
    const bambooFar = generateBamboos(20, 100, 5, 0.5);
    const bambooMid = generateBamboos(12, 180, 12, 1.2);
    const bambooNear = generateBamboos(8, 300, 25, 2.5);

    // Weather Rain
    const rainDrops = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 2000 - 500,
      y: Math.random() * 1200 - 400,
      length: Math.random() * 20 + 15,
      speedX: Math.random() * 8 + 12, // Blown hard left
      speedY: Math.random() * 15 + 20,
      opacity: Math.random() * 0.3 + 0.15
    }));

    const stormLeaves = Array.from({ length: 25 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000,
      size: Math.random() * 8 + 6,
      speedX: Math.random() * 6 + 10,
      speedY: Math.random() * 3 + 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.05 + 0.02
    }));

    const clouds = Array.from({ length: 4 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 40 + i * 35,
      width: Math.random() * 130 + 100,
      height: 9,
      speed: 0.15 + Math.random() * 0.1
    }));

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
    let lastLightning = 0;
    let lightningAlpha = 0;
    
    // Smooth character placement variables
    let currentCharX = null;
    let currentCharScale = null;

    const frame = () => {
      const gState = stateRef.current.gameState;
      const curSkin = stateRef.current.selectedSkin;
      stateRef.current.time++;
      const time = stateRef.current.time;

      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 80;

      // Physics scroll speeds
      let speedMultiplier = 0.22; // Slow scroll on menu
      if (gState === 'playing') {
        speedMultiplier = 3.2; // Run speed
        stateRef.current.distance += 2;
        stateRef.current.score += 1;
      } else if (gState === 'paused') {
        speedMultiplier = 0; // Frozen
      }

      // 1. SKY GRADIENT (Stormy Indigo/Black)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#040b1e');
      skyGrad.addColorStop(0.5, '#0f1c3f');
      skyGrad.addColorStop(1, '#1d2f5f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. LIGHTNING FLASH
      if (gState !== 'paused' && Math.random() < 0.0035 && time - lastLightning > 180) {
        lastLightning = time;
        lightningAlpha = Math.random() * 0.55 + 0.25;
      }
      if (lightningAlpha > 0) {
        ctx.fillStyle = `rgba(186, 230, 253, ${lightningAlpha})`;
        ctx.fillRect(0, 0, w, h);
        if (gState !== 'paused') lightningAlpha -= 0.04;
      }

      // 3. JAPANESE CLOUDS
      ctx.fillStyle = lightningAlpha > 0 
        ? `rgba(255, 255, 255, ${0.12 + lightningAlpha * 0.4})` 
        : 'rgba(255, 255, 255, 0.035)';
      clouds.forEach(c => {
        if (gState !== 'paused') c.x -= c.speed * (speedMultiplier > 0 ? speedMultiplier * 0.5 : 1);
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
        if (gState !== 'paused') wisp.x -= wisp.speed * 0.3 * (speedMultiplier > 0 ? speedMultiplier * 0.5 : 1);
        if (wisp.x < -wisp.w) wisp.x = w + 100;
        drawMistWisp(wisp, 38, 58, 108);
      });

      // 4. DISTANT RIDGE
      ctx.fillStyle = '#1b2330';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.35, h - 140, w * 0.7, h - 110);
      ctx.quadraticCurveTo(w * 0.85, h - 90, w, h - 120);
      ctx.lineTo(w, h);
      ctx.fill();

      // 4.5 Blinking owl eyes
      owlEyes.forEach(eye => {
        if (gState !== 'paused') eye.x -= eye.speed * (speedMultiplier > 0 ? speedMultiplier * 0.5 : 1);
        if (eye.x < -100) {
          eye.x = w + 100 + Math.random() * 200;
          eye.y = Math.random() * 250 + 180;
        }

        if (gState !== 'paused') {
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

      // 5. RENDER BAMBOOS
      drawBambooLayer(bambooFar, '#0e1526', '#020612', 0.8);
      drawBambooLayer(bambooMid, '#1a2436', '#0e1524', 0.95);

      // Midground Ground
      ctx.fillStyle = '#070a13';
      ctx.beginPath();
      ctx.moveTo(0, groundY - 15);
      ctx.quadraticCurveTo(w * 0.35, groundY - 25, w * 0.7, groundY + 5);
      ctx.quadraticCurveTo(w * 0.85, groundY + 15, w, groundY - 8);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // Foreground bamboo
      drawBambooLayer(bambooNear, '#2d3b4e', '#16202c', 1.15);

      // Foreground Ground
      ctx.fillStyle = '#020408';
      ctx.beginPath();
      ctx.moveTo(0, groundY + 8);
      ctx.quadraticCurveTo(w * 0.35, groundY - 5, w * 0.7, groundY + 20);
      ctx.quadraticCurveTo(w * 0.85, groundY + 30, w, groundY + 12);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // 6. WEATHER RAIN
      ctx.lineCap = 'round';
      rainDrops.forEach(r => {
        if (gState !== 'paused') {
          r.x -= r.speedX * (speedMultiplier > 0 ? speedMultiplier * 0.6 : 1);
          r.y += r.speedY;
        }
        if (r.y > h || r.x < -200) {
          r.y = -Math.random() * 200 - 50;
          r.x = Math.random() * w * 1.5;
        }
        ctx.strokeStyle = `rgba(186, 230, 255, ${r.opacity * (gState === 'playing' ? 1.3 : 0.8)})`;
        ctx.lineWidth = gState === 'playing' ? 1.8 : 1.2;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.speedX * 0.4, r.y + r.speedY * 0.4);
        ctx.stroke();
      });

      // Blowing leaves
      ctx.fillStyle = 'rgba(22, 32, 44, 0.7)';
      stormLeaves.forEach(leaf => {
        if (gState !== 'paused') {
          leaf.sway += leaf.swaySpeed;
          leaf.x -= (leaf.speedX + Math.sin(leaf.sway) * 2) * (speedMultiplier > 0 ? speedMultiplier * 0.5 : 1);
          leaf.y += leaf.speedY;
          leaf.rotation += leaf.rotationSpeed;
        }
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

      // --- 7. DRAW LARGE CHARACTER ON CANVAS ---
      // Renders large in the center-left to look highly visible and premium
      let targetCxPos = w * 0.45; // Centered gracefully
      let cyPos = groundY - 15;
      let targetScale = Math.min(w, h) * 0.005; // 5x scale!

      if (gState === 'playing') {
        targetCxPos = w * 0.22;
        targetScale = Math.min(w, h) * 0.0035;
      }

      if (currentCharX === null) currentCharX = targetCxPos;
      else currentCharX += (targetCxPos - currentCharX) * 0.12;

      if (currentCharScale === null) currentCharScale = targetScale;
      else currentCharScale += (targetScale - currentCharScale) * 0.12;

      ctx.save();
      ctx.translate(currentCharX, cyPos);
      ctx.scale(currentCharScale, currentCharScale);

      // Stride calculations
      let bobY = 0;
      let charCycle = time * 0.22;
      let legStride = 0;
      let headBob = 0;
      let swordAngle = 0.25;
      let handX = 14;
      let handY = -24;

      if (gState === 'playing') {
        bobY = Math.sin(charCycle * 2) * 2.2;
        headBob = Math.sin(charCycle * 2) * 1.2;
        legStride = Math.sin(charCycle) * 14;
      } else {
        bobY = Math.sin(time * 0.04) * 0.7;
        headBob = Math.sin(time * 0.04) * 0.4;
        legStride = 2; // standing ambient
      }

      // Waving scarf
      const scarfWave = Math.sin(charCycle * 1.5) * 10;
      ctx.save();
      const currentPattern = patterns[curSkin.patternType] || '#fff';
      ctx.strokeStyle = currentPattern;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -29 + bobY + headBob);
      ctx.quadraticCurveTo(-18, -23 + bobY + scarfWave, -40, -29 + bobY - scarfWave * 0.7);
      ctx.stroke();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      // Wooden Box
      const boxW = 14;
      const boxH = 25;
      ctx.save();
      ctx.translate(-15, -20 + bobY);
      ctx.fillStyle = '#653c24';
      ctx.fillRect(-boxW/2, -boxH, boxW, boxH);
      
      const crackWidth = gState === 'playing' ? 2.0 : 3.8;
      ctx.fillStyle = '#18120e';
      ctx.fillRect(boxW/2 - 1.5 - crackWidth, -boxH + 3, crackWidth, boxH - 6);

      // Bands
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-boxW/2 - 0.5, -boxH, boxW + 1, 2.5);
      ctx.fillRect(-boxW/2 - 0.5, -2.5, boxW + 1, 2.5);
      ctx.fillRect(-boxW/2 - 0.5, -boxH + 2.5, 2, boxH - 5);
      ctx.fillRect(boxW/2 - 1.5, -boxH + 2.5, 2, boxH - 5);

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(boxW/2 - 4.5, -boxH * 0.5 - 2, 2.5, 4);

      // Sister peeking
      const isPeeking = gState === 'playing' || (Math.sin(time * 0.035) > 0.35);
      if (isPeeking) {
        ctx.save();
        ctx.translate(boxW/2 - 1 - crackWidth/2, -boxH * 0.5);

        ctx.fillStyle = '#fbcfe8'; // face
        ctx.beginPath(); ctx.arc(-1, 0, 1.8, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#ec4899'; // hair
        ctx.beginPath();
        ctx.moveTo(-2.5, -2); ctx.lineTo(-0.8, -3); ctx.lineTo(0.5, -1.8); ctx.lineTo(-1, 0);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#f472b6'; // eyes
        ctx.fillRect(-1.8, -0.6, 0.7, 0.7);
        ctx.fillRect(-0.4, -0.6, 0.7, 0.7);
        ctx.restore();
      }
      ctx.restore();

      // Legs & Kyahan (Shin Wraps)
      ctx.save();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      
      const leg1X = legStride * 0.6;
      const leg1Y = 11;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(leg1X, leg1Y); ctx.stroke();

      const leg2X = -legStride * 0.6;
      const leg2Y = 11;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(leg2X, leg2Y); ctx.stroke();

      const drawKyahan = (lx, ly) => {
        ctx.save();
        ctx.translate(lx * 0.6, ly * 0.6);
        ctx.scale(0.8, 0.8);
        ctx.fillStyle = curSkin.accentColor;
        ctx.fillRect(-3.5, 0, 7, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-3, 1.5); ctx.lineTo(3, 3.5);
        ctx.stroke();
        ctx.restore();
      };
      drawKyahan(leg1X, leg1Y);
      drawKyahan(leg2X, leg2Y);
      ctx.restore();

      // Chest
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-9, bobY); ctx.lineTo(9, bobY); ctx.lineTo(7, -23 + bobY); ctx.lineTo(-7, -23 + bobY);
      ctx.closePath(); ctx.fill();

      // White Belt
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6.5, -9 + bobY, 13, 2.5);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-1.5, -9.5 + bobY, 3, 3.5);

      // Flowing Haori
      ctx.save();
      ctx.fillStyle = currentPattern;
      ctx.beginPath();
      ctx.moveTo(-8, -20 + bobY);
      ctx.lineTo(-2, -20 + bobY);
      ctx.quadraticCurveTo(-14, -6 + bobY + scarfWave * 0.4, -20, bobY - 2);
      ctx.lineTo(-14, bobY + 3);
      ctx.closePath(); ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(-9, -21 + bobY); ctx.lineTo(-1, -21 + bobY); ctx.lineTo(-5, -7 + bobY); ctx.lineTo(-12, -7 + bobY);
      ctx.closePath(); ctx.fill();

      ctx.beginPath();
      ctx.moveTo(9, -21 + bobY); ctx.lineTo(1, -21 + bobY); ctx.lineTo(5, -7 + bobY); ctx.lineTo(12, -7 + bobY);
      ctx.closePath(); ctx.fill();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      // Head
      const hx = 0;
      const hy = -28 + bobY + headBob;
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath(); ctx.arc(hx, hy + 3, 5, 0, Math.PI * 2); ctx.fill();

      // Spiky Anime Hair
      ctx.fillStyle = curSkin.hairColor;
      ctx.beginPath();
      if (curSkin.id === 'tanjiro') {
        ctx.moveTo(hx - 6, hy + 2); ctx.lineTo(hx - 8, hy - 4); ctx.lineTo(hx - 4, hy - 2); ctx.lineTo(hx - 5, hy - 7); ctx.lineTo(hx, hy - 4); ctx.lineTo(hx + 4, hy - 7); ctx.lineTo(hx + 3, hy - 2); ctx.lineTo(hx + 7, hy - 1); ctx.lineTo(hx + 5, hy + 3); ctx.lineTo(hx - 1, hy + 1);
      } else if (curSkin.id === 'zenitsu') {
        ctx.moveTo(hx - 6, hy + 3); ctx.lineTo(hx - 7, hy - 5); ctx.lineTo(hx - 3, hy - 5); ctx.lineTo(hx, hy - 8); ctx.lineTo(hx + 3, hy - 5); ctx.lineTo(hx + 7, hy - 5); ctx.lineTo(hx + 6, hy + 3);
      } else if (curSkin.id === 'nezuko') {
        ctx.moveTo(hx - 4, hy - 3); ctx.lineTo(hx - 10, hy + 5); ctx.lineTo(hx - 6, hy - 5); ctx.lineTo(hx - 2, hy - 7); ctx.lineTo(hx + 3, hy - 6); ctx.lineTo(hx + 6, hy - 2); ctx.lineTo(hx + 5, hy + 4);
      } else if (curSkin.id === 'giyu') {
        ctx.moveTo(hx - 6, hy + 1); ctx.lineTo(hx - 8, hy - 4); ctx.lineTo(hx - 3, hy - 4); ctx.lineTo(hx - 2, hy - 8); ctx.lineTo(hx + 3, hy - 5); ctx.lineTo(hx + 6, hy - 1); ctx.lineTo(hx + 4, hy + 3);
      } else if (curSkin.id === 'rengoku') {
        ctx.moveTo(hx - 7, hy + 2); ctx.lineTo(hx - 10, hy - 6); ctx.lineTo(hx - 4, hy - 3); ctx.lineTo(hx - 5, hy - 9); ctx.lineTo(hx, hy - 5); ctx.lineTo(hx + 5, hy - 9); ctx.lineTo(hx + 4, hy - 3); ctx.lineTo(hx + 9, hy - 5); ctx.lineTo(hx + 6, hy + 3);
      }
      ctx.closePath(); ctx.fill();

      // Hair Tips
      ctx.fillStyle = curSkin.hairTips;
      ctx.beginPath();
      if (curSkin.id === 'tanjiro') {
        ctx.arc(hx - 3, hy - 3, 2, 0, Math.PI*2); ctx.arc(hx + 2, hy - 4, 1.8, 0, Math.PI*2);
      } else if (curSkin.id === 'zenitsu') {
        ctx.arc(hx - 5, hy + 1, 1.8, 0, Math.PI*2); ctx.arc(hx + 5, hy + 1, 1.8, 0, Math.PI*2);
      } else if (curSkin.id === 'nezuko') {
        ctx.arc(hx - 8, hy + 3, 2.5, 0, Math.PI*2);
      } else if (curSkin.id === 'giyu') {
        ctx.arc(hx - 1, hy - 5, 1.5, 0, Math.PI*2);
      } else if (curSkin.id === 'rengoku') {
        ctx.arc(hx - 4, hy - 6, 2, 0, Math.PI*2); ctx.arc(hx + 4, hy - 6, 2, 0, Math.PI*2); ctx.arc(hx, hy - 3, 1.5, 0, Math.PI*2);
      }
      ctx.fill();

      // card earrings
      if (curSkin.hasEarrings) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 3.5, hy + 6, 2, 4);
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(hx + 3.5, hy + 6, 2, 4);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(hx + 4.5, hy + 7.2, 0.6, 0, Math.PI*2); ctx.fill();
      }

      // Ponytail (Giyu)
      if (curSkin.id === 'giyu') {
        ctx.fillStyle = curSkin.hairColor;
        ctx.beginPath();
        ctx.moveTo(hx - 5, hy + 2);
        ctx.quadraticCurveTo(hx - 16, hy + 6, hx - 14, hy + 14);
        ctx.quadraticCurveTo(hx - 10, hy + 8, hx - 3, hy + 4);
        ctx.closePath(); ctx.fill();
      }

      // Arm & Katana
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(3, -16 + bobY); ctx.lineTo(handX, handY + bobY);
      ctx.stroke();

      ctx.save();
      ctx.translate(handX, handY + bobY);
      ctx.rotate(swordAngle);
      ctx.fillStyle = curSkin.id === 'rengoku' ? '#dc2626' : '#d97706';
      ctx.fillRect(-1.5, -3, 3, 6);
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-8, 0); ctx.stroke();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(34, 0); ctx.stroke();
      ctx.strokeStyle = curSkin.accentColor;
      ctx.lineWidth = 0.8;
      ctx.shadowColor = curSkin.accentColor;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(2, -0.5); ctx.lineTo(34, -0.5); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.restore(); // Restore scale translation

      // --- 8. ACTIVE GAMEPLAY MODE RENDERERS ---
      if (gState === 'playing') {
        // Draw Sword Slashes
        if (stateRef.current.isSlashing && stateRef.current.slashTrail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stateRef.current.slashTrail[0].x, stateRef.current.slashTrail[0].y);
          for (let i = 1; i < stateRef.current.slashTrail.length; i++) {
            ctx.lineTo(stateRef.current.slashTrail[i].x, stateRef.current.slashTrail[i].y);
          }
          ctx.strokeStyle = curSkin.accentColor;
          ctx.lineWidth = 7;
          ctx.shadowColor = curSkin.accentColor;
          ctx.shadowBlur = 10;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Spawn Bamboos
        if (time % 140 === 0) {
          stateRef.current.bambooObstacles.push({
            id: Math.random(),
            x: w + 50,
            y: groundY - 110,
            w: 16,
            h: 110,
            sliced: false,
            topY: 0, topRot: 0, botY: 0, botRot: 0, vx: 0, vy: 0
          });
        }

        // Draw Bamboos
        stateRef.current.bambooObstacles.forEach(b => {
          b.x -= 3.2 * 2.4;
          if (!b.sliced) {
            ctx.fillStyle = '#0a101b';
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = '#f8fafc';
            for (let ny = b.y + 18; ny < b.y + b.h; ny += 28) {
              ctx.fillRect(b.x - 2, ny, b.w + 4, 1.5);
            }
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(b.x + b.w/2 - 1.5, b.y + b.h * 0.4, 3, 5);
          } else {
            b.topRot += b.vx * 0.02;
            b.botRot -= b.vx * 0.01;
            b.topY += b.vy;
            b.botY += b.vy * 0.5;
            b.vy += 0.42;
            ctx.save();
            ctx.translate(b.x + b.w/2 - b.vx * 3, b.y + b.h * 0.22 + b.topY);
            ctx.rotate(b.topRot);
            ctx.fillStyle = '#0a101b';
            ctx.fillRect(-b.w/2, -b.h * 0.25, b.w, b.h * 0.5);
            ctx.restore();
            ctx.save();
            ctx.translate(b.x + b.w/2 + b.vx * 1.5, b.y + b.h * 0.78 + b.botY);
            ctx.rotate(b.botRot);
            ctx.fillStyle = '#0a101b';
            ctx.fillRect(-b.w/2, -b.h * 0.25, b.w, b.h * 0.5);
            ctx.restore();
          }
        });

        // Debris Splinters
        for (let i = stateRef.current.debrisParticles.length - 1; i >= 0; i--) {
          const p = stateRef.current.debrisParticles[i];
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.18;
          p.life -= 0.025;
          if (p.life <= 0) {
            stateRef.current.debrisParticles.splice(i, 1);
            continue;
          }
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      // 9. Plum Vignette
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.8);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(12, 10, 26, 0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [selectedSkin, gameState]);

  // Swipe logic
  const handlePointerDown = (e) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    stateRef.current.isSlashing = true;
    stateRef.current.slashTrail = [{ x, y }];
  };

  const handlePointerMove = (e) => {
    if (gameState !== 'playing' || !stateRef.current.isSlashing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const trail = stateRef.current.slashTrail;
    trail.push({ x, y });
    if (trail.length > 8) trail.shift();

    const p1 = trail[trail.length - 2];
    const p2 = trail[trail.length - 1];
    
    if (p1 && p2) {
      stateRef.current.bambooObstacles.forEach(b => {
        if (!b.sliced && b.x > 0 && b.x < canvas.width) {
          if (Math.min(p1.x, p2.x) < b.x + b.w && Math.max(p1.x, p2.x) > b.x &&
              Math.min(p1.y, p2.y) < b.y + b.h && Math.max(p1.y, p2.y) > b.y) {
            b.sliced = true;
            b.vx = (p2.x - p1.x) > 0 ? 2.5 : -2.5;
            b.vy = -4.5;
            for (let i = 0; i < 8; i++) {
              stateRef.current.debrisParticles.push({
                x: b.x + b.w/2, y: b.y + b.h/2,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 5 - 1.5,
                size: Math.random() * 3.5 + 1.5,
                color: '#1e293b',
                life: 1.0
              });
            }
          }
        }
      });
    }
  };

  const handlePointerUp = () => {
    stateRef.current.isSlashing = false;
    stateRef.current.slashTrail = [];
  };

  const drawBambooLayer = (layer, stalkColor, leafColor, heightFactor) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const h = canvas.height;
    const gState = stateRef.current.gameState;
    const time = stateRef.current.time;
    let speedMultiplier = 0.22;
    if (gState === 'playing') speedMultiplier = 3.2;
    else if (gState === 'paused') speedMultiplier = 0;

    layer.forEach(b => {
      if (gState !== 'paused') b.x -= b.speed * speedMultiplier;
      if (b.x < -b.w - 150) b.x = canvas.width + 100 + Math.random() * 50;

      const windSway = Math.sin(b.swayOffset + time * b.swaySpeed) * 6;
      const maxSway = -24 + windSway;

      const stalkHeight = h * heightFactor;
      const startY = h - stalkHeight;

      ctx.fillStyle = stalkColor;
      ctx.beginPath();
      ctx.ellipse(b.x + b.w/2, h - 5, b.w * 1.4, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(b.x, h);
      ctx.quadraticCurveTo(b.x - 8, h - stalkHeight * 0.5, b.x + maxSway, startY);
      ctx.lineTo(b.x + b.w + maxSway, startY);
      ctx.quadraticCurveTo(b.x + b.w - 8, h - stalkHeight * 0.5, b.x + b.w, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1.2;
      const jointSpacing = b.w * 3.4;
      let currentY = h;
      while (currentY > startY) {
        const t = (h - currentY) / stalkHeight;
        const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 8) * (1 - t) * t + (b.x + maxSway) * t * t;
        ctx.beginPath();
        ctx.moveTo(currentX - 0.5, currentY);
        ctx.lineTo(currentX + b.w + 0.5, currentY - 2.5);
        ctx.stroke();
        currentY -= jointSpacing;
      }

      ctx.fillStyle = leafColor;
      b.leaves.forEach(leaf => {
        const t = leaf.relY;
        const currentY = h - stalkHeight * t;
        const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 8) * (1 - t) * t + (b.x + maxSway) * t * t;
        ctx.save();
        ctx.translate(currentX + b.w / 2, currentY);
        ctx.rotate(-Math.PI * 0.6 + leaf.angle + (maxSway * 0.003));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(leaf.size * 0.5, -leaf.size * 0.4, leaf.size, -leaf.size * 0.25);
        ctx.quadraticCurveTo(leaf.size * 0.5, leaf.size * 0.1, 0, 0);
        ctx.fill();
        ctx.restore();
      });
    });
  };

  return (
    <div className="relative h-full w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* FULL BLEED BACKGROUND CANVAS */}
      <canvas 
        ref={canvasRef} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0" 
      />

      {/* --- HUD OVERLAY (Only visible during gameplay) --- */}
      {gameState === 'playing' && (
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none select-none">
          <div className="bg-[#0c0f12]/80 border border-slate-800/60 px-4 py-2 rounded backdrop-blur-md">
            <div className="text-[10px] font-serif tracking-widest text-slate-400 uppercase">RUNNING DISTANCE</div>
            <div className="text-xl font-bold text-red-500 font-serif mt-0.5">
              {stateRef.current.distance}m
            </div>
          </div>
          
          <button 
            onClick={() => setGameState('paused')}
            className="group flex items-center gap-2 bg-[#0c0f12]/80 border border-slate-700/50 hover:border-red-800/80 text-slate-200 hover:text-red-400 font-serif px-4 py-2.5 rounded pointer-events-auto cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all backdrop-blur-md"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:scale-110 transition-transform"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            <span className="tracking-widest text-xs font-bold uppercase pt-0.5">Pause</span>
          </button>
        </div>
      )}

      {/* Swipe instructions during gameplay */}
      {gameState === 'playing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-[#0c0f12]/80 border border-slate-800/60 px-6 py-3 rounded text-xs font-serif tracking-widest text-slate-300 backdrop-blur-md pointer-events-none text-center animate-pulse uppercase">
          Swipe to sever <span className="text-red-400 font-bold">Bamboo</span>
        </div>
      )}

      {/* --- MENU OVERLAYS (Only visible in Start Screen state) --- */}
      {gameState === 'start' && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">
          
          {/* Top Bar: Centralized Majestic Title with Animated Fire Effect */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none w-full px-4 flex flex-col items-center">
            
            <svg width="100%" height="85" viewBox="0 0 600 120" className="overflow-visible filter drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <defs>
                <filter id="fireEffect" x="-20%" y="-50%" width="140%" height="200%">
                  {/* Generate organic noise for fire shape */}
                  <feTurbulence type="fractalNoise" baseFrequency="0.04 0.12" numOctaves="3" seed="5">
                    <animate attributeName="baseFrequency" values="0.04 0.12; 0.04 0.18; 0.04 0.12" dur="4.5s" repeatCount="indefinite" />
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" xChannelSelector="R" yChannelSelector="G" scale="15" />
                </filter>
                <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#7f1d1d" />
                  <stop offset="30%" stopColor="#dc2626" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <linearGradient id="coreGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#991b1b" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* Distorted Fire Aura behind */}
              <text x="50%" y="80" textAnchor="middle" fill="url(#fireGrad)" filter="url(#fireEffect)" className="font-serif font-black text-7xl md:text-8xl tracking-[0.25em] uppercase opacity-90 mix-blend-screen">
                KIRI
              </text>
              
              {/* Core Solid Text on top */}
              <text x="50%" y="80" textAnchor="middle" fill="url(#coreGrad)" className="font-serif font-black text-7xl md:text-8xl tracking-[0.25em] uppercase drop-shadow-md">
                KIRI
              </text>
            </svg>

            <p className="text-[10px] md:text-sm font-serif tracking-[0.45em] text-white font-bold uppercase -mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ml-1">
              Slash Till Dawn
            </p>
          </div>

          {/* Bottom Right Corner Controls Group: Settings, Play Run */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-4 pointer-events-auto select-none">
            
            {/* Very Small Settings button */}
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 md:w-12 md:h-12 rounded bg-[#0c0f12]/80 hover:bg-[#0c0f12] border border-slate-700/50 hover:border-red-500/50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-sm group"
              title="Settings"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            </button>

            {/* Large, Beautiful calligraphic Sumi-e styled Play Button */}
            <button 
              onClick={() => {
                stateRef.current.distance = 0;
                stateRef.current.score = 0;
                stateRef.current.bambooObstacles = [];
                stateRef.current.debrisParticles = [];
                setGameState('playing');
              }}
              className="group relative px-8 md:px-10 py-3.5 md:py-4.5 rounded-2xl text-slate-100 font-serif italic text-lg md:text-xl tracking-widest uppercase font-extrabold hover:text-white transition-all duration-300 cursor-pointer overflow-visible select-none text-center min-w-[180px] md:min-w-[220px]"
            >
              {/* Background Ink Stroke (Sumi-e effect) */}
              <div className="absolute inset-0 -m-4 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none -z-10">
                <svg viewBox="0 0 320 80" className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(185,28,28,0.2)]">
                  {/* Base ink smudge/splatter */}
                  <path 
                    d="M15,42 Q80,18 160,38 T305,42 C280,58 210,65 160,58 C100,53 50,56 15,42 Z" 
                    fill="#7f1d1d" 
                    opacity="0.35" 
                  />
                  {/* Darker core stroke */}
                  <path 
                    d="M25,38 C90,16 160,18 240,28 C270,32 295,37 305,40 C285,48 245,54 180,51 C115,48 65,52 25,46 C20,45 16,42 25,38 Z" 
                    fill="#991b1b" 
                  />
                  {/* Ink brush bristles texture */}
                  <path 
                    d="M35,35 Q100,20 180,24 T285,34 M45,45 Q120,38 190,44 T265,42" 
                    stroke="#f87171" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    fill="none" 
                    opacity="0.5" 
                  />
                  {/* Red accent splatters */}
                  <circle cx="20" cy="50" r="2.5" fill="#ef4444" opacity="0.8" />
                  <circle cx="295" cy="25" r="1.5" fill="#ef4444" opacity="0.8" />
                  <circle cx="310" cy="48" r="2" fill="#ef4444" opacity="0.8" />
                </svg>
              </div>
              <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-[0.25em]">PLAY RUN</span>
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL OVERLAY: Settings / Audio Configuration --- */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#121215]/90 backdrop-blur-md border-t border-b border-red-900/50 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col gap-8 rounded-none">
            {/* Corner geometric cutouts / accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600/80 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600/80 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10 pointer-events-none" />

            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="border-b border-slate-800/60 pb-4 text-center">
              <h2 className="text-xl font-serif tracking-[0.2em] text-slate-200 uppercase">
                Settings
              </h2>
            </div>

            <div className="space-y-7 relative z-10">
              {/* BGM Volume */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Music</span>
                  <button onClick={() => setBgmMuted(!bgmMuted)} className="text-red-500/70 hover:text-red-400 text-[10px] uppercase tracking-widest font-serif transition">
                    {bgmMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <div className="relative h-4 flex items-center group">
                  <input type="range" min="0" max="100" value={bgmMuted ? 0 : bgmVol} onChange={(e) => { setBgmVol(Number(e.target.value)); setBgmMuted(false); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute left-0 right-0 h-[1px] bg-slate-800"></div>
                  <div className="absolute left-0 h-[1px] bg-red-700 transition-all duration-75" style={{ width: `${bgmMuted ? 0 : bgmVol}%` }}></div>
                  <div className="absolute w-2 h-4 bg-slate-300 group-hover:bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.5)] -translate-x-1/2 transition-colors duration-200 pointer-events-none" style={{ left: `${bgmMuted ? 0 : bgmVol}%` }}></div>
                </div>
              </div>

              {/* SFX Volume */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Effects</span>
                  <button onClick={() => setSFXMuted(!sfxMuted)} className="text-red-500/70 hover:text-red-400 text-[10px] uppercase tracking-widest font-serif transition">
                    {sfxMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <div className="relative h-4 flex items-center group">
                  <input type="range" min="0" max="100" value={sfxMuted ? 0 : sfxVol} onChange={(e) => { setSfxVol(Number(e.target.value)); setSFXMuted(false); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute left-0 right-0 h-[1px] bg-slate-800"></div>
                  <div className="absolute left-0 h-[1px] bg-red-700 transition-all duration-75" style={{ width: `${sfxMuted ? 0 : sfxVol}%` }}></div>
                  <div className="absolute w-2 h-4 bg-slate-300 group-hover:bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.5)] -translate-x-1/2 transition-colors duration-200 pointer-events-none" style={{ left: `${sfxMuted ? 0 : sfxVol}%` }}></div>
                </div>
              </div>

              {/* Screen Shake */}
              <div className="flex justify-between items-center border-t border-slate-800/60 pt-5 mt-2">
                <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Screen Shake</span>
                <button onClick={() => setScreenShake(!screenShake)} className={`px-4 py-1.5 font-serif tracking-widest text-[10px] cursor-pointer transition uppercase border ${screenShake ? 'border-red-900/50 text-red-400 bg-red-950/20' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                  {screenShake ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>

            <button onClick={() => setShowSettings(false)} className="w-full relative group py-4 mt-2 overflow-hidden border border-slate-800 bg-[#121215] hover:border-slate-500 transition-all duration-300">
              <div className="absolute inset-0 bg-slate-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
              <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-[11px] text-slate-400 group-hover:text-white transition-colors flex items-center justify-center">
                Return
              </span>
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL OVERLAY: In-Game Pause Settings --- */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#121215]/90 backdrop-blur-md border-t border-b border-red-900/50 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col gap-8 rounded-none">
            {/* Corner geometric cutouts / accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600/80 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600/80 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10 pointer-events-none" />

            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="border-b border-slate-800/60 pb-4 text-center">
              <h2 className="text-2xl font-serif tracking-[0.2em] text-slate-200 uppercase">
                Paused
              </h2>
            </div>

            <div className="space-y-7 relative z-10">
              {/* BGM Volume */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Music</span>
                  <button onClick={() => setBgmMuted(!bgmMuted)} className="text-red-500/70 hover:text-red-400 text-[10px] uppercase tracking-widest font-serif transition">
                    {bgmMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <div className="relative h-4 flex items-center group">
                  <input type="range" min="0" max="100" value={bgmMuted ? 0 : bgmVol} onChange={(e) => { setBgmVol(Number(e.target.value)); setBgmMuted(false); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute left-0 right-0 h-[1px] bg-slate-800"></div>
                  <div className="absolute left-0 h-[1px] bg-red-700 transition-all duration-75" style={{ width: `${bgmMuted ? 0 : bgmVol}%` }}></div>
                  <div className="absolute w-2 h-4 bg-slate-300 group-hover:bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.5)] -translate-x-1/2 transition-colors duration-200 pointer-events-none" style={{ left: `${bgmMuted ? 0 : bgmVol}%` }}></div>
                </div>
              </div>

              {/* SFX Volume */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Effects</span>
                  <button onClick={() => setSFXMuted(!sfxMuted)} className="text-red-500/70 hover:text-red-400 text-[10px] uppercase tracking-widest font-serif transition">
                    {sfxMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <div className="relative h-4 flex items-center group">
                  <input type="range" min="0" max="100" value={sfxMuted ? 0 : sfxVol} onChange={(e) => { setSfxVol(Number(e.target.value)); setSFXMuted(false); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute left-0 right-0 h-[1px] bg-slate-800"></div>
                  <div className="absolute left-0 h-[1px] bg-red-700 transition-all duration-75" style={{ width: `${sfxMuted ? 0 : sfxVol}%` }}></div>
                  <div className="absolute w-2 h-4 bg-slate-300 group-hover:bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.5)] -translate-x-1/2 transition-colors duration-200 pointer-events-none" style={{ left: `${sfxMuted ? 0 : sfxVol}%` }}></div>
                </div>
              </div>

              {/* Screen Shake */}
              <div className="flex justify-between items-center border-t border-slate-800/60 pt-5 mt-2">
                <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Screen Shake</span>
                <button onClick={() => setScreenShake(!screenShake)} className={`px-4 py-1.5 font-serif tracking-widest text-[10px] cursor-pointer transition uppercase border ${screenShake ? 'border-red-900/50 text-red-400 bg-red-950/20' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                  {screenShake ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2 relative z-10">
              <button onClick={() => setGameState('playing')} className="w-full relative group py-4 overflow-hidden border border-red-900 bg-[#121215] hover:border-red-500 transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]">
                <div className="absolute inset-0 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
                <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-[11px] text-red-50 group-hover:text-white transition-colors flex items-center justify-center">
                  Resume
                </span>
              </button>
              <button onClick={() => setGameState('start')} className="w-full relative group py-4 overflow-hidden border border-slate-800 bg-[#121215] hover:border-slate-500 transition-all duration-300">
                <div className="absolute inset-0 bg-slate-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
                <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-[11px] text-slate-400 group-hover:text-white transition-colors flex items-center justify-center">
                  Quit
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
