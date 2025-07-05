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
}

export interface TimeSlot {
  hour: number;
  dayOfWeek: number;
}

export interface CalendarEvent extends Event {
  position: {
    top: number;
    height: number;
  };
}
