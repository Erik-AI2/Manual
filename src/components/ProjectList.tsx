'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, Trash2, Edit2 } from 'lucide-react';
import { addDocument, getDocuments, deleteDocument, updateDocument, getProjects, getTasks } from '@/lib/firebase/firebaseUtils';
import { Project, Task } from '@/lib/types/task';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import ProjectForm from './ProjectForm';
import React from 'react';

// Predefined colors for projects
const PROJECT_COLORS = [
  { name: 'Berry Red', value: '#b8255f' },
  { name: 'Red', value: '#db4035' },
  { name: 'Orange', value: '#ff9933' },
  { name: 'Yellow', value: '#fad000' },
  { name: 'Olive Green', value: '#afb83b' },
  { name: 'Green', value: '#7ecc49' },
  { name: 'Teal', value: '#299438' },
  { name: 'Blue', value: '#4573d2' },
  { name: 'Purple', value: '#a970ff' },
  { name: 'Magenta', value: '#e05194' },
  { name: 'Slate', value: '#808080' }
];

interface ProjectToDelete {
  id: string;
  name: string;
}

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [showEditColor, setShowEditColor] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectToDelete | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const currentProject = searchParams.get('project');

  // Memoize the fetchData function to prevent recreating it on every render
  const fetchData = React.useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const fetchedProjects = await getProjects(user.uid);
      const fetchedTasks = await getTasks(user.uid);
      
      setProjects(fetchedProjects);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Only fetch data when component mounts or user changes
  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [fetchData]); // Only depend on the memoized fetchData function

  const getActiveTaskCount = (projectId?: string) => {
    return tasks.filter(task => {
      const isActive = task.status === 'active';
      
      if (projectId === 'no-project') {
        return isActive && (!task.projectId || task.projectId === ''); // Include empty string check
      } else if (projectId) {
        return isActive && task.projectId === projectId;
      }
      
      return isActive;
    }).length;
  };

  const handleProjectClick = (projectId?: string) => {
    if (projectId) {
      router.push(`/tasks?project=${projectId}`);
    } else {
      router.push('/tasks');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      if (!user?.uid) return;

      await addDocument(user.uid, 'projects', {
        name: newProjectName.trim(),
        color: selectedColor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.uid
      });
      setNewProjectName('');
      setSelectedColor(PROJECT_COLORS[0].value);
      setIsCreating(false);
      await fetchData();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleEditProject = async (projectId: string, newColor: string) => {
    if (!user?.uid) return;
    
    try {
      await updateDocument(user.uid, 'projects', projectId, {
        color: newColor,
        updatedAt: new Date().toISOString(),
      });
      
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, color: newColor, updatedAt: new Date().toISOString() }
          : project
      ));
      setShowEditColor(null);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleProjectNameEdit = async (projectId: string, newName: string) => {
    if (!user?.uid || !newName.trim()) return;
    
    try {
      await updateDocument(user.uid, 'projects', projectId, {
        name: newName.trim(),
        updatedAt: new Date().toISOString(),
      });
      
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, name: newName.trim(), updatedAt: new Date().toISOString() }
          : project
      ));
      setEditingProjectId(null);
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  };

  const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    setProjectToDelete({ id: projectId, name: projects.find(p => p.id === projectId)?.name || '' });
  };

  const handleDeleteProject = async (project: ProjectToDelete) => {
    if (!user?.uid) return;
    try {
      await deleteDocument(user.uid, 'projects', project.id);
      // Update tasks to remove project reference
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      for (const task of projectTasks) {
        await updateDocument(user.uid, 'tasks', task.id, {
          projectId: null,
          updatedAt: new Date().toISOString()
        });
      }
      await fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Update handleProjectAdded to avoid fetching all projects
  const handleProjectAdded = async (newProject: Project) => {
    if (!user?.uid) return;
    
    // Update state locally with the new project
    setProjects(prev => [...prev, newProject]);
    setShowForm(false);
  };

  if (loading) {
    return <div className="animate-pulse">Loading projects...</div>;
  }

  return (
    <div className="h-full bg-white border-r">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Projects</h2>
        
        {/* All Tasks option */}
        <div
          onClick={() => handleProjectClick()}
          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
            !currentProject ? 'bg-gray-100' : ''
          }`}
        >
          <span>All Tasks</span>
          <span className="text-sm text-gray-500">{getActiveTaskCount()}</span>
        </div>

        {/* No Project option */}
        <div
          onClick={() => handleProjectClick('no-project')}
          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
            currentProject === 'no-project' ? 'bg-gray-100' : ''
          }`}
        >
          <span>No Project</span>
          <span className="text-sm text-gray-500">{getActiveTaskCount('no-project')}</span>
        </div>

        {/* Project list - Modified to handle editing */}
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
              currentProject === project.id ? 'bg-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {editingProjectId === project.id ? (
                <input
                  type="text"
                  value={editingProjectName}
                  onChange={(e) => setEditingProjectName(e.target.value)}
                  onBlur={() => {
                    if (editingProjectName.trim()) {
                      handleProjectNameEdit(project.id, editingProjectName);
                    }
                    setEditingProjectId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editingProjectName.trim()) {
                      handleProjectNameEdit(project.id, editingProjectName);
                    } else if (e.key === 'Escape') {
                      setEditingProjectId(null);
                    }
                  }}
                  className="flex-1 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingProjectId(project.id);
                    setEditingProjectName(project.name);
                  }}
                  className="flex-1"
                >
                  {project.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{getActiveTaskCount(project.id)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToDelete({ id: project.id, name: project.name });
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Add Project button */}
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 flex items-center gap-2 text-blue-500 hover:text-blue-600"
        >
          <Plus size={16} />
          <span>Add Project</span>
        </button>

        {/* Project form modal */}
        {showForm && (
          <ProjectForm
            onClose={() => setShowForm(false)}
            onProjectAdded={handleProjectAdded}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Project?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{projectToDelete.name}"? All tasks will be moved to "No Project".
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteProject(projectToDelete);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 