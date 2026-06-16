import React from 'react';
import { Persistence } from '../core/Persistence.js';

export function LeaderboardScreen({ setGameState }) {
  const data = Persistence.data;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent backdrop-blur-md z-10 pointer-events-auto">
      <h2 className="text-6xl font-serif text-[#1c1917] mb-12 tracking-widest italic" style={{textShadow: '4px 4px 0 #f4f1ea'}}>
        Legends of the Grove
      </h2>
      
      <div className="flex flex-col gap-6 text-[#1c1917] text-2xl font-serif mb-12 max-w-lg w-full px-10 py-12 border-4 border-[#1c1917] bg-washi shadow-card">
        <div className="flex justify-between items-center border-b-4 border-[#1c1917] pb-4">
          <span className="font-bold">Highest Paces:</span>
          <span className="font-bold text-[#b91c1c] text-4xl">{data.highScore}</span>
        </div>
        <div className="flex justify-between items-center border-b-2 border-[#1c1917]/20 pb-4 pt-2">
          <span className="font-medium">Total Lifetimes:</span>
          <span className="font-bold text-[#1c1917]">{data.gamesPlayed}</span>
        </div>
        <div className="flex justify-between items-center pb-2 pt-2">
          <span className="font-medium">Total Paces Walked:</span>
          <span className="font-bold text-[#1c1917]">{data.totalPaces}</span>
        </div>
      </div>

      <button 
        onClick={() => setGameState('START')} 
        className="px-12 py-4 bg-washi border-4 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-all duration-200 font-serif font-bold text-xl tracking-[0.1em] shadow-card hover:shadow-card-hover"
      >
        RETURN
      </button>
    </div>
  );
}
