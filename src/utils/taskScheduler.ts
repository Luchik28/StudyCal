import { Event } from '@/types/events';
import { classifyEvent } from './eventClassification';
import { 
  startOfDay, 
  addMinutes, 
  addHours,
  format, 
  isSameDay, 
  isWithinInterval,
  setHours,
  setMinutes
} from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedDuration: number; // in minutes
  priority: 'low' | 'medium' | 'high';
  category?: string;
  subcategory?: string;
  preferredTimeSlots?: Array<{ start: number; end: number }>; // hours in 24h format
  subject?: string; // for study sessions and tests
  isTest?: boolean; // whether this is a test/exam
  testDate?: Date; // when the test is scheduled
  relatedTopics?: string[]; // topics covered in this task
}

export interface SchedulingConstraints {
  workingHoursStart: number; // 9 for 9 AM
  workingHoursEnd: number;   // 17 for 5 PM
  minBreakBetweenTasks: number; // minutes
  maxConsecutiveWorkTime: number; // minutes
  preferredMealTimes: Array<{ start: number; end: number; duration: number }>;
  studySessionConstraints: {
    minTimeBetweenSameTopic: number; // hours between same subject study sessions
    maxDailyStudyTime: number; // max minutes of study per day
    preferredStudyHours: { start: number; end: number }; // best study hours
    breakAfterLongStudy: number; // minutes break after long study sessions
  };
  workLifeBalance: {
    maxDailyWorkHours: number; // maximum work hours per day
    weekendWorkReduction: number; // percentage reduction of work on weekends
    eveningCutoff: number; // hour after which no work tasks
    morningStartEarliest: number; // earliest hour to start work
  };
  testPreparation: {
    minStudyDaysBeforeTest: number; // minimum days to study before test
    intensityMultiplier: number; // increase study frequency before tests
    lastMinuteStudyHours: number; // hours for cramming if needed
  };
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  existingEvent?: Event;
}

export class TaskScheduler {
  private constraints: SchedulingConstraints = {
    workingHoursStart: 9,
    workingHoursEnd: 17,
    minBreakBetweenTasks: 15,
    maxConsecutiveWorkTime: 120,
    preferredMealTimes: [
      { start: 12, end: 14, duration: 60 }, // Lunch
      { start: 18, end: 20, duration: 45 }  // Dinner
    ],
    studySessionConstraints: {
      minTimeBetweenSameTopic: 4, // 4 hours between same subject
      maxDailyStudyTime: 360, // 6 hours max study per day
      preferredStudyHours: { start: 9, end: 17 }, // study during the day
      breakAfterLongStudy: 30 // 30 min break after 2+ hour study sessions
    },
    workLifeBalance: {
      maxDailyWorkHours: 480, // 8 hours max work per day
      weekendWorkReduction: 50, // 50% less work on weekends
      eveningCutoff: 19, // no work after 7 PM
      morningStartEarliest: 7 // don't start work before 7 AM
    },
    testPreparation: {
      minStudyDaysBeforeTest: 3, // start studying 3 days before test
      intensityMultiplier: 1.5, // 50% more study time before tests
      lastMinuteStudyHours: 2 // minimum 2 hours of last-minute study
    }
  };

  constructor(customConstraints?: Partial<SchedulingConstraints>) {
    if (customConstraints) {
      this.constraints = { ...this.constraints, ...customConstraints };
    }
  }

  /**
   * Schedule tasks into optimal time slots
   */
  async scheduleTasks(
    tasks: Task[],
    targetDate: Date,
    existingEvents: Event[]
  ): Promise<Event[]> {
    // Generate time slots for the day
    const timeSlots = this.generateTimeSlots(targetDate, existingEvents);
    
    // Classify and prioritize tasks
    const classifiedTasks = await this.classifyTasks(tasks);
    
    // Sort tasks by priority and constraints
    const sortedTasks = this.prioritizeTasks(classifiedTasks);
    
    // Schedule tasks using constraint satisfaction
    const scheduledEvents = this.optimizeSchedule(sortedTasks, timeSlots, targetDate);
    
    return scheduledEvents;
  }

  /**
   * Generate available time slots for the day (limited to reasonable hours)
   */
  private generateTimeSlots(targetDate: Date, existingEvents: Event[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // Limit to reasonable hours: 7 AM to 11 PM
    const dayStart = setHours(setMinutes(startOfDay(targetDate), 0), 7);
    const dayEnd = setHours(setMinutes(startOfDay(targetDate), 0), 23);
    
    // Create 15-minute time slots for reasonable hours only
    let currentTime = dayStart;
    while (currentTime < dayEnd) {
      const slotEnd = addMinutes(currentTime, 15);
      
      // Check if this slot conflicts with existing events
      const hasConflict = existingEvents.some(event => {
        if (!isSameDay(event.startTime, targetDate)) return false;
        
        return isWithinInterval(currentTime, { 
          start: event.startTime, 
          end: event.endTime 
        }) || isWithinInterval(slotEnd, { 
          start: event.startTime, 
          end: event.endTime 
        });
      });
      
      const existingEvent = existingEvents.find(event => 
        isSameDay(event.startTime, targetDate) &&
        isWithinInterval(currentTime, { 
          start: event.startTime, 
          end: event.endTime 
        })
      );
      
      slots.push({
        start: currentTime,
        end: slotEnd,
        available: !hasConflict,
        existingEvent
      });
      
      currentTime = slotEnd;
    }
    
    return slots;
  }

  /**
   * Classify tasks using AI to determine optimal scheduling and extract additional metadata
   */
  private async classifyTasks(tasks: Task[]): Promise<Task[]> {
    const classifiedTasks = await Promise.all(
      tasks.map(async (task) => {
        try {
          // Create a temporary event for classification
          const tempEvent: Event = {
            id: task.id,
            title: task.title,
            description: task.description || '',
            startTime: new Date(), // placeholder
            endTime: addMinutes(new Date(), task.estimatedDuration),
            category: 'Personal',
            subcategory: 'Activity',
            color: '#6B7280',
            dayOfWeek: 0
          };
          
          const classification = await classifyEvent(tempEvent);
          
          // Extract subject and detect if it's a test
          const enhancedTask = this.enhanceTaskMetadata({
            ...task,
            category: classification.category,
            subcategory: classification.subcategory
          });
          
          return enhancedTask;
        } catch (error) {
          console.warn(`Failed to classify task "${task.title}":`, error);
          return this.enhanceTaskMetadata(task);
        }
      })
    );
    
    return classifiedTasks;
  }

  /**
   * Extract additional metadata from task title and description
   */
  private enhanceTaskMetadata(task: Task): Task {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    
    // Detect if it's a test/exam
    const testKeywords = ['test', 'exam', 'quiz', 'midterm', 'final', 'assessment', 'evaluation'];
    const isTest = testKeywords.some(keyword => text.includes(keyword));
    
    // Extract subject from common patterns
    const subject = this.extractSubject(task.title, task.description);
    
    // Extract topics from title/description
    const relatedTopics = this.extractTopics(text);
    
    return {
      ...task,
      subject,
      isTest,
      relatedTopics
    };
  }

  /**
   * Extract subject from task title and description
   */
  private extractSubject(title: string, description?: string): string | undefined {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    // Enhanced subject detection with more comprehensive patterns
    const subjects = [
      // STEM subjects
      'mathematics', 'math', 'calculus', 'algebra', 'geometry', 'statistics', 'trigonometry',
      'physics', 'chemistry', 'biology', 'biochemistry', 'anatomy', 'physiology',
      'computer science', 'programming', 'coding', 'software engineering', 'data science',
      'engineering', 'mechanical engineering', 'electrical engineering', 'civil engineering',
      
      // Liberal Arts
      'history', 'english', 'literature', 'writing', 'composition', 'linguistics',
      'philosophy', 'psychology', 'sociology', 'anthropology', 'political science',
      'economics', 'business', 'accounting', 'finance', 'marketing', 'management',
      
      // Languages
      'spanish', 'french', 'german', 'italian', 'chinese', 'japanese', 'korean',
      'arabic', 'russian', 'portuguese', 'language', 'linguistics',
      
      // Arts and Others
      'art', 'music', 'theater', 'drama', 'dance', 'film', 'photography',
      'geography', 'geology', 'environmental science', 'astronomy'
    ];
    
    // Direct subject match
    for (const subject of subjects) {
      if (text.includes(subject)) {
        return subject.charAt(0).toUpperCase() + subject.slice(1);
      }
    }
    
    // Enhanced pattern matching for subject extraction
    const patterns = [
      /(?:study|studying|review|reviewing|learn|learning)\s+(\w+)/,
      /(\w+)\s+(?:homework|assignment|project|essay|paper|report)/,
      /(\w+)\s+(?:exam|test|quiz|midterm|final)/,
      /(\w+)\s+(?:class|course|lecture|seminar)/,
      /prepare\s+for\s+(\w+)/,
      /(\w+)\s+(?:chapter|unit|lesson)/,
      /work\s+on\s+(\w+)/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        // Filter out common words that aren't subjects
        const commonWords = ['the', 'and', 'for', 'with', 'about', 'from', 'that', 'this', 'have', 'will'];
        if (!commonWords.includes(match[1].toLowerCase())) {
          return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract topics from task text with enhanced detection
   */
  private extractTopics(text: string): string[] {
    const topics = [];
    
    // Comprehensive topic keywords organized by subject area
    const topicKeywords = {
      mathematics: [
        'algebra', 'calculus', 'trigonometry', 'geometry', 'statistics', 'probability',
        'derivatives', 'integrals', 'limits', 'functions', 'equations', 'matrices',
        'vectors', 'differential equations', 'linear algebra'
      ],
      science: [
        'physics', 'chemistry', 'biology', 'anatomy', 'physiology', 'genetics',
        'molecules', 'atoms', 'cells', 'organisms', 'reactions', 'forces',
        'energy', 'motion', 'waves', 'thermodynamics', 'electromagnetism'
      ],
      humanities: [
        'history', 'literature', 'grammar', 'vocabulary', 'rhetoric', 'philosophy',
        'ethics', 'logic', 'poetry', 'prose', 'essay', 'analysis', 'criticism'
      ],
      technology: [
        'programming', 'algorithms', 'data structures', 'databases', 'networks',
        'software', 'hardware', 'coding', 'debugging', 'testing', 'api'
      ],
      business: [
        'economics', 'marketing', 'accounting', 'finance', 'management',
        'strategy', 'operations', 'supply chain', 'budgeting', 'investing'
      ],
      social: [
        'psychology', 'sociology', 'anthropology', 'political science',
        'behavior', 'society', 'culture', 'government', 'policy'
      ]
    };
    
    // Check all topic keywords
    const allTopics = Object.values(topicKeywords).flat();
    for (const topic of allTopics) {
      if (text.includes(topic)) {
        topics.push(topic.charAt(0).toUpperCase() + topic.slice(1));
      }
    }
    
    // Extract topics from common academic patterns
    const topicPatterns = [
      /chapter\s+\d+[:\s]*([^,.\n]+)/gi,
      /unit\s+\d+[:\s]*([^,.\n]+)/gi,
      /lesson\s+on\s+([^,.\n]+)/gi,
      /learn\s+about\s+([^,.\n]+)/gi,
      /study\s+([^,.\n]+(?:theory|principle|concept|method|approach))/gi,
      /review\s+([^,.\n]+(?:notes|material|content))/gi
    ];
    
    for (const pattern of topicPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const topic = match[1].trim();
        if (topic.length > 2 && topic.length < 50) {
          // Clean up the topic
          const cleanTopic = topic.replace(/[^\w\s]/g, '').trim();
          if (cleanTopic) {
            topics.push(cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1));
          }
        }
      }
    }
    
    // Remove duplicates and return
    return [...new Set(topics)];
  }

  /**
   * Prioritize tasks based on category, priority, time preferences, and academic constraints
   */
  private prioritizeTasks(tasks: Task[]): Task[] {
    // Find all tests and their dates
    const tests = tasks.filter(task => task.isTest);
    
    return tasks.sort((a, b) => {
      // Priority weight
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      
      // Test urgency - tests should be scheduled first to reserve time
      if (a.isTest && !b.isTest) return -1;
      if (!a.isTest && b.isTest) return 1;
      
      // Study sessions for upcoming tests get higher priority
      if (!a.isTest && !b.isTest) {
        const aTestUrgency = this.getStudyUrgencyForTask(a, tests);
        const bTestUrgency = this.getStudyUrgencyForTask(b, tests);
        
        if (aTestUrgency !== bTestUrgency) {
          return bTestUrgency - aTestUrgency;
        }
      }
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Category-based scheduling preferences
      const getTimeSensitivity = (task: Task) => {
        const category = task.category || 'Personal';
        // Work and Education tasks should be scheduled earlier in working hours
        if (category === 'Work' || category === 'Education') return 3;
        if (category === 'Health') return 2;
        return 1;
      };
      
      return getTimeSensitivity(b) - getTimeSensitivity(a);
    });
  }

  /**
   * Calculate study urgency based on upcoming tests with enhanced logic
   */
  private getStudyUrgencyForTask(task: Task, tests: Task[]): number {
    if (task.category !== 'Education' || (!task.subject && (!task.relatedTopics || task.relatedTopics.length === 0))) return 0;
    
    // Find tests in the same subject or with overlapping topics
    const relatedTests = tests.filter(test => {
      if (!test.testDate) return false;
      
      // Same subject match
      if (task.subject && test.subject === task.subject) return true;
      
      // Topic overlap
      if (test.relatedTopics && task.relatedTopics) {
        return test.relatedTopics.some(testTopic => 
          task.relatedTopics?.some(taskTopic => 
            testTopic.toLowerCase() === taskTopic.toLowerCase()
          )
        );
      }
      
      // Fuzzy subject matching for related subjects
      if (task.subject && test.subject) {
        const taskSubj = task.subject.toLowerCase();
        const testSubj = test.subject.toLowerCase();
        
        // Check for related subjects (e.g., "calculus" and "mathematics")
        const subjectGroups = [
          ['math', 'mathematics', 'calculus', 'algebra', 'geometry', 'statistics'],
          ['physics', 'science'],
          ['chemistry', 'science'],
          ['biology', 'science', 'anatomy', 'physiology'],
          ['english', 'literature', 'writing'],
          ['history', 'social studies'],
          ['computer science', 'programming', 'coding', 'software']
        ];
        
        return subjectGroups.some(group => 
          group.some(s => taskSubj.includes(s)) && 
          group.some(s => testSubj.includes(s))
        );
      }
      
      return false;
    });
    
    if (relatedTests.length === 0) return 0;
    
    // Calculate urgency based on all related tests
    let maxUrgency = 0;
    
    for (const test of relatedTests) {
      if (!test.testDate) continue;
      
      const daysUntilTest = Math.ceil(
        (test.testDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      let urgency = 0;
      
      // Urgency scoring based on time until test
      if (daysUntilTest <= 0) {
        urgency = 6; // Test is today or overdue - extremely urgent
      } else if (daysUntilTest <= 1) {
        urgency = 5; // Test tomorrow - very urgent
      } else if (daysUntilTest <= 3) {
        urgency = 4; // Test in 2-3 days - urgent
      } else if (daysUntilTest <= 7) {
        urgency = 3; // Test this week - important
      } else if (daysUntilTest <= 14) {
        urgency = 2; // Test in two weeks - moderate
      } else {
        urgency = 1; // Test far out - low urgency
      }
      
      // Boost urgency for high-priority tests
      if (test.priority === 'high') {
        urgency = Math.min(6, urgency + 1);
      }
      
      // Reduce urgency slightly if we have minimum study days
      const minStudyDays = this.constraints.testPreparation.minStudyDaysBeforeTest;
      if (daysUntilTest > minStudyDays) {
        urgency = Math.max(1, urgency - 0.5);
      }
      
      maxUrgency = Math.max(maxUrgency, urgency);
    }
    
    return maxUrgency;
  }

  /**
   * Optimize schedule using constraint satisfaction principles
   */
  private optimizeSchedule(
    tasks: Task[],
    timeSlots: TimeSlot[],
    targetDate: Date
  ): Event[] {
    const scheduledEvents: Event[] = [];
    const usedSlots = new Set<number>();
    
    for (const task of tasks) {
      const optimalSlot = this.findOptimalTimeSlot(
        task,
        timeSlots,
        usedSlots,
        scheduledEvents
      );
      
      if (optimalSlot) {
        const event = this.createEventFromTask(task, optimalSlot.start, targetDate);
        scheduledEvents.push(event);
        
        // Mark slots as used
        const slotsNeeded = Math.ceil(task.estimatedDuration / 15);
        for (let i = 0; i < slotsNeeded; i++) {
          usedSlots.add(optimalSlot.slotIndex + i);
        }
        
        // TODO: If a task is long and a break is recommended, add a suggestion to the suggestions list instead of scheduling a break event.
      }
    }
    
    return scheduledEvents;
  }

  /**
   * Find the optimal time slot for a task based on enhanced constraints
   */
  private findOptimalTimeSlot(
    task: Task,
    timeSlots: TimeSlot[],
    usedSlots: Set<number>,
    scheduledEvents: Event[] = []
  ): { start: Date; slotIndex: number } | null {
    const slotsNeeded = Math.ceil(task.estimatedDuration / 15);
    const category = task.category || 'Personal';
    
    // Define time preferences based on task category and new constraints
    const getTimePreference = (hour: number, dayOfWeek: number): number => {
      let score = 1;
      
      // Global reasonable hours check - avoid very early morning and very late night
      if (hour < 7 || hour >= 23) {
        return 0; // Never schedule between 11 PM and 7 AM
      }
      
      // Discourage very early morning (7-9 AM) and late night (9-11 PM) for most tasks
      if (hour < 9 || hour >= 21) {
        score *= 0.3; // Heavy penalty for early morning and late evening
      }
      
      // Work-life balance constraints
      if (category === 'Work') {
        // No work before morning start or after evening cutoff
        if (hour < this.constraints.workLifeBalance.morningStartEarliest || 
            hour >= this.constraints.workLifeBalance.eveningCutoff) {
          return 0;
        }
        
        // Reduced work on weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          score *= (1 - this.constraints.workLifeBalance.weekendWorkReduction / 100);
        }
        
        // Prefer working hours
        if (hour >= this.constraints.workingHoursStart && hour < this.constraints.workingHoursEnd) {
          score = 3;
        }
      }
      
      // Education/Study session preferences
      if (category === 'Education') {
        if (hour >= this.constraints.studySessionConstraints.preferredStudyHours.start && 
            hour < this.constraints.studySessionConstraints.preferredStudyHours.end) {
          score = 3;
        }
        
        // Check for study session spacing
        if (task.subject && this.hasRecentStudySession(task, hour, scheduledEvents)) {
          score *= 0.3; // Heavily penalize too close to another study session
        }
      }
      
      if (category === 'Health') {
        // Prefer morning or early afternoon
        if (hour >= 8 && hour < 12) score = 3;
        if (hour >= 14 && hour < 17) score = 2;
        // Discourage very late health activities
        if (hour >= 20) score *= 0.5;
      }
      
      // Personal tasks - prefer reasonable daytime/evening hours
      if (category === 'Personal') {
        // Prime time for personal activities: late morning to evening
        if (hour >= 10 && hour < 20) {
          score = 2.5;
        } else if (hour >= 8 && hour < 21) {
          score = 2;
        } else {
          score = 1;
        }
        
        // Slight preference for evening over early morning for social activities
        if (task.title.toLowerCase().includes('friend') || 
            task.title.toLowerCase().includes('social') ||
            task.title.toLowerCase().includes('hangout') ||
            task.title.toLowerCase().includes('party')) {
          if (hour >= 18 && hour < 21) {
            score = 3; // Evening is prime time for social activities
          } else if (hour >= 15 && hour < 18) {
            score = 2.5; // Afternoon is also good
          } else if (hour < 12) {
            score *= 0.6; // Morning is less ideal for social activities
          }
        }
      }
      
      return score;
    };
    
    let bestSlot: { start: Date; slotIndex: number; score: number } | null = null;
    
    // Find all possible slots that can accommodate the task
    for (let i = 0; i <= timeSlots.length - slotsNeeded; i++) {
      // Check if all needed consecutive slots are available
      let canSchedule = true;
      for (let j = 0; j < slotsNeeded; j++) {
        if (usedSlots.has(i + j) || !timeSlots[i + j]?.available) {
          canSchedule = false;
          break;
        }
      }
      
      if (!canSchedule) continue;
      
      const slotStart = timeSlots[i].start;
      const hour = slotStart.getHours();
      const dayOfWeek = slotStart.getDay();
      
      // Calculate score based on time preferences and constraints
      let score = getTimePreference(hour, dayOfWeek);
      
      if (score === 0) continue; // Skip if completely invalid time
      
      // Bonus for preferred time slots
      if (task.preferredTimeSlots) {
        const isPreferredTime = task.preferredTimeSlots.some(
          pref => hour >= pref.start && hour < pref.end
        );
        if (isPreferredTime) score += 2;
      }
      
      // Penalty for meal times (unless it's a meal-related task)
      const isMealTime = this.constraints.preferredMealTimes.some(
        meal => hour >= meal.start && hour < meal.end
      );
      if (isMealTime && !task.subcategory?.toLowerCase().includes('meal')) {
        score -= 1;
      }
      
      // Bonus for break-friendly scheduling
      if (this.shouldScheduleBreakAfter(task, i, timeSlots, usedSlots)) {
        score += 0.5;
      }
      
      // Work-life balance scoring
      score *= this.getWorkLifeBalanceMultiplier(task, hour, dayOfWeek, scheduledEvents);
      
      // Smart tie-breaking: prefer earlier for high-score slots, later for low-score slots
      const isHighScore = score >= 2.0; // Prime time slots
      const isLowScore = score < 1.5;   // Non-prime time slots
      
      if (!bestSlot || score > bestSlot.score) {
        bestSlot = {
          start: slotStart,
          slotIndex: i,
          score
        };
      } else if (score === bestSlot.score) {
        // For tie-breaking with same score:
        if (isHighScore) {
          // For high-score (prime time) slots, prefer earlier in the day
          if (hour < bestSlot.start.getHours()) {
            bestSlot = { start: slotStart, slotIndex: i, score };
          }
        } else if (isLowScore) {
          // For low-score (non-prime) slots, prefer later in the day (but still reasonable)
          if (hour > bestSlot.start.getHours() && hour < 21) {
            bestSlot = { start: slotStart, slotIndex: i, score };
          }
        } else {
          // For medium-score slots, prefer earlier
          if (hour < bestSlot.start.getHours()) {
            bestSlot = { start: slotStart, slotIndex: i, score };
          }
        }
      }
    }
    
    return bestSlot ? { start: bestSlot.start, slotIndex: bestSlot.slotIndex } : null;
  }

  /**
   * Check if there's a recent study session for the same subject with enhanced spacing logic
   */
  private hasRecentStudySession(task: Task, hour: number, scheduledEvents: Event[]): boolean {
    if (!task.subject && (!task.relatedTopics || task.relatedTopics.length === 0)) return false;
    
    const minHours = this.constraints.studySessionConstraints.minTimeBetweenSameTopic;
    
    return scheduledEvents.some(event => {
      if (event.category !== 'Education') return false;
      
      // Check if it's the same subject
      let isSameSubject = false;
      
      if (task.subject) {
        isSameSubject = event.title.toLowerCase().includes(task.subject.toLowerCase()) ||
          (event.description?.toLowerCase().includes(task.subject.toLowerCase()) ?? false);
      }
      
      // Check for overlapping topics
      if (!isSameSubject && task.relatedTopics && task.relatedTopics.length > 0) {
        isSameSubject = task.relatedTopics.some(topic => 
          event.title.toLowerCase().includes(topic.toLowerCase()) ||
          event.description?.toLowerCase().includes(topic.toLowerCase())
        );
      }
      
      if (!isSameSubject) return false;
      
      const eventHour = event.startTime.getHours();
      const timeDiff = Math.abs(eventHour - hour);
      
      // Adjust spacing based on session length and priority
      let adjustedMinHours = minHours;
      
      // Longer study sessions need more spacing
      const sessionDuration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
      if (sessionDuration >= 120) { // 2+ hours
        adjustedMinHours = Math.max(minHours, 6); // At least 6 hours apart
      } else if (sessionDuration >= 90) { // 1.5+ hours
        adjustedMinHours = Math.max(minHours, 5); // At least 5 hours apart
      }
      
      // High priority tasks can be scheduled closer together if needed
      if (task.priority === 'high') {
        adjustedMinHours = Math.max(2, adjustedMinHours * 0.7);
      }
      
      return timeDiff < adjustedMinHours;
    });
  }

  /**
   * Check if we should reserve space for a break after this task
   */
  private shouldScheduleBreakAfter(
    task: Task, 
    slotIndex: number, 
    timeSlots: TimeSlot[], 
    usedSlots: Set<number>
  ): boolean {
    // Long tasks (2+ hours) should have breaks after
    if (task.estimatedDuration >= 120) {
      const breakSlotsNeeded = Math.ceil(this.constraints.studySessionConstraints.breakAfterLongStudy / 15);
      const taskSlotsNeeded = Math.ceil(task.estimatedDuration / 15);
      
      // Check if break slots are available after the task
      for (let i = 0; i < breakSlotsNeeded; i++) {
        const breakSlotIndex = slotIndex + taskSlotsNeeded + i;
        if (breakSlotIndex >= timeSlots.length || 
            usedSlots.has(breakSlotIndex) || 
            !timeSlots[breakSlotIndex]?.available) {
          return false;
        }
      }
      return true;
    }
    
    return false;
  }

  /**
   * Get work-life balance multiplier for scoring
   */
  private getWorkLifeBalanceMultiplier(
    task: Task, 
    hour: number, 
    dayOfWeek: number, 
    scheduledEvents: Event[]
  ): number {
    if (task.category !== 'Work') return 1;
    
    // Calculate daily work hours so far
    const dayEvents = scheduledEvents.filter(event => 
      event.category === 'Work' && event.startTime.getDay() === dayOfWeek
    );
    
    const totalWorkMinutes = dayEvents.reduce((total, event) => {
      return total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
    }, 0);
    
    const maxWorkMinutes = this.constraints.workLifeBalance.maxDailyWorkHours;
    
    // Heavily penalize if we're approaching max work hours
    if (totalWorkMinutes + task.estimatedDuration > maxWorkMinutes) {
      return 0.1;
    }
    
    // Gradually reduce preference as we approach limit
    const utilizationRatio = totalWorkMinutes / maxWorkMinutes;
    return Math.max(0.3, 1 - utilizationRatio);
  }

  /**
   * Create an Event object from a scheduled task
   */
  private createEventFromTask(task: Task, startTime: Date, targetDate: Date): Event {
    // Set the date to the target date while preserving the time
    const eventStart = setHours(
      setMinutes(targetDate, startTime.getMinutes()),
      startTime.getHours()
    );
    const eventEnd = addMinutes(eventStart, task.estimatedDuration);
    
    // Determine color based on category
    const getCategoryColor = (category?: string): string => {
      const colors = {
        'Work': '#3B82F6',
        'Education': '#8B5CF6',
        'Health': '#EF4444',
        'Personal': '#10B981'
      };
      return colors[category as keyof typeof colors] || '#6B7280';
    };
    
    return {
      id: `scheduled_${task.id}_${Date.now()}`,
      title: task.title,
      description: task.description || '',
      startTime: eventStart,
      endTime: eventEnd,
      category: task.category || 'Personal',
      subcategory: task.subcategory || 'Activity',
      color: getCategoryColor(task.category),
      dayOfWeek: eventStart.getDay()
    };
  }

  /**
   * Schedule tasks for a week with distribution across days
   */
  async scheduleTasksForWeek(
    tasks: Task[],
    weekStart: Date,
    existingEvents: Event[]
  ): Promise<{ [key: string]: Event[] }> {
    const result: { [key: string]: Event[] } = {};
    
    // Distribute tasks across the week
    const distributedTasks = this.distributeTasksAcrossWeek(tasks, weekStart);
    
    for (const [dateKey, dayTasks] of Object.entries(distributedTasks)) {
      const targetDate = new Date(dateKey);
      const dayEvents = existingEvents.filter(event => 
        isSameDay(event.startTime, targetDate)
      );
      
      const scheduledEvents = await this.scheduleTasks(dayTasks, targetDate, dayEvents);
      result[dateKey] = scheduledEvents;
    }
    
    return result;
  }

  /**
   * Distribute tasks across the week based on workload and preferences
   */
  private distributeTasksAcrossWeek(tasks: Task[], weekStart: Date): { [key: string]: Task[] } {
    const distribution: { [key: string]: Task[] } = {};
    
    // Initialize days
    for (let i = 0; i < 7; i++) {
      const date = addHours(weekStart, i * 24);
      const dateKey = format(date, 'yyyy-MM-dd');
      distribution[dateKey] = [];
    }
    
    // Sort tasks by priority and estimated duration
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedDuration - a.estimatedDuration; // Longer tasks first
    });
    
    // Distribute tasks trying to balance workload
    const dayWorkloads: { [key: string]: number } = {};
    Object.keys(distribution).forEach(key => dayWorkloads[key] = 0);
    
    for (const task of sortedTasks) {
      // Find the day with the least workload that can accommodate this task
      const availableDays = Object.keys(distribution).filter(dateKey => {
        const date = new Date(dateKey);
        const dayOfWeek = date.getDay();
        
        // Skip weekends for work/education tasks unless necessary
        if ((task.category === 'Work' || task.category === 'Education') && 
            (dayOfWeek === 0 || dayOfWeek === 6)) {
          return dayWorkloads[dateKey] < 240; // Only if very light workload
        }
        
        return dayWorkloads[dateKey] < 480; // Max 8 hours per day
      });
      
      if (availableDays.length > 0) {
        // Choose day with minimum workload
        const bestDay = availableDays.reduce((a, b) => 
          dayWorkloads[a] < dayWorkloads[b] ? a : b
        );
        
        distribution[bestDay].push(task);
        dayWorkloads[bestDay] += task.estimatedDuration;
      }
    }
    
    return distribution;
  }

  /**
   * Schedule a break after a long task
   */
  private scheduleBreakAfterTask(
    taskEvent: Event,
    breakStartSlotIndex: number,
    timeSlots: TimeSlot[],
    usedSlots: Set<number>
  ): Event | null {
    const breakDuration = this.constraints.studySessionConstraints.breakAfterLongStudy;
    const breakSlotsNeeded = Math.ceil(breakDuration / 15);
    
    // Check if break slots are available
    for (let i = 0; i < breakSlotsNeeded; i++) {
      const slotIndex = breakStartSlotIndex + i;
      if (slotIndex >= timeSlots.length || 
          usedSlots.has(slotIndex) || 
          !timeSlots[slotIndex]?.available) {
        return null;
      }
    }
    
    // Mark break slots as used
    for (let i = 0; i < breakSlotsNeeded; i++) {
      usedSlots.add(breakStartSlotIndex + i);
    }
    
    // Create break event
    const breakStart = timeSlots[breakStartSlotIndex].start;
    const breakEnd = addMinutes(breakStart, breakDuration);
    
    return {
      id: `break_after_${taskEvent.id}`,
      title: `Break (after ${taskEvent.title})`,
      description: `Scheduled break following ${taskEvent.title}`,
      startTime: breakStart,
      endTime: breakEnd,
      category: 'Personal',
      subcategory: 'Break',
      color: '#F59E0B',
      dayOfWeek: breakStart.getDay()
    };
  }
}

// Export a singleton instance
export const taskScheduler = new TaskScheduler();
