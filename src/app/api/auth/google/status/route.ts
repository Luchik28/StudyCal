import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const isConfigured = !!(
    clientId && 
    clientSecret && 
    !clientId.includes('your_app_google_client_id') &&
    !clientSecret.includes('your_app_google_client_secret')
  );

  return NextResponse.json({
    configured: isConfigured,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    message: isConfigured 
      ? 'Google Calendar integration is properly configured'
      : 'Google Calendar integration requires environment variable setup'
  });
}
