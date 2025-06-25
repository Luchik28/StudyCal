'use client';

import React from 'react';
import { generateTimeSlots, HOUR_HEIGHT } from '@/utils/calendar';

export function TimeSlots() {
  const timeSlots = generateTimeSlots();

  return (
    <div className="w-16 flex-shrink-0">
      {/* Header spacer */}
      <div className="h-16 border-b border-gray-200"></div>
      
      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((time, index) => (
          <div
            key={time}
            className="border-b border-gray-100 flex items-start justify-end pr-2 text-xs text-gray-500"
            style={{ height: HOUR_HEIGHT }}
          >
            {index > 0 && (
              <span className="mt-[-8px]">{time}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
