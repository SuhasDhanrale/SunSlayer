import React, { useState } from 'react';
import { Persistence } from '../core/Persistence.js';
import { HomeStage } from '../components/HomeStage.jsx';
import { MenuModal } from '../components/MenuModal.jsx';
import { MenuButton } from '../components/MenuButton.jsx';
import { SettingsControls } from '../components/SettingsControls.jsx';
import { bus } from '../core/bus.js';

const SHOJUMARU = "'Shojumaru', cursive";

// Square glass icon button matching the Settings gear's look — used for the
// left-stacked Wardrobe/Deeds/Settings trio so the row reads as icons, not text.
// `badge` shows a small red "new" dot in the corner (e.g. unseen completed quests).
function IconButton({ onClick, title, children, badge = false }) {
  return (
    <button
      onClick={() => {
        bus.emit('ui:click');
        onClick?.();
      }}
      title={title}
      className="relative w-10 h-10 md:w-12 md:h-12 rounded bg-[#0c0f12]/80 hover:bg-[#0c0f12] border border-slate-700/50 hover:border-red-500/50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-sm group"
    >
      {children}
      {badge && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#0c0f12] shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
      )}
    </button>
  );
}

export function HomeScreen({ setGameState }) {
  const [showSettings, setShowSettings] = useState(false);
  // Notification badge on Deeds when a quest was completed but not yet viewed. Read
  // once on render — opening the panel clears it (Persistence.markQuestsSeen).
  const hasNewQuests = Persistence.hasUnseenQuests();

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
          floating PLAY lantern (slice or tap it to start the run). Wardrobe,
          Deeds, and Settings are grouped on the left so the play button stays clear. */}
      <div className="absolute bottom-5 left-5 z-20 flex flex-col items-start gap-3">
        <IconButton onClick={() => setGameState('WARDROBE')} title="Wardrobe">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500">
            <path d="M12 3a1.8 1.8 0 1 1-1.8 1.8" />
            <path d="M12 4.8v2.4" />
            <path d="M12 7.2l-9.5 6.1c-.6.4-.3 1.4.4 1.4H6v6.3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6.3h3.1c.7 0 1-1 .4-1.4z" />
          </svg>
        </IconButton>
        <IconButton onClick={() => setGameState('ACHIEVEMENTS')} title="Deeds" badge={hasNewQuests}>
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500">
            <path d="M6 3.5h9a3 3 0 0 1 3 3V20" />
            <path d="M6 3.5a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h12" />
            <line x1="9" y1="8.5" x2="15" y2="8.5" />
            <line x1="9" y1="12.5" x2="15" y2="12.5" />
          </svg>
        </IconButton>

        {/* Settings gear */}
        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          className="w-10 h-10 md:w-12 md:h-12 rounded bg-[#0c0f12]/80 hover:bg-[#0c0f12] border border-slate-700/50 hover:border-red-500/50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-sm group"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </div>

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
