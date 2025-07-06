'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Event } from '@/types/events';
import { addHours } from 'date-fns';
import { getRandomColor } from '@/utils/calendar';
import { classifyEvent } from '@/utils/eventClassification';
import { dbManager, initDB } from '@/utils/indexedDB';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';

interface EventsContextType {
  events: Event[];
  addEvent: (title: string, startTime: Date, endTime?: Date, description?: string) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newStartTime: Date) => void;
  resizeEvent: (id: string, newStartTime?: Date, newEndTime?: Date) => void;
  syncWithGoogleCalendar: () => Promise<void>;
  isSyncing: boolean;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize IndexedDB and load events on component mount
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        const savedEvents = await dbManager.getAllEvents();
        
        if (savedEvents.length > 0) {
          setEvents(savedEvents);
        } else {
          // Load sample events if no saved events exist
          const sampleEvents: Event[] = [
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
          ];
          
          setEvents(sampleEvents);
          // Save sample events to IndexedDB
          for (const event of sampleEvents) {
            await dbManager.saveEvent(event);
          }
        }

        // Auto-sync with Google Calendar if enabled
        await syncWithGoogleCalendar();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Fallback to sample events if database fails
        setEvents([
          {
            id: '1',
            title: 'Team Meeting',
            description: 'Weekly team sync',
            startTime: new Date(2025, 6, 7, 9, 0),
            endTime: new Date(2025, 6, 7, 10, 0),
            color: '#3B82F6',
            dayOfWeek: 1,
            category: 'Work',
            subcategory: 'Meeting',
          },
        ]);
      } finally {
        // Initialization complete
      }
    };

    initializeDB();
  }, []);

  // Google Calendar sync function
  const syncWithGoogleCalendar = async (): Promise<void> => {
    setIsSyncing(true);
    
    try {
      const currentDate = new Date();
      const googleEvents = await googleCalendarSyncService.syncFromGoogle(currentDate);
      
      if (googleEvents.length > 0) {
        setEvents(prevEvents => {
          const mergedEvents = googleCalendarSyncService.mergeEvents(prevEvents, googleEvents);
          
          // Save merged events to IndexedDB
          mergedEvents.forEach(event => {
            dbManager.saveEvent(event).catch(error => {
              console.error('Failed to save merged event:', error);
            });
          });
          
          return mergedEvents;
        });
      }
    } catch (error) {
      console.error('Failed to sync with Google Calendar:', error);
    } finally {
      setIsSyncing(false);
    }
  };

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

    // Save to IndexedDB
    try {
      await dbManager.saveEvent(newEvent);
    } catch (error) {
      console.error('Failed to save event to database:', error);
    }

    // Sync to Google Calendar if enabled
    try {
      const googleEventId = await googleCalendarSyncService.syncToGoogle(newEvent, 'create');
      if (googleEventId) {
        newEvent.googleEventId = googleEventId;
        await dbManager.saveEvent(newEvent); // Save again with Google event ID
      }
    } catch (error) {
      console.error('Failed to sync event to Google Calendar:', error);
    }

    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    setEvents(prev => {
      const updatedEvents = prev.map(event => 
        event.id === id 
          ? { ...event, ...updates, dayOfWeek: updates.startTime?.getDay() ?? event.dayOfWeek }
          : event
      );
      
      // Save updated event to IndexedDB and sync to Google Calendar
      const updatedEvent = updatedEvents.find(event => event.id === id);
      if (updatedEvent) {
        dbManager.saveEvent(updatedEvent).catch(error => {
          console.error('Failed to update event in database:', error);
        });

        // Sync to Google Calendar if enabled
        googleCalendarSyncService.syncToGoogle(updatedEvent, 'update').catch(error => {
          console.error('Failed to sync updated event to Google Calendar:', error);
        });
      }
      
      return updatedEvents;
    });
  };

  const deleteEvent = async (id: string) => {
    // Get the event before deleting for Google Calendar sync
    const eventToDelete = events.find(event => event.id === id);

    // Delete from IndexedDB
    try {
      await dbManager.deleteEvent(id);
    } catch (error) {
      console.error('Failed to delete event from database:', error);
    }

    // Sync deletion to Google Calendar if enabled
    if (eventToDelete) {
      try {
        await googleCalendarSyncService.syncToGoogle(eventToDelete, 'delete');
      } catch (error) {
        console.error('Failed to sync event deletion to Google Calendar:', error);
      }
    }

    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const moveEvent = async (id: string, newStartTime: Date) => {
    setEvents(prev => {
      const updatedEvents = prev.map(event => {
        if (event.id === id) {
          const duration = event.endTime.getTime() - event.startTime.getTime();
          const newEndTime = new Date(newStartTime.getTime() + duration);
          const updatedEvent = {
            ...event,
            startTime: newStartTime,
            endTime: newEndTime,
            dayOfWeek: newStartTime.getDay(),
          };
          
          // Save to IndexedDB
          dbManager.saveEvent(updatedEvent).catch(error => {
            console.error('Failed to save moved event to database:', error);
          });

          // Sync to Google Calendar if enabled
          googleCalendarSyncService.syncToGoogle(updatedEvent, 'update').catch(error => {
            console.error('Failed to sync moved event to Google Calendar:', error);
          });
          
          return updatedEvent;
        }
        return event;
      });
      
      return updatedEvents;
    });
  };

  const resizeEvent = async (id: string, newStartTime?: Date, newEndTime?: Date) => {
    setEvents(prev => {
      const updatedEvents = prev.map(event => {
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
          
          const updatedEvent = { ...event, ...updates };
          
          // Save to IndexedDB
          dbManager.saveEvent(updatedEvent).catch(error => {
            console.error('Failed to save resized event to database:', error);
          });

          // Sync to Google Calendar if enabled
          googleCalendarSyncService.syncToGoogle(updatedEvent, 'update').catch(error => {
            console.error('Failed to sync resized event to Google Calendar:', error);
          });
          
          return updatedEvent;
        }
        return event;
      });
      
      return updatedEvents;
    });
  };

  return (
    <EventsContext.Provider value={{
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      moveEvent,
      resizeEvent,
      syncWithGoogleCalendar,
      isSyncing,
    }}>
      {children}
    </EventsContext.Provider>
  );
}
