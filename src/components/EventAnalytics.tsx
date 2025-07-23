// Strict vertical label for small pie chart: only top and bottom
// Removed unused renderStrictVerticalPieLabel function
// Custom label for vertical positioning on small pie chart
export function renderVerticalPieLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  name?: string;
  value?: number;
}) {
  if (!props || typeof props !== 'object') return null;
  const { cx, cy, midAngle, outerRadius, name, value } = props;
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    outerRadius === undefined ||
    name === undefined
  ) return null;
  // Place label above or below depending on angle
  const isTop = midAngle < 180;
  const radius = (outerRadius || 0) + 24;
  const x = cx;
  const y = cy + (isTop ? -radius : radius);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono text-xs" fill="#222">
      {name}: {formatDuration(value ?? 0)}
    </text>
  );
}
import React, { useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay,
  format,
  startOfDay,
  endOfDay,
  differenceInMinutes
} from 'date-fns';
import { AnalyticsModal } from './AnalyticsModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { CategoryTrendsLineChart } from './CategoryTrendsLineChart';

interface PieChartDatum {
  category: string;
  minutes: number;
  color: string;
  count: number;
}
interface EventAnalyticsProps {
  currentView: 'day' | 'week' | 'month';
  selectedDate: Date | null;
  currentWeek?: Date;
  currentMonth?: Date;
}

// Move chartCategoryLabels to module scope so it's truly global for this file
const chartCategoryLabels: Record<string, string> = {};

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
        // Fix: show week range as start - start+6 days
        const weekStart = startOfWeek(currentWeek || now, { weekStartsOn: 0 });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'month': {
        // Fix: show correct month (do not add one month)
        const baseMonth = currentMonth || now;
        return format(baseMonth, 'MMMM yyyy');
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
    const categoryMap: Record<string, { minutes: number; color: string; count: number }> = {};
    periodEvents.forEach(e => {
      const cat = e.category || 'Uncategorized';
      const color = e.color || '#8884d8';
      const minutes = differenceInMinutes(e.endTime, e.startTime);
      if (!categoryMap[cat]) {
        categoryMap[cat] = { minutes: 0, color, count: 0 };
      }
      categoryMap[cat].minutes += minutes;
      categoryMap[cat].count += 1;
    });
    const result = Object.entries(categoryMap).map(([category, { minutes, color, count }]) => ({ category, minutes, color, count }));
    // Save chart label values globally for use in pie chart labels
    result.forEach(item => {
      chartCategoryLabels[item.category] = `${item.category} | ${formatDuration(item.minutes)}`;
    });
    return result;
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
  // Removed unused totalTime variable

  return (
    <div className="p-6 border-b border-gray-200">
      {/* Analytics Title and Pie Chart Section */}
      {totalEvents === 0 ? (
        <div className="text-center text-gray-600 py-4">
          No events for {getTimeFrameLabel().toLowerCase()}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analytics Title */}
          <div className="w-full flex items-left justify-left mb-2">
            <h2 className="font-bold font-mono text-lg text-gray-900">Analytics</h2>
          </div>
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
      {/* Centered See more button */}
      {totalEvents !== 0 && (
        <div className="flex justify-center mt-4">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setIsModalOpen(true)}
          >
            See more
          </button>
        </div>
      )}
      <AnalyticsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {/* Single Header: left (title), center (date), right (X) */}
        <div className="flex items-center justify-between mb-2 w-full px-2" style={{ minHeight: 48 }}>
          <div className="text-lg font-bold text-gray-900">How you spend your time:</div>
          <div className="text-base text-gray-700 text-center flex-1">{getTimeFrameLabel()}</div>
          <button onClick={() => setIsModalOpen(false)} className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none" aria-label="Close analytics modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex w-full h-[70vh] min-h-[400px] max-h-[700px] gap-8 overflow-hidden">
          {/* Left: Large Category Pie Chart with lines and labels, and new bottom bar */}
          <div className="relative flex-1 flex flex-col items-center justify-start" style={{flexBasis: '70%', minHeight: 0}}>
            <div className="w-full flex-1 flex items-center justify-center min-h-[300px] max-h-[500px]">
              {pieChartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1/2 h-2 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full bg-blue-400 animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={150}
                      paddingAngle={2}
                      dataKey="minutes"
                      nameKey="category"
                      label={renderCategoryLabelWithLine(pieChartData)}
                      isAnimationActive={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cat-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* New bottom bar for subcategory pie chart and scheduled/free pie chart */}
            <div className="w-full flex flex-row items-stretch justify-between gap-4 mt-2 bg-gray-100 rounded-lg p-3" style={{ minHeight: 180 }}>
              {/* Subcategory Pie Chart */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <h6 className="text-xs font-semibold text-gray-700 mb-1">Subcategories</h6>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={getSubcategoryPieChartData(events, currentView, selectedDate, currentWeek, currentMonth)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="minutes"
                      nameKey="subcategory"
                      labelLine={false}
                      label={renderSubcategoryPieLabel}
                      isAnimationActive={false}
                    >
                      {getSubcategoryPieChartData(events, currentView, selectedDate, currentWeek, currentMonth).map((entry, index) => (
                        <Cell key={`subcat-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Scheduled vs Free Pie Chart */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <h6 className="text-xs font-semibold text-gray-700 mb-1">Scheduled vs. Free</h6>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={getScheduledVsFreeData(events, currentView, selectedDate, currentWeek, currentMonth)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={0}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={renderVerticalPieLabel}
                      isAnimationActive={false}
                    >
                      {getScheduledVsFreeData(events, currentView, selectedDate, currentWeek, currentMonth).map((entry) => (
                        <Cell key={`free-cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Right sidebar: Category analytics (table + line chart) full height */}
          <div className="flex flex-col items-stretch w-[420px] min-w-[320px] max-w-[500px] gap-2 h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2 w-full px-2 pb-1 text-xs text-gray-500 font-semibold border-b border-gray-200 items-end">
                <div className="text-left pl-2">Category</div>
                <div className="text-center">Events</div>
                <div className="text-center">This</div>
                <div className="text-center">Last</div>
                <div className="text-center">Change</div>
              </div>
              {pieChartData.map((cat) => {
                const changes = getCategoryChangeData(events, currentView, selectedDate, currentWeek, currentMonth, true);
                const prevCatMinutes = changes._prev && changes._prev[cat.category] ? changes._prev[cat.category] : 0;
                const change = changes[cat.category] || 0;
                let percentChange = prevCatMinutes > 0 ? (change / prevCatMinutes) * 100 : 0;
                let arrow = null;
                if (prevCatMinutes > 0) {
                  if (percentChange > 0.01) {
                    arrow = <svg className="inline-block mr-1" width="10" height="10" viewBox="0 0 10 10"><path d="M5 2l3 6H2l3-6z" fill="currentColor"/></svg>;
                  } else if (percentChange < -0.01) {
                    arrow = <svg className="inline-block mr-1" width="10" height="10" viewBox="0 0 10 10"><path d="M5 8l-3-6h6l-3 6z" fill="currentColor"/></svg>;
                  } else {
                    percentChange = 0;
                  }
                }
                return (
                  <div key={cat.category} className="grid grid-cols-5 gap-2 w-full px-2 py-1 items-center border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{background: cat.color}}></span>
                      <span className="font-bold text-sm text-gray-900">{cat.category}</span>
                    </div>
                    <div className="text-center tabular-nums text-gray-900 font-mono">{cat.count}</div>
                    <div className="text-center tabular-nums text-gray-900 font-mono">{formatDuration(cat.minutes)}</div>
                    <div className="text-center tabular-nums text-gray-900 font-mono">{formatDuration(prevCatMinutes)}</div>
                    <div className={`text-center tabular-nums text-xs ${percentChange > 0 ? 'text-green-600' : percentChange < 0 ? 'text-red-600' : 'text-gray-400'}`}>{prevCatMinutes > 0 ? (<>{arrow}{`${Math.abs(percentChange).toFixed(1)}%`}</>) : '—'}</div>
                  </div>
                );
              })}
              {/* Category Time Over Time Line Chart */}
              <div className="mt-8">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Category Trends Over Time</h5>
                <CategoryTrendsLineChart events={events} currentView={currentView} selectedDate={selectedDate} currentWeek={currentWeek} currentMonth={currentMonth} />
              </div>
            </div>
          </div>
        </div>
        {/* Remove blue outline on all focusable elements in modal */}
        <style jsx global>{`
          .focus\:outline-none:focus, button:focus, [tabindex]:focus, input:focus, select:focus, textarea:focus {
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
      </AnalyticsModal>
    </div>
  );
};



// --- Helper functions: must be after all component exports ---

// Helper: Generate subcategory pie chart data with color shades
function getSubcategoryPieChartData(
  events: Array<{ startTime: Date; endTime: Date; category?: string; subcategory?: string; color?: string }>,
  currentView: 'day' | 'week' | 'month',
  selectedDate: Date | null,
  currentWeek?: Date,
  currentMonth?: Date
): Array<{ category: string; subcategory: string; minutes: number; color: string }> {
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
  // Group by category and subcategory
  const subcatMap: Record<string, { category: string; subcategory: string; minutes: number; color: string }> = {};
  // Get all categories and their base color
  const categoryColors: Record<string, string> = {};
  periodEvents.forEach(e => {
    const cat = e.category || 'Uncategorized';
    const subcat = e.subcategory || 'Other';
    const color = e.color || '#8884d8';
    categoryColors[cat] = color;
    const minutes = differenceInMinutes(e.endTime, e.startTime);
    const key = `${cat}__${subcat}`;
    if (!subcatMap[key]) {
      subcatMap[key] = { category: cat, subcategory: subcat, minutes: 0, color: '' };
    }
    subcatMap[key].minutes += minutes;
  });
  // Assign color shades to subcategories
  const subcatKeys = Object.keys(subcatMap);
  const catSubcatCount: Record<string, number> = {};
  subcatKeys.forEach(key => {
    const cat = subcatMap[key].category;
    catSubcatCount[cat] = (catSubcatCount[cat] || 0) + 1;
  });
  // For each category, assign shades to subcategories
  const result: Array<{ category: string; subcategory: string; minutes: number; color: string }> = [];
  const shade = (hex: string, percent: number) => {
    // Simple shade function for hex colors
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, Math.max(0, Math.floor(r + (percent/100)*255)));
    g = Math.min(255, Math.max(0, Math.floor(g + (percent/100)*255)));
    b = Math.min(255, Math.max(0, Math.floor(b + (percent/100)*255)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  };
  const catSubcatIndex: Record<string, number> = {};
  subcatKeys.forEach(key => {
    const entry = subcatMap[key];
    const cat = entry.category;
    catSubcatIndex[cat] = (catSubcatIndex[cat] || 0) + 1;
    const total = catSubcatCount[cat];
    // Spread shades from -30% to +30%
    const percent = -30 + (catSubcatIndex[cat]-1) * (60/(total>1?total-1:1));
    entry.color = shade(categoryColors[cat], percent);
    result.push(entry);
  });
  return result;
}

// Helper: Render subcategory pie label
function renderSubcategoryPieLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  name?: string;
  value?: number;
  percent?: number;
}) {
  if (!props || typeof props !== 'object') return null;
  const { cx, cy, midAngle, outerRadius, name, value, percent } = props;
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    outerRadius === undefined ||
    name === undefined
  ) return null;
  // Hide label for very small slices (<4% of pie)
  if (percent !== undefined && percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  // Spread labels further out if there are many slices
  const spread = (percent !== undefined && percent < 0.08) ? 32 : 18;
  const radius = outerRadius + spread;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-mono text-xs" fill="#222" style={{ pointerEvents: 'none' }}>
      {name}: {formatDuration(value ?? 0)}
    </text>
  );
}

// Returns a map of category to change in minutes compared to previous period
// Returns a map of category to change in minutes and previous period minutes, and _prev for prev period values
function getCategoryChangeData(
  events: Array<{ startTime: Date; endTime: Date; category?: string }>,
  currentView: 'day' | 'week' | 'month',
  selectedDate: Date | null,
  currentWeek?: Date,
  currentMonth?: Date,
  includePrev?: boolean
): Record<string, number> & { _prev?: Record<string, number> } {
  // Get current period range
  const now = new Date();
  let periodStart: Date, periodEnd: Date, prevStart: Date, prevEnd: Date;
  switch (currentView) {
    case 'day': {
      const base = selectedDate || now;
      periodStart = startOfDay(base);
      periodEnd = endOfDay(base);
      prevStart = startOfDay(new Date(base.getTime() - 24 * 60 * 60 * 1000));
      prevEnd = endOfDay(new Date(base.getTime() - 24 * 60 * 60 * 1000));
      break;
    }
    case 'week': {
      const base = currentWeek || now;
      periodStart = startOfWeek(base, { weekStartsOn: 0 });
      periodEnd = endOfWeek(base, { weekStartsOn: 0 });
      prevStart = startOfWeek(new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
      prevEnd = endOfWeek(new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
      break;
    }
    case 'month': {
      const base = currentMonth || now;
      periodStart = startOfMonth(base);
      periodEnd = endOfMonth(base);
      const prevMonth = new Date(periodStart);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      prevStart = startOfMonth(prevMonth);
      prevEnd = endOfMonth(prevMonth);
      break;
    }
    default: {
      periodStart = startOfWeek(now, { weekStartsOn: 0 });
      periodEnd = endOfWeek(now, { weekStartsOn: 0 });
      prevStart = startOfWeek(new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
      prevEnd = endOfWeek(new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
    }
  }
  // Get events for current and previous period
  const currEvents = events.filter(e => e.startTime >= periodStart && e.endTime <= periodEnd);
  const prevEvents = events.filter(e => e.startTime >= prevStart && e.endTime <= prevEnd);
  // Aggregate minutes by category
  const currCat: Record<string, number> = {};
  currEvents.forEach(e => {
    const cat = e.category || 'Uncategorized';
    const minutes = differenceInMinutes(e.endTime, e.startTime);
    currCat[cat] = (currCat[cat] || 0) + minutes;
  });
  const prevCat: Record<string, number> = {};
  prevEvents.forEach(e => {
    const cat = e.category || 'Uncategorized';
    const minutes = differenceInMinutes(e.endTime, e.startTime);
    prevCat[cat] = (prevCat[cat] || 0) + minutes;
  });
  // Compute change
  const allCats = new Set([...Object.keys(currCat), ...Object.keys(prevCat)]);
  const changes: Record<string, number> & { _prev?: Record<string, number> } = {};
  allCats.forEach(cat => {
    changes[cat] = (currCat[cat] || 0) - (prevCat[cat] || 0);
  });
  if (includePrev) {
    changes._prev = prevCat;
  }
  return changes;
}

function getScheduledVsFreeData(
  events: Array<{ startTime: Date; endTime: Date; category?: string; color?: string }>,
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

function renderCategoryLabelWithLine(
  pieChartData: Array<{ category: string; minutes: number; color: string; count: number }>
) {
  return function renderLabel({
    cx,
    cy,
    midAngle,
    outerRadius,
    index
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    outerRadius?: number;
    index?: number;
  }) {
    if (
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      outerRadius === undefined ||
      index === undefined
    ) return null;
    const RADIAN = Math.PI / 180;
    const entry = pieChartData[index];
    const radius = outerRadius + 32;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    // Show category, time spent, and event count
    return (
      <g>
        <line
          x1={cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN)}
          y1={cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN)}
          x2={x}
          y2={y}
          stroke={entry.color}
          strokeWidth={2}
        />
        <text
          x={x}
          y={y}
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="font-mono text-sm"
          fill="#222"
          style={{ letterSpacing: 1, fontSize: 15, whiteSpace: 'pre' }}
        >
          {entry.category}: {formatDuration(entry.minutes)}
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