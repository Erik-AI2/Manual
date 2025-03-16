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
      await addTask(user.uid, taskDescription);
      
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
    <div className="flex items-center gap-2 mt-4">
      <input
        type="text"
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Add a non-negotiable task for tomorrow"
        className="flex-1 p-2 border rounded-lg"
        disabled={currentTaskCount >= maxTasks}
      />
      <button
        onClick={handleAddTask}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-300"
        disabled={currentTaskCount >= maxTasks || !taskDescription}
      >
        Add
      </button>
    </div>
  );
} 