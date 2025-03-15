import { useAuth } from '@/lib/hooks/useAuth';
import { getUserData, addUserDocument } from '@/lib/firebaseUtils';

const YourComponent = () => {
  const { user } = useAuth();
  
  const fetchUserTasks = async () => {
    if (!user) return;
    const tasks = await getUserData(user.uid, 'tasks');
    // Handle tasks data
  };

  const addNewTask = async (taskData: any) => {
    if (!user) return;
    await addUserDocument(user.uid, 'tasks', taskData);
    // Handle success
  };

  // ... rest of component code
}; 