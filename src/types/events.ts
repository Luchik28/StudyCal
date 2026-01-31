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
