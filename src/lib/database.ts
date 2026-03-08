import Dexie, { Table } from 'dexie';
import type { LogEntry } from './log';
import type { Meal } from './meals';
import type { Settings } from './settings';

export interface SettingsWithId extends Settings {
    id?: number; // Dexie requires a primary key, we'll use a fixed id
}

export class CalcibusDB extends Dexie {
  logEntries!: Table<LogEntry>;
  meals!: Table<Meal>;
  settings!: Table<SettingsWithId>;

  constructor() {
    super('CalcibusDB');
    this.version(1).stores({
      logEntries: 'id, mealType, timestamp, followUpDone',
      meals: 'id, name',
      settings: '++id' // auto-incrementing id, but we'll only have one record
    });
  }
}

export const db = new CalcibusDB();