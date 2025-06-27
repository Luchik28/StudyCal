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
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar</h2>
          
          {/* View Switching Buttons */}
          <div className="space-y-1">
            <button
              onClick={() => handleViewChange('day')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'day'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'week'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'month'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Later
            </button>
          </div>
        </div>
        
        {/* Additional left sidebar content will go here */}
        <div className="flex-1 p-4">
          {/* Placeholder for future content */}
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {renderCalendar()}
      </div>

      {/* Right Sidebar */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
        </div>
        
        {/* Additional right sidebar content will go here */}
        <div className="flex-1 p-4">
          {/* Placeholder for future content */}
        </div>
      </div>
    </div>
  );
}
