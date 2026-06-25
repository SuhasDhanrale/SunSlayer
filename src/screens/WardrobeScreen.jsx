import React, { useState, useEffect, useRef } from 'react';
import { Persistence } from '../core/Persistence.js';
import { CHARACTERS } from '../data/characters.js';
import { SLASHES } from '../data/slashes.js';
import { drawCharacter } from '../renderer/characters/index.js';
import { drawSlashTrail, spawnSlashParticle, updateSlashParticle, drawSlashParticle } from '../renderer/slashes/index.js';

const SHOJUMARU = "'Shojumaru', cursive";

// Card background fills, keyed by the character's fabric pattern — ported from the
// Wardrobe & Slashes mock's per-skin `visualStyle`, so the cards read like the mock.
const PATTERN_BG = {
  seigaiha_blue: { backgroundImage: 'radial-gradient(circle at 50% 100%, #ffffff 0 2px, transparent 3px), linear-gradient(to bottom, #1e3a8a, #0f172a)', backgroundSize: '20px 20px, 100% 100%' },
  kumo_purple: { backgroundImage: 'linear-gradient(135deg, #6d28d9 0%, #2e1065 100%)' },
  asanoha_red: { backgroundImage: 'repeating-linear-gradient(60deg, #dc2626 0px, #dc2626 9px, #ffffff22 9px, #ffffff22 10px), linear-gradient(#b91c1c, #7f1d1d)' },
  yagasuri_black: { backgroundImage: 'repeating-linear-gradient(45deg, #1c1917 0px, #1c1917 8px, #f5f5f4 8px, #f5f5f4 16px)' },
  shippo_flame: { backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 7px, #fcd34d 8px, transparent 9px), linear-gradient(to top, #9f1239, #be123c)', backgroundSize: '20px 20px, 100% 100%' },
};

// Breath-effect card fills, keyed by slash id (mock's ELEMENT `visualStyle`).
const SLASH_BG = {
  wind: { background: 'radial-gradient(circle, #34d399 0%, #064e3b 100%)' },
  water: { background: 'radial-gradient(circle, #38bdf8 0%, #0c4a6e 100%)' },
  thunder: { background: 'radial-gradient(circle, #fde047 0%, #713f12 100%)' },
  flame: { background: 'radial-gradient(circle, #f87171 0%, #7f1d1d 100%)' },
};

// Rarity → Tailwind classes (mock palette: Legendary amber, Epic purple, Rare blue).
const RARITY = {
  Legendary: { text: 'text-amber-400', border: 'border-amber-500/80', bg: 'bg-amber-500' },
  Epic: { text: 'text-purple-400', border: 'border-purple-500/80', bg: 'bg-purple-500' },
  Rare: { text: 'text-blue-400', border: 'border-blue-500/80', bg: 'bg-blue-500' },
};
const rarityOf = (r) => RARITY[r] || RARITY.Rare;

export function WardrobeScreen({ setGameState }) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const [, setRevision] = useState(0);
  const [message, setMessage] = useState(null);
  const [previewCharId, setPreviewCharId] = useState(Persistence.data.equippedCharacterId);
  const [previewSlashId, setPreviewSlashId] = useState(Persistence.data.equippedSlashId);
  // Which section the showcase is currently previewing: the worn outfit (character)
  // or the slash effect on its own. Picking a card in either section switches it.
  const [previewMode, setPreviewMode] = useState('outfit'); // 'outfit' | 'breath'

  // Drag-to-scroll for the card strip (mock parity).
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: 0 });
  // Manual swipe override: while the player drags on the canvas, the trail follows
  // their pointer instead of the auto figure-8 (so they can test the real slash feel).
  const manual = useRef({ active: false, points: [], idle: 0 });

  // --- Showcase canvas ---
  // Outfit mode: the real production character (running in place) in the selected
  // outfit. Breath mode: the elemental slash effect on its own — its real trail +
  // particles sweeping a looping infinity (lemniscate) path, or your own swipe. No
  // character is drawn in breath mode.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf;
    let time = 0;
    let t = 0;            // lemniscate parameter for the auto sweep
    let auto = [];        // recent points of the auto figure-8 sweep (comet trail)
    let particles = [];
    const BUDGET = 150;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;

      // Background: dark anime stage + diagonal cut + giant calligraphy watermark
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w * 0.6, 0); ctx.lineTo(w * 0.4, h); ctx.lineTo(0, h);
      ctx.fill();
      ctx.save();
      ctx.translate(w * 0.7, h * 0.5);
      ctx.font = `bold ${Math.min(w, h) * 0.4}px serif`;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.04)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('斬', 0, 0);
      ctx.restore();

      // OUTFIT MODE: ground line + the real running character in the chosen outfit.
      if (previewMode === 'outfit') {
        const groundY = h * 0.78;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
        drawCharacter(ctx, { id: previewCharId, x: w * 0.5, y: groundY, scale: Math.min(w, h) * 0.007, pose: 'running', time });
        raf = requestAnimationFrame(frame);
        return;
      }

      // BREATH MODE: the slash effect on its own.
      const usingManual = manual.current.active || manual.current.points.length > 1;
      let trail;
      let head = null;

      if (usingManual) {
        // Hand-drawn swipe. When the pointer lifts, age the tail out, then resume auto.
        trail = manual.current.points;
        if (!manual.current.active && trail.length > 0 && time % 2 === 0) trail.shift();
        head = trail.length ? trail[trail.length - 1] : null;
        auto = [];
      } else {
        // Auto figure-8: a point sweeps a lemniscate of Bernoulli; keep a comet tail.
        t += 0.05;
        const a = Math.min(w, h) * 0.34;
        const cx = w * 0.5;
        const cy = h * 0.46;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = cx + (a * Math.cos(t)) / denom;
        const y = cy + (a * Math.sin(t) * Math.cos(t)) / denom;
        auto.push({ x, y });
        if (auto.length > 22) auto.shift();
        trail = auto;
        head = { x, y };
      }

      // Direction at the head, for particle ejection angle.
      let angle = 0;
      if (trail.length > 1) {
        const a0 = trail[trail.length - 2];
        const a1 = trail[trail.length - 1];
        angle = Math.atan2(a1.y - a0.y, a1.x - a0.x);
      }

      if (head && particles.length < BUDGET && Math.random() < 0.5) {
        particles.push(spawnSlashParticle(ctx, previewSlashId, head.x, head.y, angle));
      }

      if (trail.length > 1) drawSlashTrail(ctx, previewSlashId, trail, time, 3);

      for (let i = particles.length - 1; i >= 0; i--) {
        if (!updateSlashParticle(previewSlashId, particles[i])) { particles.splice(i, 1); continue; }
        drawSlashParticle(ctx, previewSlashId, particles[i], time);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [previewMode, previewCharId, previewSlashId]);

  // Map a pointer event to canvas (backing-store) coordinates.
  const toCanvas = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cxp = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const cyp = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    return {
      x: (cxp - rect.left) * (canvas.width / rect.width),
      y: (cyp - rect.top) * (canvas.height / rect.height),
    };
  };
  const swipeDown = (e) => {
    if (previewMode !== 'breath') return; // swiping only tests the breath effect
    manual.current.active = true;
    manual.current.points = [toCanvas(e)];
  };
  const swipeMove = (e) => {
    if (!manual.current.active) return;
    const p = manual.current.points;
    p.push(toCanvas(e));
    if (p.length > 22) p.shift();
  };
  const swipeUp = () => { manual.current.active = false; };

  // --- Economy ---
  const commit = (kind, item) => {
    const ownedKey = kind === 'character' ? 'ownedCharacterIds' : 'ownedSlashIds';
    if (!Persistence.data[ownedKey].includes(item.id)) {
      const purchase = Persistence.purchaseCosmetic(kind, item.id);
      if (!purchase.ok) {
        setMessage(purchase.reason === 'insufficient-funds' ? 'Not enough coins.' : 'That item is unavailable.');
        setRevision((v) => v + 1);
        return;
      }
    }
    Persistence.equipCosmetic(kind, item.id);
    if (kind === 'character') { setPreviewCharId(item.id); setPreviewMode('outfit'); }
    else { setPreviewSlashId(item.id); setPreviewMode('breath'); }
    setMessage(null);
    setRevision((v) => v + 1);
  };

  // --- Drag-to-scroll handlers ---
  const onDown = (e) => {
    drag.current = { active: true, startX: e.pageX, scrollLeft: scrollRef.current.scrollLeft, moved: 0 };
  };
  const onMove = (e) => {
    if (!drag.current.active) return;
    e.preventDefault();
    const walk = (e.pageX - drag.current.startX) * 1.5;
    drag.current.moved = Math.abs(e.pageX - drag.current.startX);
    scrollRef.current.scrollLeft = drag.current.scrollLeft - walk;
  };
  const endDrag = () => { drag.current.active = false; };

  const renderCharCard = (c) => {
    const owned = Persistence.data.ownedCharacterIds.includes(c.id);
    const equipped = Persistence.data.equippedCharacterId === c.id;
    const selected = previewCharId === c.id;
    const r = rarityOf(c.rarity);
    return (
      <button
        key={c.id}
        onClick={() => { if (drag.current.moved > 5) return; setPreviewCharId(c.id); setPreviewMode('outfit'); }}
        className={`group relative flex flex-col justify-end w-48 h-28 border transition-all duration-300 overflow-hidden shrink-0 cursor-pointer ${
          selected ? `${r.border} shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105` : 'border-slate-800/80 hover:border-slate-600/80 hover:scale-105'
        }`}
      >
        <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity duration-500" style={PATTERN_BG[c.patternType]} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f12] via-[#0c0f12]/80 to-transparent pointer-events-none" />
        <div className={`absolute top-0 right-0 w-8 h-8 transition-colors ${selected ? r.bg : 'bg-slate-800/50 group-hover:bg-slate-700/80'}`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
        <div className="p-3 pl-4 text-left w-full flex flex-col justify-end relative z-10">
          <span className={`block font-serif italic text-[10px] uppercase tracking-widest mb-1 ${selected ? r.text : 'text-slate-500'}`}>{c.rarity}</span>
          <span style={{ fontFamily: SHOJUMARU }} className={`block text-sm tracking-widest mb-2 ${selected ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}`}>{c.name}</span>
          <span
            onClick={(e) => { e.stopPropagation(); if (!equipped) commit('character', c); }}
            className={`inline-block text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-1 border w-fit transition-colors ${
              equipped ? 'border-emerald-700/60 text-emerald-400 bg-emerald-950/30 cursor-default'
                : owned ? 'border-slate-700 text-slate-200 hover:border-white hover:text-white'
                : 'border-amber-700/60 text-amber-300 hover:border-amber-400'
            }`}
          >
            {equipped ? 'Equipped' : owned ? 'Equip' : `Buy · ${c.unlockCost}`}
          </span>
        </div>
      </button>
    );
  };

  const renderSlashCard = (s) => {
    const owned = Persistence.data.ownedSlashIds.includes(s.id);
    const equipped = Persistence.data.equippedSlashId === s.id;
    const selected = previewSlashId === s.id;
    return (
      <button
        key={s.id}
        onClick={() => { if (drag.current.moved > 5) return; setPreviewSlashId(s.id); setPreviewMode('breath'); }}
        className={`group relative flex flex-col justify-end w-40 h-28 border transition-all duration-300 overflow-hidden shrink-0 cursor-pointer ${
          selected ? 'shadow-[0_0_15px_rgba(220,38,38,0.2)] scale-105' : 'border-slate-800/80 hover:border-slate-600/80 hover:scale-105'
        }`}
        style={{ borderColor: selected ? s.accentColor : '' }}
      >
        <div className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500" style={SLASH_BG[s.id]} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f12] via-[#0c0f12]/70 to-transparent pointer-events-none" />
        <div className="p-3 pl-4 text-left w-full flex flex-col justify-end relative z-10">
          <span className="block font-serif italic text-[10px] uppercase tracking-widest mb-1 text-slate-400">{s.tagline}</span>
          <span style={{ fontFamily: SHOJUMARU }} className={`block text-sm tracking-widest mb-2 ${selected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{s.name}</span>
          <span
            onClick={(e) => { e.stopPropagation(); if (!equipped) commit('slash', s); }}
            className={`inline-block text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-1 border w-fit transition-colors ${
              equipped ? 'border-emerald-700/60 text-emerald-400 bg-emerald-950/30 cursor-default'
                : owned ? 'border-slate-700 text-slate-200 hover:border-white hover:text-white'
                : 'border-amber-700/60 text-amber-300 hover:border-amber-400'
            }`}
          >
            {equipped ? 'Equipped' : owned ? 'Equip' : `Buy · ${s.unlockCost}`}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#09090b] text-white font-sans overflow-hidden z-20">
      {/* Decorative anime cut lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-[25%] w-1 h-full bg-red-600/20 -skew-x-12 origin-top" />
        <div className="absolute top-0 right-[28%] w-[2px] h-full bg-red-500/40 -skew-x-12 origin-top" />
      </div>

      {/* Showcase (70%) */}
      <div className="h-[70%] relative z-10 flex-shrink-0">
        <canvas
          ref={canvasRef}
          onPointerDown={swipeDown}
          onPointerMove={swipeMove}
          onPointerUp={swipeUp}
          onPointerLeave={swipeUp}
          className="block w-full h-full touch-none cursor-crosshair"
        />

        <div className="absolute top-6 left-6 flex items-center gap-4 border-l-4 border-red-500 pl-4">
          <div className="flex flex-col">
            <span style={{ fontFamily: SHOJUMARU }} className="text-2xl md:text-3xl font-black uppercase tracking-widest drop-shadow-lg">Wardrobe</span>
            <span className="text-[10px] md:text-xs font-mono text-red-500 tracking-[0.3em] uppercase">{previewMode === 'breath' ? 'Swipe to test the slash' : 'Your hero'}</span>
          </div>
        </div>

        {/* Wallet + Return */}
        <div className="absolute top-6 right-6 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0c0f12]/80 border border-slate-700/50 px-3 py-2 rounded backdrop-blur-md">
            <span className="inline-block w-4 h-4 rounded-full bg-[#facc15] border-2 border-[#a16207]" />
            <span className="text-lg font-bold tracking-widest text-[#fcd34d]">{Persistence.data.walletCoins}</span>
          </div>
          <button
            onClick={() => setGameState('START')}
            className="group relative px-6 py-2.5 overflow-hidden border border-slate-800 bg-black hover:border-slate-500 transition-all duration-300 cursor-pointer"
          >
            <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-[11px] text-slate-400 group-hover:text-white transition-colors">Return</span>
          </button>
        </div>

        {message && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-red-400 font-bold tracking-widest text-sm bg-black/70 px-4 py-2 border border-red-900/50">
            {message}
          </div>
        )}
      </div>

      {/* Top accent strip on the panel */}
      <div className="absolute bottom-0 left-0 w-full h-[30%] pointer-events-none z-30">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600/80" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-600/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10" />
      </div>

      {/* Card strip (30%, drag/scroll) */}
      <div
        ref={scrollRef}
        onWheel={(e) => { scrollRef.current.scrollLeft += e.deltaY; }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className={`h-[30%] w-full relative z-20 bg-[#121215]/90 backdrop-blur-md flex flex-row items-center border-t border-red-900/50 shadow-[0_-10px_50px_rgba(0,0,0,0.8)] overflow-x-auto overflow-y-hidden px-8 gap-10 select-none ${drag.current.active ? 'cursor-grabbing' : 'cursor-grab'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
      >
        {/* Outfit gallery */}
        <div className="flex flex-col h-full py-5 justify-center relative z-10 shrink-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-slate-400 font-serif tracking-widest text-[11px] uppercase">Outfit Gallery</span>
          </div>
          <div className="flex gap-4 items-center pb-2">{CHARACTERS.map(renderCharCard)}</div>
        </div>

        <div className="w-[1px] h-1/3 bg-slate-800/60 shrink-0 relative z-10" />

        {/* Breath effects */}
        <div className="flex flex-col h-full py-5 justify-center relative z-10 shrink-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-slate-400 font-serif tracking-widest text-[11px] uppercase">Slash Effect</span>
          </div>
          <div className="flex gap-4 items-center pb-2">{SLASHES.map(renderSlashCard)}</div>
        </div>
      </div>
    </div>
  );
}
