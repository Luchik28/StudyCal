// IndexedDB utility for storing app data
import { Event, Calendar, RecurrenceRule } from '@/types/events';
import type { GoogleCalendarConfig } from './googleCalendar';

interface StoredRecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  occurrences?: number;
}

interface StoredEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  color: string;
  dayOfWeek: number;
  category?: string;
  subcategory?: string;
  googleEventId?: string;
  calendarId?: string;
  // Recurrence fields
  recurrenceRule?: StoredRecurrenceRule;
  recurringEventId?: string;
  originalStartTime?: string | Date;
  isRecurringInstance?: boolean;
}

interface StoredCalendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  isDefault: boolean;
  type: 'local' | 'google';
  googleCalendarId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
  autoSync?: boolean;
}

const DB_NAME = 'WeekPlannerDB';
const DB_VERSION = 4; // Increment version for recurrence support
const EVENTS_STORE = 'events';
const SETTINGS_STORE = 'settings';
const CALENDARS_STORE = 'calendars';

export interface Settings {
  timeFormat: '12h' | '24h';
  googleCalendarEnabled: boolean;
  googleCalendarConfig?: GoogleCalendarConfig;
  colorSchemeMode?: 'event-type' | 'calendar';
  eventTypeColors?: Record<string, string>;
  calendarColors?: Record<string, string>;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction;

        // Create events store
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const eventsStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
          eventsStore.createIndex('startTime', 'startTime', { unique: false });
          eventsStore.createIndex('category', 'category', { unique: false });
          eventsStore.createIndex('calendarId', 'calendarId', { unique: false });
        } else if (transaction) {
          // Migrate existing events: add calendarId if missing
          const eventsStore = transaction.objectStore(EVENTS_STORE);
          
          // Create calendarId index if it doesn't exist
          if (!eventsStore.indexNames.contains('calendarId')) {
            eventsStore.createIndex('calendarId', 'calendarId', { unique: false });
          }
          
          // Migrate events to have 'local-default' calendarId
          const getAllRequest = eventsStore.getAll();
          getAllRequest.onsuccess = () => {
            const events = getAllRequest.result;
            events.forEach((event: StoredEvent) => {
              if (!event.calendarId) {
                event.calendarId = 'local-default';
                eventsStore.put(event);
              }
            });
          };
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }

        // Create calendars store
        if (!db.objectStoreNames.contains(CALENDARS_STORE)) {
          db.createObjectStore(CALENDARS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  // Events operations
  async saveEvent(event: Event): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      
      // Convert dates to ISO strings for storage
      const eventToStore: StoredEvent = {
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        originalStartTime: event.originalStartTime?.toISOString(),
        recurrenceRule: event.recurrenceRule ? {
          ...event.recurrenceRule,
          endDate: event.recurrenceRule.endDate?.toISOString(),
        } : undefined,
      };

      const request = store.put(eventToStore);

      request.onerror = () => reject(new Error('Failed to save event'));
      request.onsuccess = () => resolve();
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.delete(eventId);

      request.onerror = () => reject(new Error('Failed to delete event'));
      request.onsuccess = () => resolve();
    });
  }

  async getAllEvents(): Promise<Event[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to fetch events'));
      request.onsuccess = () => {
        const events = request.result.map((event: StoredEvent) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          originalStartTime: event.originalStartTime ? new Date(event.originalStartTime) : undefined,
          recurrenceRule: event.recurrenceRule ? {
            ...event.recurrenceRule,
            endDate: event.recurrenceRule.endDate ? new Date(event.recurrenceRule.endDate) : undefined,
          } : undefined,
        }));
        resolve(events);
      };
    });
  }

  // Settings operations
  async saveSettings(settings: Settings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      
      const settingsToStore = {
        key: 'appSettings',
        ...settings,
      };

      const request = store.put(settingsToStore);

      request.onerror = () => reject(new Error('Failed to save settings'));
      request.onsuccess = () => resolve();
    });
  }

  async loadSettings(): Promise<Settings | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('appSettings');

      request.onerror = () => reject(new Error('Failed to load settings'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key: _, ...settings } = result;
          resolve(settings);
        } else {
          resolve(null);
        }
      };
    });
  }

  // Clear all data (for testing/reset purposes)
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE, SETTINGS_STORE, CALENDARS_STORE], 'readwrite');
      
      void transaction.objectStore(EVENTS_STORE).clear();
      void transaction.objectStore(SETTINGS_STORE).clear();
      void transaction.objectStore(CALENDARS_STORE).clear();

      transaction.onerror = () => reject(new Error('Failed to clear data'));
      transaction.oncomplete = () => resolve();
    });
  }

  // Calendar operations
  async saveCalendar(calendar: Calendar): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CALENDARS_STORE], 'readwrite');
      const store = transaction.objectStore(CALENDARS_STORE);
      
      const calendarToStore: StoredCalendar = {
        ...calendar,
      };

      const request = store.put(calendarToStore);

      request.onerror = () => reject(new Error('Failed to save calendar'));
      request.onsuccess = () => resolve();
    });
  }

  async deleteCalendar(calendarId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CALENDARS_STORE], 'readwrite');
      const store = transaction.objectStore(CALENDARS_STORE);
      const request = store.delete(calendarId);

      request.onerror = () => reject(new Error('Failed to delete calendar'));
      request.onsuccess = () => resolve();
    });
  }

  async getCalendars(): Promise<Calendar[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CALENDARS_STORE], 'readonly');
      const store = transaction.objectStore(CALENDARS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to fetch calendars'));
      request.onsuccess = () => {
        const calendars = request.result.map((calendar: StoredCalendar) => ({
          ...calendar,
        }));
        resolve(calendars);
      };
    });
  }

  async getCalendarById(calendarId: string): Promise<Calendar | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CALENDARS_STORE], 'readonly');
      const store = transaction.objectStore(CALENDARS_STORE);
      const request = store.get(calendarId);

      request.onerror = () => reject(new Error('Failed to fetch calendar'));
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  // Get events by calendar ID
  async getEventsByCalendarId(calendarId: string): Promise<Event[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to fetch events'));
      request.onsuccess = () => {
        const events = request.result
          .filter((event: StoredEvent) => event.calendarId === calendarId)
          .map((event: StoredEvent) => ({
            ...event,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            originalStartTime: event.originalStartTime ? new Date(event.originalStartTime) : undefined,
            recurrenceRule: event.recurrenceRule ? {
              ...event.recurrenceRule,
              endDate: event.recurrenceRule.endDate ? new Date(event.recurrenceRule.endDate) : undefined,
            } : undefined,
          }));
        resolve(events);
      };
    });
  }
}

// Create singleton instance
export const dbManager = new IndexedDBManager();

// Initialize the database
export const initDB = async (): Promise<void> => {
  try {
    await dbManager.init();
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
};
