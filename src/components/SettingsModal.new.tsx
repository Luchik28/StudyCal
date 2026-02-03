'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { useEvents } from '@/contexts/EventsContext';
import { googleCalendarSyncService } from '@/utils/googleCalendarSync';
import { Calendar as CalendarType } from '@/types/events';
import { PASTEL_EVENT_COLORS } from '@/utils/colorSchemes';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { ColorPicker } from '@/components/ColorPicker';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Calendar colors for selection
const CALENDAR_COLORS = [
  '#FFB3B3', // Pastel Red
  '#B3D9FF', // Pastel Blue
  '#B3FFB3', // Pastel Green
  '#FFFFB3', // Pastel Yellow
  '#DDB3FF', // Pastel Purple
  '#FFB3DD', // Pastel Pink
  '#B3FFFF', // Pastel Cyan
  '#FFFFD9', // Pastel Cream
];

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
  const [showColorPicker, setShowColorPicker] = useState(false);

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
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: calendar.color }}
            />
            {showColorPicker && (
              <div className="absolute top-6 left-0 z-10 bg-white rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1">
                {CALENDAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      onUpdate({ color });
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
          
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
              {isSyncing ? 'Syncing...' : 'Sync Now'}
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
            <span className="text-xs text-gray-600">Enable auto-sync</span>
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
    saveSettings 
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
  
  const [activeTab, setActiveTab] = useState<'general' | 'colors' | 'calendars'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGoogleCalendarConfigured, setIsGoogleCalendarConfigured] = useState<boolean | null>(null);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [showAddCalendar, setShowAddCalendar] = useState(false);
  
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
    <div className={`fixed inset-0 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ zIndex: 60 }}>
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Background overlay */}
        <div 
          className={`fixed inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(1px)' }}
          onClick={onClose}
        />
        
        {/* Modal content - Much larger */}
        <div className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-4xl h-[90vh] flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <h3 className="text-xl font-semibold text-gray-900">
              Settings
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Content - Two columns: sidebar + main */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar - Navigation tabs */}
            <div className="w-40 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
              {(['general', 'colors', 'calendars'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium transition-colors text-left ${ 
                    activeTab === tab 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'general' && 'General'}
                  {tab === 'colors' && 'Colors'}
                  {tab === 'calendars' && 'Calendars'}
                </button>
              ))}
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* General Tab */}
                {activeTab === 'general' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h4>
                    
                    <div className="space-y-6">
                      {/* Time Format Setting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Time Format
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="timeFormat"
                              value="12h"
                              checked={timeFormat === '12h'}
                              onChange={(e) => setTimeFormat(e.target.value as '12h' | '24h')}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-3 text-sm text-gray-700">12 Hour (1:00 PM)</span>
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
                            <span className="ml-3 text-sm text-gray-700">24 Hour (13:00)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Colors Tab */}
                {activeTab === 'colors' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-6">Color Settings</h4>
                    
                    <div className="space-y-6">
                      {/* Color Mode Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Color Coding Mode
                        </label>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-medium ${colorSchemeMode === 'event-type' ? 'text-gray-900' : 'text-gray-600'}`}>
                            By Event Type
                          </span>
                          <ToggleSwitch
                            checked={colorSchemeMode === 'calendar'}
                            onChange={(checked) => switchColorSchemeMode(checked ? 'calendar' : 'event-type')}
                          />
                          <span className={`text-sm font-medium ${colorSchemeMode === 'calendar' ? 'text-gray-900' : 'text-gray-600'}`}>
                            By Calendar
                          </span>
                        </div>
                      </div>

                      {/* Event Type Colors */}
                      {colorSchemeMode === 'event-type' && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Event Type Colors</h5>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {['Work', 'Personal', 'Social', 'Health', 'Education', 'Travel', 'Other'].map((type) => (
                              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <span className="text-sm font-medium text-gray-700">{type}</span>
                                <ColorPicker
                                  color={eventTypeColors[type] || '#FFB3B3'}
                                  onColorChange={(color) => setEventTypeColors({ ...eventTypeColors, [type]: color })}
                                  presetColors={PASTEL_EVENT_COLORS}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Calendar Colors */}
                      {colorSchemeMode === 'calendar' && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Calendar Colors</h5>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {calendars.map((calendar) => (
                              <div key={calendar.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <span className="text-sm font-medium text-gray-700">{calendar.name}</span>
                                <ColorPicker
                                  color={calendarColors[calendar.id] || calendar.color}
                                  onColorChange={(color) => setCalendarColors({ ...calendarColors, [calendar.id]: color })}
                                  presetColors={PASTEL_EVENT_COLORS}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Calendars Tab */}
                {activeTab === 'calendars' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-6">My Calendars</h4>
                    
                    <div className="space-y-4">
                      {/* Add calendar button */}
                      <button
                        onClick={() => setShowAddCalendar(!showAddCalendar)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Plus size={18} />
                        Add Calendar
                      </button>

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
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddLocalCalendar()}
                              />
                              <button
                                onClick={handleAddLocalCalendar}
                                disabled={!newCalendarName.trim()}
                                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                          
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-blue-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="px-2 bg-blue-50 text-blue-500 font-medium uppercase tracking-wider">or</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Import from Google
                            </label>
                            <button
                              onClick={handleConnectGoogleCalendar}
                              disabled={isConnecting}
                              className="w-full px-3 py-2 text-sm font-medium text-white bg-[#4285f4] rounded-md hover:bg-[#3367d6] disabled:opacity-50 flex items-center justify-center gap-2"
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
                              <p className="text-[10px] text-amber-600 mt-1 leading-tight">
                                Note: Integration needs configuration in .env.local
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Calendar list */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
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
                    </div>
                  </div>
                )}

                {/* Error message */}
                {saveError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{saveError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex flex-col gap-3 p-6 border-t border-gray-200 bg-gray-50 shrink-0">
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => {
                  localStorage.removeItem('onboardingComplete');
                  window.location.reload();
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200 transition-colors"
              >
                Relaunch Onboarding
              </button>
              <a
                href="https://forms.gle/dzDbLufj5SS5aka7A"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded hover:bg-red-200 transition-colors"
              >
                Report a Bug
              </a>
            </div>
            <div className="flex justify-end gap-3">
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
    </div>
  );
}
