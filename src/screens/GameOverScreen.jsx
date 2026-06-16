import React from 'react';

export function GameOverScreen({ setGameState, score }) {
  const { score: finalScore, isNewHighScore } = score;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1917]/90 backdrop-blur-md z-10 pointer-events-auto">
      <div className="w-24 h-24 mb-6 rounded-full border-4 border-[#b91c1c] flex items-center justify-center">
        <span className="text-[#b91c1c] text-5xl font-serif">無</span>
      </div>
      <h2 className="text-5xl font-serif text-[#f4f1ea] mb-2 tracking-widest italic">
        Focus Lost
      </h2>
      <div className="text-[#d6d3d1] text-2xl mb-2 font-serif">
        Paces Traveled: <span className="text-[#b91c1c] font-bold text-4xl ml-2">{finalScore}</span>
      </div>
      {isNewHighScore && (
        <div className="text-[#fef08a] text-xl font-bold tracking-widest mb-10 animate-pulse">
          NEW RECORD!
        </div>
      )}
      {!isNewHighScore && <div className="mb-12"></div>}
      <div className="flex gap-4">
        <button 
          onClick={() => setGameState('PLAYING')} 
          className="px-16 py-4 bg-transparent border-2 border-[#f4f1ea] text-[#f4f1ea] font-serif font-bold text-xl tracking-widest hover:bg-[#f4f1ea] hover:text-[#1c1917] transition-all"
        >
          Walk Again
        </button>
        <button 
          onClick={() => setGameState('START')} 
          className="px-8 py-4 bg-transparent border-2 border-[#78716c] text-[#78716c] font-serif font-bold text-xl tracking-widest hover:bg-[#78716c] hover:text-[#1c1917] transition-all"
        >
          Return
        </button>
      </div>
    </div>
  );
}
