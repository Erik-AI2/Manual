'use client';

import { useState } from 'react';
import { updateTask } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | Date;
  priority: string;
  isNonNegotiable: boolean;
  completed: boolean;
  projectId?: string;
}

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string, completed: boolean) => void;
}

export default function TaskItem({ task, onComplete }: TaskItemProps) {
  const [isCompleted, setIsCompleted] = useState(task.completed);
  const { user } = useAuth();
  
  // For debugging
  console.log('Task in TaskItem:', {
    id: task.id,
    title: task.title,
    isNonNegotiable: task.isNonNegotiable,
    completed: task.completed
  });

  const handleToggleComplete = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const newCompletedState = !isCompleted;
    setIsCompleted(newCompletedState);
    
    try {
      await updateTask(user.uid, task.id, { 
        completed: newCompletedState 
      });
      
      if (onComplete) {
        onComplete(task.id, newCompletedState);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert UI state on error
      setIsCompleted(isCompleted);
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
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
            {task.title || task.description}
          </h4>
          {task.isNonNegotiable && (
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">
              Non-Negotiable
            </span>
          )}
          {task.priority && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
        </div>
        
        {task.description && task.title && (
          <p className="text-gray-600 mt-1">{task.description}</p>
        )}
      </div>
    </div>
  );
} 