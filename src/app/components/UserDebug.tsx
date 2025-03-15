'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { getUserData } from '@/lib/firebaseUtils';

export default function UserDebug() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching user data for debug...'); // Debug log
        const tasks = await getUserData(user.uid, 'tasks');
        const projects = await getUserData(user.uid, 'projects');
        const habits = await getUserData(user.uid, 'habits');
        
        setUserData({
          tasks,
          projects,
          habits
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold">User Debug Info:</h3>
      <pre className="mt-2 text-sm">
        {JSON.stringify({
          uid: user.uid,
          email: user.email,
          collections: userData
        }, null, 2)}
      </pre>
    </div>
  );
} 