import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import AddEntry from '@/components/AddEntry';
import MealList from '@/components/MealList';
import SettingsPage from '@/components/SettingsPage';
import BottomNav, { type AppView } from '@/components/BottomNav';

const Index = () => {
  const [view, setView] = useState<AppView>('dashboard');

  return (
    <div className="min-h-screen bg-background">
      {view === 'dashboard' && (
        <Dashboard onAddEntry={() => setView('addEntry')} />
      )}
      {view === 'addEntry' && (
        <AddEntry onBack={() => setView('dashboard')} />
      )}
      {view === 'mealList' && (
        <MealList onBack={() => setView('dashboard')} />
      )}
      {view === 'settings' && (
        <SettingsPage onBack={() => setView('dashboard')} />
      )}
      <BottomNav current={view} onNavigate={setView} />
    </div>
  );
};

export default Index;
