'use client';

import React from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { CalendarView } from './Layout';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isSameDay, format } from 'date-fns';

interface EventAnalyticsProps {
  currentView: CalendarView;
  selectedDate: Date | null;
  currentWeek?: Date;
  currentMonth?: Date;
}

interface CategoryCounts {
  [category: string]: {
    total: number;
    subcategories: {
      [subcategory: string]: number;
    };
  };
}

export function EventAnalytics({ currentView, selectedDate, currentWeek, currentMonth }: EventAnalyticsProps) {
  const { events } = useEvents();

  const getEventCounts = (): CategoryCounts => {
    let filteredEvents = events;
    const now = new Date();

    // Filter events based on the current view
    switch (currentView) {
      case 'day': {
        const targetDate = selectedDate || now;
        filteredEvents = events.filter(event => 
          isSameDay(event.startTime, targetDate)
        );
        break;
      }
      case 'week': {
        const weekStart = startOfWeek(currentWeek || now, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentWeek || now, { weekStartsOn: 0 });
        filteredEvents = events.filter(event => 
          isWithinInterval(event.startTime, { start: weekStart, end: weekEnd })
        );
        break;
      }
      case 'month': {
        const monthStart = startOfMonth(currentMonth || now);
        const monthEnd = endOfMonth(currentMonth || now);
        filteredEvents = events.filter(event => 
          isWithinInterval(event.startTime, { start: monthStart, end: monthEnd })
        );
        break;
      }
    }

    // Count events by category and subcategory
    const counts: CategoryCounts = {};
    
    filteredEvents.forEach(event => {
      const category = event.category || 'Uncategorized';
      const subcategory = event.subcategory || 'Other';
      
      if (!counts[category]) {
        counts[category] = {
          total: 0,
          subcategories: {}
        };
      }
      
      counts[category].total += 1;
      
      if (!counts[category].subcategories[subcategory]) {
        counts[category].subcategories[subcategory] = 0;
      }
      
      counts[category].subcategories[subcategory] += 1;
    });
    
    return counts;
  };

  const getTimeFrameLabel = (): string => {
    const now = new Date();
    
    switch (currentView) {
      case 'day': {
        const targetDate = selectedDate || now;
        return format(targetDate, 'MMMM d, yyyy');
      }
      case 'week': {
        const weekStart = startOfWeek(currentWeek || now, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentWeek || now, { weekStartsOn: 0 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'month': {
        const targetMonth = currentMonth || now;
        return format(targetMonth, 'MMMM yyyy');
      }
      default:
        return 'Current Period';
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Work': '#3B82F6',
      'Personal': '#10B981',
      'Health': '#EF4444',
      'Education': '#8B5CF6',
      'Travel': '#F59E0B',
      'Uncategorized': '#6B7280'
    };
    return colors[category] || '#6B7280';
  };

  const eventCounts = getEventCounts();
  const totalEvents = Object.values(eventCounts).reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-bold mb-3">Analytics</h3>
      <div className="text-sm text-gray-600 mb-3">
        {getTimeFrameLabel()}: {totalEvents} event{totalEvents !== 1 ? 's' : ''}
      </div>
      
      {totalEvents === 0 ? (
        <div className="text-center text-gray-400 py-4">
          No events for {getTimeFrameLabel().toLowerCase()}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(eventCounts)
            .sort(([,a], [,b]) => b.total - a.total) // Sort by total count descending
            .map(([category, data]) => (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <span className="font-medium text-sm text-gray-900">
                      {category}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {data.total}
                  </span>
                </div>
                
                {/* Subcategories */}
                <div className="ml-5 space-y-1">
                  {Object.entries(data.subcategories)
                    .sort(([,a], [,b]) => b - a) // Sort subcategories by count descending
                    .map(([subcategory, count]) => (
                      <div key={subcategory} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{subcategory}</span>
                        <span className="text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
