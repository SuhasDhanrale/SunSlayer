import React from 'react';
import { Persistence } from '../core/Persistence.js';

export function LeaderboardScreen({ setGameState }) {
  const data = Persistence.data;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f1ea]/90 backdrop-blur-md z-10 pointer-events-auto">
      <h2 className="text-5xl font-serif text-[#1c1917] mb-12 tracking-widest italic">
        Legends of the Grove
      </h2>
      
      <div className="flex flex-col gap-6 text-[#1c1917] text-2xl font-serif mb-12 max-w-md w-full px-8 py-10 border-2 border-[#1c1917] bg-[#f4f1ea] shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#d6d3d1] pb-2">
          <span>Highest Paces:</span>
          <span className="font-bold text-[#b91c1c] text-3xl">{data.highScore}</span>
        </div>
        <div className="flex justify-between items-center border-b border-[#d6d3d1] pb-2">
          <span>Total Lifetimes:</span>
          <span className="font-bold text-[#78716c]">{data.gamesPlayed}</span>
        </div>
        <div className="flex justify-between items-center pb-2">
          <span>Total Paces Walked:</span>
          <span className="font-bold text-[#78716c]">{data.totalPaces}</span>
        </div>
      </div>

      <button 
        onClick={() => setGameState('START')} 
        className="px-8 py-4 bg-transparent border-2 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-colors duration-300 font-serif font-bold tracking-widest"
      >
        Return
      </button>
    </div>
  );
}
