'use client';

import { useState, useEffect } from 'react';
import { isToday } from 'date-fns';
import { getTasks, getHabits, logWorkHours, logDailyLessons } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';
import TaskItem from './TaskItem';
import HabitItem from './HabitItem';
import { useRouter } from 'next/navigation';

// Define types for our data
type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: string;
  completed: boolean;
  isNonNegotiable: boolean;
};

type Habit = {
  id: string;
  title: string;
  completed: boolean;
  isNonNegotiable: boolean;
  frequency: any;
  streak: any;
  completions: any;
};

export default function Review() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(30 * 60); // 30 minutes in seconds
  
  // Reflection state
  const [hoursWorked, setHoursWorked] = useState(0);
  const [lessons, setLessons] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Step 3 state
  const [hasConsistentLeads, setHasConsistentLeads] = useState<boolean | null>(null);
  const [focusArea, setFocusArea] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const tasksData = await getTasks(user.uid);
        const habitsData = await getHabits(user.uid);
        // Type assertion to handle potential missing properties
        setTasks(tasksData as unknown as Task[]);
        setHabits(habitsData as unknown as Habit[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Set up timer
  useEffect(() => {
    if (timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer(prevTimer => prevTimer - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer]);

  // Format timer as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get only tasks due today
  const todaysTasks = tasks.filter(task => {
    return isToday(new Date(task.dueDate));
  });

  // Filter for non-negotiable tasks due today
  const nonNegotiableTasks = todaysTasks.filter(task => {
    return task.isNonNegotiable === true;
  });

  // Filter for non-negotiable habits
  const nonNegotiableHabits = habits.filter(habit => {
    return habit.isNonNegotiable === true;
  });

  // For debugging
  console.log('All tasks:', tasks);
  console.log('Tasks due today:', todaysTasks);
  console.log('Non-negotiable tasks:', nonNegotiableTasks);
  console.log('Non-negotiable habits:', nonNegotiableHabits);

  const handleContinue = async () => {
    if (step === 2) {
      // Save reflection data before moving to step 3
      if (user) {
        try {
          setSaving(true);
          
          // Store hours worked and lessons learned separately
          if (hoursWorked > 0) {
            await logWorkHours(user.uid, hoursWorked);
          }
          
          if (lessons.trim()) {
            await logDailyLessons(user.uid, lessons);
          }
        } catch (error) {
          console.error('Error saving reflection data:', error);
        } finally {
          setSaving(false);
        }
      }
    }
    
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const incrementHours = () => {
    setHoursWorked(prev => prev + 0.5);
  };

  const decrementHours = () => {
    setHoursWorked(prev => Math.max(0, prev - 0.5));
  };
  
  // Handle the Yes/No buttons for consistent leads
  const handleLeadsAnswer = (hasLeads: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Leads button clicked:', hasLeads);
    setHasConsistentLeads(hasLeads);
    return false; // Prevent default and stop propagation
  };
  
  const handleCompleteReview = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Complete Review button clicked');
    
    if (submitted) {
      console.log('Already submitted, preventing duplicate submission');
      return;
    }
    
    setSubmitted(true);
    
    // Save any step 3 data if needed
    if (user && hasConsistentLeads !== null) {
      try {
        setSaving(true);
        // Here you could save the user's focus area and leads status
        // For example:
        // await saveFocusArea(user.uid, { hasConsistentLeads, focusArea });
        console.log('Saving focus data:', { hasConsistentLeads, focusArea });
      } catch (error) {
        console.error('Error saving focus data:', error);
      } finally {
        setSaving(false);
      }
    }
    
    // Use Next.js router for navigation instead of window.location
    console.log('Navigating to dashboard');
    router.push('/dashboard');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quick Daily Review</h1>
        {user && <div className="text-lg">{user.displayName || user.email}</div>}
      </div>
      
      <div className="mb-8">
        <p className="text-lg font-medium">Step {step}/3</p>
        <div className="flex mt-2">
          <div className={`h-2 w-full rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`h-2 w-full rounded-full ml-1 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`h-2 w-full rounded-full ml-1 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      {step === 1 && (
        <div>
          <div className="border-l-4 border-red-500 p-4 bg-red-50 mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-red-600">Complete your non-negotiables first</h2>
              <div className="text-xl font-mono">{formatTime(timer)}</div>
            </div>
            <div className="w-full h-2 bg-red-200 mt-4">
              <div 
                className="h-full bg-red-500" 
                style={{ width: `${(timer / (30 * 60)) * 100}%` }}
              ></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">Daily Check</h2>
          <p className="text-lg mb-8">Review your non-negotiable tasks for today</p>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Today's Non-Negotiables</h3>
            {nonNegotiableTasks.length === 0 && nonNegotiableHabits.length === 0 ? (
              <p className="text-gray-500">No non-negotiable items for today</p>
            ) : (
              <div className="space-y-4">
                {nonNegotiableTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <TaskItem task={task as any} />
                  </div>
                ))}
                {nonNegotiableHabits.map((habit) => (
                  <div key={habit.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <HabitItem habit={habit as any} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleContinue}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Daily Reflection</h2>
          <p className="text-lg mb-8">Record your work hours and key learnings</p>
          
          <div className="mb-8">
            <label className="block text-lg font-medium mb-2">Hours Worked Today <span className="text-red-500">*</span></label>
            <div className="flex items-center">
              <button 
                onClick={decrementHours}
                className="bg-gray-100 hover:bg-gray-200 p-4 rounded-l-lg text-xl font-bold"
              >
                -
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                  className="w-full text-center py-4 text-xl border-t border-b"
                  step="0.5"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">hrs</span>
              </div>
              <button 
                onClick={incrementHours}
                className="bg-gray-100 hover:bg-gray-200 p-4 rounded-r-lg text-xl font-bold"
              >
                +
              </button>
            </div>
            <p className="text-gray-500 mt-2">Click to edit or use + and - buttons (0.5 hour increments)</p>
          </div>
          
          <div className="mb-8">
            <label className="block text-lg font-medium mb-2">What were your wins and lessons today?</label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              className="w-full p-4 border rounded-lg h-32 resize-none"
              placeholder="Write about your achievements and learnings..."
            />
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={handlePrevious}
              className="py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <button 
              onClick={handleContinue}
              disabled={saving}
              className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Tomorrow's Money-Making Plan</h2>
          <p className="text-lg mb-8">Let's identify your ONE focus for maximum impact</p>
          
          <div className="border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Do you have a proven offer?</h3>
            
            <div className="flex space-x-4">
              <button
                type="button" 
                onClick={handleLeadsAnswer(true)}
                className={`flex-1 py-4 px-4 rounded-lg transition ${
                  hasConsistentLeads === true ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={handleLeadsAnswer(false)}
                className={`flex-1 py-4 px-4 rounded-lg transition ${
                  hasConsistentLeads === false ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                NO
              </button>
            </div>
          </div>
          
          {hasConsistentLeads !== null && (
            <div className="mb-8">
              <label className="block text-lg font-medium mb-2">
                {hasConsistentLeads 
                  ? "What's your ONE focus to optimize conversions?" 
                  : "What's your ONE focus to generate more leads?"}
              </label>
              <textarea
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full p-4 border rounded-lg h-24 resize-none"
                placeholder="Describe your main focus area for tomorrow..."
              />
            </div>
          )}
          
          <div className="flex justify-between">
            <button 
              type="button"
              onClick={handlePrevious}
              className="py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <button 
              type="button"
              onClick={handleCompleteReview}
              disabled={saving || submitted}
              className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Complete Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 