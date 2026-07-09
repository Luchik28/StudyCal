'use client';

import React from 'react';
import { X, Calendar, Repeat, ArrowRight } from 'lucide-react';

export type RecurrenceEditOption = 'this' | 'all' | 'thisAndFuture';

interface RecurrenceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: RecurrenceEditOption) => void;
  action: 'edit' | 'delete';
  eventTitle: string;
}

export function RecurrenceEditModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  action,
  eventTitle 
}: RecurrenceEditModalProps) {
  if (!isOpen) return null;

  const actionText = action === 'edit' ? 'Edit' : 'Delete';
  const actionTextLower = action === 'edit' ? 'edit' : 'delete';

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-[80]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Repeat size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">{actionText} Recurring Event</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            &quot;{eventTitle}&quot; is a recurring event. How would you like to {actionTextLower} it?
          </p>

          <div className="space-y-2">
            {/* This event only */}
            <button
              onClick={() => onSelect('this')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center">
                <Calendar size={18} className="text-gray-700 group-hover:text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">This event only</p>
                <p className="text-sm text-gray-600">Only {actionTextLower} this occurrence</p>
              </div>
            </button>

            {/* This and future events */}
            <button
              onClick={() => onSelect('thisAndFuture')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center">
                <ArrowRight size={18} className="text-gray-700 group-hover:text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">This and future events</p>
                <p className="text-sm text-gray-600">{actionText} this and all future occurrences</p>
              </div>
            </button>

            {/* All events */}
            <button
              onClick={() => onSelect('all')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center">
                <Repeat size={18} className="text-gray-700 group-hover:text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">All events</p>
                <p className="text-sm text-gray-600">{actionText} all occurrences in this series</p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
