import { db } from './database';

export interface LogEntry {
  id:                 string;
  mealId:             string;
  mealName:           string;
  glucoseLevel:       number;
  dose:               number;
  mealType:           'breakfast' |
                      'brunch' |
                      'lunch' |
                      'dinner' |
                      'snack';
  timestamp:          string;
  followUpGlucose?:   number;
  followUpTimestamp?: string;
  followUpDone:       boolean;
}



export async function getLogEntries(): Promise<LogEntry[]> {
    return await db.logEntries.orderBy('timestamp').reverse().toArray();
}

export async function saveLogEntries(entries: LogEntry[]): Promise<void> {
    await db.logEntries.clear();
    await db.logEntries.bulkAdd(entries);
}

export async function clearLogEntries(): Promise<void> {
    await db.logEntries.clear();
}

export async function addLogEntry(entry: Omit<LogEntry, 'id' | 'followUpDone'>): Promise<LogEntry> {
    const newEntry: LogEntry = {
        ...entry,
        id: crypto.randomUUID(),
        followUpDone: false
    };
    await db.logEntries.add(newEntry);
    return newEntry;
}

export async function updateLogEntry(entryId: string, followUpGlucose: number): Promise<void> {
    await db.logEntries.update(entryId, {
        followUpGlucose,
        followUpTimestamp: new Date().toISOString(),
        followUpDone: true
    });
}