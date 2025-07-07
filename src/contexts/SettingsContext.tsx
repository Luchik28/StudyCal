'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { dbManager, initDB } from '@/utils/indexedDB';
import { googleCalendarManager, GoogleCalendarConfig } from '@/utils/googleCalendar';

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState<boolean>(false);
  const [googleCalendarConfig, setGoogleCalendarConfig] = useState<GoogleCalendarConfig | undefined>(undefined);
  const [googleCalendarAuthenticated, setGoogleCalendarAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define saveSettings function
  const saveSettings = async (): Promise<void> => {
    try {
      console.log('Saving settings to IndexedDB:', { 
        timeFormat, 
        googleCalendarEnabled,
        googleCalendarConfig: googleCalendarConfig ? 'present' : 'none'
      });
      await dbManager.saveSettings({ 
        timeFormat, 
        googleCalendarEnabled,
        googleCalendarConfig 
      });
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  // Callback to save updated config when tokens are refreshed
  const handleConfigUpdate = async (config: GoogleCalendarConfig) => {
    console.log('Config updated by GoogleCalendarManager, saving to IndexedDB...');
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
      console.log('Settings saved successfully after token refresh');
    } catch (error) {
      console.error('Failed to save settings after token refresh:', error);
    }
  };

  // Set up the callback immediately
  useEffect(() => {
    googleCalendarManager.setOnConfigUpdated(handleConfigUpdate);
  }, []);

  // Load settings from IndexedDB on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Loading settings from IndexedDB...');
        await initDB();
        const savedSettings = await dbManager.loadSettings();
        console.log('Loaded settings:', savedSettings);
        
        if (savedSettings) {
          setTimeFormat(savedSettings.timeFormat);
          setGoogleCalendarEnabled(savedSettings.googleCalendarEnabled);
          console.log('Setting Google Calendar enabled:', savedSettings.googleCalendarEnabled);
          if (savedSettings.googleCalendarConfig) {
            console.log('Setting Google Calendar config:', savedSettings.googleCalendarConfig);
            setGoogleCalendarConfig(savedSettings.googleCalendarConfig);
            googleCalendarManager.setConfig(savedSettings.googleCalendarConfig);
            const authStatus = googleCalendarManager.isAuthenticated();
            console.log('Authentication status after setting config:', authStatus);
            setGoogleCalendarAuthenticated(authStatus);
            
            // If token is expired but we have a refresh token, try to refresh it
            if (!authStatus && savedSettings.googleCalendarConfig.refreshToken) {
              console.log('Token appears expired, attempting to refresh...');
              console.log('Current time:', Date.now());
              console.log('Token expiry:', savedSettings.googleCalendarConfig.expiryDate);
              console.log('Time until expiry:', savedSettings.googleCalendarConfig.expiryDate - Date.now());
              try {
                await googleCalendarManager.refreshAccessToken();
                const newConfig = googleCalendarManager.getConfig();
                console.log('Token refresh successful, new config:', newConfig);
                if (newConfig) {
                  setGoogleCalendarConfig(newConfig);
                  const newAuthStatus = googleCalendarManager.isAuthenticated();
                  console.log('Authentication status after refresh:', newAuthStatus);
                  setGoogleCalendarAuthenticated(newAuthStatus);
                  
                  // Save the updated config
                  await dbManager.saveSettings({
                    timeFormat: savedSettings.timeFormat,
                    googleCalendarEnabled: savedSettings.googleCalendarEnabled,
                    googleCalendarConfig: newConfig
                  });
                  console.log('Updated settings saved after token refresh');
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

  // Set up the callback when component mounts
  useEffect(() => {
    googleCalendarManager.setOnConfigUpdated(handleConfigUpdate);
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
      isLoading 
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
