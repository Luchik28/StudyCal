'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Event } from '@/types/events';
import { addHours } from 'date-fns';
import { getRandomColor } from '@/utils/calendar';

interface EventsContextType {
  events: Event[];
  addEvent: (title: string, startTime: Date, endTime?: Date, description?: string) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newStartTime: Date) => void;
  resizeEvent: (id: string, newStartTime?: Date, newEndTime?: Date) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}

interface EventsProviderProps {
  children: ReactNode;
}

export function EventsProvider({ children }: EventsProviderProps) {
  const [events, setEvents] = useState<Event[]>([
    // Sample events for demonstration
    {
      id: '1',
      title: 'Team Meeting',
      description: 'Weekly team sync',
      startTime: new Date(2025, 5, 23, 9, 0), // June 23, 2025 at 9:00 AM
      endTime: new Date(2025, 5, 23, 10, 0), // June 23, 2025 at 10:00 AM
      color: '#3B82F6',
      dayOfWeek: 1,
    },
    {
      id: '2',
      title: 'Lunch Break',
      description: 'Time to eat',
      startTime: new Date(2025, 5, 23, 12, 0), // June 23, 2025 at 12:00 PM
      endTime: new Date(2025, 5, 23, 13, 0), // June 23, 2025 at 1:00 PM
      color: '#10B981',
      dayOfWeek: 1,
    },
  ]);

  const addEvent = (title: string, startTime: Date, endTime?: Date, description?: string) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      title,
      description,
      startTime,
      endTime: endTime || addHours(startTime, 1),
      color: getRandomColor(),
      dayOfWeek: startTime.getDay(),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === id 
          ? { ...event, ...updates, dayOfWeek: updates.startTime?.getDay() ?? event.dayOfWeek }
          : event
      )
    );
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const moveEvent = (id: string, newStartTime: Date) => {
    setEvents(prev => 
      prev.map(event => {
        if (event.id === id) {
          const duration = event.endTime.getTime() - event.startTime.getTime();
          const newEndTime = new Date(newStartTime.getTime() + duration);
          return {
            ...event,
            startTime: newStartTime,
            endTime: newEndTime,
            dayOfWeek: newStartTime.getDay(),
          };
        }
        return event;
      })
    );
  };

  const resizeEvent = (id: string, newStartTime?: Date, newEndTime?: Date) => {
    setEvents(prev => 
      prev.map(event => {
        if (event.id === id) {
          let updatedEvent = { ...event };
          
          if (newStartTime) {
            updatedEvent.startTime = newStartTime;
            updatedEvent.dayOfWeek = newStartTime.getDay();
            
            // If new start time is after current end time, adjust end time
            if (newStartTime >= event.endTime) {
              updatedEvent.endTime = new Date(newStartTime.getTime() + 15 * 60 * 1000);
            }
          }
          
          if (newEndTime) {
            updatedEvent.endTime = newEndTime;
            
            // If new end time is before current start time, adjust start time
            if (newEndTime <= event.startTime) {
              updatedEvent.startTime = new Date(newEndTime.getTime() - 15 * 60 * 1000);
              updatedEvent.dayOfWeek = updatedEvent.startTime.getDay();
            }
          }
          
          return updatedEvent;
        }
        return event;
      })
    );
  };

  return (
    <EventsContext.Provider value={{
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      moveEvent,
      resizeEvent,
    }}>
      {children}
    </EventsContext.Provider>
  );
}
