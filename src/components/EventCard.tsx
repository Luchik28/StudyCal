'use client';

import React, { useState, useRef } from 'react';
import { PositionedEvent, Event } from '@/types/events';
import { HOUR_HEIGHT } from '@/utils/calendar';
import { formatTimeRangeCompact } from '@/utils/timeFormat';
import { isRTLText } from '@/utils/rtl';
import { useSettings } from '@/contexts/SettingsContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { pastelToVibrant, darkenColor, lightenColor, getColorBrightness } from '@/utils/colorSchemes';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Repeat } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';

interface EventCardProps {
  event: PositionedEvent;
  onEventEdit?: (event: Event, eventElement?: HTMLElement) => void;
  isEditing?: boolean;
}

export function EventCard({ event, onEventEdit, isEditing = false }: EventCardProps) {
  const { resizeEvent } = useEvents();
  const { timeFormat, colorSchemeMode, eventTypeColors, calendarColors } = useSettings();
  const { getCalendarById } = useCalendars();
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
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
    disabled: isResizing !== null, // Only disable when resizing
  });

  // Determine event color based on color scheme mode
  const getEventColor = (useVibrant: boolean = false) => {
    let baseColor: string;
    
    if (colorSchemeMode === 'event-type') {
      const category = event.category || 'Other';
      baseColor = eventTypeColors[category] || '#FFB3B3';
    } else {
      // Color by calendar
      const calendar = event.calendarId ? getCalendarById(event.calendarId) : null;
      if (!calendar) {
        baseColor = event.color;
      } else {
        baseColor = calendarColors[calendar.id] || calendar.color;
      }
    }
    
    // Convert to vibrant if hovering/selected
    return useVibrant ? pastelToVibrant(baseColor) : baseColor;
  };

  // Check if event is in a selected state (hovered, dragging, or being edited)
  const isSelected = isHovered || isDragging || isEditing;
  const eventColor = getEventColor(isSelected);
  
  // For unselected text color, check if vibrant color is dark or light
  const textColor = isSelected ? 'white' : (() => {
    const vibrantColor = pastelToVibrant(getEventColor(false));
    const brightness = getColorBrightness(vibrantColor);
    // If very dark color (brightness < 0.3), lighten it a lot; if very light (> 0.7), darken it a lot; else use vibrantColor
    if (brightness < 0.3) return lightenColor(vibrantColor, 0.95);
    if (brightness > 0.7) return darkenColor(vibrantColor, 0.95);
    return vibrantColor;
  })();

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1, // Completely hide original during drag
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isResizing) {
      return;
    }
    
    e.preventDefault(); // Prevent the browser's default context menu
    e.stopPropagation();
    
    // Trigger inline editing with the event element on right-click
    if (onEventEdit && containerRef.current) {
      console.log('Event right-clicked, calling onEventEdit with element:', containerRef.current);
      onEventEdit(event, containerRef.current);
    }
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
        // Resizing start time - ensure it doesn't go past end time (minimum 15 minutes)
        const maxStartTime = new Date(event.endTime.getTime() - 15 * 60 * 1000);
        if (clampedTime > maxStartTime) clampedTime = maxStartTime;
        resizeEvent(event.id, clampedTime, undefined);
      } else {
        // Resizing end time - ensure it doesn't go before start time (minimum 15 minutes)
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

  const eventDurationMinutes = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
  const showResizeHandles = eventDurationMinutes > 15;
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (containerRef.current !== node) {
          containerRef.current = node;
        }
      }}
      className={`text-sm overflow-hidden ${((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60)) <= 15 ? '' : 'rounded-lg border border-white/20 shadow-sm hover:shadow-md transition-all duration-200 group hover:scale-[1.02]'}`}
      style={{
        ...style,
        top: event.position.top,
        height: event.position.height,
        left: `${event.position.left}%`,
        width: `${event.position.width}%`,
        backgroundColor: eventColor,
        color: textColor,
        position: 'absolute',
        minHeight: '15px',
        zIndex: event.position.zIndex,
        ...( ((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60)) <= 15 ? {
          padding: 0,
          margin: 0,
          borderRadius: 0,
        } : {} ),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top resize handle */}
      {showResizeHandles && (
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
      )}
      {/* Event content */}
      <div
        className={`p-2 h-full flex flex-col overflow-hidden select-none event-background ${
          isResizing ? 'cursor-default' : 
          isDragging ? 'cursor-grabbing' : 
          'cursor-grab'
        }`}
        {...(isResizing ? {} : listeners)}
        {...(isResizing ? {} : attributes)}
        onContextMenu={handleContextMenu}
      >
        {/* Smart content layout based on available space */}
        {(() => {
          const height = event.position.height;
          const durationMinutes = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
          const isTitleRTL = isRTLText(event.title);
          const titleDirection = isTitleRTL ? 'rtl' : 'ltr';
          const titleAlignmentClass = isTitleRTL ? 'text-right' : 'text-left';
          // For events 15 min or less, render only the event title, no wrappers or extra styles
          if (durationMinutes <= 15) {
            // Short event: left-aligned title, time on right, no dragging
            return (
              <div className="flex items-center justify-between w-full h-full rounded" style={{padding: '0 4px', borderRadius: '30px'}}>
                <span className={`font-medium text-xs truncate leading-tight ${titleAlignmentClass}`} dir={titleDirection}>
                  {event.title}
                </span>
                <span className="opacity-80 text-xs ml-2 whitespace-nowrap">
                  {formatTimeRangeCompact(event.startTime, event.endTime, timeFormat)}
                </span>
              </div>
            );
          }
          // Very small events (25-50px): Only title with time
          if (height < 50) {
            return (
              <div className="flex-1 overflow-hidden">
                <div 
                  className={`font-medium text-xs truncate rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors ${titleAlignmentClass}`}
                  dir={titleDirection}
                >
                  {event.title} {formatTimeRangeCompact(event.startTime, event.endTime, timeFormat)}
                </div>
              </div>
            );
          }
          // Small events (50-70px): Title, time, maybe category
          if (height < 70) {
            const isRecurring = event.recurrenceRule || event.recurringEventId;
            return (
              <div className="flex-1 overflow-hidden">
                <div 
                  className="font-medium text-sm truncate rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors flex items-center gap-1"
                >
                  {isRecurring && <Repeat size={10} className="flex-shrink-0 opacity-80" />}
                  <span className={`truncate ${titleAlignmentClass}`} dir={titleDirection}>{event.title}</span>
                </div>
                <div className="text-xs mt-1 opacity-80 truncate">
                  {formatTimeRangeCompact(event.startTime, event.endTime, timeFormat)}
                </div>
                {event.category && (
                  <div className="opacity-90 text-xs mt-1 truncate font-medium">
                    {event.category}
                  </div>
                )}
              </div>
            );
          }
          // Medium events (70-90px): Title, time, category, maybe subcategory
          if (height < 90) {
            const isRecurring = event.recurrenceRule || event.recurringEventId;
            return (
              <div className="flex-1 overflow-hidden">
                <div 
                  className="font-medium text-sm truncate rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors flex items-center gap-1"
                >
                  {isRecurring && <Repeat size={10} className="flex-shrink-0 opacity-80" />}
                  <span className={`truncate ${titleAlignmentClass}`} dir={titleDirection}>{event.title}</span>
                </div>
                <div className="text-xs mt-1 opacity-80 truncate">
                  {formatTimeRangeCompact(event.startTime, event.endTime, timeFormat)}
                </div>
                {event.category && (
                  <div className="opacity-90 text-xs mt-1">
                    <div className="font-medium truncate">{event.category}</div>
                    {event.subcategory && (
                      <div className="opacity-70 text-xs truncate">{event.subcategory}</div>
                    )}
                  </div>
                )}
              </div>
            );
          }
          // Large events (90px+): Everything including description
          const isRecurring = event.recurrenceRule || event.recurringEventId;
          return (
            <div className="flex-1 overflow-hidden">
              <div 
                className="font-medium text-sm truncate rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors flex items-center gap-1"
              >
                {isRecurring && <Repeat size={10} className="flex-shrink-0 opacity-80" />}
                <span className={`truncate ${titleAlignmentClass}`} dir={titleDirection}>{event.title}</span>
              </div>
              <div className="text-xs mt-1 opacity-80 truncate">
                {formatTimeRangeCompact(event.startTime, event.endTime, timeFormat)}
              </div>
              {event.category && (
                <div className="opacity-90 text-xs mt-1">
                  <div className="font-medium truncate">{event.category}</div>
                  {event.subcategory && (
                    <div className="opacity-70 text-xs truncate">{event.subcategory}</div>
                  )}
                </div>
              )}
              {event.description && (
                <div className="opacity-80 text-xs mt-1 truncate">
                  {event.description}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      {/* Bottom resize handle */}
      {showResizeHandles && (
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
      )}
    </div>
  );
}
