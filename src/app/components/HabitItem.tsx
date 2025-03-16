'use client';

import { useState } from 'react';
// Remove the import for updateHabit since it doesn't exist
// import { updateHabit } from '@/lib/firebase/firebaseUtils';

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
  onUpdate?: (habit: Habit) => void;
}

export default function HabitItem({ habit, onUpdate }: HabitItemProps) {
  const [isCompleted, setIsCompleted] = useState(habit.completed);
  
  // For debugging
  console.log('Habit in HabitItem:', {
    id: habit.id,
    title: habit.title,
    isNonNegotiable: habit.isNonNegotiable,
    completed: habit.completed,
    streak: habit.streak
  });

  const handleToggleComplete = async () => {
    const updatedHabit = { ...habit, completed: !isCompleted };
    setIsCompleted(!isCompleted);
    
    // Call the onUpdate prop instead of directly calling updateHabit
    if (onUpdate) {
      onUpdate(updatedHabit);
    }
    
    // If we need to implement direct Firebase updates later, we can add it here
    // For now, we'll rely on the parent component to handle updates
  };

  return (
    <div className={`flex items-start gap-3 ${isCompleted ? 'opacity-50' : ''}`}>
      <div className="mt-1">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleToggleComplete}
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