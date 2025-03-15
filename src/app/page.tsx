"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Tasks from './components/Tasks';
import UserDebug from './components/UserDebug';
import TaskInput from './components/TaskInput';
import { addDocument } from '@/lib/firebase/firebaseUtils';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showCompleted, setShowCompleted] = useState(false);
  const [hasProvenOffer, setHasProvenOffer] = useState<boolean | null>(null);
  const [workPriorities, setWorkPriorities] = useState<string>('');

  useEffect(() => {
    if (user) {
      router.push('/review');
    }
  }, [user, router]);

  const handleAddTask = async (text: string) => {
    if (!user?.uid) return;
    
    try {
      await addDocument(user.uid, 'tasks', {
        text: text.trim(),
        status: 'active',
        projectId: null,
        dueDate: null,
        priority: 'medium',
        isNonNegotiable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleCompleteReview = () => {
    // Save review data, potentially including workPriorities if hasProvenOffer is true
    const reviewData = {
      hasProvenOffer,
      ...(hasProvenOffer ? { workPriorities } : {}),
      // ... other review data
    };
    
    // Call API or update state to mark review as complete
    completeReview(reviewData);
    
    // Navigate or show completion message
    // ... existing completion logic ...
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <UserDebug />
      <TaskInput onSubmit={handleAddTask} />
      <Tasks />
      
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 py-3 px-4 flex items-center">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
          aria-label={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
        >
          <div className="w-5 h-5 border border-gray-400 rounded flex items-center justify-center bg-white">
            {showCompleted && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span>Show completed</span>
        </button>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Do you have a proven offer that people are actively buying?</h3>
        <div className="flex gap-4">
          <button
            className="flex-1 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
            onClick={() => setHasProvenOffer(true)}
          >
            YES
          </button>
          <button
            className="flex-1 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            onClick={() => setHasProvenOffer(false)}
          >
            NO
          </button>
        </div>
      </div>

      {hasProvenOffer === true && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">What should you be working on to maximize results?</h3>
          <textarea
            className="w-full p-3 border rounded-md"
            rows={4}
            placeholder="List your high-impact priorities here..."
            value={workPriorities}
            onChange={(e) => setWorkPriorities(e.target.value)}
          />
        </div>
      )}

      {hasProvenOffer === false && (
        <div className="mt-6 p-4 border rounded-lg bg-amber-50">
          <h3 className="text-lg font-semibold mb-2">Action Needed:</h3>
          <p className="mb-4">Focus on validating your offer before moving forward. Consider:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Speaking with potential customers</li>
            <li>Creating a small test offer</li>
            <li>Gathering feedback on your product/service</li>
          </ul>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button 
          className="px-6 py-3 border rounded-md hover:bg-gray-100 transition"
          onClick={handlePrevious}
        >
          Previous
        </button>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={handleCompleteReview}
        >
          Complete Review
        </button>
      </div>
    </div>
  );
}