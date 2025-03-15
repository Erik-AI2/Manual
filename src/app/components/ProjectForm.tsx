'use client';

import { useState } from 'react';
import { addProject } from '@/lib/firebase/firebaseUtils';

export default function ProjectForm() {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addProject({
        name,
        color
      });
      // Clear form
      setName('');
      setColor('#000000');
      // Optionally refresh projects list
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        required
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <button type="submit">Create Project</button>
    </form>
  );
} 