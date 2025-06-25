'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialHour?: number;
}

export function CreateEventModal({ isOpen, onClose, initialDate, initialHour }: CreateEventModalProps) {
  const { addEvent } = useEvents();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(() => {
    if (initialDate && initialHour !== undefined) {
      const date = new Date(initialDate);
      date.setHours(initialHour, 0, 0, 0);
      return date.toISOString().slice(0, 16);
    }
    return '';
  });
  const [endTime, setEndTime] = useState(() => {
    if (initialDate && initialHour !== undefined) {
      const date = new Date(initialDate);
      date.setHours(initialHour + 1, 0, 0, 0);
      return date.toISOString().slice(0, 16);
    }
    return '';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && startTime && endTime) {
      addEvent(title, new Date(startTime), new Date(endTime));
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event title"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
