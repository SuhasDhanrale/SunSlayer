import React from 'react';

export function GameOverScreen({ setGameState, score }) {
  const { score: finalScore, isNewHighScore } = score;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent backdrop-blur-md z-10 pointer-events-auto">
      <div className="w-28 h-28 mb-8 bg-washi border-4 border-[#b91c1c] shadow-card flex items-center justify-center transform -rotate-3">
        <span className="text-[#b91c1c] text-6xl font-serif">無</span>
      </div>
      
      <div className="bg-washi border-4 border-[#1c1917] p-10 shadow-card flex flex-col items-center max-w-lg w-full mb-10">
        <h2 className="text-5xl font-serif text-[#1c1917] mb-6 tracking-widest italic font-bold">
          Focus Lost
        </h2>
        <div className="text-[#1c1917] text-3xl mb-4 font-serif font-medium border-t-4 border-[#1c1917] pt-6 w-full text-center">
          Paces Traveled: <span className="text-[#b91c1c] font-bold text-5xl ml-2">{finalScore}</span>
        </div>
        
        {isNewHighScore ? (
          <div className="text-[#b91c1c] text-2xl font-bold tracking-[0.2em] mt-4 mb-2 animate-pulse">
            NEW RECORD
          </div>
        ) : (
          <div className="mt-8 mb-2"></div>
        )}
      </div>

      <div className="flex gap-6">
        <button 
          onClick={() => setGameState('PLAYING')} 
          className="px-16 py-4 bg-[#b91c1c] text-[#f4f1ea] font-serif font-bold text-xl tracking-[0.1em] border-4 border-[#1c1917] hover:bg-[#991b1b] transition-all shadow-card hover:shadow-card-hover"
        >
          WALK AGAIN
        </button>
        <button 
          onClick={() => setGameState('START')} 
          className="px-12 py-4 bg-washi text-[#1c1917] font-serif font-bold text-xl tracking-[0.1em] border-4 border-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-all shadow-card hover:shadow-card-hover"
        >
          RETURN
        </button>
      </div>
    </div>
  );
}
