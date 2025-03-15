
'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { getDocuments, updateDocument, deleteDocument } from '../../lib/firebase/firebaseUtils';
import TaskForm from '../../components/TaskForm';

interface Task {
  id: string;
  text: string;
  status: string;
  completed: boolean;
  dueDate?: string;
  isNonNegotiable?: boolean;
  createdAt: string;
}

export default function Do() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState({
    text: '',
    dueDate: '',
    isNonNegotiable: false
  });

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks from Firebase...');
      const fetchedTasks = await getDocuments('tasks');
      console.log('All fetched tasks:', fetchedTasks);
      
      const doTasks = fetchedTasks.filter(task => 
        task.status === 'do'
      );
      
      console.log('Filtered today\'s tasks:', doTasks);
      setTasks(doTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await updateDocument('tasks', taskId, { completed });
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const startEditing = (task: Task) => {
    if (!task.completed) {
      setEditingTaskId(task.id);
      setEditingTask({
        text: task.text,
        dueDate: task.dueDate || '',
        isNonNegotiable: task.isNonNegotiable || false
      });
    }
  };

  const saveEdit = async (taskId: string) => {
    try {
      await updateDocument('tasks', taskId, {
        text: editingTask.text,
        dueDate: editingTask.dueDate || null,
        isNonNegotiable: editingTask.isNonNegotiable
      });
      setEditingTaskId(null);
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      <div className="space-y-6">
        <TaskForm onTaskAdded={fetchTasks} defaultStatus="do" />
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center justify-between p-4 bg-white rounded-lg border transition-all ${
                task.completed ? 'opacity-75' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => toggleTaskCompletion(task.id, e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                {editingTaskId === task.id ? (
                  <div className="flex-1 flex gap-4 items-center">
                    <input
                      type="text"
                      value={editingTask.text}
                      onChange={(e) => setEditingTask({...editingTask, text: e.target.value})}
                      className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <input
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                      className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={editingTask.isNonNegotiable}
                        onChange={(e) => setEditingTask({...editingTask, isNonNegotiable: e.target.checked})}
                        className="w-4 h-4"
                      />
                      Non-neg
                    </label>
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span 
                        className={`${task.completed ? 'line-through text-gray-400' : ''} cursor-pointer`}
                        onClick={() => !task.completed && startEditing(task)}
                      >
                        {task.text}
                      </span>
                      {task.isNonNegotiable && (
                        <span className="text-sm text-purple-600 px-2 py-1 bg-purple-50 rounded-full">
                          Non-neg
                        </span>
                      )}
                    </div>
                    {task.dueDate && (
                      <span className="text-sm text-gray-500 ml-4">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={async () => {
                  try {
                    await deleteDocument('tasks', task.id);
                    await fetchTasks();
                  } catch (error) {
                    console.error('Error deleting task:', error);
                  }
                }}
                className="ml-4 p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-gray-500 py-8">No tasks to do</p>
          )}
        </div>
      </div>
    </main>
  );
}
