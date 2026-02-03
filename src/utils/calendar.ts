import { format, startOfWeek, addDays, setHours, setMinutes, isSameDay } from 'date-fns';
import { Event, CalendarEvent } from '@/types/events';

export const HOURS_IN_DAY = 24;
export const HOUR_HEIGHT = 60; // pixels per hour
export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const EVENT_COLORS = [
  '#FFB3B3', // Pastel Red
  '#B3D9FF', // Pastel Blue
  '#B3FFB3', // Pastel Green
  '#FFFFB3', // Pastel Yellow
  '#DDB3FF', // Pastel Purple
  '#FFB3DD', // Pastel Pink
  '#B3FFFF', // Pastel Cyan
  '#FFFFD9', // Pastel Cream
];

export function getWeekDays(currentDate: Date): Date[] {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start on Sunday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatDay(date: Date): string {
  return format(date, 'EEEE, MMM d');
}

export function generateTimeSlots(timeFormat: '12h' | '24h' = '12h'): string[] {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const time = setHours(setMinutes(new Date(), 0), hour);
    if (timeFormat === '24h') {
      slots.push(format(time, 'HH:mm'));
    } else {
      slots.push(format(time, 'h a'));
    }
  }
  return slots;
}

export function calculateEventPosition(event: Event): { top: number; height: number } {
  const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
  const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;
  
  return {
    top: startHour * HOUR_HEIGHT,
    height: (endHour - startHour) * HOUR_HEIGHT,
  };
}

export function getEventsForDay(events: Event[], date: Date): CalendarEvent[] {
  return events
    .filter(event => isSameDay(event.startTime, date))
    .map(event => {
      const basePosition = calculateEventPosition(event);
      return {
        ...event,
        position: {
          ...basePosition,
          left: 0,
          width: 100,
          zIndex: 1,
        },
      };
    });
}

export function createTimeSlot(date: Date, hour: number, minute: number = 0): Date {
  return setMinutes(setHours(date, hour), minute);
}

export function getRandomColor(): string {
  return EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)];
}

// Calculate time from pixel position
export function getTimeFromPosition(position: number): { hour: number; minute: number } {
  const totalMinutes = (position / HOUR_HEIGHT) * 60;
  const hour = Math.floor(totalMinutes / 60);
  const minute = Math.round((totalMinutes % 60) / 15) * 15; // Snap to 15-minute intervals
  
  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(45, minute))
  };
}

// Generate 15-minute time slots for a day
export function generateQuarterHourSlots(): { hour: number; minute: number; label: string }[] {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const date = setMinutes(setHours(new Date(), hour), minute);
      slots.push({
        hour,
        minute,
        label: format(date, 'HH:mm')
      });
    }
  }
  return slots;
}

// Snap time to nearest 15-minute interval
export function snapToQuarterHour(date: Date): Date {
  const minutes = date.getMinutes();
  const snappedMinutes = Math.round(minutes / 15) * 15;
  const result = new Date(date);
  result.setMinutes(snappedMinutes, 0, 0);
  
  // Handle hour overflow
  if (snappedMinutes === 60) {
    result.setHours(result.getHours() + 1);
    result.setMinutes(0);
  }
  
  return result;
}

// Calculate new time from mouse position during resize
export function calculateTimeFromMousePosition(
  mouseY: number,
  containerTop: number,
  scrollTop: number = 0
): Date {
  const relativeY = mouseY - containerTop + scrollTop;
  const hourDecimal = relativeY / HOUR_HEIGHT;
  const hour = Math.floor(hourDecimal);
  const minutes = (hourDecimal - hour) * 60;
  
  const date = new Date();
  date.setHours(Math.max(0, Math.min(23, hour)));
  date.setMinutes(Math.max(0, Math.min(59, minutes)));
  
  return snapToQuarterHour(date);
}

export interface EventPosition {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

export interface PositionedEvent extends Event {
  position: EventPosition;
}

// Check if two events overlap in time
export function eventsOverlap(event1: Event, event2: Event): boolean {
  return event1.startTime < event2.endTime && event1.endTime > event2.startTime;
}

// Calculate positions for overlapping events with smart segment-based positioning
export function calculateOverlapPositions(events: Event[]): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort events by start time, then by end time for consistent ordering
  const sortedEvents = [...events].sort((a, b) => {
    const startDiff = a.startTime.getTime() - b.startTime.getTime();
    if (startDiff === 0) {
      return a.endTime.getTime() - b.endTime.getTime();
    }
    return startDiff;
  });

  const positionedEvents: PositionedEvent[] = [];
  
  // Process each event and find its optimal position
  for (const event of sortedEvents) {
    const basePosition = calculateEventPosition(event);
    
    // Find all events that overlap with this event (including already positioned ones)
    const overlappingEvents = positionedEvents.filter(positioned => 
      eventsOverlap(event, positioned)
    );
    
    if (overlappingEvents.length === 0) {
      // No overlaps - event gets full width
      positionedEvents.push({
        ...event,
        position: {
          ...basePosition,
          left: 0,
          width: 100,
          zIndex: 1,
        },
      });
    } else {
      // Group events that overlap with each other in the same time segment
      const overlapGroup: Event[] = [event];
      
      // Find all events that overlap within this time window
      for (const positioned of positionedEvents) {
        if (eventsOverlap(event, positioned)) {
          overlapGroup.push(positioned);
        }
      }
      
      // Sort overlap group by start time
      overlapGroup.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      // Calculate the number of concurrent events at any point in this group
      const maxConcurrent = calculateMaxConcurrentEvents(overlapGroup);
      const columnWidth = 100 / maxConcurrent;
      
      // Assign column based on the event's position in the sorted group
      let columnIndex = 0;
      const usedColumns = new Set<number>();
      
      // Check which columns are already used by overlapping events
      for (const positioned of overlappingEvents) {
        const positionedColumn = Math.floor(positioned.position.left / columnWidth);
        usedColumns.add(positionedColumn);
      }
      
      // Find the first available column
      while (usedColumns.has(columnIndex)) {
        columnIndex++;
      }
      
      // Position the event
      positionedEvents.push({
        ...event,
        position: {
          ...basePosition,
          left: columnIndex * columnWidth,
          width: columnWidth - 0.5, // Small gap between columns
          zIndex: columnIndex + 1,
        },
      });
      
      // Update positions of overlapping events if needed to optimize layout
      updateOverlappingEventPositions(positionedEvents, overlapGroup);
    }
  }

  return positionedEvents;
}

// Helper function to calculate maximum concurrent events at any point
function calculateMaxConcurrentEvents(events: Event[]): number {
  if (events.length === 0) return 0;
  
  // Create time points for all start and end times
  const timePoints: { time: number; type: 'start' | 'end'; eventId: string }[] = [];
  
  for (const event of events) {
    timePoints.push({ time: event.startTime.getTime(), type: 'start', eventId: event.id });
    timePoints.push({ time: event.endTime.getTime(), type: 'end', eventId: event.id });
  }
  
  // Sort time points by time, with end events before start events at the same time
  timePoints.sort((a, b) => {
    if (a.time === b.time) {
      return a.type === 'end' ? -1 : 1;
    }
    return a.time - b.time;
  });
  
  let currentConcurrent = 0;
  let maxConcurrent = 0;
  
  for (const point of timePoints) {
    if (point.type === 'start') {
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
    } else {
      currentConcurrent--;
    }
  }
  
  return maxConcurrent;
}

// Helper function to optimize positions of overlapping events
function updateOverlappingEventPositions(
  positionedEvents: PositionedEvent[], 
  overlapGroup: Event[]
): void {
  // Only reposition if we have more than 2 events overlapping
  if (overlapGroup.length <= 2) return;
  
  // Find events in the positioned list that are part of this overlap group
  const groupEventIds = new Set(overlapGroup.map(e => e.id));
  
  for (const positioned of positionedEvents) {
    if (groupEventIds.has(positioned.id)) {
      // Recalculate optimal position based on current layout
      const overlappingInGroup = overlapGroup.filter(e => 
        e.id !== positioned.id && eventsOverlap(positioned, e)
      );
      
      // If this event has fewer overlaps now, it might be able to take full width
      if (overlappingInGroup.length === 0) {
        positioned.position.left = 0;
        positioned.position.width = 100;
      }
    }
  }
}

// Enhanced version of getEventsForDay that includes overlap positioning
export function getEventsForDayWithPositions(events: Event[], date: Date): PositionedEvent[] {
  const dayEvents = events.filter(event => isSameDay(event.startTime, date));
  return calculateOverlapPositions(dayEvents);
}
