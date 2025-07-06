'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  return (
    <SettingsContext.Provider value={{ timeFormat, setTimeFormat }}>
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
