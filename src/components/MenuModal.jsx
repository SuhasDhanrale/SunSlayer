import React from 'react';

// Faint fractal-noise paper grain laid over the modal card (ported from the mock).
const PAPER_NOISE =
  'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")';

// Shared dark-glass modal shell for the menu overlays (Settings, Pause): blurred
// scrim, red corner accents, paper-grain texture, and a centred title. Scoped to the
// nearest positioned ancestor (the 16:9 game frame) via `absolute inset-0`, so it
// stays inside the letterboxed play area rather than the whole window.
export function MenuModal({ title, children }) {
  return (
    <div
      className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm bg-[#121215]/90 backdrop-blur-md border-t border-b border-red-900/50 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col gap-6 sm:gap-8 rounded-none">
        {/* Corner geometric accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600/80 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10 pointer-events-none" />
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: PAPER_NOISE }} />

        <div className="border-b border-slate-800/60 pb-4 text-center">
          <h2 className="text-xl sm:text-2xl font-serif tracking-[0.2em] text-slate-200 uppercase">{title}</h2>
        </div>

        {children}
      </div>
    </div>
  );
}
