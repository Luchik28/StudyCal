// Vibrant color palette (for selected events)
export const VIBRANT_COLORS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#007AFF', // Blue
  '#AF52DE', // Purple
  '#8E8E93', // Gray
];

// Pastel color palettes (for unselected events)
export const PASTEL_EVENT_COLORS = [
  '#FFB3B3', // Pastel Red
  '#FFDAB3', // Pastel Orange
  '#FFF4B3', // Pastel Yellow
  '#B3FFB3', // Pastel Green
  '#B3D9FF', // Pastel Blue
  '#DDB3FF', // Pastel Purple
  '#D1D1D6', // Pastel Gray
];

// Pastel colors by event category/type
export const CATEGORY_PASTEL_COLORS: Record<string, string> = {
  'Work': '#B3D9FF',      // Pastel Blue
  'Personal': '#DDB3FF',  // Pastel Purple
  'Social': '#B3FFB3',    // Pastel Green
  'Health': '#FFB3B3',    // Pastel Red
  'Education': '#FFDAB3', // Pastel Orange
  'Travel': '#FFF4B3',    // Pastel Yellow
  'Other': '#D1D1D6',     // Pastel Gray
};

// Vibrant colors by event category/type
export const CATEGORY_VIBRANT_COLORS: Record<string, string> = {
  'Work': '#007AFF',      // Blue
  'Personal': '#AF52DE',  // Purple
  'Social': '#34C759',    // Green
  'Health': '#FF3B30',    // Red
  'Education': '#FF9500', // Orange
  'Travel': '#FFCC00',    // Yellow
  'Other': '#8E8E93',     // Gray
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
    'Personal': '#DDB3FF',
    'Social': '#B3FFB3',
    'Health': '#FFB3B3',
    'Education': '#FFDAB3',
    'Travel': '#FFF4B3',
    'Other': '#D1D1D6',
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

// Helper function to convert pastel to vibrant color
export function pastelToVibrant(pastelColor: string): string {
  const colorMap: Record<string, string> = {
    '#FFB3B3': '#FF3B30', // Pastel Red -> Red
    '#FFDAB3': '#FF9500', // Pastel Orange -> Orange
    '#FFF4B3': '#FFCC00', // Pastel Yellow -> Yellow
    '#B3FFB3': '#34C759', // Pastel Green -> Green
    '#B3D9FF': '#007AFF', // Pastel Blue -> Blue
    '#DDB3FF': '#AF52DE', // Pastel Purple -> Purple
    '#D1D1D6': '#8E8E93', // Pastel Gray -> Gray
  };
  
  return colorMap[pastelColor.toUpperCase()] || pastelColor;
}

// Helper function to convert vibrant to pastel color
export function vibrantToPastel(vibrantColor: string): string {
  const colorMap: Record<string, string> = {
    '#FF3B30': '#FFB3B3', // Red -> Pastel Red
    '#FF9500': '#FFDAB3', // Orange -> Pastel Orange
    '#FFCC00': '#FFF4B3', // Yellow -> Pastel Yellow
    '#34C759': '#B3FFB3', // Green -> Pastel Green
    '#007AFF': '#B3D9FF', // Blue -> Pastel Blue
    '#AF52DE': '#DDB3FF', // Purple -> Pastel Purple
    '#8E8E93': '#D1D1D6', // Gray -> Pastel Gray
  };
  
  return colorMap[vibrantColor.toUpperCase()] || vibrantColor;
}

// Helper function to darken a hex color by a percentage (0-1)
export function darkenColor(hexColor: string, factor: number = 0.3): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Darken by reducing each component
  const newR = Math.round(r * (1 - factor));
  const newG = Math.round(g * (1 - factor));
  const newB = Math.round(b * (1 - factor));
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

// Helper function to lighten a hex color by a percentage (0-1)
export function lightenColor(hexColor: string, factor: number = 0.4): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Lighten by increasing each component towards 255
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

// Helper function to calculate perceived brightness of a hex color (0-1)
export function getColorBrightness(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate perceived brightness using relative luminance formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000 / 255;
  return brightness;
}

export function getColorForCategory(category: string | undefined): string {
  if (!category) return '#B3FFB3'; // Default to pastel green
  return CATEGORY_PASTEL_COLORS[category] || '#FFFFB3';
}

export function getRandomPastelColor(): string {
  return PASTEL_EVENT_COLORS[Math.floor(Math.random() * PASTEL_EVENT_COLORS.length)];
}
