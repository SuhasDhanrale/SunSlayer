import { useState, useEffect, useRef } from 'react';

export const LoadingScreenMock = () => {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const stateRef = useRef({
    progress: 0,
    time: 0,
    particles: [],
    flashAlpha: 0,
    shake: 0
  });

  // Simulate fast loading
  const triggerLoad = () => {
    setProgress(0);
    setIsLoaded(false);
    stateRef.current.progress = 0;
    stateRef.current.flashAlpha = 0;
    stateRef.current.shake = 0;
    stateRef.current.particles = [];
  };

  useEffect(() => {
    triggerLoad();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = (canvas.clientWidth || 500) * dpr;
      canvas.height = (canvas.clientHeight || 500) * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf;

    const frame = () => {
      stateRef.current.time++;
      const w = canvas.width;
      const h = canvas.height;

      // Simulated Loading Progress (Non-linear easing)
      if (stateRef.current.progress < 100) {
        const increment = Math.max(0.2, (100 - stateRef.current.progress) * 0.05 * Math.random());
        stateRef.current.progress = Math.min(100, stateRef.current.progress + increment);
        setProgress(Math.floor(stateRef.current.progress));

        if (stateRef.current.progress >= 100) {
          // Trigger the 100% slash effect
          setIsLoaded(true);
          stateRef.current.flashAlpha = 1.0;
          stateRef.current.shake = 20;

          // Spawn blood/ink particles
          for (let i = 0; i < 40; i++) {
            stateRef.current.particles.push({
              x: w * 0.15 + Math.random() * w * 0.7,
              y: h * 0.5,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8 - 2,
              life: 1.0,
              size: Math.random() * 4 + 1
            });
          }
        }
      }

      // Decay screen shake
      if (stateRef.current.shake > 0) {
        stateRef.current.shake *= 0.85;
        if (stateRef.current.shake < 0.5) stateRef.current.shake = 0;
      }

      const currentShakeX = (Math.random() - 0.5) * stateRef.current.shake;
      const currentShakeY = (Math.random() - 0.5) * stateRef.current.shake;

      // Clear dark background
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(currentShakeX, currentShakeY);

      // --- Draw Background Atmosphere ---
      const vignette = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.8);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(28, 25, 23, 0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // --- Draw Particles ---
      for (let i = stateRef.current.particles.length - 1; i >= 0; i--) {
        const p = stateRef.current.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.life -= 0.02;
        if (p.life > 0) {
          ctx.fillStyle = `rgba(153, 27, 27, ${p.life})`; // Red blood/ink
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          stateRef.current.particles.splice(i, 1);
        }
      }

      // --- Draw "KIRI" Title ---
      ctx.font = '72px "Shojumaru", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const titleY = h * 0.4;
      
      // Title shadow
      ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
      ctx.fillText("KIRI", w/2 + 4, titleY + 4);
      
      // Title core
      const progColor = stateRef.current.progress >= 100 ? '#ef4444' : '#e2e8f0';
      ctx.fillStyle = progColor;
      ctx.fillText("KIRI", w/2, titleY);

      // --- Draw Loading Slash Bar ---
      const barWidth = w * 0.7;
      const barX = (w - barWidth) / 2;
      const barY = h * 0.5;

      // Track line (dark)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + barWidth, barY);
      ctx.stroke();

      // Progress line (white -> red)
      const currentWidth = barWidth * (stateRef.current.progress / 100);
      
      ctx.strokeStyle = stateRef.current.progress >= 100 ? '#dc2626' : '#f8fafc';
      ctx.lineWidth = stateRef.current.progress >= 100 ? 6 : 3;
      ctx.shadowColor = stateRef.current.progress >= 100 ? '#ef4444' : '#ffffff';
      ctx.shadowBlur = stateRef.current.progress >= 100 ? 15 : 8;
      
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + currentWidth, barY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sword tip spark
      if (stateRef.current.progress < 100) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(barX + currentWidth, barY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // --- Draw Percentage / Status ---
      ctx.font = '16px "Shojumaru", cursive';
      ctx.fillStyle = stateRef.current.progress >= 100 ? '#dc2626' : '#94a3b8';
      ctx.fillText(
        stateRef.current.progress >= 100 ? "READY TO SLICE" : `${Math.floor(stateRef.current.progress)}%`,
        w/2, 
        h * 0.6
      );

      ctx.restore();

      // --- Draw Flash Overlay ---
      if (stateRef.current.flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${stateRef.current.flashAlpha})`;
        ctx.fillRect(0, 0, w, h);
        stateRef.current.flashAlpha -= 0.08;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-[#020408] flex items-center justify-center overflow-hidden">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Shojumaru&display=swap');`}
      </style>
      
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      />

      {isLoaded && (
        <button 
          onClick={triggerLoad}
          className="absolute bottom-8 px-6 py-2 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-red-500 font-serif text-sm tracking-[0.2em] uppercase transition-colors z-10 rounded shadow-lg"
        >
          Replay Animation
        </button>
      )}
    </div>
  );
};
