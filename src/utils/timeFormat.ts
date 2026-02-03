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

export function formatTimeRangeCompact(startDate: Date, endDate: Date, timeFormat: '12h' | '24h'): string {
  if (timeFormat === '24h') {
    // 24h format: just show times without AM/PM
    return `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
  } else {
    // 12h format: consolidate AM/PM if both are same
    const startTime = format(startDate, 'h:mm');
    const endTime = format(endDate, 'h:mm a');
    
    const startPeriod = format(startDate, 'a');
    const endPeriod = format(endDate, 'a');
    
    if (startPeriod === endPeriod) {
      // Both same AM/PM, only show at end
      return `${startTime} - ${endTime}`;
    } else {
      // Different AM/PM, show both
      return `${format(startDate, 'h:mm a')} - ${endTime}`;
    }
  }
}
