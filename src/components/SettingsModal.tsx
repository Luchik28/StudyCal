'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Calendar, Palette, Settings, Plus, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { useEvents } from '@/contexts/EventsContext';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';
import { Calendar as CalendarType } from '@/types/events';
import { PASTEL_EVENT_COLORS, CATEGORY_PASTEL_COLORS } from '@/utils/colorSchemes';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { ColorPicker } from '@/components/ColorPicker';
import { dbManager } from '@/utils/indexedDB';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ColorPresetButton({ color, isSelected, onClick }: { color: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 transition-all ${
        isSelected ? 'border-gray-700 scale-110' : 'border-gray-300 hover:border-gray-500'
      }`}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

interface ExpandableColorPickerProps {
  label: string;
  currentColor: string;
  onColorChange: (color: string) => void;
  onDefaultsGenerated?: () => void;
}

function ExpandableColorPicker({ label, currentColor, onColorChange, onDefaultsGenerated }: ExpandableColorPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="ml-3 p-3 bg-white border border-gray-200 rounded-lg space-y-3">
          {/* Current color display */}
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Current</div>
          <div className="flex gap-1 flex-wrap">
            <ColorPresetButton
              color={currentColor}
              isSelected={true}
              onClick={() => {}}
            />
            <span className="text-xs text-gray-500 self-center">{currentColor}</span>
          </div>

          {/* Preset colors */}
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Presets</div>
            <div className="flex gap-1 flex-wrap">
              {PASTEL_EVENT_COLORS.map((color) => (
                <ColorPresetButton
                  key={color}
                  color={color}
                  isSelected={currentColor.toUpperCase() === color.toUpperCase()}
                  onClick={() => {
                    onColorChange(color);
                    setIsExpanded(false);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Custom</div>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarItem({ 
  calendar, 
  onUpdate, 
  onDelete, 
  onSync, 
  isSyncing 
}: { 
  calendar: CalendarType;
  onUpdate: (updates: Partial<CalendarType>) => void;
  onDelete: () => void;
  onSync: () => void;
  isSyncing: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(calendar.name);

  const handleNameSave = () => {
    if (editName.trim() && editName !== calendar.name) {
      onUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg space-y-3">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {/* Color indicator */}
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: calendar.color }}
          />
          
          {/* Name */}
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditing(true)}
            >
              {calendar.name}
            </span>
          )}
          
          {/* Type badge */}
          <span className={`text-xs px-2 py-0.5 rounded ${
            calendar.type === 'google' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {calendar.type === 'google' ? 'Google' : 'Local'}
          </span>
        </div>

        {/* Delete button (only for non-default calendars) */}
        {!calendar.isDefault && (
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
            title="Delete calendar"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Google Calendar specific options */}
      {calendar.type === 'google' && (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                calendar.googleAccessToken || calendar.googleRefreshToken ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-600">
                {calendar.googleAccessToken || calendar.googleRefreshToken ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
          
          {/* Auto-sync toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={calendar.autoSync ?? false}
              onChange={(e) => onUpdate({ autoSync: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-xs text-gray-600">Auto-sync</span>
          </label>
        </div>
      )}
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { 
    timeFormat, 
    setTimeFormat,
    colorSchemeMode,
    switchColorSchemeMode,
    eventTypeColors,
    setEventTypeColors,
    calendarColors,
    setCalendarColors,
    saveSettings,
    googleCalendarEnabled,
    googleCalendarConfig
  } = useSettings();
  const { 
    calendars, 
    addCalendar, 
    updateCalendar, 
    deleteCalendar, 
  } = useCalendars();
  const {
    syncCalendar,
    syncingCalendars 
  } = useEvents();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGoogleCalendarConfigured, setIsGoogleCalendarConfigured] = useState<boolean | null>(null);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [showAddCalendar, setShowAddCalendar] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('settings');
  const contentRef = useRef<HTMLDivElement>(null);
  
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

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element && contentRef.current) {
      const offset = element.offsetTop;
      contentRef.current.scrollTo({ top: offset - 20, behavior: 'smooth' });
    }
  };

  const handleSave = useCallback(async () => {
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
  }, [saveSettings, onClose]);

  const handleColorChange = useCallback(async (newColors: Record<string, string>, isEventType: boolean) => {
    if (isEventType) {
      setEventTypeColors(newColors);
    } else {
      setCalendarColors(newColors);
    }
    
    // Immediately save to IndexedDB with the new colors
    try {
      await dbManager.saveSettings({
        timeFormat,
        googleCalendarEnabled,
        googleCalendarConfig,
        colorSchemeMode,
        eventTypeColors: isEventType ? newColors : eventTypeColors,
        calendarColors: isEventType ? calendarColors : newColors
      });
      console.log('Colors saved successfully:', isEventType ? 'event type' : 'calendar', newColors);
    } catch (err) {
      console.error('Failed to auto-save colors:', err);
    }
  }, [timeFormat, googleCalendarEnabled, googleCalendarConfig, colorSchemeMode, eventTypeColors, calendarColors, setEventTypeColors, setCalendarColors]);

  const handleSwitchColorMode = useCallback(async () => {
    try {
      const newMode = colorSchemeMode === 'event-type' ? 'calendar' : 'event-type';
      await switchColorSchemeMode(newMode);
    } catch (error) {
      console.error('Failed to switch color mode:', error);
      setSaveError('Failed to switch color mode.');
    }
  }, [colorSchemeMode, switchColorSchemeMode]);

  const handleAddLocalCalendar = async () => {
    if (!newCalendarName.trim()) return;
    
    try {
      await addCalendar({
        name: newCalendarName.trim(),
        color: PASTEL_EVENT_COLORS[Math.floor(Math.random() * PASTEL_EVENT_COLORS.length)],
        isVisible: true,
        isDefault: false,
        type: 'local',
      });
      setNewCalendarName('');
      setShowAddCalendar(false);
    } catch (error) {
      console.error('Failed to add calendar:', error);
      setSaveError('Failed to add calendar. Please try again.');
    }
  };

  const handleConnectGoogleCalendar = async () => {
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
        setIsConnecting(false);
        return;
      }
      
      // Listen for message from callback page
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'GOOGLE_CALENDAR_CONNECTED') {
          window.removeEventListener('message', handleMessage);
          
          // Add the new Google calendar
          await addCalendar({
            name: event.data.calendarName || 'Google Calendar',
            color: '#4285f4',
            isVisible: true,
            isDefault: false,
            type: 'google',
            googleCalendarId: 'primary',
            googleAccessToken: event.data.accessToken,
            googleRefreshToken: event.data.refreshToken,
            googleTokenExpiry: event.data.expiryDate,
            autoSync: true,
          });
          
          setIsConnecting(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Cleanup listener when popup closes
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);
      
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('not configured')) {
        setSaveError('Google Calendar integration is not available. Please contact the app developer.');
      } else {
        setSaveError('Failed to connect to Google Calendar. Please try again.');
      }
      console.error('Error connecting to Google Calendar:', error);
      setIsConnecting(false);
    }
  };

  const handleDeleteCalendar = async (calendarId: string) => {
    if (calendars.length <= 1) {
      setSaveError('Cannot delete the last calendar.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this calendar? All events in this calendar will be preserved but unassigned.')) {
      try {
        await deleteCalendar(calendarId);
      } catch (error) {
        console.error('Failed to delete calendar:', error);
        setSaveError('Failed to delete calendar. Please try again.');
      }
    }
  };

  return (
    <div className={`fixed inset-0 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ zIndex: 60 }}>
      <div className="flex h-full items-center justify-center p-4">
        {/* Background overlay */}
        <div 
          className={`fixed inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(1px)' }}
          onClick={onClose}
        />
        
        {/* Modal content - Larger and modern */}
        <div className={`relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300 w-full max-w-4xl h-[90vh] flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900">
              Settings
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          
          {/* Main content with sidebar */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar for navigation */}
            <div className="w-44 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <nav className="space-y-1 p-3">
                {[
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'colors', label: 'Colors', icon: Palette },
                  { id: 'calendars', label: 'Calendars', icon: Calendar },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-left ${
                      activeSection === id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right content area - All sections on one page */}
            <div className="flex-1 overflow-y-auto" ref={contentRef}>
              <div className="p-6 space-y-12">
                {/* SETTINGS SECTION */}
                <section id="settings" className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 sticky top-0 bg-white py-2">Settings</h4>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-4">Time Format</h5>
                    <div className="flex space-x-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="timeFormat"
                          value="12h"
                          checked={timeFormat === '12h'}
                          onChange={(e) => setTimeFormat(e.target.value as '12h' | '24h')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">12 Hour (1:00 PM)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="timeFormat"
                          value="24h"
                          checked={timeFormat === '24h'}
                          onChange={(e) => setTimeFormat(e.target.value as '12h' | '24h')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">24 Hour (13:00)</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <button
                      onClick={() => {
                        localStorage.removeItem('onboardingComplete');
                        window.location.reload();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Relaunch Onboarding
                    </button>
                    <a
                      href="https://forms.gle/dzDbLufj5SS5aka7A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-left px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Report a Bug
                    </a>
                  </div>
                </section>

                {/* COLORS SECTION */}
                <section id="colors" className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 sticky top-0 bg-white py-2">Colors</h4>
                  
                  {/* Color scheme mode selector */}
                  <div className="border-b border-gray-200 pb-6">
                    <h5 className="text-sm font-semibold text-gray-900 mb-4">Color Scheme Mode</h5>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {colorSchemeMode === 'event-type' ? 'By Event Type' : 'By Calendar'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {colorSchemeMode === 'event-type'
                            ? 'Events are colored by their type (Work, Personal, etc.)'
                            : 'Events are colored by their calendar'}
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={colorSchemeMode === 'calendar'}
                        onChange={handleSwitchColorMode}
                        leftLabel="Type"
                        rightLabel="Calendar"
                      />
                    </div>
                  </div>

                  {/* Event Type Colors */}
                  {colorSchemeMode === 'event-type' && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-4">Event Type Colors</h5>
                      <div className="space-y-3">
                        {Object.keys(CATEGORY_PASTEL_COLORS).map((type) => (
                          <ExpandableColorPicker
                            key={type}
                            label={type}
                            currentColor={eventTypeColors[type] || CATEGORY_PASTEL_COLORS[type as keyof typeof CATEGORY_PASTEL_COLORS]}
                            onColorChange={(color) => {
                              const newColors = { ...eventTypeColors, [type]: color };
                              handleColorChange(newColors, true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendar Colors */}
                  {colorSchemeMode === 'calendar' && calendars.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-4">Calendar Colors</h5>
                      <div className="space-y-3">
                        {calendars.map((calendar) => (
                          <ExpandableColorPicker
                            key={calendar.id}
                            label={calendar.name}
                            currentColor={calendarColors[calendar.id] || calendar.color || PASTEL_EVENT_COLORS[0]}
                            onColorChange={(color) => {
                              const newColors = { ...calendarColors, [calendar.id]: color };
                              handleColorChange(newColors, false);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {colorSchemeMode === 'calendar' && calendars.length === 0 && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700">No calendars available. Please add a calendar first.</p>
                    </div>
                  )}
                </section>

                {/* CALENDARS SECTION */}
                <section id="calendars" className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 sticky top-0 bg-white py-2">Calendars</h4>
                  
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-gray-900">My Calendars</h5>
                    <button
                      onClick={() => setShowAddCalendar(!showAddCalendar)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Add calendar"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {/* Add calendar form */}
                  {showAddCalendar && (
                    <div className="p-4 bg-blue-50 rounded-lg space-y-4 border border-blue-200">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Create Local Calendar
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCalendarName}
                            onChange={(e) => setNewCalendarName(e.target.value)}
                            placeholder="New calendar name"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddLocalCalendar()}
                          />
                          <button
                            onClick={handleAddLocalCalendar}
                            disabled={!newCalendarName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-blue-300"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-2 bg-blue-50 text-blue-600 font-medium uppercase tracking-wider">or</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Import from Google
                        </label>
                        <button
                          onClick={handleConnectGoogleCalendar}
                          disabled={isConnecting}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-[#4285f4] rounded-lg hover:bg-[#3367d6] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
                        </button>
                        
                        {!isGoogleCalendarConfigured && isGoogleCalendarConfigured !== null && (
                          <p className="text-[11px] text-amber-600 leading-tight">
                            Note: Integration needs configuration in .env.local
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Calendar list */}
                  <div className="space-y-3">
                    {calendars.map(calendar => (
                      <CalendarItem
                        key={calendar.id}
                        calendar={calendar}
                        onUpdate={(updates) => updateCalendar(calendar.id, updates)}
                        onDelete={() => handleDeleteCalendar(calendar.id)}
                        onSync={() => syncCalendar(calendar.id)}
                        isSyncing={syncingCalendars.includes(calendar.id)}
                      />
                    ))}
                  </div>
                </section>

                {/* Error message */}
                {saveError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{saveError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
