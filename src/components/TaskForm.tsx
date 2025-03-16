'use client';

import { useState } from 'react';
import { addDocument } from '@/lib/firebase/firebaseUtils';
import { Task } from '@/lib/types/task';
import { PlusCircle, Clock, Star, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';

interface TaskFormProps {
  onTaskAdded?: () => void;
  defaultIsNonNegotiable?: boolean;
  defaultDueDate?: Date;
  defaultStatus?: Task['status'];
}

export default function TaskForm({ onTaskAdded, defaultIsNonNegotiable, defaultDueDate, defaultStatus }: TaskFormProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [task, setTask] = useState<Partial<Task>>({
    text: '',
    status: 'active',
    isNonNegotiable: false,
    priority: 'low',
  });

  const [showRecurrence, setShowRecurrence] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.text?.trim() || !user) return;

    try {
      await addDocument(user.uid, 'tasks', {
        ...task,
        status: task.status || 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Reset form
      setTask({
        text: '',
        status: 'active' as const,
        isNonNegotiable: false,
        priority: 'low',
      });
      setIsExpanded(false);
      setShowRecurrence(false);
      
      if (onTaskAdded) {
        onTaskAdded();
      }
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleRecurrenceToggle = () => {
    if (!showRecurrence) {
      setTask(prev => ({
        ...prev,
        recurrence: {
          pattern: 'daily',
          interval: 1,
          endsOn: 'never',
        },
      }));
    } else {
      setTask(prev => ({
        ...prev,
        recurrence: undefined,
      }));
    }
    setShowRecurrence(!showRecurrence);
  };

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
            value={task.text}
            onChange={(e) => setTask(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Add a task..."
            className="flex-1 focus:outline-none"
            onFocus={() => setIsExpanded(true)}
          />
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setTask(prev => ({ ...prev, isNonNegotiable: !prev.isNonNegotiable }))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors w-full",
                  task.isNonNegotiable
                    ? "bg-purple-50 text-purple-600 border-2 border-purple-200"
                    : "border-2 border-transparent hover:bg-gray-50"
                )}
              >
                <Star 
                  className="w-4 h-4" 
                  fill={task.isNonNegotiable ? 'currentColor' : 'none'}
                />
                <span>Non-negotiable</span>
              </button>
              {task.isNonNegotiable && (
                <p className="text-sm text-purple-600">
                  This task is crucial and cannot be rescheduled.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => setTask(prev => ({
                  ...prev,
                  priority: e.target.value as Task['priority'],
                }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="flexible">Flexible</option>
                <option value="important">Important</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={typeof task.dueDate === 'object' && task.dueDate && 'toDate' in task.dueDate
                  ? task.dueDate.toDate().toISOString().split('T')[0]
                  : task.dueDate 
                    ? new Date(task.dueDate as string).toISOString().split('T')[0] 
                    : ''
                }
                onChange={(e) => setTask(prev => ({
                  ...prev,
                  dueDate: e.target.value,
                }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Estimate</label>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={task.timeEstimate || ''}
                  onChange={(e) => setTask(prev => ({
                    ...prev,
                    timeEstimate: parseInt(e.target.value) || undefined,
                  }))}
                  placeholder="Minutes"
                  className="w-32 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleRecurrenceToggle}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors w-full",
                  showRecurrence
                    ? "bg-blue-50 text-blue-600 border-2 border-blue-200"
                    : "border-2 border-transparent hover:bg-gray-50"
                )}
              >
                <Repeat className="w-4 h-4" />
                <span>Repeat</span>
              </button>
            </div>

            {showRecurrence && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Pattern</label>
                  <select
                    value={task.recurrence?.pattern}
                    onChange={(e) => setTask(prev => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence!,
                        pattern: e.target.value as Task['recurrence']['pattern'],
                      },
                    }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interval</label>
                  <input
                    type="number"
                    min="1"
                    value={task.recurrence?.interval || 1}
                    onChange={(e) => setTask(prev => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence!,
                        interval: parseInt(e.target.value) || 1,
                      },
                    }))}
                    className="w-32 p-2 border rounded-lg"
                  />
                  <span className="ml-2 text-sm text-gray-500">
                    {task.recurrence?.pattern === 'daily' && 'days'}
                    {task.recurrence?.pattern === 'weekly' && 'weeks'}
                    {task.recurrence?.pattern === 'monthly' && 'months'}
                    {task.recurrence?.pattern === 'yearly' && 'years'}
                  </span>
                </div>

                {task.recurrence?.pattern === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                    <div className="flex gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const currentDays = task.recurrence?.daysOfWeek || [];
                            const newDays = currentDays.includes(index)
                              ? currentDays.filter(d => d !== index)
                              : [...currentDays, index];
                            setTask(prev => ({
                              ...prev,
                              recurrence: {
                                ...prev.recurrence!,
                                daysOfWeek: newDays,
                              },
                            }));
                          }}
                          className={`p-2 rounded-full w-10 h-10 text-sm ${
                            task.recurrence?.daysOfWeek?.includes(index)
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ends</label>
                  <select
                    value={task.recurrence?.endsOn}
                    onChange={(e) => setTask(prev => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence!,
                        endsOn: e.target.value as Task['recurrence']['endsOn'],
                      },
                    }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="never">Never</option>
                    <option value="date">On Date</option>
                    <option value="occurrences">After Occurrences</option>
                  </select>

                  {task.recurrence?.endsOn === 'date' && (
                    <input
                      type="date"
                      value={task.recurrence?.endDate || ''}
                      onChange={(e) => setTask(prev => ({
                        ...prev,
                        recurrence: {
                          ...prev.recurrence!,
                          endDate: e.target.value,
                        },
                      }))}
                      className="mt-2 w-full p-2 border rounded-lg"
                    />
                  )}

                  {task.recurrence?.endsOn === 'occurrences' && (
                    <input
                      type="number"
                      min="1"
                      value={task.recurrence?.occurrences || 1}
                      onChange={(e) => setTask(prev => ({
                        ...prev,
                        recurrence: {
                          ...prev.recurrence!,
                          occurrences: parseInt(e.target.value) || 1,
                        },
                      }))}
                      className="mt-2 w-32 p-2 border rounded-lg"
                      placeholder="Number of times"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setTask({
                    text: '',
                    status: 'active',
                    isNonNegotiable: false,
                    priority: 'low',
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Task
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
