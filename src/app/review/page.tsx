"use client";
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import BusinessSequenceChecker, { BusinessStage } from '../components/BusinessSequenceChecker';
import TaskSuggestion from '../components/TaskSuggestion';
import TaskPlanner from '../components/TaskPlanner';
import { Task, Project } from '@/lib/types/task';
import { addDocument, getDocuments, getTodaysTasks, getTodaysHabits, updateDocument, addNonNegotiableTask, logWorkHours, logDailyLessons, updateTaskStatus, getTasksByProject, getProjects } from '@/lib/firebase/firebaseUtils';
import TaskEditModal from '@/components/TaskEditModal';
import { CheckCircle2, Circle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import MotivationalTimer from '../components/MotivationalTimer';
import { useAuth } from '@/lib/hooks/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import UserProfileButton from '../components/UserProfileButton';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';

interface DailyReviewInputs {
  hoursWorked: number;
  winsAndLessons: string;
  revenueActivity: string;
  forceMultiplier: string;
  priorityTask: string;
  businessStage: BusinessStage;
  nonNegotiableTasks: Task[];
}

interface Habit {
  id: string;
  name: string;
  isNonNegotiable: boolean;
  priority: string;
  timeEstimate?: number;
  isCompletedToday: boolean;
  frequency: any;
  completions: string[];
}

export default function DailyReview() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { register, handleSubmit, setValue, watch } = useForm<DailyReviewInputs>();
  const [identifiedStage, setIdentifiedStage] = useState<BusinessStage | null>(null);
  const [suggestedTask, setSuggestedTask] = useState<string>('');
  const [nonNegotiableTasks, setNonNegotiableTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [todaysNonNegotiables, setTodaysNonNegotiables] = useState<Task[]>([]);
  const [todaysNonNegotiableHabits, setTodaysNonNegotiableHabits] = useState<Habit[]>([]);
  const [showTimer, setShowTimer] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningStep, setWarningStep] = useState(1);
  const [showFinalTimer, setShowFinalTimer] = useState(false);
  const [finalTimerComplete, setFinalTimerComplete] = useState(false);
  const [finalTimerRunning, setFinalTimerRunning] = useState(false);
  const [isHoursInputFocused, setIsHoursInputFocused] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const fetchedProjects = await getProjects(user.uid);
        console.log('Fetched projects:', fetchedProjects);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      }
    };

    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    const fetchTodaysItems = async () => {
      if (!user) return;
      try {
        console.log('Fetching tasks and habits for user:', user.uid);
        
        // Fetch both tasks and habits
        const [tasks, habits] = await Promise.all([
          getTodaysTasks(user.uid),
          getTodaysHabits(user.uid)
        ]);
        
        console.log('Tasks:', tasks);
        console.log('Habits:', habits);
        
        // Filter habits to only include non-negotiable ones
        const nonNegotiableHabits = habits.filter(habit => habit.isNonNegotiable === true);
        console.log('Non-negotiable habits:', nonNegotiableHabits);
        
        setTodaysNonNegotiables(tasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toISOString()) : new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
        setTodaysNonNegotiableHabits(nonNegotiableHabits);
        
        // Check if all tasks and non-negotiable habits are completed
        const hasIncompleteTask = tasks.some(task => task.status !== 'completed');
        const hasIncompleteHabit = nonNegotiableHabits.some(habit => !habit.isCompletedToday);
        const hasIncomplete = hasIncompleteTask || hasIncompleteHabit;
        
        setShowTimer(hasIncomplete);
        setCanProceed(!hasIncomplete);
      } catch (error) {
        console.error('Error in fetchTodaysItems:', error);
        setTodaysNonNegotiables([]);
        setTodaysNonNegotiableHabits([]);
        setShowTimer(false);
        setCanProceed(true);
      }
    };

    fetchTodaysItems();
  }, [user]);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    if (nonNegotiableTasks.length >= 3) {
      alert('You can only add up to 3 non-negotiable tasks');
      return;
    }
    
    // Format the date consistently
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      dueDate: tomorrow.toISOString(), // Consistent date format
      isNonNegotiable: true,
      status: 'active',
      priority: 'important',
      projectId: selectedProject || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setNonNegotiableTasks((prev) => {
      const updated = [...prev, newTask];
      setValue('nonNegotiableTasks', updated);
      return updated;
    });
    setNewTaskText('');
    setSelectedProject('');
  };

  const handleRemoveTask = (taskId: string) => {
    setNonNegotiableTasks((prev) => {
      const updated = prev.filter(task => task.id !== taskId);
      setValue('nonNegotiableTasks', updated);
      return updated;
    });
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!user) return;
    try {
      const task = todaysNonNegotiables.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === 'completed' ? 'active' : 'completed';
      
      await updateTaskStatus(user.uid, taskId, newStatus === 'completed');

      setTodaysNonNegotiables(prev => 
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );

      const updatedTasks = todaysNonNegotiables.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      
      const hasIncomplete = updatedTasks.some(t => t.status !== 'completed');
      setShowTimer(hasIncomplete);
      setCanProceed(!hasIncomplete);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const toggleHabitCompletion = async (habitId: string) => {
    console.log('Toggling habit completion for:', habitId);
    
    // Update local state first for immediate feedback
    setTodaysNonNegotiableHabits(prev => 
      prev.map(habit => {
        if (habit.id === habitId) {
          console.log('Found habit to toggle:', habit.name);
          return {
            ...habit,
            isCompletedToday: !habit.isCompletedToday
          };
        }
        return habit;
      })
    );
    
    // Then update the database if user is logged in
    if (user) {
      try {
        const habit = todaysNonNegotiableHabits.find(h => h.id === habitId);
        if (!habit) {
          console.error('Habit not found:', habitId);
          return;
        }
        
        const isCurrentlyCompleted = habit.isCompletedToday;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        let updatedCompletions = [...(habit.completions || [])];
        if (isCurrentlyCompleted) {
          // Remove today's date from completions
          updatedCompletions = updatedCompletions.filter(date => !date.startsWith(today));
        } else {
          // Add today's date to completions
          updatedCompletions.push(today);
        }
        
        console.log('Updating habit in database with completions:', updatedCompletions);
        await updateDocument(user.uid, 'habits', habitId, {
          completions: updatedCompletions
        });
        
        // Check if all tasks and habits are complete now
        const allTasksComplete = todaysNonNegotiables.every(task => task.status === 'completed');
        const allHabitsComplete = todaysNonNegotiableHabits
          .map(h => h.id === habitId ? { ...h, isCompletedToday: !isCurrentlyCompleted } : h)
          .every(habit => habit.isCompletedToday);
        
        const allComplete = allTasksComplete && allHabitsComplete;
        setShowTimer(!allComplete);
        setCanProceed(allComplete);
      } catch (error) {
        console.error('Error updating habit:', error);
        
        // Revert the local state change if the database update fails
        setTodaysNonNegotiableHabits(prev => 
          prev.map(habit => {
            if (habit.id === habitId) {
              return {
                ...habit,
                isCompletedToday: !habit.isCompletedToday // Toggle back
              };
            }
            return habit;
          })
        );
      }
    }
  };

  const areAllTasksComplete = useCallback(() => {
    const allTasksComplete = todaysNonNegotiables.every(task => task.status === 'completed');
    const allHabitsComplete = todaysNonNegotiableHabits.every(habit => habit.isCompletedToday);
    return allTasksComplete && allHabitsComplete;
  }, [todaysNonNegotiables, todaysNonNegotiableHabits]);

  const handleTimerComplete = () => {
    setShowTimer(false);
    setCanProceed(true);
  };

  const handleContinue = () => {
    if (step === 1) {
      const hasIncompleteTask = todaysNonNegotiables.some(task => task.status !== 'completed');
      const hasIncompleteHabit = todaysNonNegotiableHabits.some(habit => !habit.isCompletedToday);
      const hasIncomplete = hasIncompleteTask || hasIncompleteHabit;
      
      if (hasIncomplete) {
        setShowWarningDialog(true);
        return;
      }
    }
    setStep(step + 1);
  };

  const handleProceedAnyway = () => {
    if (warningStep === 1) {
      setWarningStep(2);
      return;
    }
    
    // Close the warning dialog
    setShowWarningDialog(false);
    setWarningStep(1);
    
    // Show the 5-minute timer and automatically start it
    setShowFinalTimer(true);
    setFinalTimerComplete(false);
    setFinalTimerRunning(true);
  };

  const handleFinalTimerComplete = () => {
    setFinalTimerComplete(true);
  };

  useEffect(() => {
    if (areAllTasksComplete()) {
      setShowTimer(false);
      setCanProceed(true);
    }
  }, [todaysNonNegotiables, areAllTasksComplete]);

  const onSubmit = async (data: DailyReviewInputs) => {
    if (!user) return;
    
    if (step < 3) {
      handleContinue();
      return;
    }

    try {
      // Create tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Set to start of tomorrow

      // Save the non-negotiable tasks first with tomorrow's date
      const taskPromises = nonNegotiableTasks.map(task => 
        addNonNegotiableTask(user.uid, {
          text: task.text,
          dueDate: tomorrow, // Set to tomorrow
          projectId: task.projectId
        })
      );

      // Log hours and lessons
      const promises = [
        ...taskPromises,
        logWorkHours(user.uid, data.hoursWorked),
        data.winsAndLessons ? logDailyLessons(user.uid, data.winsAndLessons) : Promise.resolve()
      ];

      await Promise.all(promises);

      // Create a daily plan to mark the review as complete
      const today = new Date().toISOString().split('T')[0];
      await addDocument(user.uid, 'dailyPlans', {
        date: today,
        isComplete: true,
        nonNegotiables: nonNegotiableTasks.map(task => ({
          id: task.id,
          title: task.text,
          completed: false,
          type: 'task'
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Reset the form and state
      setNonNegotiableTasks([]);
      setNewTaskText('');
      setSelectedProject('');
      
      // Redirect to dashboard or show success message
      alert('Daily review completed successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing review:', error);
      alert('Failed to complete review. Please try again.');
    }
  };

  const incrementHours = (currentValue: number) => {
    const newValue = Math.min(24, currentValue + 0.5);
    setValue('hoursWorked', newValue);
  };

  const decrementHours = (currentValue: number) => {
    const newValue = Math.max(0, currentValue - 0.5);
    setValue('hoursWorked', newValue);
  };

  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!user || !selectedProject) return;
      const tasks = await getTasksByProject(user.uid, selectedProject);
      // ... rest of your code
    };
    fetchProjectTasks();
  }, [user, selectedProject]);

  // Reset timer running state when component unmounts
  useEffect(() => {
    return () => {
      setFinalTimerRunning(false);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">Please sign in to continue</h1>
        <GoogleSignInButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quick Daily Review</h1>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-gray-600 hidden sm:block">{user.displayName}</span>
              <UserProfileButton />
            </>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mb-8">
        <p className="text-lg">Step {step}/3</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              className={`w-3 h-3 rounded-full ${
                dot === step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Move timer outside the form */}
      {step === 1 && showTimer && (
        <div className="space-y-4">
          <MotivationalTimer
            duration={30 * 60}
            onComplete={() => setShowTimer(false)}
            isActive={!areAllTasksComplete()}
          />
          
          {showFinalTimer && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-blue-800 font-semibold">
                    Final Focus Session
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-mono text-blue-700">
                      <MotivationalTimer
                        duration={5 * 60}
                        onComplete={handleFinalTimerComplete}
                        isActive={true}
                        variant="compact"
                        isRunningExternal={finalTimerRunning}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-blue-600">
                  <p className="mb-2">Just 5 minutes of focused work on your non-negotiables. You can do this!</p>
                  <p className="font-semibold">"The pain of discipline is nothing like the pain of disappointment." - Alex Hormozi</p>
                </div>
                {finalTimerComplete && (
                  <button
                    onClick={() => {
                      setShowFinalTimer(false);
                      setCanProceed(true);
                      setStep(step + 1);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Timer Complete - Continue with Review
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Daily Check */}
        <div className={step === 1 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-4">Daily Check</h2>
          <p className="text-gray-600 mb-6">Review your non-negotiable tasks for today</p>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Today's Non-Negotiables</h3>
              {todaysNonNegotiables.filter(task => task.isNonNegotiable === true).length === 0 && 
               todaysNonNegotiableHabits.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No non-negotiable tasks or habits due today</p>
                  <p className="text-sm text-gray-400 mt-2">
                    You can add non-negotiable tasks in the Tasks section
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Display Tasks */}
                  {todaysNonNegotiables
                    .filter(task => task.isNonNegotiable === true)
                    .sort((a, b) => {
                      // Sort completed tasks after non-completed tasks
                      if (a.status === 'completed' && b.status !== 'completed') return 1;
                      if (a.status !== 'completed' && b.status === 'completed') return -1;
                      return 0;
                    })
                    .map((task) => (
                      <div 
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          task.status === 'completed' ? 'bg-gray-50' : 'bg-purple-50'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(task.id)}
                          className="flex-shrink-0 focus:outline-none"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-purple-300" />
                          )}
                        </button>
                        <span className={cn(
                          "flex-1",
                          task.status === 'completed' ? "line-through text-gray-400" : ""
                        )}>
                          {task.text}
                        </span>
                        {task.projectId && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                            {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                          </span>
                        )}
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
                          Task
                        </span>
                      </div>
                    ))
                  }
                  
                  {/* Display Habits */}
                  {todaysNonNegotiableHabits
                    .sort((a, b) => {
                      // Sort completed habits after non-completed habits
                      if (a.isCompletedToday && !b.isCompletedToday) return 1;
                      if (!a.isCompletedToday && b.isCompletedToday) return -1;
                      return 0;
                    })
                    .map((habit) => (
                      <div 
                        key={habit.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                          habit.isCompletedToday ? 'bg-gray-50' : 'bg-green-50'
                        )}
                        onClick={() => toggleHabitCompletion(habit.id)}
                      >
                        <div className="flex-shrink-0">
                          {habit.isCompletedToday ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-green-300" />
                          )}
                        </div>
                        <span className={cn(
                          "flex-1",
                          habit.isCompletedToday ? "line-through text-gray-400" : ""
                        )}>
                          {habit.name}
                        </span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                          Habit
                        </span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Daily Reflection */}
        <div className={step === 2 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-4">Daily Reflection</h2>
          <p className="text-gray-600 mb-6">Record your work hours and key learnings</p>

          <div className="space-y-6">
            {/* Hours Worked Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked Today *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decrementHours(watch('hoursWorked') || 0)}
                  className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold text-gray-700 transition-colors"
                >
                  -
                </button>
                <div 
                  className="relative flex-1 max-w-[120px] cursor-text"
                  onClick={() => {
                    const input = document.getElementById('hoursInput');
                    if (input) {
                      input.focus();
                      input.select();
                    }
                  }}
                >
                  <input
                    id="hoursInput"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                    className={cn(
                      "w-full text-center text-2xl font-semibold p-2 border rounded-lg transition-all",
                      isHoursInputFocused 
                        ? "focus:outline-none focus:ring-2 focus:ring-blue-500 border-blue-500" 
                        : "border-gray-200"
                    )}
                    {...register('hoursWorked', { 
                      required: 'Please enter hours worked',
                      min: { value: 0, message: 'Hours cannot be negative' },
                      max: { value: 24, message: 'Hours cannot exceed 24' },
                      valueAsNumber: true,
                      value: 0
                    })}
                    onFocus={() => setIsHoursInputFocused(true)}
                    onBlur={() => setIsHoursInputFocused(false)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    hrs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => incrementHours(watch('hoursWorked') || 0)}
                  className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold text-gray-700 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Click to edit or use + and - buttons (0.5 hour increments)
              </p>
            </div>

            {/* Wins and Lessons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What were your wins and lessons today?
              </label>
              <textarea
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Write about your achievements and learnings..."
                {...register('winsAndLessons')}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Tomorrow's Money-Making Plan */}
        <div className={step === 3 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-4">Tomorrow's Money-Making Plan</h2>
          <p className="text-gray-600 mb-6">Let's identify your ONE focus for maximum impact</p>

          {!identifiedStage ? (
            <BusinessSequenceChecker 
              onStageIdentified={(stage, task) => {
                setIdentifiedStage(stage);
                setSuggestedTask(task);
                register('priorityTask').onChange({ target: { value: task } });
                register('businessStage').onChange({ target: { value: stage } });
              }} 
            />
          ) : (
            <>
              <TaskSuggestion 
                stage={identifiedStage} 
                suggestedTask={suggestedTask} 
              />
              <div className="mt-8 space-y-6">
                <div className="bg-white p-6 rounded-lg border-2 border-blue-600">
                  <h3 className="text-xl font-bold mb-4">Set Your Non-Negotiables</h3>
                  <p className="text-gray-600 mb-4">Add tasks that must get done tomorrow</p>
                  <div className="flex gap-2 flex-col">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newTaskText} 
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Enter task..."
                        className="flex-1 p-2 border rounded"
                        disabled={nonNegotiableTasks.length >= 3}
                      />
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="px-3 py-2 border rounded text-sm text-gray-600"
                        disabled={nonNegotiableTasks.length >= 3}
                      >
                        <option value="">No Project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={handleAddTask}
                        className={`px-4 py-2 rounded ${
                          nonNegotiableTasks.length >= 3 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        disabled={nonNegotiableTasks.length >= 3}
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {3 - nonNegotiableTasks.length} slots remaining
                    </p>
                  </div>
                  {nonNegotiableTasks.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Tomorrow's Non-Negotiables:</h4>
                      <ul className="space-y-2">
                        {nonNegotiableTasks.map((task) => (
                          <li 
                            key={task.id} 
                            className="flex items-center justify-between gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <span>•</span>
                              <span>{task.text}</span>
                              {task.projectId && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                                  {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTask(task.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-5 w-5" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path 
                                  fillRule="evenodd" 
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                                  clipRule="evenodd" 
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between pt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Previous
            </button>
          )}
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700"
          >
            {step === 3 ? 'Complete Review' : 'Continue'}
          </button>
        </div>
      </form>

      {editingTaskId && nonNegotiableTasks.length > 0 && (
        <TaskEditModal
          task={nonNegotiableTasks.find(t => t.id === editingTaskId) || null}
          projects={projects}
          onClose={() => setEditingTaskId(null)}
          onSave={async (updates: Partial<Task>) => {
            setNonNegotiableTasks((prev) => {
              const updated = prev.map(task =>
                task.id === editingTaskId ? { ...task, ...updates } : task
              );
              setValue('nonNegotiableTasks', updated);
              return updated;
            });
            setEditingTaskId(null);
          }}
          onDelete={async () => {
            setNonNegotiableTasks((prev) => {
              const updated = prev.filter(task => task.id !== editingTaskId);
              setValue('nonNegotiableTasks', updated);
              return updated;
            });
            setEditingTaskId(null);
          }}
        />
      )}

      {showWarningDialog && (
        <Dialog
          open={showWarningDialog}
          onClose={() => {
            setShowWarningDialog(false);
            setWarningStep(1);
          }}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
              {warningStep === 1 ? (
                <>
                  <div className="flex items-center gap-3 text-amber-500 mb-4">
                    <AlertTriangle className="h-6 w-6" />
                    <Dialog.Title className="text-lg font-medium">
                      Incomplete Non-Negotiables
                    </Dialog.Title>
                  </div>

                  <Dialog.Description className="text-gray-600 mb-6">
                    You haven't completed all your non-negotiable tasks for today. <span className="font-bold">These tasks are crucial for your progress.</span> Are you sure you want to continue without completing them?
                  </Dialog.Description>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-lg"
                      onClick={() => {
                        setShowWarningDialog(false);
                        setWarningStep(1);
                      }}
                    >
                      Continue Working on Tasks
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                      onClick={handleProceedAnyway}
                    >
                      I want to skip anyway
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-12 w-12 text-amber-500" />
                    </div>
                    <Dialog.Title className="text-2xl font-bold text-gray-900">
                      Is This Really The Best You Can Do?
                    </Dialog.Title>
                    <Dialog.Description className="text-gray-700 text-xl">
                      <p className="font-semibold mb-4">
                        "Discipline is choosing between what you want now and what you want most."
                      </p>
                      <p className="font-medium text-gray-500">
                        - Alex Hormozi
                      </p>
                    </Dialog.Description>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      type="button"
                      className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xl transform hover:scale-105 transition-transform shadow-lg"
                      onClick={() => {
                        setShowWarningDialog(false);
                        setWarningStep(1);
                      }}
                    >
                      You're Right, Let's Get It Done
                    </button>
                    <button
                      type="button"
                      className="text-xs text-gray-400 hover:text-gray-600 py-2 opacity-50"
                      onClick={handleProceedAnyway}
                    >
                      skip for now
                    </button>
                  </div>
                </>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}