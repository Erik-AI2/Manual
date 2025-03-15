import { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  text: string;
  status: 'active' | 'completed';
  dueDate: string;
  isNonNegotiable: boolean;
  priority: 'non-negotiable' | 'high' | 'medium' | 'low';
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// This interface represents the raw data from Firestore
export interface FirestoreTask {
  description: string;
  createdAt: Timestamp;
  dueDate: Timestamp;
  isNonNegotiable: boolean;
  priority: 'low' | 'medium' | 'high';
  projectId: string | null;
  status: 'pending' | 'completed';
  updatedAt: Timestamp;
}

export interface Habit {
  id: string;
  name: string;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    timesPerWeek?: number;
  };
  isNonNegotiable: boolean;
  priority: 'important' | 'flexible';
  streak: {
    current: number;
    longest: number;
    lastCompleted: string;
  };
  completions: string[]; // Array of ISO date strings when habit was completed
  category?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  timeEstimate?: number;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

export interface NonNegotiable {
  id: string;
  title: string;
  completed: boolean;
  type: 'habit' | 'task';
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string;
  isComplete: boolean;
  nonNegotiables: NonNegotiable[];
  energyReport?: {
    revenueGenerating: number;
    forceMultipliers: number;
    maintenance: number;
  };
  tomorrowsPlan?: {
    mainTask: string;
    forceMultiplier: string;
  };
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

export interface ProjectData {
  name: string;
  color: string;
}

export interface Project extends ProjectData {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  timeframe: 'short' | 'medium' | 'long';
  createdAt: string;
  updatedAt: string;
} 