import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addLogEntry } from '@/lib/log';
import { suggest } from '@/lib/dose';
import { getSettings } from '@/lib/settings';
import { getMeals } from '@/lib/meals';
import { scheduleFollowUpReminder } from '@/lib/notifications';
import { toast } from 'sonner';

interface AddLogProps {
  onBack: () => void;
}

const timeSlots = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'brunch', label: '🥂 Brunch' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍎 Snack' },
] as const;

export default function AddLog({ onBack }: AddLogProps) {
  const [meals, setMeals] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [mealType, setMealType] = useState<string>('');
  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [dose, setDose] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState('');
  const [suggestion, setSuggestion] = useState<{ suggestedDose: number | null; confidence: string; basedOn: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mealsData, settingsData] = await Promise.all([
          getMeals(),
          getSettings()
        ]);
        setMeals(mealsData);
        setSettings(settingsData);
        setReminderMinutes(settingsData.reminderDelayMinutes.toString());
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedMeal = meals.find(m => m.id === selectedMealId);

  const handleGetSuggestion = async () => {
    if (!selectedMealId || !mealType || !glucoseLevel) return;
    const result = await suggest(selectedMealId, mealType, parseFloat(glucoseLevel));
    setSuggestion(result);
    if (result.suggestedDose !== null) {
      setDose(result.suggestedDose.toString());
    }
  };

  const handleSubmit = async () => {
    if (!selectedMealId || !mealType || !glucoseLevel || !dose) {
      toast.error('Please fill in all fields');
      return;
    }

    const entry = await addLogEntry({
      mealId: selectedMealId,
      mealName: selectedMeal?.name || '',
      glucoseLevel: parseFloat(glucoseLevel),
      dose: parseFloat(dose),
      mealType: mealType as 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack',
      timestamp: new Date().toISOString(),
    });

    const delay = parseInt(reminderMinutes) || settings.reminderDelayMinutes;
    await scheduleFollowUpReminder(entry.id, delay);
    
    toast.success(`Logged! Reminder set for ${delay} min`);
    onBack();
  };

  // Auto-suggest when all fields are filled
  const canSuggest = selectedMealId && mealType && glucoseLevel;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] max-w-lg mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <Select value={mealType} onValueChange={setMealType}>
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
