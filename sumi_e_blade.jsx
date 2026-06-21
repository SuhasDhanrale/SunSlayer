import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen.jsx';
import { GameScreen } from './src/screens/GameScreen.jsx';
import { GameOverScreen } from './src/screens/GameOverScreen.jsx';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen.jsx';
import { AchievementScreen } from './src/screens/AchievementScreen.jsx';
import { WardrobeScreen } from './src/screens/WardrobeScreen.jsx';

export default function PhantomBlade() {
  const [gameState, setGameState] = useState('START');
  const [runResult, setRunResult] = useState(null);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none font-serif bg-black flex items-center justify-center">
      <div className="relative w-full h-full max-w-[1920px] aspect-[16/9] mx-auto shadow-2xl overflow-hidden">
        
        {gameState === 'START' && <HomeScreen setGameState={setGameState} />}
        
        {gameState === 'PLAYING' && (
          <GameScreen 
            setGameState={setGameState} 
            setRunResult={setRunResult}
          />
        )}
        
        {gameState === 'GAMEOVER' && (
          <GameOverScreen 
            setGameState={setGameState} 
            result={runResult}
          />
        )}

        {gameState === 'LEADERBOARDS' && (
          <LeaderboardScreen setGameState={setGameState} />
        )}

        {gameState === 'ACHIEVEMENTS' && (
          <AchievementScreen setGameState={setGameState} />
        )}

        {gameState === 'WARDROBE' && (
          <WardrobeScreen setGameState={setGameState} />
        )}

      </div>
    </div>
  );
}
