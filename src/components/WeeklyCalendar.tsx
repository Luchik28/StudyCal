'use client';

import React, { useState, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { addWeeks, subWeeks, format } from 'date-fns';
import { getWeekDays, createTimeSlot, calculateEventPosition } from '@/utils/calendar';
import { useEvents } from '@/contexts/EventsContext';
import { Event } from '@/types/events';
import { TimeSlots } from './TimeSlots';
import { DayColumn } from './DayColumn';
import { CreateEventModal } from './CreateEventModal';
import { InlineEventCreator } from './InlineEventCreator';

export function WeeklyCalendar({ onWeekChange }: { onWeekChange?: (weekDate: Date) => void }) {
  const { events, moveEvent } = useEvents();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date>();
  const [modalInitialHour, setModalInitialHour] = useState<number>();
  
  // Inline event creation state
  const [inlineEvent, setInlineEvent] = useState<{
    date: Date;
    hour: number;
    minute: number;
    dayColumnRef: HTMLElement | null;
    title: string;
    startTime: Date;
    endTime: Date;
  } | null>(null);
  
  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const weekDays = getWeekDays(currentWeek);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const eventData = active.data.current?.event as Event;
    setActiveEvent(eventData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const eventData = active.data.current?.event as Event;
    const overData = over.data.current;

    if (overData && overData.date && overData.type === 'timeSlot') {
      // Create new start time from the drop position (snapped to 15-minute intervals)
      const newStartTime = createTimeSlot(overData.date, overData.hour, overData.minute);
      
      // Move the event to the new time slot
      moveEvent(eventData.id, newStartTime);
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number, minute: number) => {
    // Find the day column ref for this date
    const dayIndex = weekDays.findIndex(day => 
      day.toDateString() === date.toDateString()
    );
    const dayColumnRef = dayColumnRefs.current[dayIndex];
    
    const startTime = new Date(date);
    startTime.setHours(hour, minute, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, minute, 0, 0);
    
    setInlineEvent({
      date,
      hour,
      minute,
      dayColumnRef,
      title: '',
      startTime,
      endTime
    });
  };

  const updateInlineEvent = useCallback((updates: Partial<{ title: string; startTime: Date; endTime: Date }>) => {
    setInlineEvent(prev => prev ? { ...prev, ...updates } : null);
  }, []); // Empty dependency array - function never changes

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    onWeekChange?.(newWeek);
  };

  // Call onWeekChange with initial week
  React.useEffect(() => {
    onWeekChange?.(currentWeek);
  }, [currentWeek, onWeekChange]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-gray-700 min-w-[200px] text-center">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div id="calendar-container" className="flex-1 grid overflow-auto" style={{ gridTemplateColumns: '64px 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
            <TimeSlots />
            {weekDays.map((day, index) => (
              <DayColumn
                key={day.toISOString()}
                ref={(el) => {
                  dayColumnRefs.current[index] = el;
                }}
                date={day}
                events={events}
                onTimeSlotClick={handleTimeSlotClick}
                inlineEvent={inlineEvent?.date.toDateString() === day.toDateString() ? {
                  startTime: inlineEvent.startTime,
                  endTime: inlineEvent.endTime,
                  title: inlineEvent.title
                } : null}
              />
            ))}
          </div>

          <DragOverlay>
            {activeEvent && (
              <div
                className="rounded-lg border border-white/20 text-white text-sm shadow-lg cursor-grabbing"
                style={{
                  backgroundColor: activeEvent.color,
                  width: '200px', // Fixed width to match day column
                  height: calculateEventPosition(activeEvent).height,
                  minHeight: '40px',
                  position: 'relative',
                }}
              >
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-white truncate">{activeEvent.title}</div>
                      <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                        <Clock size={10} />
                        <span>{format(activeEvent.startTime, 'HH:mm')} - {format(activeEvent.endTime, 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  {activeEvent.description && calculateEventPosition(activeEvent).height > 60 && (
                    <div className="text-white/80 text-xs truncate mt-1">
                      {activeEvent.description}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Inline Event Creator */}
      {inlineEvent && (
        <InlineEventCreator
          date={inlineEvent.date}
          initialHour={inlineEvent.hour}
          initialMinute={inlineEvent.minute}
          dayColumnRef={inlineEvent.dayColumnRef}
          onCancel={() => setInlineEvent(null)}
          onUpdate={updateInlineEvent}
          initialTitle={inlineEvent.title}
          initialStartTime={inlineEvent.startTime}
          initialEndTime={inlineEvent.endTime}
        />
      )}

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialDate(undefined);
          setModalInitialHour(undefined);
        }}
        initialDate={modalInitialDate}
        initialHour={modalInitialHour}
      />
    </div>
  );
}
