import { Event } from '@/types/events';
import { classifyEvent } from './eventClassification';
import { 
  startOfDay, 
  endOfDay, 
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
}

export interface SchedulingConstraints {
  workingHoursStart: number; // 9 for 9 AM
  workingHoursEnd: number;   // 17 for 5 PM
  minBreakBetweenTasks: number; // minutes
  maxConsecutiveWorkTime: number; // minutes
  preferredMealTimes: Array<{ start: number; end: number; duration: number }>;
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
    ]
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
   * Generate available time slots for the day
   */
  private generateTimeSlots(targetDate: Date, existingEvents: Event[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    
    // Create 15-minute time slots for the entire day
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
   * Classify tasks using AI to determine optimal scheduling
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
          
          return {
            ...task,
            category: classification.category,
            subcategory: classification.subcategory
          };
        } catch (error) {
          console.warn(`Failed to classify task "${task.title}":`, error);
          return task;
        }
      })
    );
    
    return classifiedTasks;
  }

  /**
   * Prioritize tasks based on category, priority, and time preferences
   */
  private prioritizeTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // Priority weight
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
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
        usedSlots
      );
      
      if (optimalSlot) {
        const event = this.createEventFromTask(task, optimalSlot.start, targetDate);
        scheduledEvents.push(event);
        
        // Mark slots as used
        const slotsNeeded = Math.ceil(task.estimatedDuration / 15);
        for (let i = 0; i < slotsNeeded; i++) {
          usedSlots.add(optimalSlot.slotIndex + i);
        }
      }
    }
    
    return scheduledEvents;
  }

  /**
   * Find the optimal time slot for a task based on constraints
   */
  private findOptimalTimeSlot(
    task: Task,
    timeSlots: TimeSlot[],
    usedSlots: Set<number>
  ): { start: Date; slotIndex: number } | null {
    const slotsNeeded = Math.ceil(task.estimatedDuration / 15);
    const category = task.category || 'Personal';
    
    // Define time preferences based on task category
    const getTimePreference = (hour: number): number => {
      if (category === 'Work' || category === 'Education') {
        // Prefer working hours (9-17)
        if (hour >= this.constraints.workingHoursStart && hour < this.constraints.workingHoursEnd) {
          return 3;
        }
        return 1;
      }
      
      if (category === 'Health') {
        // Prefer morning or early afternoon
        if (hour >= 8 && hour < 12) return 3;
        if (hour >= 14 && hour < 16) return 2;
        return 1;
      }
      
      // Personal tasks can be scheduled more flexibly
      if (hour >= 6 && hour < 22) return 2;
      return 1;
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
      
      // Calculate score based on time preferences and constraints
      let score = getTimePreference(hour);
      
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
      
      // Prefer earlier slots for same score (get important tasks done first)
      if (!bestSlot || score > bestSlot.score || (score === bestSlot.score && hour < bestSlot.start.getHours())) {
        bestSlot = {
          start: slotStart,
          slotIndex: i,
          score
        };
      }
    }
    
    return bestSlot ? { start: bestSlot.start, slotIndex: bestSlot.slotIndex } : null;
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
}

// Export a singleton instance
export const taskScheduler = new TaskScheduler();
