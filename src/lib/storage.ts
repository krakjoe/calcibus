import { getSettings } from '@/lib/settings';
import { getLogEntries } from '@/lib/log';

export async function suggestDose(mealId: string, mealType: string, currentGlucose: number): Promise<{ suggestedDose: number | null; confidence: string; basedOn: number }> {
  const [settings, entries] = await Promise.all([
    getSettings(),
    getLogEntries()
  ]);

  const filteredEntries = entries.filter(e =>
    e.mealId === mealId &&
    e.mealType === mealType &&
    e.followUpDone &&
    e.followUpGlucose !== undefined
  );

  if (filteredEntries.length === 0) {
    return { suggestedDose: null, confidence: 'none', basedOn: 0 };
  }

  // Find entries where the follow-up glucose was in range
  const successfulEntries = filteredEntries.filter(e =>
    e.followUpGlucose! >= settings.targetRangeMin && e.followUpGlucose! <= settings.targetRangeMax
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

    // Use Insulin Sensitivity Factor for adjustment (schedule-aware)
    const isf = settings.insulinSensitivitySchedule?.[mealType] ?? settings.insulinSensitivityFactor;
    const glucoseDiff = currentGlucose - avgGlucose;
    const adjustment = glucoseDiff / isf;

    const suggested = Math.max(0, Math.round((avgDose + adjustment) * 2) / 2);

    return {
      suggestedDose: suggested,
      confidence: recent.length >= 3 ? 'high' : 'low',
      basedOn: recent.length,
    };
  }

  // Fall back to average of all entries for this meal/time
  const avgDose = filteredEntries.reduce((sum, e) => sum + e.dose, 0) / filteredEntries.length;
  return {
    suggestedDose: Math.round(avgDose * 2) / 2,
    confidence: 'low',
    basedOn: filteredEntries.length,
  };
}
