'use client';

import React, { useState } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { CalendarView } from './Layout';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isSameDay, format } from 'date-fns';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnalyticsModal } from './AnalyticsModal';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <h3 className="text-lg font-bold mb-3 text-gray-900 font-mono">Analytics</h3>
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
      {/* See more button */}
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          See more
        </button>
      </div>
        <AnalyticsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          {/* Date Range */}
          <div className="mb-6">
            <div className="text-base font-semibold text-gray-900 mb-1">{getTimeFrameLabel()}</div>
            <div className="text-sm text-gray-600">Detailed statistics for this period</div>
          </div>

          {/* Classification Pie Chart */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Time by Category</h4>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="minutes"
                    nameKey="category"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cat-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatDuration(value), 'Time']} />
                  <Legend formatter={(value) => {
                    const data = pieChartData.find(item => item.category === value);
                    return `${value} (${data ? formatDuration(data.minutes) : ''})`;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scheduled vs Free Time Pie Chart */}
          <ScheduledVsFreePieChart
            events={events}
            currentView={currentView}
            selectedDate={selectedDate}
            currentWeek={currentWeek}
            currentMonth={currentMonth}
          />

          {/* Comparative Stats */}
          <ComparativeStats
            events={events}
            currentView={currentView}
            selectedDate={selectedDate}
            currentWeek={currentWeek}
            currentMonth={currentMonth}
            formatDuration={formatDuration}
          />
        </AnalyticsModal>
    </div>
  );
}

// --- Scheduled vs Free Time Pie Chart ---
import { Event } from '@/types/events';

interface ScheduledVsFreePieChartProps {
  events: Event[];
  currentView: 'day' | 'week' | 'month';
  selectedDate: Date | null;
  currentWeek?: Date;
  currentMonth?: Date;
}

function ScheduledVsFreePieChart({ events, currentView, selectedDate, currentWeek, currentMonth }: ScheduledVsFreePieChartProps) {
  const now = new Date();
  let periodStart, periodEnd;
  switch (currentView) {
    case 'day':
      periodStart = startOfDay(selectedDate || now);
      periodEnd = endOfDay(selectedDate || now);
      break;
    case 'week':
      periodStart = startOfWeek(currentWeek || now, { weekStartsOn: 0 });
      periodEnd = endOfWeek(currentWeek || now, { weekStartsOn: 0 });
      break;
    case 'month':
      periodStart = startOfMonth(currentMonth || now);
      periodEnd = endOfMonth(currentMonth || now);
      break;
    default:
      periodStart = startOfWeek(now, { weekStartsOn: 0 });
      periodEnd = endOfWeek(now, { weekStartsOn: 0 });
  }
  const periodEvents = events.filter((e: Event) => e.startTime >= periodStart && e.endTime <= periodEnd);
  const scheduledMinutes = periodEvents.reduce((sum: number, e: Event) => sum + differenceInMinutes(e.endTime, e.startTime), 0);
  const totalMinutes = differenceInMinutes(periodEnd, periodStart) + 1;
  const freeMinutes = Math.max(totalMinutes - scheduledMinutes, 0);
  const data = [
    { name: 'Scheduled', value: scheduledMinutes, color: '#3B82F6' },
    { name: 'Free', value: freeMinutes, color: '#10B981' },
  ];
  return (
    <div className="mb-8">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Scheduled vs. Free Time</h4>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, idx) => (
                <Cell key={`free-cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${Math.round(value)} min`, 'Time']} />
            <Legend formatter={(value) => {
              const d = data.find(item => item.name === value);
              return `${value} (${d ? Math.round(d.value) + ' min' : ''})`;
            }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Comparative Stats ---
interface ComparativeStatsProps {
  events: Event[];
  currentView: 'day' | 'week' | 'month';
  selectedDate: Date | null;
  currentWeek?: Date;
  currentMonth?: Date;
  formatDuration: (minutes: number) => string;
}

function ComparativeStats({ events, currentView, selectedDate, currentWeek, currentMonth, formatDuration }: ComparativeStatsProps) {
  const now = new Date();
  let weekStart = startOfWeek(currentWeek || now, { weekStartsOn: 0 });
  let weekEnd = endOfWeek(currentWeek || now, { weekStartsOn: 0 });
  let monthStart = startOfMonth(currentMonth || now);
  let monthEnd = endOfMonth(currentMonth || now);
  let yearStart = new Date(now.getFullYear(), 0, 1);
  let yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  const weekEvents = events.filter((e: Event) => e.startTime >= weekStart && e.endTime <= weekEnd);
  const weekMinutes = weekEvents.reduce((sum: number, e: Event) => sum + (e.endTime.getTime() - e.startTime.getTime()) / 60000, 0);
  const monthEvents = events.filter((e: Event) => e.startTime >= monthStart && e.endTime <= monthEnd);
  const monthMinutes = monthEvents.reduce((sum: number, e: Event) => sum + (e.endTime.getTime() - e.startTime.getTime()) / 60000, 0);
  const yearEvents = events.filter((e: Event) => e.startTime >= yearStart && e.endTime <= yearEnd);
  const yearMinutes = yearEvents.reduce((sum: number, e: Event) => sum + (e.endTime.getTime() - e.startTime.getTime()) / 60000, 0);
  const avgWeek = yearMinutes / 52;
  const avgMonth = yearMinutes / 12;
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Comparative Statistics</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">This week vs. average</div>
          <div className="text-lg font-bold text-blue-700">{formatDuration(weekMinutes)}</div>
          <div className="text-xs text-gray-600">Weekly avg: {formatDuration(avgWeek)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">This month vs. average</div>
          <div className="text-lg font-bold text-blue-700">{formatDuration(monthMinutes)}</div>
          <div className="text-xs text-gray-600">Monthly avg: {formatDuration(avgMonth)}</div>
        </div>
      </div>
    </div>
  );
}
