import React, { useState, useEffect } from 'react';

export const GameOverMock = () => {
  const [animationState, setAnimationState] = useState('idle'); // idle -> falling -> revealed

  useEffect(() => {
    // Start animation shortly after mount
    const timer = setTimeout(() => {
      setAnimationState('falling');
    }, 100);
    
    // Reveal stats after fire covers the screen
    const revealTimer = setTimeout(() => {
      setAnimationState('revealed');
    }, 1100); 

    return () => { clearTimeout(timer); clearTimeout(revealTimer); };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050505]">
      
      {/* Simulated Game Background (Blurred & Darkened) */}
      <div className={`absolute inset-0 transition-all duration-1000 ease-out ${animationState !== 'idle' ? 'blur-md scale-105 opacity-30' : 'blur-none opacity-100'}`}>
        {/* We use a dark stylized background gradient instead of an external image to be perfectly self-contained */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#18181b] to-[#09090b]"></div>
        {/* Some dummy geometric shapes to look like a paused game scene */}
        <div className="absolute top-[30%] left-[20%] w-32 h-64 bg-slate-800/50 transform -skew-x-12"></div>
        <div className="absolute top-[40%] right-[30%] w-48 h-20 bg-slate-800/50 transform rotate-12"></div>
      </div>

      {/* The Fire Dropdown Screen Container */}
      <div 
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-[#09090b] text-white transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-20"
        style={{ transform: animationState === 'idle' ? 'translateY(-100%)' : 'translateY(0%)' }}
      >
        
        {/* Fiery Trail Gradient on the bottom edge */}
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-800/80 via-orange-600/20 to-transparent pointer-events-none"></div>

        {/* Jagged Fire Edge sticking out below the container */}
        <div className="absolute -bottom-[119px] left-0 w-full h-[120px] pointer-events-none text-red-800/90 drop-shadow-[0_20px_30px_rgba(220,38,38,0.6)]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,0 L1200,0 L1200,60 L1150,20 L1100,80 L1050,10 L1000,70 L950,30 L900,90 L850,20 L800,100 L750,40 L700,80 L650,20 L600,110 L550,50 L500,90 L450,10 L400,80 L350,30 L300,70 L250,20 L200,100 L150,40 L100,80 L50,10 L0,50 Z"></path>
          </svg>
        </div>
        
        {/* Secondary Inner Flame Edge for depth */}
        <div className="absolute -bottom-[59px] left-0 w-full h-[60px] pointer-events-none text-orange-600/80 mix-blend-screen">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,0 L1200,0 L1200,80 L1130,40 L1070,90 L1020,30 L980,80 L920,40 L880,100 L840,30 L790,90 L730,50 L680,100 L620,40 L580,110 L530,60 L480,100 L440,30 L390,90 L340,40 L290,80 L230,30 L180,100 L130,50 L80,90 L40,20 L0,60 Z"></path>
          </svg>
        </div>

        {/* Sumi-e Paper Texture Overlay for the dark panel */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        {/* Content Container (Fades in after fire lands) */}
        <div className={`relative z-10 w-full max-w-3xl px-8 flex flex-col items-center transition-opacity duration-1000 ${animationState === 'revealed' ? 'opacity-100' : 'opacity-0'}`}>
          
          <h1 className="text-6xl md:text-8xl font-serif italic font-black text-red-600 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] mb-2 text-center">
            Game Over
          </h1>
          <div className="text-slate-400 font-mono tracking-[0.4em] uppercase text-xs md:text-sm mb-16 text-center">
            The fire consumes all
          </div>

          {/* Stats Panel */}
          <div className="w-full bg-[#121215]/90 backdrop-blur-md border-t border-b border-red-900/50 py-10 px-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden mb-16">
            
            {/* Corner geometric cutouts / accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600/80" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600/80" />
            
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10 pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-4 text-center relative z-10">
              
              {/* Score / Time */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 transform rotate-45" /> Survival Time
                </span>
                <span className="text-5xl font-bold font-serif italic text-white drop-shadow-md">08:42</span>
              </div>

              {/* Combos */}
              <div className="flex flex-col items-center justify-center md:border-l md:border-r border-slate-800/60">
                <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 transform rotate-45" /> Max Combo
                </span>
                <span className="text-5xl font-bold font-serif italic text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                  124<span className="text-2xl text-amber-500/70 ml-1">x</span>
                </span>
              </div>

              {/* Coins */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 transform rotate-45" /> Souls Gathered
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-3xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">🏮</span>
                  <span className="text-5xl font-bold font-serif italic text-white drop-shadow-md">1,240</span>
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
            <button className="group relative px-12 py-5 overflow-hidden border border-red-900 bg-[#121215] hover:border-red-500 transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]">
              <div className="absolute inset-0 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
              <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-sm text-red-50 group-hover:text-white transition-colors flex items-center gap-3 justify-center">
                <span>Retry Run</span>
                <span className="text-lg leading-none transform group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
            <button className="group relative px-12 py-5 overflow-hidden border border-slate-800 bg-[#121215] hover:border-slate-500 transition-all duration-300">
              <div className="absolute inset-0 bg-slate-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
              <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-sm text-slate-400 group-hover:text-white transition-colors flex items-center gap-3 justify-center">
                <span>Go Home</span>
              </span>
            </button>
          </div>

        </div>

        {/* Fire Flares / Embers */}
        <div className={`absolute bottom-0 left-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${animationState === 'revealed' ? 'opacity-100' : 'opacity-0'}`}>
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 rounded-full bg-orange-500 blur-[2px] mix-blend-screen"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `-20px`,
                animation: `floatUp ${3 + Math.random() * 4}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.1 + Math.random() * 0.7,
                transform: `scale(${0.3 + Math.random()})`
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-500px) scale(0); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};
