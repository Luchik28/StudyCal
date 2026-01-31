// Recurrence rule types
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every X days/weeks/months/years
  daysOfWeek?: number[]; // For weekly: 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number; // For monthly: which day of the month
  endDate?: Date; // Optional end date for recurrence
  occurrences?: number; // Optional number of occurrences
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  category?: string;
  subcategory?: string;
  googleEventId?: string; // For Google Calendar sync
  calendarId?: string; // ID of the calendar this event belongs to
  // Recurrence fields
  recurrenceRule?: RecurrenceRule; // Rule for generating recurring instances
  recurringEventId?: string; // ID of the parent recurring event (for instances)
  originalStartTime?: Date; // Original start time of this instance (before any modifications)
  isRecurringInstance?: boolean; // True if this is a generated instance of a recurring event
}

// Calendar type for multi-calendar support
export interface Calendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  isDefault: boolean;
  type: 'local' | 'google';
  // Google Calendar specific fields
  googleCalendarId?: string; // The Google Calendar ID (e.g., 'primary' or calendar email)
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
  autoSync?: boolean;
}

export interface TimeSlot {
  hour: number;
  dayOfWeek: number;
}

export interface EventPosition {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

export interface CalendarEvent extends Event {
  position: EventPosition;
}

export interface PositionedEvent extends Event {
  position: EventPosition;
}
