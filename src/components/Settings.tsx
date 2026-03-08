import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSettings, saveSettings } from '@/lib/settings';
import { toast } from 'sonner';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settingsData = await getSettings();
      setSettings({
        ...settingsData,
        insulinSensitivitySchedule: settingsData.insulinSensitivitySchedule || {}
      });
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    await saveSettings(settings);
    toast.success('Settings saved');
  };

  if (!settings) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <Card className="p-5 flex flex-col gap-5">
        <div>
          <Label>Target Glucose Range (mg/dL)</Label>
          <div className="flex gap-2 mt-1.5">
            <div className="flex-1">
              <Label htmlFor="target-min" className="text-xs">Min</Label>
              <Input
                id="target-min"
                type="number"
                value={settings.targetRangeMin}
                onChange={e => setSettings({ ...settings, targetRangeMin: parseInt(e.target.value) || 70 })}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="target-max" className="text-xs">Max</Label>
              <Input
                id="target-max"
                type="number"
                value={settings.targetRangeMax}
                onChange={e => setSettings({ ...settings, targetRangeMax: parseInt(e.target.value) || 180 })}
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Default: 70-180 mg/dL. The target range for follow-up glucose levels used in dose suggestions.
          </p>
        </div>

        <div>
          <Label htmlFor="isf">Insulin Sensitivity Factor (mg/dL per unit)</Label>
          <Input
            id="isf"
            type="number"
            value={settings.insulinSensitivityFactor}
            onChange={e => setSettings({ ...settings, insulinSensitivityFactor: parseFloat(e.target.value) || 50 })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: 50 mg/dL per unit. How much your blood glucose drops for each unit of insulin. Used for dose suggestions when no schedule is set.
          </p>
        </div>

        <div>
          <Label>Insulin Sensitivity Schedule (optional)</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Set different ISF values for specific times of day. If not set, the static value above is used.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'breakfast', label: 'Breakfast' },
              { key: 'brunch', label: 'Brunch' },
              { key: 'lunch', label: 'Lunch' },
              { key: 'dinner', label: 'Dinner' },
              { key: 'snack', label: 'Snack' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label htmlFor={`isf-${key}`} className="text-xs">{label}</Label>
                <Input
                  id={`isf-${key}`}
                  type="number"
                  value={settings.insulinSensitivitySchedule?.[key] ?? ''}
                  onChange={e => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setSettings({
                      ...settings,
                      insulinSensitivitySchedule: {
                        ...settings.insulinSensitivitySchedule,
                        [key]: value
                      }
                    });
                  }}
                  placeholder={`${settings.insulinSensitivityFactor}`}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="delay">Follow-up Reminder Delay (minutes)</Label>
          <Input
            id="delay"
            type="number"
            value={settings.reminderDelayMinutes}
            onChange={e => setSettings({ ...settings, reminderDelayMinutes: parseInt(e.target.value) || 120 })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: 120 minutes (2 hours). Set how long after a meal entry you want to be reminded to check your glucose.
          </p>
        </div>

        <div>
          <Label htmlFor="polling">UI Update Interval (seconds)</Label>
          <Input
            id="polling"
            type="number"
            value={settings.pollingIntervalMs / 1000}
            onChange={e => setSettings({ ...settings, pollingIntervalMs: (parseInt(e.target.value) || 10) * 1000 })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: 10 seconds. How often the app checks for due follow-up reminders to update the UI.
          </p>
        </div>

        <Button onClick={handleSave}>Save Settings</Button>
      </Card>
    </div>
  );
}
