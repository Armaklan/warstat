import Dexie, { type Table } from 'dexie';
import type { GameSession, GameModel, Scenario } from '../types/game';

export class WarstatDatabase extends Dexie {
  sessions!: Table<GameSession>;
  gameModels!: Table<GameModel>;
  scenarios!: Table<Scenario>;

  constructor() {
    super('WarstatDB');
    this.version(4).stores({
      sessions: '++id, gameName, startTime, createdAt, status',
      gameModels: '++id, &gameName',
      scenarios: '++id, [gameName+name], name, gameName'
    });
  }
}

export const db = new WarstatDatabase();
