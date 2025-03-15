'use client';

import { useState } from 'react';
import { getDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firebaseUtils';
import { Task } from '@/lib/types/task';
import { format, isPast, isToday } from 'date-fns';
import { Trash2, Edit2, Star, ChevronDown, ChevronRight, X, Calendar, CheckSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Project } from '@/lib/types/project';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  onTasksChanged: () => Promise<void>;
}

interface EditingTask {
  id: string;
  field: 'text' | 'dueDate' | null;
}

export default function TaskList({ tasks, projects, onTasksChanged }: TaskListProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const currentProject = searchParams.get('project');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [editingTask, setEditingTask] = useState<EditingTask>({ id: '', field: null });
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Filter tasks based on the selected project
  const filteredTasks = tasks.filter(task => {
    if (task.status === 'completed' && !showCompleted) return false;
    
    if (currentProject === 'no-project') {
      return !task.projectId || task.projectId === ''; // Include empty string check
    } else if (currentProject) {
      return task.projectId === currentProject;
    }
    return true;
  });

  // Group tasks by project
  const groupedTasks = filteredTasks.reduce((groups, task) => {
    const projectId = task.projectId || 'no-project';
    if (!groups[projectId]) {
      groups[projectId] = [];
    }
    groups[projectId].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!user?.uid) return;
    try {
      const updatedTask = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDocument(user.uid, 'tasks', taskId, updatedTask);
      await onTasksChanged();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!user?.uid) return;
    try {
      await deleteDocument(user.uid, 'tasks', taskId);
      await onTasksChanged();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return null;
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return null;
      return format(dateObj, 'MMM dd');
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  const startEditing = (task: Task, field: 'text' | 'dueDate') => {
    setEditingTask({ id: task.id, field });
    if (field === 'text') {
      setEditText(task.text);
    } else if (field === 'dueDate' && task.dueDate) {
      setEditDate(new Date(task.dueDate).toISOString().split('T')[0]);
    }
  };

  const handleEditSave = async (taskId: string) => {
    if (!editingTask.field) return;
    
    const updates: Partial<Task> = {};
    if (editingTask.field === 'text' && editText.trim()) {
      updates.text = editText.trim();
    } else if (editingTask.field === 'dueDate') {
      updates.dueDate = editDate ? new Date(editDate).toISOString() : null;
    }

    await handleTaskUpdate(taskId, updates);
    setEditingTask({ id: '', field: null });
  };

  // Render task group
  const renderTaskGroup = (tasks: Task[], projectId: string) => {
    const isCollapsed = collapsedProjects[projectId];
    const project = projects.find(p => p.id === projectId);
    const taskCount = tasks.length;

    return (
      <div key={projectId} className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4">
          {/* Project Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleProjectCollapse(projectId)}
                className="p-1 hover:bg-gray-50 rounded"
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              </button>
              <div className="flex items-center gap-2">
                {project && (
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <span className="font-medium">
                  {projectId === 'no-project' ? 'No Project' : project?.name}
                </span>
                <span className="text-sm text-gray-500">({taskCount})</span>
              </div>
            </div>
          </div>

          {/* Task List */}
          {!isCollapsed && (
            <div className="space-y-1">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 ${
                    task.isNonNegotiable ? 'bg-purple-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={(e) => handleTaskUpdate(task.id, { 
                      status: e.target.checked ? 'completed' : 'active' 
                    })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  
                  <div className="flex-1 flex items-center gap-3">
                    {editingTask.id === task.id && editingTask.field === 'text' ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => handleEditSave(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(task.id)}
                        className="w-full px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span 
                          onClick={() => startEditing(task, 'text')}
                          className="cursor-pointer"
                        >
                          {task.text}
                        </span>
                        {task.isNonNegotiable && (
                          <span className="text-sm text-purple-600">
                            Non-negotiable
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleTaskUpdate(task.id, { 
                        isNonNegotiable: !task.isNonNegotiable 
                      })}
                      className={`text-gray-400 hover:text-purple-500 ${
                        task.isNonNegotiable ? 'text-purple-500' : ''
                      }`}
                    >
                      <Star size={16} fill={task.isNonNegotiable ? "currentColor" : "none"} />
                    </button>

                    {editingTask.id === task.id && editingTask.field === 'dueDate' ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        onBlur={() => handleEditSave(task.id)}
                        className="px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                    ) : (
                      <span 
                        onClick={() => startEditing(task, 'dueDate')}
                        className={`text-sm cursor-pointer ${
                          task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
                            ? 'text-red-500'
                            : 'text-gray-500'
                        }`}
                      >
                        {task.dueDate ? formatDate(task.dueDate) : 'No date'}
                      </span>
                    )}

                    <button
                      onClick={() => handleTaskDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4">
      {/* Global header with Show completed button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            showCompleted 
              ? 'bg-gray-100 text-gray-900' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <CheckSquare size={16} className={showCompleted ? 'text-blue-500' : ''} />
          <span>Show completed</span>
        </button>
      </div>

      {/* Project groups */}
      {Object.entries(groupedTasks).map(([projectId, tasks]) => (
        renderTaskGroup(tasks, projectId)
      ))}
    </div>
  );
} 