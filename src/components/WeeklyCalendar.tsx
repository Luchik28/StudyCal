'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Clock, PanelLeftClose, PanelRightClose, PanelLeft, PanelRight } from 'lucide-react';
import { addWeeks, subWeeks, format } from 'date-fns';
import { getWeekDays, createTimeSlot, calculateEventPosition } from '@/utils/calendar';
import { formatTimeRange } from '@/utils/timeFormat';
import { useSettings } from '@/contexts/SettingsContext';
import { useEvents } from '@/contexts/EventsContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { Event } from '@/types/events';
import { TimeSlots } from './TimeSlots';
import { DayColumn } from './DayColumn';
import { CreateEventModal } from './CreateEventModal';
import { EventEditModal } from './EventEditModal';
import { InlineEventCreator } from './InlineEventCreator';
import { InlineEventEditor } from './InlineEventEditor';
import { SettingsModal } from './SettingsModal';

export function WeeklyCalendar({ 
  onWeekChange,
  leftSidebarCollapsed,
  rightSidebarCollapsed,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}: { 
  onWeekChange?: (weekDate: Date) => void;
  leftSidebarCollapsed?: boolean;
  rightSidebarCollapsed?: boolean;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
}) {
  const { visibleEvents: allVisibleEvents, moveEvent } = useEvents();
  const { visibleCalendarIds, getCalendarById } = useCalendars();
  const { timeFormat } = useSettings();
  
  // Filter events based on visible calendars and exclude deleted markers
  const visibleEvents = useMemo(() => {
    return allVisibleEvents.filter(event => {
      // Exclude deleted marker events
      if (event.id.startsWith('deleted_')) return false;
      // If event has no calendarId, show it (backwards compatibility)
      if (!event.calendarId) return true;
      // Show if calendar is visible
      return visibleCalendarIds.includes(event.calendarId);
    });
  }, [allVisibleEvents, visibleCalendarIds]);
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date>();
  const [modalInitialHour, setModalInitialHour] = useState<number>();
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Inline event editing state
  const [inlineEditEvent, setInlineEditEvent] = useState<{
    event: Event;
    eventElement: HTMLElement | null;
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

  const handleEventClick = (event: Event, eventElement?: HTMLElement) => {
    console.log('handleEventClick called with:', { 
      event: event.title, 
      hasElement: !!eventElement,
      elementRect: eventElement ? eventElement.getBoundingClientRect() : null
    });
    
    // Use inline editor if eventElement is provided, otherwise fall back to modal
    if (eventElement) {
      console.log('Setting inline edit event');
      setInlineEditEvent({ event, eventElement });
      
      // Force a re-render to ensure the inline editor appears
      setTimeout(() => {
        console.log('InlineEditEvent state after timeout:', { event: event.title, element: !!eventElement });
      }, 100);
    } else {
      console.log('Setting modal edit event');
      setSelectedEvent(event);
      setIsEditModalOpen(true);
    }
  };

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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Unified Top Bar: Add Event, Date Range, Navigation, Settings */}
      <div className="bg-white border-b border-gray-200 h-16 px-6 py-4 flex items-center relative">
        {/* Left sidebar toggle */}
        {onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            className="hidden lg:flex p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 mr-2"
            title={leftSidebarCollapsed ? 'Show left sidebar' : 'Hide left sidebar'}
          >
            {leftSidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        )}
        
        {/* Left: Add Event Button */}
        <div className="flex items-center gap-2">
          <button
            className="px-2.5 py-1.5 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all duration-200 text-base flex items-center gap-1.5"
            onClick={() => {
              const wednesday = weekDays[3];
              setModalInitialDate(wednesday);
              setModalInitialHour(12);
              setIsModalOpen(true);
            }}
            aria-label="Add Event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
        {/* Center: Date Range & Navigation */}
        <div className="flex-1 flex justify-center items-center gap-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-gray-900 min-w-[200px] text-center">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {/* Right: Settings Button and right sidebar toggle */}
        <div className="absolute right-0 flex items-center pr-2 gap-1">
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings text-gray-600" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          {/* Right sidebar toggle */}
          {onToggleRightSidebar && (
            <button
              onClick={onToggleRightSidebar}
              className="hidden lg:flex p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 mr-4"
              title={rightSidebarCollapsed ? 'Show right sidebar' : 'Hide right sidebar'}
            >
              {rightSidebarCollapsed ? <PanelRight size={20} /> : <PanelRightClose size={20} />}
            </button>
          )}
          {typeof isSettingsOpen !== 'undefined' && (
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          )}
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
                events={visibleEvents}
                onTimeSlotClick={handleTimeSlotClick}
                onEventEdit={handleEventClick}
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
                        <span>{formatTimeRange(activeEvent.startTime, activeEvent.endTime, timeFormat)}</span>
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
          weekDays={weekDays}
        />
      )}

      {/* Inline Event Editor */}
      {inlineEditEvent && (
        <InlineEventEditor
          event={inlineEditEvent.event}
          eventElement={inlineEditEvent.eventElement}
          onCancel={() => setInlineEditEvent(null)}
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

      <EventEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </div>
  );
}
