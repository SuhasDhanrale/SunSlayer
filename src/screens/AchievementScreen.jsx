import React from 'react';
import { Persistence } from '../core/Persistence.js';

export function AchievementScreen({ setGameState }) {
  const achievements = Persistence.getAchievementsList();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent backdrop-blur-md z-10 pointer-events-auto">
      <h2 className="text-6xl font-serif text-[#1c1917] mb-8 tracking-widest italic" style={{textShadow: '4px 4px 0 #f4f1ea'}}>
        Heroic Deeds
      </h2>
      
      <div className="flex flex-col gap-6 mb-12 max-w-3xl w-full h-[60vh] overflow-y-auto px-4 py-4 scrollbar-hide">
        {achievements.map(ach => (
          <div key={ach.id} className={`flex items-center gap-6 p-6 border-4 shadow-card bg-washi transition-all ${ach.unlocked ? 'border-[#1c1917] text-[#1c1917]' : 'border-[#1c1917]/20 text-[#1c1917]/40 grayscale opacity-80'}`}>
            <div className={`w-20 h-20 shrink-0 rounded-full border-4 flex items-center justify-center text-4xl font-serif ${ach.unlocked ? 'border-[#b91c1c] text-[#b91c1c]' : 'border-[#1c1917]/20 text-[#1c1917]/40'}`}>
              {ach.unlocked ? '真' : '未'}
            </div>
            <div>
              <h3 className="text-3xl font-bold font-serif mb-2 tracking-widest">{ach.name}</h3>
              <p className={`font-serif italic text-lg ${ach.unlocked ? 'text-[#b91c1c]' : 'text-[#1c1917]/40'}`}>{ach.description}</p>
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
