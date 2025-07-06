// IndexedDB utility for storing app data
import { Event } from '@/types/events';
import type { GoogleCalendarConfig } from './googleCalendar';

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
}
const DB_NAME = 'WeekPlannerDB';
const DB_VERSION = 1;
const EVENTS_STORE = 'events';
const SETTINGS_STORE = 'settings';

export interface Settings {
  timeFormat: '12h' | '24h';
  googleCalendarEnabled: boolean;
  googleCalendarConfig?: GoogleCalendarConfig;
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

        // Create events store
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const eventsStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
          eventsStore.createIndex('startTime', 'startTime', { unique: false });
          eventsStore.createIndex('category', 'category', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
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
      const eventToStore = {
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
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
      const transaction = this.db!.transaction([EVENTS_STORE, SETTINGS_STORE], 'readwrite');
      
      void transaction.objectStore(EVENTS_STORE).clear();
      void transaction.objectStore(SETTINGS_STORE).clear();

      transaction.onerror = () => reject(new Error('Failed to clear data'));
      transaction.oncomplete = () => resolve();
    });
  }
}

// Create singleton instance
export const dbManager = new IndexedDBManager();

// Initialize the database
export const initDB = async (): Promise<void> => {
  try {
    await dbManager.init();
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
};
