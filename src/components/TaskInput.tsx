'use client';

import { useState, KeyboardEvent } from 'react';
import { addDocument } from '@/lib/firebase/firebaseUtils';
import { Calendar, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function TaskInput() {
  const [text, setText] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState('medium');
  const { user } = useAuth();

  const handleKeyPress = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim() && user?.uid) {
      try {
        await addDocument(user.uid, 'tasks', {
          text: text.trim(),
          status: 'active',
          projectId: projectId || null,
          dueDate: dueDate || null,
          priority,
          isNonNegotiable: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setText('');
        setDueDate('');
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 border-b">
      <input
        type="text"
        placeholder="Press Enter to add task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 bg-transparent outline-none"
      />
      
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-transparent border rounded px-2 py-1 text-sm"
        >
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
        
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-transparent border rounded px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
} 