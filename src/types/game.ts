export interface Player {
  id: string;
  name: string;
  isMe: boolean;
  army?: string;
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
  createdAt: Date;
  endTime?: Date;
  deploymentStartTime?: Date;
  deploymentEndTime?: Date;
  turns: Turn[];
  globalScores: Record<string, ScoreEntry[]>; // playerId -> scores (hors tours)
  status: 'setup' | 'deployment' | 'playing' | 'finished';
  result?: 'victory' | 'defeat' | 'draw';
  isManual?: boolean;
  notes?: string;
  scenarioDetails?: Record<string, string>;
}

export interface Scenario {
  id?: number;
  gameName: string;
  name: string;
  details: string;
}

export interface GameModel {
  id?: number;
  gameName: string;
  turnCategories: string[];
  globalCategories: string[];
}

export interface AppSettings {
  id?: string;
  autoSaveFileHandle?: any;
}
