import { Task as GlobalTask } from '@/lib/types/task';

// Convert from the global Task type to component-specific types
export const adaptTask = {
  // For TaskItem component
  toTaskItemFormat: (task: GlobalTask) => ({
    id: task.id,
    title: task.text,
    description: '',
    dueDate: task.dueDate,
    priority: task.priority,
    isNonNegotiable: task.isNonNegotiable,
    completed: task.status === 'completed',
    projectId: task.projectId || undefined
  }),

  // For TaskPlanner component
  toTaskPlannerFormat: (task: GlobalTask) => ({
    id: task.id,
    description: task.text,
    dueDate: new Date(task.dueDate),
    isNonNegotiable: task.isNonNegotiable
  }),

  // Add more adapters as needed for other components
}; 