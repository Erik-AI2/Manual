'use client';

import { useState } from 'react';
import { addProject } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';
import { Project } from '@/lib/types/task';

interface ProjectFormProps {
  onProjectAdded?: (project: Project) => void;
  onClose: () => void;
}

export default function ProjectForm({ onProjectAdded }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      const newProject = await addProject(user.uid, {
        name,
        color,
      });
      
      // Clear form
      setName('');
      setColor('#000000');
      
      // Pass the new project data to the parent
      if (onProjectAdded) {
        onProjectAdded(newProject);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-20"
        />
        <span className="text-sm text-gray-600">Project color</span>
      </div>
      <button
        type="submit"
        disabled={!name.trim() || !user}
        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Create Project
      </button>
    </form>
  );
} 