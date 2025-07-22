import React from 'react';
import { createPortal } from 'react-dom';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function AnalyticsModal({ isOpen, onClose, children }: AnalyticsModalProps) {
  if (typeof window === 'undefined') return null;
  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ width: '100vw', height: '100vh', zIndex: 9999 }}
    >
      {/* Background overlay */}
      <div
        className={`fixed inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(2px)', zIndex: 9998 }}
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{
          width: '70vw',
          height: '70vh',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
