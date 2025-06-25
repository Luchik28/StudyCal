'use client';

import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addWeeks, subWeeks, format } from 'date-fns';
import { getWeekDays, createTimeSlot } from '@/utils/calendar';
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

    if (overData && overData.date) {
      // Calculate the hour based on the drop position
      // For now, we'll place the event at a default time (current hour)
      const currentHour = new Date().getHours();
      const newStartTime = createTimeSlot(overData.date, currentHour);
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
          <TimeSlots />
          
          <div className="flex-1 flex overflow-x-auto">
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
                className="rounded-lg text-white text-sm shadow-lg"
                style={{
                  backgroundColor: activeEvent.color,
                  width: '200px',
                  height: '60px',
                  padding: '8px',
                }}
              >
                <div className="font-medium truncate">{activeEvent.title}</div>
                <div className="text-xs opacity-80 mt-1">
                  {format(activeEvent.startTime, 'HH:mm')} - {format(activeEvent.endTime, 'HH:mm')}
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
