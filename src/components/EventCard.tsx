'use client';

import React from 'react';
import { CalendarEvent } from '@/types/events';
import { formatTime } from '@/utils/calendar';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, X } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
  const { deleteEvent } = useEvents();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: event.id,
    data: {
      event,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        top: event.position.top,
        height: event.position.height,
        backgroundColor: event.color,
        position: 'absolute',
        left: '4px',
        right: '4px',
        minHeight: '40px',
      }}
      className="rounded-lg border border-white/20 text-white text-sm cursor-move shadow-sm hover:shadow-md transition-shadow"
      {...listeners}
      {...attributes}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium text-white truncate">{event.title}</div>
            <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
              <Clock size={10} />
              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEvent(event.id);
            }}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X size={12} />
          </button>
        </div>
        {event.description && event.position.height > 60 && (
          <div className="text-white/80 text-xs truncate mt-1">
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
}
