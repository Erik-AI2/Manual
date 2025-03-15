'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';

interface MotivationalTimerProps {
  duration: number;
  onComplete: () => void;
  isActive: boolean;
  variant?: 'default' | 'compact';
  isRunningExternal?: boolean;
}

export default function MotivationalTimer({ 
  duration, 
  onComplete, 
  isActive,
  variant = 'default',
  isRunningExternal
}: MotivationalTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  // Effect to sync with external running state
  useEffect(() => {
    if (isRunningExternal !== undefined) {
      setIsRunning(isRunningExternal);
    }
  }, [isRunningExternal]);

  // Reset timer when duration changes or when becoming active
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Effect to reset timer when it becomes active again
  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
    }
  }, [isActive, duration]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onComplete();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning, onComplete, timeLeft]);

  // Stop timer if all tasks are complete
  useEffect(() => {
    if (!isActive) {
      setIsRunning(false);
    }
  }, [isActive]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!isActive) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsRunning(!isRunning);
          }}
          className="p-1 rounded-full hover:bg-blue-100 transition-colors"
        >
          {isRunning ? (
            <Pause className="w-4 h-4 text-blue-700" />
          ) : (
            <Play className="w-4 h-4 text-blue-700" />
          )}
        </button>
        <div className="font-mono text-blue-700">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-red-800 font-semibold">
            Complete your non-negotiables first
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsRunning(!isRunning);
              }}
              className="p-1 rounded-full hover:bg-red-100 transition-colors"
            >
              {isRunning ? (
                <Pause className="w-5 h-5 text-red-700" />
              ) : (
                <Play className="w-5 h-5 text-red-700" />
              )}
            </button>
            <div className="text-2xl font-mono text-red-700">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
        <div className={cn(
          "h-1 bg-red-200 rounded-full",
          "relative overflow-hidden"
        )}>
          <div 
            className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-1000"
            style={{ width: `${(timeLeft / duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
} 