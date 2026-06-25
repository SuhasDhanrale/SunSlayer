import { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  Droplet, 
  Wind, 
  Flame, 
  Play, 
  Pause, 
  RefreshCw, 
  Smartphone, 
  Sliders, 
  Eye, 
  Check, 
  AlertCircle
} from 'lucide-react';

export const SlicingJuiceMock = ({ state, setState, resetToken }) => {
  const canvasRef = useRef(null);
  
  // Local settings synced with parent state if provided, or falling back to defaults
  const {
    sliceType = 'bamboo',
    particleSize = 1.5,
    particleCount = 0.6,
    lingeringDuration = 1.5,
    enableHitstop = true,
    enableShake = true,
    enableScreenSplat = true,
    waterColor = 'silver',
    mobileFrame = false,
    slashThickness = 1.2,
  } = state || {};

  const updateState = (key, value) => {
    if (setState) {
      setState(prev => ({ ...prev, [key]: value }));
    }
  };

  // UI state
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [combo, setCombo] = useState(0);
  const [activeTab, setActiveTab] = useState('vfx'); // 'vfx', 'about'

  // Ref to hold state variables for access in the requestAnimationFrame loop
  const settingsRef = useRef({
    sliceType,
    particleSize,
    particleCount,
    lingeringDuration,
    enableHitstop,
    enableShake,
    enableScreenSplat,
    waterColor,
    slashThickness,
  });

  // Keep settingsRef in sync
  useEffect(() => {
    settingsRef.current = {
      sliceType,
      particleSize,
      particleCount,
      lingeringDuration,
      enableHitstop,
      enableShake,
      enableScreenSplat,
      waterColor,
      slashThickness,
    };
  }, [sliceType, particleSize, particleCount, lingeringDuration, enableHitstop, enableShake, enableScreenSplat, waterColor, slashThickness]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 600) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // VFX Entities Pools
    let slashes = [];        // Lingering white slashes: { points: [{x,y}], age, maxAge, width }
    let particles = [];      // Floating particles: { type, x, y, vx, vy, radius, maxRadius, alpha, decay, color, ... }
    let screenSplats = [];   // Screen lens splats: { x, y, radius, alpha, decay, color, slideSpeed }
    let backgroundSplats = []; // Background splats: { x, y, radius, alpha, decay, color, satellites: [{ox, oy, r}] }
    
    // Impact states
    let shakeTimer = 0;
    let shakeIntensity = 0;
    let flashOpacity = 0;
    let hitstopTimer = 0;    // Simulates frozen physics frames

    // Mouse/Swipe tracking
    let swipePoints = [];    // Temporary active drag line
    let isDragging = false;
    let lastPoint = null;

    // Trigger hit impact (juice)
    const triggerImpact = (x, y, angle, type) => {
      const settings = settingsRef.current;
      const countScale = settings.particleCount;
      const sizeScale = settings.particleSize;

      // 1. Screen Shake
      if (settings.enableShake) {
        shakeTimer = 12;
        shakeIntensity = type === 'yokai' ? 14 : 8;
      }

      // 2. Fullscreen Flash (2 frames)
      flashOpacity = type === 'yokai' ? 0.22 : 0.12;

      // 3. Hitstop Freeze Frame
      if (settings.enableHitstop) {
        hitstopTimer = type === 'yokai' ? 6 : 4; // Number of frames to freeze physics
      }

      // 4. Spawn Particles based on Slicing Type
      const perpAngle1 = angle + Math.PI / 2;
      const perpAngle2 = angle - Math.PI / 2;

      // Spawning fewer particles (optimized) but much larger
      if (type === 'bamboo' || type === 'all') {
        // --- BAMBOO CUT: Water splashes, screen splats, leaves ---
        const waterColorValue = settings.waterColor === 'cyan' 
          ? 'rgba(56, 189, 248, #ALPHA#)' // Light sky-blue
          : settings.waterColor === 'emerald'
          ? 'rgba(52, 211, 153, #ALPHA#)' // Jade green water
          : 'rgba(241, 245, 249, #ALPHA#)'; // Silver-white water (Slate 100)

        // Droplets count
        const dropCount = Math.max(3, Math.round(8 * countScale));
        for (let i = 0; i < dropCount; i++) {
          const side = Math.random() > 0.5 ? perpAngle1 : perpAngle2;
          const spread = (Math.random() - 0.5) * 0.5;
          const force = (Math.random() * 8 + 6);
          const vx = Math.cos(side + spread) * force;
          const vy = Math.sin(side + spread) * force - (Math.random() * 2); // Initial upward kick
          
          particles.push({
            type: 'water',
            x,
            y,
            vx,
            vy,
            radius: (Math.random() * 6 + 7) * sizeScale, // Bold large droplets (7px to 13px radius)
            alpha: 0.95,
            decay: Math.random() * 0.015 + 0.012,
            color: waterColorValue,
            gravity: 0.35,
          });
        }

        // Screen splats (Fruit Ninja lens splatter)
        if (settings.enableScreenSplat) {
          const splatCount = Math.random() > 0.5 ? 2 : 1;
          for (let i = 0; i < splatCount; i++) {
            // Splat positions skewed outward along the velocity path
            const splatX = x + (Math.random() - 0.5) * 120;
            const splatY = y + (Math.random() - 0.5) * 120;
            screenSplats.push({
              x: Math.max(40, Math.min(canvas.width - 40, splatX)),
              y: Math.max(40, Math.min(canvas.height - 40, splatY)),
              radius: (Math.random() * 15 + 18) * sizeScale, // Extra large splats (18px - 33px)
              alpha: 0.35, // Soft lens film look
              decay: Math.random() * 0.005 + 0.004, // Lingers 3-4 seconds
              color: waterColorValue.replace('#ALPHA#', '1'),
              slideSpeed: Math.random() * 0.2 + 0.1, // slowly slides down lens
            });
          }
        }

        // Bamboo Leaves debris
        const leafCount = Math.max(1, Math.round(3 * countScale));
        for (let i = 0; i < leafCount; i++) {
          particles.push({
            type: 'leaf',
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: -(Math.random() * 3 + 2),
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.08,
            scale: (Math.random() * 0.4 + 0.8) * sizeScale,
            alpha: 1,
            decay: 0.01,
          });
        }
      }

      if (type === 'yokai' || type === 'all') {
        // --- YOKAI CUT: Spirit ribbons, Onibi wisps, purple dark energy ---
        const ribbonCount = Math.max(2, Math.round(4 * countScale));
        for (let i = 0; i < ribbonCount; i++) {
          particles.push({
            type: 'spirit_ribbon',
            x: x + (Math.random() - 0.5) * 80, // distribute along cut path
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.0,
            vy: -(Math.random() * 2.0 + 1.5), // rises upwards
            radius: (Math.random() * 4 + 4) * sizeScale, // width of the ribbon
            alpha: 0.95,
            decay: Math.random() * 0.008 + 0.006, // lingers
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: Math.random() * 0.06 + 0.04,
            swayAmp: Math.random() * 1.5 + 1.0,
            trail: [],
          });
        }

        // Onibi / Spirit fire wisps
        const spiritCount = Math.max(1, Math.round(3 * countScale));
        for (let i = 0; i < spiritCount; i++) {
          particles.push({
            type: 'onibi',
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: -(Math.random() * 4 + 3),
            radius: (Math.random() * 5 + 6) * sizeScale,
            alpha: 0.9,
            decay: Math.random() * 0.012 + 0.008,
            color: Math.random() > 0.5 ? '#a855f7' : '#06b6d4', // Purple or Cyan
            trail: [],
            swayPhase: Math.random() * Math.PI * 2,
          });
        }

        // Purple puff aura
        const puffCount = Math.max(1, Math.round(4 * countScale));
        for (let i = 0; i < puffCount; i++) {
          particles.push({
            type: 'dark_puff',
            x,
            y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: (Math.random() * 10 + 10) * sizeScale,
            alpha: 0.7,
            decay: 0.03,
            color: 'rgba(76, 29, 149, #ALPHA#)', // Dark violet demonic puff
          });
        }
      }

      if (type === 'sumi-e' || type === 'all') {
        // --- SUMI-E & STEEL CUT: Black ink splats and sharp steel sparks ---
        // Sumi-e Black Ink splats
        const inkCount = Math.max(3, Math.round(8 * countScale));
        for (let i = 0; i < inkCount; i++) {
          const side = Math.random() > 0.5 ? perpAngle1 : perpAngle2;
          const spread = (Math.random() - 0.5) * 0.4;
          const force = (Math.random() * 6 + 4);
          particles.push({
            type: 'ink',
            x,
            y,
            vx: Math.cos(side + spread) * force,
            vy: Math.sin(side + spread) * force - (Math.random() * 1.5),
            radius: (Math.random() * 5 + 6) * sizeScale,
            alpha: 0.9,
            decay: Math.random() * 0.02 + 0.015,
            gravity: 0.25,
          });
        }

        // Metal Sparks
        const sparkCount = Math.max(4, Math.round(10 * countScale));
        for (let i = 0; i < sparkCount; i++) {
          const force = (Math.random() * 12 + 6);
          const angleSpread = angle + Math.PI + (Math.random() - 0.5) * 1.5; // fly backwards from blade path
          particles.push({
            type: 'spark',
            x,
            y,
            vx: Math.cos(angleSpread) * force,
            vy: Math.sin(angleSpread) * force,
            radius: (Math.random() * 1.5 + 1.5) * sizeScale,
            alpha: 1,
            decay: Math.random() * 0.04 + 0.03, // Expires very fast
            color: Math.random() > 0.3 ? '#fef08a' : '#ffffff', // Yellow or bright white
          });
        }
      }

      // 5. Spawn background splat (world splat) at cut center
      if (settings.enableScreenSplat) {
        let splatColor = 'rgba(255, 255, 255, #ALPHA#)';
        if (type === 'bamboo') {
          splatColor = settings.waterColor === 'cyan' 
            ? 'rgba(56, 189, 248, #ALPHA#)' 
            : settings.waterColor === 'emerald'
            ? 'rgba(52, 211, 153, #ALPHA#)' 
            : 'rgba(241, 245, 249, #ALPHA#)'; // Silver-white
        } else if (type === 'yokai') {
          splatColor = 'rgba(168, 85, 247, #ALPHA#)'; // spiritual purple wisp splat
        } else if (type === 'sumi-e') {
          splatColor = 'rgba(15, 23, 42, #ALPHA#)'; // Calligraphy black ink splat
        } else if (type === 'all') {
          splatColor = 'rgba(244, 63, 94, #ALPHA#)'; // Rose pink combined splat
        }

        const satellites = [];
        const satCount = Math.floor(Math.random() * 4) + 3;
        for (let i = 0; i < satCount; i++) {
          const satAngle = Math.random() * Math.PI * 2;
          const satDist = (Math.random() * 25 + 10) * sizeScale;
          satellites.push({
            ox: Math.cos(satAngle) * satDist,
            oy: Math.sin(satAngle) * satDist,
            r: (Math.random() * 5 + 3) * sizeScale,
          });
        }

        backgroundSplats.push({
          x,
          y,
          radius: (Math.random() * 8 + 14) * sizeScale,
          alpha: type === 'sumi-e' ? 0.75 : 0.25, // Black ink is more opaque
          decay: type === 'sumi-e' ? 0.005 : 0.008, // Ink stays longer
          color: splatColor,
          satellites,
        });
      }
    };

    // Helper: Add a completed slash path to lingering list
    const createSlash = (points) => {
      if (points.length < 2) return;
      
      const settings = settingsRef.current;
      const first = points[0];
      const last = points[points.length - 1];
      const angle = Math.atan2(last.y - first.y, last.x - first.x);
      
      // Add slash as a perfectly straight 2-point segment (doesn't follow cursor curves)
      slashes.push({
        id: Math.random(),
        points: [first, last], // Only start and end coordinates
        age: 0,
        maxAge: Math.round(settings.lingeringDuration * 60),
        width: 2.0,
      });

      // Trigger the particle bursts at the midpoint of the cut
      const midPoint = {
        x: (first.x + last.x) / 2,
        y: (first.y + last.y) / 2
      };
      triggerImpact(midPoint.x, midPoint.y, angle, settings.sliceType);
      
      setCombo(prev => prev + 1);
    };

    // Touch & Mouse event handlers
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
      e.preventDefault();
      isDragging = true;
      swipePoints = [];
      const coords = getCanvasCoords(e);
      swipePoints.push(coords);
      lastPoint = coords;
    };

    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const coords = getCanvasCoords(e);
      swipePoints.push(coords);

      // Keep swipe trail from growing infinitely
      if (swipePoints.length > 20) {
        swipePoints.shift();
      }

      // Live spawn small micro-droplets as blade moves to feel reactive
      if (lastPoint) {
        const dx = coords.x - lastPoint.x;
        const dy = coords.y - lastPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Spawn trail particles if moving fast enough
        if (dist > 15 && Math.random() < 0.45) {
          const settings = settingsRef.current;
          const angle = Math.atan2(dy, dx);
          
          if (settings.sliceType === 'bamboo' || settings.sliceType === 'all') {
            // Small spray droplets
            particles.push({
              type: 'water',
              x: coords.x,
              y: coords.y,
              vx: -Math.cos(angle) * 2 + (Math.random() - 0.5) * 3,
              vy: -Math.sin(angle) * 2 + (Math.random() - 0.5) * 3,
              radius: (Math.random() * 3 + 4) * settings.particleSize,
              alpha: 0.8,
              decay: 0.02,
              color: settings.waterColor === 'cyan' 
                ? 'rgba(186, 230, 253, #ALPHA#)' 
                : settings.waterColor === 'emerald'
                ? 'rgba(167, 243, 208, #ALPHA#)'
                : 'rgba(248, 250, 252, #ALPHA#)',
              gravity: 0.3,
            });
          }
        }
      }
      
      lastPoint = coords;
    };

    const handleEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      if (swipePoints.length >= 2) {
        createSlash(swipePoints);
      }
      swipePoints = [];
      lastPoint = null;
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    // Auto Slasher Generator (pre-recorded sweeps)
    let autoSlashTimer = 0;
    const playAutoSlash = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w < 100 || h < 100) return;

      const slashPatterns = [
        // Diagonal Down-Right
        [
          { x: w * 0.05, y: h * 0.15 },
          { x: w * 0.275, y: h * 0.325 },
          { x: w * 0.5, y: h * 0.5 },
          { x: w * 0.725, y: h * 0.675 },
          { x: w * 0.95, y: h * 0.85 },
        ],
        // Diagonal Down-Left
        [
          { x: w * 0.95, y: h * 0.15 },
          { x: w * 0.725, y: h * 0.325 },
          { x: w * 0.5, y: h * 0.5 },
          { x: w * 0.275, y: h * 0.675 },
          { x: w * 0.05, y: h * 0.85 },
        ],
        // Cross Horizontal
        [
          { x: w * 0.05, y: h * 0.42 },
          { x: w * 0.275, y: h * 0.41 },
          { x: w * 0.5, y: h * 0.43 },
          { x: w * 0.725, y: h * 0.41 },
          { x: w * 0.95, y: h * 0.42 },
        ],
        // Rising Uppercut
        [
          { x: w * 0.15, y: h * 0.9 },
          { x: w * 0.325, y: h * 0.7 },
          { x: w * 0.5, y: h * 0.5 },
          { x: w * 0.675, y: h * 0.3 },
          { x: w * 0.85, y: h * 0.15 },
        ]
      ];

      const chosenPattern = slashPatterns[Math.floor(Math.random() * slashPatterns.length)];
      
      // Inject coordinates into slash
      createSlash(chosenPattern);
    };

    // Rendering functions
    const drawLeaf = (g, x, y, angle, scale) => {
      g.save();
      g.translate(x, y);
      g.rotate(angle);
      g.scale(scale, scale);
      
      g.fillStyle = '#22c55e'; // Bright green leaf
      g.strokeStyle = '#15803d'; // Dark outline
      g.lineWidth = 1.5;

      g.beginPath();
      g.moveTo(0, -12);
      g.quadraticCurveTo(8, -4, 0, 12);
      g.quadraticCurveTo(-8, -4, 0, -12);
      g.closePath();
      g.fill();
      g.stroke();

      // Draw leaf vein line
      g.beginPath();
      g.strokeStyle = '#166534';
      g.lineWidth = 1;
      g.moveTo(0, -12);
      g.lineTo(0, 10);
      g.stroke();

      g.restore();
    };

    const drawSpiritRibbon = (g, p) => {
      if (p.trail.length < 2) return;
      g.save();
      g.globalAlpha = p.alpha;
      
      // Outer faint white glow
      g.shadowColor = 'rgba(255, 255, 255, 0.4)';
      g.shadowBlur = 10 * p.alpha;
      
      // Draw tapered ribbon trail
      g.lineCap = 'round';
      g.lineJoin = 'round';
      
      // Pass 1: Backing ribbon wisp (sky blue-grey)
      g.strokeStyle = 'rgba(226, 232, 240, 0.3)';
      g.beginPath();
      g.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) {
        g.lineWidth = p.radius * 2.2 * (1 - i / p.trail.length);
        g.lineTo(p.trail[i].x, p.trail[i].y);
      }
      g.stroke();

      // Pass 2: Core hot white wisp
      g.shadowBlur = 0;
      g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      g.beginPath();
      g.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) {
        g.lineWidth = p.radius * 0.8 * (1 - i / p.trail.length);
        g.lineTo(p.trail[i].x, p.trail[i].y);
      }
      g.stroke();

      g.restore();
    };

    const drawOnibi = (g, p) => {
      g.save();
      g.globalAlpha = p.alpha;
      
      // Spirit core wisp glow
      const shadowColor = p.color;
      g.shadowColor = shadowColor;
      g.shadowBlur = 12 * p.alpha;
      
      // Draw tail if available
      if (p.trail.length > 1) {
        g.strokeStyle = p.color;
        g.lineCap = 'round';
        g.lineWidth = p.radius * 1.2;
        g.beginPath();
        g.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          g.lineWidth = p.radius * (1 - i / p.trail.length);
          g.lineTo(p.trail[i].x, p.trail[i].y);
        }
        g.stroke();
      }

      // Draw main spirit head wisp
      g.fillStyle = '#ffffff'; // White hot core
      g.strokeStyle = p.color;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      g.fill();
      g.stroke();

      g.restore();
    };

    let active = true;

    // Tick Loop
    const frame = () => {
      if (!active) return;

      const w = canvas.width;
      const h = canvas.height;

      // Handle hitstop (freezes gameplay simulation but does not stop UI rendering)
      let runPhysics = true;
      if (hitstopTimer > 0) {
        hitstopTimer--;
        runPhysics = false;
      }

      // Update calculations
      if (runPhysics) {
        // 1. Advance lingering slashes
        for (let i = slashes.length - 1; i >= 0; i--) {
          const s = slashes[i];
          s.age++;
          if (s.age >= s.maxAge) {
            slashes.splice(i, 1);
          }
        }

        // 2. Advance screen splats (slow lens slides)
        for (let i = screenSplats.length - 1; i >= 0; i--) {
          const sp = screenSplats[i];
          sp.y += sp.slideSpeed; // slide down screen
          sp.alpha -= sp.decay;  // slowly dry out/fade
          if (sp.alpha <= 0) {
            screenSplats.splice(i, 1);
          }
        }

        // 2b. Advance stationary background splats
        for (let i = backgroundSplats.length - 1; i >= 0; i--) {
          const bsp = backgroundSplats[i];
          bsp.alpha -= bsp.decay;
          if (bsp.alpha <= 0) {
            backgroundSplats.splice(i, 1);
          }
        }

        // 3. Advance floating particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.gravity) {
            p.vy += p.gravity;
          }

          // Specialize logic based on type
          if (p.type === 'water') {
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.alpha -= p.decay;
          } 
          else if (p.type === 'leaf') {
            p.angle += p.rotSpeed;
            // sway drift back and forth
            p.vx = Math.sin(p.angle) * 1.5;
            p.vy = Math.max(1, p.vy * 0.95 + 0.1); // settle to slow drift
            p.alpha -= p.decay;
          } 
          else if (p.type === 'spirit_ribbon') {
            p.swayPhase += p.swaySpeed;
            p.vx = Math.sin(p.swayPhase) * p.swayAmp;
            p.vy *= 0.98; // keep upward velocity
            
            // Record tail path
            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > 15) p.trail.pop();
            
            p.alpha -= p.decay;

            // Spawn soul embers breaking off the trail
            if (Math.random() < 0.25) {
              const sizeScale = settingsRef.current.particleSize;
              particles.push({
                type: 'spark',
                x: p.x + (Math.random() - 0.5) * 8,
                y: p.y + (Math.random() - 0.5) * 8,
                vx: p.vx * 0.5 + (Math.random() - 0.5) * 0.8,
                vy: p.vy * 0.8 + (Math.random() - 0.2) * 0.8, // drifts upwards
                radius: (Math.random() * 1.5 + 1.0) * sizeScale,
                alpha: 0.9,
                decay: 0.02,
                color: Math.random() > 0.4 ? '#ffffff' : '#a5f3fc', // Cyan-white embers
              });
            }
          }
          else if (p.type === 'onibi') {
            p.swayPhase += 0.15;
            p.vx = Math.sin(p.swayPhase) * 1.5;
            p.vy = p.vy * 0.96 - 0.05; // slowly speed up rising
            
            // Record tail path
            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > 8) p.trail.pop();
            
            p.alpha -= p.decay;
          }
          else if (p.type === 'dark_puff' || p.type === 'ink') {
            p.vx *= 0.92;
            p.vy *= 0.92;
            p.alpha -= p.decay;
          }
          else if (p.type === 'spark') {
            // sparks fly fast and straight
            p.alpha -= p.decay;
          }

          if (p.alpha <= 0 || p.y > h + 100 || p.x < -100 || p.x > w + 100) {
            particles.splice(i, 1);
          }
        }

        // Auto slasher trigger
        if (isPlayingAuto) {
          autoSlashTimer++;
          if (autoSlashTimer >= 80) { // Slash every ~1.3 seconds
            playAutoSlash();
            autoSlashTimer = 0;
          }
        }
      }

      // RENDER SECTION
      ctx.save();

      // Apply screen shake translation
      if (shakeTimer > 0 && settingsRef.current.enableShake) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        
        if (runPhysics) {
          shakeIntensity *= 0.85;
          shakeTimer--;
        }
      }

      // 1. Draw Background (Solid high-contrast black backdrop to mimic game environment)
      ctx.fillStyle = '#090d16'; // Deep midnight black-slate
      ctx.fillRect(0, 0, w, h);

      // Draw traditional Japanese pattern lines (very faint grids)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let xPos = 0; xPos < w; xPos += 50) {
        ctx.beginPath(); ctx.moveTo(xPos, 0); ctx.lineTo(xPos, h); ctx.stroke();
      }
      for (let yPos = 0; yPos < h; yPos += 50) {
        ctx.beginPath(); ctx.moveTo(0, yPos); ctx.lineTo(w, yPos); ctx.stroke();
      }

      // Draw stylized guide crosshairs for alignment
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 80, 0, Math.PI * 2);
      ctx.moveTo(w / 2 - 120, h / 2); ctx.lineTo(w / 2 + 120, h / 2);
      ctx.moveTo(w / 2, h / 2 - 120); ctx.lineTo(w / 2, h / 2 + 120);
      ctx.stroke();

      // 1b. Draw Stationary Background Splats (world splats)
      backgroundSplats.forEach(bsp => {
        ctx.save();
        ctx.globalAlpha = bsp.alpha;
        ctx.fillStyle = bsp.color.replace('#ALPHA#', '1');
        
        ctx.beginPath();
        // Main splat blob
        ctx.arc(bsp.x, bsp.y, bsp.radius, 0, Math.PI * 2);
        
        // Satellite splatters forming an organic splat cluster
        bsp.satellites.forEach(sat => {
          ctx.arc(bsp.x + sat.ox, bsp.y + sat.oy, sat.r, 0, Math.PI * 2);
        });
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw Lingering Slashes (Yokai Slicer Trails)
      slashes.forEach(s => {
        const lifeRatio = 1 - (s.age / s.maxAge);
        if (lifeRatio <= 0) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Calligraphic dissolve - breaks up the stroke with gaps as it decays
        if (lifeRatio < 0.5) {
          const dashSize = Math.max(1, lifeRatio * 20);
          const gapSize = (0.5 - lifeRatio) * 28;
          ctx.setLineDash([dashSize, gapSize]);
        }

        const slashThick = settingsRef.current.slashThickness;
        const baseWidth = 1.6 * slashThick; // Extremely sleek and sharp base width

        // Draw multiple passes for a beautiful glow effect:
        // Pass A: Wide soft grey-blue aura (sleek glow bloom)
        ctx.strokeStyle = `rgba(186, 230, 253, ${lifeRatio * 0.35})`;
        ctx.lineWidth = baseWidth * 3.5 * lifeRatio;
        ctx.shadowBlur = 10 * lifeRatio;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        ctx.lineTo(s.points[1].x, s.points[1].y);
        ctx.stroke();

        // Pass B: Medium core white-grey (sleek mid line)
        ctx.strokeStyle = `rgba(241, 245, 249, ${lifeRatio * 0.7})`;
        ctx.lineWidth = baseWidth * 1.5 * lifeRatio;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        ctx.lineTo(s.points[1].x, s.points[1].y);
        ctx.stroke();

        // Pass C: Tight bright-white central razor line (very thin and crisp)
        ctx.strokeStyle = `rgba(255, 255, 255, ${lifeRatio * 0.98})`;
        ctx.lineWidth = Math.max(0.75, baseWidth * 0.5 * lifeRatio);
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        ctx.lineTo(s.points[1].x, s.points[1].y);
        ctx.stroke();

        ctx.restore();
      });

      // 3. Draw Active Temporary Drag Swipe Projection (a very faint straight guide line)
      if (swipePoints.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // Very faint white guide line
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
        ctx.lineTo(swipePoints[swipePoints.length - 1].x, swipePoints[swipePoints.length - 1].y);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw Particles (Leaves, Smoke, Onibi, Water capsule-streaks, Ink)
      particles.forEach(p => {
        if (p.type === 'water') {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          
          // Render water droplet with an organic motion stretch capsule shape (Motion Blur)
          ctx.strokeStyle = p.color.replace('#ALPHA#', p.alpha.toString());
          ctx.lineWidth = p.radius * 2;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          // Draw stretched capsule backwards along velocity vector
          ctx.moveTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          // Shiny highlights
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = p.radius * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 1.0, p.y - p.vy * 1.0);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          ctx.restore();
        } 
        else if (p.type === 'leaf') {
          drawLeaf(ctx, p.x, p.y, p.angle, p.scale * p.alpha);
        } 
        else if (p.type === 'spirit_ribbon') {
          drawSpiritRibbon(ctx, p);
        }
        else if (p.type === 'onibi') {
          drawOnibi(ctx, p);
        }
        else if (p.type === 'dark_puff') {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color.replace('#ALPHA#', p.alpha.toString());
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        else if (p.type === 'ink') {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = '#0f172a'; // Deep calligraphic ink
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1;
          
          // Draw organic ink splatter blob
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.arc(p.x - p.radius * 0.4, p.y - p.radius * 0.3, p.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        else if (p.type === 'spark') {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.radius;
          ctx.lineCap = 'round';
          
          // Draw sharp speed sparks as short needles
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 0.7, p.y - p.vy * 0.7);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.restore();
        }
      });

      // 5. Draw Screen Splats (Splashes stuck to lens sliding down)
      if (settingsRef.current.enableScreenSplat) {
        screenSplats.forEach(sp => {
          ctx.save();
          ctx.globalAlpha = sp.alpha;
          
          // Draw a stylized dripping translucent water splat on screen
          ctx.fillStyle = sp.color;
          ctx.beginPath();
          // Draw main blob
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          // Draw minor droplets nearby forming a splat cluster
          ctx.arc(sp.x - sp.radius * 0.6, sp.y + sp.radius * 0.2, sp.radius * 0.4, 0, Math.PI * 2);
          ctx.arc(sp.x + sp.radius * 0.5, sp.y - sp.radius * 0.3, sp.radius * 0.5, 0, Math.PI * 2);
          // Draw dripping tail
          ctx.arc(sp.x + sp.radius * 0.1, sp.y + sp.radius * 0.8, sp.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();

          // Highlight shimmer on splat
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.arc(sp.x - sp.radius * 0.3, sp.y - sp.radius * 0.3, sp.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      // Restore screen shake coordinate space
      ctx.restore();

      // 6. Draw Fullscreen Color Flash impact overlay
      if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
        ctx.fillRect(0, 0, w, h);
        if (runPhysics) flashOpacity = Math.max(0, flashOpacity - 0.05);
      }

      // 7. Draw Screen Vignette Border (Anime Focus effect)
      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(4, 6, 12, 0.45)'); // Dark edges
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Render hitstop indicator if frozen
      if (hitstopTimer > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, w, h);
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => {
      active = false;
      ro.disconnect();
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [resetToken]);

  // Handle Preset Clicks
  const loadPreset = (type) => {
    switch (type) {
      case 'mobile':
        // Big particles, very low count, long linger
        updateState('particleSize', 2.2);
        updateState('particleCount', 0.4);
        updateState('lingeringDuration', 1.8);
        updateState('enableHitstop', true);
        updateState('enableShake', true);
        updateState('slashThickness', 1.2); // Sleek slash line
        break;
      case 'demon-slayer':
        // Extremely long-lasting slice line, elegant spirit ribbons, high freeze-frame
        updateState('particleSize', 1.6);
        updateState('particleCount', 0.8);
        updateState('lingeringDuration', 2.5);
        updateState('enableHitstop', true);
        updateState('enableShake', true);
        updateState('sliceType', 'yokai');
        updateState('slashThickness', 0.9); // Sleek razor cut
        break;
      case 'fruit-ninja':
        // Splash heavy, large silver water, screen splats enabled
        updateState('particleSize', 1.8);
        updateState('particleCount', 1.2);
        updateState('lingeringDuration', 0.8);
        updateState('enableScreenSplat', true);
        updateState('sliceType', 'bamboo');
        updateState('slashThickness', 1.4);
        break;
      case 'minimal-ink':
        // Simple, sharp lines, black ink
        updateState('particleSize', 1.4);
        updateState('particleCount', 0.5);
        updateState('lingeringDuration', 1.2);
        updateState('sliceType', 'sumi-e');
        updateState('slashThickness', 0.7); // Ultra-sleek cut
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-950 font-sans select-none overflow-hidden text-slate-100">
      
      {/* LEFT: Live Interactive Screen Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border-r border-slate-800 relative">
        {/* HEADER BAR */}
        <div className="flex justify-between items-center bg-slate-950 px-5 py-3.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Juice Prototype Sandbox
              </span>
            </div>
            <h2 className="text-[15px] font-black text-slate-200 uppercase tracking-wide">
              ⚡ KATANA VFX STUDIO
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Combo Count */}
            {combo > 0 && (
              <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800 text-red-400 font-black text-xs px-3 py-1 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.2)] animate-bounce">
                ⚔️ {combo} SLASHES
              </div>
            )}
            
            {/* Reset Stats */}
            <button 
              onClick={() => setCombo(0)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Reset stats"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* WORKSPACE & CANVAS */}
        <div className="flex-1 relative flex items-center justify-center p-6 bg-slate-950/90 overflow-hidden">
          <div className={`relative transition-all duration-300 w-full h-full max-w-[700px] max-h-[500px] ${mobileFrame ? 'w-[360px] h-[640px] max-w-[360px] max-h-[640px] border-[12px] border-slate-800 rounded-[36px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]' : ''}`}>
            
            <canvas 
              ref={canvasRef} 
              className={`block w-full h-full bg-black cursor-crosshair transition-all duration-300 ${mobileFrame ? 'rounded-[24px]' : 'rounded-lg border border-slate-800 shadow-2xl'}`} 
            />
            
            {/* Mobile Home Button Indicator */}
            {mobileFrame && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full pointer-events-none" />
            )}

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none text-center">
              <p className="text-[10px] text-slate-400 font-mono inline-block bg-slate-950/90 border border-slate-800/80 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
                👋 Swipe or click-and-drag fast on the screen to slice
              </p>
            </div>
          </div>
        </div>

        {/* QUICK CONTROL BAR */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400">SLICE MODE:</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {[
                { id: 'bamboo', label: '🎋 Bamboo', icon: Droplet, color: 'text-sky-400' },
                { id: 'yokai', label: '👺 Yokai', icon: Wind, color: 'text-purple-400' },
                { id: 'sumi-e', label: '🖌️ Ink & Sparks', icon: Flame, color: 'text-yellow-500' },
                { id: 'all', label: '🌀 Combined', icon: Sparkles, color: 'text-rose-400' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => updateState('sliceType', item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-extrabold uppercase transition-colors ${sliceType === item.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <item.icon size={12} className={item.color} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlayingAuto(prev => !prev)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] ${isPlayingAuto ? 'bg-red-950 border border-red-650 text-red-400' : 'bg-green-950 border border-green-650 text-green-400'}`}
            >
              {isPlayingAuto ? (
                <>
                  <Pause size={12} fill="currentColor" />
                  Stop Auto-Slash
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" />
                  Auto-Slash Loop
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Visual Tweak Panel */}
      <div className="w-full md:w-[340px] flex flex-col min-h-0 bg-slate-900 overflow-y-auto">
        {/* TABS */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => setActiveTab('vfx')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest text-center border-b-2 transition-colors ${activeTab === 'vfx' ? 'border-sky-500 text-slate-100 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Sliders size={12} />
              VFX Tuning
            </div>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest text-center border-b-2 transition-colors ${activeTab === 'about' ? 'border-sky-500 text-slate-100 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <AlertCircle size={12} />
              Design Concept
            </div>
          </button>
        </div>

        {activeTab === 'vfx' && (
          <div className="p-5 space-y-6">
            
            {/* TUNING PRESETS */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                📦 VFX Tuning Presets
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Quick profiles configured to demonstrate different design patterns.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => loadPreset('mobile')}
                  className="flex items-center justify-between px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left text-[11px] font-extrabold"
                >
                  📱 Mobile Optimized
                  <Check size={10} className="text-slate-400" />
                </button>
                <button
                  onClick={() => loadPreset('demon-slayer')}
                  className="flex items-center justify-between px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left text-[11px] font-extrabold"
                >
                  ⚔️ Yokai Slicer
                  <Check size={10} className="text-slate-400" />
                </button>
                <button
                  onClick={() => loadPreset('fruit-ninja')}
                  className="flex items-center justify-between px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left text-[11px] font-extrabold"
                >
                  💦 Fruit Ninja Splat
                  <Check size={10} className="text-slate-400" />
                </button>
                <button
                  onClick={() => loadPreset('minimal-ink')}
                  className="flex items-center justify-between px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left text-[11px] font-extrabold"
                >
                  🖌️ Classic Sumi-e
                  <Check size={10} className="text-slate-400" />
                </button>
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* PARTICLE SIZE SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="particle-size" className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  🔴 Particle Sizing
                </label>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-900">
                  {particleSize.toFixed(1)}x
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Swells the size of droplets, spirit ribbons, and sparks to increase readability on mobile.
              </p>
              <input
                id="particle-size"
                type="range"
                min="0.8"
                max="3.5"
                step="0.1"
                value={particleSize}
                onChange={(e) => updateState('particleSize', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* SLASH LINE THICKNESS SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="slash-thickness" className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  ⚡ Slash Line Thickness
                </label>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-900">
                  {slashThickness.toFixed(1)}x
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Controls the thickness of the lingering white slice line. Keep it low for a very sleek, sharp cut.
              </p>
              <input
                id="slash-thickness"
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={slashThickness}
                onChange={(e) => updateState('slashThickness', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* PARTICLE BUDGET SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="particle-count" className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  📉 Particle Density
                </label>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-900">
                  {Math.round(particleCount * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Scales particle count. Lowering count improves mobile performance and reduces visual clutter.
              </p>
              <input
                id="particle-count"
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={particleCount}
                onChange={(e) => updateState('particleCount', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* LINGER DURATION SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="lingering-duration" className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  ⏱️ Slash Linger Time
                </label>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-900">
                  {lingeringDuration.toFixed(1)}s
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Controls how long the Yokai Slicer white slice line remains suspended in the air.
              </p>
              <input
                id="lingering-duration"
                type="range"
                min="0.3"
                max="4.0"
                step="0.1"
                value={lingeringDuration}
                onChange={(e) => updateState('lingeringDuration', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* BAMBOO WATER COLOR DROPDOWN */}
            {sliceType === 'bamboo' && (
              <div className="space-y-2 animate-fadeIn">
                <label htmlFor="water-color" className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                  💧 Bamboo Water Color
                </label>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Choose the color of water splashing from the cut bamboo.
                </p>
                <select
                  id="water-color"
                  value={waterColor}
                  onChange={(e) => updateState('waterColor', e.target.value)}
                  className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                >
                  <option value="silver">🤍 Silver-White (Recommended for Dark Background)</option>
                  <option value="cyan">💙 Sky Blue (Classic Fruit Ninja)</option>
                  <option value="emerald">💚 Jade Green (Organic Sap)</option>
                </select>
              </div>
            )}

            <hr className="border-slate-800" />

            {/* TOGGLE OPTIONS */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                ⚙️ Physics & Juice Modifiers
              </h3>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Enable Screen Shake</span>
                  <input
                    type="checkbox"
                    checked={enableShake}
                    onChange={(e) => updateState('enableShake', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>
                
                <label className="flex items-center justify-between p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Enable Hitstop (Simulation Freeze)</span>
                  <input
                    type="checkbox"
                    checked={enableHitstop}
                    onChange={(e) => updateState('enableHitstop', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Enable Screen Splats (Lens Drops)</span>
                  <input
                    type="checkbox"
                    checked={enableScreenSplat}
                    onChange={(e) => updateState('enableScreenSplat', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Smartphone size={14} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-300">Mobile Device Frame</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mobileFrame}
                    onChange={(e) => updateState('mobileFrame', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'about' && (
          <div className="p-5 space-y-4 text-xs text-slate-300 leading-relaxed">
            <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
              📖 VFX Implementation Notes
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded">
                <span className="font-extrabold text-white block mb-1 text-[11px]">⚔️ Yokai Slicer Slice Line</span>
                When a cut occurs, a bright double-layered stroke remains in the air. Over 1.5 seconds, instead of fading uniformly, the stroke shrinks and uses a canvas line-dash mask to "dissolve" like dispersing embers, rather than turning transparent.
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded">
                <span className="font-extrabold text-white block mb-1 text-[11px]">🎋 Bamboo Water Splat</span>
                We spawn a small density of larger droplets, satisfying mobile visibility constraints. The droplets stretch along their velocity direction (capsule motion blur). Droplets that fly off the simulated plane create sticky lens splats on the camera screen which slide down due to gravity.
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded">
                <span className="font-extrabold text-white block mb-1 text-[11px]">👺 Yokai Freed Soul Ribbon</span>
                Spawns elegant, vertical, flowing spirit ribbons that weave gracefully upward. Tiny white-cyan glowing embers break off from the trails as they rise. Cyan and purple floating "Onibi" spirit wisps rise alongside them.
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex gap-2">
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              <div className="space-y-1">
                <span className="font-extrabold text-slate-200 block text-[10px] uppercase">Mobile Optimization Tip</span>
                <span className="text-[10px] text-slate-400 block leading-snug">
                  By increasing particle size (using the Sizing slider) and lowering the spawn density, we get a higher impact effect with 70% fewer particles, significantly saving draw calls and improving performance on mobile devices.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
