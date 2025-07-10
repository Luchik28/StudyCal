'use client';

import React, { useState, useRef } from 'react';
import { PositionedEvent, Event } from '@/types/events';
import { HOUR_HEIGHT } from '@/utils/calendar';
import { formatTimeRange } from '@/utils/timeFormat';
import { useSettings } from '@/contexts/SettingsContext';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { EventPopupMenu } from './EventPopupMenu';

interface EventCardProps {
  event: PositionedEvent;
  onEventEdit?: (event: Event) => void;
}

export function EventCard({ event, onEventEdit }: EventCardProps) {
  const { resizeEvent, deleteEvent } = useEvents();
  const { timeFormat } = useSettings();
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [showPopupMenu, setShowPopupMenu] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isDragDisabled, setIsDragDisabled] = useState(true); // Start with drag disabled
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragStarted = useRef(false);
  const dragTimer = useRef<NodeJS.Timeout | null>(null);
  
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
    disabled: isResizing !== null || isDragDisabled, // Disable dragging when resizing or when not holding
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1, // Completely hide original during drag
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;
    
    // Prevent text selection
    e.preventDefault();
    
    // Store the initial mouse position
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDragStarted.current = false;
    
    // Set a timer to enable dragging after 300ms
    dragTimer.current = setTimeout(() => {
      if (!isDragStarted.current) {
        isDragStarted.current = true;
        setIsDragDisabled(false);
        
        // Clean up the mouse listeners since we're now dragging
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    }, 300);
    
    // Add global mouse move listener to detect drag threshold
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current) return;
      
      // Don't check distance if we've already started dragging via timer
      if (isDragStarted.current) return;
      
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // If moved more than 5 pixels, start dragging
      if (distance > 5) {
        isDragStarted.current = true;
        setIsDragDisabled(false);
        
        // Clear the timer since we're starting drag via distance
        if (dragTimer.current) {
          clearTimeout(dragTimer.current);
          dragTimer.current = null;
        }
        
        // Remove the move listener since we've started dragging
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
    
    const handleMouseUp = () => {
      // Clean up listeners and timer
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Clear the timer
      if (dragTimer.current) {
        clearTimeout(dragTimer.current);
        dragTimer.current = null;
      }
      
      // If we didn't start dragging, it's a click
      if (!isDragStarted.current) {
        handleClick(e);
      }
      
      // Reset drag state
      dragStartPos.current = null;
      isDragStarted.current = false;
      setIsDragDisabled(true);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isResizing || isDragStarted.current) {
      return;
    }
    
    e.stopPropagation();
    
    // Calculate position relative to the event container
    if (containerRef.current) {
      const eventRect = containerRef.current.getBoundingClientRect();
      // Position popup to the right of the event
      const x = eventRect.right + 10; // 10px margin from right edge
      const y = eventRect.top;
      setPopupPosition({ x, y });
      setShowPopupMenu(true);
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

  const handleClosePopup = () => {
    setShowPopupMenu(false);
  };

  const handleEditEvent = (event: Event) => {
    if (onEventEdit) {
      onEventEdit(event);
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      // Close popup immediately to provide instant feedback
      setShowPopupMenu(false);
      
      // Delete the event (this will trigger optimistic update)
      await deleteEvent(event.id);
      
    } catch (error) {
      console.error('Failed to delete event in EventCard:', error);
      alert('Failed to delete event. Please try again.');
      // Don't reopen popup on error - let user click again if needed
    }
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
        left: `${event.position.left}%`,
        width: `${event.position.width}%`,
        backgroundColor: event.color,
        position: 'absolute',
        minHeight: '15px',
        zIndex: event.position.zIndex,
      }}
      className="rounded-lg border border-white/20 text-white text-sm shadow-sm hover:shadow-md transition-all duration-200 group hover:scale-[1.02] overflow-hidden"
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
        className={`p-2 h-full flex flex-col overflow-hidden select-none ${
          isResizing ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        {...(isResizing || isDragDisabled ? {} : listeners)}
        {...(isResizing || isDragDisabled ? {} : attributes)}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Smart content layout based on available space */}
        {(() => {
          const height = event.position.height;
          const timeString = formatTimeRange(event.startTime, event.endTime, timeFormat);
          
          // Tiny events (< 25px, ~15 mins): Only title in tiny font
          if (height < 25) {
            return (
              <div className="flex-1 overflow-hidden">
                <div className="font-medium text-white text-xs truncate leading-tight">
                  {event.title}
                </div>
              </div>
            );
          }
          
          // Very small events (25-50px): Only title with time
          if (height < 50) {
            return (
              <div className="flex-1 overflow-hidden">
                <div className="font-medium text-white text-xs truncate">
                  {event.title} • {timeString}
                </div>
              </div>
            );
          }
          
          // Small events (50-70px): Title, time, maybe category
          if (height < 70) {
            return (
              <div className="flex-1 overflow-hidden">
                <div className="font-medium text-white text-sm truncate">
                  {event.title}
                </div>
                <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                  <Clock size={10} />
                  <span className="truncate">{timeString}</span>
                </div>
                {event.category && (
                  <div className="text-white/90 text-xs mt-1 truncate font-medium">
                    {event.category}
                  </div>
                )}
              </div>
            );
          }
          
          // Medium events (70-90px): Title, time, category, maybe subcategory
          if (height < 90) {
            return (
              <div className="flex-1 overflow-hidden">
                <div className="font-medium text-white text-sm truncate">
                  {event.title}
                </div>
                <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                  <Clock size={10} />
                  <span className="truncate">{timeString}</span>
                </div>
                {event.category && (
                  <div className="text-white/90 text-xs mt-1">
                    <div className="font-medium truncate">{event.category}</div>
                    {event.subcategory && (
                      <div className="text-white/70 text-xs truncate">{event.subcategory}</div>
                    )}
                  </div>
                )}
              </div>
            );
          }
          
          // Large events (90px+): Everything including description
          return (
            <div className="flex-1 overflow-hidden">
              <div className="font-medium text-white text-sm truncate">
                {event.title}
              </div>
              <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                <Clock size={10} />
                <span className="truncate">{timeString}</span>
              </div>
              {event.category && (
                <div className="text-white/90 text-xs mt-1">
                  <div className="font-medium truncate">{event.category}</div>
                  {event.subcategory && (
                    <div className="text-white/70 text-xs truncate">{event.subcategory}</div>
                  )}
                </div>
              )}
              {event.description && (
                <div className="text-white/80 text-xs mt-1 truncate">
                  {event.description}
                </div>
              )}
            </div>
          );
        })()}
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

      {/* Popup menu */}
      <EventPopupMenu
        event={event}
        isOpen={showPopupMenu}
        position={popupPosition}
        onClose={handleClosePopup}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
