import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getMeals, addMeal, removeMeal, type Meal } from '@/lib/storage';

interface MealListProps {
  onBack: () => void;
}

export default function MealList({ onBack }: MealListProps) {
  const [meals, setMeals] = useState<Meal[]>(getMeals);
  const [newName, setNewName] = useState('');
  const [newCarbs, setNewCarbs] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    const meal = addMeal(newName.trim(), newCarbs ? parseInt(newCarbs) : undefined);
    setMeals(prev => [...prev, meal]);
    setNewName('');
    setNewCarbs('');
  };

  const handleRemove = (id: string) => {
    removeMeal(id);
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Manage Meals</h1>
      </div>

      {/* Add new meal */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Meal name"
            className="flex-1"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Input
            value={newCarbs}
            onChange={e => setNewCarbs(e.target.value)}
            placeholder="Carbs (g)"
            type="number"
            className="w-24"
          />
          <Button onClick={handleAdd} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Meal list */}
      <div className="flex flex-col gap-2">
        {meals.map(meal => (
          <Card key={meal.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{meal.name}</p>
              {meal.defaultCarbs && (
                <p className="text-xs text-muted-foreground">{meal.defaultCarbs}g carbs</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(meal.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
