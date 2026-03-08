import { db } from './database';

export interface Meal {
    id:            string;
    name:          string;
    defaultCarbs?: number;
}



const __MEALS_DEFAULT__: Meal[] = [
    { id: '1', name: 'Oatmeal',            defaultCarbs: 30 },
    { id: '2', name: 'Eggs & Toast',       defaultCarbs: 25 },
    { id: '3', name: 'Chicken & Rice',     defaultCarbs: 45 },
    { id: '4', name: 'Pasta',              defaultCarbs: 60 },
    { id: '5', name: 'Salad',              defaultCarbs: 15 },
    { id: '6', name: 'Sandwich',           defaultCarbs: 35 },
    { id: '7', name: 'Soup',               defaultCarbs: 20 },
    { id: '8', name: 'Steak & Vegetables', defaultCarbs: 20 },
    { id: '9', name: 'Fruit & Yogurt',     defaultCarbs: 30 },
    { id: '10', name: 'Pizza',             defaultCarbs: 50 },
];

export async function getMeals(): Promise<Meal[]> {
    const meals = await db.meals.toArray();
    if (meals.length === 0) {
        await db.meals.bulkAdd(__MEALS_DEFAULT__);
        return __MEALS_DEFAULT__;
    }
    return meals;
}

export async function saveMeals(meals: Meal[]): Promise<void> {
    await db.meals.clear();
    await db.meals.bulkAdd(meals);
}

export async function addMeal(name: string, defaultCarbs?: number): Promise<Meal> {
    const meal: Meal = {
        id: crypto.randomUUID(),
        name,
        defaultCarbs
    };
    await db.meals.add(meal);
    return meal;
}

export async function removeMeal(id: string): Promise<void> {
    await db.meals.delete(id);
}

