'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Calendar } from '@/types/events';
import { dbManager, initDB } from '@/utils/indexedDB';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';

interface CalendarsContextType {
  calendars: Calendar[];
  defaultCalendarId: string | null;
  visibleCalendarIds: string[];
  addCalendar: (calendar: Omit<Calendar, 'id'>) => Promise<Calendar>;
  updateCalendar: (id: string, updates: Partial<Calendar>) => Promise<void>;
  deleteCalendar: (id: string) => Promise<void>;
  setDefaultCalendar: (id: string) => void;
  toggleCalendarVisibility: (id: string) => void;
  getCalendarById: (id: string) => Calendar | undefined;
  connectGoogleCalendar: (calendarName: string, googleCalendarId?: string) => Promise<string | null>;
  isLoading: boolean;
}

const CalendarsContext = createContext<CalendarsContextType | undefined>(undefined);

// Default local calendar
const DEFAULT_LOCAL_CALENDAR: Calendar = {
  id: 'local-default',
  name: 'My Calendar',
  color: '#3b82f6',
  isVisible: true,
  isDefault: true,
  type: 'local',
};

export function CalendarsProvider({ children }: { children: ReactNode }) {
  const [calendars, setCalendars] = useState<Calendar[]>([DEFAULT_LOCAL_CALENDAR]);
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>('local-default');
  const [isLoading, setIsLoading] = useState(true);

  // Get visible calendar IDs
  const visibleCalendarIds = calendars.filter(c => c.isVisible).map(c => c.id);

  // Load calendars from IndexedDB on mount
  useEffect(() => {
    const loadCalendars = async () => {
      try {
        await initDB();
        const savedCalendars = await dbManager.getCalendars();
        
        if (savedCalendars && savedCalendars.length > 0) {
          setCalendars(savedCalendars);
          const defaultCal = savedCalendars.find(c => c.isDefault);
          if (defaultCal) {
            setDefaultCalendarId(defaultCal.id);
          }
        } else {
          // Save the default calendar if no calendars exist
          await dbManager.saveCalendar(DEFAULT_LOCAL_CALENDAR);
        }
      } catch (error) {
        console.error('Failed to load calendars:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalendars();
  }, []);

  const addCalendar = async (calendarData: Omit<Calendar, 'id'>): Promise<Calendar> => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `cal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const newCalendar: Calendar = {
      ...calendarData,
      id,
    };

    // If this is the first calendar or marked as default, ensure only one default
    if (newCalendar.isDefault) {
      setCalendars(prev => prev.map(c => ({ ...c, isDefault: false })));
    }

    try {
      await dbManager.saveCalendar(newCalendar);
      setCalendars(prev => [...prev, newCalendar]);
      
      if (newCalendar.isDefault) {
        setDefaultCalendarId(newCalendar.id);
      }
      
      return newCalendar;
    } catch (error) {
      console.error('Failed to save calendar:', error);
      throw error;
    }
  };

  const updateCalendar = async (id: string, updates: Partial<Calendar>): Promise<void> => {
    setCalendars(prev => {
      const updatedCalendars = prev.map(cal => {
        if (cal.id === id) {
          return { ...cal, ...updates };
        }
        // If setting a new default, unset others
        if (updates.isDefault && cal.id !== id) {
          return { ...cal, isDefault: false };
        }
        return cal;
      });

      // Save to IndexedDB
      const updatedCalendar = updatedCalendars.find(c => c.id === id);
      if (updatedCalendar) {
        dbManager.saveCalendar(updatedCalendar).catch(error => {
          console.error('Failed to update calendar:', error);
        });
      }

      // Update default calendar ID if changed
      if (updates.isDefault) {
        setDefaultCalendarId(id);
      }

      return updatedCalendars;
    });
  };

  const deleteCalendar = async (id: string): Promise<void> => {
    const calendarToDelete = calendars.find(c => c.id === id);
    
    // Don't allow deleting the last calendar
    if (calendars.length <= 1) {
      throw new Error('Cannot delete the last calendar');
    }

    // If deleting the default calendar, set another as default
    if (calendarToDelete?.isDefault) {
      const otherCalendar = calendars.find(c => c.id !== id);
      if (otherCalendar) {
        await updateCalendar(otherCalendar.id, { isDefault: true });
      }
    }

    try {
      await dbManager.deleteCalendar(id);
      setCalendars(prev => prev.filter(cal => cal.id !== id));
    } catch (error) {
      console.error('Failed to delete calendar:', error);
      throw error;
    }
  };

  const setDefaultCalendar = (id: string) => {
    setCalendars(prev => 
      prev.map(cal => ({
        ...cal,
        isDefault: cal.id === id,
      }))
    );
    setDefaultCalendarId(id);
    
    // Save all calendars with updated default status
    calendars.forEach(cal => {
      dbManager.saveCalendar({ ...cal, isDefault: cal.id === id }).catch(error => {
        console.error('Failed to update calendar default status:', error);
      });
    });
  };

  const toggleCalendarVisibility = (id: string) => {
    setCalendars(prev => {
      const updatedCalendars = prev.map(cal => 
        cal.id === id ? { ...cal, isVisible: !cal.isVisible } : cal
      );
      
      const updatedCalendar = updatedCalendars.find(c => c.id === id);
      if (updatedCalendar) {
        dbManager.saveCalendar(updatedCalendar).catch(error => {
          console.error('Failed to update calendar visibility:', error);
        });
      }
      
      return updatedCalendars;
    });
  };

  const getCalendarById = useCallback((id: string): Calendar | undefined => {
    return calendars.find(cal => cal.id === id);
  }, [calendars]);

  const connectGoogleCalendar = async (calendarName: string, googleCalendarId: string = 'primary'): Promise<string | null> => {
    try {
      // Get auth URL and open popup
      const authUrl = googleCalendarSyncService.getAuthUrl();
      
      // Open popup window for OAuth
      const popup = window.open(
        authUrl, 
        'google-calendar-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Please allow popups for this site to connect to Google Calendar.');
      }
      
      // Return a promise that resolves when auth is complete
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // The callback page will store the tokens, we'll pick them up
            resolve(null); // The actual calendar will be created by the callback handler
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      throw error;
    }
  };

  return (
    <CalendarsContext.Provider value={{
      calendars,
      defaultCalendarId,
      visibleCalendarIds,
      addCalendar,
      updateCalendar,
      deleteCalendar,
      setDefaultCalendar,
      toggleCalendarVisibility,
      getCalendarById,
      connectGoogleCalendar,
      isLoading,
    }}>
      {children}
    </CalendarsContext.Provider>
  );
}

export function useCalendars() {
  const context = useContext(CalendarsContext);
  if (context === undefined) {
    throw new Error('useCalendars must be used within a CalendarsProvider');
  }
  return context;
}
