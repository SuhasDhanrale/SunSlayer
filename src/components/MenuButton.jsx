import React from 'react';

// Dark-glass menu button with a left-origin colour sweep on hover. Ported from the
// Start/Overlays mock. `primary` is the crimson call-to-action (Begin / Resume);
// the default ghost variant is the slate secondary (nav / Quit / Return).
export function MenuButton({ children, onClick, primary = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      className={`relative group py-4 px-8 overflow-hidden border bg-[#121215] transition-all duration-300 cursor-pointer ${
        primary
          ? 'border-red-900 hover:border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]'
          : 'border-slate-800 hover:border-slate-500'
      } ${className}`}
    >
      <div
        className={`absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out ${
          primary ? 'bg-red-600' : 'bg-slate-800'
        }`}
      />
      <span
        className={`relative z-10 font-bold tracking-[0.2em] uppercase text-[11px] transition-colors flex items-center justify-center ${
          primary ? 'text-red-50 group-hover:text-white' : 'text-slate-400 group-hover:text-white'
        }`}
      >
        {children}
      </span>
    </button>
  );
}
