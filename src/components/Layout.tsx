'use client';

import React, { useState } from 'react';
import { WeeklyCalendar } from './WeeklyCalendar';

// Import with explicit file extensions to help TypeScript
import { DayCalendar } from './DayCalendar';
import { MonthlyCalendar } from './MonthlyCalendar';

export type CalendarView = 'day' | 'week' | 'month';

export function Layout() {
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };

  const handleDaySelected = (date: Date) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  const renderCalendar = () => {
    switch (currentView) {
      case 'day':
        return <DayCalendar selectedDate={selectedDate} />;
      case 'week':
        return <WeeklyCalendar />;
      case 'month':
        return <MonthlyCalendar onDaySelected={handleDaySelected} />;
      default:
        return <WeeklyCalendar />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">          
          {/* Dynamic View Switching Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleViewChange('day')}
              className={`text-lg font-semibold transition-all duration-300 ease-out group ${
                currentView === 'day'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-400 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`text-lg font-semibold transition-all duration-300 ease-out whitespace-nowrap group ${
                currentView === 'week'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-400 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`text-lg font-semibold transition-all duration-300 ease-out group ${
                currentView === 'month'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-400 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold'
              }`}
            >
              Later
            </button>
          </div>
        </div>
        
        {/* Additional left sidebar content will go here */}
        <div className="flex-1 p-6">
          {/* Placeholder for future content */}
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {renderCalendar()}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
        </div>
        
        {/* Additional right sidebar content will go here */}
        <div className="flex-1 p-6">
          {/* Placeholder for future content */}
        </div>
      </div>
    </div>
  );
}
