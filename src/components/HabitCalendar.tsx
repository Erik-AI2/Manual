'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, isThisMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HabitCalendarProps {
  completedDates: string[];
  onToggleDate: (date: string) => void;
}

export default function HabitCalendar({ completedDates, onToggleDate }: HabitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get the first day of the month
  const monthStart = startOfMonth(currentMonth);
  // Get the last day of the month
  const monthEnd = endOfMonth(currentMonth);
  // Get the start of the first week
  const calendarStart = startOfWeek(monthStart);
  // Get the end of the last week
  const calendarEnd = endOfWeek(monthEnd);
  
  // Get all days in the calendar view
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateCompleted = (date: Date) => {
    return completedDates?.some(completedDate => 
      isSameDay(new Date(completedDate), date)
    ) || false;
  };

  const handleDateClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    onToggleDate(date.toISOString());
  };

  const getDateClasses = (date: Date) => {
    const isCompletedDay = isDateCompleted(date);
    const isCurrentMonth = isThisMonth(date);

    return `
      w-9 h-9 flex items-center justify-center
      text-sm font-medium transition-all duration-200
      rounded-full relative
      ${isCompletedDay ? 'bg-green-500 text-white hover:bg-green-600' : 'hover:bg-gray-100'}
      ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
      ${isToday(date) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    `;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4" onClick={e => e.stopPropagation()}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(prevMonth => {
            const newDate = new Date(prevMonth);
            newDate.setMonth(prevMonth.getMonth() - 1);
            return newDate;
          })}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h3 className="text-base font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(prevMonth => {
            const newDate = new Date(prevMonth);
            newDate.setMonth(prevMonth.getMonth() + 1);
            return newDate;
          })}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-9 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map(day => (
          <motion.button
            key={day.toISOString()}
            onClick={(e) => handleDateClick(e, day)}
            className={getDateClasses(day)}
            whileTap={{ scale: 0.95 }}
          >
            {format(day, 'd')}
            <AnimatePresence>
              {isDateCompleted(day) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Completion Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-4">
        <div>
          Completed {completedDates.length} times
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
} 