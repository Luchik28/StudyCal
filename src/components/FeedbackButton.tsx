import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function FeedbackButton() {
  return (
    <a
      href="https://forms.gle/oYU71HoKRAuDeVMe7"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-300 transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
      aria-label="Give Feedback"
      style={{ minWidth: 0 }}
    >
      <MessageCircle size={18} className="text-gray-500" />
      <span className="hidden sm:inline">Feedback</span>
    </a>
  );
}
