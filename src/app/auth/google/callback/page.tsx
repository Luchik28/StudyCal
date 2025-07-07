'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';
import { useSettings } from '@/contexts/SettingsContext';
import { useEvents } from '@/contexts/EventsContext';
import { dbManager } from '@/utils/indexedDB';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setGoogleCalendarEnabled, setGoogleCalendarConfig, saveSettings, timeFormat } = useSettings();
  const { syncWithGoogleCalendar } = useEvents();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate processing
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          setStatus('error');
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setStatus('error');
          return;
        }

        // Exchange code for tokens
        const config = await googleCalendarSyncService.handleOAuthCallback(code);
        
        // Save configuration - Pass config directly to avoid state timing issues
        setGoogleCalendarConfig(config);
        setGoogleCalendarEnabled(true);
        
        // Save settings directly with the new config to avoid state timing issues
        try {
          const settingsToSave = {
            timeFormat: timeFormat,
            googleCalendarEnabled: true,
            googleCalendarConfig: config
          };
          await dbManager.saveSettings(settingsToSave);
        } catch (saveError) {
          console.error('Failed to save settings after OAuth:', saveError);
          throw saveError;
        }

        // Trigger sync to immediately fetch Google Calendar events
        try {
          await syncWithGoogleCalendar();
        } catch (syncError) {
          console.error('Failed to sync Google Calendar events after authentication:', syncError);
          // Don't fail the authentication flow if sync fails
        }

        setStatus('success');
        
        // Redirect back to the main app after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError('Failed to complete authentication. Please try again.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router, setGoogleCalendarEnabled, setGoogleCalendarConfig, saveSettings, syncWithGoogleCalendar, timeFormat, isProcessing]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Connecting to Google Calendar...
              </h2>
              <p className="text-sm text-gray-600">
                Please wait while we set up your Google Calendar integration.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Successfully Connected!
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Your Google Calendar is now connected to the Week Planner app.
              </p>
              <p className="text-xs text-gray-500">
                Redirecting you back to the app...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Connection Failed
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {error}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to App
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GoogleCalendarCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
