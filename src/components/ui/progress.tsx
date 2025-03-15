"use client";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full ${className}`}>
      <div
        className="bg-blue-600 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%" }}
      />
    </div>
  );
} 