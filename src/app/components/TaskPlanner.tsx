import { useState, useEffect } from 'react';
import { BusinessStage } from './BusinessSequenceChecker';
import NonNegotiableTaskInput from './NonNegotiableTaskInput';
import { getTasks } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  const loadTasks = async () => {
    if (!user) return;
    
    // Get tomorrow's tasks that are non-negotiable
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowTasks = await getTasks({
      userId: user.uid,
      dueDate: tomorrow,
      isNonNegotiable: true
    });
    
    setTasks(tomorrowTasks);
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border-2 border-blue-600">
        <h3 className="text-xl font-bold mb-4">Set Your Non-Negotiables</h3>
        <p className="text-gray-600 mb-4">Maximum 3 tasks that must get done tomorrow</p>

        {/* Task input */}
        <NonNegotiableTaskInput 
          onTaskAdded={loadTasks}
          maxTasks={3}
          currentTaskCount={tasks.length}
        />

        {/* Task list */}
        <div className="space-y-2 mt-6">
          {tasks.map((task) => (
            <div key={task.id} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
              <p className="font-medium">{task.description}</p>
              <button
                onClick={async () => {
                  await deleteTask(task.id);
                  loadTasks();
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