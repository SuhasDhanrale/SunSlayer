import React, { useState, useEffect, useRef } from 'react';

const SKINS = [
  {
    id: 'tanjiro',
    name: 'Checkered Sun',
    rarity: 'Legendary',
    rarityTextClass: 'text-amber-400',
    rarityBorderClass: 'border-amber-500/80',
    rarityBgClass: 'bg-amber-500',
    description: 'Wearing the signature green-and-black checkered Haori, with spiky dark-red hair and dangling hanafuda card earrings.',
    visualStyle: { backgroundImage: 'repeating-linear-gradient(45deg, #065f46 25%, transparent 25%, transparent 75%, #065f46 75%, #065f46), repeating-linear-gradient(45deg, #065f46 25%, #1c1917 25%, #1c1917 75%, #065f46 75%, #065f46)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' },
    accentColor: '#10b981', 
    hairColor: '#450a0a',   
    hairTips: '#991b1b',
    hasEarrings: true,
    patternType: 'checkered_green'
  },
  {
    id: 'zenitsu',
    name: 'Thunder Flash',
    rarity: 'Epic',
    rarityTextClass: 'text-purple-400',
    rarityBorderClass: 'border-purple-500/80',
    rarityBgClass: 'bg-purple-500',
    description: 'Wearing a yellow-and-orange striped Haori, with bright yellow spiky hair that flares orange at the tips.',
    visualStyle: { backgroundImage: 'linear-gradient(135deg, #facc15 0%, #ea580c 100%)' },
    accentColor: '#fbbf24', 
    hairColor: '#eab308',   
    hairTips: '#f97316',    
    hasEarrings: false,
    patternType: 'striped_yellow'
  },
  {
    id: 'nezuko',
    name: 'Blossom Warden',
    rarity: 'Rare',
    rarityTextClass: 'text-blue-400',
    rarityBorderClass: 'border-blue-500/80',
    rarityBgClass: 'bg-blue-500',
    description: 'Wearing a pink-and-white diamond checkered Haori, with flowing long pink-and-black spiky hair.',
    visualStyle: { backgroundImage: 'repeating-linear-gradient(45deg, #fbcfe8 0px, #fbcfe8 10px, #ffffff 10px, #ffffff 20px)' },
    accentColor: '#f472b6', 
    hairColor: '#18181b',   
    hairTips: '#ec4899',    
    hasEarrings: false,
    patternType: 'diamond_pink'
  },
  {
    id: 'giyu',
    name: 'Water Torrent',
    rarity: 'Epic',
    rarityTextClass: 'text-purple-400',
    rarityBorderClass: 'border-purple-500/80',
    rarityBgClass: 'bg-purple-500',
    description: 'Wearing a deep teal Haori with white wave slice patterns, with spiky black hair tied back in a low ponytail.',
    visualStyle: { backgroundImage: 'linear-gradient(to right, #0284c7, #082f49)' },
    accentColor: '#06b6d4', 
    hairColor: '#09090b',   
    hairTips: '#0f172a',
    hasEarrings: false,
    patternType: 'wave_blue'
  },
  {
    id: 'rengoku',
    name: 'Flame Pillar',
    rarity: 'Legendary',
    rarityTextClass: 'text-amber-400',
    rarityBorderClass: 'border-amber-500/80',
    rarityBgClass: 'bg-amber-500',
    description: 'Wearing a red-and-yellow flame-sliced Haori, with wild spiky yellow hair and crimson streaks.',
    visualStyle: { backgroundImage: 'linear-gradient(to top, #dc2626, #facc15)' },
    accentColor: '#ef4444', 
    hairColor: '#facc15',   
    hairTips: '#dc2626',    
    hasEarrings: false,
    patternType: 'flame_red'
  }
];

const ELEMENTS = [
  { id: 'wind', name: 'Jade Wind', color: '#10b981', colorClass: 'text-emerald-400', visualStyle: { background: 'radial-gradient(circle, #34d399 0%, #064e3b 100%)' } },
  { id: 'water', name: 'Azure Stream', color: '#38bdf8', colorClass: 'text-sky-400', visualStyle: { background: 'radial-gradient(circle, #38bdf8 0%, #0c4a6e 100%)' } },
  { id: 'thunder', name: 'Golden Spark', color: '#facc15', colorClass: 'text-yellow-400', visualStyle: { background: 'radial-gradient(circle, #fde047 0%, #713f12 100%)' } },
  { id: 'flame', name: 'Crimson Flare', color: '#ef4444', colorClass: 'text-red-500', visualStyle: { background: 'radial-gradient(circle, #f87171 0%, #7f1d1d 100%)' } }
];

export const WardrobeSlashesMock = () => {
  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [selectedSkin, setSelectedSkin] = useState(SKINS[0]);
  const [selectedElement, setSelectedElement] = useState(ELEMENTS[0]);

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- GEOMETRIC FABRIC PATTERNS ---
    const patterns = {};
    const generatePatterns = () => {
      const p1 = document.createElement('canvas'); p1.width = 12; p1.height = 12;
      const c1 = p1.getContext('2d'); c1.fillStyle = '#065f46'; c1.fillRect(0,0,12,12); c1.fillStyle = '#1c1917'; c1.fillRect(0, 0, 6, 6); c1.fillRect(6, 6, 6, 6);
      patterns['checkered_green'] = ctx.createPattern(p1, 'repeat');

      const p2 = document.createElement('canvas'); p2.width = 16; p2.height = 16;
      const c2 = p2.getContext('2d'); c2.fillStyle = '#f59e0b'; c2.fillRect(0,0,16,16); c2.strokeStyle = '#ea580c'; c2.lineWidth = 4; c2.beginPath(); c2.moveTo(0,0); c2.lineTo(16,16); c2.moveTo(-8,8); c2.lineTo(8,24); c2.moveTo(8,-8); c2.lineTo(24,8); c2.stroke();
      patterns['striped_yellow'] = ctx.createPattern(p2, 'repeat');

      const p3 = document.createElement('canvas'); p3.width = 14; p3.height = 14;
      const c3 = p3.getContext('2d'); c3.fillStyle = '#fbcfe8'; c3.fillRect(0,0,14,14); c3.fillStyle = '#ffffff'; c3.beginPath(); c3.moveTo(7,0); c3.lineTo(14,7); c3.lineTo(7,14); c3.lineTo(0,7); c3.closePath(); c3.fill();
      patterns['diamond_pink'] = ctx.createPattern(p3, 'repeat');

      const p4 = document.createElement('canvas'); p4.width = 18; p4.height = 18;
      const c4 = p4.getContext('2d'); c4.fillStyle = '#0284c7'; c4.fillRect(0,0,18,18); c4.strokeStyle = '#ffffff'; c4.lineWidth = 2.5; c4.beginPath(); c4.moveTo(-4, 9); c4.quadraticCurveTo(5, 0, 14, 9); c4.moveTo(5, 18); c4.quadraticCurveTo(14, 9, 23, 18); c4.stroke();
      patterns['wave_blue'] = ctx.createPattern(p4, 'repeat');

      const p5 = document.createElement('canvas'); p5.width = 20; p5.height = 20;
      const c5 = p5.getContext('2d'); c5.fillStyle = '#dc2626'; c5.fillRect(0,0,20,20); c5.fillStyle = '#fbbf24'; c5.beginPath(); c5.moveTo(0, 20); c5.lineTo(4, 8); c5.lineTo(8, 16); c5.lineTo(12, 4); c5.lineTo(16, 14); c5.lineTo(20, 20); c5.closePath(); c5.fill();
      patterns['flame_red'] = ctx.createPattern(p5, 'repeat');
    };
    generatePatterns();

    // Particle System
    let particles = [];
    const particleBudget = 150;
    const spawnElementalParticles = (x, y, element, count = 10, angle = 0) => {
      for (let i = 0; i < count; i++) {
        if (particles.length >= particleBudget) particles.shift();
        const pAngle = angle + (Math.random() - 0.5) * Math.PI * 1.2;
        const speed = Math.random() * 6 + 2.5;
        let p = {
          x, y,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed,
          life: 0,
          maxLife: Math.floor(Math.random() * 25) + 20,
          size: Math.random() * 4 + 2,
          element
        };

        if (element === 'wind') {
          p.color = Math.random() > 0.35 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(244, 244, 245, 0.9)';
          p.type = 'leaf';
          p.rot = Math.random() * Math.PI;
          p.rotSpeed = (Math.random() - 0.5) * 0.15;
          p.size = Math.random() * 6 + 3;
        } else if (element === 'water') {
          p.color = Math.random() > 0.3 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.95)';
          p.type = Math.random() > 0.5 ? 'bubble' : 'droplet';
          p.vy -= 1.2;
        } else if (element === 'thunder') {
          p.color = Math.random() > 0.3 ? '#fde047' : '#ffffff';
          p.type = 'bolt-spark';
          p.vx *= 1.8; p.vy *= 1.8;
        } else if (element === 'flame') {
          p.vy = -Math.random() * 4.5 - 2;
          p.vx = (Math.random() - 0.5) * 4;
          if (Math.random() > 0.65) {
            p.type = 'smoke'; p.size = Math.random() * 12 + 6;
          } else {
            p.type = 'flame'; p.color = '#ffffff'; p.size = Math.random() * 10 + 6;
          }
        }
        particles.push(p);
      }
    };

    let raf;
    let time = 0;
    let swipePoints = [];

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h * 0.75;
      const cx = w * 0.5; // Position character in center
      const cy = groundY;
      const cScale = Math.min(w, h) * 0.006; // slightly larger scale

      // 1. Draw solid dark anime background
      ctx.fillStyle = '#09090b'; 
      ctx.fillRect(0, 0, w, h);

      // Diagonal stylized cuts in background
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w * 0.6, 0); ctx.lineTo(w * 0.4, h); ctx.lineTo(0, h);
      ctx.fill();

      // Giant Japanese Calligraphy watermark
      ctx.save();
      ctx.translate(w * 0.7, h * 0.5);
      ctx.font = `bold ${Math.min(w, h) * 0.4}px serif`;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.04)'; // faint red
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("斬", 0, 0);
      ctx.restore();

      // Ground plane line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(cScale, cScale);

      // Slash combo animation cycle
      const cycle = (time % 180) / 180; 
      let activePose = 'charging';
      let swordAngle = -1.5;
      let handX = 4;
      let handY = -15;
      let bobY = 5;
      let isStriking = false;

      // Frame animation logic for two quick slashes
      if (cycle > 0.4 && cycle < 0.6) {
        activePose = 'slashing';
        const strikeProg = (cycle - 0.4) / 0.2;
        handX = 20; handY = -21; bobY = 3.5;
        if (strikeProg < 0.2) swordAngle = -1.5 + strikeProg * 5 * 2.8; // swing down
        else if (strikeProg < 0.5) { swordAngle = 1.3; isStriking = true; } // hold bottom
        else if (strikeProg < 0.7) swordAngle = 1.3 - (strikeProg - 0.5) * 5 * 2.8; // swing up
        else { swordAngle = -1.5; isStriking = true; } // hold top
      }

      // Record sword tip for trails
      if (activePose === 'slashing') {
        const tipX = cx + (handX + Math.cos(swordAngle) * 34) * cScale;
        const tipY = cy + (handY + Math.sin(swordAngle) * 34) * cScale;
        swipePoints.push({ x: tipX, y: tipY });
        if (swipePoints.length > 15) swipePoints.shift();
        
        if (isStriking && Math.random() < 0.4) {
          spawnElementalParticles(tipX, tipY, selectedElement.id, 3, swordAngle);
        }
      } else {
        if (swipePoints.length > 0) swipePoints.shift();
      }

      // --- RENDER CHARACTER SKIN ---
      const currentPattern = patterns[selectedSkin.patternType] || '#fff';

      // Scarf
      const scarfWave = Math.sin(time * 0.1) * 8;
      ctx.save();
      ctx.strokeStyle = currentPattern;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -29 + bobY);
      ctx.quadraticCurveTo(-12, -18 + bobY + scarfWave * 0.5, -25, -10 + bobY);
      ctx.stroke();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.0; ctx.stroke();
      ctx.restore();

      // Wooden Box
      const boxX = -15; const boxY = -20 + bobY; const boxW = 14; const boxH = 25;
      ctx.save();
      ctx.translate(boxX, boxY);
      ctx.fillStyle = '#653c24'; ctx.fillRect(-boxW/2, -boxH, boxW, boxH);
      ctx.fillStyle = '#18120e'; ctx.fillRect(boxW/2 - 1.5 - 4.5, -boxH + 3, 4.5, boxH - 6);
      ctx.fillStyle = '#1c1917'; ctx.fillRect(-boxW/2 - 0.5, -boxH, boxW + 1, 2.5); ctx.fillRect(-boxW/2 - 0.5, -2.5, boxW + 1, 2.5);
      ctx.fillStyle = '#f472b6';
      if (Math.sin(time * 0.05) > 0.5) {
        ctx.beginPath(); ctx.arc(boxW/2 - 2.5, -boxH * 0.5 - 1.5, 0.8, 0, Math.PI * 2); ctx.arc(boxW/2 - 2.5, -boxH * 0.5 + 1, 0.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // Legs
      ctx.save();
      ctx.strokeStyle = '#18181b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(13 * 0.6, 11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13 * 0.6, 11); ctx.stroke();
      ctx.restore();

      // Chest
      ctx.fillStyle = '#1c1917';
      ctx.beginPath(); ctx.moveTo(-9, bobY); ctx.lineTo(9, bobY); ctx.lineTo(7, -23 + bobY); ctx.lineTo(-7, -23 + bobY); ctx.closePath(); ctx.fill();

      // Belt
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-6.5, -9 + bobY, 13, 2.5);

      // Haori
      ctx.save();
      ctx.fillStyle = currentPattern;
      ctx.beginPath(); ctx.moveTo(-8, -20 + bobY); ctx.lineTo(-2, -20 + bobY); ctx.lineTo(-8, bobY); ctx.lineTo(-12, bobY); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-9, -21 + bobY); ctx.lineTo(-1, -21 + bobY); ctx.lineTo(-5, -7 + bobY); ctx.lineTo(-12, -7 + bobY); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(9, -21 + bobY); ctx.lineTo(1, -21 + bobY); ctx.lineTo(5, -7 + bobY); ctx.lineTo(12, -7 + bobY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.0; ctx.stroke();
      ctx.restore();

      // Head
      const hx = 0; const hy = -28 + bobY;
      ctx.fillStyle = '#fbcfe8'; ctx.beginPath(); ctx.arc(hx, hy + 3, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = selectedSkin.hairColor;
      ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill(); // simplified hair base
      
      // Arm & Sword
      ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(3, -16 + bobY); ctx.lineTo(handX, handY + bobY); ctx.stroke();

      ctx.save();
      ctx.translate(handX, handY + bobY);
      ctx.rotate(swordAngle);
      ctx.fillStyle = '#d97706'; ctx.fillRect(-1.5, -3, 3, 6);
      ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-8, 0); ctx.stroke();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(34, 0); ctx.stroke();
      ctx.restore();

      ctx.restore(); // Restore main scale

      // 3. Render Active Gesture Slash Trail (Ukiyo-e)
      if (swipePoints.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const el = selectedElement.id;

        if (el === 'wind') {
          ctx.strokeStyle = '#065f46'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(swipePoints[0].x, swipePoints[0].y); for (let i = 1; i < swipePoints.length; i++) ctx.lineTo(swipePoints[i].x, swipePoints[i].y); ctx.stroke();
          ctx.strokeStyle = '#10b981'; ctx.lineWidth = 8; ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
        } 
        else if (el === 'water') {
          for (let i = 1; i < swipePoints.length; i++) {
            const p = swipePoints[i]; const prev = swipePoints[i - 1]; const r = (i / swipePoints.length) * 26 + 10; const angle = Math.atan2(p.y - prev.y, p.x - prev.x);
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(angle);
            ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#020617'; ctx.lineWidth = 4; ctx.stroke();
            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.15, r * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.9); ctx.quadraticCurveTo(r * 0.4, -r * 0.4, -r * 0.25, -r * 0.15); ctx.quadraticCurveTo(-r * 0.6, -r * 0.1, -r * 0.9, -r * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
          }
        }
        else if (el === 'thunder') {
          ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
          for (let i = 1; i < swipePoints.length; i++) {
            const p = swipePoints[i]; const dx = (Math.random() - 0.5) * 25; const dy = (Math.random() - 0.5) * 25;
            ctx.lineTo(p.x + dx, p.y + dy);
          }
          ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
        }
        else if (el === 'flame') {
          for (let i = 1; i < swipePoints.length; i++) {
            const p = swipePoints[i]; const r = (i / swipePoints.length) * 30 + 15;
            ctx.save(); ctx.translate(p.x, p.y);
            ctx.fillStyle = '#991b1b'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.4, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // 4. Update and render particles pool
      particles.forEach((p, idx) => {
        p.life++;
        if (p.life >= p.maxLife) { particles.splice(idx, 1); return; }
        p.x += p.vx; p.y += p.vy;
        const lifeRatio = 1 - (p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = lifeRatio * 0.8;
        if (p.element === 'wind' && p.type === 'leaf') {
          ctx.fillStyle = p.color; ctx.translate(p.x, p.y); ctx.rotate(p.rot + p.life * p.rotSpeed);
          ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        } else if (p.element === 'water' && p.type === 'bubble') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
        } else if (p.element === 'thunder') {
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(p.x, p.y - p.size); ctx.lineTo(p.x + p.size, p.y); ctx.lineTo(p.x, p.y + p.size); ctx.lineTo(p.x - p.size, p.y); ctx.fill();
        } else if (p.element === 'flame') {
          ctx.fillStyle = p.type === 'smoke' ? 'rgba(30, 27, 38, 0.45)' : '#facc15';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [selectedSkin, selectedElement]);

  const handleScroll = (e) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragDistance(0);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftPos(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    setDragDistance(Math.abs(x - startX));
    scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-white font-sans overflow-hidden relative">
      
      {/* Decorative Anime Cut Lines */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 right-[25%] w-1 h-full bg-red-600/20 -skew-x-12 transform origin-top" />
        <div className="absolute top-0 right-[28%] w-[2px] h-full bg-red-500/40 -skew-x-12 transform origin-top" />
      </div>

      {/* Main Canvas Area (70%) */}
      <div className="h-[70%] relative z-10 flex-shrink-0">
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {/* Overlay Badges */}
        <div className="absolute top-6 left-6 flex items-center gap-4 border-l-4 border-red-500 pl-4">
          <div className="flex flex-col">
            <span className="text-3xl font-serif italic font-black uppercase tracking-widest drop-shadow-lg">
              Showcase
            </span>
            <span className="text-xs font-mono text-red-500 tracking-[0.3em] uppercase">
              Wardrobe & Slashes
            </span>
          </div>
        </div>
      </div>

      {/* Bottom UI Panel (30% Scrollable Cards) */}
      <div 
        ref={scrollContainerRef}
        onWheel={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClickCapture={(e) => {
          if (dragDistance > 5) {
            e.stopPropagation();
          }
        }}
        className={`h-[30%] w-full relative z-20 bg-[#0c0f12] flex flex-row items-center border-t border-slate-800/80 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] overflow-x-auto overflow-y-hidden px-8 gap-10 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
      >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        {/* Section: Outfit Selection */}
        <div className="flex flex-col h-full py-5 justify-center relative z-10 shrink-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-slate-400 font-serif tracking-widest text-[11px] uppercase">Outfit Gallery</span>
          </div>

          <div className="flex gap-4 items-center pb-2">
            {SKINS.map(skin => (
              <button
                key={skin.id}
                onClick={() => setSelectedSkin(skin)}
                className={`group relative flex flex-col justify-end w-48 h-28 border transition-all duration-300 overflow-hidden shrink-0 cursor-pointer ${
                  selectedSkin.id === skin.id 
                    ? `${skin.rarityBorderClass} shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105` 
                    : 'border-slate-800/80 hover:border-slate-600/80 hover:scale-105'
                }`}
              >
                {/* Visual Background Pattern */}
                <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity duration-500" style={skin.visualStyle} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f12] via-[#0c0f12]/80 to-transparent pointer-events-none" />
                
                {/* Rarity Corner Indicator */}
                <div className={`absolute top-0 right-0 w-8 h-8 transition-colors ${selectedSkin.id === skin.id ? skin.rarityBgClass : 'bg-slate-800/50 group-hover:bg-slate-700/80'}`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
                
                <div className="p-3 pl-4 text-left w-full flex flex-col justify-end relative z-10">
                  <span className={`block font-serif italic text-sm tracking-widest ${selectedSkin.id === skin.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}`}>
                    {skin.name}
                  </span>
                  <span className={`block text-[9px] uppercase font-bold tracking-widest mt-0.5 ${skin.rarityTextClass}`}>
                    {skin.rarity}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-1/3 bg-slate-800/60 shrink-0 relative z-10"></div>

        {/* Section: Element Selection */}
        <div className="flex flex-col h-full py-5 justify-center relative z-10 shrink-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-slate-400 font-serif tracking-widest text-[11px] uppercase">Breath Effect</span>
          </div>

          <div className="flex gap-4 items-center pb-2">
            {ELEMENTS.map(el => (
              <button
                key={el.id}
                onClick={() => setSelectedElement(el)}
                className={`group relative flex items-center justify-center w-36 h-28 border transition-all duration-300 overflow-hidden shrink-0 cursor-pointer ${
                  selectedElement.id === el.id
                    ? `border-[${el.color}] shadow-[0_0_15px_rgba(220,38,38,0.2)] scale-105`
                    : 'border-slate-800/80 hover:border-slate-600/80 hover:scale-105'
                }`}
                style={{ borderColor: selectedElement.id === el.id ? el.color : '' }}
              >
                {/* Visual Background */}
                <div className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500" style={el.visualStyle} />
                <div className="absolute inset-0 bg-[#0c0f12]/60 pointer-events-none" />

                <span className={`relative z-10 block font-serif italic text-sm tracking-widest text-center ${
                  selectedElement.id === el.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}>
                  {el.name}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
