import React, { useState, useEffect, useRef } from 'react';

export const GameOverMock = () => {
  const [animationState, setAnimationState] = useState('idle'); 
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationState('falling');
    }, 100);
    
    const revealTimer = setTimeout(() => {
      setAnimationState('revealed');
    }, 1100); 

    return () => { clearTimeout(timer); clearTimeout(revealTimer); };
  }, []);

  // Canvas Drawing Loop for Emotional Defeat Scene
  useEffect(() => {
    if (animationState !== 'revealed') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = (canvas.clientWidth || 800) * dpr;
      canvas.height = (canvas.clientHeight || 400) * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf;
    let time = 0;

    // Generate Checkered Pattern for Tanjiro
    const p1 = document.createElement('canvas'); p1.width = 12; p1.height = 12;
    const c1 = p1.getContext('2d'); c1.fillStyle = '#065f46'; c1.fillRect(0,0,12,12); c1.fillStyle = '#1c1917'; c1.fillRect(0, 0, 6, 6); c1.fillRect(6, 6, 6, 6);
    const checkeredPattern = ctx.createPattern(p1, 'repeat');

    // Helper for leg wraps
    const drawSlayerKyahan = (ctx, lx, ly) => {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(lx - 4, ly - 10); ctx.lineTo(lx + 4, ly - 10);
      ctx.lineTo(lx + 3, ly - 2); ctx.lineTo(lx - 3, ly - 2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#047857'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx - 3, ly - 7); ctx.lineTo(lx + 3, ly - 7); ctx.moveTo(lx - 2, ly - 4); ctx.lineTo(lx + 2, ly - 4); ctx.stroke();
    };

    // Helper for the wooden box (from IntroSequenceMock, scaled and broken)
    const drawBox = (ctx, bx, by, scale, isBroken) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(scale, scale);
      
      const boxW = 40; 
      const boxH = 65;

      // Wooden body fill
      ctx.fillStyle = '#54321c';
      ctx.fillRect(-boxW/2, -boxH, boxW, boxH);

      // Dark shadow door slit
      ctx.fillStyle = '#18120e';
      const crackWidth = 4;
      ctx.fillRect(boxW/2 - 6 - crackWidth, -boxH + 6, crackWidth, boxH - 12);

      // Black iron straps
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-boxW/2 - 2, -boxH, boxW + 4, 6); // top band
      ctx.fillRect(-boxW/2 - 2, -6, boxW + 4, 6);  // bottom band
      ctx.fillRect(-boxW/2 - 2, -boxH + 6, 4, boxH - 12); // left band
      
      if (!isBroken) {
         ctx.fillRect(boxW/2 - 4, -boxH + 6, 4, boxH - 12);  // right band
         ctx.fillStyle = '#ca8a04';
         ctx.fillRect(boxW/2 - 10, -boxH * 0.5 - 4, 6, 8);
      } else {
         // Broken jagged hole revealing empty darkness
         ctx.fillStyle = '#050505'; // Background color
         ctx.beginPath();
         ctx.moveTo(boxW/2 + 2, -boxH * 0.3);
         ctx.lineTo(boxW/2 - 15, -boxH * 0.4);
         ctx.lineTo(boxW/2 - 25, -boxH * 0.6);
         ctx.lineTo(boxW/2 - 5, -boxH * 0.8);
         ctx.lineTo(boxW/2 + 2, -boxH * 0.7);
         ctx.fill();

         // Splinters
         ctx.strokeStyle = '#b45309';
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.moveTo(boxW/2 - 15, -boxH * 0.4); ctx.lineTo(boxW/2 - 20, -boxH * 0.3);
         ctx.moveTo(boxW/2 - 25, -boxH * 0.6); ctx.lineTo(boxW/2 - 35, -boxH * 0.5);
         ctx.stroke();

         // Broken right band
         ctx.fillRect(boxW/2 - 4, -boxH + 6, 4, boxH * 0.3);  
         ctx.fillRect(boxW/2 - 4, -boxH * 0.9, 4, boxH * 0.1);  
      }
      ctx.restore();
    };

    // Rain particles
    const rain = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 2000 - 500, // Wide spread for parallax
      y: Math.random() * 1000,
      vx: 1 + Math.random() * 2,     // Angled rain
      vy: 10 + Math.random() * 15,
      length: 10 + Math.random() * 20,
      alpha: 0.1 + Math.random() * 0.3
    }));

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark moody background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);

      // Draw Rain (Background)
      ctx.lineWidth = 1;
      rain.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > h) { p.y = -50; p.x = Math.random() * (w + 500) - 250; }
        
        ctx.strokeStyle = `rgba(148, 163, 184, ${p.alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.length);
        ctx.stroke();
      });

      const cx = w / 2;
      const cy = h * 0.85; // Ground level
      const scale = Math.min(w, h) * 0.0035;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // Ground plane
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-1000, 0); ctx.lineTo(1000, 0); ctx.stroke();

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 0, 80, 15, 0, 0, Math.PI * 2); ctx.fill();

      // --- Draw Broken Box (Fallen) ---
      ctx.save();
      ctx.translate(60, 0); // Well spaced to the right
      ctx.rotate(Math.PI / 2 + 0.1); // Fallen on its side
      drawBox(ctx, 0, 0, 1.2, true);
      ctx.restore();

      // --- Draw Tanjiro (Kneeling in despair) ---
      ctx.save();
      ctx.translate(-40, 0); // Well spaced to the left

      // Torso (Hunched over deeply)
      ctx.fillStyle = checkeredPattern;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(-15, -60, 30, -40); // Hunched over back
      ctx.lineTo(20, 0);
      ctx.closePath();
      ctx.fill();

      // A simple foot/leg wrap peeking out the back
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-15, -2); ctx.lineTo(-2, -2); ctx.stroke();
      drawSlayerKyahan(ctx, -10, -2);

      // Bowed Head (Tucked down)
      ctx.fillStyle = '#fbcfe8'; // pale skin
      ctx.beginPath(); ctx.arc(35, -35, 12, 0, Math.PI*2); ctx.fill();
      
      // Signature Spiky Hair
      const hx = 35; const hy = -35;
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(hx - 12, hy);
      ctx.lineTo(hx - 16, hy - 12);
      ctx.lineTo(hx - 8, hy - 8);
      ctx.lineTo(hx - 10, hy - 18);
      ctx.lineTo(hx, hy - 12);
      ctx.lineTo(hx + 8, hy - 18);
      ctx.lineTo(hx + 6, hy - 8);
      ctx.lineTo(hx + 14, hy - 6);
      ctx.lineTo(hx + 10, hy + 2);
      ctx.lineTo(hx - 2, hy - 2);
      ctx.fill();

      // Hair highlights
      ctx.fillStyle = '#991b1b';
      ctx.beginPath(); ctx.arc(hx - 6, hy - 10, 3.6, 0, Math.PI*2); ctx.arc(hx + 4, hy - 12, 3, 0, Math.PI*2); ctx.fill();

      // Arm punching the ground in anger/despair
      ctx.strokeStyle = checkeredPattern;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, -35); // Shoulder
      ctx.quadraticCurveTo(30, -20, 35, 0); // Arm curving down to ground
      ctx.stroke();

      // Hands (Fist)
      ctx.fillStyle = '#fbcfe8'; // skin fist
      ctx.beginPath(); ctx.arc(35, 0, 5, 0, Math.PI*2); ctx.fill();

      // Sword planted in ground behind him
      ctx.save();
      ctx.translate(-25, -2);
      ctx.rotate(-0.2);
      ctx.strokeStyle = '#475569'; // Blade
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(0, 10); ctx.stroke(); 
      ctx.fillStyle = '#1c1917'; // Guard
      ctx.fillRect(-6, -40, 12, 4);
      ctx.fillStyle = '#7f1d1d'; // Handle
      ctx.fillRect(-2, -90, 4, 50);
      ctx.restore();

      ctx.restore();
      ctx.restore();

      // Vignette to darken edges
      const gradient = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(5,5,5,0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [animationState]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050505]">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Shojumaru&display=swap');`}
      </style>

      {/* Simulated Game Background */}
      <div className={`absolute inset-0 transition-all duration-1000 ease-out ${animationState !== 'idle' ? 'blur-md scale-105 opacity-30' : 'blur-none opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#18181b] to-[#09090b]"></div>
      </div>

      {/* The Dropdown Screen Container */}
      <div 
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center bg-[#050505] text-white transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-20"
        style={{ transform: animationState === 'idle' ? 'translateY(-100%)' : 'translateY(0%)' }}
      >
        
        {/* Top: Title */}
        <div className={`mt-12 transition-opacity duration-1000 ${animationState === 'revealed' ? 'opacity-100' : 'opacity-0'}`}>
          <h1 style={{ fontFamily: "'Shojumaru', cursive" }} className="text-5xl md:text-7xl font-black text-red-700 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] text-center">
            Game Over
          </h1>
        </div>

        {/* Center: Emotional Canvas Art */}
        <div className={`flex-1 w-full relative transition-opacity duration-[2000ms] delay-500 ${animationState === 'revealed' ? 'opacity-100' : 'opacity-0'}`}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>

        {/* Bottom: Condensed Stats & Buttons */}
        <div className={`w-full max-w-4xl px-8 pb-12 flex flex-col items-center transition-opacity duration-1000 delay-1000 ${animationState === 'revealed' ? 'opacity-100' : 'opacity-0'} relative z-10`}>
          
          {/* Sleek Stats Bar */}
          <div className="w-full flex justify-between items-center border-t border-b border-slate-800/60 py-4 px-6 mb-8 bg-[#0a0a0c]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Time</span>
              <span className="text-xl font-serif italic text-white">08:42</span>
            </div>
            <div className="flex flex-col items-center border-l border-r border-slate-800/60 px-12">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Max Combo</span>
              <span className="text-xl font-serif italic text-amber-500">124<span className="text-sm text-amber-500/70 ml-1">x</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Souls</span>
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-lg">🏮</span>
                <span className="text-xl font-serif italic text-white">1,240</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 w-full justify-center">
            <button className="group relative px-10 py-4 overflow-hidden border border-red-900/50 bg-black hover:border-red-600 transition-all duration-300">
              <div className="absolute inset-0 bg-red-900/20 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300 ease-out"></div>
              <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-xs text-red-500 group-hover:text-red-400 transition-colors flex items-center gap-2">
                Retry Run <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
            <button className="group relative px-10 py-4 overflow-hidden border border-slate-800 bg-black hover:border-slate-600 transition-all duration-300">
              <div className="absolute inset-0 bg-slate-800/20 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300 ease-out"></div>
              <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                Go Home
              </span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
