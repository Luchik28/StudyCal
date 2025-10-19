'use client';

import { useEffect, useState } from 'react';

// Floating feedback control that:
// - Opens the Google Form when clicked
// - On hover, slides slightly right and reveals a dismiss (X) control on the right
// - On dismiss, hides permanently by saving a flag in localStorage
export default function FeedbackWidget() {
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe18gglGF_rzWOhiquN9vRSyIZN78MZqxSeCeFURStYUwydlA/viewform?usp=header';
  const STORAGE_KEY = 'feedbackWidget:dismissed';

  const [hidden, setHidden] = useState(true);
  const [thanking, setThanking] = useState(false);

  useEffect(() => {
    try {
      const dismissed = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === '1' : false;
      setHidden(dismissed);
    } catch {
      setHidden(false);
    }
  }, []);

  const openForm = () => {
    try {
      // @ts-expect-error - gtag is added by Google Analytics script
      if (typeof window !== 'undefined' && window.gtag) {
        // @ts-expect-error - gtag function signature
        window.gtag('event', 'feedback_open', { event_category: 'engagement' });
      }
    } catch {}
    window.open(FORM_URL, '_blank', 'noopener,noreferrer');
    // Show thanks, then hide and persist after a short delay
    setThanking(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setTimeout(() => {
      setHidden(true);
    }, 2000);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      // @ts-expect-error - gtag is added by Google Analytics script
      if (typeof window !== 'undefined' && window.gtag) {
        // @ts-expect-error - gtag function signature
        window.gtag('event', 'feedback_dismiss', { event_category: 'engagement' });
      }
    } catch {}
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[11000] flex items-center group select-none">
      {/* Main action button */}
      <button
        aria-label="Give feedback"
        onClick={openForm}
        className={`rounded-full text-white shadow-lg px-4 py-3 text-sm font-semibold transition-all duration-200 transform group-hover:translate-x-1 group-hover:pr-6 ${thanking ? 'bg-green-600 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {thanking ? 'Thanks!' : 'Give Feedback'}
      </button>

      {/* Dismiss (X) control revealed on hover */}
      <button
        aria-label="Dismiss feedback button"
        onClick={dismiss}
        className="ml-0 w-0 overflow-hidden opacity-0 scale-75 rounded-full border border-gray-300 bg-white text-gray-700 shadow transition-all duration-200 group-hover:ml-2 group-hover:w-8 group-hover:h-8 group-hover:opacity-100 group-hover:scale-100 flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}
