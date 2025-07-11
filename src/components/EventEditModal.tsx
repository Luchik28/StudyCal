'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Type, FileText, Trash2 } from 'lucide-react';
import { Event } from '@/types/events';
import { useEvents } from '@/contexts/EventsContext';
import { format } from 'date-fns';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export function EventEditModal({ isOpen, onClose, event }: EventEditModalProps) {
  const { updateEvent, deleteEvent } = useEvents();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(format(event.startTime, 'yyyy-MM-dd'));
      setStartTime(format(event.startTime, 'HH:mm'));
      setEndTime(format(event.endTime, 'HH:mm'));
    }
  }, [event]);

  const handleSave = () => {
    if (!event || !title.trim()) return;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    // Validate that end time is after start time
    if (endDateTime <= startDateTime) {
      alert('End time must be after start time');
      return;
    }

    updateEvent(event.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startDateTime,
      endTime: endDateTime,
      dayOfWeek: startDateTime.getDay(),
    });

    onClose();
  };

  const handleDelete = () => {
    if (!event) return;
    
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen && event ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ zIndex: 60, backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(1px)' }}>
      {event && (
        <div className={`bg-white rounded-lg shadow-lg w-full max-w-md transition-all duration-300 ${isOpen && event ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Type size={16} className="inline mr-1" />
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="inline mr-1" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event description (optional)"
              rows={3}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} className="inline mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
