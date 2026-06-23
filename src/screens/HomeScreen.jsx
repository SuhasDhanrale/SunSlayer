import React, { useState } from 'react';
import { Persistence } from '../core/Persistence.js';
import { HomeStage } from '../components/HomeStage.jsx';
import { MenuModal } from '../components/MenuModal.jsx';
import { MenuButton } from '../components/MenuButton.jsx';
import { SettingsControls } from '../components/SettingsControls.jsx';

const SHOJUMARU = "'Shojumaru', cursive";

export function HomeScreen({ setGameState }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Interactive stage: rain backdrop + the equipped monk + the floating PLAY
          lantern. Slicing/tapping the lantern sends the monk running into the run. */}
      <HomeStage onStart={() => setGameState('PLAYING')} />

      {/* Wallet — coins carried between runs */}
      <div className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-[#0c0f12]/80 border border-slate-700/50 px-3 py-2 rounded backdrop-blur-md select-none shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <span className="inline-block w-4 h-4 rounded-full bg-[#facc15] border-2 border-[#a16207]" />
        <span className="text-lg font-bold tracking-widest text-[#fcd34d]">{Persistence.data.walletCoins}</span>
      </div>

      {/* Majestic title with animated fire effect */}
      <div className="absolute top-[7%] left-1/2 -translate-x-1/2 text-center select-none w-full px-4 flex flex-col items-center pointer-events-none">
        <svg width="100%" height="85" viewBox="0 0 600 120" className="overflow-visible filter drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] max-w-[600px]">
          <defs>
            <filter id="fireEffect" x="-20%" y="-50%" width="140%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04 0.12" numOctaves="3" seed="5">
                <animate attributeName="baseFrequency" values="0.04 0.12; 0.04 0.18; 0.04 0.12" dur="4.5s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" xChannelSelector="R" yChannelSelector="G" scale="15" />
            </filter>
            <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="30%" stopColor="#dc2626" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="coreGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <text x="50%" y="80" textAnchor="middle" fill="url(#fireGrad)" filter="url(#fireEffect)" style={{ fontFamily: SHOJUMARU }} className="text-7xl md:text-8xl tracking-[0.2em] opacity-90 mix-blend-screen">
            KIRI
          </text>
          <text x="50%" y="80" textAnchor="middle" fill="url(#coreGrad)" style={{ fontFamily: SHOJUMARU }} className="text-7xl md:text-8xl tracking-[0.2em] drop-shadow-md">
            KIRI
          </text>
        </svg>
        <p className="text-[10px] md:text-sm tracking-[0.45em] text-white font-bold uppercase -mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ml-1" style={{ fontFamily: SHOJUMARU }}>
          Slash Till Dawn
        </p>
      </div>

      {/* Navigation — the primary "Begin" action now lives on the stage as the
          floating PLAY lantern (slice or tap it to start the run). */}
      <div className="absolute inset-x-0 bottom-[6%] z-10 flex flex-col items-center gap-5 px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <MenuButton onClick={() => setGameState('WARDROBE')}>Wardrobe</MenuButton>
          <MenuButton onClick={() => setGameState('LEADERBOARDS')}>Legends</MenuButton>
          <MenuButton onClick={() => setGameState('ACHIEVEMENTS')}>Deeds</MenuButton>
        </div>
      </div>

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        title="Settings"
        className="absolute bottom-5 right-5 z-20 w-10 h-10 md:w-12 md:h-12 rounded bg-[#0c0f12]/80 hover:bg-[#0c0f12] border border-slate-700/50 hover:border-red-500/50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-sm group"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500">
          <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      </button>

      {/* Settings modal (visual only) */}
      {showSettings && (
        <MenuModal title="Settings">
          <SettingsControls />
          <MenuButton onClick={() => setShowSettings(false)} className="w-full mt-2">Return</MenuButton>
        </MenuModal>
      )}
    </div>
  );
}
