import Dexie, { type Table } from 'dexie';
import type { GameSession, GameModel, Scenario, AppSettings } from '../types/game';

export class WarstatDatabase extends Dexie {
  sessions!: Table<GameSession>;
  gameModels!: Table<GameModel>;
  scenarios!: Table<Scenario>;
  settings!: Table<AppSettings>;

  constructor() {
    super('WarstatDB');
    this.version(5).stores({
      sessions: '++id, gameName, startTime, createdAt, status',
      gameModels: '++id, &gameName',
      scenarios: '++id, [gameName+name], name, gameName',
      settings: 'id'
    });
  }
}

export const db = new WarstatDatabase();
