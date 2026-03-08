import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import AddLog from '@/components/AddLog';
import MealList from '@/components/MealList';
import Settings from '@/components/Settings';
import Navigation, { type AppView } from '@/components/Navigation';

const Index = () => {
  const [view, setView] = useState<AppView>('Dashboard');

  return (
    <div className="min-h-[100dvh] bg-background">
      {view === 'Dashboard' && (
        <Dashboard key="dashboard" onAddEntry={() => setView('AddLog')} />
      )}
      {view === 'AddLog' && (
        <AddLog onBack={() => setView('Dashboard')} />
      )}
      {view === 'MealList' && (
        <MealList onBack={() => setView('Dashboard')} />
      )}
      {view === 'Settings' && (
        <Settings onBack={() => setView('Dashboard')} />
      )}
      <Navigation current={view} onNavigate={setView} />
    </div>
  );
};

export default Index;
