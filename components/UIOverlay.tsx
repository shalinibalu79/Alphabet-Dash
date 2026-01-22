
import React from 'react';
import { GameStatus, GameState } from '../types';

interface Props {
  status: GameStatus;
  gameState: GameState;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<Props> = ({ status, gameState, onStart, onRestart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
      
      {/* HUD - Playing State */}
      {status === GameStatus.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border-4 border-orange-400">
            <h2 className="text-xl font-fredoka text-orange-600">TARGET WORD</h2>
            <div className="flex gap-2 mt-1">
              {gameState.targetWord.split('').map((char, i) => (
                <span 
                  key={i} 
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-2xl transition-all duration-300 ${
                    i < gameState.wordProgress 
                      ? 'bg-green-500 text-white scale-110 shadow-lg' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl text-right">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Score</p>
              <p className="text-4xl font-fredoka text-indigo-600">{gameState.score.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              {gameState.powerups.magnet > 0 && <span className="bg-red-400 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">MAGNET</span>}
              {gameState.powerups.shield > 0 && <span className="bg-cyan-400 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">SHIELD</span>}
              {gameState.powerups.slow > 0 && <span className="bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">SLOW MO</span>}
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {status === GameStatus.START && (
        <div className="bg-white/95 backdrop-blur-lg rounded-[40px] p-12 shadow-2xl border-b-8 border-indigo-200 text-center max-w-lg pointer-events-auto">
          <h1 className="text-6xl font-fredoka text-indigo-600 mb-4 animate-bounce">ALPHABET DASH</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Run, jump, and slide to collect letters! Form words to score massive bonus points.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8 text-left text-sm text-gray-500">
            <div className="bg-indigo-50 p-4 rounded-2xl">
              <p className="font-bold text-indigo-600 mb-1">Controls</p>
              <p>Arrows / WASD: Move</p>
              <p>Space / W: Jump</p>
              <p>S / Down: Slide</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl">
              <p className="font-bold text-indigo-600 mb-1">Tips</p>
              <p>Collect letters in order!</p>
              <p>Avoid dark blocks.</p>
              <p>Use power-ups!</p>
            </div>
          </div>
          <button 
            onClick={onStart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-fredoka text-2xl py-6 rounded-3xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200"
          >
            LET'S GO!
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {status === GameStatus.GAMEOVER && (
        <div className="bg-white/95 backdrop-blur-lg rounded-[40px] p-12 shadow-2xl border-b-8 border-red-200 text-center max-w-lg pointer-events-auto">
          <h2 className="text-5xl font-fredoka text-red-500 mb-2">OOPS!</h2>
          <p className="text-xl text-gray-600 mb-8">You tripped over an obstacle!</p>
          
          <div className="bg-red-50 rounded-3xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">Distance</span>
              <span className="text-2xl font-bold text-red-600">{Math.floor(gameState.distance)}m</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">Letters</span>
              <span className="text-2xl font-bold text-orange-500">{gameState.lettersCollected}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-red-200">
              <span className="text-gray-700 font-bold">Final Score</span>
              <span className="text-4xl font-fredoka text-indigo-600">{gameState.score.toLocaleString()}</span>
            </div>
          </div>

          <button 
            onClick={onRestart}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-fredoka text-2xl py-6 rounded-3xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-red-200"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
