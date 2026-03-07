import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSettings, saveSettings } from '@/lib/storage';
import { toast } from 'sonner';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [settings, setSettings] = useState(getSettings);

  const handleSave = () => {
    saveSettings(settings);
    toast.success('Settings saved');
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <Card className="p-5 flex flex-col gap-5">
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

        <Button onClick={handleSave}>Save Settings</Button>
      </Card>
    </div>
  );
}
