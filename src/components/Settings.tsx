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
  const [newRangeLabel, setNewRangeLabel] = useState<string>('');
  const [newRangeStart, setNewRangeStart] = useState<string>('00:00');
  const [newRangeEnd, setNewRangeEnd] = useState<string>('06:00');
  const [newRangeIsf, setNewRangeIsf] = useState<number>(50);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newModifierLabel, setNewModifierLabel] = useState<string>('');
  const [newModifierIsf, setNewModifierIsf] = useState<number>(50);
  const [showAddModifier, setShowAddModifier] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settingsData = await getSettings();
      setSettings({
        ...settingsData,
        insulinSensitivitySchedule: settingsData.insulinSensitivitySchedule || {},
        insulinSensitivityModifiers: settingsData.insulinSensitivityModifiers || {}
      });
      setNewRangeIsf(settingsData.insulinSensitivityFactor);
      setNewModifierIsf(settingsData.insulinSensitivityFactor);
      // Reset form state when settings are loaded
      setNewRangeLabel('');
      setNewRangeStart('00:00');
      setNewRangeEnd('06:00');
      setShowAddForm(false);
      setNewModifierLabel('');
      setShowAddModifier(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    // Validate time ranges if schedule is set
    if (settings.insulinSensitivitySchedule && Object.keys(settings.insulinSensitivitySchedule).length > 0) {
      const ranges = Object.values(settings.insulinSensitivitySchedule) as Array<{ startTime: string; endTime: string; isf: number }>;
      
      // Check for overlaps only
      const sortedRanges = ranges.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Check for overlaps
      for (let i = 0; i < sortedRanges.length - 1; i++) {
        if (sortedRanges[i].endTime > sortedRanges[i + 1].startTime) {
          toast.error('Time ranges cannot overlap');
          return;
        }
      }
    }

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
          <p className="text-xs mt-1">
            Postprandial range should be inclusive of a buffer sufficient to sustain metabolism until the next meal.
          </p>
          <div className="flex gap-2 mt-1.5">
            <div className="flex-1">
              <Label htmlFor="target-min" className="text-xs">Min</Label>
              <Input
                id="target-min"
                type="number"
                value={settings.targetRangeMin}
                onChange={e => setSettings({ ...settings, targetRangeMin: parseInt(e.target.value) || 130 })}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="target-max" className="text-xs">Max</Label>
              <Input
                id="target-max"
                type="number"
                value={settings.targetRangeMax}
                onChange={e => setSettings({ ...settings, targetRangeMax: parseInt(e.target.value) || 160 })}
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Default: 130-160 mg/dL.
          </p>
        </div>

        <div>
          <Label htmlFor="isf">Insulin Sensitivity Factor (mg/dL per unit)</Label>
          <p className="text-xs mt-1">
            How much your blood glucose drops for each unit of insulin.
          </p>
          <Input
            id="isf"
            type="number"
            value={settings.insulinSensitivityFactor}
            onChange={e => setSettings({ ...settings, insulinSensitivityFactor: parseFloat(e.target.value) || 50 })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: 50 mg/dL per unit.
          </p>
        </div>

        <div>
          <Label>Insulin Sensitivity Schedule (optional)</Label>
          <p className="text-xs mt-1 mb-3">
            In some individuals, ISF varies dependent on circadian rhythm in a predictable way.
          </p>
          
          <div className="space-y-3">
            {Object.entries(settings.insulinSensitivitySchedule || {}).map(([key, schedule]: [string, any]) => (
              <div key={key} className="p-3 border rounded-lg space-y-3">
                <Input
                  id={`label-${key}`}
                  type="text"
                  value={schedule.label || ''}
                  onChange={e => {
                    const newSchedule = { ...settings.insulinSensitivitySchedule };
                    newSchedule[key] = { ...schedule, label: e.target.value };
                    setSettings({ ...settings, insulinSensitivitySchedule: newSchedule });
                  }}
                  placeholder="e.g., Morning Exercise"
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`start-${key}`} className="text-xs">Start Time</Label>
                    <Input
                      id={`start-${key}`}
                      type="time"
                      value={schedule.startTime}
                      onChange={e => {
                        const newSchedule = { ...settings.insulinSensitivitySchedule };
                        newSchedule[key] = { ...schedule, startTime: e.target.value };
                        setSettings({ ...settings, insulinSensitivitySchedule: newSchedule });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`end-${key}`} className="text-xs">End Time</Label>
                    <Input
                      id={`end-${key}`}
                      type="time"
                      value={schedule.endTime}
                      onChange={e => {
                        const newSchedule = { ...settings.insulinSensitivitySchedule };
                        newSchedule[key] = { ...schedule, endTime: e.target.value };
                        setSettings({ ...settings, insulinSensitivitySchedule: newSchedule });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`isf-${key}`} className="text-xs">ISF</Label>
                    <Input
                      id={`isf-${key}`}
                      type="number"
                      value={schedule.isf}
                      onChange={e => {
                        const newSchedule = { ...settings.insulinSensitivitySchedule };
                        newSchedule[key] = { ...schedule, isf: parseFloat(e.target.value) || 50 };
                        setSettings({ ...settings, insulinSensitivitySchedule: newSchedule });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newSchedule = { ...settings.insulinSensitivitySchedule };
                      delete newSchedule[key];
                      setSettings({ ...settings, insulinSensitivitySchedule: newSchedule });
                    }}
                    className="mb-1"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Add new time range */}
            <div className="space-y-2 mt-4">
              {!showAddForm ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(true)}
                  className="w-full"
                >
                  Add Time Range
                </Button>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 space-y-3">
                  <Input
                    id="new-label"
                    type="text"
                    value={newRangeLabel}
                    onChange={e => setNewRangeLabel(e.target.value)}
                    placeholder="e.g., Morning Exercise"
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="new-start" className="text-xs">Start Time</Label>
                      <Input
                        id="new-start"
                        type="time"
                        value={newRangeStart}
                        onChange={e => setNewRangeStart(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="new-end" className="text-xs">End Time</Label>
                      <Input
                        id="new-end"
                        type="time"
                        value={newRangeEnd}
                        onChange={e => setNewRangeEnd(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="new-isf" className="text-xs">ISF</Label>
                      <Input
                        id="new-isf"
                        type="number"
                        value={newRangeIsf}
                        onChange={e => setNewRangeIsf(parseFloat(e.target.value) || 50)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        if (!newRangeLabel.trim()) {
                          toast.error('Please enter a label for the time range');
                          return;
                        }
                        const newKey = `schedule-${Date.now()}`;
                        const newSchedule = { 
                          ...settings.insulinSensitivitySchedule,
                          [newKey]: { 
                            startTime: newRangeStart, 
                            endTime: newRangeEnd, 
                            isf: newRangeIsf,
                            label: newRangeLabel.trim()
                          }
                        };
                        setSettings({ ...settings, insulinSensitivitySchedule: newSchedule });
                        setNewRangeLabel('');
                        setNewRangeStart('00:00');
                        setNewRangeEnd('06:00');
                        setNewRangeIsf(settings.insulinSensitivityFactor);
                        setShowAddForm(false);
                      }}
                      disabled={!newRangeLabel.trim()}
                      className="flex-1"
                    >
                      Add Range
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewRangeLabel('');
                        setNewRangeStart('00:00');
                        setNewRangeEnd('06:00');
                        setNewRangeIsf(settings.insulinSensitivityFactor);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label>Insulin Sensitivity Modifiers (optional)</Label>
          <p className="text-xs mt-1 mb-3">
            Certain unpredictable conditions, such as sickness, or upcoming unforeseen intense physical or mental activity may also cause variations in ISF.
          </p>
          
          <div className="space-y-3">
            {Object.entries(settings.insulinSensitivityModifiers || {}).map(([key, modifier]: [string, any]) => (
              <div key={key} className="p-3 border rounded-lg space-y-3">
                <Input
                  id={`modifier-label-${key}`}
                  type="text"
                  value={modifier.label}
                  onChange={e => {
                    const newModifiers = { ...settings.insulinSensitivityModifiers };
                    newModifiers[key] = { ...modifier, label: e.target.value };
                    setSettings({ ...settings, insulinSensitivityModifiers: newModifiers });
                  }}
                  placeholder="e.g., Illness, Intense Exercise"
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`modifier-isf-${key}`} className="text-xs">ISF</Label>
                    <Input
                      id={`modifier-isf-${key}`}
                      type="number"
                      value={modifier.isf}
                      onChange={e => {
                        const newModifiers = { ...settings.insulinSensitivityModifiers };
                        newModifiers[key] = { ...modifier, isf: parseFloat(e.target.value) || 50 };
                        setSettings({ ...settings, insulinSensitivityModifiers: newModifiers });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newModifiers = { ...settings.insulinSensitivityModifiers };
                      delete newModifiers[key];
                      setSettings({ ...settings, insulinSensitivityModifiers: newModifiers });
                    }}
                    className="mb-1"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Add new modifier */}
            <div className="space-y-2 mt-4">
              {!showAddModifier ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddModifier(true)}
                  className="w-full"
                >
                  Add Modifier
                </Button>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 space-y-3">
                  <Input
                    id="new-modifier-label"
                    type="text"
                    value={newModifierLabel}
                    onChange={e => setNewModifierLabel(e.target.value)}
                    placeholder="e.g., Illness, Intense Exercise"
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="new-modifier-isf" className="text-xs">ISF</Label>
                      <Input
                        id="new-modifier-isf"
                        type="number"
                        value={newModifierIsf}
                        onChange={e => setNewModifierIsf(parseFloat(e.target.value) || 50)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        if (!newModifierLabel.trim()) {
                          toast.error('Please enter a label for the modifier');
                          return;
                        }
                        const newKey = `modifier-${Date.now()}`;
                        const newModifiers = { 
                          ...settings.insulinSensitivityModifiers,
                          [newKey]: { 
                            label: newModifierLabel.trim(),
                            isf: newModifierIsf
                          }
                        };
                        setSettings({ ...settings, insulinSensitivityModifiers: newModifiers });
                        setNewModifierLabel('');
                        setNewModifierIsf(settings.insulinSensitivityFactor);
                        setShowAddModifier(false);
                      }}
                      disabled={!newModifierLabel.trim()}
                      className="flex-1"
                    >
                      Add Modifier
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowAddModifier(false);
                        setNewModifierLabel('');
                        setNewModifierIsf(settings.insulinSensitivityFactor);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="delay">Follow-up Reminder Delay (minutes)</Label>
          <p className="text-xs mt-1">
            In general postprandial glucose should be in range two hours after eating.
          </p>
          <Input
            id="delay"
            type="number"
            value={settings.reminderDelayMinutes}
            onChange={e => setSettings({ ...settings, reminderDelayMinutes: parseInt(e.target.value) || 120 })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: 120 minutes (2 hours).
          </p>
        </div>

        <div>
          <Label htmlFor="polling">UI Update Interval (seconds)</Label>
          <p className="text-xs mt-1">
            How often the app checks for due follow-up reminders to update the UI.
          </p>
          <Input
            id="polling"
            type="number"
            value={settings.pollingIntervalMs / 1000}
            onChange={e => setSettings({ ...settings, pollingIntervalMs: (parseInt(e.target.value) || 10) * 1000 })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: 10 seconds.
          </p>
        </div>

        <Button onClick={handleSave}>Save Settings</Button>
      </Card>
    </div>
  );
}
