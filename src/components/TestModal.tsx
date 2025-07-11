// Test component to debug modal overlay issues
'use client';

import React, { useState } from 'react';

export function TestModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-50"
      >
        Test Modal
      </button>
      
      {/* Test Modal */}
      <div 
        className={`fixed inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ 
          zIndex: 70,
          backgroundColor: 'rgba(255, 0, 0, 0.1)' // Red tint to make it obvious
        }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold mb-4">Test Modal</h2>
            <p className="mb-4">Can you see the calendar behind this modal?</p>
            <button 
              onClick={() => setIsOpen(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
