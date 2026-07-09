// Google Calendar sync service
import { Event } from '@/types/events';
import { googleCalendarManager, GoogleCalendarConfig } from './googleCalendar';
import { startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

export class GoogleCalendarSyncService {
  private syncInProgress = false;
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 30 * 1000; // 30 seconds cooldown between syncs

  // Check if we should sync (avoid too frequent syncs)
  private shouldSync(): boolean {
    const now = Date.now();
    return !this.syncInProgress && (now - this.lastSyncTime) > this.SYNC_COOLDOWN;
  }

  // Sync events from Google Calendar to local storage
  async syncFromGoogle(currentDate: Date): Promise<Event[]> {
    if (!googleCalendarManager.isAuthenticated() || !this.shouldSync()) {
      return [];
    }

    this.syncInProgress = true;
    
    try {
      // Fetch events for current week and 2 weeks before/after
      const weekStart = startOfWeek(subWeeks(currentDate, 2));
      const weekEnd = endOfWeek(addWeeks(currentDate, 2));
      
      const googleEvents = await googleCalendarManager.fetchEvents(weekStart, weekEnd);
      
      this.lastSyncTime = Date.now();
      
      return googleEvents;
    } catch (error) {
      console.error('Failed to sync from Google Calendar:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync a local event to Google Calendar
  async syncToGoogle(event: Event, operation: 'create' | 'update' | 'delete'): Promise<string | null> {
    if (!googleCalendarManager.isAuthenticated()) {
      return null;
    }

    try {
      switch (operation) {
        case 'create':
          // Don't sync Google Calendar events back to Google
          if (event.id.startsWith('google_')) {
            return null;
          }
          const googleEventId = await googleCalendarManager.createEvent(event);
          return googleEventId;

        case 'update':
          if (event.googleEventId) {
            await googleCalendarManager.updateEvent(event.googleEventId, event);
            return event.googleEventId;
          }
          break;

        case 'delete':
          if (event.googleEventId) {
            await googleCalendarManager.deleteEvent(event.googleEventId);
          }
          break;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to sync event to Google Calendar (${operation}):`, error);
      throw error;
    }
  }

  // Sync a local event to a specific Google Calendar with its own credentials
  async syncToGoogleForCalendar(
    event: Event,
    operation: 'create' | 'update' | 'delete',
    googleCalendarId: string = 'primary',
    accessToken?: string,
    refreshToken?: string,
    tokenExpiry?: number
  ): Promise<string | null> {
    if (!accessToken && !refreshToken) {
      console.log('No credentials available for calendar sync');
      return null;
    }

    try {
      switch (operation) {
        case 'create':
          // Don't sync Google Calendar events back to Google
          if (event.id.startsWith('google_')) {
            return null;
          }
          const googleEventId = await googleCalendarManager.createEventWithCredentials(
            event,
            googleCalendarId,
            accessToken,
            refreshToken,
            tokenExpiry
          );
          return googleEventId;

        case 'update':
          if (event.googleEventId) {
            await googleCalendarManager.updateEventWithCredentials(
              event.googleEventId,
              event,
              googleCalendarId,
              accessToken,
              refreshToken,
              tokenExpiry
            );
            return event.googleEventId;
          }
          break;

        case 'delete':
          if (event.googleEventId) {
            await googleCalendarManager.deleteEventWithCredentials(
              event.googleEventId,
              googleCalendarId,
              accessToken,
              refreshToken,
              tokenExpiry
            );
          }
          break;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to sync event to Google Calendar (${operation}):`, error);
      throw error;
    }
  }

  // Merge Google Calendar events with local events
  mergeEvents(localEvents: Event[], googleEvents: Event[], calendarId?: string): Event[] {
    // Create a map of existing events by their Google ID for deduplication
    const existingGoogleEventIds = new Set<string>();
    
    // Collect all existing Google event IDs from local events within this calendar scope
    localEvents.forEach(event => {
      if (event.googleEventId && (!calendarId || event.calendarId === calendarId)) {
        existingGoogleEventIds.add(event.googleEventId);
      }
    });

    // Filter out local Google events for this calendar to rebuild from fresh Google data
    const nonGoogleLocalEvents = localEvents.filter(event => {
      // If we're syncing a specific calendar, keep all events from other calendars
      if (calendarId && event.calendarId !== calendarId) return true;
      // If we're syncing the "default/global" sync, only keep non-Google events that don't have a calendarId
      if (!calendarId && event.calendarId) return true;
      // Otherwise, filter out Google events (they will be updated/re-added)
      return !event.googleEventId;
    });
    
    // Process Google events, only add ones that don't already exist
    const newGoogleEvents: Event[] = [];
    googleEvents.forEach(googleEvent => {
      if (googleEvent.googleEventId && !existingGoogleEventIds.has(googleEvent.googleEventId)) {
        // This is a new Google event, add it
        newGoogleEvents.push(googleEvent);
        existingGoogleEventIds.add(googleEvent.googleEventId);
      }
    });

    // Update existing Google events with fresh data from Google
    const updatedLocalEvents = localEvents.map(localEvent => {
      if (localEvent.googleEventId && (!calendarId || localEvent.calendarId === calendarId)) {
        // Find the corresponding Google event
        const matchingGoogleEvent = googleEvents.find(ge => ge.googleEventId === localEvent.googleEventId);
        if (matchingGoogleEvent) {
          // Update with fresh Google data but keep local properties like color if not specified
          return {
            ...localEvent,
            title: matchingGoogleEvent.title,
            description: matchingGoogleEvent.description,
            startTime: matchingGoogleEvent.startTime,
            endTime: matchingGoogleEvent.endTime,
            dayOfWeek: matchingGoogleEvent.dayOfWeek,
            color: matchingGoogleEvent.color || localEvent.color, // Keep local color if Google doesn't specify one
            calendarId: calendarId || localEvent.calendarId // Ensure calendarId is maintained/set
          };
        } else if (calendarId || !localEvent.calendarId) {
          // Google event was deleted in the scope we're syncing, remove from local
          return null;
        }
      }
      return localEvent;
    }).filter((event): event is Event => event !== null);

    // Combine everything
    return [
      ...nonGoogleLocalEvents,
      ...updatedLocalEvents.filter(event => event.googleEventId && (!calendarId || event.calendarId === calendarId)),
      ...newGoogleEvents,
    ];
  }

  // Get OAuth URL for Google Calendar authentication
  getAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('your_app_google_client_id')) {
      throw new Error('Google Calendar integration is not configured. Please contact the app developer.');
    }
    
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    return googleCalendarManager.getAuthUrl(clientId, redirectUri);
  }

  // Handle OAuth callback and exchange code for tokens
  async handleOAuthCallback(code: string): Promise<GoogleCalendarConfig> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('your_app_google_client_id')) {
      throw new Error('Google Calendar integration is not configured. Please contact the app developer.');
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;

    // In a real production app, this should be handled by a backend API endpoint
    // to keep the client secret secure. For now, we'll use a placeholder.
    const config = await this.exchangeCodeForTokensViaAPI(code, redirectUri);
    return config;
  }

  // This calls our secure backend API endpoint
  private async exchangeCodeForTokensViaAPI(code: string, redirectUri: string): Promise<GoogleCalendarConfig> {
    const response = await fetch('/api/auth/google/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirectUri }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange authorization code for tokens');
    }

    const config = await response.json();
    return config;
  }

  // Disconnect Google Calendar
  disconnect(): void {
    googleCalendarManager.setConfig({
      accessToken: '',
      refreshToken: '',
      expiryDate: 0,
      clientId: '',
      clientSecret: '',
    });
  }

  // Debug method to force sync (ignores cooldown)
  async forceSyncFromGoogle(currentDate: Date): Promise<Event[]> {
    if (!googleCalendarManager.isAuthenticated()) {
      return [];
    }

    this.syncInProgress = true;
    
    try {
      // Fetch events for current week and 2 weeks before/after
      const weekStart = startOfWeek(subWeeks(currentDate, 2));
      const weekEnd = endOfWeek(addWeeks(currentDate, 2));
      
      const googleEvents = await googleCalendarManager.fetchEvents(weekStart, weekEnd);
      
      this.lastSyncTime = Date.now();
      
      return googleEvents;
    } catch (error) {
      console.error('Failed to force sync from Google Calendar:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync events from a specific Google Calendar with its own credentials
  async syncFromGoogleForCalendar(
    currentDate: Date,
    calendarId: string,
    googleCalendarId: string = 'primary',
    accessToken?: string,
    refreshToken?: string,
    tokenExpiry?: number
  ): Promise<Event[]> {
    if (!accessToken && !refreshToken) {
      return [];
    }

    this.syncInProgress = true;
    
    try {
      // Fetch events for current week and 2 weeks before/after
      const weekStart = startOfWeek(subWeeks(currentDate, 2));
      const weekEnd = endOfWeek(addWeeks(currentDate, 2));
      
      // Use the calendar-specific credentials
      const googleEvents = await googleCalendarManager.fetchEventsWithCredentials(
        weekStart, 
        weekEnd,
        googleCalendarId,
        accessToken,
        refreshToken,
        tokenExpiry
      );
      
      // Tag all events with the calendar ID
      const taggedEvents = googleEvents.map(event => ({
        ...event,
        calendarId,
      }));
      
      this.lastSyncTime = Date.now();
      
      return taggedEvents;
    } catch (error) {
      console.error('Failed to sync from Google Calendar:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }
}

export const googleCalendarSyncService = new GoogleCalendarSyncService();


