import { Utensils, List, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AppView = 'dashboard' | 'addEntry' | 'mealList' | 'settings';

interface BottomNavProps {
  current: AppView;
  onNavigate: (view: AppView) => void;
}

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  const items = [
    { view: 'dashboard' as AppView, icon: Utensils, label: 'Log' },
    { view: 'mealList' as AppView, icon: List, label: 'Meals' },
    { view: 'settings' as AppView, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around max-w-lg mx-auto">
        {items.map(item => (
          <Button
            key={item.view}
            variant="ghost"
            onClick={() => onNavigate(item.view)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 h-auto rounded-none ${
              current === item.view ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
