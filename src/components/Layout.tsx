'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { EventAnalytics } from './EventAnalytics';
import { SettingsModal } from './SettingsModal';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { useModelLoader } from '@/hooks/useModelLoader';
import { useEvents } from '@/contexts/EventsContext';
import { taskScheduler, Task } from '@/utils/taskScheduler';
import { startOfWeek } from 'date-fns';
import { Settings, Clock, Calendar } from 'lucide-react';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const { events, addEvent } = useEvents();

  // Advanced task creation fields
  const [newTaskSubject, setNewTaskSubject] = useState<string>('');
  const [newTaskIsTest, setNewTaskIsTest] = useState(false);
  const [newTaskTestDate, setNewTaskTestDate] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');

  const handleAdd = () => {
    if (input.trim()) {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        title: input.trim(),
        description: newTaskDescription || undefined,
        estimatedDuration: 60, // Default 1 hour
        priority: 'medium',
        // No manual category - let AI classify automatically
        subject: newTaskSubject || undefined,
        isTest: newTaskIsTest,
        testDate: newTaskTestDate ? new Date(newTaskTestDate) : undefined
      };
      setTasks([...tasks, newTask]);
      setInput('');
      
      // Reset advanced fields
      setNewTaskDescription('');
      setNewTaskSubject('');
      setNewTaskIsTest(false);
      setNewTaskTestDate('');
      setShowAdvanced(false);
      
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

  const handleUpdatePriority = (idx: number, priority: 'low' | 'medium' | 'high') => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, priority } : task
    ));
  };

  const handleUpdateSubject = (idx: number, subject: string) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, subject: subject || undefined } : task
    ));
  };

  const handleUpdateIsTest = (idx: number, isTest: boolean) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, isTest } : task
    ));
  };

  const handleUpdateTestDate = (idx: number, testDate: string) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, testDate: testDate ? new Date(testDate) : undefined } : task
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
        addEvent(event.title, event.startTime, event.endTime, event.description);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {tasks.map((task, idx) => (
          <div key={task.id} className="border rounded-lg p-3 bg-white shadow-sm">
            {editingIndex === idx ? (
              <div className="space-y-2">
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => handleEditSave(idx)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSave(idx); }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium flex-1">{task.title}</span>
                  <div className="flex gap-1">
                    <button
                      className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                      onClick={() => handleEdit(idx)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs px-2 py-1 bg-red-100 rounded hover:bg-red-200"
                      onClick={() => handleRemoveTask(idx)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <select
                      value={task.estimatedDuration}
                      onChange={(e) => handleUpdateDuration(idx, parseInt(e.target.value))}
                      className="border rounded px-1 py-0.5 text-xs"
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
                  
                  <select
                    value={task.priority}
                    onChange={(e) => handleUpdatePriority(idx, e.target.value as 'low' | 'medium' | 'high')}
                    className={`border rounded px-2 py-0.5 text-xs ${getPriorityColor(task.priority)}`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  
                  {/* Show AI-detected category if available */}
                  {task.category && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border">
                      AI: {task.category}
                    </span>
                  )}
                </div>
                
                {/* Additional task details */}
                {(task.subject || task.isTest || task.testDate) && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {task.subject && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Subject:</span>
                        <input
                          type="text"
                          value={task.subject}
                          onChange={(e) => handleUpdateSubject(idx, e.target.value)}
                          className="border rounded px-1 py-0.5 text-xs flex-1 min-w-0"
                          placeholder="Subject"
                        />
                      </div>
                    )}
                    {task.isTest && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={task.isTest}
                            onChange={(e) => handleUpdateIsTest(idx, e.target.checked)}
                            className="w-3 h-3"
                          />
                          <span className="text-red-600 font-medium">Test/Exam</span>
                        </label>
                        {task.isTest && (
                          <input
                            type="date"
                            value={task.testDate ? task.testDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => handleUpdateTestDate(idx, e.target.value)}
                            className="border rounded px-1 py-0.5 text-xs"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show/hide advanced options for existing tasks */}
                {!task.subject && !task.isTest && (
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setTasks(tasks.map((t, i) => 
                        i === idx ? { ...t, subject: '', isTest: false } : t
                      ));
                    }}
                  >
                    + Add subject/test info
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <div className="space-y-2">
          <div className="flex items-center">
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
            >
              {addButtonLabel}
            </button>
          </div>
          
          {/* Advanced options toggle */}
          <button
            className="text-xs text-gray-600 hover:text-gray-800"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '− Hide advanced options' : '+ Advanced options (subject, tests, etc.)'}
          </button>
          
          {/* Advanced task creation fields */}
          {showAdvanced && (
            <div className="space-y-2 p-2 bg-gray-50 rounded border">
              <div>
                <label className="text-xs text-gray-600">Subject:</label>
                <input
                  type="text"
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  placeholder="e.g., Math, History"
                  className="w-full border rounded px-1 py-0.5 text-xs"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600">Description:</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Additional details about the task..."
                  className="w-full border rounded px-1 py-0.5 text-xs h-12 resize-none"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newTaskIsTest}
                    onChange={(e) => setNewTaskIsTest(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span className="text-red-600 font-medium">This is a test/exam</span>
                </label>
                
                {newTaskIsTest && (
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-600">Date:</label>
                    <input
                      type="date"
                      value={newTaskTestDate}
                      onChange={(e) => setNewTaskTestDate(e.target.value)}
                      className="border rounded px-1 py-0.5 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
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
  const { googleCalendarAuthenticated, isLoading } = useSettings();
  
  // Load TensorFlow model on app startup
  const { isModelLoaded, isLoading: modelLoading, error: modelError } = useModelLoader();

  // Log status when components are ready
  useEffect(() => {
    if (!isLoading && !modelLoading) {
      console.log('Layout loaded - Google Calendar authenticated:', googleCalendarAuthenticated);
      console.log('TensorFlow model loaded:', isModelLoaded);
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
    <div className="h-screen flex bg-gray-50 overflow-hidden relative">
      {/* Loading overlay when model is loading */}
      {modelLoading && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading AI Classification</h3>
            <p className="text-sm text-gray-600 text-center">
              Setting up intelligent event categorization...
            </p>
          </div>
        </div>
      )}

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
      {/* Main Calendar Area - Independently scrollable */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Calendar Header with Settings */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-3 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col text-sm text-gray-500">
            <div>
              Google Calendar: {isLoading ? 'Loading...' : googleCalendarAuthenticated ? 'Connected' : 'Not connected'}
            </div>
            <div className="flex items-center gap-1">
              AI Classification: 
              {modelLoading ? (
                <span className="text-yellow-600">Loading...</span>
              ) : isModelLoaded ? (
                <span className="text-green-600">Ready</span>
              ) : (
                <span className="text-red-600">Error</span>
              )}
              {modelLoading && (
                <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              )}
            </div>
          </div>
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
            <Suggestions 
              currentView={currentView}
              selectedDate={selectedDate || undefined}
              currentWeek={currentWeek}
              currentMonth={currentMonth}
            />
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
