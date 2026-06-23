import React, { useState } from 'react';
import { Persistence } from '../core/Persistence.js';
import { bus } from '../core/bus.js';

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
// Wired to Persistence (survives reload) and the audio engine via the bus: every
// change saves and emits `settings:audio` so AudioEngine retunes its sub-buses.
// Sliders read/write 0–100 for the UI; Persistence stores 0–1.
export function SettingsControls() {
  const [bgmVol, setBgmVol] = useState(Math.round((Persistence.data.bgmVolume ?? 0.7) * 100));
  const [sfxVol, setSfxVol] = useState(Math.round((Persistence.data.sfxVolume ?? 0.8) * 100));
  const [bgmMuted, setBgmMuted] = useState(!!Persistence.data.bgmMuted);
  const [sfxMuted, setSfxMuted] = useState(!!Persistence.data.sfxMuted);
  const [screenShake, setScreenShake] = useState(Persistence.data.screenShake !== false);

  // Persist + broadcast a settings change. Volumes arrive as 0–100 from the UI.
  const apply = (partial) => {
    const saved = Persistence.updateSettings({
      ...(partial.bgmVol != null ? { bgmVolume: partial.bgmVol / 100 } : {}),
      ...(partial.sfxVol != null ? { sfxVolume: partial.sfxVol / 100 } : {}),
      ...(partial.bgmMuted != null ? { bgmMuted: partial.bgmMuted } : {}),
      ...(partial.sfxMuted != null ? { sfxMuted: partial.sfxMuted } : {}),
      ...(partial.screenShake != null ? { screenShake: partial.screenShake } : {}),
    });
    bus.emit('settings:audio', {
      bgmVolume: saved.bgmVolume,
      sfxVolume: saved.sfxVolume,
      bgmMuted: saved.bgmMuted,
      sfxMuted: saved.sfxMuted,
    });
  };

  return (
    <div className="space-y-7 relative z-10">
      <VolumeRow
        label="Music"
        value={bgmVol}
        muted={bgmMuted}
        onValue={(v) => { setBgmVol(v); setBgmMuted(false); apply({ bgmVol: v, bgmMuted: false }); }}
        onToggleMute={() => { const m = !bgmMuted; setBgmMuted(m); apply({ bgmMuted: m }); }}
      />
      <VolumeRow
        label="Effects"
        value={sfxVol}
        muted={sfxMuted}
        onValue={(v) => { setSfxVol(v); setSfxMuted(false); apply({ sfxVol: v, sfxMuted: false }); }}
        onToggleMute={() => { const m = !sfxMuted; setSfxMuted(m); apply({ sfxMuted: m }); }}
      />

      {/* Screen Shake */}
      <div className="flex justify-between items-center border-t border-slate-800/60 pt-5 mt-2">
        <span className="text-slate-400 font-serif tracking-wider text-[11px] uppercase">Screen Shake</span>
        <button
          onClick={() => { const s = !screenShake; setScreenShake(s); apply({ screenShake: s }); }}
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
