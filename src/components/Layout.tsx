// Add tooltip to Plan my Day/Week/Month section header
// Find the header for the main task section and add a question mark with tooltip
// ...existing code...
// Example implementation (insert above TaskList or where the section header is rendered):
// <div className="flex items-center gap-2 mb-4">
//   <h2 className="font-bold font-mono text-lg text-gray-900 flex items-center gap-2">
//     {currentView === 'day' ? 'Plan my Day' : currentView === 'week' ? 'Plan my Week' : 'Plan my Month'}
//     <span className="relative group">
//       <span className="text-gray-400 text-base font-bold ml-1 cursor-help group-hover:text-gray-600 transition-colors" style={{opacity:0.6}} title="What is this?">?</span>
//       <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 w-64 bg-white text-gray-700 text-xs rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity duration-200" style={{minWidth:'200px', boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
//         This is your main task list for the {currentView}. Add tasks here to plan your schedule.
//       </span>
//     </span>
//   </h2>
// </div>
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { WeeklyCalendar } from './WeeklyCalendar';
import { EventAnalytics } from './EventAnalytics';
import { SettingsModal } from './SettingsModal';
import { OnboardingOverlay } from './OnboardingOverlay';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { CalendarsProvider, useCalendars } from '@/contexts/CalendarsContext';
import { useModelLoader } from '@/hooks/useModelLoader';
import { useEvents } from '@/contexts/EventsContext';
import { taskScheduler, Task } from '@/utils/taskScheduler';
import { loadTimePredictionModel, predictTaskDuration } from '@/utils/taskTimePrediction';
import { classifyEvent } from '@/utils/eventClassification';
import { startOfWeek } from 'date-fns';
import { Clock, Calendar, ChevronLeft, ChevronRight, Eye, EyeOff, Check, PanelLeftClose, PanelRightClose, PanelLeft, PanelRight } from 'lucide-react';

// Import with explicit file extensions to help TypeScript
import { DayCalendar } from './DayCalendar';
import { MonthlyCalendar } from './MonthlyCalendar';
import { LongTermGoals } from './LongTermGoals';
import { Suggestions } from './Suggestions';

export type CalendarView = 'day' | 'week' | 'month';

function TaskList({
  placeholder,
  addButtonLabel,
  view,
  currentDate,
}: {
  placeholder: string;
  addButtonLabel: string;
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
  const [model, setModel] = useState<tf.GraphModel|null>(null);
  const [vocabMap, setVocabMap] = useState<Map<string, number>|null>(null);
  const [predictingIdx, setPredictingIdx] = useState<number|null>(null);
  const [input, setInput] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const { events, addEvent } = useEvents();

  // Load model and vocab on mount
  useEffect(() => {
    loadTimePredictionModel().then(({ model, vocabMap }) => {
      setModel(model);
      setVocabMap(vocabMap);
    });
  }, []);

  const handleAdd = async () => {
    if (input.trim()) {
      let predictedDuration = 60;
      // Default to 60 min unless user changes duration in popup
      if (!model || !vocabMap) {
        predictedDuration = 60;
      } else {
        setPredictingIdx(tasks.length);
        // --- Historical override logic (copied from InlineEventCreator) ---
        const normalize = (str: string) => str.trim().toLowerCase().replace(/[^\w\s]/g, '');
        const normalizedTitle = normalize(input.trim());
        const similarEvents = events.filter(ev =>
          ev.title && normalize(ev.title) === normalizedTitle
        );
        if (similarEvents.length >= 3) {
          const durations = similarEvents.map(ev => Math.round((ev.endTime.getTime() - ev.startTime.getTime()) / 60000));
          const uniqueDurations = Array.from(new Set(durations));
          if (uniqueDurations.length === 1) {
            predictedDuration = Math.round(uniqueDurations[0] / 5) * 5;
            setPredictingIdx(null);
          } else {
            predictedDuration = await predictTaskDuration(model, vocabMap, input.trim());
            setPredictingIdx(null);
          }
        } else {
          predictedDuration = await predictTaskDuration(model, vocabMap, input.trim());
          setPredictingIdx(null);
        }
      }
      // Clamp to at least 1 minute
      predictedDuration = Math.max(1, predictedDuration);
      // Use crypto.randomUUID if available, else fallback
      let uniqueId = '';
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uniqueId = crypto.randomUUID();
      } else {
        uniqueId = `task_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
      }
      const newTask: Task = {
        id: uniqueId,
        title: input.trim(),
        estimatedDuration: predictedDuration,
        priority: 'low',
      };
      // Classification (unchanged)
      try {
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
        // Continue without classification
        console.error('Failed to classify event:', error);
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

  const handleUpdateDuration = (idx: number, value: string) => {
    // Allow any number, but always store as number (NaN if empty)
    const num = value === '' ? NaN : Number(value);
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, estimatedDuration: num } : task
    ));
  };

  // On blur, if empty, set to 1
  const handleDurationBlur = (idx: number) => {
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, estimatedDuration: isNaN(task.estimatedDuration) ? 1 : task.estimatedDuration } : task
    ));
  };

  // Predict duration when editing task title
  const handleEditSave = async (idx: number) => {
    let duration = tasks[idx].estimatedDuration;
    if (model && vocabMap && editValue.trim()) {
      setPredictingIdx(idx);
      duration = await predictTaskDuration(model, vocabMap, editValue.trim());
      setPredictingIdx(null);
    }
    setTasks(tasks.map((task, i) => 
      i === idx ? { ...task, title: editValue, estimatedDuration: duration } : task
    ));
    setEditingIndex(null);
    setEditValue('');
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
      
    } catch {
      console.error('Failed to schedule tasks');
      alert('Failed to schedule tasks. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Determine section and button labels based on view
  let sectionLabel = '';
  let scheduleLabel = '';
  if (view === 'day') {
    sectionLabel = 'Plan my Day';
    scheduleLabel = 'Schedule my Day';
  } else if (view === 'week') {
    sectionLabel = 'Plan my Week';
    scheduleLabel = 'Schedule my Week';
  } else {
    sectionLabel = 'Plan my Month';
    scheduleLabel = 'Schedule in coming days';
  }

  return (
    <div id="tasks-section" aria-label={sectionLabel} className="flex flex-col h-full min-h-0">
      {/* Plan header with tooltip */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-bold font-mono text-lg text-gray-900 flex items-center gap-2">
          {view === 'day' ? 'Plan my Day' : view === 'week' ? 'Plan my Week' : 'Plan my Month'}
          <span className="relative group">
            <span className="text-gray-600 text-base font-bold ml-1 cursor-help group-hover:text-gray-800 transition-colors" style={{opacity:0.8}} title="What is this?">?</span>
            <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-[12000] w-64 bg-white text-gray-700 text-xs rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200" style={{maxWidth:'200px', boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
              Use this section to schedule time to complete all your tasks. Add tasks here, then click &quot;Schedule my {view},&quot; and StudyCal will place your events throughout the {view}.
            </span>
          </span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
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
                  <input
                    type="number"
                    min={1}
                    value={isNaN(task.estimatedDuration) ? '' : task.estimatedDuration}
                    onChange={e => handleUpdateDuration(idx, e.target.value)}
                    onBlur={() => handleDurationBlur(idx)}
                    className="border rounded px-1 py-0.5 text-xs text-gray-900 w-16"
                    disabled={predictingIdx === idx}
                  />
                  <span className="text-xs text-gray-700">min</span>
                  {predictingIdx === idx && <span className="text-xs text-gray-600 ml-1">AI…</span>}
                </div>
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
              id="add-event-button"
              aria-label="Add Event"
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={handleAdd}
            >
              {addButtonLabel}
            </button>
          </div>
        </div>
        {/* Always show schedule button, gray and disabled if no tasks */}
        <button
          className={`w-full py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tasks.length > 0 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'}`}
          onClick={tasks.length > 0 ? handleScheduleTasks : undefined}
          disabled={tasks.length === 0 || isScheduling}
        >
          {isScheduling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Scheduling...
            </>
          ) : (
            <>
              <Calendar size={16} />
              {scheduleLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function Layout() {
  return <LayoutContent />;
}

// Calendar selector component for the left sidebar
function CalendarSelector() {
  const { calendars, toggleCalendarVisibility, setDefaultCalendar, defaultCalendarId } = useCalendars();
  
  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Calendar size={16} />
        Calendars
      </h3>
      <div className="space-y-2">
        {calendars.map(calendar => (
          <div 
            key={calendar.id} 
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Color indicator */}
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: calendar.color }}
              />
              
              {/* Calendar name */}
              <span className="text-sm text-gray-700 truncate">
                {calendar.name}
              </span>
              
              {/* Default indicator */}
              {calendar.id === defaultCalendarId && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  Default
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Set as default button */}
              {calendar.id !== defaultCalendarId && (
                <button
                  onClick={() => setDefaultCalendar(calendar.id)}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Set as default"
                >
                  <Check size={14} />
                </button>
              )}
              
              {/* Toggle visibility button */}
              <button
                onClick={() => toggleCalendarVisibility(calendar.id)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title={calendar.isVisible ? 'Hide calendar' : 'Show calendar'}
              >
                {calendar.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
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
  
  // Desktop sidebar collapse states
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  
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
    const sidebarProps = {
      leftSidebarCollapsed,
      rightSidebarCollapsed,
      onToggleLeftSidebar: () => setLeftSidebarCollapsed(!leftSidebarCollapsed),
      onToggleRightSidebar: () => setRightSidebarCollapsed(!rightSidebarCollapsed),
    };
    
    switch (currentView) {
      case 'day':
        return <DayCalendar selectedDate={selectedDate} {...sidebarProps} />;
      case 'week':
        return <WeeklyCalendar onWeekChange={handleWeekChange} {...sidebarProps} />;
      case 'month':
        return <MonthlyCalendar onDaySelected={handleDaySelected} onMonthChange={handleMonthChange} {...sidebarProps} />;
      default:
        return <WeeklyCalendar onWeekChange={handleWeekChange} {...sidebarProps} />;
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
        bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-50
        lg:relative lg:flex
        fixed left-0 top-0 h-full transition-all duration-300 ease-in-out
        ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${leftSidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'w-80'}
      `}>
        <div className="p-4 border-b border-gray-200 h-16 flex flex-col justify-center flex-shrink-0 min-w-80">
          {/* Dynamic View Switching Buttons */}
          <div id="timeframe-group" className="flex items-center justify-between">
            <button
              onClick={() => handleViewChange('day')}
              className={`text-lg font-semibold transition-all duration-300 ease-out group ${
                currentView === 'day'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-600 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold hover:text-gray-800'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`text-lg font-semibold transition-all duration-300 ease-out whitespace-nowrap group ${
                currentView === 'week'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-600 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold hover:text-gray-800'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`text-lg font-semibold transition-all duration-300 ease-out group ${
                currentView === 'month'
                  ? 'font-bold text-gray-900 scale-105 px-6'
                  : 'text-gray-600 scale-95 px-0 hover:scale-100 hover:px-2 hover:font-bold hover:text-gray-800'
              }`}
            >
              Month
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0 min-w-80">
          <div className="flex-1 p-6 overflow-y-auto border-b border-gray-200">
            {/* Plan header with tooltip is now rendered inside TaskList */}
            <TaskList
              placeholder="Add a task..."
              addButtonLabel="Add"
              view={currentView}
              currentDate={currentView === 'month' ? currentMonth : currentView === 'week' ? currentWeek : selectedDate || new Date()}
            />
          </div>
          {currentView === 'month' && (
            <div className="flex-1 p-6 overflow-y-auto border-b border-gray-200">
              <LongTermGoals />
            </div>
          )}
          {/* Calendar selector at the bottom */}
          <CalendarSelector />
        </div>
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
        {/* Calendar Content - This area scrolls independently */}
        <div className="flex-1 overflow-hidden">
          {renderCalendar()}
        </div>
      </div>
      
      {/* Right Sidebar - Fixed on desktop, drawer on mobile */}
      <div className={`
        bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-50
        lg:relative lg:flex
        fixed right-0 top-0 h-full transition-all duration-300 ease-in-out
        ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${rightSidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-l-0' : 'w-80'}
      `}>
        {/* Fixed Analytics at top */}
        <div className="flex-shrink-0 min-w-80">
          <EventAnalytics 
            currentView={currentView}
            selectedDate={selectedDate}
            currentWeek={currentWeek}
            currentMonth={currentMonth}
          />
        </div>
        
        {/* Scrollable Suggestions section */}
        <div className="flex-1 min-h-0 min-w-80">
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
      {/* Onboarding overlay, always rendered above all content */}
      <OnboardingOverlay />
    </div>
  );
}
