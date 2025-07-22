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
      className={`fixed inset-0 flex items-center justify-center ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ width: '100vw', height: '100vh', zIndex: 9999, transition: 'none' }}
    >
      {/* Background overlay */}
      <div
        className={`fixed inset-0 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(2px)', zIndex: 9998, transition: 'none' }}
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-2xl ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{
          width: '70vw',
          height: '70vh',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          transition: 'none',
        }}
      >
        {/* Content (header and close button now handled by children) */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
