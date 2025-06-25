'use client';

import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { addWeeks, subWeeks, format } from 'date-fns';
import { getWeekDays, createTimeSlot, calculateEventPosition } from '@/utils/calendar';
import { useEvents } from '@/contexts/EventsContext';
import { Event } from '@/types/events';
import { TimeSlots } from './TimeSlots';
import { DayColumn } from './DayColumn';
import { CreateEventModal } from './CreateEventModal';

export function WeeklyCalendar() {
  const { events, moveEvent } = useEvents();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date>();
  const [modalInitialHour, setModalInitialHour] = useState<number>();

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

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setModalInitialDate(date);
    setModalInitialHour(hour);
    setIsModalOpen(true);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Week Planner</h1>
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
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 flex overflow-auto">
            <TimeSlots />
            {weekDays.map((day) => (
              <DayColumn
                key={day.toISOString()}
                date={day}
                events={events}
                onTimeSlotClick={handleTimeSlotClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeEvent && (
              <div
                className="rounded-lg border border-white/20 text-white text-sm shadow-lg"
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
