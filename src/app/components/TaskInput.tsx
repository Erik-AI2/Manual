'use client';

import { useState, useEffect } from 'react';
import { addDocument } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';
import { Calendar, Star, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface TaskInputProps {
  onSubmit?: (text: string) => Promise<void>;
  projects?: { id: string; name: string; color: string }[];
  onTaskAdded?: () => Promise<void>;
}

export default function TaskInput({ onSubmit, projects = [], onTaskAdded }: TaskInputProps) {
  const searchParams = useSearchParams();
  const currentProject = searchParams.get('project');
  const [isExpanded, setIsExpanded] = useState(false);
  const [task, setTask] = useState({
    text: '',
    dueDate: '',
    projectId: currentProject || '',
    isNonNegotiable: false
  });
  const { user } = useAuth();

  useEffect(() => {
    setTask(prev => ({
      ...prev,
      projectId: currentProject || ''
    }));
  }, [currentProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.text.trim() || !user?.uid) return;
    
    try {
      if (onSubmit) {
        await onSubmit(task.text.trim());
      } else {
        await addDocument(user.uid, 'tasks', {
          text: task.text.trim(),
          status: 'active',
          projectId: task.projectId || null,
          dueDate: task.dueDate || null,
          priority: 'medium',
          isNonNegotiable: task.isNonNegotiable,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Reset form but keep the current project
      setTask(prev => ({
        text: '',
        dueDate: '',
        projectId: prev.projectId,
        isNonNegotiable: false
      }));
      setIsExpanded(false);

      if (onTaskAdded) {
        await onTaskAdded();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={task.text}
          onChange={(e) => setTask(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Add a task..."
          className="w-full p-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          spellCheck={false}
          data-ms-editor={false}
        />
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 bg-white p-4 rounded-lg border">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={task.projectId}
              onChange={(e) => setTask(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={task.dueDate}
                onChange={(e) => setTask(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {task.dueDate && (
                <button
                  type="button"
                  onClick={() => setTask(prev => ({ ...prev, dueDate: '' }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Non-negotiable Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="non-negotiable"
              checked={task.isNonNegotiable}
              onChange={(e) => setTask(prev => ({ ...prev, isNonNegotiable: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="non-negotiable" className="text-sm font-medium text-gray-700">
              Non-negotiable
            </label>
          </div>
        </div>
      )}
    </form>
  );
} 