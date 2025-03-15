'use client';

import { useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';

export default function FirebaseDebug() {
  const { user } = useAuth();

  useEffect(() => {
    const testConnection = async () => {
      if (!user?.uid) return;
      
      try {
        console.log('[Debug] Testing Firestore connection...');
        const colRef = collection(db, 'users', user.uid, 'tasks');
        const snapshot = await getDocs(colRef);
        console.log('[Debug] Connection successful. Document count:', snapshot.size);
      } catch (error) {
        console.error('[Debug] Firestore connection error:', error);
      }
    };

    testConnection();
  }, [user]);

  return null;
} 