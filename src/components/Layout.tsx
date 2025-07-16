'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { EventAnalytics } from './EventAnalytics';
import { SettingsModal } from './SettingsModal';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { useModelLoader } from '@/hooks/useModelLoader';
import { useEvents } from '@/contexts/EventsContext';
import { taskScheduler, Task } from '@/utils/taskScheduler';
import { classifyEvent } from '@/utils/eventClassification';
import { startOfWeek } from 'date-fns';
import { Settings, Clock, Calendar, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

// Import with explicit file extensions to help TypeScript
import { DayCalendar } from './DayCalendar';
import { MonthlyCalendar } from './MonthlyCalendar';
import { LongTermGoals } from './LongTermGoals';
import { Suggestions } from './Suggestions';

export type CalendarView = 'day' | 'week' | 'month';

function TaskList({
  title,
  placeholder,
  addButtonLabel,
  scheduleButtonLabel,
  view,
  currentDate,
}: {
  title: string;
  placeholder: string;
  addButtonLabel: string;
  scheduleButtonLabel?: string;
  view: CalendarView;
  currentDate: Date;
}) {
  // Category and subcategory options (matching the AI classification maps)
  const categories = ['Work', 'Personal', 'Social', 'Health', 'Education', 'Travel'];
  const subcategories = [
    'Activity', 'Appointment', 'Chore/Errand', 'Class', 'Event',
    'Extra-Curricular', 'Gathering', 'Logistics', 'Meeting', 'Other',
    'Social/Family', 'Study Session', 'Task/Project Work', 'Test/Exam', 'Trip'
  ];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const { events, addEvent } = useEvents();

  const handleAdd = async () => {
    if (input.trim()) {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        title: input.trim(),
        estimatedDuration: 60, // Default 1 hour
        priority: 'low',
        // No manual category - let AI classify automatically
      };

      // Immediately classify the task
      try {
        // Create a minimal Event object for classification
        const tempEvent = {
          id: 'temp',
          title: input.trim(),
          description: '',
          startTime: new Date(),
          endTime: new Date(),
          color: '#3b82f6',
          dayOfWeek: 0
        };
        
        const classification = await classifyEvent(tempEvent);
        if (classification) {
          newTask.category = classification.category;
          newTask.subcategory = classification.subcategory;
        }
      } catch (error) {
        console.warn('Failed to classify task:', error);
        // Continue without classification
      }

      setTasks([...tasks, newTask]);
      setInput('');
      
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditValue(tasks[idx].title);
  };

  const handleEditSave = (idx: number) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, title: editValue } : task
    ));
    setEditingIndex(null);
    setEditValue('');
  };

  const handleUpdateDuration = (idx: number, duration: number) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, estimatedDuration: duration } : task
    ));
  };

  const handleUpdateCategory = (idx: number, category: string) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, category } : task
    ));
  };

  const handleUpdateSubcategory = (idx: number, subcategory: string) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, subcategory } : task
    ));
  };

  const handleRemoveTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleScheduleTasks = async () => {
    if (tasks.length === 0) return;
    
    setIsScheduling(true);
    try {
      let scheduledEvents;
      
      if (view === 'day') {
        // Schedule for today
        scheduledEvents = await taskScheduler.scheduleTasks(
          tasks,
          currentDate,
          events
        );
      } else if (view === 'week') {
        // Schedule for the week
        const weekStart = startOfWeek(currentDate);
        const weekEvents = await taskScheduler.scheduleTasksForWeek(
          tasks,
          weekStart,
          events
        );
        
        // Flatten the week events
        scheduledEvents = Object.values(weekEvents).flat();
      } else {
        // For month view, schedule across the next 7 days
        const weekEvents = await taskScheduler.scheduleTasksForWeek(
          tasks,
          currentDate,
          events
        );
        scheduledEvents = Object.values(weekEvents).flat();
      }

      // Add scheduled events to the calendar
      for (const event of scheduledEvents) {
        // Find the original task to get its classification
        const originalTask = tasks.find(task => task.title === event.title);
        addEvent(
          event.title, 
          event.startTime, 
          event.endTime, 
          event.description,
          originalTask?.category,
          originalTask?.subcategory
        );
      }

      // Clear the task list after successful scheduling
      setTasks([]);
      
    } catch (error) {
      console.error('Failed to schedule tasks:', error);
      alert('Failed to schedule tasks. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold mb-2 text-gray-900 font-mono">{title}</h3>
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {tasks.map((task, idx) => (
          <div key={task.id} className="border rounded-lg p-3 bg-white shadow-sm">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                {editingIndex === idx ? (
                  <input
                    className="flex-1 border rounded px-2 py-1 text-sm text-gray-900 mr-3"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(idx)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSave(idx); }}
                    autoFocus
                  />
                ) : (
                  <span 
                    className="text-sm font-medium flex-1 text-gray-900 cursor-text hover:bg-gray-50 hover:border hover:border-gray-300 hover:rounded px-1 py-0.5 -mx-1 -my-0.5 transition-all mr-3"
                    onClick={() => handleEdit(idx)}
                  >
                    {task.title}
                  </span>
                )}
                <div className="flex gap-1">
                  <button
                    className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    onClick={() => handleRemoveTask(idx)}
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-gray-600" />
                  <select
                    value={task.estimatedDuration}
                    onChange={(e) => handleUpdateDuration(idx, parseInt(e.target.value))}
                    className="border rounded px-1 py-0.5 text-xs text-gray-900"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
                
                {/* Category dropdown */}
                <select
                  value={task.category || ''}
                  onChange={(e) => handleUpdateCategory(idx, e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs text-gray-900 bg-blue-50"
                >
                  <option value="">Category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Subcategory dropdown */}
                <select
                  value={task.subcategory || ''}
                  onChange={(e) => handleUpdateSubcategory(idx, e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs text-gray-900 bg-green-50"
                >
                  <option value="">Type...</option>
                  {subcategories.map(subcat => (
                    <option key={subcat} value={subcat}>{subcat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              ref={inputRef}
              className="flex-1 border rounded px-2 py-1 text-sm mr-2 text-gray-900"
              placeholder={placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={handleAdd}
            >
              {addButtonLabel}
            </button>
          </div>
        </div>
        
        {scheduleButtonLabel && tasks.length > 0 && (
          <button 
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleScheduleTasks}
            disabled={isScheduling}
          >
            {isScheduling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Scheduling...
              </>
            ) : (
              <>
                <Calendar size={16} />
                {scheduleButtonLabel}
              </>
            )}
          </button>
        )}
      </div>
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
  
  // Mobile sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  
  const { googleCalendarAuthenticated, isLoading } = useSettings();
  
  // Load TensorFlow model on app startup
  const { isModelLoaded, isLoading: modelLoading, error: modelError } = useModelLoader();

  // Log status when components are ready
  useEffect(() => {
    if (!isLoading && !modelLoading) {

      if (modelError) {
        console.error('Model loading error:', modelError);
      }
    }
  }, [googleCalendarAuthenticated, isLoading, isModelLoaded, modelLoading, modelError]);

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };

  const handleDaySelected = (date: Date) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  const handleWeekChange = useCallback((weekDate: Date) => {
    setCurrentWeek(weekDate);
  }, []);

  const handleMonthChange = useCallback((monthDate: Date) => {
    setCurrentMonth(monthDate);
  }, []);

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
    <div className="h-screen flex bg-gray-50 overflow-hidden relative">
      {/* Loading overlay when model is loading */}
      {modelLoading && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading AI Classification</h3>
            <p className="text-sm text-gray-600 text-center">
              Setting up intelligent event categorization...
            </p>
          </div>
        </div>
      )}

      {/* Mobile drawer overlay - Always rendered with CSS transitions */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          (leftSidebarOpen || rightSidebarOpen) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(1px)' }}
        onClick={() => {
          setLeftSidebarOpen(false);
          setRightSidebarOpen(false);
        }}
      />

      {/* Left Sidebar - Fixed on desktop, drawer on mobile */}
      <div className={`
        w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-50
        lg:relative lg:flex
        fixed left-0 top-0 h-full transition-transform duration-300 ease-in-out
        ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200 h-16 flex flex-col justify-center flex-shrink-0">
          {/* Dynamic View Switching Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleViewChange('day')}
              className={`text-lg font-semibold transition-all duration-300 ease-out group ${
                currentView === 'day'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-600 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold hover:text-gray-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`text-lg font-semibold transition-all duration-300 ease-out whitespace-nowrap group ${
                currentView === 'week'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-600 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold hover:text-gray-800'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`text-lg font-semibold transition-all duration-300 ease-out group ${
                currentView === 'month'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-600 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold hover:text-gray-800'
              }`}
            >
              Later
            </button>
          </div>
        </div>
        {currentView === 'month' ? (
          <div className="flex-1 flex flex-col">
            {/* Top half - Tasks */}
            <div className="flex-1 p-6 overflow-y-auto border-b border-gray-200">
              <TaskList
                title="Upcoming tasks"
                placeholder="Add a task..."
                addButtonLabel="Add"
                scheduleButtonLabel="Schedule in coming days"
                view={currentView}
                currentDate={currentMonth}
              />
            </div>
            {/* Bottom half - Long-term Goals */}
            <div className="flex-1 p-6 overflow-y-auto">
              <LongTermGoals />
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-y-auto">
            {currentView === 'day' && (
              <TaskList
                title="Tasks for today"
                placeholder="Add a task..."
                addButtonLabel="Add"
                scheduleButtonLabel="Schedule to my day"
                view={currentView}
                currentDate={selectedDate || new Date()}
              />
            )}
            {currentView === 'week' && (
              <TaskList
                title="Tasks for the week"
                placeholder="Add a task..."
                addButtonLabel="Add"
                scheduleButtonLabel="Schedule across the week"
                view={currentView}
                currentDate={currentWeek}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Mobile drawer tab for left sidebar */}
      <div className="lg:hidden fixed left-0 top-1/2 transform -translate-y-1/2 z-30">
        <button
          onClick={() => setLeftSidebarOpen(true)}
          className="bg-white border border-gray-200 rounded-r-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          title="Open tasks"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Main Calendar Area - Independently scrollable */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Calendar Header with Settings and mobile controls */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-3 h-16 flex items-center justify-between flex-shrink-0">
          {/* Mobile menu button for left sidebar */}
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Open tasks"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          
          <div className="flex items-center gap-2">
            {/* Mobile menu button for right sidebar */}
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Open insights"
            >
              <Clock size={20} className="text-gray-600" />
            </button>
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        {/* Calendar Content - This area scrolls independently */}
        <div className="flex-1 overflow-hidden">
          {renderCalendar()}
        </div>
      </div>
      
      {/* Right Sidebar - Fixed on desktop, drawer on mobile */}
      <div className={`
        w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-50
        lg:relative lg:flex
        fixed right-0 top-0 h-full transition-transform duration-300 ease-in-out
        ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Fixed Analytics at top */}
        <div className="flex-shrink-0">
          <EventAnalytics 
            currentView={currentView}
            selectedDate={selectedDate}
            currentWeek={currentWeek}
            currentMonth={currentMonth}
          />
        </div>
        
        {/* Scrollable Suggestions section */}
        <div className="flex-1 min-h-0">
          <Suggestions 
            currentView={currentView}
            selectedDate={selectedDate || undefined}
            currentWeek={currentWeek}
            currentMonth={currentMonth}
            onViewChange={handleViewChange}
            showingGoals={currentView === 'month'}
          />
        </div>
      </div>
      
      {/* Mobile drawer tab for right sidebar */}
      <div className="lg:hidden fixed right-0 top-1/2 transform -translate-y-1/2 z-30">
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="bg-white border border-gray-200 rounded-l-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          title="Open insights"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
