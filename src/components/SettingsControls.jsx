import React, { useState } from 'react';

// One volume row: label + Mute toggle + a custom thin-track slider with a glowing
// crimson handle. The native range input is invisible and stretched over the track
// so it stays draggable/accessible while the styled bar reads the value.
function VolumeRow({ label, value, muted, onValue, onToggleMute }) {
  const pct = muted ? 0 : value;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">{label}</span>
        <button
          onClick={onToggleMute}
          className="text-red-500/70 hover:text-red-400 text-[10px] uppercase tracking-widest font-serif transition cursor-pointer"
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>
      <div className="relative h-4 flex items-center group">
        <input
          type="range"
          min="0"
          max="100"
          value={pct}
          onChange={(e) => onValue(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="absolute left-0 right-0 h-[1px] bg-slate-800" />
        <div className="absolute left-0 h-[1px] bg-red-700 transition-all duration-75" style={{ width: `${pct}%` }} />
        <div
          className="absolute w-2 h-4 bg-slate-300 group-hover:bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.5)] -translate-x-1/2 transition-colors duration-200 pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Music / Effects / Screen-Shake controls shared by the Settings and Pause modals.
// VISUAL ONLY for now: state is local and not yet wired to the audio or shake systems
// (see "just visuals" scope). Drop the wiring in here later via props/bus.
export function SettingsControls() {
  const [bgmVol, setBgmVol] = useState(70);
  const [sfxVol, setSfxVol] = useState(80);
  const [bgmMuted, setBgmMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [screenShake, setScreenShake] = useState(true);

  return (
    <div className="space-y-7 relative z-10">
      <VolumeRow
        label="Music"
        value={bgmVol}
        muted={bgmMuted}
        onValue={(v) => { setBgmVol(v); setBgmMuted(false); }}
        onToggleMute={() => setBgmMuted((m) => !m)}
      />
      <VolumeRow
        label="Effects"
        value={sfxVol}
        muted={sfxMuted}
        onValue={(v) => { setSfxVol(v); setSfxMuted(false); }}
        onToggleMute={() => setSfxMuted((m) => !m)}
      />

      {/* Screen Shake */}
      <div className="flex justify-between items-center border-t border-slate-800/60 pt-5 mt-2">
        <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Screen Shake</span>
        <button
          onClick={() => setScreenShake((s) => !s)}
          className={`px-4 py-1.5 font-serif tracking-widest text-[10px] cursor-pointer transition uppercase border ${
            screenShake
              ? 'border-red-900/50 text-red-400 bg-red-950/20'
              : 'border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {screenShake ? 'Active' : 'Disabled'}
        </button>
      </div>
    </div>
  );
}
