'use client';

import Link from 'next/link';
import { Calendar, Brain, Share, CheckCircle, Link2, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const rotatingTexts = [
  'Schedule',
  'Life',
  'Calendar', 
  'Studying',
  'Work-Life Balance',
  'Student Life',
  'Time Management'
];

export default function LandingPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState({ card0: 0, card1: 0, card2: 0, card3: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardSectionRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    console.log('Animation effect starting...');
    
    // Initial 5 second delay before any cycling starts
    const initialTimeout = setTimeout(() => {
      console.log('Starting word rotation...');
      
      const runCycle = () => {
        // Wait for display time then start animation
        setTimeout(() => {
          console.log('Starting fade...');
          setIsAnimating(true);
          
          // After fade completes, update word and fade in
          setTimeout(() => {
            setCurrentWordIndex(prev => {
              const nextIndex = (prev + 1) % rotatingTexts.length;
              console.log('Switching to:', rotatingTexts[nextIndex]);
              return nextIndex;
            });
            setIsAnimating(false);
          }, 1000);
        }, 3000);
      };
      
      // Start the first cycle
      runCycle();
      
      // Set up interval for subsequent cycles
      intervalRef.current = setInterval(() => {
        runCycle();
      }, 4000); // 3s display + 1s animation = 4s total
      
    }, 5000);
    
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // No dependencies to avoid re-running

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Scroll-based card animations (desktop only)
  useEffect(() => {
    if (isMobile) {
      // On mobile, show all cards immediately with simple animation
      setCurrentCardIndex({ card0: 1, card1: 1, card2: 1, card3: 1 });
      return;
    }

    const handleScroll = () => {
      if (!cardSectionRef.current || isScrollingRef.current) return;
      
      const section = cardSectionRef.current;
      const sectionRect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Check if we're in the card section area (button just out of view)
      if (sectionRect.top <= 100 && sectionRect.bottom > viewportHeight / 2) {
        // Calculate scroll progress within the card section
        const sectionHeight = section.offsetHeight;
        const scrolled = Math.max(0, 100 - sectionRect.top);
        // Adjust progress calculation to include pause after last card
        const totalScrollableDistance = sectionHeight * 0.6; // Use less of the section for card progression
        const progress = Math.min(1, scrolled / totalScrollableDistance);
        
        // Determine current active card based on progress with better spacing
        const cardProgressData = {
          card0: Math.max(0, Math.min(1, (progress - 0.05) / 0.2)), // Card 0: 5%-25%
          card1: Math.max(0, Math.min(1, (progress - 0.25) / 0.2)), // Card 1: 25%-45%
          card2: Math.max(0, Math.min(1, (progress - 0.45) / 0.2)), // Card 2: 45%-65%
          card3: Math.max(0, Math.min(1, (progress - 0.65) / 0.2)), // Card 3: 65%-85%
        };
        
        setCurrentCardIndex(cardProgressData);
      } else if (sectionRect.top > 100) {
        // Above the section
        setCurrentCardIndex({ card0: 0, card1: 0, card2: 0, card3: 0 });
      } else {
        // Below the section - all cards visible
        setCurrentCardIndex({ card0: 1, card1: 1, card2: 1, card3: 1 });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]); // Add isMobile dependency

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto relative">
        <Link href="/" className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">StudyCal</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            href="/how-to-use"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            How to use →
          </Link>
          <Link 
            href="https://studycal.app/privacy-policy/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Privacy Policy →
          </Link>
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
              <Link 
                href="/how-to-use"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How to use →
              </Link>
              <Link 
                href="https://studycal.app/privacy-policy/"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Privacy Policy →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="text-center px-6 py-32 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-gray-900 mb-8 leading-tight font-mono">
            Optimize Your{' '}
            <span className="block mt-4 relative overflow-hidden h-[1.2em]">
              <span 
                className={`absolute left-0 right-0 text-blue-600 transition-opacity duration-1000 ease-in-out ${
                  isAnimating ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {rotatingTexts[currentWordIndex]}
              </span>
            </span>
          </h1>
        </div>
        
        <div className="pb-8">
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            StudyCal is an AI powered calendar for students that analyzes your schedule and offers suggestions to improve it.
          </p>
          
          <Link 
            href="/calendar"
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-full text-xl font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Let AI Optimize Your Life →
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Completely Free • No Download • No Signup
          </p>
        </div>
      </section>      {/* Feature Sections */}
      <section ref={cardSectionRef} className={`px-6 py-20 max-w-7xl mx-auto ${isMobile ? 'min-h-auto' : 'min-h-[400vh]'}`}>
        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 ${isMobile ? 'space-y-8' : 'sticky top-1/2 transform -translate-y-1/2'}`}>
          {/* Auto-Schedule */}
          <div 
            className={`text-center ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card0,
              transform: `translateY(${(1 - currentCardIndex.card0) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Auto-Schedule</h3>
            <p className="text-gray-600 text-sm">
              Studycal will block out time for all of your tasks, keeping in mind your current events, optimally timed breaks, and perfectly spaced study sessions.
            </p>
          </div>

          {/* In-depth Analytics */}
          <div 
            className={`text-center ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card1,
              transform: `translateY(${(1 - currentCardIndex.card1) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">In-depth Analytics</h3>
            <p className="text-gray-600 text-sm">
              StudyCal classifies all of your events and provides you with insights into how you spend your time though beautiful charts and graphs.
            </p>
          </div>

          {/* Intelligent Suggestions */}
          <div 
            className={`text-center ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card2,
              transform: `translateY(${(1 - currentCardIndex.card2) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Share className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Intelligent Suggestions</h3>
            <p className="text-gray-600 text-sm">
              StudyCal analyzes your schedule and offers suggestions that optimize work-life balance, help you achieve your goals, and ensure you have the most optimal studying schedule.
            </p>
          </div>

          {/* Google Calendar Integration */}
          <div 
            className={`text-center ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card3,
              transform: `translateY(${(1 - currentCardIndex.card3) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Link2 className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Google Calendar Sync</h3>
            <p className="text-gray-600 text-sm">
              Seamlessly sync with your existing Google Calendar. All your events, classes, and commitments automatically integrate for complete schedule optimization.
            </p>
          </div>
        </div>
      </section>      {/* Perfect For Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">AI optimization works for</h2>
          <p className="text-xl text-gray-600 mb-12">Every aspect of student life gets automatically optimized</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-gray-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>exam preparation timing</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>optimal study sessions</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>work-life balance</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>social event scheduling</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>assignment deadlines</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>energy management</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>break timing</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>productivity patterns</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>stress prevention</span>
            </div>
          </div>
        </div>
      </section>      {/* Benefits Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why AI optimization changes everything</h2>
          <p className="text-xl text-gray-600">Manual planning is exhausting. Let AI do the heavy lifting.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-16">
          <div className="text-center">
            <div className="text-3xl mb-6">🧠</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Thinks for you</h3>
            <p className="text-gray-600 text-lg">
              No more spending hours planning your week. AI analyzes thousands of variables instantly and creates the optimal schedule for your unique life.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-6">📈</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Improves constantly</h3>
            <p className="text-gray-600 text-lg">
              Every completed task teaches the AI more about you. Your calendar becomes smarter and more personalized each day you use it.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-6">⚡</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Works instantly</h3>
            <p className="text-gray-600 text-lg">
              Add an event and watch AI instantly reorganize everything else to optimize your time, energy, and academic performance.
            </p>
          </div>
        </div>
      </section>      {/* CTA Section */}
      <section className="px-6 py-24 text-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Stop planning manually.
            <br />
            <span className="text-blue-600">Start living optimally.</span>
          </h2>
          
          <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
            Completely free, no download, no signup. Experience the future of student life management with AI.
          </p>
          
          <Link 
            href="/calendar"
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-12 py-6 rounded-full text-xl font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-2xl mb-6"
          >
            Experience AI Optimization →
          </Link>
          
          <p className="text-sm text-gray-500">
            Free forever • No download • No signup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">StudyCal</span>
          </div>
          
          <p className="text-gray-400 text-sm mb-6">
            © StudyCal 2025
            <br />
            Independently made
            <br />
            100% free forever
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link 
              href="/calendar"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Give it a spin
            </Link>
            <a
              href="https://studycal.app/privacy-policy/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy →
            </a>
            <Link 
              href="/how-to-use"
              className="text-gray-400 hover:text-white transition-colors"
            >
              How to use →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}