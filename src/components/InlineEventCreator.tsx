"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { useEvents } from "@/contexts/EventsContext";
import { useCalendars } from "@/contexts/CalendarsContext";
import { HOUR_HEIGHT } from "@/utils/calendar";

interface InlineEventCreatorProps {
  date: Date;
  initialHour: number;
  initialMinute: number;
  dayColumnRef: HTMLElement | null;
  onCancel: () => void;
  onUpdate: (updates: { title: string; startTime: Date; endTime: Date }) => void;
  initialTitle: string;
  initialStartTime: Date;
  initialEndTime: Date;
  weekDays?: Date[];
  position?: { top: number; left: number };
}

export function InlineEventCreator({ 
  initialHour, 
  initialMinute, 
  dayColumnRef, 
  onCancel,
  onUpdate,
  initialTitle,
  initialStartTime,
  initialEndTime,
  weekDays,
  date,
  position
}: InlineEventCreatorProps) {
  const { addEvent } = useEvents();
  const { calendars, defaultCalendarId } = useCalendars();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(defaultCalendarId || calendars[0]?.id || '');
  // ...existing code...
  // Removed AI model and vocab logic

  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update selected calendar when default changes
  useEffect(() => {
    if (defaultCalendarId && !selectedCalendarId) {
      setSelectedCalendarId(defaultCalendarId);
    }
  }, [defaultCalendarId, selectedCalendarId]);

  // Focus the title input when component mounts
  useEffect(() => {
    titleInputRef.current?.focus();
    // Removed model and vocab loading
  }, []);

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = new Date(e.target.value);
    setEndTime(newEndTime);
  };

  // Calculate position for the popup form
  const [formPosition, setFormPosition] = useState<{ left: number; top: number; side: 'left' | 'right' }>({
    left: 0,
    top: 0,
    side: 'right'
  });

  useEffect(() => {
    if (dayColumnRef && formRef.current) {
      const dayRect = dayColumnRef.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      // Calculate vertical position based on the click time
      const topOffset = (initialHour + initialMinute / 60) * HOUR_HEIGHT;
      let left = dayRect.right + 10;
      let side: 'left' | 'right' = 'right';
      // Use side logic from InlineEventEditor
      if (dayRect.right + 320 > viewportWidth) {
        left = dayRect.left - 320 - 10;
        side = 'left';
      }
      if (weekDays && date) {
        const dayIndex = weekDays.findIndex(day => day.toDateString() === date.toDateString());
        if (dayIndex === 6) {
          left = dayRect.left - 320 - 10;
          side = 'left';
        }
      }
      setFormPosition({
        left,
        top: dayRect.top + topOffset + 64, // original vertical logic
        side
      });
    }
  }, [dayColumnRef, initialHour, initialMinute, weekDays, date]);

  // Predict duration when title changes, with historical override
  // Removed AI prediction logic

  // Update parent component when title, times, or duration change
  useEffect(() => {
    onUpdate({ title, startTime, endTime });
  }, [title, startTime, endTime, onUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addEvent(title.trim(), startTime, endTime, description.trim() || undefined, undefined, undefined, selectedCalendarId);
      onCancel();
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = new Date(e.target.value);
    setStartTime(newStartTime);
  };

  // Duration input handler
  // Removed duration input handler

  const formatDateTimeLocal = (date: Date) => {
    // Subtract 4 hours to correct for timezone offset
    const correctedDate = new Date(date.getTime() - 4 * 60 * 60 * 1000);
    return correctedDate.toISOString().slice(0, 16);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60]"
        onClick={onCancel}
      />
      {/* Popup form */}
      <div
        ref={formRef}
        className="fixed bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-4 w-80 z-[70]"
        style={{
          left: position?.left ?? formPosition.left,
          top: position?.top ?? formPosition.top,
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-900">New Event</span>
            <button
              onClick={onCancel}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
              aria-label="Cancel"
            >
              <X size={20} />
            </button>
          </div>
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="Add title"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(startTime)}
                onChange={handleStartTimeChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(endTime)}
                onChange={handleEndTimeChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Add description"
              rows={2}
            />
          </div>

          {/* Calendar picker */}
          {calendars.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={14} />
                Calendar
              </label>
              <select
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {calendars.map(cal => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop to catch clicks outside */}
      <div
        className="fixed inset-0 z-10"
        onClick={onCancel}
      />
    </>
  );
}
