'use client';

import { useEffect, useState, useRef } from 'react';
import { getDocuments, updateDocument, addTask } from '@/lib/firebase/firebaseUtils';
import { Task, Habit } from '@/lib/types/task';
import { isSameDay, format } from 'date-fns';
import { Flame, CheckCircle2, Circle, Send, Mic, Volume2, ChevronDown, ChevronRight, Star, Eye, EyeOff } from 'lucide-react';
import { useChat } from 'ai/react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import { getTodaysTasks, getTodaysHabits } from '@/lib/firebase/firebaseUtils';

interface DueItem {
  id: string;
  type: 'task' | 'habit';
  text: string;
  isNonNegotiable: boolean;
  priority: 'important' | 'flexible';
  isCompleted: boolean;
  timeEstimate?: number;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function Today() {
  const { user } = useAuth();
  const [items, setItems] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOtherTasks, setShowOtherTasks] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Initialize chat with context about today's tasks
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'system',
        content: 'You are an AI assistant helping the user complete their tasks for today. Be encouraging and helpful.'
      }
    ]
  });

  const updateTaskContext = (items: DueItem[]) => {
    const nonNegotiables = items.filter(item => item.isNonNegotiable);
    const important = items.filter(item => item.priority === 'important');
    const flexible = items.filter(item => item.priority === 'flexible');

    const contextMessage = `
      Today's Tasks Overview:
      
      Non-negotiables (${nonNegotiables.length}):
      ${nonNegotiables.map(item => `- ${item.text} (${item.isCompleted ? 'Completed' : 'Pending'})`).join('\n')}
      
      Important (${important.length}):
      ${important.map(item => `- ${item.text} (${item.isCompleted ? 'Completed' : 'Pending'})`).join('\n')}
      
      Flexible (${flexible.length}):
      ${flexible.map(item => `- ${item.text} (${item.isCompleted ? 'Completed' : 'Pending'})`).join('\n')}
    `;

    setMessages([
      {
        id: '1',
        role: 'system',
        content: 'You are an AI assistant helping the user complete their tasks for today. Be encouraging and helpful.'
      },
      {
        id: '2',
        role: 'system',
        content: contextMessage
      }
    ]);
  };

  const toggleItemCompletion = async (item: DueItem) => {
    if (!user?.uid) return;
    
    try {
      const newCompletionState = !item.isCompleted;
      console.log(`Toggling item ${item.id} to ${newCompletionState ? 'completed' : 'not completed'}`);
      
      if (item.type === 'task') {
        await updateDocument(user.uid, 'tasks', item.id, {
          status: newCompletionState ? 'completed' : 'active',
          updatedAt: new Date().toISOString(),
        });
      } else {
        // For habits
        const today = new Date().toISOString();
        const habit = await getDocuments(user.uid, 'habits') as Habit[];
        const targetHabit = habit.find(h => h.id === item.id);
        
        if (targetHabit) {
          const newCompletions = newCompletionState
            ? [...targetHabit.completions, today]
            : targetHabit.completions.filter(date => !isSameDay(new Date(date), new Date()));
          
          await updateDocument(user.uid, 'habits', item.id, {
            completions: newCompletions,
            updatedAt: today,
          });
        }
      }
      
      // Update local state immediately for better UX
      setItems(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, isCompleted: newCompletionState }
            : prevItem
        )
      );

      // Refresh the items to ensure everything is in sync
      await fetchTodaysItems();
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const fetchTodaysItems = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching items for user:', user.uid);
      
      const [tasks, habits] = await Promise.all([
        getTodaysTasks(user.uid),
        getTodaysHabits(user.uid)
      ]);

      console.log('Fetched tasks:', tasks);
      console.log('Fetched habits:', habits);

      // Combine tasks and habits into a single array with proper completion states
      const allItems = [
        ...tasks.map(task => ({
          id: task.id,
          type: 'task' as const,
          text: task.text,
          isNonNegotiable: task.isNonNegotiable,
          priority: task.priority === 'high' ? 'important' : 'flexible',
          isCompleted: task.status === 'completed',
          timeEstimate: task.timeEstimate
        })),
        ...habits.map(habit => ({
          id: habit.id,
          type: 'habit' as const,
          text: habit.name,
          isNonNegotiable: habit.isNonNegotiable || false,
          priority: habit.priority === 'high' ? 'important' : 'flexible',
          isCompleted: habit.isCompletedToday,
          timeEstimate: habit.timeEstimate
        }))
      ];

      // Log completion status of all items for debugging
      console.log('Items with completion status:', allItems.map(item => ({
        id: item.id,
        text: item.text,
        isCompleted: item.isCompleted
      })));

      // Sort items by priority and non-negotiable status
      const sortedItems = allItems.sort((a, b) => {
        if (a.isNonNegotiable && !b.isNonNegotiable) return -1;
        if (!a.isNonNegotiable && b.isNonNegotiable) return 1;
        if (a.priority === 'important' && b.priority !== 'important') return -1;
        if (a.priority !== 'important' && b.priority === 'important') return 1;
        return 0;
      });

      // We need to modify the sortedItems to ensure the priority is either "important" or "flexible"
      const typedItems = sortedItems.map(item => ({
        ...item,
        // Convert any priority string to either "important" or "flexible"
        priority: item.priority === 'high' || item.priority === 'non-negotiable' 
          ? 'important' 
          : 'flexible'
      })) as DueItem[];

      setItems(typedItems);
      updateTaskContext(typedItems);
    } catch (err) {
      console.error('Error fetching today\'s items:', err);
      setError('Failed to load today\'s items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysItems();
  }, [user]);

  // Update the filtering of non-negotiables and other tasks
  const nonNegotiables = items.filter(item => item.isNonNegotiable);
  const otherTasks = items.filter(item => !item.isNonNegotiable);

  // Filter based on completion status
  const filteredNonNegotiables = nonNegotiables.filter(item => {
    const shouldInclude = showCompleted || !item.isCompleted;
    console.log(`Item ${item.text}: isCompleted=${item.isCompleted}, shouldInclude=${shouldInclude}`);
    return shouldInclude;
  });

  const filteredOtherTasks = otherTasks.filter(item => {
    const shouldInclude = showCompleted || !item.isCompleted;
    console.log(`Item ${item.text}: isCompleted=${item.isCompleted}, shouldInclude=${shouldInclude}`);
    return shouldInclude;
  });

  // Also, add a test task when no tasks exist to verify everything works
  useEffect(() => {
    if (user?.uid && items.length === 0 && !loading) {
      console.log('No tasks found, adding test task');
      const addTestTask = async () => {
        try {
          await addTask(user.uid, "Test task for today");
          await fetchTodaysItems();
        } catch (error) {
          console.error('Error adding test task:', error);
        }
      };
      
      addTestTask();
    }
  }, [items, user, loading]);

  const getItemClassName = (item: DueItem, isNonNeg: boolean = false) => {
    return cn(
      "flex items-center gap-3 p-3 rounded-lg transition-all",
      isNonNeg 
        ? "bg-white border border-purple-100/50 hover:border-purple-200"
        : "bg-gray-50 hover:bg-gray-100",
      item.isCompleted && "opacity-75"
    );
  };

  const getTextClassName = (item: DueItem, isNonNeg: boolean = false) => {
    return cn(
      "flex-1",
      item.isCompleted && isNonNeg ? "line-through text-purple-400" : "",
      item.isCompleted && !isNonNeg ? "line-through text-gray-400" : ""
    );
  };

  // Add text-to-speech functionality
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleShowCompleted = () => {
    console.log('Current show completed state:', showCompleted);
    console.log('Toggling to:', !showCompleted);
    
    // Force a re-render by updating state in a separate tick
    setTimeout(() => {
      setShowCompleted(prev => {
        console.log('Setting showCompleted to:', !prev);
        return !prev;
      });
    }, 0);
  };

  // Add a more detailed debug effect
  useEffect(() => {
    console.log('=== FILTER DEBUG ===');
    console.log('Show completed state:', showCompleted);
    console.log('All items:', items.length);
    console.log('Completed items:', items.filter(item => item.isCompleted).length);
    console.log('Non-negotiables (before filter):', nonNegotiables.length);
    console.log('Other tasks (before filter):', otherTasks.length);
    console.log('Filtered non-negotiables:', filteredNonNegotiables.length);
    console.log('Filtered other tasks:', filteredOtherTasks.length);
    console.log('===================');
  }, [showCompleted, items, nonNegotiables, otherTasks, filteredNonNegotiables, filteredOtherTasks]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg">
          {error}
          <button
            onClick={fetchTodaysItems}
            className="ml-2 text-red-600 hover:text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Today</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShowCompleted}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {showCompleted ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
                <span>{showCompleted ? "Hide completed" : "Show completed"}</span>
              </button>
              <span className="text-gray-500">
                {format(new Date(), 'EEEE, MMMM d')}
              </span>
            </div>
          </div>

          {/* Non-negotiables Section */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-purple-600" fill="currentColor" />
              <h2 className="text-lg font-semibold text-purple-900">Non-Negotiables</h2>
            </div>
            <p className="text-sm text-purple-700 mb-6">
              These are your needle movers - the tasks and habits that will make the biggest impact today.
            </p>
            
            <div className="space-y-3">
              {filteredNonNegotiables.length === 0 ? (
                <p className="text-purple-600/60 text-center py-4">
                  No non-negotiable items for today
                </p>
              ) : (
                filteredNonNegotiables.map(item => (
                  <div
                    key={item.id}
                    className={getItemClassName(item, true)}
                  >
                    <button
                      onClick={() => toggleItemCompletion(item)}
                      className="flex-shrink-0"
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-purple-300" />
                      )}
                    </button>
                    <span className={getTextClassName(item, true)}>
                      {item.text}
                      <span className="ml-2 text-xs text-purple-400">
                        {item.type === 'habit' ? '(Habit)' : '(Task)'}
                      </span>
                    </span>
                    {item.timeEstimate && (
                      <span className="text-sm text-purple-400">
                        {item.timeEstimate}m
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Other Tasks Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <button
              onClick={() => setShowOtherTasks(!showOtherTasks)}
              className="flex items-center gap-2 w-full"
            >
              <div className="flex items-center gap-2 flex-1">
                <h2 className="text-lg font-semibold text-gray-800">Other Tasks</h2>
                <span className="text-sm text-gray-500">
                  ({filteredOtherTasks.length})
                </span>
              </div>
              {showOtherTasks ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showOtherTasks && (
              <div className="mt-4 space-y-3">
                {filteredOtherTasks.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No other tasks for today
                  </p>
                ) : (
                  filteredOtherTasks.map(item => (
                    <div
                      key={item.id}
                      className={getItemClassName(item)}
                    >
                      <button
                        onClick={() => toggleItemCompletion(item)}
                        className="flex-shrink-0"
                      >
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                      <span className={getTextClassName(item)}>
                        {item.text}
                      </span>
                      {item.timeEstimate && (
                        <span className="text-sm text-gray-400">
                          {item.timeEstimate}m
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <p className="text-sm text-gray-500">Here to help you with your tasks</p>
        </div>

        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-auto p-4 space-y-4"
        >
          {messages.map((message, i) => (
            message.role !== 'system' && (
              <div
                key={i}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-lg p-3
                    ${message.role === 'assistant' 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-500 text-white'
                    }
                  `}
                >
                  <p>{message.content}</p>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => speak(message.content)}
                      className="mt-2 text-gray-500 hover:text-gray-700"
                    >
                      {isSpeaking ? <Volume2 size={16} /> : <Mic size={16} />}
                    </button>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        <form 
          onSubmit={handleSubmit}
          className="p-4 border-t border-gray-200"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a question about your tasks or schedule..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
