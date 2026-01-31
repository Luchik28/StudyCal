'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Event } from '@/types/events';
import { addHours } from 'date-fns';
import { getRandomColor } from '@/utils/calendar';
import { classifyEvent } from '@/utils/eventClassification';
import { dbManager, initDB } from '@/utils/indexedDB';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';
import { useSettings } from './SettingsContext';
import { useCalendars } from './CalendarsContext';

interface EventsContextType {
  events: Event[];
  addEvent: (title: string, startTime: Date, endTime?: Date, description?: string, category?: string, subcategory?: string, calendarId?: string) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newStartTime: Date) => void;
  resizeEvent: (id: string, newStartTime?: Date, newEndTime?: Date) => void;
  syncWithGoogleCalendar: () => Promise<void>;
  syncCalendar: (calendarId: string) => Promise<void>;
  isSyncing: boolean;
  syncingCalendars: string[];
  visibleEvents: Event[];
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
  // Initialize with empty events array - will be loaded from IndexedDB or user input
  const [events, setEvents] = useState<Event[]>([]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingCalendars, setSyncingCalendars] = useState<string[]>([]);
  const { isLoading: settingsLoading, googleCalendarAuthenticated } = useSettings();
  const { calendars } = useCalendars();

  // Initialize IndexedDB and load events on component mount
  useEffect(() => {
    // Wait for settings to load before initializing
    if (settingsLoading) return;

    const initializeData = async () => {
      try {
        // Initialize IndexedDB
        await initDB();
        
        // Load existing events from IndexedDB
        const storedEvents = await dbManager.getAllEvents();
        if (storedEvents.length > 0) {
          setEvents(storedEvents);
        }
        // If no stored events, keep the sample events as fallback
        
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        // Keep sample events if IndexedDB fails
      }
    };

    initializeData();
  }, [settingsLoading]);

  // Auto-sync Google calendars on load
  useEffect(() => {
    if (!settingsLoading && calendars.length > 0) {
      // 1. Sync primary account (legacy)
      if (googleCalendarAuthenticated) {
        syncWithGoogleCalendar();
      }
      
      // 2. Sync all individual Google calendars with auto-sync enabled
      const autoSyncCalendars = calendars.filter(c => c.type === 'google' && c.autoSync);
      autoSyncCalendars.forEach(cal => {
        if (cal.googleRefreshToken || cal.googleAccessToken) {
          syncCalendar(cal.id).catch(error => {
            console.error(`Failed to auto-sync calendar ${cal.name}:`, error);
          });
        }
      });
    }
    // Only run on initial load when calendars are available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading, calendars.length > 0]);

  // Google Calendar sync function
  const syncWithGoogleCalendar = async (): Promise<void> => {
    setIsSyncing(true);
    
    try {
      const currentDate = new Date();
      let currentEvents = [...events];
      let hasAnyChanges = false;

      // 1. Sync the primary account if authenticated (legacy support)
      if (googleCalendarAuthenticated) {
        try {
          const googleEvents = await googleCalendarSyncService.syncFromGoogle(currentDate);
          if (googleEvents.length > 0) {
            currentEvents = googleCalendarSyncService.mergeEvents(currentEvents, googleEvents);
            hasAnyChanges = true;
          }
        } catch (error) {
          console.error('Failed to sync primary Google account:', error);
        }
      }

      // 2. Sync all individual Google calendars
      const googleCalendars = calendars.filter(cal => cal.type === 'google');
      for (const calendar of googleCalendars) {
        try {
          setSyncingCalendars(prev => [...prev, calendar.id]);
          const googleEvents = await googleCalendarSyncService.syncFromGoogleForCalendar(
            currentDate,
            calendar.id,
            calendar.googleCalendarId || 'primary',
            calendar.googleAccessToken,
            calendar.googleRefreshToken,
            calendar.googleTokenExpiry
          );

          if (googleEvents.length >= 0) { // Even empty list might mean deletions
            currentEvents = googleCalendarSyncService.mergeEvents(currentEvents, googleEvents, calendar.id);
            hasAnyChanges = true;
          }
        } catch (error) {
          console.error(`Failed to sync calendar ${calendar.name}:`, error);
        } finally {
          setSyncingCalendars(prev => prev.filter(id => id !== calendar.id));
        }
      }
      
      if (hasAnyChanges) {
        setEvents(currentEvents);
        
        // Save changed events to IndexedDB
        // Note: For large calendars, we should only save what changed
        currentEvents.forEach(event => {
          dbManager.saveEvent(event).catch(error => {
            console.error('Failed to save merged event:', error);
          });
        });
      }
    } catch (error) {
      console.error('Failed to sync with Google Calendar:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCalendar = async (calendarId: string): Promise<void> => {
    const calendar = calendars.find(c => c.id === calendarId);
    if (!calendar || calendar.type !== 'google') {
      return;
    }

    setIsSyncing(true);
    setSyncingCalendars(prev => [...prev, calendarId]);
    
    try {
      const googleEvents = await googleCalendarSyncService.syncFromGoogleForCalendar(
        new Date(),
        calendarId,
        calendar.googleCalendarId || 'primary',
        calendar.googleAccessToken,
        calendar.googleRefreshToken,
        calendar.googleTokenExpiry
      );

      setEvents(prevEvents => {
        const mergedEvents = googleCalendarSyncService.mergeEvents(prevEvents, googleEvents, calendarId);
        
        // Save merged events to IndexedDB
        mergedEvents.forEach(event => {
          if (event.calendarId === calendarId) {
            dbManager.saveEvent(event).catch(error => {
              console.error('Failed to save merged event:', error);
            });
          }
        });
        
        return mergedEvents;
      });
    } catch (error) {
      console.error(`Failed to sync calendar ${calendar.name}:`, error);
    } finally {
      setIsSyncing(false);
      setSyncingCalendars(prev => prev.filter(id => id !== calendarId));
    }
  };

  const addEvent = async (title: string, startTime: Date, endTime?: Date, description?: string, category?: string, subcategory?: string, calendarId?: string) => {
    const newEvent: Event = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      description,
      startTime,
      endTime: endTime || addHours(startTime, 1),
      color: getRandomColor(),
      dayOfWeek: startTime.getDay(),
      category,
      subcategory,
      calendarId: calendarId || 'local-default', // Default to local calendar if not specified
    };    // Only classify if category/subcategory not provided
    if (!category || !subcategory) {
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
    }

    // Save to IndexedDB
    try {
      await dbManager.saveEvent(newEvent);
    } catch (error) {
      console.error('Failed to save event to database:', error);
    }

    // Sync to Google Calendar if the event belongs to a Google calendar
    try {
      const calendar = calendars.find(c => c.id === newEvent.calendarId);
      if (calendar && calendar.type === 'google') {
        // Use calendar-specific credentials
        const googleEventId = await googleCalendarSyncService.syncToGoogleForCalendar(
          newEvent,
          'create',
          calendar.googleCalendarId || 'primary',
          calendar.googleAccessToken,
          calendar.googleRefreshToken,
          calendar.googleTokenExpiry
        );
        if (googleEventId) {
          newEvent.googleEventId = googleEventId;
          await dbManager.saveEvent(newEvent); // Save again with Google event ID
        }
      } else {
        // Legacy: use global Google Calendar if authenticated
        const googleEventId = await googleCalendarSyncService.syncToGoogle(newEvent, 'create');
        if (googleEventId) {
          newEvent.googleEventId = googleEventId;
          await dbManager.saveEvent(newEvent);
        }
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

        // Sync to Google Calendar
        const calendar = calendars.find(c => c.id === updatedEvent.calendarId);
        if (calendar && calendar.type === 'google') {
          googleCalendarSyncService.syncToGoogleForCalendar(
            updatedEvent,
            'update',
            calendar.googleCalendarId || 'primary',
            calendar.googleAccessToken,
            calendar.googleRefreshToken,
            calendar.googleTokenExpiry
          ).catch(error => {
            console.error('Failed to sync updated event to Google Calendar:', error);
          });
        } else {
          googleCalendarSyncService.syncToGoogle(updatedEvent, 'update').catch(error => {
            console.error('Failed to sync updated event to Google Calendar:', error);
          });
        }
      }
      
      return updatedEvents;
    });
  };

  const deleteEvent = async (id: string) => {
    // Get the event before deleting for Google Calendar sync
    const eventToDelete = events.find(event => event.id === id);

    // Immediately update UI (optimistic update)
    setEvents(prev => prev.filter(event => event.id !== id));

    // Delete from IndexedDB
    try {
      await dbManager.deleteEvent(id);
    } catch (error) {
      console.error('Failed to delete event from database:', error);
      // Revert the optimistic update on error
      if (eventToDelete) {
        setEvents(prev => [...prev, eventToDelete]);
      }
      throw error;
    }

    // Sync deletion to Google Calendar
    if (eventToDelete) {
      try {
        const calendar = calendars.find(c => c.id === eventToDelete.calendarId);
        if (calendar && calendar.type === 'google') {
          await googleCalendarSyncService.syncToGoogleForCalendar(
            eventToDelete,
            'delete',
            calendar.googleCalendarId || 'primary',
            calendar.googleAccessToken,
            calendar.googleRefreshToken,
            calendar.googleTokenExpiry
          );
        } else {
          await googleCalendarSyncService.syncToGoogle(eventToDelete, 'delete');
        }
      } catch (error) {
        console.error('Failed to sync event deletion to Google Calendar:', error);
        // Don't revert the local deletion for Google Calendar sync errors
      }
    }
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

          // Sync to Google Calendar
          const calendar = calendars.find(c => c.id === updatedEvent.calendarId);
          if (calendar && calendar.type === 'google') {
            googleCalendarSyncService.syncToGoogleForCalendar(
              updatedEvent,
              'update',
              calendar.googleCalendarId || 'primary',
              calendar.googleAccessToken,
              calendar.googleRefreshToken,
              calendar.googleTokenExpiry
            ).catch(error => {
              console.error('Failed to sync moved event to Google Calendar:', error);
            });
          } else {
            googleCalendarSyncService.syncToGoogle(updatedEvent, 'update').catch(error => {
              console.error('Failed to sync moved event to Google Calendar:', error);
            });
          }
          
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

          // Sync to Google Calendar
          const calendar = calendars.find(c => c.id === updatedEvent.calendarId);
          if (calendar && calendar.type === 'google') {
            googleCalendarSyncService.syncToGoogleForCalendar(
              updatedEvent,
              'update',
              calendar.googleCalendarId || 'primary',
              calendar.googleAccessToken,
              calendar.googleRefreshToken,
              calendar.googleTokenExpiry
            ).catch(error => {
              console.error('Failed to sync resized event to Google Calendar:', error);
            });
          } else {
            googleCalendarSyncService.syncToGoogle(updatedEvent, 'update').catch(error => {
              console.error('Failed to sync resized event to Google Calendar:', error);
            });
          }
          
          return updatedEvent;
        }
        return event;
      });
      
      return updatedEvents;
    });
  };

  const contextValue = {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    resizeEvent,
    syncWithGoogleCalendar,
    syncCalendar,
    isSyncing,
    syncingCalendars,
    visibleEvents: events, // By default all events are visible, filtering happens in components
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {children}
    </EventsContext.Provider>
  );
}
