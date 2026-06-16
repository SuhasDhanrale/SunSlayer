import React from 'react';

export function HomeScreen({ setGameState }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent backdrop-blur-md z-10 pointer-events-none">
      <h1 className="text-8xl font-bold text-[#1c1917] tracking-tighter mb-8 italic" style={{fontFamily: '"Times New Roman", Times, serif', textShadow: '4px 4px 0 #f4f1ea'}}>
        Tameshigiri
      </h1>
      
      <div className="max-w-xl text-center text-[#1c1917] space-y-4 mb-8 p-10 bg-washi rounded-sm shadow-card border-4 border-[#1c1917]">
        <p className="text-2xl italic text-[#b91c1c] border-b-4 border-[#1c1917] pb-4 font-serif font-bold">
          Test your blade against the bamboo grove.
        </p>
        <ul className="text-left space-y-4 text-lg font-serif mt-6 font-medium">
          <li className="flex items-center">
            <span className="w-3 h-3 bg-[#1c1917] rounded-full mr-4 inline-block"></span>
            <span>Swipe fast to cut <strong className="font-bold">normal bamboo</strong>.</span>
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-[#1c1917] rounded-full mr-4 inline-block"></span>
            <span><strong className="text-[#1c1917] font-bold">Thick Bamboo:</strong> Requires 3 rapid strikes.</span>
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-[#b91c1c] rounded-full mr-4 inline-block"></span>
            <span><strong className="text-[#b91c1c] font-bold">Bombs:</strong> Avoid slicing or touching.</span>
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-[#059669] rounded-full mr-4 inline-block"></span>
            <span><strong className="text-[#059669] font-bold">Melons:</strong> Slice for great honor.</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-6 pointer-events-auto">
        <button 
          onClick={() => setGameState('PLAYING')} 
          className="px-16 py-4 bg-[#b91c1c] text-[#f4f1ea] font-serif font-bold text-2xl tracking-[0.2em] shadow-card hover:shadow-card-hover hover:bg-[#991b1b] transition-all border-4 border-[#1c1917]"
        >
          BEGIN
        </button>
        <button 
          onClick={() => setGameState('LEADERBOARDS')} 
          className="px-8 py-4 bg-washi border-4 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-all duration-200 font-serif font-bold tracking-[0.1em] shadow-card hover:shadow-card-hover"
        >
          LEGENDS
        </button>
        <button 
          onClick={() => setGameState('ACHIEVEMENTS')} 
          className="px-8 py-4 bg-washi border-4 border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f4f1ea] transition-all duration-200 font-serif font-bold tracking-[0.1em] shadow-card hover:shadow-card-hover"
        >
          DEEDS
        </button>
      </div>
    </div>
  );
}
