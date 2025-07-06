import { format } from 'date-fns';

export function formatTime(date: Date, timeFormat: '12h' | '24h'): string {
  if (timeFormat === '24h') {
    return format(date, 'HH:mm');
  } else {
    return format(date, 'h:mm a');
  }
}

export function formatTimeRange(startDate: Date, endDate: Date, timeFormat: '12h' | '24h'): string {
  return `${formatTime(startDate, timeFormat)} - ${formatTime(endDate, timeFormat)}`;
}
