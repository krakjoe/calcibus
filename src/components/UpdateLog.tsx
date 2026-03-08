import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateLogEntry, type LogEntry } from '@/lib/log';
import { clearReminder } from '@/lib/notifications';
import { AlertTriangle } from 'lucide-react';

interface UpdateLogProps {
  entry: LogEntry;
  onUpdate?: () => void;
}

export default function UpdateLog({ entry, onUpdate }: UpdateLogProps) {
  const [glucose, setGlucose] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    const value = parseFloat(glucose);
    if (isNaN(value) || value <= 0)
      return;
    await updateLogEntry(entry.id, value);
    clearReminder(entry.id);
    setDone(true);
    onUpdate?.();
  };

  if (done) {
    return (
      <Card className="p-4 bg-success/10 border-success/30">
        <p className="text-sm font-medium text-success">✓ Follow-up logged for {entry.mealName}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-accent/50 bg-accent/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Follow-up due: {entry.mealName}</p>
          <p className="text-xs text-muted-foreground mb-3">
            Dosed {entry.dose}u at BG {entry.glucoseLevel} mg/dL
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor={`followup-${entry.id}`} className="text-xs">Current BG (mg/dL)</Label>
              <Input
                id={`followup-${entry.id}`}
                type="number"
                value={glucose}
                onChange={e => setGlucose(e.target.value)}
                placeholder="120"
                className="mt-1"
              />
            </div>
            <Button onClick={handleSubmit} size="sm">Log</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
