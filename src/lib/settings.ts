import { db, SettingsWithId } from './database';

const __SETTINGS_ID__ = 1;

const __SETTINGS_DEFAULT__: Settings = {
  reminderDelayMinutes:          0.1667,
  pollingIntervalMs:             10000,
  insulinSensitivityFactor:      50,
  targetRangeMin:                100,
  targetRangeMax:                180,
};

export async function getSettings(): Promise<Settings> {
    const settings = await db.settings.get(__SETTINGS_ID__);
    if (!settings) {
        const defaultSettings: SettingsWithId = { 
            id: __SETTINGS_ID__,
            ...__SETTINGS_DEFAULT__ 
        };
        await db.settings.add(defaultSettings);
        return __SETTINGS_DEFAULT__;
    }
    const { id, ...settingsWithoutId } = settings;
    return settingsWithoutId;
}

export async function saveSettings(settings: Settings): Promise<void> {
    await db.settings.put({ ...settings, id: __SETTINGS_ID__ });
}