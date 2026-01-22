
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameStatus, Lane, GameState, Entity } from './types';
import { 
  LANE_WIDTH, INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT, 
  SPAWN_INTERVAL, WORD_LIST, POWERUP_DURATION 
} from './constants';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { fetchAIWordList } from './services/geminiService';

const INITIAL_GAME_STATE: GameState = {
  score: 0,
  distance: 0,
  lettersCollected: 0,
  currentWord: '',
  targetWord: 'START',
  wordProgress: 0,
  lane: Lane.CENTER,
  isJumping: false,
  isSliding: false,
  jumpY: 0,
  slideProgress: 0,
  speed: INITIAL_SPEED,
  entities: [],
  powerups: { magnet: 0, shield: 0, slow: 0 }
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [renderState, setRenderState] = useState<GameState>(INITIAL_GAME_STATE);
  const [words, setWords] = useState<string[]>(WORD_LIST);
  
  // Use a ref for the core game state to avoid stale closures in requestAnimationFrame
  const stateRef = useRef<GameState>(INITIAL_GAME_STATE);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    const loadWords = async () => {
      try {
        const aiWords = await fetchAIWordList();
        if (aiWords && aiWords.length > 0) setWords(aiWords);
      } catch (e) {
        console.warn("AI words failed to load, using defaults.");
      }
    };
    loadWords();
  }, []);

  const spawnEntity = (currentWord: string, progress: number): Entity => {
    const lane = Math.floor(Math.random() * 3) as Lane;
    const rand = Math.random();
    
    if (rand < 0.6) {
      const targetChar = currentWord[progress] || 'A';
      const isTarget = Math.random() < 0.4;
      return {
        id: Math.random().toString(36).substring(7),
        type: 'LETTER',
        lane,
        z: 1000,
        value: isTarget ? targetChar : String.fromCharCode(65 + Math.floor(Math.random() * 26))
      };
    } else if (rand < 0.9) {
      return {
        id: Math.random().toString(36).substring(7),
        type: 'OBSTACLE',
        lane,
        z: 1000
      };
    } else {
      const types: Array<'MAGNET' | 'SHIELD' | 'SLOW'> = ['MAGNET', 'SHIELD', 'SLOW'];
      return {
        id: Math.random().toString(36).substring(7),
        type: 'POWERUP',
        lane,
        z: 1000,
        powerType: types[Math.floor(Math.random() * types.length)]
      };
    }
  };

  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    const s = stateRef.current;
    const next = { ...s, powerups: { ...s.powerups } };

    // 1. Advance physics and distance
    next.speed = Math.min(MAX_SPEED, s.speed + SPEED_INCREMENT);
    next.distance += next.speed / 10;
    next.score += Math.floor(next.speed / 2);

    if (next.isJumping) {
      next.jumpY += 8;
      if (next.jumpY > 150) {
        next.isJumping = false;
        next.jumpY = 0;
      }
    }
    if (next.isSliding) {
      next.slideProgress += 5;
      if (next.slideProgress > 100) {
        next.isSliding = false;
        next.slideProgress = 0;
      }
    }

    // Powerup decays
    if (next.powerups.magnet > 0) next.powerups.magnet--;
    if (next.powerups.shield > 0) next.powerups.shield--;
    if (next.powerups.slow > 0) next.powerups.slow--;

    // 2. Move entities
    const activeSpeed = next.powerups.slow > 0 ? next.speed * 0.5 : next.speed;
    let newEntities = s.entities
      .map(e => ({ ...e, z: e.z - activeSpeed }))
      .filter(e => e.z > -50);

    // 3. Collision handling
    const remainingEntities: Entity[] = [];
    let collision = false;

    for (const e of newEntities) {
      const isNear = e.z < 100 && e.z > 0;
      const correctLane = e.lane === next.lane;
      const magnetEffect = next.powerups.magnet > 0 && e.type === 'LETTER';

      if (isNear && (correctLane || magnetEffect)) {
        if (e.type === 'LETTER') {
          const isTarget = e.value === next.targetWord[next.wordProgress];
          if (isTarget) {
            next.wordProgress++;
            next.score += 1000;
            if (next.wordProgress >= next.targetWord.length) {
              next.score += 5000;
              next.targetWord = words[Math.floor(Math.random() * words.length)];
              next.wordProgress = 0;
            }
          } else {
            next.score += 200;
          }
          next.lettersCollected++;
        } else if (e.type === 'OBSTACLE') {
          const jumpingOver = next.isJumping && e.z < 60;
          const slidingUnder = next.isSliding && e.z < 60;
          
          if (!jumpingOver && !slidingUnder) {
            if (next.powerups.shield > 0) {
              next.powerups.shield = 0;
            } else {
              collision = true;
            }
          } else {
            remainingEntities.push(e);
          }
        } else if (e.type === 'POWERUP') {
          const type = e.powerType!.toLowerCase() as keyof typeof next.powerups;
          next.powerups[type] = POWERUP_DURATION;
          next.score += 500;
        }
      } else {
        remainingEntities.push(e);
      }
    }

    if (collision) {
      setStatus(GameStatus.GAMEOVER);
      return;
    }

    // 4. Spawning
    frameCountRef.current++;
    if (frameCountRef.current % SPAWN_INTERVAL === 0) {
      remainingEntities.push(spawnEntity(next.targetWord, next.wordProgress));
    }

    next.entities = remainingEntities;
    stateRef.current = next;
    setRenderState(next);

    requestRef.current = requestAnimationFrame(update);
  }, [status, words]);

  const resetGame = useCallback(() => {
    const firstWord = words[Math.floor(Math.random() * words.length)];
    const newState = {
      ...INITIAL_GAME_STATE,
      targetWord: firstWord,
      entities: [],
    };
    stateRef.current = newState;
    setRenderState(newState);
    frameCountRef.current = 0;
    setStatus(GameStatus.PLAYING);
  }, [words]);

  const handleInput = useCallback((e: KeyboardEvent) => {
    if (status !== GameStatus.PLAYING) return;
    const s = stateRef.current;

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
        stateRef.current.lane = Math.max(0, s.lane - 1) as Lane;
        break;
      case 'ArrowRight':
      case 'd':
        stateRef.current.lane = Math.min(2, s.lane + 1) as Lane;
        break;
      case 'ArrowUp':
      case 'w':
      case ' ':
        if (!s.isJumping) {
          stateRef.current.isJumping = true;
          stateRef.current.jumpY = 0;
        }
        break;
      case 'ArrowDown':
      case 's':
        if (!s.isSliding) {
          stateRef.current.isSliding = true;
          stateRef.current.slideProgress = 0;
        }
        break;
    }
  }, [status]);

  useEffect(() => {
    window.addEventListener('keydown', handleInput);
    return () => window.removeEventListener('keydown', handleInput);
  }, [handleInput]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, update]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-300">
      <GameCanvas gameState={renderState} entities={renderState.entities} />
      <UIOverlay 
        status={status} 
        gameState={renderState} 
        onStart={resetGame} 
        onRestart={resetGame}
      />
    </div>
  );
};

export default App;
