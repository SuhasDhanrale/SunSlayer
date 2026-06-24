import React, { useState, useEffect, useRef } from 'react';

// Game-over sequence ported from the "Game Over" mock (GameOverMock.jsx): a black
// panel drops down over the blurred run, then a canvas paints the emotional defeat
// tableau (angled rain, the kneeling monk fist-down beside his fallen cursed box, a
// planted sword, a vignette). Title + stat bar + actions fade in after the reveal.
//
// The stat bar is wired to the real finalized run `result` (Paces / Max Combo /
// Coins), with a NEW RECORD flag and wallet line. Buttons drive the scene machine.

// Faithful port of the mock's bespoke defeat canvas. The kneeling figure keeps the
// mock's hand-drawn "slayer in despair" look (the production character renderers have
// no despair pose); this is the one-off defeat tableau, not the live character.
function drawDefeatScene(ctx, canvas, time) {
  const w = canvas.width;
  const h = canvas.height;

  // Dark moody background
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  // Rain (background)
  ctx.lineWidth = 1;
  for (const p of drawDefeatScene._rain) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y > h) { p.y = -50; p.x = Math.random() * (w + 500) - 250; }
    ctx.strokeStyle = `rgba(148, 163, 184, ${p.alpha})`;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 2, p.y - p.length);
    ctx.stroke();
  }

  const cx = w / 2;
  const cy = h * 0.85;
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

  // Fallen, broken box
  ctx.save();
  ctx.translate(60, 0);
  ctx.rotate(Math.PI / 2 + 0.1);
  drawBrokenBox(ctx);
  ctx.restore();

  // Kneeling monk in despair
  ctx.save();
  ctx.translate(-40, 0);

  const checkered = drawDefeatScene._pattern || (drawDefeatScene._pattern = makeCheckered(ctx));

  // Torso (hunched over)
  ctx.fillStyle = checkered;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-15, -60, 30, -40);
  ctx.lineTo(20, 0);
  ctx.closePath();
  ctx.fill();

  // Leg wrap peeking out
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-15, -2); ctx.lineTo(-2, -2); ctx.stroke();
  drawSlayerKyahan(ctx, -10, -2);

  // Bowed head
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath(); ctx.arc(35, -35, 12, 0, Math.PI * 2); ctx.fill();

  // Spiky hair
  const hx = 35, hy = -35;
  ctx.fillStyle = '#450a0a';
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy);
  ctx.lineTo(hx - 16, hy - 12); ctx.lineTo(hx - 8, hy - 8); ctx.lineTo(hx - 10, hy - 18);
  ctx.lineTo(hx, hy - 12); ctx.lineTo(hx + 8, hy - 18); ctx.lineTo(hx + 6, hy - 8);
  ctx.lineTo(hx + 14, hy - 6); ctx.lineTo(hx + 10, hy + 2); ctx.lineTo(hx - 2, hy - 2);
  ctx.fill();
  ctx.fillStyle = '#991b1b';
  ctx.beginPath(); ctx.arc(hx - 6, hy - 10, 3.6, 0, Math.PI * 2); ctx.arc(hx + 4, hy - 12, 3, 0, Math.PI * 2); ctx.fill();

  // Arm punching the ground
  ctx.strokeStyle = checkered;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, -35);
  ctx.quadraticCurveTo(30, -20, 35, 0);
  ctx.stroke();
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath(); ctx.arc(35, 0, 5, 0, Math.PI * 2); ctx.fill();

  // Sword planted in the ground behind him
  ctx.save();
  ctx.translate(-25, -2);
  ctx.rotate(-0.2);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(0, 10); ctx.stroke();
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-6, -40, 12, 4);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(-2, -90, 4, 50);
  ctx.restore();

  ctx.restore();
  ctx.restore();

  // Vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(5,5,5,0.9)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function makeCheckered(ctx) {
  const p = document.createElement('canvas'); p.width = 12; p.height = 12;
  const c = p.getContext('2d');
  c.fillStyle = '#065f46'; c.fillRect(0, 0, 12, 12);
  c.fillStyle = '#1c1917'; c.fillRect(0, 0, 6, 6); c.fillRect(6, 6, 6, 6);
  return ctx.createPattern(p, 'repeat');
}

function drawSlayerKyahan(ctx, lx, ly) {
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(lx - 4, ly - 10); ctx.lineTo(lx + 4, ly - 10);
  ctx.lineTo(lx + 3, ly - 2); ctx.lineTo(lx - 3, ly - 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#047857'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(lx - 3, ly - 7); ctx.lineTo(lx + 3, ly - 7); ctx.moveTo(lx - 2, ly - 4); ctx.lineTo(lx + 2, ly - 4); ctx.stroke();
}

function drawBrokenBox(ctx) {
  const boxW = 40 * 1.2, boxH = 65 * 1.2; // mock draws the fallen box at scale 1.2
  ctx.save();
  ctx.scale(1.2, 1.2);
  const W = 40, H = 65;
  ctx.fillStyle = '#54321c'; ctx.fillRect(-W / 2, -H, W, H);
  ctx.fillStyle = '#18120e'; ctx.fillRect(W / 2 - 6 - 4, -H + 6, 4, H - 12);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-W / 2 - 2, -H, W + 4, 6);
  ctx.fillRect(-W / 2 - 2, -6, W + 4, 6);
  ctx.fillRect(-W / 2 - 2, -H + 6, 4, H - 12);
  // Jagged hole revealing empty darkness
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.moveTo(W / 2 + 2, -H * 0.3); ctx.lineTo(W / 2 - 15, -H * 0.4);
  ctx.lineTo(W / 2 - 25, -H * 0.6); ctx.lineTo(W / 2 - 5, -H * 0.8); ctx.lineTo(W / 2 + 2, -H * 0.7);
  ctx.fill();
  ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 15, -H * 0.4); ctx.lineTo(W / 2 - 20, -H * 0.3);
  ctx.moveTo(W / 2 - 25, -H * 0.6); ctx.lineTo(W / 2 - 35, -H * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(W / 2 - 4, -H + 6, 4, H * 0.3);
  ctx.fillRect(W / 2 - 4, -H * 0.9, 4, H * 0.1);
  void boxW; void boxH;
  ctx.restore();
}

const SHOJUMARU = "'Shojumaru', cursive";

export function GameOverScreen({ setGameState, result }) {
  const { score = 0, bestScore = 0, distancePaces = 0, isNewBest = false, bankedCoins = 0, walletCoins = 0, maxCombo = 0 } = result || {};
  const [phase, setPhase] = useState('idle'); // idle -> falling -> revealed
  const canvasRef = useRef(null);

  // Reveal timeline (mock parity).
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('falling'), 100);
    const t2 = setTimeout(() => setPhase('revealed'), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Defeat canvas — only runs once the panel has dropped.
  useEffect(() => {
    if (phase !== 'revealed') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 400) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    drawDefeatScene._rain = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 2000 - 500,
      y: Math.random() * 1000,
      vx: 1 + Math.random() * 2,
      vy: 10 + Math.random() * 15,
      length: 10 + Math.random() * 20,
      alpha: 0.1 + Math.random() * 0.3,
    }));
    drawDefeatScene._pattern = null;

    let raf;
    let time = 0;
    const frame = () => {
      time++;
      drawDefeatScene(ctx, canvas, time);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [phase]);

  const revealed = phase === 'revealed';

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050505] z-10">
      {/* Blurred game behind the dropping panel */}
      <div className={`absolute inset-0 transition-all duration-1000 ease-out ${phase !== 'idle' ? 'blur-md scale-105 opacity-30' : 'blur-none opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#18181b] to-[#09090b]" />
      </div>

      {/* The dropdown panel — split 50/50: the emotional defeat tableau on the LEFT,
          the title + stats + actions arranged on the RIGHT. Stacks vertically on
          narrow screens (canvas on top, content below). */}
      <div
        className="absolute inset-0 flex flex-col md:flex-row bg-[#050505] text-white transition-transform duration-[1000ms] z-20"
        style={{
          transform: phase === 'idle' ? 'translateY(-100%)' : 'translateY(0%)',
          transitionTimingFunction: 'cubic-bezier(0.25,1,0.5,1)',
        }}
      >
        {/* LEFT — emotional defeat canvas (the kneeling slayer + rain) with the
            GAME OVER title overlaid on top, so the right column only carries the
            score/stats/actions and fits inside a 500px-tall viewport. */}
        <div className={`relative w-full h-1/2 md:h-full md:w-1/2 transition-opacity duration-[2000ms] delay-500 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          {/* Seam fade so the tableau melts into the stats side rather than hard-edging */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-[#050505] pointer-events-none hidden md:block" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#050505] pointer-events-none md:hidden" />

          {/* Title — overlaid near the top of the tableau */}
          <div className={`absolute inset-x-0 top-0 px-6 pt-8 md:pt-12 text-center pointer-events-none transition-opacity duration-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
            <h1 style={{ fontFamily: SHOJUMARU }} className="text-4xl md:text-6xl font-black text-red-700 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              Game Over
            </h1>
            {isNewBest && (
              <div className="text-amber-400 text-sm md:text-base font-bold tracking-[0.4em] mt-3 animate-pulse uppercase">
                New Record
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — score, stats, actions */}
        <div className="relative w-full h-1/2 md:h-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-6 z-10">
          {/* Headline SCORE */}
          <div className={`text-center mb-6 md:mb-8 transition-opacity duration-1000 delay-700 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-2">Score</div>
            <div style={{ fontFamily: SHOJUMARU }} className="text-6xl md:text-7xl font-black text-white leading-none drop-shadow-[0_0_18px_rgba(250,204,21,0.25)]">
              {score.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-mono tracking-widest mt-3 uppercase">Best · {bestScore.toLocaleString()}</div>
          </div>

          {/* Secondary stats */}
          <div className={`w-full max-w-md flex justify-between items-center border-t border-b border-slate-800/60 py-4 px-4 md:px-6 mb-6 md:mb-8 bg-[#0a0a0c]/80 backdrop-blur-sm transition-opacity duration-1000 delay-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Paces</span>
              <span className="text-xl font-serif italic text-white">{distancePaces}</span>
            </div>
            <div className="flex flex-col items-center border-l border-r border-slate-800/60 px-6 md:px-10">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Max Combo</span>
              <span className="text-xl font-serif italic text-amber-500">{maxCombo}<span className="text-sm text-amber-500/70 ml-1">x</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Coins</span>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-[#facc15] border-2 border-[#a16207]" />
                <span className="text-xl font-serif italic text-white">+{bankedCoins}</span>
              </div>
            </div>
          </div>

          <div className={`text-[11px] text-slate-500 font-mono tracking-widest mb-6 uppercase transition-opacity duration-1000 delay-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}>Wallet · {walletCoins}</div>

          <div className={`flex gap-4 md:gap-6 w-full max-w-md justify-center transition-opacity duration-1000 delay-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => setGameState('PLAYING')}
              className="group relative px-8 md:px-10 py-4 overflow-hidden border border-red-900/50 bg-black hover:border-red-600 transition-all duration-300 cursor-pointer"
            >
              <div className="absolute inset-0 bg-red-900/20 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300 ease-out" />
              <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-xs text-red-500 group-hover:text-red-400 transition-colors flex items-center gap-2">
                Retry Run <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
            <button
              onClick={() => setGameState('START')}
              className="group relative px-8 md:px-10 py-4 overflow-hidden border border-slate-800 bg-black hover:border-slate-600 transition-all duration-300 cursor-pointer"
            >
              <div className="absolute inset-0 bg-slate-800/20 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300 ease-out" />
              <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                Go Home
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
