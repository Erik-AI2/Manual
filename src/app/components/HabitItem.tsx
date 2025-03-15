'use client';

import { useState } from 'react';
import { updateHabit } from '@/lib/firebase/firebaseUtils';

interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  isNonNegotiable: boolean;
  completed: boolean;
  streak?: number;
}

interface HabitItemProps {
  habit: Habit;
  onComplete?: (habitId: string, completed: boolean) => void;
}

export default function HabitItem({ habit, onComplete }: HabitItemProps) {
  const [isCompleted, setIsCompleted] = useState(habit.completed || false);
  
  // For debugging
  console.log('Habit in HabitItem:', {
    id: habit.id,
    title: habit.title,
    isNonNegotiable: habit.isNonNegotiable,
    completed: habit.completed,
    streak: habit.streak
  });

  const handleComplete = async () => {
    const newCompletedState = !isCompleted;
    setIsCompleted(newCompletedState);
    
    try {
      // Calculate new streak if needed
      const updatedFields: any = { completed: newCompletedState };
      if (newCompletedState && habit.streak !== undefined) {
        updatedFields.streak = (habit.streak || 0) + 1;
      } else if (!newCompletedState && habit.streak !== undefined) {
        updatedFields.streak = Math.max(0, (habit.streak || 0) - 1);
      }
      
      await updateHabit(habit.id, updatedFields);
      if (onComplete) {
        onComplete(habit.id, newCompletedState);
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      // Revert state if update fails
      setIsCompleted(!newCompletedState);
    }
  };

  return (
    <div className={`flex items-start gap-3 ${isCompleted ? 'opacity-50' : ''}`}>
      <div className="mt-1">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleComplete}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className={`text-lg font-medium ${isCompleted ? 'line-through' : ''}`}>
            {habit.title}
          </h4>
          {habit.isNonNegotiable && (
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">
              Non-Negotiable
            </span>
          )}
          {habit.frequency && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
              {habit.frequency}
            </span>
          )}
          {habit.streak !== undefined && habit.streak > 0 && (
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded">
              🔥 {habit.streak}
            </span>
          )}
        </div>
        
        {habit.description && (
          <p className="text-gray-600 mt-1">{habit.description}</p>
        )}
      </div>
    </div>
  );
} 