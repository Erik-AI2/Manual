'use client';

import { useEffect, useState } from 'react';
import { fetchTasks, FirestoreError } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';
import { Task } from '@/lib/types/task';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TaskListContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadTasks = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        setError(null);
        const userTasks = await fetchTasks(user.uid);
        setTasks(userTasks);
      } catch (err) {
        const message = err instanceof FirestoreError 
          ? err.message 
          : 'Failed to load tasks';
        setError(message);
        console.error('Error loading tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No tasks found. Create your first task to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="p-4 bg-white rounded shadow">
          <h3 className="font-medium">{task.text || task.description}</h3>
          {task.dueDate && (
            <p className="text-sm text-gray-500">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
            {task.isNonNegotiable && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                Non-negotiable
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TaskList() {
  return (
    <ErrorBoundary>
      <TaskListContent />
    </ErrorBoundary>
  );
} 