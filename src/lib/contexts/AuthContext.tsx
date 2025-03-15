"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useRouter } from 'next/navigation';
import { createUserDocument } from '../firebaseUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  signUp: async () => { throw new Error("signUp method not implemented"); },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      if (user) {
        try {
          console.log('Attempting to create user document for:', user.uid);
          await createUserDocument(user.uid, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString(),
          });
          setUser(user);
        } catch (error) {
          console.error('Error in auth state change:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google sign in');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign in successful:', result.user.email);
      
      await createUserDocument(result.user.uid, {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await createUserDocument(user.uid, {
      email: user.email,
      createdAt: new Date().toISOString()
    });
    
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
