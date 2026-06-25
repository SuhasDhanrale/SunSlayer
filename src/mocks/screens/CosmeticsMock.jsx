import { useState, useEffect, useRef } from 'react';

const SKINS = [
  {
    id: 'sunward',
    name: 'Checkered Sun Warden',
    rarity: 'Legendary',
    colorClass: 'text-emerald-400 border-emerald-600/50 bg-emerald-950/20',
    description: 'Wearing the signature green-and-black checkered Haori, with spiky dark-red hair and dangling hanafuda card earrings.',
    accentColor: '#10b981', // emerald green
    hairColor: '#450a0a',   // dark burgundy red
    hairTips: '#991b1b',
    hasEarrings: true,
    patternType: 'checkered_green',
    stats: { breathStyle: 'Sun / Ember', elementGlow: 'Bright Emerald' }
  },
  {
    id: 'thunderward',
    name: 'Thunder Flash Hunter',
    rarity: 'Epic',
    colorClass: 'text-amber-400 border-amber-600/50 bg-amber-950/20',
    description: 'Wearing a yellow-and-orange striped Haori, with bright yellow spiky hair that flares orange at the tips.',
    accentColor: '#fbbf24', // yellow gold
    hairColor: '#eab308',   // bright yellow
    hairTips: '#f97316',    // orange tips
    hasEarrings: false,
    patternType: 'striped_yellow',
    stats: { breathStyle: 'Thunder / Lightning', elementGlow: 'Golden Spark' }
  },
  {
    id: 'blossomward',
    name: 'Blossom Demon Warden',
    rarity: 'Rare',
    colorClass: 'text-pink-400 border-pink-600/50 bg-pink-950/20',
    description: 'Wearing a pink-and-white diamond checkered Haori, with flowing long pink-and-black spiky hair.',
    accentColor: '#f472b6', // pink
    hairColor: '#18181b',   // black base
    hairTips: '#ec4899',    // pink tips
    hasEarrings: false,
    patternType: 'diamond_pink',
    stats: { breathStyle: 'Blossom / Blood Burst', elementGlow: 'Cherry Pink' }
  },
  {
    id: 'giyu',
    name: 'Water Torrent Warden',
    rarity: 'Epic',
    colorClass: 'text-cyan-400 border-cyan-600/50 bg-cyan-950/20',
    description: 'Wearing a deep teal Haori with white wave slice patterns, with spiky black hair tied back in a low ponytail.',
    accentColor: '#06b6d4', // cyan
    hairColor: '#09090b',   // solid black
    hairTips: '#0f172a',
    hasEarrings: false,
    patternType: 'wave_blue',
    stats: { breathStyle: 'Water / Flow', elementGlow: 'Ocean Azure' }
  },
  {
    id: 'flameward',
    name: 'Flame Pillar Warden',
    rarity: 'Legendary',
    colorClass: 'text-red-400 border-red-600/50 bg-red-950/20',
    description: 'Wearing a red-and-yellow flame-sliced Haori, with wild spiky yellow hair and crimson streaks.',
    accentColor: '#ef4444', // red
    hairColor: '#facc15',   // yellow base
    hairTips: '#dc2626',    // red flame streaks
    hasEarrings: false,
    patternType: 'flame_red',
    stats: { breathStyle: 'Flame / Fire', elementGlow: 'Blazing Crimson' }
  }
];

export const CosmeticsMock = () => {
  const canvasRef = useRef(null);
  const [selectedSkin, setSelectedSkin] = useState(SKINS[0]);
  const [activePose, setActivePose] = useState('running'); // 'running', 'slashing', 'charging'

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
      // 1. Green/Black Checkered (Kaito)
      const p1 = document.createElement('canvas');
      p1.width = 12; p1.height = 12;
      const c1 = p1.getContext('2d');
      c1.fillStyle = '#065f46'; // green
      c1.fillRect(0,0,12,12);
      c1.fillStyle = '#1c1917'; // dark charcoal
      c1.fillRect(0, 0, 6, 6);
      c1.fillRect(6, 6, 6, 6);
      patterns['checkered_green'] = ctx.createPattern(p1, 'repeat');

      // 2. Yellow/Orange Diagonal Stripes (Ren)
      const p2 = document.createElement('canvas');
      p2.width = 16; p2.height = 16;
      const c2 = p2.getContext('2d');
      c2.fillStyle = '#f59e0b'; // yellow
      c2.fillRect(0,0,16,16);
      c2.strokeStyle = '#ea580c'; // orange
      c2.lineWidth = 4;
      c2.beginPath();
      c2.moveTo(0,0); c2.lineTo(16,16);
      c2.moveTo(-8,8); c2.lineTo(8,24);
      c2.moveTo(8,-8); c2.lineTo(24,8);
      c2.stroke();
      patterns['striped_yellow'] = ctx.createPattern(p2, 'repeat');

      // 3. Pink/White Diamonds (Aya)
      const p3 = document.createElement('canvas');
      p3.width = 14; p3.height = 14;
      const c3 = p3.getContext('2d');
      c3.fillStyle = '#fbcfe8'; // pink
      c3.fillRect(0,0,14,14);
      c3.fillStyle = '#ffffff'; // white
      c3.beginPath();
      c3.moveTo(7,0); c3.lineTo(14,7); c3.lineTo(7,14); c3.lineTo(0,7);
      c3.closePath(); c3.fill();
      patterns['diamond_pink'] = ctx.createPattern(p3, 'repeat');

      // 4. Blue Wave Slices (Giyu)
      const p4 = document.createElement('canvas');
      p4.width = 18; p4.height = 18;
      const c4 = p4.getContext('2d');
      c4.fillStyle = '#0284c7'; // blue
      c4.fillRect(0,0,18,18);
      c4.strokeStyle = '#ffffff'; // white
      c4.lineWidth = 2.5;
      c4.beginPath();
      c4.moveTo(-4, 9); c4.quadraticCurveTo(5, 0, 14, 9);
      c4.moveTo(5, 18); c4.quadraticCurveTo(14, 9, 23, 18);
      c4.stroke();
      patterns['wave_blue'] = ctx.createPattern(p4, 'repeat');

      // 5. Red Flame Slices (Hibana)
      const p5 = document.createElement('canvas');
      p5.width = 20; p5.height = 20;
      const c5 = p5.getContext('2d');
      c5.fillStyle = '#dc2626'; // red
      c5.fillRect(0,0,20,20);
      c5.fillStyle = '#fbbf24'; // yellow
      c5.beginPath();
      c5.moveTo(0, 20);
      c5.lineTo(4, 8); c5.lineTo(8, 16); c5.lineTo(12, 4); c5.lineTo(16, 14); c5.lineTo(20, 20);
      c5.closePath(); c5.fill();
      patterns['flame_red'] = ctx.createPattern(p5, 'repeat');
    };
    generatePatterns();

    // Particle system
    const particles = [];
    const maxParticles = 60;

    const spawnParticle = (px, py, type) => {
      if (particles.length >= maxParticles) return;
      
      let p = {
        x: px, y: py,
        type: type,
        vx: -(Math.random() * 1.8 + 1.2),
        vy: (Math.random() - 0.5) * 1.0,
        life: 1.0,
        decay: Math.random() * 0.018 + 0.012,
        color: selectedSkin.accentColor,
        size: Math.random() * 3.5 + 1.5
      };

      if (type === 'cherry_blossom') {
        p.x = w + 20;
        p.y = Math.random() * (h * 0.7);
        p.vx = -(Math.random() * 2 + 1.5);
        p.vy = Math.random() * 0.8 + 0.5;
        p.color = 'rgba(244, 63, 94, 0.65)'; // pink sakura petals
        p.size = Math.random() * 4 + 2.5;
        p.rotation = Math.random() * Math.PI;
        p.rotSpeed = (Math.random() - 0.5) * 0.04;
      }

      particles.push(p);
    };

    let raf;
    let time = 0;
    let w = 500;
    let h = 500;

    const frame = () => {
      time++;
      w = canvas.width;
      h = canvas.height;
      const groundY = h - 80;

      // 1. Draw Normal Parchment Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#cbd5e1'); // soft slate-gray top
      skyGrad.addColorStop(0.7, '#f4f1ea'); // signature paper beige
      skyGrad.addColorStop(1, '#e7e5e4'); // distant ink beige
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Red Sun in background
      ctx.fillStyle = 'rgba(185, 28, 28, 0.8)'; // deep red sun
      ctx.beginPath();
      ctx.arc(w * 0.75, h * 0.38, Math.min(w, h) * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Parallax ink ground silhouettes
      ctx.fillStyle = 'rgba(28, 25, 23, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(w * 0.35, groundY - 35, w * 0.7, groundY - 15);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // Solid ground floor
      ctx.fillStyle = '#0c0a09'; // ground color
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, groundY - 3, w, 3);

      // Spawn falling sakura petals ambiently
      if (Math.random() < 0.1) spawnParticle(0, 0, 'cherry_blossom');

      // 3. Draw Character (Yokai Slicer Scale)
      const cx = w / 2;
      const cy = groundY - 15;
      const cScale = Math.min(w, h) * 0.0035;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(cScale, cScale);

      // Animation calculations
      let bobY = 0;
      let runCycle = time * 0.22;
      let legStride = 0;
      let headBob = 0;
      let swordAngle = 0.25;
      let handX = 14;
      let handY = -24;

      if (activePose === 'running') {
        bobY = Math.sin(runCycle * 2) * 2.2;
        headBob = Math.sin(runCycle * 2) * 1.2;
        legStride = Math.sin(runCycle) * 14;
      } else if (activePose === 'slashing') {
        bobY = 3.5;
        legStride = 9;
        swordAngle = -1.1 + Math.sin(time * 0.18) * 0.35;
        handX = 20;
        handY = -21;
      } else if (activePose === 'charging') {
        bobY = 7;
        legStride = 13;
        headBob = -1.5;
        handX = 4;
        handY = -15;
      }

      // Spawn breath aura particles behind character
      if (Math.random() < 0.4) {
        spawnParticle(cx - 10 * cScale, cy + (bobY - 25) * cScale, 'breath');
      }

      // --- RENDER CHARACTER SKIN ---

      // A. Waving Scarf (Filled with Checkered/Striped/Sliced Pattern)
      const scarfWave = Math.sin(runCycle * 1.5) * 12;
      ctx.save();
      const currentPattern = patterns[selectedSkin.patternType] || '#fff';
      ctx.strokeStyle = currentPattern;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -29 + bobY + headBob);
      
      if (activePose === 'charging') {
        ctx.quadraticCurveTo(-12, -18 + bobY + scarfWave * 0.5, -25, -10 + bobY);
      } else {
        ctx.quadraticCurveTo(-18, -23 + bobY + scarfWave, -40, -29 + bobY - scarfWave * 0.7);
      }
      ctx.stroke();
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      // B. Consistent Wooden Box on the Back (carrying sister)
      const boxX = -15;
      const boxY = -20 + bobY;
      const boxW = 14;
      const boxH = 25;

      ctx.save();
      ctx.translate(boxX, boxY);

      // Wooden body fill
      ctx.fillStyle = '#653c24';
      ctx.fillRect(-boxW/2, -boxH, boxW, boxH);

      // Dark shadow door slit
      ctx.fillStyle = '#18120e';
      
      // If charging (dark focus pose), she slides the door open slightly more to peek out
      const isDarkPose = activePose === 'charging';
      const crackWidth = isDarkPose ? 4.5 : 2;
      ctx.fillRect(boxW/2 - 1.5 - crackWidth, -boxH + 3, crackWidth, boxH - 6);

      // Black iron straps
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-boxW/2 - 0.5, -boxH, boxW + 1, 2.5);
      ctx.fillRect(-boxW/2 - 0.5, -2.5, boxW + 1, 2.5);
      ctx.fillRect(-boxW/2 - 0.5, -boxH + 2.5, 2, boxH - 5);
      ctx.fillRect(boxW/2 - 1.5, -boxH + 2.5, 2, boxH - 5);

      // Metal door latch
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(boxW/2 - 4.5, -boxH * 0.5 - 2, 2.5, 4);

      // SISTER PEEKS OUT OF THE BOX
      // When it is dark (charging) OR sometimes randomly in running/slashing
      const isPeeking = isDarkPose || (Math.sin(time * 0.03) > 0.45);
      if (isPeeking) {
        ctx.save();
        // Shift drawing into the door crack
        ctx.translate(boxW/2 - 1 - crackWidth/2, -boxH * 0.5);

        // Sister skin peeking
        ctx.fillStyle = '#fbcfe8'; // pale skin
        ctx.beginPath();
        ctx.arc(-1, 0, 2, 0, Math.PI*2);
        ctx.fill();

        // Sister spiky pink hair tuft
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(-2.5, -2); ctx.lineTo(-1, -3); ctx.lineTo(0.5, -1.8); ctx.lineTo(-1, 0);
        ctx.closePath(); ctx.fill();

        // Glowing pink demon eyes
        ctx.fillStyle = '#f472b6';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 4;
        ctx.fillRect(-2, -0.8, 0.8, 0.8);
        ctx.fillRect(-0.5, -0.8, 0.8, 0.8);
        ctx.shadowBlur = 0;

        ctx.restore();
      } else {
        // Just glowing dots deep inside the dark box
        if (Math.sin(time * 0.05) > -0.9) {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(boxW/2 - 2.5, -boxH * 0.5 - 1.5, 0.8, 0, Math.PI * 2);
          ctx.arc(boxW/2 - 2.5, -boxH * 0.5 + 1, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // C. Legs & Kyahan (Shin Wraps)
      ctx.save();
      ctx.strokeStyle = '#18181b'; // dark uniform pants
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
        
        ctx.fillStyle = selectedSkin.accentColor;
        ctx.fillRect(-3.5, 0, 7, 6);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-3, 1.5); ctx.lineTo(3, 3.5);
        ctx.moveTo(3, 1.5); ctx.lineTo(-3, 3.5);
        ctx.moveTo(-3, 3.5); ctx.lineTo(3, 5.5);
        ctx.stroke();
        ctx.restore();
      };
      drawKyahan(leg1X, leg1Y);
      drawKyahan(leg2X, leg2Y);
      ctx.restore();

      // D. Dark Uniform Chest
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-9, bobY);
      ctx.lineTo(9, bobY);
      ctx.lineTo(7, -23 + bobY);
      ctx.lineTo(-7, -23 + bobY);
      ctx.closePath();
      ctx.fill();

      // E. Signature White Belt
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6.5, -9 + bobY, 13, 2.5);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-1.5, -9.5 + bobY, 3, 3.5);

      // F. Patterned Haori
      ctx.save();
      ctx.fillStyle = currentPattern;
      
      // Haori tail
      ctx.beginPath();
      if (activePose === 'charging') {
        ctx.moveTo(-8, -20 + bobY);
        ctx.lineTo(-2, -20 + bobY);
        ctx.lineTo(-8, bobY);
        ctx.lineTo(-12, bobY);
      } else {
        ctx.moveTo(-8, -20 + bobY);
        ctx.lineTo(-2, -20 + bobY);
        ctx.quadraticCurveTo(-14, -6 + bobY + scarfWave * 0.4, -20, bobY - 2);
        ctx.lineTo(-14, bobY + 3);
      }
      ctx.closePath();
      ctx.fill();
      
      // Sleeves
      ctx.beginPath();
      ctx.moveTo(-9, -21 + bobY);
      ctx.lineTo(-1, -21 + bobY);
      ctx.lineTo(-5, -7 + bobY);
      ctx.lineTo(-12, -7 + bobY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(9, -21 + bobY);
      ctx.lineTo(1, -21 + bobY);
      ctx.lineTo(5, -7 + bobY);
      ctx.lineTo(12, -7 + bobY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      // G. Head & Spiky Hair
      const hx = 0;
      const hy = -28 + bobY + headBob;
      
      // Skin
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(hx, hy + 3, 5, 0, Math.PI * 2);
      ctx.fill();

      // Spiky Hair
      ctx.fillStyle = selectedSkin.hairColor;
      ctx.beginPath();
      if (selectedSkin.id === 'sunward') {
        ctx.moveTo(hx - 6, hy + 2);
        ctx.lineTo(hx - 8, hy - 4);
        ctx.lineTo(hx - 4, hy - 2);
        ctx.lineTo(hx - 5, hy - 7);
        ctx.lineTo(hx, hy - 4);
        ctx.lineTo(hx + 4, hy - 7);
        ctx.lineTo(hx + 3, hy - 2);
        ctx.lineTo(hx + 7, hy - 1);
        ctx.lineTo(hx + 5, hy + 3);
        ctx.lineTo(hx - 1, hy + 1);
      } else if (selectedSkin.id === 'thunderward') {
        ctx.moveTo(hx - 6, hy + 3);
        ctx.lineTo(hx - 7, hy - 5);
        ctx.lineTo(hx - 3, hy - 5);
        ctx.lineTo(hx, hy - 8);
        ctx.lineTo(hx + 3, hy - 5);
        ctx.lineTo(hx + 7, hy - 5);
        ctx.lineTo(hx + 6, hy + 3);
      } else if (selectedSkin.id === 'blossomward') {
        ctx.moveTo(hx - 4, hy - 3);
        ctx.lineTo(hx - 10, hy + 5);
        ctx.lineTo(hx - 6, hy - 5);
        ctx.lineTo(hx - 2, hy - 7);
        ctx.lineTo(hx + 3, hy - 6);
        ctx.lineTo(hx + 6, hy - 2);
        ctx.lineTo(hx + 5, hy + 4);
      } else if (selectedSkin.id === 'giyu') {
        ctx.moveTo(hx - 6, hy + 1);
        ctx.lineTo(hx - 8, hy - 4);
        ctx.lineTo(hx - 3, hy - 4);
        ctx.lineTo(hx - 2, hy - 8);
        ctx.lineTo(hx + 3, hy - 5);
        ctx.lineTo(hx + 6, hy - 1);
        ctx.lineTo(hx + 4, hy + 3);
      } else if (selectedSkin.id === 'flameward') {
        ctx.moveTo(hx - 7, hy + 2);
        ctx.lineTo(hx - 10, hy - 6);
        ctx.lineTo(hx - 4, hy - 3);
        ctx.lineTo(hx - 5, hy - 9);
        ctx.lineTo(hx, hy - 5);
        ctx.lineTo(hx + 5, hy - 9);
        ctx.lineTo(hx + 4, hy - 3);
        ctx.lineTo(hx + 9, hy - 5);
        ctx.lineTo(hx + 6, hy + 3);
      }
      ctx.closePath();
      ctx.fill();

      // Highlights
      ctx.fillStyle = selectedSkin.hairTips;
      ctx.beginPath();
      if (selectedSkin.id === 'sunward') {
        ctx.arc(hx - 3, hy - 3, 2, 0, Math.PI*2);
        ctx.arc(hx + 2, hy - 4, 1.8, 0, Math.PI*2);
      } else if (selectedSkin.id === 'thunderward') {
        ctx.arc(hx - 5, hy + 1, 1.8, 0, Math.PI*2);
        ctx.arc(hx + 5, hy + 1, 1.8, 0, Math.PI*2);
      } else if (selectedSkin.id === 'blossomward') {
        ctx.arc(hx - 8, hy + 3, 2.5, 0, Math.PI*2);
      } else if (selectedSkin.id === 'giyu') {
        ctx.arc(hx - 1, hy - 5, 1.5, 0, Math.PI*2);
      } else if (selectedSkin.id === 'flameward') {
        ctx.arc(hx - 4, hy - 6, 2, 0, Math.PI*2);
        ctx.arc(hx + 4, hy - 6, 2, 0, Math.PI*2);
        ctx.arc(hx, hy - 3, 1.5, 0, Math.PI*2);
      }
      ctx.fill();

      // Dangling Earrings
      if (selectedSkin.hasEarrings) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 3.5, hy + 6, 2, 4);
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(hx + 3.5, hy + 6, 2, 4);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(hx + 4.5, hy + 7.2, 0.6, 0, Math.PI*2); ctx.fill();
      }

      // Ponytail for Giyu
      if (selectedSkin.id === 'giyu') {
        ctx.fillStyle = selectedSkin.hairColor;
        ctx.beginPath();
        ctx.moveTo(hx - 5, hy + 2);
        ctx.quadraticCurveTo(hx - 16, hy + 6, hx - 14, hy + 14);
        ctx.quadraticCurveTo(hx - 10, hy + 8, hx - 3, hy + 4);
        ctx.closePath();
        ctx.fill();
      }

      // H. Arm & Tempered Katana
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(3, -16 + bobY);
      ctx.lineTo(handX, handY + bobY);
      ctx.stroke();

      ctx.save();
      ctx.translate(handX, handY + bobY);
      ctx.rotate(swordAngle);

      ctx.fillStyle = selectedSkin.id === 'flameward' ? '#dc2626' : '#d97706';
      ctx.fillRect(-1.5, -3, 3, 6);

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-8, 0); ctx.stroke();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(34, 0); ctx.stroke();

      ctx.strokeStyle = selectedSkin.accentColor;
      ctx.lineWidth = 0.8;
      ctx.shadowColor = selectedSkin.accentColor;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(2, -0.5); ctx.lineTo(34, -0.5); ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();

      ctx.restore(); // Restore main scale

      // 4. Draw Slash Visual Effects in Slashing Pose
      if (activePose === 'slashing') {
        ctx.save();
        ctx.translate(cx + 10 * cScale, cy - 18 * cScale);
        
        ctx.strokeStyle = selectedSkin.accentColor;
        ctx.shadowColor = selectedSkin.accentColor;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5 + Math.sin(time * 0.4) * 1.5;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(-8, 0, 65, -0.5, 1.3);
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-8, 0, 65, -0.4, 1.2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // 5. Draw Charging Vortex in Focus Pose
      if (activePose === 'charging') {
        ctx.save();
        ctx.translate(cx, cy - 18 * cScale);
        
        ctx.strokeStyle = selectedSkin.accentColor;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + time * 0.05;
          const radius = 90 - (time * 1.8 + i * 18) % 80;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px * 0.75, py * 0.75);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y > h + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;

        if (p.type === 'cherry_blossom') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation + time * p.rotSpeed);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [selectedSkin, activePose]);

  return (
    <div className="flex flex-col xl:flex-row h-full w-full bg-slate-950 text-slate-100 font-sans p-6 overflow-y-auto">
      {/* Canvas Display Left */}
      <div className="flex-1 flex flex-col gap-4 min-w-[320px] lg:min-w-[450px]">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-red-950/40 text-red-400 border border-red-900/50 px-2 py-0.5 rounded">
              Yokai Slicer Style
            </span>
            <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
              Geometric Fabric Patterns
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-wide mt-1">
            🏮 Slayer Customizer Mock
          </h2>
          <p className="text-xs text-slate-400">
            Preview checkered, striped, and sliced fabric patterns on the Haori and scarves. The sister is carried in a consistent wooden box, peeking out when the screen dims.
          </p>
        </div>

        {/* The Preview Card */}
        <div className="relative flex-1 min-h-[360px] bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-md">
          <canvas ref={canvasRef} className="block w-full h-full" />
          
          {/* Quick Active Status Badge */}
          <div className="absolute bottom-4 left-4 bg-slate-950/70 border border-slate-800/60 px-3 py-1 text-xs font-mono text-slate-300 backdrop-blur-md">
            Outwear: <span className="font-semibold text-red-400">{selectedSkin.name}</span>
          </div>
        </div>

        {/* Pose controls */}
        <div className="flex gap-3 bg-slate-900/20 p-2.5 rounded-xl border border-slate-900">
          <span className="text-xs font-semibold text-slate-400 flex items-center px-1">
            State:
          </span>
          <div className="flex gap-2 flex-1">
            {[
              { id: 'running', label: '🏃‍♂️ Stride (Running)' },
              { id: 'slashing', label: '⚔️ Breath Slash' },
              { id: 'charging', label: '⚡ Focus Charge' }
            ].map(pose => (
              <button
                key={pose.id}
                onClick={() => setActivePose(pose.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activePose === pose.id
                    ? 'bg-slate-100 text-slate-950 font-semibold shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850'
                }`}
              >
                {pose.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selector Side Panel Right */}
      <div className="w-full xl:w-[400px] flex flex-col gap-4 mt-6 xl:mt-0 xl:ml-6 border-t xl:border-t-0 xl:border-l border-slate-800 pt-6 xl:pt-0 xl:pl-6">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Select Slayer Outfit Pattern
        </h3>
        
        {/* Skins List */}
        <div className="flex flex-col gap-2.5">
          {SKINS.map(skin => (
            <button
              key={skin.id}
              onClick={() => setSelectedSkin(skin)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                selectedSkin.id === skin.id
                  ? 'border-opacity-100 shadow-[0_0_15px_rgba(239,68,68,0.3)] bg-slate-900 border-red-500'
                  : 'border-slate-850 hover:border-slate-800 bg-slate-900/30 text-slate-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-slate-100">{skin.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${skin.colorClass}`}>
                  {skin.rarity}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {skin.description}
              </p>
            </button>
          ))}
        </div>

        {/* Details card */}
        <div className="flex-1 flex flex-col border border-slate-800 bg-slate-900/20 rounded-2xl p-4 shadow-inner">
          <div className="border-b border-slate-800 pb-2.5 mb-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
              Outfit Details & Style
            </span>
            <h4 className="text-base font-bold text-red-400 mt-0.5">
              {selectedSkin.name} Specs
            </h4>
          </div>

          <div className="flex-1 flex flex-col gap-3.5 text-xs">
            <div className="text-slate-300 italic text-[11px] leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
              "{selectedSkin.description}"
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Box Container:</span>
                <span className="font-semibold text-slate-200 uppercase">Cedar Wood (Consistent)</span>
              </div>
              <div className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Fabric Pattern:</span>
                <span className="font-mono text-slate-100 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-850 uppercase">
                  {selectedSkin.patternType.replace('_', ' ')}
                </span>
              </div>
              {Object.entries(selectedSkin.stats).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-mono text-slate-100 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
