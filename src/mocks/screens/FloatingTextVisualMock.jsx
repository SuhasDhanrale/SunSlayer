import React, { useEffect, useRef } from 'react';

export const FloatingTextVisualMock = () => {
  const canvasRef = useRef(null);
  
  // Expose a function to spawn text from outside the animation loop
  const spawnerRef = useRef(null);

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

    let active = true;
    let texts = [];

    // Animation configuration
    const POP_DURATION = 8;
    const SHRINK_DURATION = 15;
    const HOLD_DURATION = 40;
    const FADE_DURATION = 20;

    const spawnText = (textStr, x, y, color, size, type) => {
      if (type === 'goldenhits') {
        const existing = texts.find(t => t.type === 'goldenhits');
        if (existing) {
          existing.text = textStr;
          // Jump straight to the peak of the pop (scale 1.5) to give it a bump effect 
          // without shrinking to 0 first. Keeps the same x/y position to prevent jitter.
          existing.age = POP_DURATION; 
          return;
        }
      }

      texts.push({
        text: textStr,
        x,
        y,
        color,
        size,
        type,
        age: 0,
        maxAge: POP_DURATION + SHRINK_DURATION + HOLD_DURATION + FADE_DURATION,
        // Optional random drift
        vx: (Math.random() - 0.5) * 0.5,
        vy: type === 'miss' || type === 'arrow' ? 0.5 : -0.5, // Miss/arrow fall down a bit, combo/crit go up
      });
    };

    spawnerRef.current = spawnText;

    const frame = () => {
      if (!active) return;

      const w = canvas.width;
      const h = canvas.height;

      // Draw background (like the wooden boards from fruit ninja, but let's use a dark slate for contrast)
      ctx.fillStyle = '#1e1b4b'; // Deep indigo background
      ctx.fillRect(0, 0, w, h);
      
      // Draw some mock slashes or wooden texture lines just for flavor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 2;
      for(let i=0; i<w; i+= 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i+20, h); ctx.stroke();
      }

      for (let i = texts.length - 1; i >= 0; i--) {
        let t = texts[i];
        t.age++;
        if (t.age > t.maxAge) {
          texts.splice(i, 1);
          continue;
        }

        // Apply slight velocity
        t.x += t.vx;
        t.y += t.vy;

        let scale = 1;
        let opacity = 1;

        // Pop phase (scale 0 -> 1.5)
        if (t.age < POP_DURATION) {
          const p = t.age / POP_DURATION;
          // ease out back formula approx
          scale = p * 1.5; 
        } 
        // Shrink phase (scale 1.5 -> 1.0)
        else if (t.age < POP_DURATION + SHRINK_DURATION) {
          const p = (t.age - POP_DURATION) / SHRINK_DURATION;
          scale = 1.5 - (p * 0.5);
        }
        // Fade phase
        else if (t.age > t.maxAge - FADE_DURATION) {
          const p = (t.age - (t.maxAge - FADE_DURATION)) / FADE_DURATION;
          opacity = 1 - p;
          // Float up faster during fade
          t.y += (t.type === 'miss' || t.type === 'arrow' ? 1.5 : -1.5);
        }

        // Extra shake for criticals during pop/shrink phase
        let shakeX = 0;
        let shakeY = 0;
        if (t.type === 'critical' && t.age < 20) {
           shakeX = (Math.random() - 0.5) * 8;
           shakeY = (Math.random() - 0.5) * 8;
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(t.x + shakeX, t.y + shakeY);
        ctx.scale(scale, scale);

        // Text setup
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add a slight rotation for style based on text type
        if (t.type === 'combo') ctx.rotate(-0.05);
        if (t.type === 'critical') ctx.rotate(0.05);

        const lines = t.type === 'combo' 
            ? [
                { text: `${t.text} FRUIT`, y: -t.size * 1.1, sizeMult: 0.5 },
                { text: "COMBO", y: -t.size * 0.5, sizeMult: 0.5 },
                { text: `+${t.text}`, y: t.size * 0.6, sizeMult: 1.5 }
              ]
            : [ { text: t.text, y: 0, sizeMult: 1.0 } ];

        // 1. Draw all white outer strokes first so they merge into a single border
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = '#ffffff';
        lines.forEach(line => {
            ctx.font = `900 ${t.size * line.sizeMult}px "Reggae One", system-ui, sans-serif`;
            ctx.lineWidth = t.size * line.sizeMult * 0.25;
            ctx.strokeText(line.text, 0, line.y);
        });

        // 2. Draw inner stroke and fill line by line (top to bottom) to layer them correctly
        if (t.type === 'combo') ctx.strokeStyle = '#92400e';
        else if (t.type === 'critical') ctx.strokeStyle = '#0284c7';
        else if (t.type === 'goldenhits') ctx.strokeStyle = '#d946ef'; // Magenta/Pink
        else ctx.strokeStyle = '#7f1d1d';
        
        ctx.fillStyle = t.color;

        lines.forEach(line => {
            ctx.font = `900 ${t.size * line.sizeMult}px "Reggae One", system-ui, sans-serif`;
            ctx.lineWidth = t.size * line.sizeMult * 0.1;
            ctx.strokeText(line.text, 0, line.y);
            ctx.fillText(line.text, 0, line.y);
        });

        ctx.restore();
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => {
      active = false;
      ro.disconnect();
    };
  }, []);

  const handleSpawn = (type) => {
    if (!spawnerRef.current) return;
    
    // Get center area of canvas (approx)
    const cw = 800 * (window.devicePixelRatio || 1);
    const ch = 500 * (window.devicePixelRatio || 1);
    const cx = cw / 2;
    const cy = ch / 2;
    
    // Slight random offset
    const rx = cx + (Math.random() - 0.5) * 150;
    const ry = cy + (Math.random() - 0.5) * 100;

    switch (type) {
      case 'combo':
        const comboCount = Math.floor(Math.random() * 5) + 3; // Random combo between 3 and 7
        spawnerRef.current(comboCount.toString(), rx, ry, '#fbbf24', 45, 'combo'); // Yellow/Gold
        break;
      case 'arrow':
        spawnerRef.current('-10', rx, ry, '#ef4444', 55, 'arrow'); // Red
        break;
      case 'stumble':
        spawnerRef.current('MISS!', rx, ry, '#f97316', 50, 'miss'); // Orange/Red
        break;
      case 'critical':
        spawnerRef.current('CRITICAL +10', rx, ry, '#38bdf8', 65, 'critical'); // Light Blue
        break;
      case 'goldenhits':
        if (!spawnerRef.hitCount) spawnerRef.hitCount = 0;
        spawnerRef.hitCount++;
        // Reset counter after 2 seconds of inactivity to simulate a new golden yokai encounter
        clearTimeout(spawnerRef.hitTimeout);
        spawnerRef.hitTimeout = setTimeout(() => { spawnerRef.hitCount = 0; }, 2000);
        
        spawnerRef.current(`${spawnerRef.hitCount} HITS`, rx, ry, '#fdf4ff', 60, 'goldenhits'); // White/Pink fill, Magenta stroke
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 font-sans select-none">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center bg-slate-900 px-6 py-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
            UI / VFX
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">
            ✨ Floating Text Visuals
          </h2>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-4">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full bg-slate-900 border border-slate-800 shadow-2xl rounded-lg max-w-5xl max-h-[600px]" 
        />
        
        {/* Control Panel */}
        <div className="absolute bottom-10 flex gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <button 
            onClick={() => handleSpawn('combo')}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded shadow-[0_4px_0_#854d0e] active:shadow-none active:translate-y-1 transition-all"
            style={{ fontFamily: '"Reggae One", sans-serif' }}
          >
            Spawn Combo
          </button>
          <button 
            onClick={() => handleSpawn('arrow')}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-[0_4px_0_#7f1d1d] active:shadow-none active:translate-y-1 transition-all"
            style={{ fontFamily: '"Reggae One", sans-serif' }}
          >
            Spawn Arrow (-10)
          </button>
          <button 
            onClick={() => handleSpawn('stumble')}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow-[0_4px_0_#9a3412] active:shadow-none active:translate-y-1 transition-all"
            style={{ fontFamily: '"Reggae One", sans-serif' }}
          >
            Spawn Miss
          </button>
          <button 
            onClick={() => handleSpawn('critical')}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded shadow-[0_4px_0_#0284c7] active:shadow-none active:translate-y-1 transition-all"
            style={{ fontFamily: '"Reggae One", sans-serif' }}
          >
            Spawn Critical
          </button>
          <button 
            onClick={() => handleSpawn('goldenhits')}
            className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold rounded shadow-[0_4px_0_#a21caf] active:shadow-none active:translate-y-1 transition-all"
            style={{ fontFamily: '"Reggae One", sans-serif' }}
          >
            Golden Yokai Hits
          </button>
        </div>
      </div>
    </div>
  );
};
