'use client';

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
}

export function ToggleSwitch({ checked, onChange, leftLabel, rightLabel }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      {leftLabel && <span className={`text-sm ${!checked ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{leftLabel}</span>}
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      {rightLabel && <span className={`text-sm ${checked ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{rightLabel}</span>}
    </div>
  );
}
