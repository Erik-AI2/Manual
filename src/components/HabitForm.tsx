'use client';

import { useState } from 'react';
import { addDocument } from '@/lib/firebase/firebaseUtils';
import { Habit } from '@/lib/types/task';
import { PlusCircle, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';

interface HabitFormProps {
  onHabitAdded?: () => void;
}

export default function HabitForm({ onHabitAdded }: HabitFormProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [habit, setHabit] = useState<Partial<Habit>>({
    name: '',
    frequency: {
      type: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Default to daily
    },
    isNonNegotiable: false,
    priority: 'flexible',
    streak: {
      current: 0,
      longest: 0,
      lastCompleted: '',
    },
    timeOfDay: 'morning',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit.name?.trim() || !user) return;

    try {
      const habitDoc = {
        ...habit,
        completions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.uid,
      };

      await addDocument(user.uid, 'habits', habitDoc);
      
      // Reset form
      setHabit({
        name: '',
        frequency: {
          type: 'daily',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        },
        isNonNegotiable: false,
        priority: 'flexible',
        streak: {
          current: 0,
          longest: 0,
          lastCompleted: '',
        },
        timeOfDay: 'morning',
      });
      setIsExpanded(false);
      
      if (onHabitAdded) {
        onHabitAdded();
      }
    } catch (error) {
      console.error('Error adding habit:', error);
      alert('Failed to add habit. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isExpanded) {
      e.preventDefault();
      setIsExpanded(true);
    } else if (e.key === 'Enter' && isExpanded) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDayToggle = (day: number) => {
    const currentDays = habit.frequency?.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setHabit(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency!,
        daysOfWeek: newDays,
      },
    }));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <PlusCircle 
            className="w-6 h-6 text-gray-400 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          />
          <input
            type="text"
            value={habit.name}
            onChange={(e) => setHabit(prev => ({ ...prev, name: e.target.value }))}
            onKeyPress={handleKeyPress}
            placeholder="Add a habit..."
            className="flex-1 focus:outline-none"
            onFocus={() => setIsExpanded(true)}
          />
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Non-negotiable Toggle */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setHabit(prev => ({ ...prev, isNonNegotiable: !prev.isNonNegotiable }))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors w-full",
                  habit.isNonNegotiable
                    ? "bg-purple-50 text-purple-600 border-2 border-purple-200"
                    : "border-2 border-transparent hover:bg-gray-50"
                )}
              >
                <Star 
                  className="w-4 h-4" 
                  fill={habit.isNonNegotiable ? 'currentColor' : 'none'}
                />
                <span>Non-negotiable</span>
              </button>
              {habit.isNonNegotiable && (
                <p className="text-sm text-purple-600">
                  This habit is crucial for your daily success and cannot be skipped.
                </p>
              )}
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={habit.priority}
                onChange={(e) => setHabit(prev => ({
                  ...prev,
                  priority: e.target.value as Habit['priority'],
                }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="flexible">Flexible</option>
                <option value="important">Important</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                value={habit.frequency?.type}
                onChange={(e) => setHabit(prev => ({
                  ...prev,
                  frequency: {
                    ...prev.frequency!,
                    type: e.target.value as Habit['frequency']['type'],
                  },
                }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {habit.frequency?.type !== 'daily' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                <div className="flex gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`p-2 rounded-full w-10 h-10 text-sm ${
                        habit.frequency?.daysOfWeek?.includes(index)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
                <select
                  value={habit.timeOfDay}
                  onChange={(e) => setHabit(prev => ({
                    ...prev,
                    timeOfDay: e.target.value as Habit['timeOfDay'],
                  }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Estimate</label>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={habit.timeEstimate || ''}
                  onChange={(e) => setHabit(prev => ({
                    ...prev,
                    timeEstimate: parseInt(e.target.value) || undefined,
                  }))}
                  placeholder="Minutes"
                  className="p-2 border rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Habit
            </button>
          </div>
        )}
      </div>
    </form>
  );
} 