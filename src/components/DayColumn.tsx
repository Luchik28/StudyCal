'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { formatDay, getEventsForDay, generateTimeSlots, HOUR_HEIGHT } from '@/utils/calendar';
import { Event } from '@/types/events';
import { EventCard } from './EventCard';

interface DayColumnProps {
  date: Date;
  events: Event[];
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export function DayColumn({ date, events, onTimeSlotClick }: DayColumnProps) {
  const dayEvents = getEventsForDay(events, date);
  const timeSlots = generateTimeSlots();
  
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: {
      date,
    },
  });

  return (
    <div className="flex-1 min-w-0">
      {/* Day Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-3 text-center z-10">
        <div className="font-semibold text-gray-900">{formatDay(date)}</div>
      </div>
      
      {/* Time Slots */}
      <div 
        ref={setNodeRef}
        className={`relative ${isOver ? 'bg-blue-50' : ''}`}
        style={{ height: `${timeSlots.length * HOUR_HEIGHT}px` }}
      >
        {timeSlots.map((_, hourIndex) => (
          <div
            key={hourIndex}
            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            style={{ height: HOUR_HEIGHT }}
            onClick={() => onTimeSlotClick(date, hourIndex)}
          />
        ))}
        
        {/* Events */}
        {dayEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
