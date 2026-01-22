
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  PAUSED = 'PAUSED'
}

export enum Lane {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2
}

export interface Entity {
  id: string;
  type: 'LETTER' | 'OBSTACLE' | 'POWERUP';
  lane: Lane;
  z: number;
  value?: string;
  powerType?: 'MAGNET' | 'SHIELD' | 'SLOW';
}

export interface GameState {
  score: number;
  distance: number;
  lettersCollected: number;
  currentWord: string;
  targetWord: string;
  wordProgress: number;
  lane: Lane;
  isJumping: boolean;
  isSliding: boolean;
  jumpY: number;
  slideProgress: number;
  speed: number;
  entities: Entity[];
  powerups: {
    magnet: number;
    shield: number;
    slow: number;
  };
}
