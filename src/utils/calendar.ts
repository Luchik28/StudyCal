import { format, startOfWeek, addDays, setHours, setMinutes, isSameDay } from 'date-fns';
import { Event, CalendarEvent } from '@/types/events';

export const HOURS_IN_DAY = 24;
export const HOUR_HEIGHT = 60; // pixels per hour
export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const EVENT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
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
    .map(event => ({
      ...event,
      position: calculateEventPosition(event),
    }));
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
