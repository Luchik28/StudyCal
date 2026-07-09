'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PASTEL_EVENT_COLORS } from '@/utils/colorSchemes';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

export function ColorPicker({ label, color, onChange, presetColors = PASTEL_EVENT_COLORS }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          {/* Preset Colors */}
          <div className="grid grid-cols-4 gap-2">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => {
                  onChange(presetColor);
                  setIsOpen(false);
                  setUseCustom(false);
                }}
                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                  color === presetColor ? 'border-gray-900 ring-2 ring-offset-1 ring-blue-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Custom Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  onChange(e.target.value);
                  setUseCustom(true);
                }}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={color.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.match(/^#[0-9A-F]{6}$/i)) {
                    onChange(val);
                    setUseCustom(true);
                  }
                }}
                placeholder="#000000"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
