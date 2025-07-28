'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadTimePredictionModel, predictTaskDuration } from '@/utils/taskTimePrediction';
import { X } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { HOUR_HEIGHT } from '@/utils/calendar';

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
}

export function InlineEventCreator({ 
  initialHour, 
  initialMinute, 
  dayColumnRef, 
  onCancel,
  onUpdate,
  initialTitle,
  initialStartTime,
  initialEndTime
}: InlineEventCreatorProps) {
  const { addEvent, events } = useEvents();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [duration, setDuration] = useState(60); // default 60 min
  // Removed AI model and vocab logic

  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
      
      // Determine which side to show the form on
      const showOnLeft = dayRect.right + 320 > viewportWidth; // 320px is form width
      
      setFormPosition({
        left: showOnLeft ? dayRect.left - 320 - 10 : dayRect.right + 10,
        top: dayRect.top + topOffset + 64, // 64px for header height
        side: showOnLeft ? 'left' : 'right'
      });
    }
  }, [dayColumnRef, initialHour, initialMinute]);

  // Predict duration when title changes, with historical override
  // Removed AI prediction logic

  // Update parent component when title, times, or duration change
  useEffect(() => {
    onUpdate({ title, startTime, endTime });
  }, [title, startTime, endTime, onUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addEvent(title.trim(), startTime, endTime, description.trim() || undefined);
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
      {/* Popup form */}
      <div
        ref={formRef}
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
        style={{
          left: formPosition.left,
          top: formPosition.top,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">New Event</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
