// Local storage utilities for diabetes management app

export interface Meal {
  id: string;
  name: string;
  defaultCarbs?: number;
}

export interface MealEntry {
  id: string;
  mealId: string;
  mealName: string;
  glucoseLevel: number;
  dose: number;
  timeOfDay: 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  followUpGlucose?: number;
  followUpTimestamp?: string;
  followUpDone: boolean;
}

export interface AppSettings {
  reminderDelayMinutes: number;
}

const MEALS_KEY = 'diabetes_meals';
const ENTRIES_KEY = 'diabetes_entries';
const SETTINGS_KEY = 'diabetes_settings';

const defaultMeals: Meal[] = [
  { id: '1', name: 'Oatmeal', defaultCarbs: 30 },
  { id: '2', name: 'Eggs & Toast', defaultCarbs: 25 },
  { id: '3', name: 'Chicken & Rice', defaultCarbs: 45 },
  { id: '4', name: 'Pasta', defaultCarbs: 60 },
  { id: '5', name: 'Salad', defaultCarbs: 15 },
  { id: '6', name: 'Sandwich', defaultCarbs: 35 },
  { id: '7', name: 'Soup', defaultCarbs: 20 },
  { id: '8', name: 'Steak & Vegetables', defaultCarbs: 20 },
  { id: '9', name: 'Fruit & Yogurt', defaultCarbs: 30 },
  { id: '10', name: 'Pizza', defaultCarbs: 50 },
];

const defaultSettings: AppSettings = {
  reminderDelayMinutes: 120,
};

export function getMeals(): Meal[] {
  const stored = localStorage.getItem(MEALS_KEY);
  if (!stored) {
    localStorage.setItem(MEALS_KEY, JSON.stringify(defaultMeals));
    return defaultMeals;
  }
  return JSON.parse(stored);
}

export function saveMeals(meals: Meal[]): void {
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export function addMeal(name: string, defaultCarbs?: number): Meal {
  const meals = getMeals();
  const meal: Meal = { id: crypto.randomUUID(), name, defaultCarbs };
  meals.push(meal);
  saveMeals(meals);
  return meal;
}

export function removeMeal(id: string): void {
  const meals = getMeals().filter(m => m.id !== id);
  saveMeals(meals);
}

export function getEntries(): MealEntry[] {
  const stored = localStorage.getItem(ENTRIES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveEntries(entries: MealEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function addEntry(entry: Omit<MealEntry, 'id' | 'followUpDone'>): MealEntry {
  const entries = getEntries();
  const newEntry: MealEntry = { ...entry, id: crypto.randomUUID(), followUpDone: false };
  entries.unshift(newEntry);
  saveEntries(entries);
  return newEntry;
}

export function updateEntryFollowUp(entryId: string, followUpGlucose: number): void {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === entryId);
  if (idx >= 0) {
    entries[idx].followUpGlucose = followUpGlucose;
    entries[idx].followUpTimestamp = new Date().toISOString();
    entries[idx].followUpDone = true;
    saveEntries(entries);
  }
}

export function getSettings(): AppSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Pattern-based dose suggestion
export function suggestDose(mealId: string, timeOfDay: string, currentGlucose: number): { suggestedDose: number | null; confidence: string; basedOn: number } {
  const entries = getEntries().filter(e =>
    e.mealId === mealId &&
    e.timeOfDay === timeOfDay &&
    e.followUpDone &&
    e.followUpGlucose !== undefined
  );

  if (entries.length === 0) {
    return { suggestedDose: null, confidence: 'none', basedOn: 0 };
  }

  // Find entries where the follow-up glucose was in a good range (70-180)
  const successfulEntries = entries.filter(e =>
    e.followUpGlucose! >= 70 && e.followUpGlucose! <= 180
  );

  if (successfulEntries.length > 0) {
    // Weight more recent entries higher
    const sorted = successfulEntries.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const recent = sorted.slice(0, 5);

    // Adjust dose based on glucose difference from past entries
    const avgDose = recent.reduce((sum, e) => sum + e.dose, 0) / recent.length;
    const avgGlucose = recent.reduce((sum, e) => sum + e.glucoseLevel, 0) / recent.length;

    // Simple adjustment: ~1 unit per 50 mg/dL difference
    const glucoseDiff = currentGlucose - avgGlucose;
    const adjustment = Math.round((glucoseDiff / 50) * 10) / 10;

    const suggested = Math.max(0, Math.round((avgDose + adjustment) * 2) / 2);

    return {
      suggestedDose: suggested,
      confidence: recent.length >= 3 ? 'high' : 'low',
      basedOn: recent.length,
    };
  }

  // Fall back to average of all entries for this meal/time
  const avgDose = entries.reduce((sum, e) => sum + e.dose, 0) / entries.length;
  return {
    suggestedDose: Math.round(avgDose * 2) / 2,
    confidence: 'low',
    basedOn: entries.length,
  };
}
