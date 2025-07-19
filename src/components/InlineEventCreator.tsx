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
  const [model, setModel] = useState<tf.GraphModel|null>(null);
  const [vocabMap, setVocabMap] = useState<Map<string, number>|null>(null);
  const [predicting, setPredicting] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus the title input when component mounts
  useEffect(() => {
    titleInputRef.current?.focus();
    // Load model and vocab on mount
    loadTimePredictionModel().then(({ model, vocabMap }) => {
      setModel(model);
      setVocabMap(vocabMap);
    }).catch(() => {});
  }, []);

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
  useEffect(() => {
    let cancelled = false;
    const trimmedTitle = title.trim();
    if (model && vocabMap && trimmedTitle) {
      // 1. Check for similar past events with identical lengths
      // Improved: normalize title (trim, lowercase, remove punctuation)
      console.log("Sce=anning for similar past events...");
      const normalize = (str: string) => str.trim().toLowerCase().replace(/[^\w\s]/g, '');
      const normalizedTitle = normalize(trimmedTitle);
      // Find all events with normalized title match
      const similarEvents = events.filter(ev =>
        ev.title && normalize(ev.title) === normalizedTitle
      );
      console.log(similarEvents);
      // Only override if all similar events have the same duration and there are at least 3
      if (similarEvents.length >= 3) {
        const durations = similarEvents.map(ev => Math.round((ev.endTime.getTime() - ev.startTime.getTime()) / 60000));
        const uniqueDurations = Array.from(new Set(durations));
        if (uniqueDurations.length === 1) {
          const dur = Math.round(uniqueDurations[0] / 5) * 5;
          setDuration(dur);
          const newEnd = new Date(startTime.getTime() + dur * 60000);
          setEndTime(newEnd);
          setPredicting(false);
          return;
        }
      }
      // Otherwise, use AI prediction
      setPredicting(true);
      predictTaskDuration(model, vocabMap, trimmedTitle).then((pred) => {
        if (!cancelled) {
          setDuration(pred);
          // Update end time based on prediction
          const newEnd = new Date(startTime.getTime() + pred * 60000);
          setEndTime(newEnd);
        }
      }).finally(() => setPredicting(false));
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, model, startTime, events]);

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
    // Update end time based on duration
    setEndTime(new Date(newStartTime.getTime() + duration * 60000));
  };

  // Duration input handler
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 5) val = 5;
    val = Math.round(val / 5) * 5;
    setDuration(val);
    setEndTime(new Date(startTime.getTime() + val * 60000));
  };

  const formatDateTimeLocal = (date: Date) => {
    return date.toISOString().slice(0, 16);
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
                Duration (min)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={handleDurationChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={predicting}
              />
              {predicting && <span className="text-xs text-gray-400">AI predicting…</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(endTime)}
                readOnly
                className="w-full px-2 py-1 border border-gray-300 rounded-md bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
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
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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
