'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Task, getTasks } from '@/lib/firebase/firebaseUtils';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const fetchedTasks = await getTasks(user.uid);
        setTasks(fetchedTasks);
        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        Please sign in to view tasks
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No tasks yet. Add one above!
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li 
          key={task.id}
          className="p-4 bg-white rounded-lg shadow flex items-center justify-between"
        >
          <div>
            <p className="text-gray-800">{task.description}</p>
            <p className="text-sm text-gray-500">
              Due: {task.dueDate.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
            <span className={`px-2 py-1 rounded text-sm ${
              task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {task.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
} 