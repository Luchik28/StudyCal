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

export function generateTimeSlots(): string[] {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push(format(setHours(setMinutes(new Date(), 0), hour), 'HH:mm'));
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
