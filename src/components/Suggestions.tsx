'use client';

import React from 'react';
import { Lightbulb, Clock, Target, Plus, X } from 'lucide-react';
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
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  showingGoals?: boolean; // Add this to indicate when goals are visible
}

export function Suggestions({ 
  className, 
  currentView = 'week',
  selectedDate,
  currentWeek,
  currentMonth,
  onViewChange,
  showingGoals = false
}: SuggestionsProps) {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [goals, setGoals] = React.useState<LongTermGoal[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState<Set<string>>(new Set());
  const [isClient, setIsClient] = React.useState(false);

  // Ensure we only render on client to avoid hydration mismatch
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Load dismissed suggestions from localStorage
  React.useEffect(() => {
    const savedDismissed = localStorage.getItem('dismissedSuggestions');
    if (savedDismissed) {
      try {
        const parsed = JSON.parse(savedDismissed);
        setDismissedSuggestions(new Set(parsed));
      } catch (error) {
        console.error('Error loading dismissed suggestions:', error);
      }
    }
  }, []);

  // Save dismissed suggestions to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('dismissedSuggestions', JSON.stringify(Array.from(dismissedSuggestions)));
  }, [dismissedSuggestions]);

  // Function to dismiss a suggestion permanently
  const dismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
  };

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

  // Helper function to get a deterministic "random" activity based on a seed
  const getDeterministicActivity = (activities: string[], seed: string): string => {
    if (activities.length === 0) return 'Spend time on personal activities';
    
    // Create a simple hash from the seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use the hash to select an activity deterministically
    const index = Math.abs(hash) % activities.length;
    return activities[index];
  };

  // Enhanced specific activity suggestions
  const getSpecificActivities = (type: string): string[] => {
    switch (type) {
      case 'family':
        return [
          'Play board games with family',
          'Cook dinner together with family',
          'Go for a walk with family',
          'Watch a movie with family',
          'Have a picnic with family',
          'Play outdoor games with family',
          'Do a puzzle together with family',
          'Visit a local park with family',
          'Have a family game night',
          'Go on a family adventure',
          'Plan a family outing',
          'Do arts and crafts with family'
        ];
      case 'friends':
        return [
          'Coffee chat with friends',
          'Go to a movie with friends',
          'Try a new restaurant with friends',
          'Play video games with friends',
          'Go for a hike with friends',
          'Have a game night with friends',
          'Visit a museum with friends',
          'Go bowling with friends',
          'Plan a weekend trip with friends',
          'Have a potluck dinner with friends',
          'Go to a concert with friends',
          'Try a new hobby together'
        ];
      case 'relaxation':
        return [
          'Read a fiction book',
          'Watch a documentary',
          'Take a bubble bath',
          'Practice meditation',
          'Listen to music and relax',
          'Do some gentle stretching',
          'Journal about your day',
          'Do some creative drawing',
          'Practice deep breathing',
          'Listen to a podcast',
          'Do some mindful coloring',
          'Practice gratitude exercises'
        ];
      case 'learning':
        return [
          'Read a book on personal development',
          'Watch educational YouTube videos',
          'Take an online course',
          'Learn a new skill on Skillshare',
          'Practice coding on LeetCode',
          'Read about current events',
          'Learn a new language with Duolingo',
          'Watch TED talks',
          'Complete a free online tutorial',
          'Practice a musical instrument',
          'Learn about a new topic on Wikipedia',
          'Take notes from educational content'
        ];
      case 'physical':
        return [
          'Go for a 30-minute walk',
          'Do a home workout routine',
          'Practice yoga',
          'Go for a bike ride',
          'Do some stretching exercises',
          'Try a new fitness video',
          'Go swimming',
          'Do bodyweight exercises',
          'Take the stairs instead of elevator',
          'Do a quick dance session',
          'Try a new sport or activity',
          'Go for a nature hike'
        ];
      case 'creative':
        return [
          'Write in a journal',
          'Draw or sketch something',
          'Try a new craft project',
          'Write poetry or stories',
          'Learn a musical instrument',
          'Take creative photos',
          'Try cooking a new recipe',
          'Design something new',
          'Practice calligraphy',
          'Make something with your hands',
          'Experiment with art supplies',
          'Create a vision board'
        ];
      default:
        return ['Spend time on personal activities'];
    }
  };

  // Helper function to calculate proportional time needed
  const calculateProportionalTime = (dominantHours: number, totalHours: number, balanceType: string): number => {
    // Base calculation on imbalance severity
    const imbalanceRatio = dominantHours / totalHours;
    
    // Determine base time based on balance type priority
    let baseTime = 60; // default 1 hour
    
    switch (balanceType) {
      case 'physical':
        // Physical activity should be consistent regardless of schedule size
        baseTime = Math.max(30, Math.min(90, totalHours * 0.05)); // 5% of total time, 30-90 min
        break;
      case 'relaxation':
        // Relaxation time should scale with stress/work load
        baseTime = Math.max(60, Math.min(180, dominantHours * 0.15)); // 15% of dominant time
        break;
      case 'friends':
      case 'family':
        // Social time should be substantial when missing
        baseTime = Math.max(90, Math.min(240, totalHours * 0.1)); // 10% of total time, 1.5-4 hours
        break;
      case 'learning':
        // Learning time should be proportional to available time
        baseTime = Math.max(45, Math.min(120, totalHours * 0.08)); // 8% of total time
        break;
      case 'creative':
        // Creative time should be focused sessions
        baseTime = Math.max(60, Math.min(150, totalHours * 0.07)); // 7% of total time
        break;
      default:
        baseTime = Math.max(60, Math.min(120, totalHours * 0.06)); // 6% of total time
    }
    
    // Apply imbalance multiplier - more severe imbalance = more time recommended
    const imbalanceMultiplier = Math.min(2, Math.max(1, imbalanceRatio * 1.5));
    const adjustedTime = baseTime * imbalanceMultiplier;
    
    // Round to nearest 15 minutes and ensure reasonable bounds
    const roundedTime = Math.round(adjustedTime / 15) * 15;
    return Math.max(30, Math.min(300, roundedTime)); // 30 minutes to 5 hours max
  };

  // Analyze schedule for optimization opportunities
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const analyzeSchedule = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const { start, end } = getTimeRange();

    // Get events for current time range
    const rangeEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= start && eventDate < end;
    });

    // Main schedule analysis

    // If no events in range, suggest adding some structure
    if (rangeEvents.length === 0 && currentView !== 'month') {
      suggestions.push({
        id: 'add-structure',
        type: 'optimization',
        title: 'Add some structure',
        description: `Your ${currentView} looks empty. Consider adding some events to organize your time better.`,
        actionLabel: '', // Remove the button
        onAction: () => {
          // No action
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
              dismissSuggestion(`break-${currentEvent.id}-${nextEvent.id}`);
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
      const imbalanceRatio = workHours / (personalHours || 1);
      const suggestedPersonalTime = calculateProportionalTime(workHours, workHours + personalHours, 'relaxation');
      const activities = getSpecificActivities('relaxation');
      const seed = `work-balance-${Math.round(workHours)}`;
      const randomActivity = getDeterministicActivity(activities, seed);
      
      const timeDescription = suggestedPersonalTime >= 120 ? 
        `${Math.round(suggestedPersonalTime / 60)} hours` : 
        `${suggestedPersonalTime} minutes`;
      
      suggestions.push({
        id: 'work-life-balance',
        type: 'balance',
        title: `Add ${timeDescription} of personal time`,
        description: `You have ${Math.round(workHours)} hours of work/study vs ${Math.round(personalHours)} hours of personal time. Consider adding ${timeDescription} to improve your work-life balance.`,
        actionLabel: randomActivity,
        onAction: () => {
          // Find a good time slot for personal activity in the current view's timeframe
          const targetDate = getTargetDate();
          targetDate.setHours(18, 0, 0, 0); // 6 PM
          
          const duration = suggestedPersonalTime * 60 * 1000;
          const timeSlot = findAvailableTimeSlot(targetDate, duration);
          
          if (timeSlot) {
            addEvent(randomActivity, timeSlot.start, timeSlot.end);
            dismissSuggestion('work-life-balance');
          } else {
            // Fallback: still add but user will need to resolve conflicts manually
            const endTime = new Date(targetDate);
            endTime.setTime(endTime.getTime() + duration);
            addEvent(randomActivity, targetDate, endTime);
            dismissSuggestion('work-life-balance');
          }
        },
        priority: imbalanceRatio > 3 ? 'high' : 'medium'
      });
    }

    // Work-life balance analysis

    // Enhanced category balance analysis
    const categoryBalance = analyzeCategoryBalance(rangeEvents);
    suggestions.push(...categoryBalance);

    // Test preparation analysis
    const testPrepSuggestions = analyzeTestPreparation(rangeEvents);
    suggestions.push(...testPrepSuggestions);

    return suggestions;
  };

  // Analyze test preparation and suggest optimal study sessions
  const analyzeTestPreparation = (events: Event[]): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    
    // Find all test/exam events in the current time range and extended range (next 2 weeks)
    const { start, end } = getTimeRange();
    const extendedEnd = new Date(end);
    extendedEnd.setDate(extendedEnd.getDate() + 14); // Look ahead 2 weeks for tests
    
    const allRelevantEvents = events.filter((event: Event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= start && eventDate < extendedEnd;
    });
    
    const testEvents = allRelevantEvents.filter((event: Event) => {
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const category = (event.category || '').toLowerCase();
      
      // Keywords that indicate a test/exam
      const testKeywords = [
        'test', 'exam', 'quiz', 'midterm', 'final', 'assessment', 
        'evaluation', 'examination', 'practical', 'oral exam'
      ];
      
      return testKeywords.some(keyword => 
        title.includes(keyword) || 
        description.includes(keyword) ||
        (category === 'education' && (title.includes('exam') || title.includes('test')))
      );
    });
    
    // If no tests/exams found, suggest adding one to unlock exam prep features
    if (testEvents.length === 0 && events.length > 0) {
      suggestions.push({
        id: 'add-test-exam',
        type: 'optimization',
        title: 'Add upcoming tests or exams',
        description: 'Add your upcoming tests, quizzes, or exams to your calendar and the AI will automatically create optimized study schedules to help you prepare on time.',
        actionLabel: '', // Remove the button
        onAction: () => {}, // Dummy function
        priority: 'medium'
      });
    }
    
    testEvents.forEach((testEvent: Event) => {
      const testDate = new Date(testEvent.startTime);
      const testSubject = extractSubjectFromEvent(testEvent);
      
      // Find existing study sessions for this subject
      const studySessions = allRelevantEvents.filter((event: Event) => {
        const eventDate = new Date(event.startTime);
        const isStudySession = isStudyEvent(event);
        const isSameSubject = eventDate < testDate && (
          extractSubjectFromEvent(event) === testSubject ||
          event.title.toLowerCase().includes(testSubject.toLowerCase()) ||
          testEvent.title.toLowerCase().includes(extractSubjectFromEvent(event).toLowerCase())
        );
        
        return isStudySession && isSameSubject && eventDate >= start;
      });
      
      const daysUntilTest = Math.ceil((testDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilTest > 0 && daysUntilTest <= 21) { // Only suggest for tests within 3 weeks
        if (studySessions.length === 0) {
          // No study sessions found - suggest creating them
          suggestions.push(createStudySessionSuggestions(testEvent, testSubject, daysUntilTest));
        } else {
          // Check if existing study sessions are optimally spaced
          const optimizationSuggestion = analyzeStudySessionSpacing(testEvent, testSubject, studySessions, daysUntilTest);
          if (optimizationSuggestion) {
            suggestions.push(optimizationSuggestion);
          }
        }
      }
    });
    
    return suggestions.filter(Boolean); // Remove null suggestions
  };

  // Helper function to extract subject from event title
  const extractSubjectFromEvent = (event: Event): string => {
    const title = event.title || '';
    
    // Common subject patterns
    const subjectPatterns = [
      /(?:study|exam|test|quiz).*?[-\s:]+([a-zA-Z]+)/i,
      /([a-zA-Z]+)(?:\s+(?:study|exam|test|quiz))/i,
      /^([a-zA-Z]+)(?:\s|$)/i
    ];
    
    for (const pattern of subjectPatterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    }
    
    // Fallback: use first word of title if it looks like a subject
    const firstWord = title.split(/[\s-:]+/)[0];
    if (firstWord && firstWord.length > 2 && /^[a-zA-Z]+$/.test(firstWord)) {
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }
    
    return 'Subject';
  };

  // Helper function to check if an event is a study session
  const isStudyEvent = (event: Event): boolean => {
    const title = (event.title || '').toLowerCase();
    const category = (event.category || '').toLowerCase();
    const subcategory = (event.subcategory || '').toLowerCase();
    
    const studyKeywords = [
      'study', 'review', 'practice', 'homework', 'assignment', 
      'preparation', 'prep', 'revision', 'reading'
    ];
    
    return category === 'education' || 
           subcategory === 'study' ||
           studyKeywords.some(keyword => title.includes(keyword));
  };

  // Create suggestions for study sessions when none exist
  const createStudySessionSuggestions = (testEvent: Event, subject: string, daysUntilTest: number): Suggestion => {
    // Calculate optimal study schedule based on spaced repetition
    const studyDays = calculateOptimalStudyDays(daysUntilTest);
    const sessionDuration = calculateStudySessionDuration(daysUntilTest);
    
    const sessionsText = studyDays.length === 1 ? '1 study session' : `${studyDays.length} study sessions`;
    const durationText = sessionDuration >= 120 ? 
      `${Math.round(sessionDuration / 60)} hours` : 
      `${sessionDuration} minutes`;
    
    return {
      id: `create-study-sessions-${testEvent.id}`,
      type: 'optimization',
      title: `Create study plan for ${subject} test`,
      description: `You have a ${subject} test in ${daysUntilTest} days but no study sessions scheduled. I recommend ${sessionsText} of ${durationText} each using spaced repetition for optimal retention.`,
      actionLabel: `Create ${sessionsText}`,
      onAction: () => {
        createOptimalStudySessions(testEvent, subject, studyDays, sessionDuration);
        dismissSuggestion(`create-study-sessions-${testEvent.id}`);
      },
      priority: daysUntilTest <= 7 ? 'high' : 'medium'
    };
  };

  // Analyze existing study session spacing and suggest optimization
  const analyzeStudySessionSpacing = (testEvent: Event, subject: string, studySessions: Event[], daysUntilTest: number): Suggestion | null => {
    const testDate = new Date(testEvent.startTime);
    const optimalDays = calculateOptimalStudyDays(daysUntilTest);
    
    // Get days when study sessions are currently scheduled
    const currentStudyDays = studySessions.map(session => {
      const sessionDate = new Date(session.startTime);
      return Math.ceil((testDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    }).sort((a, b) => b - a); // Sort by days before test (descending)
    
    // Check if current spacing matches optimal spacing
    const isOptimallySpaced = isSpacingOptimal(currentStudyDays, optimalDays);
    
    if (!isOptimallySpaced && studySessions.length >= 2) {
      return {
        id: `optimize-study-spacing-${testEvent.id}`,
        type: 'optimization',
        title: `Optimize ${subject} study schedule`,
        description: `Your ${subject} study sessions aren't optimally spaced for retention. I can rearrange them using spaced repetition principles (studying ${optimalDays.join(', ')} days before the test).`,
        actionLabel: 'Optimize study schedule',
        onAction: () => {
          optimizeExistingStudySessions(testEvent, subject, studySessions, optimalDays);
          dismissSuggestion(`optimize-study-spacing-${testEvent.id}`);
        },
        priority: daysUntilTest <= 7 ? 'high' : 'medium'
      };
    }
    
    return null;
  };

  // Calculate optimal study days using spaced repetition principles
  const calculateOptimalStudyDays = (daysUntilTest: number): number[] => {
    if (daysUntilTest <= 2) return [1]; // Last minute - just one session
    if (daysUntilTest <= 4) return [3, 1]; // Short term - 2 sessions
    if (daysUntilTest <= 7) return [6, 4, 2, 1]; // One week - 4 sessions
    if (daysUntilTest <= 14) return [12, 8, 5, 3, 1]; // Two weeks - 5 sessions
    
    // More than 2 weeks - use exponential spacing
    const sessions = [];
    let day = daysUntilTest - 1;
    
    while (day > 0 && sessions.length < 6) {
      sessions.push(day);
      day = Math.max(1, Math.floor(day * 0.6)); // Reduce by 40% each time
    }
    
    if (!sessions.includes(1)) sessions.push(1); // Always include final review
    
    return sessions.sort((a, b) => b - a); // Sort descending
  };

  // Calculate appropriate study session duration
  const calculateStudySessionDuration = (daysUntilTest: number): number => {
    if (daysUntilTest <= 2) return 120; // 2 hours for cramming
    if (daysUntilTest <= 7) return 90; // 1.5 hours for short-term
    return 60; // 1 hour for long-term planning
  };

  // Check if current spacing is reasonably optimal
  const isSpacingOptimal = (currentDays: number[], optimalDays: number[]): boolean => {
    if (currentDays.length < 2) return false;
    
    // Allow some flexibility - within 1 day of optimal is considered good
    const tolerance = 1;
    
    return optimalDays.every(optimalDay => 
      currentDays.some(currentDay => Math.abs(currentDay - optimalDay) <= tolerance)
    );
  };

  // Create optimal study sessions
  const createOptimalStudySessions = (testEvent: Event, subject: string, studyDays: number[], sessionDuration: number) => {
    const testDate = new Date(testEvent.startTime);
    
    studyDays.forEach((daysBeforeTest, index) => {
      const sessionDate = new Date(testDate);
      sessionDate.setDate(sessionDate.getDate() - daysBeforeTest);
      sessionDate.setHours(19, 0, 0, 0); // Default to 7 PM
      
      const sessionEnd = new Date(sessionDate);
      sessionEnd.setMinutes(sessionEnd.getMinutes() + sessionDuration);
      
      // Find available time slot
      const timeSlot = findAvailableTimeSlot(sessionDate, sessionDuration * 60 * 1000);
      
      const finalStart = timeSlot ? timeSlot.start : sessionDate;
      const finalEnd = timeSlot ? timeSlot.end : sessionEnd;
      
      const sessionTitle = studyDays.length === 1 ? 
        `Study for ${subject} Test` :
        `${subject} Study Session ${index + 1}`;
      
      addEvent(sessionTitle, finalStart, finalEnd);
    });
  };

  // Optimize existing study sessions by moving them to optimal days
  const optimizeExistingStudySessions = (testEvent: Event, subject: string, existingSessions: Event[], optimalDays: number[]) => {
    // Calculate total study time to redistribute
    const totalStudyTime = existingSessions.reduce((total, session) => {
      const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60);
      return total + duration;
    }, 0);
    
    const sessionDuration = Math.max(60, Math.round(totalStudyTime / optimalDays.length));
    
    // Delete existing sessions
    existingSessions.forEach(session => {
      deleteEvent(session.id);
    });
    
    // Create new optimally spaced sessions
    createOptimalStudySessions(testEvent, subject, optimalDays, sessionDuration);
  };

  // Enhanced category balance analysis
  const analyzeCategoryBalance = (events: Event[]): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    
    // Calculate time spent in each category
    const categoryHours: { [key: string]: number } = {};
    const totalHours = events.reduce((total: number, event: Event) => {
      const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
      const category = event.category || 'Personal';
      categoryHours[category] = (categoryHours[category] || 0) + duration;
      return total + duration;
    }, 0);

    // Skip analysis if too few events
    if (totalHours < 10) return suggestions;

    const personalHours = categoryHours['Personal'] || 0;
    const educationHours = categoryHours['Education'] || 0;
    const workHours = categoryHours['Work'] || 0;
    
    // Count events by category for activity suggestions
    const activityEvents = events.filter(event => {
      const category = event.category || 'Personal';
      const subcategory = event.subcategory || '';
      return category === 'Personal' && (subcategory === 'Exercise' || subcategory === 'Activity');
    });

    // Helper function to create enhanced balance suggestions
    const createEnhancedBalanceSuggestion = (dominantCategory: string, hours: number, balanceType: string) => {
      const proportionalTime = calculateProportionalTime(hours, totalHours, balanceType);
      const activities = getSpecificActivities(balanceType);
      const seed = `${dominantCategory}-${balanceType}-${Math.round(hours)}`;
      const randomActivity = getDeterministicActivity(activities, seed);
      
      const targetDate = getTargetDate();
      targetDate.setHours(17, 0, 0, 0); // 5 PM
      
      const timeDescription = proportionalTime >= 120 ? 
        `${Math.round(proportionalTime / 60)} hours` : 
        `${proportionalTime} minutes`;
      
      return {
        id: `balance-${dominantCategory.toLowerCase()}-${balanceType}`,
        type: 'balance' as const,
        title: `Add ${timeDescription} of ${balanceType}`,
        description: `You have ${Math.round(hours)} hours of ${dominantCategory.toLowerCase()} activities. Consider adding ${timeDescription} of ${balanceType} to create better balance.`,
        actionLabel: randomActivity,
        onAction: () => {
          const duration = proportionalTime * 60 * 1000; // Convert to milliseconds
          const timeSlot = findAvailableTimeSlot(targetDate, duration);
          
          if (timeSlot) {
            addEvent(randomActivity, timeSlot.start, timeSlot.end);
            dismissSuggestion(`balance-${dominantCategory.toLowerCase()}-${balanceType}`);
          } else {
            // Fallback: still add but user will need to resolve conflicts manually
            const endTime = new Date(targetDate);
            endTime.setTime(endTime.getTime() + duration);
            addEvent(randomActivity, targetDate, endTime);
            dismissSuggestion(`balance-${dominantCategory.toLowerCase()}-${balanceType}`);
          }
        },
        priority: 'medium' as const
      };
    };

    // Enhanced goal-related suggestions with better matching
    const createGoalRelatedSuggestion = (category: string, hours: number) => {
      const relevantGoals = goals.filter(goal => {
        if (goal.isCompleted) return false;
        
        const goalKeywords = goal.title.toLowerCase();
        // Enhanced keyword matching for different goal types
        const learningKeywords = ['learn', 'study', 'practice', 'master', 'improve', 'develop'];
        const codingKeywords = ['code', 'programming', 'software', 'development', 'javascript', 'python', 'react', 'web'];
        const languageKeywords = ['language', 'spanish', 'french', 'german', 'chinese', 'japanese', 'speak', 'fluent'];
        const fitnessKeywords = ['fitness', 'exercise', 'workout', 'healthy', 'weight', 'muscle', 'strength'];
        
        return learningKeywords.some(keyword => goalKeywords.includes(keyword)) ||
               codingKeywords.some(keyword => goalKeywords.includes(keyword)) ||
               languageKeywords.some(keyword => goalKeywords.includes(keyword)) ||
               fitnessKeywords.some(keyword => goalKeywords.includes(keyword));
      });
      
      if (relevantGoals.length === 0) return null;
      
      const seed = `${category}-${Math.round(hours)}`;
      const goalIndex = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % relevantGoals.length;
      const goal = relevantGoals[goalIndex];
      
      const proportionalTime = calculateProportionalTime(hours, totalHours, 'learning');
      const targetDate = getTargetDate();
      targetDate.setHours(19, 0, 0, 0); // 7 PM
      
      // Generate specific action based on goal type
      const getSpecificGoalAction = (goalTitle: string): string => {
        const title = goalTitle.toLowerCase();
        if (title.includes('code') || title.includes('programming')) {
          return 'Complete coding exercises';
        } else if (title.includes('language') || title.includes('spanish') || title.includes('french')) {
          return 'Practice language lessons';
        } else if (title.includes('fitness') || title.includes('exercise')) {
          return 'Follow workout routine';
        } else if (title.includes('read') || title.includes('book')) {
          return 'Read goal-related material';
        } else {
          return `Work on: ${goalTitle}`;
        }
      };
      
      const specificAction = getSpecificGoalAction(goal.title);
      const timeDescription = proportionalTime >= 120 ? 
        `${Math.round(proportionalTime / 60)} hours` : 
        `${proportionalTime} minutes`;
      
      return {
        id: `goal-balance-${category.toLowerCase()}-${goal.id}`,
        type: 'balance' as const,
        title: `Spend ${timeDescription} on: ${goal.title}`,
        description: `You have ${Math.round(hours)} hours of ${category.toLowerCase()} time. Consider making meaningful progress on "${goal.title}".`,
        actionLabel: specificAction,
        onAction: () => {
          const duration = proportionalTime * 60 * 1000; // Convert to milliseconds
          const timeSlot = findAvailableTimeSlot(targetDate, duration);
          
          if (timeSlot) {
            addEvent(specificAction, timeSlot.start, timeSlot.end);
            dismissSuggestion(`goal-balance-${category.toLowerCase()}-${goal.id}`);
          } else {
            // Fallback: still add but user will need to resolve conflicts manually
            const endTime = new Date(targetDate);
            endTime.setTime(endTime.getTime() + duration);
            addEvent(specificAction, targetDate, endTime);
            dismissSuggestion(`goal-balance-${category.toLowerCase()}-${goal.id}`);
          }
        },
        priority: 'medium' as const
      };
    };

    // Check for overwhelming Personal time
    if (personalHours > totalHours * 0.6 && personalHours > 15) {
      const goalSuggestion = createGoalRelatedSuggestion('Personal', personalHours);
      if (goalSuggestion) {
        suggestions.push(goalSuggestion);
      } else {
        suggestions.push(createEnhancedBalanceSuggestion('Personal', personalHours, 'learning'));
      }
    }

    // Check for overwhelming Educational time
    if (educationHours > totalHours * 0.6 && educationHours > 15) {
      suggestions.push(createEnhancedBalanceSuggestion('Education', educationHours, 'relaxation'));
      // Also suggest social time for heavy study periods
      if (educationHours > 20) {
        suggestions.push(createEnhancedBalanceSuggestion('Education', educationHours, 'friends'));
      }
    }

    // Check for overwhelming Work time
    if (workHours > totalHours * 0.6 && workHours > 15) {
      suggestions.push(createEnhancedBalanceSuggestion('Work', workHours, 'relaxation'));
      // Also suggest family time for heavy work periods
      if (workHours > 25) {
        suggestions.push(createEnhancedBalanceSuggestion('Work', workHours, 'family'));
      }
    }

    // Check for lack of active/physical activities
    if (activityEvents.length === 0 && totalHours > 20) {
      const proportionalTime = calculateProportionalTime(totalHours, totalHours, 'physical');
      const activities = getSpecificActivities('physical');
      const seed = `physical-${Math.round(totalHours)}`;
      const randomActivity = getDeterministicActivity(activities, seed);
      
      const targetDate = getTargetDate();
      targetDate.setHours(8, 0, 0, 0); // 8 AM
      
      const timeDescription = proportionalTime >= 60 ? 
        `${Math.round(proportionalTime / 60)} hours` : 
        `${proportionalTime} minutes`;
      
      suggestions.push({
        id: 'add-physical-activity',
        type: 'balance',
        title: `Add ${timeDescription} of physical activity`,
        description: `Your schedule lacks physical activities. Consider adding ${timeDescription} of exercise to boost your energy and well-being.`,
        actionLabel: randomActivity,
        onAction: () => {
          const duration = proportionalTime * 60 * 1000;
          const timeSlot = findAvailableTimeSlot(targetDate, duration);
          
          if (timeSlot) {
            addEvent(randomActivity, timeSlot.start, timeSlot.end);
            dismissSuggestion('add-physical-activity');
          } else {
            // Fallback: still add but user will need to resolve conflicts manually
            const endTime = new Date(targetDate);
            endTime.setTime(endTime.getTime() + duration);
            addEvent(randomActivity, targetDate, endTime);
            dismissSuggestion('add-physical-activity');
          }
        },
        priority: 'high'
      });
    }

    // Check for lack of social activities
    const socialEvents = events.filter(event => {
      const category = event.category || 'Personal';
      const subcategory = event.subcategory || '';
      return category === 'Personal' && subcategory === 'Social';
    });

    if (socialEvents.length === 0 && totalHours > 25) {
      const proportionalTime = calculateProportionalTime(totalHours, totalHours, 'friends');
      const activities = getSpecificActivities('friends');
      const seed = `social-${Math.round(totalHours)}`;
      const randomActivity = getDeterministicActivity(activities, seed);
      
      const targetDate = getTargetDate();
      targetDate.setHours(18, 0, 0, 0); // 6 PM
      
      const timeDescription = proportionalTime >= 120 ? 
        `${Math.round(proportionalTime / 60)} hours` : 
        `${proportionalTime} minutes`;
      
      suggestions.push({
        id: 'add-social-activity',
        type: 'balance',
        title: `Add ${timeDescription} of social time`,
        description: `Your schedule lacks social activities. Consider scheduling ${timeDescription} with friends or family to maintain social connections.`,
        actionLabel: randomActivity,
        onAction: () => {
          const duration = proportionalTime * 60 * 1000;
          const timeSlot = findAvailableTimeSlot(targetDate, duration);
          
          if (timeSlot) {
            addEvent(randomActivity, timeSlot.start, timeSlot.end);
            dismissSuggestion('add-social-activity');
          } else {
            // Fallback: still add but user will need to resolve conflicts manually
            const endTime = new Date(targetDate);
            endTime.setTime(endTime.getTime() + duration);
            addEvent(randomActivity, targetDate, endTime);
            dismissSuggestion('add-social-activity');
          }
        },
        priority: 'medium'
      });
    }

    return suggestions;
  };

  // Enhanced goal analysis for actionable suggestions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const analyzeGoals = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const activeGoals = goals.filter(goal => !goal.isCompleted);

    // If user has no goals at all, suggest setting them up (only if not already showing goals)
    if (goals.length === 0 && !showingGoals) {
      suggestions.push({
        id: 'setup-goals',
        type: 'goal',
        title: 'Set up your goals',
        description: 'Having clear goals helps you stay focused and motivated. Set up some long-term goals to track your progress and get personalized suggestions.',
        actionLabel: 'Go to Goals',
        onAction: () => {
          if (onViewChange) {
            onViewChange('month');
          }
        },
        priority: 'high'
      });
      
      return suggestions;
    }

    // Enhanced goal matching and persistence
    activeGoals.forEach(goal => {
      const goalTitle = goal.title.toLowerCase();
      
      // Enhanced keyword matching for different goal types
      const getGoalKeywords = (title: string): string[] => {
        const keywords = [];
        
        // Coding/Programming goals
        if (title.includes('code') || title.includes('programming') || title.includes('software') || 
            title.includes('javascript') || title.includes('python') || title.includes('react') || 
            title.includes('development') || title.includes('web')) {
          keywords.push('code', 'programming', 'software', 'development', 'javascript', 'python', 'react', 'web', 'coding');
        }
        
        // Language learning goals
        if (title.includes('language') || title.includes('spanish') || title.includes('french') || 
            title.includes('german') || title.includes('chinese') || title.includes('japanese') || 
            title.includes('speak') || title.includes('fluent') || title.includes('learn')) {
          keywords.push('language', 'spanish', 'french', 'german', 'chinese', 'japanese', 'speak', 'fluent', 'learn', 'practice');
        }
        
        // Fitness goals
        if (title.includes('fitness') || title.includes('exercise') || title.includes('workout') || 
            title.includes('healthy') || title.includes('weight') || title.includes('muscle') || 
            title.includes('strength') || title.includes('run') || title.includes('gym')) {
          keywords.push('fitness', 'exercise', 'workout', 'healthy', 'weight', 'muscle', 'strength', 'run', 'gym');
        }
        
        // Reading/Learning goals
        if (title.includes('read') || title.includes('book') || title.includes('learn') || 
            title.includes('study') || title.includes('course') || title.includes('skill')) {
          keywords.push('read', 'book', 'learn', 'study', 'course', 'skill', 'education');
        }
        
        // Creative goals
        if (title.includes('write') || title.includes('art') || title.includes('music') || 
            title.includes('creative') || title.includes('design') || title.includes('draw')) {
          keywords.push('write', 'art', 'music', 'creative', 'design', 'draw', 'practice');
        }
        
        // Business/Career goals
        if (title.includes('business') || title.includes('career') || title.includes('job') || 
            title.includes('professional') || title.includes('network') || title.includes('skill')) {
          keywords.push('business', 'career', 'job', 'professional', 'network', 'skill', 'work');
        }
        
        // If no specific category, use general keywords from the title
        if (keywords.length === 0) {
          keywords.push(...title.split(' ').filter(word => word.length > 3));
        }
        
        return keywords;
      };

      // Check if there are any related events for this goal
      const goalKeywords = getGoalKeywords(goalTitle);
      const relatedEvents = events.filter(event => {
        const eventKeywords = extractKeywords((event.title || '') + ' ' + (event.description || ''));
        return goalKeywords.some(goalKeyword => 
          eventKeywords.some(eventKeyword => 
            eventKeyword.includes(goalKeyword) || goalKeyword.includes(eventKeyword)
          )
        );
      });

      // Generate specific actionable suggestions based on goal type
      const getSpecificGoalSuggestions = (goalTitle: string): { action: string; duration: number }[] => {
        const title = goalTitle.toLowerCase();
        
        if (title.includes('code') || title.includes('programming') || title.includes('software') || title.includes('development')) {
          return [
            { action: 'Complete coding challenges on LeetCode', duration: 60 },
            { action: 'Build a small project feature', duration: 120 },
            { action: 'Watch programming tutorials', duration: 45 },
            { action: 'Practice algorithm problems', duration: 90 },
            { action: 'Read coding documentation', duration: 30 },
            { action: 'Work on personal coding project', duration: 150 },
            { action: 'Review code fundamentals', duration: 60 },
            { action: 'Debug and improve existing code', duration: 75 }
          ];
        } else if (title.includes('language') || title.includes('spanish') || title.includes('french') || title.includes('german') || title.includes('japanese') || title.includes('chinese')) {
          return [
            { action: 'Practice vocabulary flashcards', duration: 30 },
            { action: 'Watch movies in target language', duration: 90 },
            { action: 'Have conversation practice', duration: 60 },
            { action: 'Complete language lessons', duration: 45 },
            { action: 'Read articles in target language', duration: 30 },
            { action: 'Practice grammar exercises', duration: 40 },
            { action: 'Write short stories in target language', duration: 60 },
            { action: 'Listen to podcasts in target language', duration: 45 }
          ];
        } else if (title.includes('fitness') || title.includes('exercise') || title.includes('workout') || title.includes('health') || title.includes('weight') || title.includes('muscle')) {
          return [
            { action: 'Follow workout routine', duration: 45 },
            { action: 'Go for a run', duration: 30 },
            { action: 'Practice yoga', duration: 60 },
            { action: 'Strength training session', duration: 45 },
            { action: 'Go to the gym', duration: 60 },
            { action: 'Track nutrition and meals', duration: 15 },
            { action: 'Plan weekly workout schedule', duration: 30 },
            { action: 'Try a new fitness activity', duration: 45 }
          ];
        } else if (title.includes('read') || title.includes('book') || title.includes('learn') || title.includes('study')) {
          return [
            { action: 'Read chapters from goal-related book', duration: 45 },
            { action: 'Research topic online', duration: 30 },
            { action: 'Take notes on reading material', duration: 60 },
            { action: 'Summarize key learnings', duration: 30 },
            { action: 'Find new reading material', duration: 20 },
            { action: 'Join online discussion about topic', duration: 45 },
            { action: 'Create mind map of concepts', duration: 40 },
            { action: 'Practice applying new knowledge', duration: 60 }
          ];
        } else if (title.includes('write') || title.includes('creative') || title.includes('art') || title.includes('design')) {
          return [
            { action: 'Write draft content', duration: 60 },
            { action: 'Edit and revise work', duration: 45 },
            { action: 'Brainstorm new ideas', duration: 30 },
            { action: 'Practice creative exercises', duration: 45 },
            { action: 'Research inspiration', duration: 30 },
            { action: 'Create rough sketches or drafts', duration: 60 },
            { action: 'Get feedback on work', duration: 30 },
            { action: 'Experiment with new techniques', duration: 90 }
          ];
        } else if (title.includes('business') || title.includes('career') || title.includes('professional') || title.includes('skill')) {
          return [
            { action: 'Work on professional skills', duration: 60 },
            { action: 'Network with professionals', duration: 45 },
            { action: 'Update resume or portfolio', duration: 90 },
            { action: 'Apply for opportunities', duration: 60 },
            { action: 'Read industry publications', duration: 30 },
            { action: 'Practice interview skills', duration: 45 },
            { action: 'Complete online course', duration: 120 },
            { action: 'Work on business plan', duration: 90 }
          ];
        } else {
          return [
            { action: `Work on: ${goal.title}`, duration: 60 },
            { action: `Practice skills for: ${goal.title}`, duration: 45 },
            { action: `Research about: ${goal.title}`, duration: 30 },
            { action: `Plan next steps for: ${goal.title}`, duration: 30 },
            { action: `Make progress on: ${goal.title}`, duration: 90 },
            { action: `Review goals for: ${goal.title}`, duration: 20 }
          ];
        }
      };

      // Calculate suggested time based on current schedule
      const { start, end } = getTimeRange();
      const rangeEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate >= start && eventDate < end;
      });
      
      const totalScheduledHours = rangeEvents.reduce((total, event) => {
        return total + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
      }, 0);

      const suggestedDuration = calculateProportionalTime(totalScheduledHours, totalScheduledHours, 'learning');
      
      // Only suggest if no related events for this goal OR if it's been a while
      // Allow multiple suggestions for different goals, but limit suggestions per goal
      const existingGoalSuggestions = suggestions.filter(s => s.id.includes(`goal-${goal.id}`));
      const shouldSuggest = (relatedEvents.length === 0 || (relatedEvents.length > 0 && Math.random() < 0.3)) && 
                           existingGoalSuggestions.length === 0;
      
      if (shouldSuggest) {
        const specificSuggestions = getSpecificGoalSuggestions(goalTitle);
        const seed = `goal-${goal.id}-${Math.round(suggestedDuration)}`;
        const suggestionIndex = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % specificSuggestions.length;
        const randomSuggestion = specificSuggestions[suggestionIndex];
        
        suggestions.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          title: `Progress on: ${goal.title}`,
          description: `Make meaningful progress on "${goal.title}". Consider dedicating ${suggestedDuration} minutes to this goal.`,
          actionLabel: randomSuggestion.action,
          onAction: () => {
            // Find a good time slot for goal work
            const targetDate = getTargetDate();
            targetDate.setHours(10, 0, 0, 0); // 10 AM
            
            const duration = suggestedDuration * 60 * 1000;
            const timeSlot = findAvailableTimeSlot(targetDate, duration);
            
            if (timeSlot) {
              addEvent(randomSuggestion.action, timeSlot.start, timeSlot.end);
              dismissSuggestion(`goal-${goal.id}`);
            } else {
              // Fallback: still add but user will need to resolve conflicts manually
              const endTime = new Date(targetDate);
              endTime.setTime(endTime.getTime() + duration);
              addEvent(randomSuggestion.action, targetDate, endTime);
              dismissSuggestion(`goal-${goal.id}`);
            }
          },
          priority: relatedEvents.length === 0 ? 'high' : 'medium'
        });
      }
    });

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

  // Combine all suggestions and filter out dismissed ones
  const allSuggestions = React.useMemo(() => {
    const scheduleAnalysis = analyzeSchedule();
    const goalAnalysis = analyzeGoals();
    
    const suggestions = [
      ...scheduleAnalysis,
      ...goalAnalysis
    ].filter(suggestion => !dismissedSuggestions.has(suggestion.id))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    return suggestions;
  }, [
    dismissedSuggestions,
    analyzeGoals,
    analyzeSchedule
  ]);

  // Don't render until we're on the client to avoid hydration issues
  if (!isClient) {
    return (
      <div className={`p-6 flex flex-col h-full ${className}`}>
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <Lightbulb size={20} className="text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900 font-mono flex items-center gap-2">
            Suggestions
            <span className="relative group">
              <span className="text-gray-400 text-base font-bold ml-1 cursor-help group-hover:text-gray-600 transition-colors" style={{opacity:0.6}} title="What is this?">?</span>
              <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 w-64 bg-white text-gray-700 text-xs rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200" style={{minWidth:'200px', boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
                Get helpful suggestions to improve your productivity and balance your schedule.
              </span>
            </span>
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center text-gray-500 max-w-xs">
            <div className="animate-pulse">
              <div className="w-10 h-10 bg-gray-300 rounded-full mx-auto mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'break': return <Clock size={16} className="text-blue-600" />;
      case 'goal': return <Target size={16} className="text-purple-600" />;
      case 'balance': return <Lightbulb size={16} className="text-orange-600" />;
      default: return <Lightbulb size={16} className="text-gray-700" />;
    }
  };

  if (allSuggestions.length === 0) {
    return (
      <div className={`p-6 flex flex-col h-full ${className}`}>
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <Lightbulb size={20} className="text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900 font-mono">Suggestions</h3>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center text-gray-500 max-w-xs">
            <Lightbulb size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="text-base font-medium text-gray-700 mb-2">Your schedule looks great!</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Suggestions will appear here when we find opportunities to optimize your schedule or work towards your goals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="suggestions-panel" aria-label="Suggestions" className={`p-6 flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-2 mb-5 flex-shrink-0">
        <Lightbulb size={20} className="text-yellow-600" />
        <h3 className="text-lg font-bold text-gray-900 font-mono flex items-center gap-2">
          Suggestions
          <span className="relative group">
            <span className="text-gray-400 text-base font-bold ml-1 cursor-help group-hover:text-gray-600 transition-colors" style={{opacity:0.6}} title="What is this?">?</span>
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 w-64 bg-white text-gray-700 text-xs rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200" style={{minWidth:'200px', boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
              Get helpful suggestions to improve your productivity and balance your schedule.
            </span>
          </span>
        </h3>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
        {allSuggestions.slice(0, 5).map((suggestion) => (
          <div 
            key={suggestion.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card Header with Icon and Title */}
            <div className="p-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getSuggestionIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-base mb-3 leading-tight">
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card Footer with Action Buttons */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col gap-3">
                {suggestion.actionLabel && (
                  <button
                    onClick={suggestion.onAction}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <Plus size={16} />
                    <span className="truncate">{suggestion.actionLabel}</span>
                  </button>
                )}
                <button
                  onClick={() => dismissSuggestion(suggestion.id)}
                  className="w-full px-4 py-2 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <X size={14} />
                  <span>No thanks</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
