import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DailyPlan, Task } from '../types/task';
import { convertTimestamps, getUserCollectionPath } from './firestoreUtils';

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = async (userId: string, collectionName: string, data: any) => {
  const collectionRef = collection(db, 'users', userId, collectionName);
  
  // Convert ISO date strings to Firestore Timestamps
  const processedData = {
    ...data,
    userId,
    createdAt: Timestamp.fromDate(new Date(data.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(data.updatedAt)),
    // Only convert dueDate if it exists
    ...(data.dueDate && { dueDate: Timestamp.fromDate(new Date(data.dueDate)) })
  };

  return addDoc(collectionRef, processedData);
};

export const getDocuments = async (userId: string, collectionName: string) => {
  try {
    const collectionRef = collection(db, 'users', userId, collectionName);
    const q = query(collectionRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (userId: string, collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, 'users', userId, collectionName, docId);
    
    // Convert dates to Timestamps if needed
    const processedData = {
      ...data,
      // Always add an updatedAt timestamp, even if not provided in the data
      updatedAt: Timestamp.fromDate(new Date())
    };

    await updateDoc(docRef, processedData);
    return true;
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (userId: string, collectionName: string, docId: string) => {
  const docRef = doc(db, 'users', userId, collectionName, docId);
  return deleteDoc(docRef);
};

export async function getDailyPlan(userId: string, date: string): Promise<DailyPlan | null> {
  const docRef = doc(db, 'dailyPlans', `${userId}_${date}`);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as DailyPlan : null;
}

export async function getNonNegotiableTasks(userId: string): Promise<Task[]> {
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const q = query(
    tasksRef,
    where('isNonNegotiable', '==', true),
    where('status', '==', 'active')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Task));
}

export async function createDailyPlan(userId: string, date: string): Promise<DailyPlan> {
  const nonNegotiableTasks = await getNonNegotiableTasks(userId);
  
  const newPlan: DailyPlan = {
    id: `${userId}_${date}`,
    userId,
    date,
    nonNegotiables: nonNegotiableTasks.map(task => ({
      id: task.id,
      title: task.text,
      completed: task.status === 'completed',
      type: 'task'
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(doc(db, 'dailyPlans', newPlan.id), newPlan);
  return newPlan;
}

export async function updateDailyPlan(plan: Partial<DailyPlan> & { id: string }): Promise<void> {
  const updateData = {
    ...plan,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(doc(db, 'dailyPlans', plan.id), updateData);
}

export async function updateTaskStatus(userId: string, taskId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
    status: completed ? 'completed' : 'active',
    updatedAt: new Date().toISOString()
  });
}

export const getTodaysTasks = async (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    console.log('Getting tasks for user:', userId);

    const tasksRef = collection(db, 'users', userId, 'tasks');
    
    // Simplify the query to avoid needing a composite index
    // Just get all tasks
    const q = query(tasksRef);
    
    const querySnapshot = await getDocs(q);
    console.log('Total tasks in collection:', querySnapshot.size);

    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter for non-negotiable tasks due today in JavaScript
    // Include both completed and non-completed tasks
    const tasks = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to Date
        let dueDate = null;
        if (data.dueDate) {
          dueDate = data.dueDate instanceof Timestamp 
            ? data.dueDate.toDate() 
            : new Date(data.dueDate);
        }

        return {
          id: doc.id,
          text: data.text || data.description,
          status: data.status || 'active',
          dueDate: dueDate,
          isNonNegotiable: data.isNonNegotiable || false,
          priority: data.priority || 'medium',
          projectId: data.projectId || null,
          timeEstimate: data.timeEstimate,
          userId: userId
        };
      })
      .filter(task => {
        // Skip tasks without due dates
        if (!task.dueDate) {
          return false;
        }
        
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        // Only include tasks that are:
        // 1. Due today
        // 2. Non-negotiable
        // (Include both completed and non-completed)
        return taskDate >= today && 
               taskDate < tomorrow && 
               task.isNonNegotiable === true;
      });

    console.log('Final filtered today\'s non-negotiable tasks (including completed):', tasks);
    return tasks;
  } catch (error) {
    console.error('Error getting today\'s tasks:', error);
    throw error;
  }
};

// Update the getTodaysHabits function to properly handle completion state
export const getTodaysHabits = async (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const habits = await getDocuments(userId, 'habits');
    const today = new Date();

    return habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      isNonNegotiable: habit.isNonNegotiable || false,
      priority: habit.priority || 'flexible',
      timeEstimate: habit.timeEstimate,
      isCompletedToday: habit.completions?.some((date: string) => 
        isSameDay(new Date(date), today)
      ) || false,
      frequency: habit.frequency || { type: 'daily' },
      completions: habit.completions || []
    }));
  } catch (error) {
    console.error('Error getting today\'s habits:', error);
    throw error;
  }
};

// Add a helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

interface TaskData {
  description: string;
  dueDate: Date;
  priority: string;
  isNonNegotiable: boolean;
  projectId?: string;
  status?: 'pending' | 'completed';
}

interface ProjectData {
  name: string;
  color: string;
}

export const addProject = async (userId: string, projectData: ProjectData) => {
  try {
    const projectsRef = collection(db, 'users', userId, 'projects');
    const newProject = {
      ...projectData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(projectsRef, newProject);
    return {
      id: docRef.id,
      ...projectData,
      userId,
      createdAt: newProject.createdAt.toDate().toISOString(),
      updatedAt: newProject.updatedAt.toDate().toISOString()
    };
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    const projectsRef = collection(db, 'users', userId, 'projects');
    const querySnapshot = await getDocs(projectsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const addTask = async (userId: string, text: string) => {
  try {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const now = new Date();
    // Set to start of current day to ensure it matches our "today" filtering
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timestamp = Timestamp.fromDate(today);
    
    console.log('Adding new task with data:', {
      text,
      dueDate: today.toISOString(),
      timestamp,
      userId
    });

    const newTask = {
      text: text,
      createdAt: Timestamp.fromDate(now),
      dueDate: timestamp, // Explicitly set to today
      isNonNegotiable: false,
      priority: 'medium',
      projectId: null,
      status: 'active',
      updatedAt: Timestamp.fromDate(now),
      userId: userId
    };

    const docRef = await addDoc(tasksRef, newTask);
    console.log('Task added successfully:', docRef.id);
    
    return { 
      id: docRef.id, 
      ...newTask,
      dueDate: today.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

export const getTasks = async (userId: string) => {
  try {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const querySnapshot = await getDocs(tasksRef);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Task;
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>) => {
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (userId: string, taskId: string) => {
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const addHabit = async (habitData: { 
  title: string; 
  frequency: string;
}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const habitsRef = collection(db, 'users', user.uid, 'habits');
  return addDoc(habitsRef, {
    ...habitData,
    streak: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const getHabits = async (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const habits = await getDocuments(userId, 'habits');
    return habits.map(habit => ({
      ...habit,
      frequency: habit.frequency || { type: 'daily' },
      streak: habit.streak || 0,
      completions: habit.completions || [],
    }));
  } catch (error) {
    console.error('Error getting habits:', error);
    throw error;
  }
};

export const getTasksByProject = async (userId: string, projectId?: string) => {
  const tasksRef = collection(db, 'users', userId, 'tasks');
  let q;
  
  if (projectId) {
    q = query(tasksRef, where('projectId', '==', projectId));
  } else {
    q = query(tasksRef, where('projectId', '==', null));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dueDate: doc.data().dueDate.toDate()
  }) as Task);
};

export class FirestoreError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FirestoreError';
  }
}

export const fetchTasks = async (userId: string): Promise<Task[]> => {
  console.log('[Firestore] Starting task fetch for user:', userId);
  if (!userId) {
    console.error('[Firestore] No user ID provided for task fetch');
    throw new FirestoreError('User ID is required for fetching tasks');
  }

  try {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    console.log('[Firestore] Collection path:', tasksRef.path);
    
    const querySnapshot = await getDocs(tasksRef);
    console.log(`[Firestore] Found ${querySnapshot.size} tasks`);
    
    const tasks = querySnapshot.docs.map(doc => {
      console.log('[Firestore] Processing document:', doc.id);
      const data = doc.data();
      const converted = convertTimestamps(data);
      console.log('[Firestore] Converted data:', converted);
      
      return {
        id: doc.id,
        ...converted,
        userId,
      } as Task;
    });
    
    console.log('[Firestore] Final tasks array:', tasks);
    return tasks;
  } catch (error) {
    console.error('[Firestore] Error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new FirestoreError(
      'Failed to fetch tasks',
      error instanceof Error ? error.message : undefined
    );
  }
};

export const addNonNegotiableTask = async (userId: string, taskData: {
  text: string;
  dueDate: Date;
  projectId?: string;
}) => {
  try {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    
    const newTask = {
      text: taskData.text,
      dueDate: Timestamp.fromDate(taskData.dueDate), // Convert Date to Timestamp
      isNonNegotiable: true,
      status: 'active',
      priority: 'important',
      projectId: taskData.projectId || null,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      userId: userId
    };

    console.log('Adding new task:', newTask);
    const docRef = await addDoc(tasksRef, newTask);
    
    return {
      id: docRef.id,
      ...newTask,
      dueDate: taskData.dueDate.toISOString(), // Convert back to ISO string for the return value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error adding non-negotiable task:', error);
    throw error;
  }
};

// Add new function to store hours
export const logWorkHours = async (userId: string, hours: number) => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    await addDoc(collection(db, 'users', userId, 'hours'), {
      date: dateStr,
      hours: hours,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error logging work hours:', error);
    throw error;
  }
};

// Add new function to store daily lessons
export const logDailyLessons = async (userId: string, lessons: string) => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    await addDoc(collection(db, 'users', userId, 'lessons'), {
      date: dateStr,
      lessons: lessons,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error logging daily lessons:', error);
    throw error;
  }
};

/**
 * Updates a user's daily reflection data in Firebase
 * @param userId - The user's ID
 * @param reflection - Object containing date, hoursWorked, and lessons
 */
export const updateUserReflection = async (
  userId: string, 
  reflection: { 
    date: string; 
    hoursWorked: number; 
    lessons: string;
  }
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const reflectionRef = doc(userRef, 'reflections', reflection.date);
    
    await setDoc(reflectionRef, {
      hoursWorked: reflection.hoursWorked,
      lessons: reflection.lessons,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user reflection:', error);
    throw error;
  }
};
