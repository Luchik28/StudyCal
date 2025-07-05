'use client';

import React, { useState, useRef } from 'react';
import { CalendarEvent } from '@/types/events';
import { formatTime, HOUR_HEIGHT } from '@/utils/calendar';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, X } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
  const { deleteEvent, resizeEvent } = useEvents();
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    disabled: isResizing !== null, // Disable dragging when resizing
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1, // Completely hide original during drag
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(direction);
    // Get the calendar container for position calculations
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;
    
    // Add global cursor style
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!calendarContainer) return;
      
      // Recalculate container rect in case the window was scrolled
      const currentContainerRect = calendarContainer.getBoundingClientRect();
      
      // Calculate the mouse position relative to the calendar container
      const scrollTop = calendarContainer.scrollTop;
      const mouseY = moveEvent.clientY - currentContainerRect.top + scrollTop;
      
      // Account for the header height (sticky header is about 64px)
      const adjustedMouseY = mouseY - 64;
      
      // Convert mouse position to time using HOUR_HEIGHT constant
      const hourDecimal = adjustedMouseY / HOUR_HEIGHT;
      const totalMinutes = Math.max(0, hourDecimal * 60);
      
      // Snap to 15-minute intervals
      const snappedMinutes = Math.round(totalMinutes / 15) * 15;
      const hours = Math.floor(snappedMinutes / 60);
      const minutes = snappedMinutes % 60;
      
      // Create the new time based on the event's date
      const eventDate = direction === 'top' ? event.startTime : event.endTime;
      const newTime = new Date(eventDate);
      newTime.setHours(Math.max(0, Math.min(23, hours)));
      newTime.setMinutes(Math.max(0, Math.min(59, minutes)));
      newTime.setSeconds(0);
      newTime.setMilliseconds(0);
      
      // Clamp to day boundaries
      const dayStart = new Date(eventDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(eventDate);
      dayEnd.setHours(23, 45, 0, 0);
      
      let clampedTime = new Date(newTime);
      if (clampedTime < dayStart) clampedTime = new Date(dayStart);
      if (clampedTime > dayEnd) clampedTime = new Date(dayEnd);
      
      if (direction === 'top') {
        // Resizing start time - ensure it doesn't go past end time
        const maxStartTime = new Date(event.endTime.getTime() - 15 * 60 * 1000);
        if (clampedTime > maxStartTime) clampedTime = maxStartTime;
        resizeEvent(event.id, clampedTime, undefined);
      } else {
        // Resizing end time - ensure it doesn't go before start time
        const minEndTime = new Date(event.startTime.getTime() + 15 * 60 * 1000);
        if (clampedTime < minEndTime) clampedTime = minEndTime;
        resizeEvent(event.id, undefined, clampedTime);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(null);
      
      // Reset global cursor style
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (containerRef.current !== node) {
          containerRef.current = node;
        }
      }}
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
      className="rounded-lg border border-white/20 text-white text-sm shadow-sm hover:shadow-md transition-all duration-200 group hover:scale-[1.02]"
    >
      {/* Top resize handle */}
      <div
        className={`absolute top-0 left-0 right-0 h-2 cursor-ns-resize transition-opacity z-10 flex items-center justify-center ${
          isResizing === 'top' 
            ? 'opacity-100 bg-blue-500/40' 
            : 'opacity-0 group-hover:opacity-100 hover:!opacity-100'
        }`}
        style={{ 
          backgroundColor: isResizing === 'top' ? undefined : 'rgba(255,255,255,0.3)' 
        }}
        onMouseDown={(e) => handleResizeStart(e, 'top')}
      >
        <div className={`w-8 h-0.5 rounded ${
          isResizing === 'top' ? 'bg-blue-200' : 'bg-white/60'
        }`} />
      </div>
      
      {/* Event content */}
      <div
        className={`p-2 h-full flex flex-col justify-between ${
          isResizing ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        {...(isResizing ? {} : listeners)}
        {...(isResizing ? {} : attributes)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium text-white truncate">
              {event.title}
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
              <Clock size={10} />
              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
            </div>
            {/* Always show classification if available */}
            {event.category && (
              <div className="text-white/90 text-xs mt-1">
                <div className="font-medium">{event.category}</div>
                {event.subcategory && (
                  <div className="text-white/70 text-xs">{event.subcategory}</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEvent(event.id);
            }}
            className="text-white/70 hover:text-white transition-colors p-1 z-10 relative"
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
      
      {/* Bottom resize handle */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize transition-opacity z-10 flex items-center justify-center ${
          isResizing === 'bottom' 
            ? 'opacity-100 bg-blue-500/40' 
            : 'opacity-0 group-hover:opacity-100 hover:!opacity-100'
        }`}
        style={{ 
          backgroundColor: isResizing === 'bottom' ? undefined : 'rgba(255,255,255,0.3)' 
        }}
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
      >
        <div className={`w-8 h-0.5 rounded ${
          isResizing === 'bottom' ? 'bg-blue-200' : 'bg-white/60'
        }`} />
      </div>
    </div>
  );
}
