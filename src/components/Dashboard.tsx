import { useState, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Plus, Utensils, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getLogEntries, clearLogEntries, saveLogEntries, type LogEntry } from '@/lib/log';
import { getSettings } from '@/lib/settings';
import { getPendingReminders } from '@/lib/notifications';
import UpdateLog from '@/components/UpdateLog';

function getGlucoseColor(glucose: number): string {
  if (glucose < 70) return 'text-glucose-low';
  if (glucose <= 180) return 'text-glucose-normal';
  if (glucose <= 250) return 'text-glucose-high';
  return 'text-glucose-critical';
}

function formatEntryDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

const mealTypeLabels: Record<string, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
};

interface DashboardProps {
  onAddEntry: () => void;
}

export default function Dashboard({ onAddEntry }: DashboardProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const refreshData = async () => {
    setEntries(
      await getLogEntries());
    setPendingReminders(
      getPendingReminders());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingReminders(
        getPendingReminders());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEntrySelect = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleClearLog = async () => {
    if (selectedEntries.size > 0) {
      const remainingEntries = entries.filter(
        entry => !selectedEntries.has(entry.id));
      await saveLogEntries(remainingEntries);
      setSelectedEntries(new Set());
    } else {
      await clearLogEntries();
    }
    setPendingReminders([]);
    await refreshData();
  };

  const pendingEntries = entries.filter(e => {
    const hasReminder = pendingReminders
      .some(r => r.entryId === e.id);
    return !e.followUpDone && hasReminder;
  });
  const todayEntries = entries.filter(e => isToday(new Date(e.timestamp)));
  const avgGlucose = todayEntries.length > 0
    ? Math.round(todayEntries.reduce((s, e) => s + e.glucoseLevel, 0) / todayEntries.length)
    : null;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calcibus</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant={selectedEntries.size > 0 ? "destructive" : "outline"} 
                size="lg" 
                className={`rounded-full h-12 w-12 p-0 ${selectedEntries.size > 0 ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {selectedEntries.size > 0 ? 'Delete Selected Entries' : 'Clear All Entries'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedEntries.size > 0
                    ? `This will permanently delete ${selectedEntries.size} selected meal entr${selectedEntries.size === 1 ? 'y' : 'ies'} and their follow-up reminders. This action cannot be undone.`
                    : 'This will permanently delete all meal entries and follow-up reminders. This action cannot be undone.'
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearLog} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {selectedEntries.size > 0 ? 'Delete Selected' : 'Clear All'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={onAddEntry} size="lg" className="rounded-full h-12 w-12 p-0">
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {pendingEntries.map(entry => (
        <UpdateLog key={entry.id} entry={entry} onUpdate={refreshData} />
      ))}

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <Utensils className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{todayEntries.length}</p>
          <p className="text-xs text-muted-foreground">Meals</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className={`text-2xl font-bold ${avgGlucose ? getGlucoseColor(avgGlucose) : ''}`}>
            {avgGlucose ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">Avg BG</p>
        </Card>
        <Card className="p-3 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">
            {todayEntries.filter(e => e.followUpDone).length}/{todayEntries.length}
          </p>
          <p className="text-xs text-muted-foreground">Follow-ups</p>
        </Card>
      </div>

      {/* Recent entries */}
      <h2 className="text-lg font-semibold mt-2">Recent Entries</h2>
      {entries.length === 0 ? (
        <Card className="p-8 text-center">
          <Utensils className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No entries yet</p>
          <p className="text-sm text-muted-foreground mt-1">Tap + to log your first meal</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.slice(0, 20).map(entry => (
            <Card 
              key={entry.id} 
              className={`p-4 cursor-pointer transition-colors ${
                selectedEntries.has(entry.id) 
                  ? 'border-destructive bg-destructive/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleEntrySelect(entry.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{entry.mealName}</p>
                  <p className="text-sm text-muted-foreground">
                    {mealTypeLabels[entry.mealType]} · {formatEntryDate(entry.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getGlucoseColor(entry.glucoseLevel)}`}>
                    {entry.glucoseLevel}
                  </p>
                  <p className="text-xs text-muted-foreground">mg/dL</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="bg-secondary px-2 py-0.5 rounded-md">
                  Dose: {entry.dose}u
                </span>
                {entry.followUpDone && entry.followUpGlucose !== undefined && (
                  <span className={`px-2 py-0.5 rounded-md ${
                    entry.followUpGlucose >= 70 && entry.followUpGlucose <= 180
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    Follow-up: {entry.followUpGlucose} mg/dL
                  </span>
                )}
                {!entry.followUpDone && (
                  <span className="text-muted-foreground italic">Pending follow-up</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
