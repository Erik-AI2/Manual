import { useState, useEffect } from 'react';
import { BusinessStage } from './BusinessSequenceChecker';
import NonNegotiableTaskInput from './NonNegotiableTaskInput';
import { getTasks, deleteDocument } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';
import { Task as GlobalTask } from '@/lib/types/task';

interface Task {
  id: string;
  description: string;
  dueDate: Date;
  isNonNegotiable: boolean;
}

interface Props {
  stage: BusinessStage;
  mainFocus: string;
}

export default function TaskPlanner({ stage, mainFocus }: Props) {
  const [nonNegotiableTasks, setNonNegotiableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get all tasks for the user
        const tasks = await getTasks(user.uid);
        
        // Filter for tomorrow's non-negotiable tasks and map to our local Task interface
        const tomorrowNonNegotiables = tasks
          .filter(task => {
            const taskDate = new Date(task.dueDate);
            return (
              task.isNonNegotiable &&
              taskDate.getFullYear() === tomorrow.getFullYear() &&
              taskDate.getMonth() === tomorrow.getMonth() &&
              taskDate.getDate() === tomorrow.getDate()
            );
          })
          .map(task => ({
            id: task.id,
            // Map 'text' to 'description'
            description: task.text,
            dueDate: new Date(task.dueDate),
            isNonNegotiable: task.isNonNegotiable
          }));
        
        setNonNegotiableTasks(tomorrowNonNegotiables);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      await deleteDocument(user.uid, 'tasks', taskId);
      // Update the local state to reflect the deletion
      setNonNegotiableTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border-2 border-blue-600">
        <h3 className="text-xl font-bold mb-4">Set Your Non-Negotiables</h3>
        <p className="text-gray-600 mb-4">Maximum 3 tasks that must get done tomorrow</p>

        {/* Task input */}
        <NonNegotiableTaskInput 
          onTaskAdded={() => {}}
          maxTasks={3}
          currentTaskCount={nonNegotiableTasks.length}
        />

        {/* Task list */}
        <div className="space-y-2 mt-6">
          {nonNegotiableTasks.map((task) => (
            <div key={task.id} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
              <p className="font-medium">{task.description}</p>
              <button
                onClick={async () => {
                  await deleteTask(task.id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 