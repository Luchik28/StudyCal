// Google Calendar API integration
import { Event } from '@/types/events';
import { classifyEvent } from './eventClassification';

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
  private onConfigUpdated?: (config: GoogleCalendarConfig) => Promise<void>;

  // Set callback for when config is updated (e.g., after token refresh)
  setOnConfigUpdated(callback: (config: GoogleCalendarConfig) => Promise<void>) {
    this.onConfigUpdated = callback;
  }

  // Initialize with stored configuration
  setConfig(config: GoogleCalendarConfig) {
    this.config = config;
  }

  // Get current configuration
  getConfig(): GoogleCalendarConfig | null {
    return this.config;
  }

  // Check if we have valid authentication (either valid token or refresh token)
  isAuthenticated(): boolean {
    if (!this.config) {
      console.log('GoogleCalendarManager.isAuthenticated: No config');
      return false;
    }
    
    // We're authenticated if we have a refresh token (can refresh access) or a valid access token
    const hasRefreshToken = !!this.config.refreshToken;
    const hasValidAccessToken = !!this.config.accessToken && Date.now() < (this.config.expiryDate - 60000);
    
    console.log('GoogleCalendarManager.isAuthenticated:', {
      hasRefreshToken,
      hasValidAccessToken,
      accessToken: this.config.accessToken ? 'present' : 'missing',
      refreshToken: this.config.refreshToken ? 'present' : 'missing',
      expiryDate: this.config.expiryDate,
      now: Date.now(),
      timeUntilExpiry: this.config.expiryDate - Date.now()
    });
    
    return hasRefreshToken || hasValidAccessToken;
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

    console.log('Refreshing Google Calendar access token...');

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
    
    console.log('Access token refreshed successfully');

    // Save updated config if callback is provided
    if (this.onConfigUpdated && this.config) {
      console.log('Saving updated config after token refresh...');
      await this.onConfigUpdated(this.config);
    }
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
    console.log('GoogleCalendarManager.fetchEvents called');
    console.log('timeMin:', timeMin, 'timeMax:', timeMax);
    console.log('config exists:', !!this.config);
    console.log('accessToken exists:', this.config?.accessToken ? 'yes' : 'no');
    
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

    console.log('Making request to Google Calendar API with params:', params.toString());

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config!.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Google Calendar API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar API error:', errorText);
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data: GoogleCalendarListResponse = await response.json();
    console.log('Google Calendar API response data:', data);
    
    // Convert events with TensorFlow classification
    const events = await this.convertAndClassifyGoogleEvents(data.items || []);
    console.log('Converted events:', events);
    return events;
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

  // Convert Google Calendar events and classify them using TensorFlow
  private async convertAndClassifyGoogleEvents(googleEvents: (GoogleCalendarEvent & { id: string })[]): Promise<Event[]> {
    const convertedEvents = await Promise.all(
      googleEvents.map(async (googleEvent) => {
        // First convert to our Event format with temporary classification
        const tempEvent = this.convertFromGoogleEventWithoutClassification(googleEvent);
        
        try {
          // Use TensorFlow to classify the event
          const classification = await classifyEvent(tempEvent);
          
          // Update the event with TensorFlow classification
          return {
            ...tempEvent,
            category: classification.category,
            subcategory: classification.subcategory,
            color: this.getColorForCategory(classification.category),
          };
        } catch (error) {
          console.error('Failed to classify Google Calendar event, using fallback:', error);
          // Fallback to simple keyword-based classification
          const { category, subcategory } = this.categorizeEvent(googleEvent.summary || '', googleEvent.description || '');
          return {
            ...tempEvent,
            category,
            subcategory,
            color: this.getColorForCategory(category),
          };
        }
      })
    );
    
    return convertedEvents;
  }

  // Convert Google Calendar event to our Event format without classification
  private convertFromGoogleEventWithoutClassification(googleEvent: GoogleCalendarEvent & { id: string }): Event {
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
      color: '#6B7280', // Default gray, will be updated after classification
      dayOfWeek: new Date(startDateTime).getDay(),
      category: 'Personal', // Temporary, will be updated after classification
      subcategory: 'Activity', // Temporary, will be updated after classification
      googleEventId: googleEvent.id,
    };
  }

  // Intelligently categorize events based on title and description
  private categorizeEvent(title: string, description: string): { category: string; subcategory: string } {
    const text = `${title} ${description}`.toLowerCase();
    
    // Work-related keywords
    if (this.containsKeywords(text, ['meeting', 'standup', 'sync', 'review', 'demo', 'presentation', 'interview', 'conference', 'workshop', 'training', 'team', 'project', 'work', 'office', 'call', 'zoom', 'teams'])) {
      if (this.containsKeywords(text, ['meeting', 'standup', 'sync', 'call', 'zoom', 'teams'])) {
        return { category: 'Work', subcategory: 'Meeting' };
      } else if (this.containsKeywords(text, ['training', 'workshop', 'conference', 'demo', 'presentation'])) {
        return { category: 'Work', subcategory: 'Learning' };
      } else if (this.containsKeywords(text, ['interview', 'review'])) {
        return { category: 'Work', subcategory: 'Important' };
      }
      return { category: 'Work', subcategory: 'Task' };
    }
    
    // Health-related keywords
    if (this.containsKeywords(text, ['doctor', 'dentist', 'appointment', 'checkup', 'medical', 'hospital', 'clinic', 'therapy', 'physio', 'massage', 'surgery', 'vaccine', 'consultation'])) {
      if (this.containsKeywords(text, ['doctor', 'dentist', 'medical', 'hospital', 'clinic', 'consultation'])) {
        return { category: 'Health', subcategory: 'Appointment' };
      } else if (this.containsKeywords(text, ['therapy', 'physio', 'massage'])) {
        return { category: 'Health', subcategory: 'Treatment' };
      }
      return { category: 'Health', subcategory: 'Checkup' };
    }
    
    // Education-related keywords
    if (this.containsKeywords(text, ['class', 'lecture', 'course', 'study', 'exam', 'test', 'assignment', 'homework', 'school', 'university', 'college', 'tutorial', 'seminar', 'lab'])) {
      if (this.containsKeywords(text, ['exam', 'test'])) {
        return { category: 'Education', subcategory: 'Exam' };
      } else if (this.containsKeywords(text, ['class', 'lecture', 'course', 'tutorial', 'seminar', 'lab'])) {
        return { category: 'Education', subcategory: 'Class' };
      } else if (this.containsKeywords(text, ['assignment', 'homework', 'study'])) {
        return { category: 'Education', subcategory: 'Study' };
      }
      return { category: 'Education', subcategory: 'Academic' };
    }
    
    // Personal/Social keywords
    if (this.containsKeywords(text, ['dinner', 'lunch', 'breakfast', 'coffee', 'drink', 'party', 'birthday', 'celebration', 'wedding', 'date', 'friend', 'family', 'social', 'hangout', 'outing'])) {
      if (this.containsKeywords(text, ['dinner', 'lunch', 'breakfast', 'coffee'])) {
        return { category: 'Personal', subcategory: 'Meal' };
      } else if (this.containsKeywords(text, ['party', 'birthday', 'celebration', 'wedding'])) {
        return { category: 'Personal', subcategory: 'Event' };
      }
      return { category: 'Personal', subcategory: 'Social' };
    }
    
    // Fitness/Exercise keywords
    if (this.containsKeywords(text, ['gym', 'workout', 'exercise', 'run', 'jog', 'yoga', 'pilates', 'fitness', 'training', 'sports', 'swim', 'bike', 'hike'])) {
      return { category: 'Personal', subcategory: 'Exercise' };
    }
    
    // Travel keywords
    if (this.containsKeywords(text, ['flight', 'travel', 'vacation', 'trip', 'hotel', 'airport', 'train', 'bus', 'drive'])) {
      return { category: 'Personal', subcategory: 'Travel' };
    }
    
    // Shopping/Errands keywords
    if (this.containsKeywords(text, ['shopping', 'grocery', 'store', 'buy', 'purchase', 'errand', 'bank', 'post office', 'pickup', 'delivery'])) {
      return { category: 'Personal', subcategory: 'Errands' };
    }
    
    // Entertainment keywords
    if (this.containsKeywords(text, ['movie', 'concert', 'show', 'theater', 'music', 'game', 'entertainment', 'fun', 'hobby'])) {
      return { category: 'Personal', subcategory: 'Entertainment' };
    }
    
    // Default category for unmatched events
    return { category: 'Personal', subcategory: 'Activity' };
  }

  // Helper function to check if text contains any of the keywords
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  // Get color based on category
  private getColorForCategory(category: string): string {
    const categoryColors: { [key: string]: string } = {
      'Work': '#3B82F6',        // Blue
      'Health': '#EF4444',      // Red
      'Education': '#8B5CF6',   // Purple
      'Personal': '#10B981',    // Green
    };
    
    return categoryColors[category] || '#6B7280'; // Default gray
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
