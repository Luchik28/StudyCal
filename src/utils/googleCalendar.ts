// Google Calendar API integration
import { Event } from '@/types/events';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
}

interface GoogleCalendarConfig {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  clientId: string;
  clientSecret: string;
}

interface GoogleCalendarListResponse {
  items: (GoogleCalendarEvent & { id: string })[];
}

class GoogleCalendarManager {
  private config: GoogleCalendarConfig | null = null;
  private readonly CALENDAR_ID = 'primary';
  private readonly SCOPES = ['https://www.googleapis.com/auth/calendar'];

  // Initialize with stored configuration
  setConfig(config: GoogleCalendarConfig) {
    this.config = config;
  }

  // Check if we have valid authentication
  isAuthenticated(): boolean {
    return this.config !== null && this.config.accessToken !== '';
  }

  // Get authorization URL for OAuth flow
  getAuthUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<GoogleCalendarConfig> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    
    const config: GoogleCalendarConfig = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: Date.now() + (data.expires_in * 1000),
      clientId,
      clientSecret,
    };

    this.config = config;
    return config;
  }

  // Refresh access token if expired
  async refreshAccessToken(): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration available');
    }

    // Use secure API endpoint for token refresh
    const response = await fetch('/api/auth/google/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: this.config.refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to refresh access token');
    }

    const data = await response.json();
    
    this.config.accessToken = data.accessToken;
    this.config.expiryDate = data.expiryDate;
  }

  // Ensure we have a valid access token
  private async ensureValidToken(): Promise<void> {
    if (!this.config) {
      throw new Error('Google Calendar not configured');
    }

    if (Date.now() >= this.config.expiryDate) {
      await this.refreshAccessToken();
    }
  }

  // Fetch events from Google Calendar
  async fetchEvents(timeMin?: Date, timeMax?: Date): Promise<Event[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      calendarId: this.CALENDAR_ID,
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) {
      params.append('timeMin', timeMin.toISOString());
    }

    if (timeMax) {
      params.append('timeMax', timeMax.toISOString());
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config!.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data: GoogleCalendarListResponse = await response.json();
    
    return data.items?.map((item) => this.convertFromGoogleEvent(item)) || [];
  }

  // Create event in Google Calendar
  async createEvent(event: Event): Promise<string> {
    await this.ensureValidToken();

    const googleEvent = this.convertToGoogleEvent(event);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create Google Calendar event');
    }

    const data = await response.json();
    return data.id;
  }

  // Update event in Google Calendar
  async updateEvent(eventId: string, event: Event): Promise<void> {
    await this.ensureValidToken();

    const googleEvent = this.convertToGoogleEvent(event);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config!.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Google Calendar event');
    }
  }

  // Delete event from Google Calendar
  async deleteEvent(eventId: string): Promise<void> {
    await this.ensureValidToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config!.accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete Google Calendar event');
    }
  }

  // Convert our Event to Google Calendar format
  private convertToGoogleEvent(event: Event): GoogleCalendarEvent {
    return {
      summary: event.title,
      description: event.description || '',
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  }

  // Convert Google Calendar event to our Event format
  private convertFromGoogleEvent(googleEvent: GoogleCalendarEvent & { id: string }): Event {
    const startDateTime = googleEvent.start.dateTime || googleEvent.start.date;
    const endDateTime = googleEvent.end.dateTime || googleEvent.end.date;
    
    if (!startDateTime || !endDateTime) {
      throw new Error('Invalid Google Calendar event: missing start or end time');
    }
    
    return {
      id: `google_${googleEvent.id}`,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      startTime: new Date(startDateTime),
      endTime: new Date(endDateTime),
      color: this.getColorFromGoogleColorId(googleEvent.colorId),
      dayOfWeek: new Date(startDateTime).getDay(),
      category: 'Google Calendar',
      subcategory: 'Synced Event',
      googleEventId: googleEvent.id,
    };
  }

  // Map Google Calendar color IDs to our colors
  private getColorFromGoogleColorId(colorId?: string): string {
    const colorMap: { [key: string]: string } = {
      '1': '#7986CB', // Lavender
      '2': '#33B679', // Sage
      '3': '#8E24AA', // Grape
      '4': '#E67C73', // Flamingo
      '5': '#F6C026', // Banana
      '6': '#F5511D', // Tangerine
      '7': '#039BE5', // Peacock
      '8': '#616161', // Graphite
      '9': '#3F51B5', // Blueberry
      '10': '#0B8043', // Basil
      '11': '#D50000', // Tomato
    };

    return colorMap[colorId || '1'] || '#3B82F6';
  }
}

export const googleCalendarManager = new GoogleCalendarManager();
export type { GoogleCalendarConfig };
