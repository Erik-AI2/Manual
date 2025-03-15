import { useState } from 'react';
import { addTask } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';

interface Props {
  onTaskAdded?: () => void;
  maxTasks?: number;
  currentTaskCount?: number;
}

export default function NonNegotiableTaskInput({ onTaskAdded, maxTasks = 3, currentTaskCount = 0 }: Props) {
  const [taskDescription, setTaskDescription] = useState('');
  const { user } = useAuth();

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const handleAddTask = async () => {
    if (!user || !taskDescription || currentTaskCount >= maxTasks) return;

    try {
      await addTask({
        userId: user.uid,
        description: taskDescription,
        dueDate: getTomorrowDate(),
        priority: 'high',
        isNonNegotiable: true,
        status: 'pending'
      });

      setTaskDescription('');
      onTaskAdded?.();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 p-2 border rounded"
        placeholder="Add a non-negotiable task for tomorrow and press Enter"
        disabled={currentTaskCount >= maxTasks}
      />
      <button
        onClick={handleAddTask}
        disabled={currentTaskCount >= maxTasks}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Add
      </button>
    </div>
  );
} 