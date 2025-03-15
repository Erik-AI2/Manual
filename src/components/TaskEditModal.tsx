import { Task, Project } from '@/lib/types/task';
import { format } from 'date-fns';
import { Star, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TaskEditModalProps {
  task: Task | null;
  projects: Project[];
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function TaskEditModal({
  task,
  projects,
  onClose,
  onSave,
  onDelete
}: TaskEditModalProps) {
  if (!task) {
    return null;
  }

  const [title, setTitle] = useState(task.text);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [selectedProject, setSelectedProject] = useState(task.projectId || '');
  const [isNonNegotiable, setIsNonNegotiable] = useState(task.isNonNegotiable || false);

  const handleSave = async () => {
    await onSave({
      text: title,
      description,
      dueDate,
      projectId: selectedProject || null,
      isNonNegotiable,
      priority: task.priority,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Task title"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
            placeholder="Add description..."
          />

          <h3 className="font-medium">Due Date</h3>
          <div className="flex gap-2">
            <button 
              className={cn(
                "px-4 py-2 rounded-full text-sm",
                "bg-blue-50 text-blue-600"
              )}
            >
              Today
            </button>
            <button className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50">
              Tomorrow
            </button>
            <button className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50">
              Next Week
            </button>
            <button className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50">
              No Date
            </button>
          </div>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-gray-600"
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Project Selection */}
            <div>
              <h3 className="font-medium mb-2">Project</h3>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-gray-600"
              >
                <option value="">No Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selection */}
            <div>
              <h3 className="font-medium mb-2">Priority</h3>
              <select
                value={task.priority}
                onChange={(e) => onSave({ priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 border rounded-md text-gray-600"
              >
                <option value="flexible">Medium</option>
                <option value="important">High</option>
              </select>
            </div>
          </div>

          {/* Non-negotiable Toggle */}
          <button
            onClick={() => setIsNonNegotiable(!isNonNegotiable)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
              isNonNegotiable ? "bg-purple-50 text-purple-600" : "text-gray-600"
            )}
          >
            <Star className="w-4 h-4" fill={isNonNegotiable ? 'currentColor' : 'none'} />
            <span>Non-negotiable</span>
            {isNonNegotiable && (
              <span className="text-xs text-gray-500">This task cannot be rescheduled</span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 