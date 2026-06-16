import React from 'react';

export function HomeScreen({ setGameState }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f1ea]/80 backdrop-blur-sm z-10 pointer-events-none">
      <h1 className="text-7xl font-bold text-[#1c1917] tracking-tighter mb-8 italic" style={{fontFamily: '"Times New Roman", Times, serif'}}>
        Tameshigiri
      </h1>
      <div className="max-w-xl text-center text-[#1c1917] space-y-4 mb-8 p-10 bg-[#f4f1ea] rounded-sm shadow-2xl border-2 border-[#1c1917]">
        <p className="text-2xl italic text-[#b91c1c] border-b-2 border-[#1c1917] pb-4 font-serif">
          Test your blade against the bamboo grove.
        </p>
        <ul className="text-left space-y-4 text-lg font-serif mt-6">
          <li className="flex items-center">
            <strong className="mr-3 w-32 shrink-0">Standard:</strong> Swipe fast to cut normal bamboo.
          </li>
          <li className="flex items-center">
            <strong className="mr-3 w-32 shrink-0 text-[#78716c]">Thick Bamboo:</strong> Requires 3 rapid strikes.
          </li>
          <li className="flex items-start mt-6 pt-4 border-t border-[#d6d3d1]">
            <div>
              <strong className="block text-[#b91c1c] mb-1">The Archer's Volley (3000 Paces):</strong> 
              Time will freeze. Hold click to carefully paint a path that cuts <span className="font-bold underline">only normal arrows</span>. 
            </div>
          </li>
          <li className="flex items-start mt-2">
            <div>
              <strong className="block text-[#b91c1c] mb-1">The Shadow Ronin (5000 Paces):</strong> 
              Defend yourself in a frantic clash by swiping back and forth 15 times before time runs out.
            </div>
          </li>
        </ul>
      </div>
      <div className="flex gap-4 pointer-events-auto">
        <button 
          onClick={() => setGameState('PLAYING')} 
          className="px-16 py-4 bg-[#b91c1c] text-[#f4f1ea] font-serif font-bold text-2xl tracking-widest shadow-xl hover:bg-[#991b1b] transition-all border-2 border-[#1c1917]"
        >
          Begin
        </button>
        <button 
          onClick={() => setGameState('LEADERBOARDS')} 
          className="px-8 py-4 bg-transparent border-2 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-colors duration-300 font-serif font-bold tracking-widest"
        >
          Legends
        </button>
        <button 
          onClick={() => setGameState('ACHIEVEMENTS')} 
          className="px-8 py-4 bg-transparent border-2 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-colors duration-300 font-serif font-bold tracking-widest"
        >
          Deeds
        </button>
      </div>
    </div>
  );
}
