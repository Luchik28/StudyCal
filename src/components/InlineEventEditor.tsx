'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Calendar } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { Event } from '@/types/events';
import { format } from 'date-fns';

interface InlineEventEditorProps {
  event: Event;
  eventElement: HTMLElement | null;
  onCancel: () => void;
}

export function InlineEventEditor({ 
  event,
  eventElement,
  onCancel
}: InlineEventEditorProps) {
  const { updateEvent, deleteEvent } = useEvents();
  const { calendars, getCalendarById } = useCalendars();
  
  // Category and subcategory options (matching the AI classification maps)
  const categories = ['Work', 'Personal', 'Social', 'Health', 'Education', 'Travel'];
  const subcategories = [
    'Activity', 'Appointment', 'Chore/Errand', 'Class', 'Event',
    'Extra-Curricular', 'Gathering', 'Logistics', 'Meeting', 'Other',
    'Social/Family', 'Study Session', 'Task/Project Work', 'Test/Exam', 'Trip'
  ];

  const [title, setTitle] = useState(event.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [category, setCategory] = useState(event.category || '');
  const [subcategory, setSubcategory] = useState(event.subcategory !== undefined ? event.subcategory : '');
  const [selectedCalendarId, setSelectedCalendarId] = useState(event.calendarId || 'local-default');

  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Calculate position for the popup form
  const [formPosition, setFormPosition] = useState<{ left: number; top: number; side: 'left' | 'right' }>({
    left: 0,
    top: 0,
    side: 'right'
  });

  useEffect(() => {
    console.log('InlineEventEditor mounted/updated', { 
      eventTitle: event.title, 
      hasEventElement: !!eventElement,
      formRefCurrent: !!formRef.current
    });
    
    if (eventElement && formRef.current) {
      const eventRect = eventElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      // If the event is in the daily view (width > 300px), center the popup over the event
      if (eventRect.width > 300) {
        setFormPosition({
          left: eventRect.left + eventRect.width / 2 - 160, // 320px / 2
          top: eventRect.top + eventRect.height / 2 - 120, // 240px / 2
          side: 'right'
        });
      } else {
        // Determine which side to show the form on (week/month view)
        const showOnLeft = eventRect.right + 320 > viewportWidth;
        setFormPosition({
          left: showOnLeft ? eventRect.left - 320 - 10 : eventRect.right + 10,
          top: eventRect.top,
          side: showOnLeft ? 'left' as const : 'right' as const
        });
      }
    }
  }, [eventElement, event.title]);

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    if (title.trim() !== event.title) {
      updateEvent(event.id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitle(event.title);
      setIsEditingTitle(false);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; // HH:mm format
    const [hours, minutes] = timeValue.split(':').map(Number);
    
    const newStartTime = new Date(startTime);
    newStartTime.setHours(hours, minutes, 0, 0);
    setStartTime(newStartTime);
    
    // Ensure end time is at least 15 minutes after start time
    if (endTime <= newStartTime) {
      const newEndTime = new Date(newStartTime.getTime() + 15 * 60 * 1000);
      setEndTime(newEndTime);
      updateEvent(event.id, { startTime: newStartTime, endTime: newEndTime });
    } else {
      updateEvent(event.id, { startTime: newStartTime });
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; // HH:mm format
    const [hours, minutes] = timeValue.split(':').map(Number);
    
    const newEndTime = new Date(endTime);
    newEndTime.setHours(hours, minutes, 0, 0);
    
    // Ensure end time is at least 15 minutes after start time
    if (newEndTime > startTime) {
      setEndTime(newEndTime);
      updateEvent(event.id, { endTime: newEndTime });
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    updateEvent(event.id, { category: newCategory });
  };

  const handleSubcategoryChange = (newSubcategory: string) => {
    setSubcategory(newSubcategory);
    updateEvent(event.id, { subcategory: newSubcategory });
  };

  const handleCalendarChange = (newCalendarId: string) => {
    setSelectedCalendarId(newCalendarId);
    updateEvent(event.id, { calendarId: newCalendarId });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id);
      onCancel();
    }
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
          left: formPosition.left,
          top: formPosition.top,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="flex-1 mr-2 px-2 py-1 border border-blue-300 rounded text-lg font-semibold text-gray-900 bg-blue-50"
            />
          ) : (
            <h3 
              className="flex-1 mr-2 text-lg font-semibold text-gray-900 truncate cursor-text hover:bg-gray-50 hover:border hover:border-gray-300 hover:rounded px-2 py-1 -mx-2 -my-1 transition-all"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h3>
          )}
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Time bubbles */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="time"
              value={format(startTime, 'HH:mm')}
              onChange={handleStartTimeChange}
              className="border rounded px-2 py-1 text-xs text-gray-900 bg-green-50 cursor-pointer"
            />
            <span className="text-gray-500">-</span>
            <input
              type="time"
              value={format(endTime, 'HH:mm')}
              onChange={handleEndTimeChange}
              className="border rounded px-2 py-1 text-xs text-gray-900 bg-green-50 cursor-pointer"
            />
          </div>

          {/* Category and Subcategory dropdowns */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border rounded px-2 py-1 text-xs text-gray-900 bg-blue-50 cursor-pointer"
            >
              <option value="">Category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={subcategory || ''}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              className="border rounded px-2 py-1 text-xs text-gray-900 bg-purple-50 cursor-pointer"
            >
              <option value="">Type...</option>
              {subcategories.map(subcat => (
                <option key={subcat} value={subcat}>{subcat}</option>
              ))}
            </select>
          </div>

          {/* Calendar picker */}
          {calendars.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar size={12} className="text-gray-500" />
              <select
                value={selectedCalendarId}
                onChange={(e) => handleCalendarChange(e.target.value)}
                className="border rounded px-2 py-1 text-xs text-gray-900 bg-gray-50 cursor-pointer flex-1"
              >
                {calendars.map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Show current calendar if only one */}
          {calendars.length === 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={12} />
              <span>{calendars[0]?.name || 'My Calendar'}</span>
            </div>
          )}

          {/* Delete button */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors text-xs"
            >
              <Trash2 size={14} />
              Delete Event
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
