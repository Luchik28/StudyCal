'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { timeFormat, setTimeFormat, saveSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal content */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
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
