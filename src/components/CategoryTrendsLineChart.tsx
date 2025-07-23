import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, format, differenceInMinutes } from 'date-fns';

interface EventType {
  startTime: Date;
  endTime: Date;
  category?: string;
  color?: string;
}

interface CategoryTrendsLineChartProps {
  events: EventType[];
  currentView: 'day' | 'week' | 'month';
  selectedDate: Date | null;
  currentWeek?: Date;
  currentMonth?: Date;
}

function getCategoryColor(events: EventType[], category: string): string {
  const found = events.find(e => (e.category || 'Uncategorized') === category && e.color);
  return found?.color || '#8884d8';
}

function getTimePeriods(currentView: 'day' | 'week' | 'month', selectedDate: Date | null, currentWeek?: Date, currentMonth?: Date, numPeriods = 8): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const periods: { label: string; start: Date; end: Date }[] = [];
  switch (currentView) {
    case 'day': {
      const base = selectedDate || now;
      for (let i = numPeriods - 1; i >= 0; i--) {
        const day = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push({
          label: format(day, 'MMM d'),
          start: startOfDay(day),
          end: endOfDay(day)
        });
      }
      break;
    }
    case 'week': {
      const base = currentWeek || now;
      for (let i = numPeriods - 1; i >= 0; i--) {
        const weekStart = startOfWeek(new Date(base.getTime() - i * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        periods.push({
          label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd')}`,
          start: weekStart,
          end: weekEnd
        });
      }
      break;
    }
    case 'month': {
      const base = currentMonth || now;
      for (let i = numPeriods - 1; i >= 0; i--) {
        const month = new Date(base);
        month.setMonth(month.getMonth() - i);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        periods.push({
          label: format(monthStart, 'MMM yyyy'),
          start: monthStart,
          end: monthEnd
        });
      }
      break;
    }
    default:
      break;
  }
  return periods;
}

function getCategoryTrendsData(events: EventType[], periods: { label: string; start: Date; end: Date }[]) {
  const categories = Array.from(new Set(events.map(e => e.category || 'Uncategorized')));
  return periods.map(period => {
    const periodEvents = events.filter(e => e.startTime >= period.start && e.endTime <= period.end);
    const data: Record<string, number> = {};
    categories.forEach(cat => {
      const catEvents = periodEvents.filter(e => (e.category || 'Uncategorized') === cat);
      const minutes = catEvents.reduce((sum, e) => sum + differenceInMinutes(e.endTime, e.startTime), 0);
      data[cat] = +(minutes / 60).toFixed(2);
    });
    return { label: period.label, ...data };
  });
}

export const CategoryTrendsLineChart: React.FC<CategoryTrendsLineChartProps> = ({ events, currentView, selectedDate, currentWeek, currentMonth }) => {
  const periods = getTimePeriods(currentView, selectedDate, currentWeek, currentMonth);
  const data = getCategoryTrendsData(events, periods);
  const categories = Array.from(new Set(events.map(e => e.category || 'Uncategorized')));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
        <XAxis dataKey="label" stroke="#888" fontSize={12} />
        <YAxis stroke="#888" fontSize={12} label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10 }} />
        <Tooltip 
          formatter={(value: number) => `${value}h`}
          labelFormatter={(label, payload) => {
            // For weekly view, show range
            if (payload && payload.length && payload[0].payload && payload[0].payload.start && payload[0].payload.end) {
              const start = payload[0].payload.start;
              const end = payload[0].payload.end;
              if (start && end && start instanceof Date && end instanceof Date) {
                return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
              }
            }
            return label;
          }}
        />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 13, marginTop: 12 }} />
        {categories.map(cat => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            stroke={getCategoryColor(events, cat)}
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={cat}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
