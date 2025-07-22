

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

interface PieChartDatum {
  category: string;
  minutes: number;
  color: string;
}

export const EventAnalytics: React.FC<EventAnalyticsProps> = ({ currentView, selectedDate, currentWeek, currentMonth }) => {
  const { events } = useEvents();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper: get time frame label
  function getTimeFrameLabel() {
    const now = new Date();
    switch (currentView) {
      case 'day':
        return selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : format(now, 'EEEE, MMM d, yyyy');
      case 'week': {
        const weekStart = startOfWeek(currentWeek || now, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentWeek || now, { weekStartsOn: 0 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'month': {
        const monthStart = startOfMonth(currentMonth || now);
        return format(monthStart, 'MMMM yyyy');
      }
      default:
        return '';
    }
  }

  // Helper: get pie chart data
  function getPieChartData(): PieChartDatum[] {
    const now = new Date();
    let periodStart: Date, periodEnd: Date;
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
    const periodEvents = events.filter(e => e.startTime >= periodStart && e.endTime <= periodEnd);
    const categoryMap: Record<string, { minutes: number; color: string }> = {};
    periodEvents.forEach(e => {
      const cat = e.category || 'Uncategorized';
      const color = e.color || '#8884d8';
      const minutes = differenceInMinutes(e.endTime, e.startTime);
      if (!categoryMap[cat]) {
        categoryMap[cat] = { minutes: 0, color };
      }
      categoryMap[cat].minutes += minutes;
    });
    return Object.entries(categoryMap).map(([category, { minutes, color }]) => ({ category, minutes, color }));
  }



  const pieChartData = getPieChartData();
  const totalEvents = pieChartData.reduce((sum, item) => sum + item.minutes, 0) > 0
    ? events.filter(event => {
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
      }).length
    : 0;
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
        {/* Date and Title at Top */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-bold text-gray-900">Detailed Analytics</div>
          <div className="text-base text-gray-700">{getTimeFrameLabel()}</div>
        </div>
        {/* Responsive Grid Layout: Left 2/3 for main pie, right 1/3 for stats */}
        <div className="flex w-full h-[70vh] min-h-[400px] max-h-[600px] gap-6">
          {/* Left: Large Category Pie Chart with lines and labels */}
          <div className="relative flex-1 flex flex-col items-center justify-center" style={{flexBasis: '66%'}}>
            <div className="w-full h-full flex items-center justify-center">
              <ResponsiveContainer width="90%" height="90%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={2}
                    dataKey="minutes"
                    nameKey="category"
                    label={renderCategoryLabelWithLine(pieChartData, getCategoryChangeData())}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cat-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatDuration(value), 'Time']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Right: Small Pie Charts and Category List */}
          <div className="flex flex-col justify-between items-stretch w-1/3 min-w-[220px] max-w-[320px]">
            {/* Scheduled vs Free Time Pie Chart */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-700 mb-1">Scheduled vs. Free</div>
              <div className="w-full h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getScheduledVsFreeData(events, currentView, selectedDate, currentWeek, currentMonth)}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={48}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {getScheduledVsFreeData(events, currentView, selectedDate, currentWeek, currentMonth).map((entry, idx) => (
                        <Cell key={`free-cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Category List with time and change */}
            <div className="flex-1 overflow-y-auto">
              <div className="text-xs font-semibold text-gray-700 mb-1">Categories</div>
              <ul className="divide-y divide-gray-200">
                {pieChartData.map((cat, idx) => {
                  const change = getCategoryChangeData()[cat.category] || 0;
                  return (
                    <li key={cat.category} className="flex items-center justify-between py-1 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{background: cat.color}}></span>
                        {cat.category}
                      </span>
                      <span className="flex items-center gap-2">
                        {formatDuration(cat.minutes)}
                        <span className={`text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {change > 0 ? `▲ ${formatDuration(Math.abs(change))}` : change < 0 ? `▼ ${formatDuration(Math.abs(change))}` : '—'}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </AnalyticsModal>
    </div>
  );
};



// --- Helper functions: must be after all component exports ---

function getCategoryChangeData(): Record<string, number> {
  // This is a placeholder. You should implement logic to compare with previous period's data.
  // For now, return 0 for all categories.
  return {};
}

function getScheduledVsFreeData(
  events: any[],
  currentView: 'day' | 'week' | 'month',
  selectedDate: Date | null,
  currentWeek?: Date,
  currentMonth?: Date
): { name: string; value: number; color: string }[] {
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
  const periodEvents = events.filter((e) => e.startTime >= periodStart && e.endTime <= periodEnd);
  const scheduledMinutes = periodEvents.reduce((sum, e) => sum + differenceInMinutes(e.endTime, e.startTime), 0);
  const totalMinutes = differenceInMinutes(periodEnd, periodStart) + 1;
  const freeMinutes = Math.max(totalMinutes - scheduledMinutes, 0);
  return [
    { name: 'Scheduled', value: scheduledMinutes, color: '#3B82F6' },
    { name: 'Free', value: freeMinutes, color: '#10B981' },
  ];
}

function renderCategoryLabelWithLine(pieChartData: any[], changeData: Record<string, number>) {
  return function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const entry = pieChartData[index];
    const change = changeData[entry.category] || 0;
    return (
      <g>
        {/* Line from arc to label */}
        <line x1={cx + (outerRadius-2) * Math.cos(-midAngle * RADIAN)} y1={cy + (outerRadius-2) * Math.sin(-midAngle * RADIAN)} x2={x} y2={y} stroke={entry.color} strokeWidth={2} />
        {/* Label text */}
        <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-mono text-xs" fill="#222">
          {entry.category} ({formatDuration(entry.minutes)})
          <tspan dx="6" className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}>
            {change > 0 ? `▲ ${formatDuration(Math.abs(change))}` : change < 0 ? `▼ ${formatDuration(Math.abs(change))}` : '—'}
          </tspan>
        </text>
      </g>
    );
  };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

