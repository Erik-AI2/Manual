'use client';

import { useState, useEffect } from 'react';
import TaskInput from '@/app/components/TaskInput';
import TaskList from '@/components/TaskList';
import ProjectList from '@/components/ProjectList';
import { getProjects, getTasks } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Project, Task } from '@/lib/types/task';

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user?.uid) return;
    try {
      const fetchedTasks = await getTasks(user.uid);
      console.log('Fetched tasks:', fetchedTasks);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.uid) return;
      try {
        const fetchedProjects = await getProjects(user.uid);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
    fetchTasks();
  }, [user?.uid]);

  const handleTaskAdded = async () => {
    await fetchTasks();
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar with projects */}
      <div className="w-64 border-r bg-gray-50">
        <ProjectList />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b">
          <h1 className="text-xl font-semibold p-4">Tasks</h1>
        </div>
        <div className="p-4">
          <TaskInput 
            projects={projects} 
            onTaskAdded={handleTaskAdded}
          />
        </div>
        <TaskList 
          tasks={tasks}
          projects={projects}
          onTasksChanged={fetchTasks}
        />
      </div>
    </div>
  );
} 