'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { useEvents } from '@/contexts/EventsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { formatTime, formatTimeRange } from '@/utils/timeFormat';
import { Event } from '@/types/events';
import { CreateEventModal } from './CreateEventModal';
import { EventEditModal } from './EventEditModal';
import { InlineEventEditor } from './InlineEventEditor';
import { analytics } from 'googleapis/build/src/apis/analytics';

// Create a single static month component
const StaticMonthCard = React.memo(({ monthDate, events, onDayClick, onEventEdit, timeFormat }: {
  monthDate: Date;
  events: Event[];
  onDayClick: (date: Date) => void;
  onEventEdit?: (event: Event, eventElement?: HTMLElement) => void;
  timeFormat: '12h' | '24h';
}) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = useCallback((date: Date): Event[] => {
    return events.filter(event => {
      const eventDate = event.startTime.toDateString();
      const dayDate = date.toDateString();
      return eventDate === dayDate;
    });
  }, [events]);

  return (
    <div className="mb-6" data-month={format(monthDate, 'yyyy-MM')}>
      {/* Month header */}
      <div className="mb-3 text-center sticky top-0 bg-gray-50 py-2 z-10">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(monthDate, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Month grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7" style={{ gridTemplateRows: 'repeat(6, minmax(120px, 1fr))' }}>
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50/50' : ''
                }`}
                onClick={() => onDayClick(day)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isCurrentDay
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: event.color,
                        color: 'white',
                      }}
                      title={`${event.title} - ${formatTimeRange(event.startTime, event.endTime, timeFormat)}${event.category ? ` (${event.category}${event.subcategory ? ` - ${event.subcategory}` : ''})` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventEdit?.(event);
                      }}
                    >
                      <div className="truncate">{formatTime(event.startTime, timeFormat)} {event.title}</div>
                      {event.category && (
                        <div className="text-xs opacity-75 truncate">
                          {event.category}{event.subcategory && ` - ${event.subcategory}`}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-700 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

StaticMonthCard.displayName = 'StaticMonthCard';

export function MonthlyCalendar({ onDaySelected, onMonthChange }: { 
  onDaySelected?: (date: Date) => void; 
  onMonthChange?: (monthDate: Date) => void;
}) {
  const { events } = useEvents();
  const { timeFormat } = useSettings();
  const [headerMonth, setHeaderMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date>();

  // Inline event editing state  
  const [inlineEditEvent, setInlineEditEvent] = useState<{
    event: Event;
    eventElement: HTMLElement | null;
  } | null>(null);
  
  // Track which months are currently loaded
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const isNavigatingRef = useRef(false);
  
  // Initialize with current month and surrounding months
  useEffect(() => {
    const today = new Date();
    const monthsToLoad = new Set<string>();
    
    // Load 6 months before and after current month for faster scrolling
    for (let i = -6; i <= 6; i++) {
      const month = addMonths(today, i);
      monthsToLoad.add(format(month, 'yyyy-MM'));
    }
    
    setLoadedMonths(monthsToLoad);
    setHeaderMonth(today);
    onMonthChange?.(addMonths(today, 1)); // Add one month for analytics
    
    // Scroll to current month after initial load
    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (container) {
        const currentMonthKey = format(today, 'yyyy-MM');
        const currentMonthElement = container.querySelector(`[data-month="${currentMonthKey}"]`);
        if (currentMonthElement) {
          currentMonthElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }, 200);
  }, [onMonthChange]);

  // Handle scroll to update header and load more months
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (isLoadingRef.current || isNavigatingRef.current) return;

      // Immediate check: if current header month is no longer visible, switch immediately
      const currentMonthKey = format(headerMonth, 'yyyy-MM');
      const currentMonthElement = container.querySelector(`[data-month="${currentMonthKey}"]`);
      
      if (currentMonthElement) {
        const rect = currentMonthElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        
        const visibleTop = Math.max(rect.top, containerTop);
        const visibleBottom = Math.min(rect.bottom, containerBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        // If current month is barely visible (less than 30px), immediately switch
        if (visibleHeight < 30) {
          const monthElements = container.querySelectorAll('[data-month]');
          for (const element of monthElements) {
            const elementRect = element.getBoundingClientRect();
            const elementVisibleTop = Math.max(elementRect.top, containerTop);
            const elementVisibleBottom = Math.min(elementRect.bottom, containerBottom);
            const elementVisibleHeight = Math.max(0, elementVisibleBottom - elementVisibleTop);
            
            if (elementVisibleHeight > 100) {
              const monthKey = element.getAttribute('data-month');
              if (monthKey && monthKey !== currentMonthKey) {
                const detectedMonthDate = new Date(monthKey + '-01');
                const analyticsMonthDate = addMonths(detectedMonthDate, 1); // Add one month for analytics
                console.log('Detected:' , detectedMonthDate, 'Analytics Month:', analyticsMonthDate);
                setHeaderMonth(analyticsMonthDate);
                onMonthChange?.(analyticsMonthDate);
                return; // Exit early, skip throttled update
              }
            }
          }
        }
      }

      // Throttle the more comprehensive month detection
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        // Find the first month that has significant content visible in the viewport
        const containerRect = container.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        const viewportHeight = containerBottom - containerTop;
        
        const monthElements = container.querySelectorAll('[data-month]');
        let selectedMonth: string | null = null;

        // Find the first month that has substantial content visible
        for (const element of monthElements) {
          const rect = element.getBoundingClientRect();
          
          // Calculate visible area
          const visibleTop = Math.max(rect.top, containerTop);
          const visibleBottom = Math.min(rect.bottom, containerBottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          
          // If the month has any significant content visible (more than 20% of viewport or 100px)
          const minVisibleHeight = Math.min(viewportHeight * 0.2, 100);
          
          if (visibleHeight >= minVisibleHeight) {
            // If this month takes up the majority of the visible space, select it
            const visibilityRatio = visibleHeight / viewportHeight;
            
            // Select this month if it's the first substantially visible one
            if (visibilityRatio > 0.25 || visibleHeight > 150) {
              selectedMonth = element.getAttribute('data-month');
              break;
            }
          }
        }

        // If no month meets the substantial visibility criteria, fall back to the most visible one
        if (!selectedMonth) {
          let maxVisibleHeight = 0;
          monthElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const visibleTop = Math.max(rect.top, containerTop);
            const visibleBottom = Math.min(rect.bottom, containerBottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            if (visibleHeight > maxVisibleHeight && visibleHeight > 50) {
              maxVisibleHeight = visibleHeight;
              selectedMonth = element.getAttribute('data-month');
            }
          });
        }

        // Update header month
        if (selectedMonth) {
          const detectedMonthDate = new Date(selectedMonth + '-01');
          const analyticsMonthDate = addMonths(detectedMonthDate, 1);
          console.log('Analytics Month:', analyticsMonthDate);
          // Header should show the analytics month (detected + 1)
          setHeaderMonth(analyticsMonthDate);
          // Analytics should use detected month + 1
          onMonthChange?.(analyticsMonthDate);
        }
      }, 50); // Reduced delay for more responsive updates

      // Load more months when approaching edges
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Load months above when scrolled near top
      if (scrollTop < clientHeight * 1.5 && !isLoadingRef.current) {
        isLoadingRef.current = true;
        
        setLoadedMonths(prev => {
          const newSet = new Set(prev);
          const sortedMonths = Array.from(prev).sort();
          const firstMonth = sortedMonths[0];
          
          if (firstMonth) {
            const firstDate = new Date(firstMonth + '-01');
            // Load 6 months at once for faster scrolling
            for (let i = 1; i <= 6; i++) {
              const newMonth = subMonths(firstDate, i);
              newSet.add(format(newMonth, 'yyyy-MM'));
            }
          }
          
          // Limit total months to prevent memory issues (increased for better performance)
          const finalArray = Array.from(newSet).sort();
          if (finalArray.length > 30) {
            return new Set(finalArray.slice(0, 30));
          }
          
          return newSet;
        });
        
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 300);
      }

      // Load months below when scrolled near bottom
      if (scrollTop + clientHeight > scrollHeight - clientHeight * 1.5 && !isLoadingRef.current) {
        isLoadingRef.current = true;
        
        setLoadedMonths(prev => {
          const newSet = new Set(prev);
          const sortedMonths = Array.from(prev).sort();
          const lastMonth = sortedMonths[sortedMonths.length - 1];
          
          if (lastMonth) {
            const lastDate = new Date(lastMonth + '-01');
            // Load 6 months at once for faster scrolling
            for (let i = 1; i <= 6; i++) {
              const newMonth = addMonths(lastDate, i);
              newSet.add(format(newMonth, 'yyyy-MM'));
            }
          }
          
          // Limit total months to prevent memory issues (increased for better performance)
          const finalArray = Array.from(newSet).sort();
          if (finalArray.length > 30) {
            return new Set(finalArray.slice(-30));
          }
          
          return newSet;
        });
        
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 300);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [headerMonth, onMonthChange]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const targetMonth = direction === 'prev' ? subMonths(headerMonth, 1) : addMonths(headerMonth, 1);
    const targetMonthKey = format(targetMonth, 'yyyy-MM');
    
    // Ensure target month is loaded
    setLoadedMonths(prev => new Set([...prev, targetMonthKey]));
    
    // Find and scroll to the target month
    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const targetElement = container.querySelector(`[data-month="${targetMonthKey}"]`);
      if (targetElement) {
        isNavigatingRef.current = true;
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update header immediately for better UX
        setHeaderMonth(targetMonth);
        onMonthChange?.(addMonths(targetMonth, 1)); // Add one month for analytics
        
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1000);
      }
    }, 100);
  };

  const navigateToToday = () => {
    const today = new Date();
    const todayMonthKey = format(today, 'yyyy-MM');
    
    // Ensure today's month is loaded
    setLoadedMonths(prev => new Set([...prev, todayMonthKey]));
    
    // Find and scroll to today's month
    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const todayElement = container.querySelector(`[data-month="${todayMonthKey}"]`);
      if (todayElement) {
        isNavigatingRef.current = true;
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update header immediately for better UX
        setHeaderMonth(today);
        onMonthChange?.(addMonths(today, 1)); // Add one month for analytics
        
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1000);
      }
    }, 100);
  };

  const handleDayClick = (date: Date) => {
    if (onDaySelected) {
      onDaySelected(date);
    } else {
      setModalInitialDate(date);
      setIsModalOpen(true);
    }
  };

  const handleEventClick = (event: Event, eventElement?: HTMLElement) => {
    // Use inline editor if eventElement is provided, otherwise fall back to modal
    if (eventElement) {
      setInlineEditEvent({ event, eventElement });
    } else {
      setSelectedEvent(event);
      setIsEditModalOpen(true);
    }
  };

  // Create sorted array of months to render
  const monthsToRender = Array.from(loadedMonths)
    .sort()
    .map(monthKey => new Date(monthKey + '-01'));

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700 hover:text-gray-900"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-gray-900 min-w-[200px] text-center">
            {format(headerMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700 hover:text-gray-900"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={navigateToToday}
            className="ml-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-gray-800 hover:text-gray-900"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-hide p-4"
      >
        {/* Render all loaded months */}
        {monthsToRender.map((monthDate) => (
          <StaticMonthCard
            key={format(monthDate, 'yyyy-MM')}
            monthDate={monthDate}
            events={events}
            onDayClick={handleDayClick}
            onEventEdit={handleEventClick}
            timeFormat={timeFormat}
          />
        ))}
      </div>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialDate(undefined);
        }}
        initialDate={modalInitialDate}
        initialHour={9} // Default to 9 AM for month view
      />

      <EventEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />

      {/* Inline Event Editor */}
      {inlineEditEvent && (
        <InlineEventEditor
          event={inlineEditEvent.event}
          eventElement={inlineEditEvent.eventElement}
          onCancel={() => setInlineEditEvent(null)}
        />
      )}
    </div>
  );
}
