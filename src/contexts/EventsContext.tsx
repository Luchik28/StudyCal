'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Event } from '@/types/events';
import { addHours } from 'date-fns';
import { getRandomColor } from '@/utils/calendar';
import { classifyEvent } from '@/utils/eventClassification';

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
      startTime: new Date(2025, 6, 7, 9, 0), // July 7, 2025 at 9:00 AM (Monday)
      endTime: new Date(2025, 6, 7, 10, 0), // July 7, 2025 at 10:00 AM
      color: '#3B82F6',
      dayOfWeek: 1,
      category: 'Work',
      subcategory: 'Meeting',
    },
    {
      id: '2',
      title: 'Lunch Break',
      description: 'Time to eat',
      startTime: new Date(2025, 6, 8, 12, 0), // July 8, 2025 at 12:00 PM (Tuesday)
      endTime: new Date(2025, 6, 8, 13, 0), // July 8, 2025 at 1:00 PM
      color: '#10B981',
      dayOfWeek: 2,
      category: 'Personal',
      subcategory: 'Activity',
    },
    {
      id: '3',
      title: 'Doctor Appointment',
      description: 'Annual checkup',
      startTime: new Date(2025, 6, 9, 14, 0), // July 9, 2025 at 2:00 PM (Wednesday)
      endTime: new Date(2025, 6, 9, 15, 0), // July 9, 2025 at 3:00 PM
      color: '#EF4444',
      dayOfWeek: 3,
      category: 'Health',
      subcategory: 'Appointment',
    },
  ]);

  const addEvent = async (title: string, startTime: Date, endTime?: Date, description?: string) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      title,
      description,
      startTime,
      endTime: endTime || addHours(startTime, 1),
      color: getRandomColor(),
      dayOfWeek: startTime.getDay(),
    };

    // Simple rule-based classification as fallback
    const getSimpleClassification = (title: string, description?: string) => {
      const text = `${title} ${description || ''}`.toLowerCase();
      
      if (text.includes('meeting') || text.includes('conference') || text.includes('call')) {
        return { category: 'Work', subcategory: 'Meeting' };
      } else if (text.includes('doctor') || text.includes('appointment') || text.includes('health') || text.includes('medical')) {
        return { category: 'Health', subcategory: 'Appointment' };
      } else if (text.includes('lunch') || text.includes('dinner') || text.includes('eat') || text.includes('meal')) {
        return { category: 'Personal', subcategory: 'Activity' };
      } else if (text.includes('study') || text.includes('class') || text.includes('homework') || text.includes('exam')) {
        return { category: 'Education', subcategory: 'Study Session' };
      } else if (text.includes('workout') || text.includes('gym') || text.includes('exercise')) {
        return { category: 'Health', subcategory: 'Activity' };
      } else if (text.includes('travel') || text.includes('trip') || text.includes('vacation')) {
        return { category: 'Travel', subcategory: 'Trip' };
      } else if (text.includes('work') || text.includes('project') || text.includes('task')) {
        return { category: 'Work', subcategory: 'Task/Project Work' };
      } else {
        return { category: 'Personal', subcategory: 'Other' };
      }
    };

    // Try ML classification first, but use simple classification as fallback
    try {
      const classification = await classifyEvent(newEvent);
      newEvent.category = classification.category;
      newEvent.subcategory = classification.subcategory;
    } catch {
      const simpleClassification = getSimpleClassification(newEvent.title, newEvent.description);
      newEvent.category = simpleClassification.category;
      newEvent.subcategory = simpleClassification.subcategory;
    }

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
          const updates: Partial<Event> = {};
          
          if (newStartTime) {
            updates.startTime = newStartTime;
            updates.dayOfWeek = newStartTime.getDay();
            
            // If new start time is after current end time, adjust end time
            if (newStartTime >= event.endTime) {
              updates.endTime = new Date(newStartTime.getTime() + 15 * 60 * 1000);
            }
          }
          
          if (newEndTime) {
            updates.endTime = newEndTime;
            
            // If new end time is before current start time, adjust start time
            if (newEndTime <= event.startTime) {
              updates.startTime = new Date(newEndTime.getTime() - 15 * 60 * 1000);
              updates.dayOfWeek = updates.startTime.getDay();
            }
          }
          
          return { ...event, ...updates };
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
