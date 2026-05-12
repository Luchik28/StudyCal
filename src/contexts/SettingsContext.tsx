'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { dbManager, initDB } from '@/utils/indexedDB';
import { googleCalendarManager, GoogleCalendarConfig } from '@/utils/googleCalendar';
import { ColorSchemeMode, getDefaultEventTypeColors, getDefaultCalendarColors, PASTEL_EVENT_COLORS } from '@/utils/colorSchemes';

interface SettingsContextType {
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
  googleCalendarEnabled: boolean;
  setGoogleCalendarEnabled: (enabled: boolean) => void;
  googleCalendarConfig?: GoogleCalendarConfig;
  setGoogleCalendarConfig: (config: GoogleCalendarConfig | undefined) => void;
  isGoogleCalendarAuthenticated: () => boolean;
  googleCalendarAuthenticated: boolean;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
  colorSchemeMode: ColorSchemeMode;
  setColorSchemeMode: (mode: ColorSchemeMode) => void;
  eventTypeColors: Record<string, string>;
  setEventTypeColors: (colors: Record<string, string>) => void;
  calendarColors: Record<string, string>;
  setCalendarColors: (colors: Record<string, string>) => void;
  switchColorSchemeMode: (mode: ColorSchemeMode) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState<boolean>(false);
  const [googleCalendarConfig, setGoogleCalendarConfig] = useState<GoogleCalendarConfig | undefined>(undefined);
  const [googleCalendarAuthenticated, setGoogleCalendarAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [colorSchemeMode, setColorSchemeMode] = useState<ColorSchemeMode>('event-type');
  const [eventTypeColors, setEventTypeColors] = useState<Record<string, string>>(getDefaultEventTypeColors());
  const [calendarColors, setCalendarColors] = useState<Record<string, string>>({});

  // Define saveSettings function
  const saveSettings = async (): Promise<void> => {
    try {
      await dbManager.saveSettings({ 
        timeFormat, 
        googleCalendarEnabled,
        googleCalendarConfig,
        colorSchemeMode,
        eventTypeColors,
        calendarColors
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  // Callback to save updated config when tokens are refreshed
  const handleConfigUpdate = useCallback(async (config: GoogleCalendarConfig) => {
    // Update the state with the new config
    setGoogleCalendarConfig(config);
    // Update authentication status
    setGoogleCalendarAuthenticated(true);
    
    // Save directly to IndexedDB with the new config
    try {
      await dbManager.saveSettings({ 
        timeFormat, 
        googleCalendarEnabled,
        googleCalendarConfig: config 
      });
    } catch (error) {
      console.error('Failed to save settings after token refresh:', error);
    }
  }, [timeFormat, googleCalendarEnabled]);

  // Set up the callback immediately
  useEffect(() => {
    googleCalendarManager.setOnConfigUpdated(handleConfigUpdate);
  }, [handleConfigUpdate]);

  // Load settings from IndexedDB on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await initDB();
        const savedSettings = await dbManager.loadSettings();
        
        if (savedSettings) {
          setTimeFormat(savedSettings.timeFormat);
          setGoogleCalendarEnabled(savedSettings.googleCalendarEnabled);
          setColorSchemeMode(savedSettings.colorSchemeMode || 'event-type');
          setEventTypeColors(savedSettings.eventTypeColors || getDefaultEventTypeColors());
          setCalendarColors(savedSettings.calendarColors || {});
          if (savedSettings.googleCalendarConfig) {
            setGoogleCalendarConfig(savedSettings.googleCalendarConfig);
            googleCalendarManager.setConfig(savedSettings.googleCalendarConfig);
            const authStatus = googleCalendarManager.isAuthenticated();
            setGoogleCalendarAuthenticated(authStatus);
            
            // If token is expired but we have a refresh token, try to refresh it
            if (!authStatus && savedSettings.googleCalendarConfig.refreshToken) {
              try {
                await googleCalendarManager.refreshAccessToken();
                const newConfig = googleCalendarManager.getConfig();
                if (newConfig) {
                  setGoogleCalendarConfig(newConfig);
                  const newAuthStatus = googleCalendarManager.isAuthenticated();
                  setGoogleCalendarAuthenticated(newAuthStatus);
                  
                  // Save the updated config
                  await dbManager.saveSettings({
                    timeFormat: savedSettings.timeFormat,
                    googleCalendarEnabled: savedSettings.googleCalendarEnabled,
                    googleCalendarConfig: newConfig,
                    colorSchemeMode: savedSettings.colorSchemeMode,
                    eventTypeColors: savedSettings.eventTypeColors,
                    calendarColors: savedSettings.calendarColors
                  });
                }
              } catch (error) {
                console.error('Failed to refresh token on startup:', error);
                // Token refresh failed, user needs to re-authenticate
                setGoogleCalendarAuthenticated(false);
                setGoogleCalendarConfig(undefined);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const isGoogleCalendarAuthenticated = (): boolean => {
    return googleCalendarManager.isAuthenticated();
  };

  // Update authentication status when config changes
  useEffect(() => {
    setGoogleCalendarAuthenticated(googleCalendarManager.isAuthenticated());
  }, [googleCalendarConfig]);

  // Custom setter for Google Calendar config that also updates the manager
  const setGoogleCalendarConfigWithManager = (config: GoogleCalendarConfig | undefined) => {
    setGoogleCalendarConfig(config);
    if (config) {
      googleCalendarManager.setConfig(config);
    }
    setGoogleCalendarAuthenticated(googleCalendarManager.isAuthenticated());
  };

  // Switch color scheme mode and generate new default colors
  const switchColorSchemeMode = useCallback((mode: ColorSchemeMode) => {
    setColorSchemeMode(mode);
    if (mode === 'event-type') {
      setEventTypeColors(getDefaultEventTypeColors());
    } else {
      // For calendar mode, generate colors based on number of calendars
      const newCalendarColors: Record<string, string> = {};
      // Will be populated by the component with calendar IDs
      setCalendarColors(newCalendarColors);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      timeFormat, 
      setTimeFormat, 
      googleCalendarEnabled,
      setGoogleCalendarEnabled,
      googleCalendarConfig,
      setGoogleCalendarConfig: setGoogleCalendarConfigWithManager,
      isGoogleCalendarAuthenticated,
      googleCalendarAuthenticated,
      saveSettings, 
      isLoading,
      colorSchemeMode,
      setColorSchemeMode,
      eventTypeColors,
      setEventTypeColors,
      calendarColors,
      setCalendarColors,
      switchColorSchemeMode
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
