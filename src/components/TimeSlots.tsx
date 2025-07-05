'use client';

import React from 'react';
import { generateTimeSlots, HOUR_HEIGHT } from '@/utils/calendar';

export function TimeSlots() {
  const timeSlots = generateTimeSlots();

  return (
    <div className="w-16 border-r border-gray-200 sticky left-0 bg-white z-20 flex flex-col">
      {/* Header spacer - matches day column headers */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-2 text-center z-10 flex-shrink-0">
        <div className="font-semibold text-gray-900 text-xs">Time</div>
      </div>
      
      {/* Time slots */}
      <div className="relative flex-1" style={{ minHeight: `${timeSlots.length * HOUR_HEIGHT}px` }}>
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
