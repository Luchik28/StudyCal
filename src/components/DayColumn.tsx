'use client';

import React, { forwardRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Clock } from 'lucide-react';
import { formatDay, getEventsForDay, generateTimeSlots, HOUR_HEIGHT } from '@/utils/calendar';
import { Event } from '@/types/events';
import { EventCard } from './EventCard';

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
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
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
      onClick={() => onTimeSlotClick(date, hour, minute)}
    />
  );
}

interface DayColumnProps {
  date: Date;
  events: Event[];
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
  inlineEvent?: {
    startTime: Date;
    endTime: Date;
    title: string;
  } | null;
}

export const DayColumn = forwardRef<HTMLDivElement, DayColumnProps>(
  ({ date, events, onTimeSlotClick, inlineEvent }, ref) => {
    const dayEvents = getEventsForDay(events, date);
    const timeSlots = generateTimeSlots();

    // Check if inline event should be shown for this day
    const showInlineEvent = inlineEvent && 
      inlineEvent.startTime.toDateString() === date.toDateString();

    return (
      <div ref={ref} className="flex-1 min-w-0 border-r border-gray-200 last:border-r-0">
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
        
        {/* Inline Event Preview */}
        {showInlineEvent && (
          <div
            className="absolute left-1 right-1 bg-blue-500/40 border-2 border-blue-500 rounded-md z-20"
            style={{
              top: (inlineEvent.startTime.getHours() + inlineEvent.startTime.getMinutes() / 60) * HOUR_HEIGHT,
              height: Math.max(
                ((inlineEvent.endTime.getTime() - inlineEvent.startTime.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT,
                HOUR_HEIGHT / 4
              ),
            }}
          >
            <div className="p-2 text-white text-sm">
              <div className="font-medium truncate">
                {inlineEvent.title || 'New Event'}
              </div>
              <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                <Clock size={10} />
                <span>
                  {inlineEvent.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {inlineEvent.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DayColumn.displayName = 'DayColumn';
