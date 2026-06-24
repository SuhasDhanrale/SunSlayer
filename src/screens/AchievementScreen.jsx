import React, { useEffect } from 'react';
import { Persistence } from '../core/Persistence.js';

// The Deeds panel — the player's quest log. Lists every quest with a live progress
// bar; completed quests read in full colour, in-progress ones are dimmed. Opening
// this screen clears the "new quest" notification badge shown on the home button.
export function AchievementScreen({ setGameState }) {
  const quests = Persistence.getQuestsList();
  const completedCount = quests.filter((q) => q.completed).length;

  useEffect(() => {
    Persistence.markQuestsSeen();
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent backdrop-blur-md z-10 pointer-events-auto">
      <h2 className="text-6xl font-serif text-[#1c1917] mb-2 tracking-widest italic" style={{ textShadow: '4px 4px 0 #f4f1ea' }}>
        Heroic Deeds
      </h2>
      <p className="text-[#b91c1c] font-serif italic text-lg mb-6 tracking-widest">{completedCount} / {quests.length} completed</p>

      <div className="flex flex-col gap-4 mb-10 max-w-3xl w-full h-[60vh] overflow-y-auto px-4 py-4 scrollbar-hide">
        {quests.map((q) => (
          <div key={q.id} className={`flex items-center gap-6 p-5 border-4 shadow-card bg-washi transition-all ${q.completed ? 'border-[#1c1917] text-[#1c1917]' : 'border-[#1c1917]/20 text-[#1c1917]/50'}`}>
            <div className={`w-16 h-16 shrink-0 rounded-full border-4 flex items-center justify-center text-3xl font-serif ${q.completed ? 'border-[#b91c1c] text-[#b91c1c]' : 'border-[#1c1917]/20 text-[#1c1917]/40'}`}>
              {q.completed ? '真' : '未'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold font-serif mb-1 tracking-widest">{q.name}</h3>
              <p className={`font-serif italic text-base mb-2 ${q.completed ? 'text-[#b91c1c]' : 'text-[#1c1917]/40'}`}>{q.desc}</p>

              {/* Progress bar + numeric readout */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-[#1c1917]/10 border border-[#1c1917]/20 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${q.completed ? 'bg-[#b91c1c]' : 'bg-[#1c1917]/40'}`}
                    style={{ width: `${Math.round(q.ratio * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs tracking-wider shrink-0 tabular-nums">
                  {q.current.toLocaleString()} / {q.goal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setGameState('START')}
        className="px-12 py-4 bg-washi border-4 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-all duration-200 font-serif font-bold text-xl tracking-[0.1em] shadow-card hover:shadow-card-hover shrink-0"
      >
        RETURN
      </button>
    </div>
  );
}
