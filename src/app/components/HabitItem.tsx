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
    <div className="p-4 border rounded-lg mb-2 flex items-center justify-between">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleToggleComplete}
          className="mr-3 h-5 w-5"
        />
        <div>
          <h3 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
            {habit.title}
          </h3>
          {habit.description && (
            <p className="text-sm text-gray-600">{habit.description}</p>
          )}
        </div>
      </div>
      {habit.isNonNegotiable && (
        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
          Non-negotiable
        </span>
      )}
    </div>
  );
} 