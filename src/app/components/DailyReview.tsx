// This file contains examples of how to display non-negotiable tasks
// The following is an example of how to display non-negotiable tasks:
/*
<div>
  <h3>Today's Non-Negotiables</h3>
  {tasks.map(task => (
    <TaskItem key={task.id} task={task} />
  ))}
</div>
*/

// And here's how to modify it to filter for today's non-negotiables:
/*
<div>
  <h3>Today's Non-Negotiables</h3>
  {tasks
    .filter(task => isToday(new Date(task.dueDate)) && task.isNonNegotiable === true)
    .map(task => (
      <TaskItem key={task.id} task={task} />
    ))
  }
</div>
*/

// Actual component implementation
import React from 'react';
import { format } from 'date-fns';

interface TaskProps {
  id: string;
  text: string;
  isCompleted: boolean;
  isNonNegotiable: boolean;
  dueDate: string;
}

interface DailyReviewProps {
  tasks: TaskProps[];
}

export default function DailyReview({ tasks }: DailyReviewProps) {
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Filter tasks for today's non-negotiables
  const todaysNonNegotiables = tasks
    .filter(task => task.isNonNegotiable && isToday(new Date(task.dueDate)))
    .sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-4">Today's Non-Negotiables</h2>
      
      {todaysNonNegotiables.length > 0 ? (
        <ul className="space-y-2">
          {todaysNonNegotiables.map(task => (
            <li key={task.id} className="flex items-center gap-3 p-2 rounded bg-gray-50">
              <input 
                type="checkbox" 
                checked={task.isCompleted} 
                className="w-5 h-5 accent-purple-600"
              />
              <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                {task.text}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No non-negotiable tasks for today.</p>
      )}
    </div>
  );
} 