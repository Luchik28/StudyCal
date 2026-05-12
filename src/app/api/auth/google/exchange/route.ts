import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google Calendar integration is not configured' },
        { status: 500 }
      );
    }

    // Exchange authorization code for tokens
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        console.error('OAuth token exchange failed:', error);
        console.error('Request details:', {
          code: code.substring(0, 10) + '...', // Only log first 10 chars for security
          redirectUri,
          clientId,
          hasClientSecret: !!clientSecret
        });
        
        // Try to parse the error as JSON for better error reporting
        let parsedError;
        try {
          parsedError = JSON.parse(error);
        } catch {
          parsedError = { error: 'unknown', error_description: error };
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to exchange authorization code for tokens',
            details: parsedError
          },
          { status: 400 }
        );
      }

      const data = await response.json();
      
      // Fetch the primary calendar info to get its name
      let calendarName = 'Google Calendar';
      try {
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList/primary', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          calendarName = calendarData.summary || calendarData.id || 'Google Calendar';
        }
      } catch (e) {
        console.error('Failed to fetch calendar info:', e);
      }
      
      const config = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiryDate: Date.now() + (data.expires_in * 1000),
        clientId,
        clientSecret, // Note: In production, don't send this back to frontend
        calendarName,
      };

      return NextResponse.json(config);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Connection timed out while contacting Google. Please check your internet connection.' },
          { status: 504 }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error in OAuth token exchange:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
