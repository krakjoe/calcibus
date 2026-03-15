import { getSettings, Settings } from '@/lib/settings';
import { getLogEntries } from '@/lib/log';

export interface InsulinSensitivityFactor {
    type:      'baseline' | 'modifier' | 'schedule',
    label:      string,
    isf:        number
};

export function getInsulinSensitivityFactor(settings: Settings, activeModifier?: string, timestamp?: string): InsulinSensitivityFactor {
    if (activeModifier && settings.insulinSensitivityModifiers) {
        const modifier = settings.insulinSensitivityModifiers[activeModifier];
        if (modifier) {
            return {
                type:   'modifier',
                label:  modifier.label,
                isf:    modifier.isf
            };
        }
    }

    if (!settings.insulinSensitivitySchedule) {
        return {
            type: 'baseline',
            label: 'Baseline',
            isf: settings.insulinSensitivityFactor 
        };
    }

    const now = new Date(timestamp);
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    for (const [key, schedule] of Object.entries(settings.insulinSensitivitySchedule) as [string, any][]) {
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (currentTime >= startMinutes && currentTime < endMinutes) {
            return { 
                type: 'schedule',
                isf: schedule.isf,
                label: schedule.label 
            };
        }
    }

    return { 
        type: 'baseline',
        label: 'Baseline',
        isf: settings.insulinSensitivityFactor 
    };
}

export interface SuggestedDose {
    suggestedDose:  number | null;
    confidence:     'none' | 'high' | 'low';
    basedOn:        number 
};

const noSuggestedDose : SuggestedDose = {
    suggestedDose: null,
    confidence: 'none',
    basedOn: 0
};

export async function getSuggestedDose(mealId: string, currentGlucose: number, activeModifier?: string): Promise<SuggestedDose> {
    const [settings, entries] = await Promise.all([
        getSettings(),
        getLogEntries()
    ]);

    const currentInsulinSensitivityFactor =
        getInsulinSensitivityFactor(
            settings,
            activeModifier);
    console.log(currentInsulinSensitivityFactor);
    const filteredEntries = entries.filter(entry => 
    {
        let previousInsulinSensitivityFactor =
            getInsulinSensitivityFactor(
                settings,
                entry.activeModifier,
                entry.timestamp);
        console.log(entry, previousInsulinSensitivityFactor);
        if ((currentInsulinSensitivityFactor.type == previousInsulinSensitivityFactor.type) &&
            (currentInsulinSensitivityFactor.label == previousInsulinSensitivityFactor.label)) {
            return entry.followUpDone &&
                    entry.followUpGlucose >= settings.targetRangeMin &&
                    entry.followUpGlucode <= settings.targetRangeMax;
        }
        return false;
    });

    if (filteredEntries.length === 0) {
        return noSuggestedDose;
    }

    const sorted = filteredEntries.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const recent = sorted.slice(0, 5);

    const avgDose = recent.reduce((sum, e) => sum + e.dose, 0) / recent.length;
    const avgGlucose = recent.reduce((sum, e) => sum + e.glucoseLevel, 0) / recent.length;

    const glucoseDiff = currentGlucose - avgGlucose;
    const adjustment = glucoseDiff / currentInsulinSensitivityFactor.isf;

    const targetGlucose =
        (settings.targetRangeMin + settings.targetRangeMax) / 2;
    const baseAdjustment =
        (currentGlucose - targetGlucose) /
            currentInsulinSensitivityFactor.isf;

    const suggested = Math.max(0,
        Math.round((avgDose + adjustment + baseAdjustment) * 2) / 2);

    return {
        suggestedDose:  suggested,
        confidence:     recent.length >= 3 ? 'high' : 'low',
        basedOn:        recent.length,
    };
}
