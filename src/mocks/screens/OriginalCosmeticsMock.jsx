import { useState, useEffect, useRef } from 'react';

const SKINS = [
  {
    id: 'ronin',
    name: 'Ronin of the Azure Dragon',
    rarity: 'Legendary',
    colorClass: 'text-indigo-400 border-indigo-600/50 bg-indigo-950/20',
    description: 'A wandering ronin wearing a traditional deep indigo sashiko Haori. Features a traditional topknot (chonmage) and no earrings.',
    accentColor: '#1e3a8a', // deep indigo
    hairColor: '#0f172a',   // dark slate
    hairTips: '#1e293b',
    patternType: 'seigaiha_blue',
    stats: { fightingStyle: 'Fluid Strike', aura: 'Azure Wave' }
  },
  {
    id: 'tengu',
    name: 'Storm Tengu Hunter',
    rarity: 'Epic',
    colorClass: 'text-purple-400 border-purple-600/50 bg-purple-950/20',
    description: 'Clad in dark purple and silver, inspired by the mythical Tengu. Features wild silver hair and a stormy aura.',
    accentColor: '#6d28d9', // dark purple
    hairColor: '#e2e8f0',   // silver/white
    hairTips: '#94a3b8',
    patternType: 'kumo_purple',
    stats: { fightingStyle: 'Wind Step', aura: 'Violet Storm' }
  },
  {
    id: 'miko',
    name: 'Crimson Shrine Maiden',
    rarity: 'Rare',
    colorClass: 'text-red-400 border-red-600/50 bg-red-950/20',
    description: 'Wearing traditional Miko colors (red and white) with an Asanoha (hemp leaf) pattern. Features long flowing black hair tied with a red ribbon.',
    accentColor: '#dc2626', // crimson
    hairColor: '#09090b',   // black
    hairTips: '#18181b',
    patternType: 'asanoha_red',
    stats: { fightingStyle: 'Sacred Ward', aura: 'Crimson Seal' }
  },
  {
    id: 'kensei',
    name: 'Kensei Crane Warden',
    rarity: 'Epic',
    colorClass: 'text-stone-400 border-stone-600/50 bg-stone-950/20',
    description: 'A highly disciplined swordmaster (Kensei) wearing an elegant charcoal and gold Haori with arrow-feather (Yagasuri) motifs.',
    accentColor: '#1c1917', // charcoal
    hairColor: '#fafaf9',   // pure white
    hairTips: '#d6d3d1',
    patternType: 'yagasuri_black',
    stats: { fightingStyle: 'Crane Stance', aura: 'Golden Focus' }
  },
  {
    id: 'kabuki',
    name: 'Kabuki Lion Master',
    rarity: 'Legendary',
    colorClass: 'text-rose-400 border-rose-600/50 bg-rose-950/20',
    description: 'Inspired by the dramatic Renjishi (Lion Dance). Features wild, voluminous red hair, theatrical makeup styling, and Shippo patterns.',
    accentColor: '#be123c', // fierce rose/red
    hairColor: '#e11d48',   // bold red
    hairTips: '#f43f5e',
    patternType: 'shippo_flame',
    stats: { fightingStyle: 'Lion Dance', aura: 'Theatrical Flame' }
  }
];

export const OriginalCosmeticsMock = () => {
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

    // --- WAGARA PATTERNS (Traditional Japanese) ---
    const patterns = {};
    
    const generatePatterns = () => {
      // 1. Seigaiha (Blue Waves)
      const p1 = document.createElement('canvas');
      p1.width = 20; p1.height = 20;
      const c1 = p1.getContext('2d');
      c1.fillStyle = '#1e3a8a'; c1.fillRect(0,0,20,20);
      c1.strokeStyle = '#ffffff'; c1.lineWidth = 1.5;
      for (let y = 0; y <= 20; y += 10) {
        for (let x = (y % 20 === 0 ? 0 : -10); x <= 20; x += 20) {
          c1.beginPath(); c1.arc(x+10, y+10, 8, Math.PI, 0); c1.stroke();
          c1.beginPath(); c1.arc(x+10, y+10, 5, Math.PI, 0); c1.stroke();
          c1.beginPath(); c1.arc(x+10, y+10, 2, Math.PI, 0); c1.stroke();
        }
      }
      patterns['seigaiha_blue'] = ctx.createPattern(p1, 'repeat');

      // 2. Kumo (Purple Clouds/Storm)
      const p2 = document.createElement('canvas');
      p2.width = 24; p2.height = 24;
      const c2 = p2.getContext('2d');
      c2.fillStyle = '#4c1d95'; c2.fillRect(0,0,24,24);
      c2.strokeStyle = '#cbd5e1'; c2.lineWidth = 1.5;
      c2.beginPath();
      c2.moveTo(4, 12); c2.quadraticCurveTo(8, 4, 16, 8); c2.quadraticCurveTo(20, 12, 16, 16); c2.quadraticCurveTo(8, 20, 4, 12);
      c2.stroke();
      patterns['kumo_purple'] = ctx.createPattern(p2, 'repeat');

      // 3. Asanoha (Red Hemp Leaf)
      const p3 = document.createElement('canvas');
      p3.width = 20; p3.height = 20; // simplified star/diamond repeating
      const c3 = p3.getContext('2d');
      c3.fillStyle = '#dc2626'; c3.fillRect(0,0,20,20);
      c3.strokeStyle = '#ffffff'; c3.lineWidth = 1;
      c3.beginPath();
      c3.moveTo(10, 0); c3.lineTo(10, 20);
      c3.moveTo(0, 10); c3.lineTo(20, 10);
      c3.moveTo(0, 0); c3.lineTo(20, 20);
      c3.moveTo(20, 0); c3.lineTo(0, 20);
      c3.moveTo(10, 10); c3.lineTo(20, 0);
      c3.stroke();
      patterns['asanoha_red'] = ctx.createPattern(p3, 'repeat');

      // 4. Yagasuri (Black Arrow Feathers)
      const p4 = document.createElement('canvas');
      p4.width = 16; p4.height = 16;
      const c4 = p4.getContext('2d');
      c4.fillStyle = '#f5f5f4'; c4.fillRect(0,0,16,16);
      c4.fillStyle = '#1c1917';
      c4.beginPath();
      c4.moveTo(0, 0); c4.lineTo(8, 8); c4.lineTo(0, 16); c4.fill();
      c4.beginPath();
      c4.moveTo(16, 0); c4.lineTo(8, 8); c4.lineTo(16, 16); c4.fill();
      patterns['yagasuri_black'] = ctx.createPattern(p4, 'repeat');

      // 5. Shippo (Overlapping Circles - Flame)
      const p5 = document.createElement('canvas');
      p5.width = 20; p5.height = 20;
      const c5 = p5.getContext('2d');
      c5.fillStyle = '#9f1239'; c5.fillRect(0,0,20,20);
      c5.strokeStyle = '#fcd34d'; c5.lineWidth = 1.5;
      const drawShippoCircle = (cx, cy) => {
        c5.beginPath(); c5.arc(cx, cy, 10, 0, Math.PI*2); c5.stroke();
      };
      drawShippoCircle(0, 0); drawShippoCircle(20, 0); drawShippoCircle(0, 20); drawShippoCircle(20, 20); drawShippoCircle(10, 10);
      patterns['shippo_flame'] = ctx.createPattern(p5, 'repeat');
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
      } else if (type === 'talisman') {
        // Little paper ofuda blowing off the shrine
        p.vx = -(Math.random() * 2.5 + 1.5);
        p.vy = -(Math.random() * 1.5 + 0.5);
        p.color = '#fef08a'; // yellow paper
        p.size = Math.random() * 2 + 2;
        p.rotation = Math.random() * Math.PI;
        p.rotSpeed = (Math.random() - 0.5) * 0.2;
      } else if (type === 'bubble') {
        p.vy = -(Math.random() * 1.5 + 1);
        p.vx = (Math.random() - 0.5);
        p.color = 'rgba(255, 255, 255, 0.5)';
        p.size = Math.random() * 2.5 + 1.5;
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

      // DESIGN NOTE: In the actual game, the character is always either walking (stride)
      // or swimming. "Sword Play" is not a separate full-body state, but rather an
      // overlay animation (just the arm/hand movement) that triggers while moving
      // whenever the player slashes something. This mock isolates it for preview purposes.
      
      if (activePose === 'swimming') {
        ctx.rotate(1.2); // lean forward heavily for swimming
        ctx.translate(15, -20);
      }

      if (activePose === 'running') {
        bobY = Math.sin(runCycle * 2) * 2.2;
        headBob = Math.sin(runCycle * 2) * 1.2;
        legStride = Math.sin(runCycle) * 14;
      } else if (activePose === 'sword_play') {
        // Character keeps walking
        bobY = Math.sin(runCycle * 2) * 2.2;
        headBob = Math.sin(runCycle * 2) * 1.2;
        legStride = Math.sin(runCycle) * 14;
        
        // Alternate between two slash types every 50 frames
        let cycle = time % 50;
        let isAltSlash = (time % 100) >= 50;
        
        if (cycle < 6) {
          let p = cycle / 6;
          if (!isAltSlash) {
            // Slash 1 Windup: Hand goes HIGH and BACK, sword points UP
            swordAngle = 0.25 - p * 1.75; 
            handX = 14 - p * 9;           
            handY = -24 - p * 11;         
          } else {
            // Slash 2 Windup: Hand goes LOW and BACK, sword points DOWN
            swordAngle = 0.25 + p * 2.5;  
            handX = 14 - p * 12;          
            handY = -24 + p * 16;         
          }
        } else if (cycle < 12) {
          let p = (cycle - 6) / 6;
          if (!isAltSlash) {
            // Slash 1 Strike: Hand chops DOWN and FORWARD
            swordAngle = -1.5 + p * 2.0;  
            handX = 5 + p * 20;           
            handY = -35 + p * 30;         
          } else {
            // Slash 2 Strike: Hand slashes UP and FORWARD (Uppercut)
            swordAngle = 2.75 - p * 3.5;  
            handX = 2 + p * 28;           
            handY = -8 - p * 22;          
          }
        } else {
          // Hold and smooth return
          let p = (cycle - 12) / 38;
          let ease = p < 0.2 ? 0 : Math.pow((p - 0.2) / 0.8, 2);
          if (!isAltSlash) {
            swordAngle = 0.5 - ease * 0.25; 
            handX = 25 - ease * 11;         
            handY = -5 - ease * 19;         
          } else {
            swordAngle = -0.75 + ease * 1.0; 
            handX = 30 - ease * 16;         
            handY = -30 + ease * 6;         
          }
        }
      } else if (activePose === 'swimming') {
        bobY = Math.sin(time * 0.08) * 3;
        headBob = -Math.sin(time * 0.08) * 1.5;
        legStride = Math.sin(time * 0.2) * 10;
        handX = 5 + Math.sin(time * 0.2) * 8;
        handY = -18 + Math.cos(time * 0.2) * 5;
        swordAngle = 0.5 + Math.sin(time * 0.1) * 0.2;
      }

      // Spawn breath aura particles behind character
      if (Math.random() < 0.4) {
        spawnParticle(cx - 10 * cScale, cy + (bobY - 25) * cScale, 'breath');
      }

      // --- RENDER CHARACTER SKIN ---

      // A. Waving Scarf (Filled with Thematic Pattern)
      const scarfWave = Math.sin(runCycle * 1.5) * 12;
      ctx.save();
      const currentPattern = patterns[selectedSkin.patternType] || '#fff';
      ctx.strokeStyle = currentPattern;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -29 + bobY + headBob);
      
      if (activePose === 'swimming') {
        ctx.quadraticCurveTo(-12, -18 + bobY + scarfWave * 0.5, -25, -10 + bobY);
      } else {
        ctx.quadraticCurveTo(-18, -23 + bobY + scarfWave, -40, -29 + bobY - scarfWave * 0.7);
      }
      ctx.stroke();
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      // B. THE PORTABLE WARD-SHRINE (ZUSHI) on the Back
      const boxX = -15;
      const boxY = -5 + bobY;
      const boxW = 16;
      const boxH = 28;

      ctx.save();
      ctx.translate(boxX, boxY);

      // Shrine Body (Dark lacquered wood)
      ctx.fillStyle = '#292524'; // dark stone/wood
      ctx.fillRect(-boxW/2, -boxH, boxW, boxH);
      
      // Shrine Roof (Curved temple roof)
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-boxW/2 - 3, -boxH);
      ctx.quadraticCurveTo(0, -boxH - 6, boxW/2 + 3, -boxH);
      ctx.lineTo(boxW/2, -boxH + 2);
      ctx.lineTo(-boxW/2, -boxH + 2);
      ctx.fill();

      // Gold accents (brass fittings)
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-boxW/2, -boxH + 2, 2, 2);
      ctx.fillRect(boxW/2 - 2, -boxH + 2, 2, 2);
      ctx.fillRect(-boxW/2, -2, 2, 2);
      ctx.fillRect(boxW/2 - 2, -2, 2, 2);

      // Dark shadow door slit
      ctx.fillStyle = '#0a0a0a';
      
      // The doors slide open randomly, no more charging pose
      const isDarkPose = false;
      const crackWidth = 2;
      ctx.fillRect(boxW/2 - 1.5 - crackWidth, -boxH + 6, crackWidth, boxH - 10);

      // Shimenawa (Sacred Rope) wrapping the shrine
      ctx.strokeStyle = '#fef3c7'; // straw rope color
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-boxW/2 - 1, -boxH * 0.4);
      ctx.quadraticCurveTo(0, -boxH * 0.35, boxW/2 + 1, -boxH * 0.4);
      ctx.stroke();
      
      // Paper Talismans (Ofuda)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-boxW/2 + 2, -boxH * 0.4, 3, 7); // front-left talisman
      ctx.fillRect(boxW/2 - 5, -boxH * 0.4, 3, 6);  // front-right talisman
      ctx.fillStyle = '#dc2626'; // red ink markings
      ctx.fillRect(-boxW/2 + 2.5, -boxH * 0.4 + 1, 2, 1);
      ctx.fillRect(-boxW/2 + 2.5, -boxH * 0.4 + 3, 2, 2);
      ctx.fillRect(boxW/2 - 4.5, -boxH * 0.4 + 1, 2, 1.5);

      // Spawn floating talismans randomly when running/charging
      if (Math.random() < 0.05) {
        spawnParticle(cx + boxX * cScale, cy + (boxY - boxH * 0.4) * cScale, 'talisman');
      }

      // SISTER PEEKS OUT OF THE WARD-SHRINE
      const isPeeking = isDarkPose || (Math.sin(time * 0.03) > 0.45);
      if (isPeeking) {
        ctx.save();
        ctx.translate(boxW/2 - 1 - crackWidth/2, -boxH * 0.5);

        // Sister skin
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(-1, 0, 2, 0, Math.PI*2);
        ctx.fill();

        // Sister wild dark hair
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.moveTo(-3, -2); ctx.lineTo(-1, -4); ctx.lineTo(1, -2); ctx.lineTo(-1, 0);
        ctx.closePath(); ctx.fill();

        // Glowing cyan/green mystic eyes (different from the pink demon ones before)
        ctx.fillStyle = '#2dd4bf'; // teal glow
        ctx.shadowColor = '#2dd4bf';
        ctx.shadowBlur = 5;
        ctx.fillRect(-2, -0.8, 0.8, 0.8);
        ctx.fillRect(-0.5, -0.8, 0.8, 0.8);
        ctx.shadowBlur = 0;

        ctx.restore();
      } else {
        // Glowing dots deep inside
        if (Math.sin(time * 0.05) > -0.9) {
          ctx.fillStyle = '#2dd4bf';
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
      if (activePose === 'swimming') {
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

      // Spiky Hair / Thematic Hair
      ctx.fillStyle = selectedSkin.hairColor;
      ctx.beginPath();
      
      // Provide unique hair silhouettes for each theme
      if (selectedSkin.id === 'ronin') {
        // Tied back topknot (chonmage)
        ctx.moveTo(hx - 5, hy + 2);
        ctx.lineTo(hx - 6, hy - 4);
        ctx.lineTo(hx - 2, hy - 6);
        ctx.lineTo(hx + 2, hy - 6);
        ctx.lineTo(hx + 5, hy - 3);
        ctx.lineTo(hx + 5, hy + 2);
        // Topknot
        ctx.moveTo(hx, hy - 5);
        ctx.lineTo(hx - 8, hy - 9);
        ctx.lineTo(hx - 3, hy - 10);
      } else if (selectedSkin.id === 'tengu') {
        // Wild swept back hair
        ctx.moveTo(hx - 6, hy + 3);
        ctx.lineTo(hx - 12, hy - 4);
        ctx.lineTo(hx - 4, hy - 6);
        ctx.lineTo(hx - 6, hy - 10);
        ctx.lineTo(hx, hy - 7);
        ctx.lineTo(hx + 4, hy - 9);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 8, hy - 2);
      } else if (selectedSkin.id === 'miko') {
        // Hair framing the face to leave the skin visible
        ctx.moveTo(hx - 7, hy + 8);  // left strand bottom
        ctx.lineTo(hx - 7, hy - 4);  // top left
        ctx.lineTo(hx - 2, hy - 6);  // top center-left
        ctx.lineTo(hx + 4, hy - 5);  // top center-right
        ctx.lineTo(hx + 8, hy + 7);  // right strand bottom
        ctx.lineTo(hx + 5, hy + 1);  // right side cut-in
        ctx.lineTo(hx + 2, hy - 2);  // bangs right
        ctx.lineTo(hx - 1, hy - 1);  // bangs center
        ctx.lineTo(hx - 4, hy + 2);  // bangs left cut-in
      } else if (selectedSkin.id === 'kensei') {
        // Neat, sharp style
        ctx.moveTo(hx - 6, hy + 1);
        ctx.lineTo(hx - 7, hy - 5);
        ctx.lineTo(hx - 3, hy - 5);
        ctx.lineTo(hx - 1, hy - 8);
        ctx.lineTo(hx + 3, hy - 5);
        ctx.lineTo(hx + 6, hy - 2);
        ctx.lineTo(hx + 5, hy + 2);
      } else if (selectedSkin.id === 'kabuki') {
        // Massive lion dance hair
        ctx.moveTo(hx - 8, hy + 5);
        ctx.lineTo(hx - 14, hy - 2);
        ctx.lineTo(hx - 8, hy - 6);
        ctx.lineTo(hx - 12, hy - 12);
        ctx.lineTo(hx - 4, hy - 9);
        ctx.lineTo(hx, hy - 14);
        ctx.lineTo(hx + 4, hy - 9);
        ctx.lineTo(hx + 12, hy - 12);
        ctx.lineTo(hx + 8, hy - 6);
        ctx.lineTo(hx + 14, hy - 2);
        ctx.lineTo(hx + 8, hy + 5);
      }
      ctx.closePath();
      ctx.fill();

      // Highlights
      ctx.fillStyle = selectedSkin.hairTips;
      ctx.beginPath();
      if (selectedSkin.id === 'ronin') {
        ctx.arc(hx - 2, hy - 4, 1.5, 0, Math.PI*2);
      } else if (selectedSkin.id === 'tengu') {
        ctx.arc(hx - 5, hy - 5, 2, 0, Math.PI*2);
        ctx.arc(hx, hy - 6, 1.5, 0, Math.PI*2);
      } else if (selectedSkin.id === 'miko') {
        ctx.arc(hx - 4, hy - 4, 1.5, 0, Math.PI*2);
      } else if (selectedSkin.id === 'kensei') {
        ctx.arc(hx, hy - 6, 1.5, 0, Math.PI*2);
      } else if (selectedSkin.id === 'kabuki') {
        ctx.arc(hx - 6, hy - 8, 2, 0, Math.PI*2);
        ctx.arc(hx + 6, hy - 8, 2, 0, Math.PI*2);
      }
      ctx.fill();

      // H. Floating Hand & Tempered Katana
      // Removed the connecting arm - much easier to animate with a floating grip!
      ctx.save();
      ctx.translate(handX, handY + bobY);
      
      // Floating Hand Grip
      ctx.fillStyle = '#fbcfe8'; // skin color
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(swordAngle);

      // Sword Guard (Tsuba)
      ctx.fillStyle = selectedSkin.id === 'kabuki' ? '#dc2626' : '#d97706';
      ctx.fillRect(-1.5, -3, 3, 6);

      // Sword Handle (Tsuka) behind hand
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-5, -1.5, 3.5, 3);

      // Katana Blade
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

      // Sword slash visual arc
      if (activePose === 'sword_play') {
        let cycle = time % 50;
        let isAltSlash = (time % 100) >= 50;
        
        if (cycle >= 6 && cycle < 20) {
          let p = (cycle - 6) / 14; // fades out over 14 frames
          ctx.save();
          
          if (!isAltSlash) {
            ctx.translate(cx + 15 * cScale, cy - 15 * cScale);
            ctx.scale(cScale, cScale);
            ctx.strokeStyle = selectedSkin.accentColor;
            ctx.shadowColor = selectedSkin.accentColor;
            ctx.shadowBlur = 10;
            ctx.lineWidth = 6 * (1 - p);
            ctx.lineCap = 'round';
            ctx.beginPath();
            // Top-to-bottom arc
            ctx.arc(0, 0, 35, -1.5, -1.5 + 2.0 * Math.min(1, p * 2));
          } else {
            ctx.translate(cx + 20 * cScale, cy - 20 * cScale);
            ctx.scale(cScale, cScale);
            ctx.strokeStyle = selectedSkin.accentColor;
            ctx.shadowColor = selectedSkin.accentColor;
            ctx.shadowBlur = 10;
            ctx.lineWidth = 6 * (1 - p);
            ctx.lineCap = 'round';
            ctx.beginPath();
            // Bottom-to-top upward arc (anticlockwise)
            ctx.arc(0, 0, 40, 0.5, 0.5 - 2.0 * Math.min(1, p * 2), true);
          }
          
          ctx.stroke();

          // Inner white core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 * (1 - p);
          ctx.shadowBlur = 0;
          ctx.stroke();
          
          ctx.restore();
        }
      }

      // Water bubbles when swimming
      if (activePose === 'swimming' && Math.random() < 0.3) {
        spawnParticle(cx + Math.random() * 40 - 20, cy + 20, 'bubble');
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
        } else if (p.type === 'talisman') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation + time * p.rotSpeed);
          ctx.fillRect(-p.size/2, -p.size, p.size, p.size * 2);
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
              Original Lore Designs
            </span>
            <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
              Wagara Fabric Patterns
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-wide mt-1">
            🏮 Warden Thematic Styles
          </h2>
          <p className="text-xs text-slate-400">
            Preview our 5 legally distinct, rich Japanese aesthetic designs. The cursed sibling is carried in a Portable Ward-Shrine (Zushi) bound by sacred ropes.
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
              { id: 'running', label: '🏃‍♂️ Stride' },
              { id: 'sword_play', label: '⚔️ Sword Play' },
              { id: 'swimming', label: '🌊 Swimming' }
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
          Select Warden Identity
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
              Identity Specs
            </span>
            <h4 className="text-base font-bold text-red-400 mt-0.5">
              {selectedSkin.name}
            </h4>
          </div>

          <div className="flex-1 flex flex-col gap-3.5 text-xs">
            <div className="text-slate-300 italic text-[11px] leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
              "{selectedSkin.description}"
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Carrier:</span>
                <span className="font-semibold text-slate-200 uppercase">Portable Ward-Shrine (Zushi)</span>
              </div>
              <div className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Wagara Pattern:</span>
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
