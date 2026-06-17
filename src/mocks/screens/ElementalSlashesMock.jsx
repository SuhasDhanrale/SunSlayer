import { useEffect, useRef, useState } from 'react';
import { Sword, Zap, Flame, Droplets, Wind, RefreshCw, Layers } from 'lucide-react';

const DEMON_TYPES = [
  {
    type: 'oni',
    color: '#dc2626',
    radius: 35,
    name: 'Oni',
    drawShape: (ctx, r) => {
      ctx.beginPath();
      ctx.arc(0, 5, r * 0.9, 0, Math.PI, false);
      ctx.lineTo(-r * 0.9, -r * 0.2);
      ctx.quadraticCurveTo(-r * 0.6, -r * 0.95, 0, -r * 0.95);
      ctx.quadraticCurveTo(r * 0.6, -r * 0.95, r * 0.9, -r * 0.2);
      ctx.closePath();
      ctx.fill();

      // Horns
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.85);
      ctx.quadraticCurveTo(-r * 0.9, -r * 1.1, -r * 0.95, -r * 1.5);
      ctx.quadraticCurveTo(-r * 0.5, -r * 1.1, -r * 0.2, -r * 0.85);
      ctx.moveTo(r * 0.5, -r * 0.85);
      ctx.quadraticCurveTo(r * 0.9, -r * 1.1, r * 0.95, -r * 1.5);
      ctx.quadraticCurveTo(r * 0.5, -r * 1.1, r * 0.2, -r * 0.85);
      ctx.closePath();
      ctx.fill();

      // Eyes & Fangs
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.25, r * 0.18, r * 0.08, 0.25, 0, Math.PI * 2);
      ctx.ellipse(r * 0.3, -r * 0.25, r * 0.18, r * 0.08, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, r * 0.45); ctx.lineTo(-r * 0.55, r * 0.75); ctx.lineTo(-r * 0.3, r * 0.45);
      ctx.moveTo(r * 0.45, r * 0.45); ctx.lineTo(r * 0.55, r * 0.75); ctx.lineTo(r * 0.3, r * 0.45);
      ctx.closePath();
      ctx.fill();
    }
  },
  {
    type: 'kitsune',
    color: '#f8fafc',
    radius: 30,
    name: 'Kitsune',
    drawShape: (ctx, r) => {
      ctx.beginPath();
      ctx.moveTo(0, r * 1.2);
      ctx.lineTo(-r * 0.85, 0);
      ctx.lineTo(-r * 0.85, -r * 0.45);
      ctx.lineTo(0, -r * 0.85);
      ctx.lineTo(r * 0.85, -r * 0.45);
      ctx.lineTo(r * 0.85, 0);
      ctx.closePath();
      ctx.fill();

      // Cyan Eyes
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.22, r * 0.16, r * 0.06, 0.2, 0, Math.PI * 2);
      ctx.ellipse(r * 0.3, -r * 0.22, r * 0.16, r * 0.06, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Cheek markings
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.15); ctx.lineTo(-r * 0.4, r * 0.05); ctx.lineTo(-r * 0.8, r * 0.1);
      ctx.moveTo(r * 0.8, -r * 0.15); ctx.lineTo(r * 0.4, r * 0.05); ctx.lineTo(r * 0.8, r * 0.1);
      ctx.fill();

      // Ears
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.35); ctx.lineTo(-r * 0.95, -r * 1.15); ctx.lineTo(-r * 0.3, -r * 0.65);
      ctx.moveTo(r * 0.7, -r * 0.35); ctx.lineTo(r * 0.95, -r * 1.15); ctx.lineTo(r * 0.3, -r * 0.65);
      ctx.closePath();
      ctx.fill();
    }
  },
  {
    type: 'tengu',
    color: '#7f1d1d',
    radius: 32,
    name: 'Tengu',
    drawShape: (ctx, r) => {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

      // Beak
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.15);
      ctx.quadraticCurveTo(-r * 1.2, -r * 0.1, -r * 1.6, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.8, r * 0.6, 0, r * 0.45);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.25, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.25, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.25, r * 0.06, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.25, r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
];

export const ElementalSlashesMock = () => {
  const canvasRef = useRef(null);
  
  // Custom states
  const [activeElement, setActiveElement] = useState('auto'); // 'auto', 'wind', 'water', 'thunder', 'flame'
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [particleBudget, setParticleBudget] = useState(200); // pool size limit
  const [hitstopDuration, setHitstopDuration] = useState(40); // ms of screen freeze on hit
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Stats
  const [score, setScore] = useState(0);

  // Determine element based on selection or current combo
  const getEffectiveElement = () => {
    if (activeElement !== 'auto') return activeElement;
    if (combo >= 15) return 'flame';      // Blazing Fire
    if (combo >= 10) return 'thunder';    // Electric Thunder
    if (combo >= 5) return 'water';      // Flowing Water
    return 'wind';                      // Gentle Wind/Jade
  };

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

    // Gameplay Sandbox variables
    let scoreCount = 0;
    let comboCount = 0;
    let maxComboCount = 0;
    let swipePoints = []; // [{x, y, time}]
    let demons = [];
    let particles = []; // Object pool for performance
    let isMouseDown = false;
    let time = 0;
    let shakeAmt = 0;
    let hitstopTimer = 0; // hitstop freeze frames

    const spawnDemon = () => {
      const w = canvas.width;
      const h = canvas.height;
      const typeData = DEMON_TYPES[Math.floor(Math.random() * DEMON_TYPES.length)];
      
      // Spawn either side (80%) or bottom (20%)
      const sideSpawn = Math.random() < 0.8;
      let x, y, vx, vy, gravity;

      if (sideSpawn) {
        x = w + 50;
        y = Math.random() * (h * 0.5) + h * 0.15;
        vx = -(Math.random() * 4 + 6);
        vy = (Math.random() - 0.5) * 1.5;
        gravity = 0.02;
      } else {
        x = Math.random() * (w * 0.5) + w * 0.25;
        y = h + 50;
        vx = (Math.random() - 0.5) * 2;
        vy = -(Math.random() * 6 + 11);
        gravity = 0.38;
      }

      demons.push({
        id: Math.random(),
        x, y, vx, vy, gravity,
        ...typeData,
        isSliced: false,
        sliceAngle: 0,
        sliceX: 0,
        sliceY: 0,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        leftHalf: null, rightHalf: null
      });
    };

    // Spawn elemental specific particles
    const spawnElementalParticles = (x, y, element, count = 15, angle = 0) => {
      for (let i = 0; i < count; i++) {
        // Enforce particle budget ceiling
        if (particles.length >= particleBudget) {
          particles.shift(); // discard oldest to maintain pool size
        }

        const pAngle = angle + (Math.random() - 0.5) * Math.PI * 1.2;
        const speed = Math.random() * 6 + 2.5;
        
        let p = {
          x, y,
          vx: Math.cos(pAngle) * speed + (Math.random() - 0.5) * 1.5,
          vy: Math.sin(pAngle) * speed + (Math.random() - 0.5) * 1.5,
          life: 0,
          maxLife: Math.floor(Math.random() * 25) + 20,
          size: Math.random() * 4 + 2,
          element
        };

        if (element === 'wind') {
          const rand = Math.random();
          if (rand > 0.82) {
            // Shoots fast along normal angle as a flying vacuum blade crescent!
            const normalAngle = angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2) + (Math.random() - 0.5) * 0.25;
            const shootSpeed = Math.random() * 8 + 6;
            p.vx = Math.cos(normalAngle) * shootSpeed;
            p.vy = Math.sin(normalAngle) * shootSpeed;
            p.size = Math.random() * 18 + 12;
            p.type = 'vacuum-blade';
            p.rot = normalAngle;
            p.maxLife = 25;
          } else if (rand > 0.4) {
            p.color = Math.random() > 0.35 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(244, 244, 245, 0.9)';
            p.type = 'leaf';
            p.rot = Math.random() * Math.PI;
            p.rotSpeed = (Math.random() - 0.5) * 0.15;
            p.size = Math.random() * 6 + 3;
            // Tornado orbital variables
            p.centerX = x;
            p.centerY = y;
            p.orbitRadius = Math.random() * 45 + 15;
            p.orbitAngle = Math.random() * Math.PI * 2;
            p.orbitSpeed = (Math.random() * 0.08 + 0.08) * (Math.random() > 0.5 ? 1 : -1);
          } else {
            p.color = 'rgba(244, 244, 245, 0.5)';
            p.type = 'smoke';
            p.size = Math.random() * 8 + 4;
          }
        } else if (element === 'water') {
          p.color = Math.random() > 0.3 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.95)'; // Sky blue / White
          p.type = Math.random() > 0.5 ? 'bubble' : 'droplet';
          p.size = Math.random() * 6 + 2;
          p.vy -= 1.2; // float upwards slightly
        } else if (element === 'thunder') {
          p.color = Math.random() > 0.3 ? '#fde047' : '#ffffff'; // Neon yellow / White
          p.type = 'bolt-spark';
          p.size = Math.random() * 3.5 + 1.5;
          p.vx *= 1.8; // explode outwards quickly
          p.vy *= 1.8;
        } else if (element === 'flame') {
          const rand = Math.random();
          p.size = Math.random() * 10 + 6;
          p.vy = -Math.random() * 4.5 - 2; // rise rapidly upwards
          p.vx = (Math.random() - 0.5) * 4;
          
          if (rand > 0.65) {
            p.type = 'smoke'; // dark rising soot smoke
            p.size = Math.random() * 12 + 6;
          } else {
            p.type = 'flame';
            p.color = '#ffffff'; // start white hot
          }
        }

        particles.push(p);
      }
    };

    // Check slash hits
    const checkSlice = (demon, el) => {
      if (demon.isSliced || swipePoints.length < 2) return false;

      const p1 = swipePoints[swipePoints.length - 2];
      const p2 = swipePoints[swipePoints.length - 1];

      // Distance check from circle
      const A = p2.x - p1.x;
      const B = p2.y - p1.y;
      const C = p1.x - demon.x;
      const D = p1.y - demon.y;

      const dot = A * C + B * D;
      const lenSq = A * A + B * B;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;
      if (param < 0) { xx = p1.x; yy = p1.y; }
      else if (param > 1) { xx = p2.x; yy = p2.y; }
      else { xx = p1.x - param * A; yy = p1.y - param * B; }

      const dist = Math.hypot(demon.x - xx, demon.y - yy);

      if (dist < demon.radius) {
        demon.isSliced = true;
        demon.sliceX = xx;
        demon.sliceY = yy;
        
        const angle = Math.atan2(B, A);
        demon.sliceAngle = angle;

        // Split halves push vectors
        demon.leftHalf = {
          x: 0, y: 0,
          vx: -Math.sin(angle) * 4.5 + demon.vx * 0.4,
          vy: Math.cos(angle) * 4.5 + demon.vy * 0.4,
          rot: 0, rotSpeed: -0.09
        };
        demon.rightHalf = {
          x: 0, y: 0,
          vx: Math.sin(angle) * 4.5 + demon.vx * 0.4,
          vy: -Math.cos(angle) * 4.5 + demon.vy * 0.4,
          rot: 0, rotSpeed: 0.09
        };

        // Hit effects!
        shakeAmt = el === 'thunder' ? 22 : el === 'flame' ? 18 : 12;
        hitstopTimer = Math.round(hitstopDuration / 16.67); // Translate ms to frames

        // Spawn extra large burst particles
        spawnElementalParticles(xx, yy, el, 30, angle);
        
        // Haptic feedback API simulation
        if (hapticsEnabled && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(el === 'thunder' ? [20, 10, 20] : [15]);
        }

        return true;
      }
      return false;
    };

    const getCanvasCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * dpr,
        y: (clientY - rect.top) * dpr
      };
    };

    const handleStart = (e) => {
      isMouseDown = true;
      swipePoints = [];
      const coords = getCanvasCoords(e);
      swipePoints.push({ ...coords, time: Date.now() });
    };

    const handleMove = (e) => {
      if (!isMouseDown) return;
      const coords = getCanvasCoords(e);
      swipePoints.push({ ...coords, time: Date.now() });

      if (swipePoints.length > 15) swipePoints.shift();

      const el = getEffectiveElement();

      // Spawn ambient trail particles as user moves
      if (Math.random() < 0.65) {
        spawnElementalParticles(coords.x, coords.y, el, 2, Math.random() * Math.PI * 2);
      }

      let hits = 0;
      demons.forEach(d => {
        if (checkSlice(d, el)) {
          hits++;
          scoreCount++;
          setScore(scoreCount);
        }
      });

      if (hits > 0) {
        comboCount += hits;
        setCombo(comboCount);
        if (comboCount > maxComboCount) {
          maxComboCount = comboCount;
          setMaxCombo(maxComboCount);
        }
      }
    };

    const handleEnd = () => {
      isMouseDown = false;
      swipePoints = [];
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    let active = true;

    // Draw Loop
    const frame = () => {
      if (!active) return;

      // Handle Hitstop freeze frame
      if (hitstopTimer > 0) {
        hitstopTimer--;
        raf = requestAnimationFrame(frame);
        return;
      }

      time++;

      const w = canvas.width;
      const h = canvas.height;

      // Screen shake translation
      ctx.save();
      if (shakeAmt > 0) {
        const dx = (Math.random() - 0.5) * shakeAmt;
        const dy = (Math.random() - 0.5) * shakeAmt;
        ctx.translate(dx, dy);
        shakeAmt *= 0.86;
        if (shakeAmt < 0.5) shakeAmt = 0;
      }

      // 1. Draw solid dark background
      ctx.fillStyle = '#090d16'; // Ink black blue
      ctx.fillRect(0, 0, w, h);

      // Grid Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }

      // Periodic spawn
      if (time % 70 === 0) {
        const spawnCount = Math.floor(Math.random() * 2) + 1;
        for (let s = 0; s < spawnCount; s++) spawnDemon();
      }

      // 2. Draw active demons
      demons.forEach((d, idx) => {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += d.gravity;
        d.rotation += d.rotationSpeed;

        // Reset combo if demon leaves screen unsliced
        if (d.y > h + 100) {
          if (!d.isSliced) {
            comboCount = 0;
            setCombo(0);
          }
          demons.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.translate(d.x, d.y);

        if (!d.isSliced) {
          ctx.rotate(d.rotation);
          ctx.fillStyle = d.color;
          d.drawShape(ctx, d.radius);

          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        } else {
          // Sliced halves falling apart
          d.leftHalf.x += d.leftHalf.vx;
          d.leftHalf.y += d.leftHalf.vy;
          d.leftHalf.vy += d.gravity;
          d.leftHalf.rot += d.leftHalf.rotSpeed;

          d.rightHalf.x += d.rightHalf.vx;
          d.rightHalf.y += d.rightHalf.vy;
          d.rightHalf.vy += d.gravity;
          d.rightHalf.rot += d.rightHalf.rotSpeed;

          ctx.save();
          ctx.rotate(d.sliceAngle);

          // Left
          ctx.save();
          ctx.translate(d.leftHalf.x, d.leftHalf.y);
          ctx.rotate(d.leftHalf.rot);
          ctx.beginPath(); ctx.rect(-100, -100, 100, 200); ctx.clip();
          ctx.fillStyle = d.color;
          d.drawShape(ctx, d.radius);
          ctx.strokeStyle = '#020617'; ctx.lineWidth = 3.5; ctx.stroke();
          ctx.restore();

          // Right
          ctx.save();
          ctx.translate(d.rightHalf.x, d.rightHalf.y);
          ctx.rotate(d.rightHalf.rot);
          ctx.beginPath(); ctx.rect(0, -100, 100, 200); ctx.clip();
          ctx.fillStyle = d.color;
          d.drawShape(ctx, d.radius);
          ctx.strokeStyle = '#020617'; ctx.lineWidth = 3.5; ctx.stroke();
          ctx.restore();

          ctx.restore();
        }

        ctx.restore();
      });

      // 3. Update and render particles pool
      particles.forEach((p, idx) => {
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(idx, 1);
          return;
        }

        // Custom Wind Whirlwind Leaf spiral physics
        if (p.element === 'wind' && p.type === 'leaf' && p.centerX !== undefined) {
          p.orbitAngle += p.orbitSpeed;
          p.orbitRadius = Math.max(0, p.orbitRadius - 1.2); // spiral in
          
          p.x = p.centerX + Math.cos(p.orbitAngle) * p.orbitRadius;
          p.y = p.centerY + Math.sin(p.orbitAngle) * p.orbitRadius;
          p.rot += p.rotSpeed; // extra spin
        } else {
          p.x += p.vx;
          p.y += p.vy;
        }

        const lifeRatio = 1 - (p.life / p.maxLife);
        ctx.save();

        if (p.element === 'wind') {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = lifeRatio * 0.8;
          if (p.type === 'leaf') {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot + p.life * p.rotSpeed);
            
            // Stunning 3D curling leaf variant
            const w = p.size;
            const h = p.size * 0.45 * Math.sin(time * 0.1 + p.rot);
            
            // Leaf Left Half (shaded dark)
            ctx.fillStyle = '#047857'; // emerald-700
            ctx.beginPath();
            ctx.ellipse(0, 0, w, Math.abs(h), 0, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Leaf Right Half (light)
            ctx.fillStyle = '#34d399'; // emerald-400
            ctx.beginPath();
            ctx.ellipse(0, 0, w, Math.abs(h), 0, 0, Math.PI);
            ctx.fill();
            
            // Center leaf vein
            ctx.strokeStyle = '#022c22';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-w, 0);
            ctx.lineTo(w, 0);
            ctx.stroke();
          } else if (p.type === 'vacuum-blade') {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot + Math.PI / 2);
            ctx.globalAlpha = lifeRatio * 0.75;
            
            const w = p.size * lifeRatio;
            const h = p.size * 0.35 * lifeRatio;
            
            // Draw a sharp glowing green crescent blade that expands and fades
            ctx.fillStyle = 'rgba(52, 211, 153, 0.65)'; // emerald
            ctx.beginPath();
            ctx.moveTo(-w, 0);
            ctx.quadraticCurveTo(0, -w * 0.75, w, 0);
            ctx.quadraticCurveTo(0, -w * 0.15, -w, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#020617'; // Sumi Black
            ctx.lineWidth = 3.5;
            ctx.stroke();
          } else {
            // Wind wisp cloud
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            ctx.fill();
          }
        } 
        else if (p.element === 'water') {
          ctx.globalAlpha = lifeRatio * 0.9;
          if (p.type === 'bubble') {
            // Glassy water bubble with light shine
            ctx.beginPath();
            const r = p.size * (0.5 + 0.5 * lifeRatio);
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            
            // Bubble highlight dot
            ctx.beginPath();
            ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          } else {
            // Curved splash teardrop droplet
            ctx.fillStyle = p.color;
            ctx.beginPath();
            const r = p.size * lifeRatio;
            ctx.moveTo(p.x, p.y - r);
            ctx.quadraticCurveTo(p.x + r * 0.75, p.y + r * 0.5, p.x, p.y + r * 1.3);
            ctx.quadraticCurveTo(p.x - r * 0.75, p.y + r * 0.5, p.x, p.y - r);
            ctx.closePath();
            ctx.fill();
          }
        } 
        else if (p.element === 'thunder') {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = lifeRatio;
          ctx.beginPath();
          // Draw tiny diamond electrical spark
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.lineTo(p.x - p.size, p.y);
          ctx.closePath();
          ctx.fill();
        } 
        else if (p.element === 'flame') {
          ctx.globalAlpha = lifeRatio * 0.95;
          if (p.type === 'smoke') {
            // Dark combustion smoke puff that expands and fades
            ctx.fillStyle = 'rgba(30, 27, 38, 0.45)'; // dark slate smoke
            ctx.beginPath();
            const curSize = p.size * (1 + (1 - lifeRatio) * 1.5);
            ctx.arc(p.x, p.y, curSize, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Additive blending for actual flame particles to make them glow!
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            if (lifeRatio > 0.75) {
              ctx.fillStyle = '#ffffff';
            } else if (lifeRatio > 0.5) {
              ctx.fillStyle = '#facc15'; // yellow-400
            } else if (lifeRatio > 0.25) {
              ctx.fillStyle = '#f97316'; // orange-500
            } else {
              ctx.fillStyle = '#dc2626'; // red-600
            }
            
            // Flame teardrop wisp drawing
            ctx.beginPath();
            const r = p.size * lifeRatio;
            ctx.moveTo(p.x - r, p.y);
            ctx.quadraticCurveTo(p.x - r, p.y - r * 1.4, p.x, p.y - r * 2.3); 
            ctx.quadraticCurveTo(p.x + r, p.y - r * 1.4, p.x + r, p.y);       
            ctx.quadraticCurveTo(p.x, p.y + r * 0.5, p.x - r, p.y);           
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          }
        }

        ctx.restore();
      });

      // 4. Render Active Gesture Slash Trail (Elemental styles)
      if (swipePoints.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const activeEl = getEffectiveElement();

        if (activeEl === 'wind') {
          // Wind: Chaotic crescent sickles and hurricane slashes splaying out
          ctx.strokeStyle = '#065f46'; // deep emerald-800 outline
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
          for (let i = 1; i < swipePoints.length; i++) {
            ctx.lineTo(swipePoints[i].x, swipePoints[i].y);
          }
          ctx.stroke();

          ctx.strokeStyle = '#10b981'; // jade green inner core
          ctx.lineWidth = 8;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff'; // white highlight center
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Splay out sharp sickle shapes along the path with drag (bending backwards)
          for (let i = 1; i < swipePoints.length; i++) {
            if (i % 2 === 0) {
              const p = swipePoints[i];
              const prev = swipePoints[i - 1];
              const dx = p.x - prev.x;
              const dy = p.y - prev.y;
              const len = Math.hypot(dx, dy) || 1;
              
              const angle = Math.atan2(dy, dx);
              const size = (i / swipePoints.length) * 24 + 10;
              
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(angle + Math.PI / 2);

              // 1. Draw solid dark green sickle with black outline
              ctx.fillStyle = '#065f46'; // Dark Emerald
              ctx.beginPath();
              ctx.moveTo(-size, 0);
              ctx.quadraticCurveTo(0, -size * 0.75, size, 0); // outer
              ctx.quadraticCurveTo(0, -size * 0.15, -size, 0); // inner
              ctx.closePath();
              ctx.fill();
              
              ctx.strokeStyle = '#020617'; // Sumi Black
              ctx.lineWidth = 3.5;
              ctx.stroke();

              // 2. Overlay lime wind blade inside
              ctx.fillStyle = '#34d399'; // Lime
              ctx.beginPath();
              ctx.moveTo(-size * 0.75, -size * 0.1);
              ctx.quadraticCurveTo(0, -size * 0.55, size * 0.75, -size * 0.1);
              ctx.quadraticCurveTo(0, -size * 0.2, -size * 0.75, -size * 0.1);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // 3. White highlight claw core
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.moveTo(-size * 0.45, -size * 0.18);
              ctx.quadraticCurveTo(0, -size * 0.4, size * 0.45, -size * 0.18);
              ctx.quadraticCurveTo(0, -size * 0.25, -size * 0.45, -size * 0.18);
              ctx.closePath();
              ctx.fill();

              ctx.restore();
            }
          }
        } 
        else if (activeEl === 'water') {
          // Water: Hand-drawn Ukiyo-e wave stream with thick Sumi outlines and curly foam claws
          for (let i = 1; i < swipePoints.length; i++) {
            const p = swipePoints[i];
            const prev = swipePoints[i - 1];
            const r = (i / swipePoints.length) * 26 + 10;
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            const angle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);

            // Layer 1: Illustrated Deep Blue Wave Bubble
            ctx.fillStyle = '#1d4ed8'; // Indigo blue
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#020617'; // Thick Sumi Black outline
            ctx.lineWidth = 4;
            ctx.stroke();

            // Layer 2: Light Cyan water splash inside
            ctx.fillStyle = '#38bdf8'; // Sky blue
            ctx.beginPath();
            ctx.arc(-r * 0.25, -r * 0.15, r * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Layer 3: Unfolding white foam wave curls on top (Ukiyo-e wave cap)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.9);
            // curl inwards
            ctx.quadraticCurveTo(r * 0.4, -r * 0.4, -r * 0.25, -r * 0.15);
            ctx.quadraticCurveTo(-r * 0.6, -r * 0.1, -r * 0.9, -r * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Claw foam fingers shooting off
            if (i % 3 === 0) {
              ctx.rotate(Math.PI / 2);
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(r * 0.75, -r * 1.1, r * 1.15, -r * 1.4); // claw tip
              ctx.quadraticCurveTo(r * 0.4, -r * 0.7, 0, -r * 0.45);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Extra splash dot
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(r * 1.15, -r * 1.4, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            ctx.restore();
          }

          // Main flowing white core to tie it together
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
          for (let i = 1; i < swipePoints.length; i++) {
            ctx.lineTo(swipePoints[i].x, swipePoints[i].y);
          }
          ctx.stroke();
        } 
        else if (activeEl === 'thunder') {
          // Thunder: Zigzag crackling yellow/white electric lightning arcs
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.3)'; // outer glow
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
          for (let i = 1; i < swipePoints.length; i++) {
            ctx.lineTo(swipePoints[i].x, swipePoints[i].y);
          }
          ctx.stroke();

          // Core electric jagged arc
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
          
          for (let i = 1; i < swipePoints.length; i++) {
            const p1 = swipePoints[i - 1];
            const p2 = swipePoints[i];
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            
            // Tangent perpendicular offset
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const offset = (Math.random() - 0.5) * 14;
            
            ctx.lineTo(mx + nx * offset, my + ny * offset);
            ctx.lineTo(p2.x, p2.y);
          }
          ctx.stroke();

          // Core thin neon yellow bolt
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } 
        else if (activeEl === 'flame') {
          // Flame: A continuous, fluid, roaring stream of fire using additive blending for a real burning core!
          const leftSideOuter = [];
          const rightSideOuter = [];
          const leftSideInner = [];
          const rightSideInner = [];

          for (let i = 0; i < swipePoints.length; i++) {
            const p = swipePoints[i];
            const next = swipePoints[i + 1] || p;
            const prev = swipePoints[i - 1] || p;
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            // Animate fire fluctuations using time & index
            const wave = Math.sin(i * 1.5 - time * 0.35) * 8;
            const outerWidth = (i / swipePoints.length) * 26 + 6 + wave;
            const innerWidth = outerWidth * 0.55;

            // Drag inertia bending the flame tips backward opposite to motion
            const dragX = -(next.x - prev.x) * 0.35;
            const dragY = -(next.y - prev.y) * 0.35;

            leftSideOuter.push({ x: p.x + nx * outerWidth + dragX, y: p.y + ny * outerWidth + dragY });
            rightSideOuter.push({ x: p.x - nx * outerWidth + dragX, y: p.y - ny * outerWidth + dragY });

            leftSideInner.push({ x: p.x + nx * innerWidth + dragX * 0.5, y: p.y + ny * innerWidth + dragY * 0.5 });
            rightSideInner.push({ x: p.x - nx * innerWidth + dragX * 0.5, y: p.y - ny * innerWidth + dragY * 0.5 });
          }

          // Layer 1: Crimson Red Outer Fire Ribbon (with thick black outline for anime feel)
          ctx.beginPath();
          ctx.moveTo(leftSideOuter[0].x, leftSideOuter[0].y);
          for (let i = 1; i < leftSideOuter.length; i++) {
            ctx.lineTo(leftSideOuter[i].x, leftSideOuter[i].y);
          }
          // Pointy flame tip at the end
          const pLast = swipePoints[swipePoints.length - 1];
          const pPrev = swipePoints[swipePoints.length - 2] || pLast;
          const tipDragX = -(pLast.x - pPrev.x) * 0.5;
          const tipDragY = -(pLast.y - pPrev.y) * 0.5;
          ctx.lineTo(pLast.x + tipDragX, pLast.y + tipDragY);
          
          for (let i = rightSideOuter.length - 1; i >= 0; i--) {
            ctx.lineTo(rightSideOuter[i].x, rightSideOuter[i].y);
          }
          ctx.closePath();
          
          ctx.fillStyle = '#b91c1c'; // Solid deep red
          ctx.fill();
          ctx.strokeStyle = '#020617'; // Sumi Black outline
          ctx.lineWidth = 4.5;
          ctx.stroke();

          // Switch to additive blending for the burning hot core layers
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';

          // Layer 2: Orange blazing fire ribbon
          ctx.beginPath();
          ctx.moveTo(leftSideInner[0].x, leftSideInner[0].y);
          for (let i = 1; i < leftSideInner.length; i++) {
            ctx.lineTo(leftSideInner[i].x, leftSideInner[i].y);
          }
          ctx.lineTo(pLast.x + tipDragX * 0.7, pLast.y + tipDragY * 0.7);
          for (let i = rightSideInner.length - 1; i >= 0; i--) {
            ctx.lineTo(rightSideInner[i].x, rightSideInner[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = '#f97316'; // Blazing Orange
          ctx.fill();

          // Layer 3: Yellow hot inner core
          ctx.beginPath();
          ctx.moveTo(leftSideInner[0].x, leftSideInner[0].y);
          for (let i = 1; i < leftSideInner.length; i++) {
            const p = swipePoints[i];
            const next = swipePoints[i + 1] || p;
            const prev = swipePoints[i - 1] || p;
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const w = ((i / swipePoints.length) * 10 + 2);
            ctx.lineTo(p.x + nx * w, p.y + ny * w);
          }
          ctx.lineTo(pLast.x + tipDragX * 0.5, pLast.y + tipDragY * 0.5);
          for (let i = swipePoints.length - 1; i >= 0; i--) {
            const p = swipePoints[i];
            const next = swipePoints[i + 1] || p;
            const prev = swipePoints[i - 1] || p;
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const w = ((i / swipePoints.length) * 10 + 2);
            ctx.lineTo(p.x - nx * w, p.y - ny * w);
          }
          ctx.closePath();
          ctx.fillStyle = '#fef08a'; // Yellow hot core
          ctx.fill();

          // Restore normal composite operation
          ctx.restore();

          // Licking fire wisps shooting up from the ribbon
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2.5;
          for (let i = 2; i < swipePoints.length - 1; i += 3) {
            const p = swipePoints[i];
            const prev = swipePoints[i - 1];
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            const dragX = -dx * 0.45;
            
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            // Draw a sweeping flame lick that sways
            ctx.quadraticCurveTo(
              p.x + dragX + Math.sin(i * 1.5 + time * 0.2) * 15,
              p.y - 30,
              p.x + dragX * 0.8 + Math.cos(i) * 10,
              p.y - 50
            );
            ctx.stroke();
            
            // outline the lick
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2.5;
          }

          // Core hot white slash
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
          for (let i = 1; i < swipePoints.length; i++) {
            ctx.lineTo(swipePoints[i].x, swipePoints[i].y);
          }
          ctx.stroke();
        }

        ctx.restore();
      }

      ctx.restore(); // Screen shake restore

      raf = requestAnimationFrame(frame);
    };

    let raf = requestAnimationFrame(frame);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [activeElement, particleBudget, hitstopDuration, hapticsEnabled]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-950 font-sans select-none overflow-hidden">
      
      {/* SIDEBAR: CONTROL & STUDIO CONFIG */}
      <div className="w-full lg:w-[400px] flex flex-col border-r border-slate-900 bg-slate-900/40 p-5 shrink-0 max-h-screen lg:max-h-none overflow-y-auto">
        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-800/80 px-2.5 py-1 rounded-full">
            Roadmap Item #3
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-2.5 tracking-wide uppercase">
            ⚡ Breath Slashes Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test and optimize stunning mobile-responsive elemental sword slashes driven by combo multipliers.
          </p>
        </div>

        {/* STATS HUD */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">Active Combo</span>
            <span className={`text-2xl font-black transition-all ${
              combo >= 15 ? 'text-red-500 animate-pulse' :
              combo >= 10 ? 'text-yellow-400' :
              combo >= 5 ? 'text-cyan-400' :
              combo > 0 ? 'text-emerald-400' :
              'text-slate-500'
            }`}>
              {combo}x
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">Slain Demons</span>
            <span className="text-2xl font-black text-slate-200">{score}</span>
          </div>
        </div>

        {/* SELECT BREATH STYLE */}
        <div className="flex flex-col gap-2.5 mb-6">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Select Breath Element
          </label>
          
          <button
            onClick={() => setActiveElement('auto')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
              activeElement === 'auto'
                ? 'border-cyan-500 bg-cyan-950/20 text-cyan-200'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide">Auto (Level up by Combo)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                0-4: Wind • 5-9: Water • 10-14: Thunder • 15+: Flame
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveElement('wind')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
              activeElement === 'wind'
                ? 'border-emerald-500 bg-emerald-950/20 text-emerald-200'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Wind className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide">Wind Breath (Kazebokokyu)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-mono">
                Green jade wisps & spinning bamboo leaves
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveElement('water')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
              activeElement === 'water'
                ? 'border-sky-500 bg-sky-950/20 text-sky-200'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Droplets className="w-5 h-5 text-sky-400" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide">Water Breath (Mizunokokyu)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-mono">
                Flowing blue wave ribbons & water bubbles
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveElement('thunder')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
              activeElement === 'thunder'
                ? 'border-yellow-500 bg-yellow-950/20 text-yellow-200'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide">Thunder Breath (Kaminarinokokyu)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-mono">
                Jagged yellow-white electric lightning arcs
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveElement('flame')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
              activeElement === 'flame'
                ? 'border-red-500 bg-red-950/20 text-red-200'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Flame className="w-5 h-5 text-red-400" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide">Flame Breath (Honokokyu)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-mono">
                Blazing fire ribbons & rising smoke sparks
              </p>
            </div>
          </button>
        </div>

        {/* STUDIO OPTIMIZER CONTROLS */}
        <div className="border border-slate-800/80 bg-slate-950/60 rounded-xl p-4 mt-auto">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-900">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
              Performance Tuning (Mobile)
            </h4>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Particle Limit Budget */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Max Particle Limit</span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">{particleBudget}</span>
              </div>
              <input
                type="range"
                min="50"
                max="400"
                step="25"
                value={particleBudget}
                onChange={e => setParticleBudget(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">
                Limits active particles. Lower cap increases mobile FPS.
              </span>
            </div>

            {/* Hitstop Freeze Frame */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Hitstop Freeze Time</span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">{hitstopDuration}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={hitstopDuration}
                onChange={e => setHitstopDuration(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">
                Sleep delay on successful cuts to add "weight" to hits.
              </span>
            </div>

            {/* Simulated Haptics */}
            <div className="flex items-center justify-between border-t border-slate-900 pt-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Mobile Haptics</span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Trigger vibration API on slicing.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hapticsEnabled}
                onChange={e => setHapticsEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded border-slate-800 bg-slate-900 cursor-pointer"
              />
            </div>

          </div>
        </div>

      </div>

      {/* MAIN SANDBOX PLAYGROUND */}
      <div className="flex-1 flex flex-col relative bg-slate-950 p-6">
        
        {/* Top HUD overlay info */}
        <div className="absolute top-8 left-8 pointer-events-none z-10 select-none flex flex-col gap-1.5">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
            Tameshigiri Elemental Sandbox
          </span>
          
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">
              🗡️ SLICE TEST CHAMBER
            </h2>
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${
              getEffectiveElement() === 'wind' ? 'border-emerald-800 bg-emerald-950/20 text-emerald-400' :
              getEffectiveElement() === 'water' ? 'border-sky-800 bg-sky-950/20 text-sky-400' :
              getEffectiveElement() === 'thunder' ? 'border-yellow-800 bg-yellow-950/20 text-yellow-400' :
              'border-red-800 bg-red-950/20 text-red-400'
            }`}>
              Style: {getEffectiveElement()}
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex items-center justify-center relative bg-slate-950 mt-12">
          <canvas
            ref={canvasRef}
            className="block w-full h-full bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl cursor-crosshair max-w-5xl max-h-[560px]"
          />
          
          {/* Instructions overlay */}
          <div className="absolute bottom-6 text-center pointer-events-none select-none">
            <p className="text-xs text-slate-400 font-mono bg-slate-950/80 px-4 py-2 rounded-full border border-slate-800">
              🖱️ Drag mouse quickly to test slash effects and combo elements on flying Yokai
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
