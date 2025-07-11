'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Calendar, AlertCircle } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useEvents } from '@/contexts/EventsContext';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { 
    timeFormat, 
    setTimeFormat, 
    googleCalendarEnabled,
    setGoogleCalendarEnabled,
    setGoogleCalendarConfig,
    isGoogleCalendarAuthenticated,
    saveSettings 
  } = useSettings();
  const { syncWithGoogleCalendar, isSyncing } = useEvents();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGoogleCalendarConfigured, setIsGoogleCalendarConfigured] = useState<boolean | null>(null);
  
  // Check if Google Calendar integration is configured
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch('/api/auth/google/status');
        const data = await response.json();
        setIsGoogleCalendarConfigured(data.configured);
      } catch (error) {
        console.error('Failed to check Google Calendar configuration:', error);
        setIsGoogleCalendarConfigured(false);
      }
    };
    
    if (isOpen) {
      checkConfiguration();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await saveSettings();
      onClose();
    } catch (error) {
      setSaveError('Failed to save settings. Please try again.');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleCalendarConnect = async () => {
    setIsConnecting(true);
    setSaveError(null);
    
    try {
      const authUrl = googleCalendarSyncService.getAuthUrl();
      
      // Open popup window for OAuth
      const popup = window.open(
        authUrl, 
        'google-calendar-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        setSaveError('Please allow popups for this site to connect to Google Calendar.');
        return;
      }
      
      // Listen for the popup to close (indicating auth completion)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // The auth flow will be handled by the callback page
        }
      }, 1000);
      
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('not configured')) {
        setSaveError('Google Calendar integration is not available. Please contact the app developer.');
      } else {
        setSaveError('Failed to connect to Google Calendar. Please try again.');
      }
      console.error('Error connecting to Google Calendar:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleCalendarDisconnect = () => {
    setGoogleCalendarEnabled(false);
    setGoogleCalendarConfig(undefined);
    googleCalendarSyncService.disconnect();
  };

  const handleManualSync = async () => {
    if (!isGoogleCalendarAuthenticated()) {
      setSaveError('Please connect to Google Calendar first.');
      return;
    }

    try {
      await syncWithGoogleCalendar();
      setSaveError(null);
    } catch (error) {
      setSaveError('Failed to sync with Google Calendar. Please try again.');
      console.error('Error syncing with Google Calendar:', error);
    }
  };

  return (
    <div className={`fixed inset-0 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ zIndex: 60 }}>
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Background overlay */}
        <div 
          className={`fixed inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(1px)' }}
          onClick={onClose}
        />
        
        {/* Modal content */}
        <div className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-lg ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Settings
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Time Format Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeFormat"
                      value="12h"
                      checked={timeFormat === '12h'}
                      onChange={(e) => setTimeFormat(e.target.value as '12h' | '24h')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">12 Hour (1:00 PM)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeFormat"
                      value="24h"
                      checked={timeFormat === '24h'}
                      onChange={(e) => setTimeFormat(e.target.value as '12h' | '24h')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">24 Hour (13:00)</span>
                  </label>
                </div>
              </div>

              {/* Google Calendar Integration */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center mb-3">
                  <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                  <label className="block text-sm font-medium text-gray-700">
                    Google Calendar Integration
                  </label>
                </div>
                
                {isGoogleCalendarConfigured === null ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Checking configuration...</span>
                  </div>
                ) : !isGoogleCalendarConfigured ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800 mb-1">
                          Google Calendar Not Available
                        </h4>
                        <p className="text-sm text-amber-700">
                          The Google Calendar integration has not been configured by the app developer. 
                          Contact the app maintainer to enable this feature.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          isGoogleCalendarAuthenticated() ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-700">
                          {isGoogleCalendarAuthenticated() ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      
                      {isGoogleCalendarAuthenticated() ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                          >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                          </button>
                          <button
                            onClick={handleGoogleCalendarDisconnect}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleGoogleCalendarConnect}
                          disabled={isConnecting}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isConnecting ? (
                            'Connecting...'
                          ) : (
                            <>
                              Connect
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Sync Options */}
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={googleCalendarEnabled}
                          onChange={(e) => setGoogleCalendarEnabled(e.target.checked)}
                          disabled={!isGoogleCalendarAuthenticated()}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Enable automatic sync with Google Calendar
                        </span>
                      </label>
                      
                      <p className="text-xs text-gray-500 ml-6">
                        When enabled, events will be automatically synced between your local calendar and Google Calendar.
                      </p>
                    </div>

                    {/* Info Box */}
                    <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">🎉 Easy Google Calendar Sync:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Click &quot;Connect&quot; to authenticate with your Google account</li>
                          <li>Your events automatically sync in both directions</li>
                          <li>No setup required - just click and authenticate!</li>
                          <li>Your data stays private and secure</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error message */}
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
