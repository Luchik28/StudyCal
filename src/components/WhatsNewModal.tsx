"use client";
import React, { useEffect, useState } from "react";
import { useEvents } from "@/contexts/EventsContext";

const STORAGE_KEY = "multiCalendarAnnouncementSeen";

export default function WhatsNewModal() {
  const [show, setShow] = useState(false);
  const { events } = useEvents();

  useEffect(() => {
    // Only show if:
    // 1. User completed onboarding (existing user)
    // 2. User has existing events stored
    // 3. User hasn't seen this announcement yet
    const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
    const alreadySeen = localStorage.getItem(STORAGE_KEY) === "true";
    const hasExistingEvents = events.length > 0;
    
    if (onboardingComplete && hasExistingEvents && !alreadySeen) {
      const timer = setTimeout(() => setShow(true), 300);
      return () => clearTimeout(timer);
    }
  }, [events]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-black mb-4">
          Multi-Calendar Support
        </h2>
        
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Based on user feedback, you can now add multiple Google Calendars and create 
          multiple local calendars to better organize your schedule. Toggle calendar 
          visibility from the sidebar, and events will sync both ways with Google Calendar.
        </p>

        <p className="text-gray-700 text-sm leading-relaxed mb-6">
          If you had Google Calendar connected before, you&apos;ll need to re-add it in 
          Settings. All your existing events have been preserved.
        </p>

        {/* Warning */}
        <div className="bg-gray-100 border border-gray-300 rounded-md p-3 mb-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Note:</span> To reconnect Google Calendar, go to 
            Settings → click the + button next to &quot;Calendars&quot; → Connect Google Calendar.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-2 px-4 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

