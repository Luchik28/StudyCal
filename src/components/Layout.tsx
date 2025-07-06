'use client';

import React, { useState, useRef } from 'react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { EventAnalytics } from './EventAnalytics';
import { SettingsModal } from './SettingsModal';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Settings } from 'lucide-react';

// Import with explicit file extensions to help TypeScript
import { DayCalendar } from './DayCalendar';
import { MonthlyCalendar } from './MonthlyCalendar';

export type CalendarView = 'day' | 'week' | 'month';

function SidebarList({
  title,
  placeholder,
  addButtonLabel,
  showBelowButton,
  belowButtonLabel,
}: {
  title: string;
  placeholder: string;
  addButtonLabel: string;
  showBelowButton?: boolean;
  belowButtonLabel?: string;
}) {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      setItems([...items, input.trim()]);
      setInput('');
      inputRef.current?.focus();
    }
  };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };
  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditValue(items[idx]);
  };
  const handleEditSave = (idx: number) => {
    setItems(items.map((item, i) => (i === idx ? editValue : item)));
    setEditingIndex(null);
    setEditValue('');
  };
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <div className="flex-1 overflow-y-auto mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center mb-1">
            {editingIndex === idx ? (
              <>
                <input
                  className="flex-1 border rounded px-2 py-1 text-sm mr-2"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => handleEditSave(idx)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSave(idx); }}
                  autoFocus
                />
                <button
                  className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                  onClick={() => handleEditSave(idx)}
                >Save</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{item}</span>
                <button
                  className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => handleEdit(idx)}
                >Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center mt-auto">
        <input
          ref={inputRef}
          className="flex-1 border rounded px-2 py-1 text-sm mr-2"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          onClick={handleAdd}
        >{addButtonLabel}</button>
      </div>
      {showBelowButton && belowButtonLabel && (
        <button className="mt-4 w-full py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium">
          {belowButtonLabel}
        </button>
      )}
    </div>
  );
}

export function Layout() {
  return (
    <SettingsProvider>
      <LayoutContent />
    </SettingsProvider>
  );
}

function LayoutContent() {
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };

  const handleDaySelected = (date: Date) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  const handleWeekChange = (weekDate: Date) => {
    setCurrentWeek(weekDate);
  };

  const handleMonthChange = (monthDate: Date) => {
    setCurrentMonth(monthDate);
  };

  const renderCalendar = () => {
    switch (currentView) {
      case 'day':
        return <DayCalendar selectedDate={selectedDate} />;
      case 'week':
        return <WeeklyCalendar onWeekChange={handleWeekChange} />;
      case 'month':
        return <MonthlyCalendar onDaySelected={handleDaySelected} onMonthChange={handleMonthChange} />;
      default:
        return <WeeklyCalendar onWeekChange={handleWeekChange} />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Fixed, no scrolling with calendar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 h-16 flex flex-col justify-center flex-shrink-0">
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
        <div className="flex-1 p-6 overflow-y-auto">
          {currentView === 'day' && (
            <SidebarList
              title="Todo today"
              placeholder="Add a task..."
              addButtonLabel="Add"
              showBelowButton
              belowButtonLabel="Add to my day"
            />
          )}
          {currentView === 'week' && (
            <SidebarList
              title="My goals for the week"
              placeholder="Add a goal..."
              addButtonLabel="Add"
              showBelowButton
              belowButtonLabel="Implement throughout the week."
            />
          )}
          {currentView === 'month' && (
            <SidebarList
              title="My goals"
              placeholder="Add a goal..."
              addButtonLabel="Add"
            />
          )}
        </div>
      </div>
      {/* Main Calendar Area - Independently scrollable */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Calendar Header with Settings */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-3 h-16 flex items-center justify-end flex-shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        </div>
        {/* Calendar Content - This area scrolls independently */}
        <div className="flex-1 overflow-hidden">
          {renderCalendar()}
        </div>
      </div>
      {/* Right Sidebar - Fixed, no scrolling with calendar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        <div className="flex-1 overflow-y-auto">
          <EventAnalytics 
            currentView={currentView}
            selectedDate={selectedDate}
            currentWeek={currentWeek}
            currentMonth={currentMonth}
          />
          <div className="p-6">
            <h4 className="text-md font-semibold mb-2">Suggestions for your schedule</h4>
            <div className="bg-gray-50 rounded p-4 text-gray-500 text-sm">[Suggestions go here]</div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
