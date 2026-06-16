import React from 'react';
import { Persistence } from '../core/Persistence.js';

export function AchievementScreen({ setGameState }) {
  const achievements = Persistence.getAchievementsList();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f1ea]/90 backdrop-blur-md z-10 pointer-events-auto">
      <h2 className="text-5xl font-serif text-[#1c1917] mb-8 tracking-widest italic">
        Heroic Deeds
      </h2>
      
      <div className="flex flex-col gap-4 mb-12 max-w-2xl w-full h-96 overflow-y-auto px-8">
        {achievements.map(ach => (
          <div key={ach.id} className={`flex items-center gap-6 p-6 border-2 transition-all ${ach.unlocked ? 'border-[#b91c1c] bg-[#1c1917] text-[#f4f1ea]' : 'border-[#d6d3d1] bg-transparent text-[#78716c] grayscale opacity-60'}`}>
            <div className="w-16 h-16 shrink-0 rounded-full border-2 border-current flex items-center justify-center text-3xl font-serif">
              {ach.unlocked ? '真' : '未'}
            </div>
            <div>
              <h3 className="text-2xl font-bold font-serif mb-1 tracking-widest">{ach.name}</h3>
              <p className="font-serif italic">{ach.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setGameState('START')} 
        className="px-8 py-4 bg-transparent border-2 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-colors duration-300 font-serif font-bold tracking-widest shrink-0"
      >
        Return
      </button>
    </div>
  );
}
