'use client';

import React from 'react';
import { Lightbulb, Clock, Target, Plus } from 'lucide-react';
import { useEvents } from '../contexts/EventsContext';
import { LongTermGoal } from './LongTermGoals';
import { Event } from '../types/events';

interface Suggestion {
  id: string;
  type: 'break' | 'goal' | 'optimization' | 'balance';
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  priority: 'high' | 'medium' | 'low';
}

interface SuggestionsProps {
  className?: string;
  currentView?: 'day' | 'week' | 'month';
  selectedDate?: Date;
  currentWeek?: Date;
  currentMonth?: Date;
}

export function Suggestions({ 
  className, 
  currentView = 'week',
  selectedDate,
  currentWeek,
  currentMonth 
}: SuggestionsProps) {
  const { events, addEvent, updateEvent } = useEvents();
  const [goals, setGoals] = React.useState<LongTermGoal[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState<Set<string>>(new Set());

  // Load goals from localStorage
  React.useEffect(() => {
    const loadGoals = () => {
      const savedGoals = localStorage.getItem('longTermGoals');
      if (savedGoals && savedGoals !== 'undefined' && savedGoals !== 'null') {
        try {
          const parsedGoals = JSON.parse(savedGoals).map((goal: LongTermGoal) => ({
            ...goal,
            createdAt: new Date(goal.createdAt)
          }));
          setGoals(parsedGoals);
        } catch (error) {
          console.error('Error loading goals from localStorage:', error);
        }
      }
    };

    // Load initially
    loadGoals();

    // Listen for storage changes (when goals are updated in other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'longTermGoals') {
        loadGoals();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleGoalsUpdate = () => loadGoals();
    window.addEventListener('goalsUpdated', handleGoalsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('goalsUpdated', handleGoalsUpdate);
    };
  }, []);

  // Get the time range based on current view
  const getTimeRange = (): { start: Date; end: Date } => {
    const now = new Date();
    let start: Date, end: Date;

    switch (currentView) {
      case 'day':
        start = selectedDate ? new Date(selectedDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        break;
      
      case 'week':
        start = currentWeek ? new Date(currentWeek) : new Date();
        // Get start of week (assuming Monday is start)
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 7);
        break;
      
      case 'month':
      default:
        start = currentMonth ? new Date(currentMonth) : new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        break;
    }

    return { start, end };
  };

  // Get the target date for new events based on current view
  const getTargetDate = (): Date => {
    switch (currentView) {
      case 'day':
        return selectedDate ? new Date(selectedDate) : new Date();
      
      case 'week':
        // For week view, suggest for tomorrow or next available day in the week
        const weekStart = currentWeek ? new Date(currentWeek) : new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // If tomorrow is within the current week, use it; otherwise use the week start
        const { start: weekStartRange, end: weekEndRange } = getTimeRange();
        if (tomorrow >= weekStartRange && tomorrow < weekEndRange) {
          return tomorrow;
        }
        return weekStart;
      
      case 'month':
      default:
        // For month view, suggest for tomorrow
        const monthTarget = new Date();
        monthTarget.setDate(monthTarget.getDate() + 1);
        return monthTarget;
    }
  };

  // Analyze schedule for optimization opportunities
  const analyzeSchedule = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const { start, end } = getTimeRange();

    // Get events for current time range
    const rangeEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= start && eventDate < end;
    });

    console.log('Schedule Analysis Debug:');
    console.log('- Time range:', start, 'to', end);
    console.log('- All events:', events);
    console.log('- Range events:', rangeEvents);
    console.log('- Total events in range:', rangeEvents.length);

    // If no events in range, suggest adding some structure
    if (rangeEvents.length === 0 && currentView !== 'month') {
      suggestions.push({
        id: 'add-structure',
        type: 'optimization',
        title: 'Add some structure',
        description: `Your ${currentView} looks empty. Consider adding some events to organize your time better.`,
        actionLabel: 'Add event',
        onAction: () => {
          // This could trigger the new event modal in the future
          console.log('User wants to add structure');
        },
        priority: 'medium'
      });
    }

    // Sort events by start time
    const sortedEvents = rangeEvents.sort((a: Event, b: Event) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Check for long blocks without breaks
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      // Skip if current event doesn't need breaks (meals, breaks, personal activities)
      if (!isWorkIntensiveEvent(currentEvent)) {
        continue;
      }
      
      const currentEnd = new Date(currentEvent.endTime);
      const nextStart = new Date(nextEvent.startTime);
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      // Only suggest break if:
      // 1. Events are back-to-back or very close (< 15 min gap)
      // 2. Current event is work-intensive and longer than 90 minutes
      // 3. Next event is also work-intensive (no break needed before meals/personal time)
      if (gapMinutes < 15 && gapMinutes >= 0) {
        const currentDuration = (currentEnd.getTime() - new Date(currentEvent.startTime).getTime()) / (1000 * 60);
        
        // Only suggest if current event is long AND next event also needs focus
        if (currentDuration > 90 && isWorkIntensiveEvent(nextEvent)) {
          suggestions.push({
            id: `break-${currentEvent.id}-${nextEvent.id}`,
            type: 'break',
            title: 'Add a break',
            description: `You have a ${Math.round(currentDuration)}-minute work block without breaks. Consider adding a 15-minute break between "${currentEvent.title}" and "${nextEvent.title}".`,
            actionLabel: 'Add 15-min break',
            onAction: () => {
              const breakStart = new Date(currentEnd);
              const breakEnd = new Date(breakStart);
              breakEnd.setMinutes(breakEnd.getMinutes() + 15);
              
              // Check if the break would conflict with any existing events
              const conflictingEvents = events.filter(event => {
                const eventStart = new Date(event.startTime);
                const eventEnd = new Date(event.endTime);
                return (breakStart < eventEnd && breakEnd > eventStart);
              });
              
              if (conflictingEvents.length > 0) {
                // Find the minimum amount we need to move events
                const latestConflictEnd = Math.max(
                  ...conflictingEvents.map(event => new Date(event.endTime).getTime())
                );
                const breakDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
                
                // Move all conflicting and subsequent events
                const eventsToMove = events.filter(event => {
                  const eventStart = new Date(event.startTime);
                  return eventStart.getTime() >= breakStart.getTime();
                }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                
                eventsToMove.forEach(eventToMove => {
                  const newStartTime = new Date(eventToMove.startTime);
                  newStartTime.setTime(newStartTime.getTime() + breakDuration);
                  
                  const newEndTime = new Date(eventToMove.endTime);
                  newEndTime.setTime(newEndTime.getTime() + breakDuration);
                  
                  updateEvent(eventToMove.id, {
                    startTime: newStartTime,
                    endTime: newEndTime
                  });
                });
              }
              
              // Add the break event
              addEvent('Break', breakStart, breakEnd);
              
              // Mark this suggestion as dismissed
              setDismissedSuggestions(prev => new Set(prev).add(`break-${currentEvent.id}-${nextEvent.id}`));
            },
            priority: 'high'
          });
        }
      }
    }

    // Check for work-life balance - use the same work-intensive logic
    const workEvents = rangeEvents.filter((event: Event) => isWorkIntensiveEvent(event));
    const personalEvents = rangeEvents.filter((event: Event) => !isWorkIntensiveEvent(event));

    const workHours = workEvents.reduce((total: number, event: Event) => {
      const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    const personalHours = personalEvents.reduce((total: number, event: Event) => {
      const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    // Suggest better balance if work >> personal time
    if (workHours > personalHours * 2 && workHours > 20) {
      suggestions.push({
        id: 'work-life-balance',
        type: 'balance',
        title: 'Improve work-life balance',
        description: `You have ${Math.round(workHours)} hours of work/study planned vs ${Math.round(personalHours)} hours of personal time in the current ${currentView}. Consider scheduling some relaxation or hobbies.`,
        actionLabel: 'Add personal time',
        onAction: () => {
          // Find a good time slot for personal activity in the current view's timeframe
          const targetDate = getTargetDate();
          targetDate.setHours(18, 0, 0, 0); // 6 PM
          
          const timeSlot = findAvailableTimeSlot(targetDate, 60 * 60 * 1000); // 1 hour
          
          if (timeSlot) {
            addEvent('Personal Time', timeSlot.start, timeSlot.end);
            setDismissedSuggestions(prev => new Set(prev).add('work-life-balance'));
          } else {
            // Fallback: still add but user will need to resolve conflicts manually
            const endTime = new Date(targetDate);
            endTime.setHours(19, 0, 0, 0);
            addEvent('Personal Time', targetDate, endTime);
            setDismissedSuggestions(prev => new Set(prev).add('work-life-balance'));
          }
        },
        priority: 'medium'
      });
    }

    console.log('Work-life balance analysis:');
    console.log('- Work hours:', workHours);
    console.log('- Personal hours:', personalHours);
    console.log('- Should suggest balance?', workHours > personalHours * 2 && workHours > 20);

    return suggestions;
  };

  // Analyze goals for actionable suggestions
  const analyzeGoals = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const activeGoals = goals.filter(goal => !goal.isCompleted);

    activeGoals.forEach(goal => {
      // Check if there are any events this week that might relate to this goal
      const goalKeywords = extractKeywords(goal.title);
      const relatedEvents = events.filter(event => {
        const eventKeywords = extractKeywords((event.title || '') + ' ' + (event.description || ''));
        return hasKeywordOverlap(goalKeywords, eventKeywords);
      });

      // Only suggest if no related events AND no existing suggestion for this goal
      if (relatedEvents.length === 0) {
        suggestions.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          title: 'Work on your goal',
          description: `You don't have any scheduled time in the current ${currentView} for "${goal.title}". Consider blocking out time to make progress on this goal.`,
          actionLabel: 'Schedule goal time',
          onAction: () => {
            // Find a good time slot for goal work in the current view's timeframe
            const targetDate = getTargetDate();
            targetDate.setHours(10, 0, 0, 0); // 10 AM
            
            const timeSlot = findAvailableTimeSlot(targetDate, 60 * 60 * 1000); // 1 hour
            
            if (timeSlot) {
              addEvent(`Work on: ${goal.title}`, timeSlot.start, timeSlot.end);
              setDismissedSuggestions(prev => new Set(prev).add(`goal-${goal.id}`));
            } else {
              // Fallback: still add but user will need to resolve conflicts manually
              const endTime = new Date(targetDate);
              endTime.setHours(11, 0, 0, 0);
              addEvent(`Work on: ${goal.title}`, targetDate, endTime);
              setDismissedSuggestions(prev => new Set(prev).add(`goal-${goal.id}`));
            }
          },
          priority: 'medium'
        });
      }
    });

    console.log('Goal analysis:');
    console.log('- Active goals:', activeGoals.length);
    console.log('- Goal suggestions generated:', suggestions.length);

    return suggestions;
  };

  // Helper function to determine if an event needs breaks
  const isWorkIntensiveEvent = (event: Event): boolean => {
    const title = (event.title || '').toLowerCase();
    const category = (event.category || '').toLowerCase();
    
    // Don't suggest breaks after these types of activities
    const relaxingActivities = [
      'break', 'lunch', 'dinner', 'breakfast', 'meal', 'eat', 'rest', 'relax',
      'walk', 'exercise', 'gym', 'workout', 'personal', 'free time', 'leisure',
      'social', 'chat', 'call', 'entertainment', 'game', 'movie', 'tv', 'sleep'
    ];
    
    // Check if this is a relaxing/non-work activity
    const isRelaxing = relaxingActivities.some(activity => 
      title.includes(activity) || category.includes(activity)
    );
    
    if (isRelaxing) return false;
    
    // Categories that typically need breaks
    const workCategories = ['work', 'education', 'study', 'meeting', 'class'];
    const isWorkCategory = workCategories.some(cat => category.includes(cat));
    
    // Work-intensive keywords in title
    const workKeywords = [
      'study', 'work', 'meeting', 'class', 'lecture', 'assignment', 'project',
      'coding', 'programming', 'research', 'analysis', 'writing', 'reading',
      'exam', 'test', 'interview', 'presentation', 'conference'
    ];
    const hasWorkKeywords = workKeywords.some(keyword => title.includes(keyword));
    
    return isWorkCategory || hasWorkKeywords;
  };

  // Helper function to extract keywords from text
  const extractKeywords = (text: string): string[] => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
  };

  // Helper function to find available time slot
  const findAvailableTimeSlot = (preferredStart: Date, duration: number): { start: Date; end: Date } | null => {
    const preferredEnd = new Date(preferredStart);
    preferredEnd.setTime(preferredEnd.getTime() + duration);
    
    // Check if preferred time is available
    const hasConflict = events.some(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return (preferredStart < eventEnd && preferredEnd > eventStart);
    });
    
    if (!hasConflict) {
      return { start: preferredStart, end: preferredEnd };
    }
    
    // Try to find alternative slots in the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      for (let hour = 9; hour <= 20; hour++) { // 9 AM to 8 PM
        const testStart = new Date(preferredStart);
        testStart.setDate(testStart.getDate() + dayOffset);
        testStart.setHours(hour, 0, 0, 0);
        
        const testEnd = new Date(testStart);
        testEnd.setTime(testEnd.getTime() + duration);
        
        const hasConflictTest = events.some(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          return (testStart < eventEnd && testEnd > eventStart);
        });
        
        if (!hasConflictTest) {
          return { start: testStart, end: testEnd };
        }
      }
    }
    
    return null; // No available slot found
  };

  // Helper function to check keyword overlap
  const hasKeywordOverlap = (keywords1: string[], keywords2: string[]): boolean => {
    return keywords1.some(keyword => 
      keywords2.some(kw => kw.includes(keyword) || keyword.includes(kw))
    );
  };

  // Combine all suggestions and filter out dismissed ones
  const scheduleAnalysis = analyzeSchedule();
  const goalAnalysis = analyzeGoals();
  
  console.log('Analysis results:');
  console.log('- Schedule suggestions:', scheduleAnalysis);
  console.log('- Goal suggestions:', goalAnalysis);
  
  const allSuggestions = [
    ...scheduleAnalysis,
    ...goalAnalysis
  ].filter(suggestion => !dismissedSuggestions.has(suggestion.id))
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  console.log('Final suggestions after filtering:', allSuggestions);

  // Debug logging
  React.useEffect(() => {
    console.log('Suggestions Debug:');
    console.log('- Current view:', currentView);
    console.log('- Selected date:', selectedDate);
    console.log('- Events count:', events.length);
    console.log('- Goals count:', goals.length);
    console.log('- Time range:', getTimeRange());
    console.log('- All suggestions:', allSuggestions);
    console.log('- Dismissed suggestions:', dismissedSuggestions);
  }, [allSuggestions, currentView, selectedDate, events.length, goals.length]);

  // Reset dismissed suggestions when events change significantly
  React.useEffect(() => {
    // Clear dismissed suggestions when events are added/removed/modified
    // This allows suggestions to reappear if the problem persists
    const timeoutId = setTimeout(() => {
      setDismissedSuggestions(new Set());
    }, 5000); // Reset after 5 seconds to allow re-evaluation

    return () => clearTimeout(timeoutId);
  }, [events.length]); // Trigger when number of events changes

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'break': return <Clock size={16} className="text-blue-600" />;
      case 'goal': return <Target size={16} className="text-purple-600" />;
      case 'balance': return <Lightbulb size={16} className="text-orange-600" />;
      default: return <Lightbulb size={16} className="text-gray-600" />;
    }
  };

  if (allSuggestions.length === 0) {
    return (
      <div className={`p-6 flex flex-col h-full ${className}`}>
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <Lightbulb size={20} className="text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900">Suggestions</h3>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center text-gray-500">
            <Lightbulb size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-700 dark:text-gray-700">Your schedule looks great!</p>
            <p className="text-xs text-gray-600 dark:text-gray-600">Suggestions will appear here when we find optimization opportunities.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Lightbulb size={20} className="text-yellow-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900">Suggestions</h3>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
        {allSuggestions.slice(0, 5).map((suggestion) => (
          <div 
            key={suggestion.id}
            className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Card Header with Icon and Title */}
            <div className="p-4 pb-3">
              <div className="flex items-start gap-3">
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm mb-2">
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card Footer with Action Button */}
            <div className="px-4 py-3 bg-gray-100 border-t border-gray-200">
              <button
                onClick={suggestion.onAction}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                {suggestion.actionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
