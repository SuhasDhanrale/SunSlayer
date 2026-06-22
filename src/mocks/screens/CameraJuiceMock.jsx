import React, { useRef, useEffect, useState } from 'react';

/**
 * CameraJuiceMock
 * 
 * A sandbox for tuning dynamic camera movements:
 * - Samurai Encounter: Cinematic zoom, letterboxing, dutch angle.
 * - Yokai Pinata: Heavy screen shake, hitstop, micro-zoom punch-ins.
 */
export const CameraJuiceMock = () => {
  const canvasRef = useRef(null);
  
  // UI State
  const [activeMode, setActiveMode] = useState('normal'); // 'normal', 'samurai', 'yokai'
  
  // Tuning State (Samurai)
  const [samuraiZoom, setSamuraiZoom] = useState(1.4);
  const [samuraiSpeed, setSamuraiSpeed] = useState(0.05); // Lerp factor
  const [samuraiLetterbox, setSamuraiLetterbox] = useState(80); // Height in px
  const [samuraiTilt, setSamuraiTilt] = useState(5); // Degrees
  
  // Tuning State (Yokai)
  const [yokaiZoom, setYokaiZoom] = useState(1.8);
  const [yokaiLetterbox, setYokaiLetterbox] = useState(120);
  const [yokaiTilt, setYokaiTilt] = useState(-8);
  const [yokaiShakeScale, setYokaiShakeScale] = useState(15);
  const [yokaiHitstopFrames, setYokaiHitstopFrames] = useState(6);
  const [yokaiPunchIn, setYokaiPunchIn] = useState(1.1);

  // Mutable state for the render loop (prevents React re-renders on every frame)
  const stateRef = useRef({
    time: 0,
    camera: {
      x: 0,
      y: 0,
      zoom: 1,
      angle: 0,
      letterbox: 0,
      shakeX: 0,
      shakeY: 0,
    },
    hitstopCounter: 0,
    shakeIntensity: 0,
    punchInAmount: 1,
    yokaiHits: 0,
    particles: [],
    mode: 'normal',
    
    // Config mirroring
    config: {
      samuraiZoom, samuraiSpeed, samuraiLetterbox, samuraiTilt,
      yokaiZoom, yokaiLetterbox, yokaiTilt, yokaiShakeScale, yokaiHitstopFrames, yokaiPunchIn
    }
  });

  // Keep ref config in sync
  useEffect(() => {
    stateRef.current.config = {
      samuraiZoom, samuraiSpeed, samuraiLetterbox, samuraiTilt,
      yokaiZoom, yokaiLetterbox, yokaiTilt, yokaiShakeScale, yokaiHitstopFrames, yokaiPunchIn
    };
    stateRef.current.mode = activeMode;
  }, [samuraiZoom, samuraiSpeed, samuraiLetterbox, samuraiTilt, yokaiZoom, yokaiLetterbox, yokaiTilt, yokaiShakeScale, yokaiHitstopFrames, yokaiPunchIn, activeMode]);

  const triggerYokaiHit = () => {
    if (stateRef.current.mode !== 'yokai') return;
    
    const state = stateRef.current;
    state.hitstopCounter = state.config.yokaiHitstopFrames;
    state.shakeIntensity = 1.0; // Max shake
    state.punchInAmount = state.config.yokaiPunchIn; // Apply punch-in
    state.yokaiHits++;

    // Spawn some particles
    for(let i=0; i<8; i++) {
      state.particles.push({
        x: 0, 
        y: 0, // Relative to Yokai center
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 10,
        life: 1.0,
        color: ['#ff3366', '#ff9933', '#ffffff'][Math.floor(Math.random() * 3)],
        size: Math.random() * 6 + 4
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    // Handle clicks for Yokai mode
    const handlePointerDown = (e) => {
      if (stateRef.current.mode !== 'yokai') return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      const state = stateRef.current;
      const finalZoom = state.camera.zoom * state.punchInAmount;
      const camX = state.camera.x;
      
      // Yokai is at world X = 500, Y = 0
      const yokaiScreenX = cx + (500 - camX) * finalZoom;
      const yokaiScreenY = cy; 
      
      // Simple distance check to center (where Yokai is)
      const dist = Math.hypot(clickX - yokaiScreenX, clickY - yokaiScreenY);
      if (dist < 100 * finalZoom) { // 100px hit radius
        triggerYokaiHit();
      }
    };
    canvas.addEventListener('pointerdown', handlePointerDown);

    const render = () => {
      const state = stateRef.current;
      const cfg = state.config;
      
      // 1. Logic Update
      if (state.hitstopCounter > 0) {
        state.hitstopCounter--;
        // Skip physics/time updates during hitstop to create the "freeze" effect
      } else {
        state.time += 1;
        
        // Update particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          let p = state.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.5; // gravity
          p.life -= 0.03;
          if (p.life <= 0) state.particles.splice(i, 1);
        }
      }

      // 2. Camera Interpolation Logic
      let targetZoom = 1;
      let targetAngle = 0;
      let targetLetterbox = 0;
      let targetX = 0;

      if (state.mode === 'samurai') {
        targetZoom = cfg.samuraiZoom;
        targetAngle = cfg.samuraiTilt * (Math.PI / 180);
        targetLetterbox = cfg.samuraiLetterbox;
        targetX = 150; // Midpoint between Monk(0) and Samurai(300)
      } else if (state.mode === 'yokai') {
        targetZoom = cfg.yokaiZoom;
        targetAngle = cfg.yokaiTilt * (Math.PI / 180);
        targetLetterbox = cfg.yokaiLetterbox;
        targetX = 500; // Focus on Yokai(500)
      }

      // Lerp camera properties
      const speed = cfg.samuraiSpeed;
      state.camera.zoom += (targetZoom - state.camera.zoom) * speed;
      state.camera.angle += (targetAngle - state.camera.angle) * speed;
      state.camera.letterbox += (targetLetterbox - state.camera.letterbox) * speed;
      state.camera.x += (targetX - state.camera.x) * speed;

      // Handle Yokai dynamic camera effects (Shake & Punch-in decay)
      if (state.shakeIntensity > 0) {
        state.camera.shakeX = (Math.random() - 0.5) * 2 * cfg.yokaiShakeScale * state.shakeIntensity;
        state.camera.shakeY = (Math.random() - 0.5) * 2 * cfg.yokaiShakeScale * state.shakeIntensity;
        state.shakeIntensity *= 0.85; // Decay shake
        if (state.shakeIntensity < 0.01) state.shakeIntensity = 0;
      } else {
        state.camera.shakeX = 0;
        state.camera.shakeY = 0;
      }

      // Decay punch-in back to 1.0
      if (state.punchInAmount > 1.0) {
        state.punchInAmount += (1.0 - state.punchInAmount) * 0.1; 
      }

      // 3. Render
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      
      // Apply Camera Transform
      const finalZoom = state.camera.zoom * state.punchInAmount;
      ctx.translate(cx + state.camera.shakeX, cy + state.camera.shakeY);
      ctx.rotate(state.camera.angle);
      ctx.scale(finalZoom, finalZoom);
      ctx.translate(-cx - state.camera.x, -cy);

      // --- Draw World ---
      
      // Scrolling grid/floor to show movement
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      const scrollOffset = (state.time * 2) % 100;
      for (let i = -w * 2; i < w * 3; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i - scrollOffset, -h);
        ctx.lineTo(i - scrollOffset, h * 2);
        ctx.stroke();
      }
      for (let j = -h * 2; j < h * 3; j += 100) {
        ctx.beginPath();
        ctx.moveTo(-w * 2, j);
        ctx.lineTo(w * 3, j);
        ctx.stroke();
      }

      // 1. Draw Monk (Always at x=0)
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.fillRect(cx - 20, cy + 50, 40, 80);

      // 2. Draw Samurai (At x=300)
      if (state.mode === 'samurai' || state.camera.x > 50) {
        ctx.save();
        ctx.translate(cx + 300, cy);
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.beginPath();
        ctx.arc(0, -50, 30, 0, Math.PI * 2); // Head
        ctx.fill();
        ctx.fillRect(-30, -20, 60, 150); // Body
        ctx.fillStyle = '#fff';
        ctx.fillRect(-150, 20, 150, 6); // Katana
        ctx.restore();
      } 
      
      // 3. Draw Yokai Pinata (At x=500)
      if (state.mode === 'yokai' || state.camera.x > 250) {
        ctx.save();
        ctx.translate(cx + 500, cy);
        
        if (state.hitstopCounter > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 90, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#a855f7'; // purple-500
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-30, -20, 15, 0, Math.PI * 2);
        ctx.arc(30, -20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-40, 30, 80, 10);

        // Draw Particles
        state.particles.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        
        // Hit counter text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${state.yokaiHits} HITS!`, 0, -120);
        
        ctx.restore();
      }

      ctx.restore();

      // --- Draw Overlay (Letterbox) ---
      // This is drawn AFTER restoring the camera, so it's locked to the screen
      if (state.camera.letterbox > 0) {
        ctx.fillStyle = '#000';
        // Top bar
        ctx.fillRect(0, 0, w, state.camera.letterbox);
        // Bottom bar
        ctx.fillRect(0, h - state.camera.letterbox, w, state.camera.letterbox);
      }
      
      // Screen Flash on Hit
      if (state.mode === 'yokai' && state.hitstopCounter === state.config.yokaiHitstopFrames) {
         ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
         ctx.fillRect(0, 0, w, h);
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-900 flex text-slate-200 font-sans overflow-hidden">
      
      {/* Viewport Area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain touch-none"
        />
        {activeMode === 'yokai' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-white/50 text-sm mb-48 animate-pulse font-bold tracking-widest">
              TAP YOKAI REPEATEDLY
            </span>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto z-10">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Camera Juice Lab</h2>
          <p className="text-xs text-slate-400">Tune camera logic for special encounters.</p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
          {['normal', 'samurai', 'yokai'].map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors capitalize ${
                activeMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="h-px bg-slate-700" />

        {/* Samurai Controls */}
        <div className={`flex flex-col gap-4 ${activeMode !== 'samurai' ? 'opacity-30 pointer-events-none' : ''}`}>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Samurai Config
          </h3>
          
          <ControlSlider label="Target Zoom" min={1} max={2.5} step={0.1} value={samuraiZoom} onChange={setSamuraiZoom} />
          <ControlSlider label="Trans. Speed" min={0.01} max={0.2} step={0.01} value={samuraiSpeed} onChange={setSamuraiSpeed} />
          <ControlSlider label="Letterbox (px)" min={0} max={200} step={10} value={samuraiLetterbox} onChange={setSamuraiLetterbox} />
          <ControlSlider label="Dutch Angle (°)" min={-15} max={15} step={1} value={samuraiTilt} onChange={setSamuraiTilt} />
        </div>

        <div className="h-px bg-slate-700" />

        {/* Yokai Controls */}
        <div className={`flex flex-col gap-4 ${activeMode !== 'yokai' ? 'opacity-30 pointer-events-none' : ''}`}>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Yokai Config
          </h3>
          
          <ControlSlider label="Base Zoom" min={1} max={3} step={0.1} value={yokaiZoom} onChange={setYokaiZoom} />
          <ControlSlider label="Letterbox (px)" min={0} max={200} step={10} value={yokaiLetterbox} onChange={setYokaiLetterbox} />
          <ControlSlider label="Dutch Angle (°)" min={-30} max={30} step={1} value={yokaiTilt} onChange={setYokaiTilt} />
          <div className="h-px bg-slate-700/50 my-1" />
          <ControlSlider label="Shake Intensity" min={0} max={50} step={1} value={yokaiShakeScale} onChange={setYokaiShakeScale} />
          <ControlSlider label="Hitstop (Frames)" min={0} max={20} step={1} value={yokaiHitstopFrames} onChange={setYokaiHitstopFrames} />
          <ControlSlider label="Punch-In Zoom" min={1.0} max={1.5} step={0.05} value={yokaiPunchIn} onChange={setYokaiPunchIn} />
        </div>
      </div>
    </div>
  );
};

// Helper component for uniform sliders
const ControlSlider = ({ label, min, max, step, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-300 font-medium">{label}</span>
      <span className="text-indigo-400 font-mono">{value.toFixed(step >= 1 ? 0 : 2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);
