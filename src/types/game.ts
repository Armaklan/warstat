export interface Player {
  id: string;
  name: string;
  isMe: boolean;
}

export interface ScoreEntry {
  category: string;
  points: number;
}

export interface Turn {
  number: number;
  startTime: Date;
  endTime?: Date;
  scores: Record<string, ScoreEntry[]>; // playerId -> scores
}

export interface GameSession {
  id?: number;
  gameName: string;
  scenarios: string[];
  players: Player[];
  startTime: Date;
  endTime?: Date;
  deploymentStartTime?: Date;
  deploymentEndTime?: Date;
  turns: Turn[];
  globalScores: Record<string, ScoreEntry[]>; // playerId -> scores (hors tours)
  status: 'setup' | 'deployment' | 'playing' | 'finished';
  result?: 'victory' | 'defeat' | 'draw';
}

export interface GameModel {
  id?: number;
  gameName: string;
  turnCategories: string[];
  globalCategories: string[];
}
