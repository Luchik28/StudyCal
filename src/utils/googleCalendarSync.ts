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
    console.log('syncFromGoogle called with date:', currentDate);
    console.log('isAuthenticated:', googleCalendarManager.isAuthenticated());
    console.log('shouldSync:', this.shouldSync());
    
    if (!googleCalendarManager.isAuthenticated() || !this.shouldSync()) {
      console.log('Skipping sync - not authenticated or cooling down');
      return [];
    }

    this.syncInProgress = true;
    console.log('Starting Google Calendar sync...');
    
    try {
      // Fetch events for current week and 2 weeks before/after
      const weekStart = startOfWeek(subWeeks(currentDate, 2));
      const weekEnd = endOfWeek(addWeeks(currentDate, 2));
      
      console.log('Fetching events from', weekStart, 'to', weekEnd);
      const googleEvents = await googleCalendarManager.fetchEvents(weekStart, weekEnd);
      console.log('Fetched', googleEvents.length, 'events from Google Calendar');
      
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

  // Merge Google Calendar events with local events
  mergeEvents(localEvents: Event[], googleEvents: Event[]): Event[] {
    // Create a map of existing Google events by their Google ID
    const googleEventMap = new Map<string, Event>();
    
    // First, collect all existing Google events from local storage
    localEvents.forEach(event => {
      if (event.id.startsWith('google_') && event.googleEventId) {
        googleEventMap.set(event.googleEventId, event);
      }
    });

    // Update or add Google events
    const updatedGoogleEvents: Event[] = [];
    googleEvents.forEach(googleEvent => {
      const existingEvent = googleEventMap.get(googleEvent.googleEventId!);
      
      if (existingEvent) {
        // Update existing Google event
        updatedGoogleEvents.push({
          ...existingEvent,
          title: googleEvent.title,
          description: googleEvent.description,
          startTime: googleEvent.startTime,
          endTime: googleEvent.endTime,
          dayOfWeek: googleEvent.dayOfWeek,
        });
        googleEventMap.delete(googleEvent.googleEventId!);
      } else {
        // Add new Google event
        updatedGoogleEvents.push(googleEvent);
      }
    });

    // Filter out local events that correspond to deleted Google events
    const filteredLocalEvents = localEvents.filter(event => {
      if (event.id.startsWith('google_') && event.googleEventId) {
        return !googleEventMap.has(event.googleEventId);
      }
      return true;
    });

    // Combine local events (non-Google) with updated Google events
    return [
      ...filteredLocalEvents.filter(event => !event.id.startsWith('google_')),
      ...updatedGoogleEvents,
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
      console.error('Full error response from Google:', error);
      console.error('Code:', code);
      console.error('Redirect URI:', redirectUri);
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
    console.log('forceSyncFromGoogle called - ignoring cooldown');
    
    if (!googleCalendarManager.isAuthenticated()) {
      console.log('Not authenticated, cannot force sync');
      return [];
    }

    this.syncInProgress = true;
    console.log('Starting forced Google Calendar sync...');
    
    try {
      // Fetch events for current week and 2 weeks before/after
      const weekStart = startOfWeek(subWeeks(currentDate, 2));
      const weekEnd = endOfWeek(addWeeks(currentDate, 2));
      
      console.log('Fetching events from', weekStart, 'to', weekEnd);
      const googleEvents = await googleCalendarManager.fetchEvents(weekStart, weekEnd);
      console.log('Fetched', googleEvents.length, 'events from Google Calendar');
      
      this.lastSyncTime = Date.now();
      
      return googleEvents;
    } catch (error) {
      console.error('Failed to force sync from Google Calendar:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }
}

export const googleCalendarSyncService = new GoogleCalendarSyncService();

// Add to window for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).googleCalendarSyncService = googleCalendarSyncService;
}
