// Pastel color palettes
export const PASTEL_EVENT_COLORS = [
  '#FFB3B3', // Pastel Red
  '#B3D9FF', // Pastel Blue
  '#B3FFB3', // Pastel Green
  '#FFFFB3', // Pastel Yellow
  '#DDB3FF', // Pastel Purple
  '#FFB3DD', // Pastel Pink
  '#B3FFFF', // Pastel Cyan
  '#FFFFD9', // Pastel Cream
];

// Pastel colors by event category/type
export const CATEGORY_PASTEL_COLORS: Record<string, string> = {
  'Work': '#B3D9FF',      // Pastel Blue
  'Personal': '#FFB3DD',  // Pastel Pink
  'Social': '#B3FFB3',    // Pastel Green
  'Health': '#FFB3B3',    // Pastel Red
  'Education': '#DDB3FF', // Pastel Purple
  'Travel': '#B3FFFF',    // Pastel Cyan
  'Other': '#FFFFB3',     // Pastel Yellow
};

// Pastel colors for calendar (if color coding by calendar)
export const CALENDAR_PASTEL_COLORS: Record<string, string> = {
  'Work': '#B3D9FF',      // Pastel Blue
  'Personal': '#FFB3DD',  // Pastel Pink
  'Health': '#FFB3B3',    // Pastel Red
  'School': '#DDB3FF',    // Pastel Purple
  'Other': '#B3FFB3',     // Pastel Green
};

export type ColorSchemeMode = 'calendar' | 'event-type';

export function getDefaultEventTypeColors(): Record<string, string> {
  return {
    'Work': '#B3D9FF',
    'Personal': '#FFB3DD',
    'Social': '#B3FFB3',
    'Health': '#FFB3B3',
    'Education': '#DDB3FF',
    'Travel': '#B3FFFF',
    'Other': '#FFFFB3',
  };
}

export function getDefaultCalendarColors(calendarNames: string[]): Record<string, string> {
  const colors = PASTEL_EVENT_COLORS;
  const result: Record<string, string> = {};
  
  calendarNames.forEach((name, index) => {
    result[name] = colors[index % colors.length];
  });
  
  return result;
}

export function getColorForCategory(category: string | undefined): string {
  if (!category) return '#B3FFB3'; // Default to pastel green
  return CATEGORY_PASTEL_COLORS[category] || '#FFFFB3';
}

export function getRandomPastelColor(): string {
  return PASTEL_EVENT_COLORS[Math.floor(Math.random() * PASTEL_EVENT_COLORS.length)];
}
