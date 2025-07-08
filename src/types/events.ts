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
