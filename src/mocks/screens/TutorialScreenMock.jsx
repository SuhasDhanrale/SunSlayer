import React, { useEffect, useRef } from 'react';
import { drawYokai } from '../../renderer/YokaiRenderer.js';
import { drawArrowTrap } from '../../renderer/ArrowRenderer.js';

export const TutorialScreenMock = () => {
  const canvasRefs = useRef([]);

  useEffect(() => {
    let animationFrameId;
    let startTime = performance.now();

    const renderLoop = (now) => {
      const time = now - startTime;

      // 1. Draw Yokai
      const yokaiCanvas = canvasRefs.current[0];
      if (yokaiCanvas) {
        const ctx = yokaiCanvas.getContext('2d');
        ctx.clearRect(0, 0, yokaiCanvas.width, yokaiCanvas.height);
        
        const demon = {
          type: 'oni',
          radius: 35,
          x: yokaiCanvas.width / 2,
          y: yokaiCanvas.height / 2,
          rot: Math.sin(time * 0.002) * 0.1, // Subtle floating rotation
          sliced: false,
        };
        drawYokai(ctx, demon, time);
      }

      // 2. Draw Arrow Trap
      const arrowCanvas = canvasRefs.current[2];
      if (arrowCanvas) {
        const ctx = arrowCanvas.getContext('2d');
        ctx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
        
        const trap = {
          r: 32,
          x: arrowCanvas.width / 2,
          y: arrowCanvas.height / 2,
          spin: time * 0.0005, // Slow rotation
        };
        drawArrowTrap(ctx, trap, time, '#1c1917');
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 font-sans">
      {/* Device frame / Container */}
      <div className="relative w-[900px] h-[500px] bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        
        {/* Subtle background texture/grid */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Title */}
        <div className="relative pt-8 pb-2 text-center z-10 shrink-0">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase drop-shadow-md">
            How to Play
          </h1>
          <p className="text-slate-400 mt-1 font-medium tracking-wide text-sm">
            Master the blade. Survive the night.
          </p>
        </div>

        {/* 3 Columns */}
        <div className="flex-1 grid grid-cols-3 gap-6 px-10 py-2 relative z-10 min-h-0">
          
          {/* Column 1: Yokai */}
          <div className="group flex flex-col items-center text-center p-3 rounded-xl hover:bg-slate-800/50 transition-colors duration-300 border border-transparent hover:border-red-900/30">
            <div className="h-28 flex items-center justify-center mb-4 shrink-0">
              <canvas 
                ref={el => canvasRefs.current[0] = el}
                width={110} 
                height={110} 
                className="w-24 h-24 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2"
              />
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-2 tracking-wide uppercase">Slash Yokai</h2>
            <p className="text-xs text-slate-400 leading-relaxed overflow-hidden">
              Swipe to slice through demonic Yokai masks. Miss one, and you lose a life.
            </p>
          </div>

          {/* Column 2: Environmental */}
          <div className="group flex flex-col items-center text-center p-3 rounded-xl hover:bg-slate-800/50 transition-colors duration-300 border border-transparent hover:border-emerald-900/30">
            <div className="h-28 flex items-center justify-center mb-4 shrink-0">
              <svg viewBox="0 0 100 100" className="w-24 h-24 fill-current text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                {/* Stalk 1 */}
                <rect x="35" y="10" width="10" height="80" rx="2" />
                <rect x="33" y="35" width="14" height="4" rx="1" fill="#064e3b" />
                <rect x="33" y="65" width="14" height="4" rx="1" fill="#064e3b" />
                {/* Stalk 2 */}
                <rect x="55" y="20" width="12" height="70" rx="2" />
                <rect x="53" y="45" width="16" height="4" rx="1" fill="#064e3b" />
                <rect x="53" y="75" width="16" height="4" rx="1" fill="#064e3b" />
                {/* Leaves */}
                <path d="M 45 35 Q 60 25 65 35 Q 50 40 45 35 Z" />
                <path d="M 25 65 Q 10 55 5 65 Q 20 70 25 65 Z" />
                <path d="M 67 45 Q 85 35 90 45 Q 75 55 67 45 Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2 tracking-wide uppercase">Clear Path</h2>
            <p className="text-xs text-slate-400 leading-relaxed overflow-hidden">
              Cut down bamboo, rope bridges, and spikes to keep the Slayer moving forward safely.
            </p>
          </div>

          {/* Column 3: Fiery Arrows */}
          <div className="group flex flex-col items-center text-center p-3 rounded-xl hover:bg-slate-800/50 transition-colors duration-300 border border-transparent hover:border-amber-900/30">
            <div className="h-28 flex items-center justify-center mb-4 shrink-0 relative">
              <canvas 
                ref={el => canvasRefs.current[2] = el}
                width={110} 
                height={110} 
                className="w-24 h-24 transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 relative z-10"
              />
              {/* Extra glow for fire effect */}
              <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-500 pointer-events-none"></div>
            </div>
            <h2 className="text-xl font-bold text-amber-400 mb-2 tracking-wide uppercase">Avoid Arrows</h2>
            <p className="text-xs text-slate-400 leading-relaxed overflow-hidden">
              Do not touch the flaming arrows! Slashing them will burn you and end the run.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="relative pb-6 pt-2 shrink-0 flex justify-center z-10">
          <button className="animate-pulse px-8 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold tracking-widest text-sm uppercase transition-colors border border-white/20 backdrop-blur-sm shadow-lg">
            Tap to Continue
          </button>
        </div>
      </div>
    </div>
  );
};
