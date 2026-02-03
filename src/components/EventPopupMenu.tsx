'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, Trash2, Clock } from 'lucide-react';
import { Event } from '@/types/events';
import { formatTimeRange } from '@/utils/timeFormat';
import { adjustPopupPosition, setupPopupResizeObserver } from '@/utils/popupPositioning';

interface EventPopupMenuProps {
  event: Event;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => Promise<void>;
}

export function EventPopupMenu({ 
  event, 
  isOpen, 
  position, 
  onClose, 
  onEdit, 
  onDelete 
}: EventPopupMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number }>(position);
  const [isPositioned, setIsPositioned] = useState(false);

  // Adjust position when popup renders or size changes
  const adjustPosition = () => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const adjusted = adjustPopupPosition(position, rect.width, rect.height);
    setAdjustedPosition(adjusted);
  };

  // Handle initial render and monitor for size changes
  useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      return;
    }

    // Use double RAF to ensure element is rendered and measured before showing
    const rafId1 = requestAnimationFrame(() => {
      const rafId2 = requestAnimationFrame(() => {
        adjustPosition();
        setIsPositioned(true);
      });
    });

    // Use ResizeObserver to track size changes (e.g., when dropdowns expand)
    const cleanup = setupPopupResizeObserver(menuRef.current, adjustPosition);

    return () => {
      cleanup();
    };
  }, [isOpen, position]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Mark this as a popup dismissal click to prevent calendar actions
        (event as MouseEvent & { _popupDismissalClick?: boolean })._popupDismissalClick = true;
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(event);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await onDelete(event);
        onClose();
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete event: ' + (error instanceof Error ? error.message : String(error)));
        // Keep popup open on error so user can try again
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
      style={{ 
        left: adjustedPosition.x, 
        top: adjustedPosition.y,
        opacity: isPositioned ? 1 : 0,
        pointerEvents: isPositioned ? 'auto' : 'none'
      }}
    >
        {/* Event Info Header */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="font-medium text-gray-900 text-sm truncate">
            {event.title}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeRange(event.startTime, event.endTime, '12h')}
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <button
            onClick={handleEdit}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-3 text-gray-400" />
            Edit Event
          </button>
          
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-3 text-red-400" />
            Delete Event
          </button>
        </div>
      </div>,
      document.body
    );
}
