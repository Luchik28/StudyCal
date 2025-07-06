'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { dbManager, initDB } from '@/utils/indexedDB';

interface SettingsContextType {
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from IndexedDB on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await initDB();
        const savedSettings = await dbManager.loadSettings();
        
        if (savedSettings) {
          setTimeFormat(savedSettings.timeFormat);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (): Promise<void> => {
    try {
      await dbManager.saveSettings({ timeFormat });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ timeFormat, setTimeFormat, saveSettings, isLoading }}>
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
