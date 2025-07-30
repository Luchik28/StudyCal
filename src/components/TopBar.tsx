'use client';

import Link from 'next/link';
import { Calendar, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function TopBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto relative">
      <Link href="/" className="flex items-center gap-2">
        <Calendar className="w-6 h-6 text-blue-600" />
        <span className="text-xl font-semibold text-gray-900">StudyCal</span>
      </Link>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <Link href="/calendar" className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all duration-200 text-base">Get Started</Link>
        <a href="https://forms.gle/AtnRLBGZjGq8h9eM7" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">Give Feedback</a>
      </div>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden">
          <div className="px-6 py-4 space-y-4">
            <Link href="/calendar" className="block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all duration-200 text-base" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
            <a href="https://forms.gle/AtnRLBGZjGq8h9eM7" target="_blank" rel="noopener noreferrer" className="block text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Give Feedback</a>
          </div>
        </div>
      )}
    </nav>
  );
}
