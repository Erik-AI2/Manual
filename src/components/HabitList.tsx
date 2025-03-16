'use client';

import { useEffect, useState } from 'react';
import { getDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firebaseUtils';
import { Habit } from '@/lib/types/task';
import { format, isSameDay } from 'date-fns';
import { Flame, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import HabitEditModal from './HabitEditModal';
import HabitCalendar from './HabitCalendar';
import { useAuth } from '@/lib/hooks/useAuth';

export default function HabitList() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  const fetchHabits = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching habits for user:', user.uid);
      const fetchedHabits = await getDocuments(user.uid, 'habits') as Habit[];
      console.log('Fetched habits:', fetchedHabits);
      
      // Ensure all required fields are present and initialize if missing
      const validHabits = fetchedHabits.map(habit => ({
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency || { 
          type: 'daily',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6] 
        },
        isNonNegotiable: habit.isNonNegotiable || false,
        priority: habit.priority || 'flexible',
        streak: habit.streak || {
          current: 0,
          longest: 0,
          lastCompleted: ''
        },
        completions: habit.completions || [],
        timeOfDay: habit.timeOfDay || 'morning',
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
        userId: user?.uid || ''
      }));

      setHabits(validHabits);
      setError(null);
    } catch (error) {
      console.error('Error fetching habits:', error);
      setError('Failed to load habits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const handleComplete = async (habit: Habit) => {
    try {
      if (!user?.uid) return;

      const now = new Date();
      const isCompletedToday = habit.completions?.some(date => 
        isSameDay(new Date(date), now)
      );

      // Create a new completions array
      const newCompletions = isCompletedToday
        ? (habit.completions || []).filter(date => !isSameDay(new Date(date), now))
        : [...(habit.completions || []), now.toISOString()];

      // Calculate streak
      const sortedCompletions = [...newCompletions]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      let lastDate = new Date();

      for (const date of sortedCompletions.map(d => new Date(d))) {
        if (currentStreak === 0 || 
            isSameDay(lastDate, date) || 
            (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 1) {
          currentStreak++;
          lastDate = date;
        } else {
          break;
        }
      }

      const updates = {
        completions: newCompletions,
        streak: {
          current: currentStreak,
          longest: Math.max(habit.streak?.longest || 0, currentStreak),
          lastCompleted: sortedCompletions[0] || habit.streak?.lastCompleted || '',
        },
        updatedAt: now.toISOString(),
      };

      await updateDocument(user.uid, 'habits', habit.id, updates);
      await fetchHabits();
    } catch (error) {
      console.error('Error completing habit:', error);
      setError('Failed to update habit. Please try again.');
    }
  };

  const handleSaveEdit = async (habitId: string, updates: Partial<Habit>) => {
    if (!user?.uid) return;
    try {
      await updateDocument(user.uid, 'habits', habitId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await fetchHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      setError('Failed to update habit. Please try again.');
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!user?.uid) return;
    if (confirm('Are you sure you want to delete this habit?')) {
      try {
        console.log('Deleting habit:', habitId);
        await deleteDocument(user.uid, 'habits', habitId);
        console.log('Habit deleted successfully');
        await fetchHabits();
      } catch (error) {
        console.error('Error deleting habit:', error);
        setError('Failed to delete habit. Please try again.');
      }
    }
  };

  const handleToggleDate = async (habit: Habit, dateStr: string) => {
    try {
      if (!user?.uid) return;

      const targetDate = new Date(dateStr);
      const isCompleted = habit.completions?.some(date => 
        isSameDay(new Date(date), targetDate)
      );

      // Create a new completions array
      const newCompletions = isCompleted
        ? (habit.completions || []).filter(date => !isSameDay(new Date(date), targetDate))
        : [...(habit.completions || []), targetDate.toISOString()];

      // Calculate streak
      const sortedCompletions = [...newCompletions]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      let lastDate = new Date();

      for (const date of sortedCompletions.map(d => new Date(d))) {
        if (currentStreak === 0 || 
            isSameDay(lastDate, date) || 
            (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 1) {
          currentStreak++;
          lastDate = date;
        } else {
          break;
        }
      }

      const updates = {
        completions: newCompletions,
        streak: {
          current: currentStreak,
          longest: Math.max(habit.streak?.longest || 0, currentStreak),
          lastCompleted: sortedCompletions[0] || habit.streak?.lastCompleted || '',
        },
        updatedAt: new Date().toISOString(),
      };

      await updateDocument(user.uid, 'habits', habit.id, updates);
      await fetchHabits();
    } catch (error) {
      console.error('Error toggling habit date:', error);
      setError('Failed to update habit. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please sign in to view your habits</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="flex-1">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchHabits}
              className="text-red-600 hover:text-red-800 text-sm mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-500">No habits yet. Create your first habit above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <div 
          key={habit.id} 
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          onClick={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(habit);
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Flame
                  className={`w-5 h-5 ${
                    habit.completions?.some(date => 
                      isSameDay(new Date(date), new Date())
                    )
                      ? 'text-orange-500'
                      : 'text-gray-400'
                  }`}
                />
              </button>
              <div>
                <span className="font-medium">{habit.name}</span>
                <div className="text-sm text-gray-500">
                  {habit.frequency.type === 'daily' ? 'Every day' : 
                    `${habit.frequency.daysOfWeek?.length} days per week`}
                  {' • '}
                  {habit.timeOfDay}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {habit.isNonNegotiable && (
                <span className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full">
                  Non-negotiable
                </span>
              )}
              <div className="flex items-center gap-1">
                <span className="text-sm">{habit.streak.current} day streak</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingHabit(habit);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(habit.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {expandedHabit === habit.id && (
            <div className="mt-4 pt-4 border-t">
              <HabitCalendar 
                completedDates={habit.completions || []}
                onToggleDate={(date) => handleToggleDate(habit, date)}
              />
            </div>
          )}
        </div>
      ))}

      {editingHabit && (
        <HabitEditModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={(updates) => handleSaveEdit(editingHabit.id, updates)}
        />
      )}
    </div>
  );
} 