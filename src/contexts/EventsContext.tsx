'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { Event, RecurrenceRule } from '@/types/events';
import { addHours, addDays, addWeeks, addMonths, addYears, startOfDay, isBefore, isAfter, isSameDay } from 'date-fns';
import { getRandomColor } from '@/utils/calendar';
import { classifyEvent } from '@/utils/eventClassification';
import { dbManager, initDB } from '@/utils/indexedDB';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';
import { useSettings } from './SettingsContext';
import { useCalendars } from './CalendarsContext';
import { RecurrenceEditOption } from '@/components/RecurrenceEditModal';

interface EventsContextType {
  events: Event[];
  addEvent: (title: string, startTime: Date, endTime?: Date, description?: string, category?: string, subcategory?: string, calendarId?: string, recurrenceRule?: RecurrenceRule) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newStartTime: Date) => void;
  resizeEvent: (id: string, newStartTime?: Date, newEndTime?: Date) => void;
  syncWithGoogleCalendar: () => Promise<void>;
  syncCalendar: (calendarId: string) => Promise<void>;
  isSyncing: boolean;
  syncingCalendars: string[];
  visibleEvents: Event[];
  updateRecurringEvent: (id: string, updates: Partial<Event>, option: RecurrenceEditOption) => void;
  deleteRecurringEvent: (id: string, option: RecurrenceEditOption) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}

// Helper function to generate recurring event instances
function generateRecurringInstances(event: Event, rangeStart: Date, rangeEnd: Date): Event[] {
  if (!event.recurrenceRule) return [];

  const instances: Event[] = [];
  const { frequency, interval, daysOfWeek, endDate, occurrences } = event.recurrenceRule;
  const duration = event.endTime.getTime() - event.startTime.getTime();
  
  let currentDate = new Date(event.startTime);
  let count = 0;
  const maxInstances = occurrences || 365; // Default max to prevent infinite loops

  // Extend range to account for generation
  const extendedRangeEnd = new Date(rangeEnd);
  extendedRangeEnd.setMonth(extendedRangeEnd.getMonth() + 6);

  while (count < maxInstances) {
    // Check end conditions
    if (endDate && isAfter(currentDate, endDate)) break;
    if (isAfter(currentDate, extendedRangeEnd)) break;

    // For weekly frequency with specific days
    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      // Generate instances for each selected day in the current week
      for (const dayOfWeek of daysOfWeek) {
        const daysDiff = dayOfWeek - currentDate.getDay();
        const instanceDate = new Date(currentDate);
        instanceDate.setDate(currentDate.getDate() + daysDiff);
        
        // Only add if within range and after original start
        if (
          (isAfter(instanceDate, rangeStart) || isSameDay(instanceDate, rangeStart)) &&
          (isBefore(instanceDate, rangeEnd) || isSameDay(instanceDate, rangeEnd)) &&
          (isAfter(instanceDate, event.startTime) || isSameDay(instanceDate, event.startTime))
        ) {
          // Skip the original event date
          if (!isSameDay(instanceDate, event.startTime)) {
            const instanceStart = new Date(instanceDate);
            instanceStart.setHours(event.startTime.getHours(), event.startTime.getMinutes(), 0, 0);
            
            instances.push({
              ...event,
              id: `${event.id}_${instanceStart.toISOString()}`,
              startTime: instanceStart,
              endTime: new Date(instanceStart.getTime() + duration),
              dayOfWeek: instanceStart.getDay(),
              recurringEventId: event.id,
              originalStartTime: instanceStart,
              isRecurringInstance: true,
              recurrenceRule: undefined, // Instances don't have their own rule
            });
          }
        }
        
        if (endDate && isAfter(instanceDate, endDate)) break;
        count++;
        if (count >= maxInstances) break;
      }
      
      // Move to next interval
      currentDate = addWeeks(startOfDay(currentDate), interval);
    } else {
      // For other frequencies, generate single instance per interval
      if (
        (isAfter(currentDate, rangeStart) || isSameDay(currentDate, rangeStart)) &&
        (isBefore(currentDate, rangeEnd) || isSameDay(currentDate, rangeEnd)) &&
        !isSameDay(currentDate, event.startTime)
      ) {
        const instanceStart = new Date(currentDate);
        instanceStart.setHours(event.startTime.getHours(), event.startTime.getMinutes(), 0, 0);
        
        instances.push({
          ...event,
          id: `${event.id}_${instanceStart.toISOString()}`,
          startTime: instanceStart,
          endTime: new Date(instanceStart.getTime() + duration),
          dayOfWeek: instanceStart.getDay(),
          recurringEventId: event.id,
          originalStartTime: instanceStart,
          isRecurringInstance: true,
          recurrenceRule: undefined,
        });
      }
      
      // Move to next occurrence based on frequency
      switch (frequency) {
        case 'daily':
          currentDate = addDays(currentDate, interval);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, interval);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, interval);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, interval);
          break;
      }
      count++;
    }
  }

  return instances;
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

  // Generate visible events including recurring instances
  const visibleEvents = useMemo(() => {
    // Calculate date range for recurring event generation (3 months before and after current date)
    const rangeStart = new Date();
    rangeStart.setMonth(rangeStart.getMonth() - 3);
    const rangeEnd = new Date();
    rangeEnd.setMonth(rangeEnd.getMonth() + 6);

    // Collect deleted instance markers
    const deletedInstanceIds = new Set<string>();
    events.forEach(event => {
      if (event.id.startsWith('deleted_')) {
        // Extract the original instance ID from the deleted marker
        const originalId = event.id.replace('deleted_', '');
        deletedInstanceIds.add(originalId);
      }
    });

    // Collect exception events (standalone events that were converted from instances)
    const exceptionDates = new Map<string, Set<string>>(); // parentId -> set of date strings
    events.forEach(event => {
      if (event.originalStartTime && !event.recurringEventId && !event.recurrenceRule) {
        // This is a standalone event that was converted from a recurring instance
        // We need to exclude the original instance
        // Find which recurring event this might be an exception for
        events.forEach(parentEvent => {
          if (parentEvent.recurrenceRule && parentEvent.id !== event.id) {
            // Check if this event's originalStartTime matches the parent
            const dateStr = event.originalStartTime!.toDateString();
            if (!exceptionDates.has(parentEvent.id)) {
              exceptionDates.set(parentEvent.id, new Set());
            }
            exceptionDates.get(parentEvent.id)!.add(dateStr);
          }
        });
      }
    });

    const allEvents: Event[] = [...events.filter(e => !e.id.startsWith('deleted_'))];
    
    // Generate recurring instances for each recurring event
    events.forEach(event => {
      if (event.recurrenceRule && !event.isRecurringInstance) {
        const instances = generateRecurringInstances(event, rangeStart, rangeEnd);
        
        // Filter out instances that have been deleted or converted to exceptions
        const filteredInstances = instances.filter(instance => {
          // Check if this instance was explicitly deleted
          if (deletedInstanceIds.has(instance.id)) {
            return false;
          }
          // Check if this instance date has an exception
          const exceptionDateSet = exceptionDates.get(event.id);
          if (exceptionDateSet && exceptionDateSet.has(instance.startTime.toDateString())) {
            return false;
          }
          return true;
        });
        
        allEvents.push(...filteredInstances);
      }
    });

    return allEvents;
  }, [events]);

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

  const addEvent = async (title: string, startTime: Date, endTime?: Date, description?: string, category?: string, subcategory?: string, calendarId?: string, recurrenceRule?: RecurrenceRule) => {
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
      recurrenceRule,
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

  // Update a recurring event based on the selected option
  const updateRecurringEvent = async (id: string, updates: Partial<Event>, option: RecurrenceEditOption) => {
    // Check if this is an instance or the parent event
    const isInstance = id.includes('_');
    const parentId = isInstance ? id.split('_')[0] : id;
    const parentEvent = events.find(e => e.id === parentId);
    
    if (!parentEvent) {
      console.error('Parent event not found for recurring event');
      return;
    }

    switch (option) {
      case 'this': {
        // Create an exception for this single instance
        // Convert the instance to a standalone event
        const instanceEvent = visibleEvents.find(e => e.id === id);
        if (!instanceEvent) return;

        const newEvent: Event = {
          ...instanceEvent,
          ...updates,
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          recurringEventId: undefined,
          isRecurringInstance: false,
          originalStartTime: instanceEvent.startTime, // Store original time for reference
          recurrenceRule: undefined,
        };

        // Save the new standalone event
        await dbManager.saveEvent(newEvent);
        setEvents(prev => [...prev, newEvent]);
        
        // Store exception in parent event (we could track excluded dates)
        // For simplicity, we'll just add the new event and the instance will be hidden
        // by checking against standalone events with matching originalStartTime
        break;
      }

      case 'thisAndFuture': {
        // Split the series: end the current series and create a new one
        const instanceEvent = visibleEvents.find(e => e.id === id);
        if (!instanceEvent) return;

        // Update parent event to end before this instance
        const updatedParentRule: RecurrenceRule = {
          ...parentEvent.recurrenceRule!,
          endDate: new Date(instanceEvent.startTime.getTime() - 24 * 60 * 60 * 1000), // Day before
        };

        const updatedParent: Event = {
          ...parentEvent,
          recurrenceRule: updatedParentRule,
        };
        await dbManager.saveEvent(updatedParent);

        // Create a new recurring event starting from this instance with the updates
        const newStartTime = updates.startTime || instanceEvent.startTime;
        const newEndTime = updates.endTime || instanceEvent.endTime;
        
        const newRecurringEvent: Event = {
          ...parentEvent,
          ...updates,
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          startTime: newStartTime,
          endTime: newEndTime,
          dayOfWeek: newStartTime.getDay(),
          recurringEventId: undefined,
          isRecurringInstance: false,
          recurrenceRule: updates.recurrenceRule || parentEvent.recurrenceRule,
        };
        await dbManager.saveEvent(newRecurringEvent);

        setEvents(prev => prev.map(e => 
          e.id === parentId ? updatedParent : e
        ).concat(newRecurringEvent));
        break;
      }

      case 'all': {
        // Update the parent event (all instances will reflect the change)
        const updatedParent: Event = {
          ...parentEvent,
          ...updates,
          id: parentEvent.id, // Keep same ID
          dayOfWeek: updates.startTime?.getDay() ?? parentEvent.dayOfWeek,
        };
        
        await dbManager.saveEvent(updatedParent);
        setEvents(prev => prev.map(e => 
          e.id === parentId ? updatedParent : e
        ));
        break;
      }
    }
  };

  // Delete a recurring event based on the selected option
  const deleteRecurringEvent = async (id: string, option: RecurrenceEditOption) => {
    // Check if this is an instance or the parent event
    const isInstance = id.includes('_');
    const parentId = isInstance ? id.split('_')[0] : id;
    const parentEvent = events.find(e => e.id === parentId);
    
    if (!parentEvent) {
      console.error('Parent event not found for recurring event');
      return;
    }

    switch (option) {
      case 'this': {
        // For single instance deletion, we need to track exceptions
        // Create an exception event that marks this instance as deleted
        const instanceEvent = visibleEvents.find(e => e.id === id);
        if (!instanceEvent) return;

        // Create a "deleted" marker event that we'll filter out during generation
        // For now, convert it to a standalone hidden event
        const deletedMarker: Event = {
          ...instanceEvent,
          id: `deleted_${id}`,
          title: `[DELETED] ${instanceEvent.title}`,
          recurringEventId: parentId,
          isRecurringInstance: true,
        };
        
        await dbManager.saveEvent(deletedMarker);
        setEvents(prev => [...prev, deletedMarker]);
        break;
      }

      case 'thisAndFuture': {
        // End the recurrence before this instance
        const instanceEvent = visibleEvents.find(e => e.id === id);
        if (!instanceEvent) return;

        // Update parent event to end before this instance
        const updatedParentRule: RecurrenceRule = {
          ...parentEvent.recurrenceRule!,
          endDate: new Date(instanceEvent.startTime.getTime() - 24 * 60 * 60 * 1000),
        };

        const updatedParent: Event = {
          ...parentEvent,
          recurrenceRule: updatedParentRule,
        };
        
        await dbManager.saveEvent(updatedParent);
        setEvents(prev => prev.map(e => 
          e.id === parentId ? updatedParent : e
        ));
        break;
      }

      case 'all': {
        // Delete the parent event (all instances will be removed)
        await dbManager.deleteEvent(parentId);
        
        // Also delete any exception events related to this series
        const relatedEvents = events.filter(e => 
          e.recurringEventId === parentId || e.id === parentId
        );
        for (const event of relatedEvents) {
          if (event.id !== parentId) {
            await dbManager.deleteEvent(event.id);
          }
        }
        
        setEvents(prev => prev.filter(e => 
          e.id !== parentId && e.recurringEventId !== parentId
        ));
        break;
      }
    }
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
    visibleEvents,
    updateRecurringEvent,
    deleteRecurringEvent,
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {children}
    </EventsContext.Provider>
  );
}
