'use client';

import React, { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { CalendarView } from './Layout';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isSameDay, format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EventAnalyticsProps {
  currentView: CalendarView;
  selectedDate: Date | null;
  currentWeek?: Date;
  currentMonth?: Date;
}

interface CategoryTimeData {
  [category: string]: {
    totalMinutes: number;
    subcategories: {
      [subcategory: string]: number;
    };
  };
}

interface PieChartData {
  category: string;
  minutes: number;
  hours: string;
  color: string;
}

export function EventAnalytics({ currentView, selectedDate, currentWeek, currentMonth }: EventAnalyticsProps) {
  const { events } = useEvents();
  const [isExpanded, setIsExpanded] = useState(false);

  const getTimeData = (): CategoryTimeData => {
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

    // Calculate time spent by category and subcategory
    const timeData: CategoryTimeData = {};
    
    filteredEvents.forEach(event => {
      const category = event.category || 'Uncategorized';
      const subcategory = event.subcategory || 'Other';
      
      // Calculate duration in minutes
      const durationMinutes = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
      
      if (!timeData[category]) {
        timeData[category] = {
          totalMinutes: 0,
          subcategories: {}
        };
      }
      
      timeData[category].totalMinutes += durationMinutes;
      
      if (!timeData[category].subcategories[subcategory]) {
        timeData[category].subcategories[subcategory] = 0;
      }
      
      timeData[category].subcategories[subcategory] += durationMinutes;
    });
    
    return timeData;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPieChartData = (): PieChartData[] => {
    const timeData = getTimeData();
    return Object.entries(timeData)
      .filter(([, data]) => data.totalMinutes > 0)
      .map(([category, data]) => ({
        category,
        minutes: data.totalMinutes,
        hours: formatDuration(data.totalMinutes),
        color: getCategoryColor(category)
      }))
      .sort((a, b) => b.minutes - a.minutes);
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

  const pieChartData = getPieChartData();
  const totalEvents = events.filter(event => {
    const now = new Date();
    switch (currentView) {
      case 'day': {
        const targetDate = selectedDate || now;
        return isSameDay(event.startTime, targetDate);
      }
      case 'week': {
        const weekStart = startOfWeek(currentWeek || now, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentWeek || now, { weekStartsOn: 0 });
        return isWithinInterval(event.startTime, { start: weekStart, end: weekEnd });
      }
      case 'month': {
        const monthStart = startOfMonth(currentMonth || now);
        const monthEnd = endOfMonth(currentMonth || now);
        return isWithinInterval(event.startTime, { start: monthStart, end: monthEnd });
      }
      default:
        return false;
    }
  }).length;
  const totalTime = pieChartData.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-bold mb-3 text-gray-900">Analytics</h3>
      <div className="text-sm text-gray-700 mb-4">
        {getTimeFrameLabel()}: {totalEvents} event{totalEvents !== 1 ? 's' : ''}
        {totalTime > 0 && ` • ${formatDuration(totalTime)} total`}
      </div>
      
      {totalEvents === 0 ? (
        <div className="text-center text-gray-600 py-4">
          No events for {getTimeFrameLabel().toLowerCase()}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pie Chart */}
          {pieChartData.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Time Distribution</h4>
                {pieChartData.length > 5 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={16} />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Expand
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className={`transition-all duration-300 ${isExpanded ? 'h-96' : 'h-64'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={isExpanded ? 120 : 80}
                      paddingAngle={2}
                      dataKey="minutes"
                      nameKey="category"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatDuration(value), 'Time']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend 
                      formatter={(value) => {
                        const data = pieChartData.find(item => item.category === value);
                        return `${value} (${data ? formatDuration(data.minutes) : ''})`;
                      }}
                      wrapperStyle={{ fontSize: isExpanded ? '12px' : '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
