import Dexie, { type Table } from 'dexie';
import type { GameSession, GameModel } from '../types/game';

export class WarstatDatabase extends Dexie {
  sessions!: Table<GameSession>;
  gameModels!: Table<GameModel>;

  constructor() {
    super('WarstatDB');
    this.version(3).stores({
      sessions: '++id, gameName, startTime, createdAt, status',
      gameModels: '++id, &gameName'
    });
  }
}

export const db = new WarstatDatabase();
