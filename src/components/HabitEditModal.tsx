'use client';

import { useState } from 'react';
import { Habit } from '@/lib/types/task';
import { X } from 'lucide-react';

interface HabitEditModalProps {
  habit: Habit;
  onClose: () => void;
  onSave: (updates: Partial<Habit>) => void;
}

export default function HabitEditModal({ habit, onClose, onSave }: HabitEditModalProps) {
  const [editedHabit, setEditedHabit] = useState<Partial<Habit>>(habit);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayToggle = (day: number) => {
    const currentDays = editedHabit.frequency?.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setEditedHabit(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency!,
        daysOfWeek: newDays,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Habit</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={editedHabit.name}
              onChange={(e) => setEditedHabit(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select
              value={editedHabit.frequency?.type}
              onChange={(e) => setEditedHabit(prev => ({
                ...prev,
                frequency: {
                  ...prev.frequency!,
                  type: e.target.value as Habit['frequency']['type'],
                },
              }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {editedHabit.frequency?.type !== 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`p-2 rounded-full w-10 h-10 text-sm ${
                      editedHabit.frequency?.daysOfWeek?.includes(index)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={editedHabit.priority}
              onChange={(e) => setEditedHabit(prev => ({
                ...prev,
                priority: e.target.value as Habit['priority'],
              }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="flexible">Flexible</option>
              <option value="important">Important</option>
              <option value="non-negotiable">Non-negotiable</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
            <select
              value={editedHabit.timeOfDay}
              onChange={(e) => setEditedHabit(prev => ({
                ...prev,
                timeOfDay: e.target.value as Habit['timeOfDay'],
              }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(editedHabit);
                onClose();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 