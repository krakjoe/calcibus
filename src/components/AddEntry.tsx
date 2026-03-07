import { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMeals, addEntry, suggestDose, getSettings } from '@/lib/storage';
import { scheduleFollowUpReminder } from '@/lib/notifications';
import { toast } from 'sonner';

interface AddEntryProps {
  onBack: () => void;
}

const timeSlots = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'brunch', label: '🥂 Brunch' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍎 Snack' },
] as const;

export default function AddEntry({ onBack }: AddEntryProps) {
  const meals = getMeals();
  const settings = getSettings();
  const [selectedMealId, setSelectedMealId] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [dose, setDose] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(settings.reminderDelayMinutes.toString());
  const [suggestion, setSuggestion] = useState<{ suggestedDose: number | null; confidence: string; basedOn: number } | null>(null);

  const selectedMeal = meals.find(m => m.id === selectedMealId);

  const handleGetSuggestion = () => {
    if (!selectedMealId || !timeOfDay || !glucoseLevel) return;
    const result = suggestDose(selectedMealId, timeOfDay, parseFloat(glucoseLevel));
    setSuggestion(result);
    if (result.suggestedDose !== null) {
      setDose(result.suggestedDose.toString());
    }
  };

  const handleSubmit = async () => {
    if (!selectedMealId || !timeOfDay || !glucoseLevel || !dose) {
      toast.error('Please fill in all fields');
      return;
    }

    const entry = addEntry({
      mealId: selectedMealId,
      mealName: selectedMeal?.name || '',
      glucoseLevel: parseFloat(glucoseLevel),
      dose: parseFloat(dose),
      timeOfDay: timeOfDay as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      timestamp: new Date().toISOString(),
    });

    const delay = parseInt(reminderMinutes) || settings.reminderDelayMinutes;
    await scheduleFollowUpReminder(entry.id, delay);
    
    toast.success(`Logged! Reminder set for ${delay} min`);
    onBack();
  };

  // Auto-suggest when all fields are filled
  const canSuggest = selectedMealId && timeOfDay && glucoseLevel;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Log Meal</h1>
      </div>

      <Card className="p-5 flex flex-col gap-5">
        {/* Time of Day */}
        <div>
          <Label>Time of Day</Label>
          <Select value={timeOfDay} onValueChange={setTimeOfDay}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select meal time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map(slot => (
                <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Meal Selection */}
        <div>
          <Label>Meal</Label>
          <Select value={selectedMealId} onValueChange={setSelectedMealId}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select a meal" />
            </SelectTrigger>
            <SelectContent>
              {meals.map(meal => (
                <SelectItem key={meal.id} value={meal.id}>
                  {meal.name}{meal.defaultCarbs ? ` (${meal.defaultCarbs}g carbs)` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Glucose Level */}
        <div>
          <Label htmlFor="glucose">Blood Glucose (mg/dL)</Label>
          <Input
            id="glucose"
            type="number"
            value={glucoseLevel}
            onChange={e => setGlucoseLevel(e.target.value)}
            placeholder="120"
            className="mt-1.5"
          />
        </div>

        {/* Dose Suggestion */}
        {canSuggest && (
          <Button
            variant="outline"
            onClick={handleGetSuggestion}
            className="border-primary/30 text-primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Get Dose Suggestion
          </Button>
        )}

        {suggestion && (
          <Card className={`p-3 ${
            suggestion.suggestedDose !== null ? 'bg-primary/5 border-primary/20' : 'bg-muted'
          }`}>
            {suggestion.suggestedDose !== null ? (
              <>
                <p className="text-sm font-semibold text-primary">
                  Suggested: {suggestion.suggestedDose} units
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {suggestion.basedOn} past {suggestion.basedOn === 1 ? 'entry' : 'entries'}
                  {' · '}Confidence: {suggestion.confidence}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No past data for this meal/time combo yet. Log a few entries first!
              </p>
            )}
          </Card>
        )}

        {/* Dose Input */}
        <div>
          <Label htmlFor="dose">Insulin Dose (units)</Label>
          <Input
            id="dose"
            type="number"
            step="0.5"
            value={dose}
            onChange={e => setDose(e.target.value)}
            placeholder="0"
            className="mt-1.5"
          />
        </div>

        {/* Reminder Time */}
        <div>
          <Label htmlFor="reminder">Follow-up Reminder (minutes)</Label>
          <Input
            id="reminder"
            type="number"
            value={reminderMinutes}
            onChange={e => setReminderMinutes(e.target.value)}
            placeholder={settings.reminderDelayMinutes.toString()}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: {settings.reminderDelayMinutes} min (change in Settings)
          </p>
        </div>

        <Button onClick={handleSubmit} size="lg" className="mt-2">
          Log Entry
        </Button>
      </Card>
    </div>
  );
}
