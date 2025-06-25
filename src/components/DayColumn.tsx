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

// Individual time slot component with its own drop zone
function TimeSlotDropZone({ 
  date, 
  hour, 
  minute = 0, 
  onTimeSlotClick 
}: { 
  date: Date; 
  hour: number; 
  minute?: number; 
  onTimeSlotClick: (date: Date, hour: number) => void;
}) {
  const slotId = `slot-${date.toISOString()}-${hour}-${minute}`;
  
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: {
      date,
      hour,
      minute,
      type: 'timeSlot'
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-x-0 cursor-pointer transition-all duration-150 ${
        isOver 
          ? 'bg-blue-100 border-2 border-blue-400 z-10' 
          : 'hover:bg-gray-50'
      }`}
      style={{ 
        top: (hour + minute / 60) * HOUR_HEIGHT,
        height: HOUR_HEIGHT / 4 // 15-minute slots
      }}
      onClick={() => onTimeSlotClick(date, hour)}
    />
  );
}

interface DayColumnProps {
  date: Date;
  events: Event[];
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export function DayColumn({ date, events, onTimeSlotClick }: DayColumnProps) {
  const dayEvents = getEventsForDay(events, date);
  const timeSlots = generateTimeSlots();

  return (
    <div className="flex-1 min-w-0 border-r border-gray-200 last:border-r-0">
      {/* Day Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-3 text-center z-10">
        <div className="font-semibold text-gray-900">{formatDay(date)}</div>
      </div>
      
      {/* Time Slots */}
      <div 
        className="relative"
        style={{ height: `${timeSlots.length * HOUR_HEIGHT}px` }}
      >
        {/* Hour time slots for visual grid */}
        {timeSlots.map((_, hourIndex) => (
          <div
            key={`hour-${hourIndex}`}
            className="border-b border-gray-100"
            style={{ 
              position: 'absolute',
              top: hourIndex * HOUR_HEIGHT,
              left: 0,
              right: 0,
              height: HOUR_HEIGHT 
            }}
          />
        ))}

        {/* 15-minute drop zones */}
        {Array.from({ length: 24 * 4 }, (_, index) => {
          const hour = Math.floor(index / 4);
          const minute = (index % 4) * 15;
          
          return (
            <TimeSlotDropZone
              key={`slot-${hour}-${minute}`}
              date={date}
              hour={hour}
              minute={minute}
              onTimeSlotClick={onTimeSlotClick}
            />
          );
        })}
        
        {/* Events */}
        {dayEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
