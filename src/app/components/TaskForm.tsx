'use client';

import { useState } from 'react';
import { addTask } from '@/lib/firebase/firebaseUtils';

export default function TaskForm({ projectId }: { projectId?: string }) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState('medium');
  const [isNonNegotiable, setIsNonNegotiable] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTask({
        description,
        dueDate,
        priority,
        isNonNegotiable,
        projectId,
      });
      // Clear form
      setDescription('');
      setDueDate(new Date());
      // Optionally refresh tasks list
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description"
        required
      />
      <input
        type="datetime-local"
        value={dueDate.toISOString().slice(0, 16)}
        onChange={(e) => setDueDate(new Date(e.target.value))}
        required
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">Non-Negotiable</span>
          <input
            type="checkbox"
            checked={isNonNegotiable}
            onChange={(e) => setIsNonNegotiable(e.target.checked)}
            className="checkbox checkbox-primary"
          />
        </label>
      </div>
      <button type="submit">Add Task</button>
    </form>
  );
} 