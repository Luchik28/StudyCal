'use client';

import Link from 'next/link';
import { Calendar, Brain, Share, Link2, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const rotatingTexts = [
  'Schedule',
  'Life',
  'Calendar', 
  'Studying',
  'Work Life',
  'Student Life',
  'Time Management'
];

export default function LandingPage() {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState({ card0: 0, card1: 0, card2: 0, card3: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardSectionRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    console.log('Animation effect starting...');
    
    // Initial display of "Schedule"
    setDisplayedText(rotatingTexts[0]);
    
    let wordIndex = 0;
    let animationTimeouts: NodeJS.Timeout[] = [];
    let animationIntervals: NodeJS.Timeout[] = [];
    
    const clearAllTimers = () => {
      animationTimeouts.forEach(timeout => clearTimeout(timeout));
      animationIntervals.forEach(interval => clearInterval(interval));
      animationTimeouts = [];
      animationIntervals = [];
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    
    const runAnimation = () => {
      // Don't run animation if page is not visible
      if (!isPageVisible) return;
      
      const word = rotatingTexts[wordIndex];
      
      // Show word for 1 second
      const showTimeout = setTimeout(() => {
        if (!isPageVisible) return;
        
        setIsTyping(true);
        
        // Delete animation
        let deleteLength = word.length;
        const deleteInterval = setInterval(() => {
          if (!isPageVisible) return;
          
          deleteLength--;
          setDisplayedText(word.substring(0, deleteLength));
          
          if (deleteLength === 0) {
            clearInterval(deleteInterval);
            
            // Move to next word
            wordIndex = (wordIndex + 1) % rotatingTexts.length;
            const nextWord = rotatingTexts[wordIndex];
            
            // Type animation
            let typeLength = 0;
            const typeInterval = setInterval(() => {
              if (!isPageVisible) return;
              
              typeLength++;
              setDisplayedText(nextWord.substring(0, typeLength));
              
              if (typeLength === nextWord.length) {
                clearInterval(typeInterval);
                setIsTyping(false);
              }
            }, 50);
            
            animationIntervals.push(typeInterval);
          }
        }, 40);
        
        animationIntervals.push(deleteInterval);
      }, 1000);
      
      animationTimeouts.push(showTimeout);
    };
    
    // Only start animation if page is visible
    if (isPageVisible) {
      // Initial delay, then start cycling
      timeoutRef.current = setTimeout(() => {
        if (!isPageVisible) return;
        
        runAnimation();
        intervalRef.current = setInterval(() => {
          if (isPageVisible) {
            runAnimation();
          }
        }, 2000);
      }, 2000);
    }
    
    return () => {
      clearAllTimers();
    };
  }, [isPageVisible]); // Depend on page visibility

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
            href="/calendar"
            className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all duration-200 text-base"
          >
            Get Started
          </Link>
          <Link 
            href="/blog"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Blog
          </Link>
          <a 
            href="https://forms.gle/AtnRLBGZjGq8h9eM7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Give Feedback
          </a>
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
                href="/calendar"
                className="block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all duration-200 text-base"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </Link>
              <Link 
                href="/blog"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <a 
                href="https://forms.gle/AtnRLBGZjGq8h9eM7"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Give Feedback
              </a>
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
              <span className="text-blue-600">
                {displayedText}
                <span className={`inline-block w-1 h-[0.9em] bg-blue-600 ml-1 ${isTyping ? 'animate-pulse' : 'animate-blink'}`}></span>
              </span>
            </span>
          </h1>
        </div>
        
        <div className="pb-8">
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            StudyCal is an AI calendar and task management platform for students that analyzes your schedule and offers intelligent suggestions.
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
        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-12 ${isMobile ? 'space-y-12' : 'sticky top-1/2 transform -translate-y-1/2'}`}>
          {/* Auto-Schedule */}
          <div 
            className={`text-center p-8 ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card0,
              transform: `translateY(${(1 - currentCardIndex.card0) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Brain className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-mono">Auto-Schedule</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              Studycal will automatically block out time for all of your tasks, keeping in mind your current events, optimally timed breaks, and perfectly spaced study sessions. This scheduler app helps you plan your day with intelligent time management.
            </p>
          </div>

          {/* In-depth Analytics */}
          <div 
            className={`text-center p-8 ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card1,
              transform: `translateY(${(1 - currentCardIndex.card1) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Calendar className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-mono">In-depth Analytics</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              StudyCal classifies all of your events and provides you with insights into how you spend your focus time through beautiful charts and graphs. Get detailed schedule management analytics to optimize your productivity.
            </p>
          </div>

          {/* Intelligent Suggestions */}
          <div 
            className={`text-center p-8 ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card2,
              transform: `translateY(${(1 - currentCardIndex.card2) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Share className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-mono">Intelligent Suggestions</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              StudyCal analyzes your schedule and offers suggestions that optimize work-life balance, help you achieve your goals, and ensure you have the most optimal studying schedule. Advanced time management tools help you plan your day more effectively.
            </p>
          </div>

          {/* Google Calendar Integration */}
          <div 
            className={`text-center p-8 ${isMobile ? 'animate-fade-up opacity-100' : ''}`}
            style={isMobile ? {} : {
              opacity: currentCardIndex.card3,
              transform: `translateY(${(1 - currentCardIndex.card3) * 100}vh)`,
              transition: 'none' // Remove CSS transitions for direct scroll control
            }}
          >
            <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Link2 className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-mono">Google Calendar Sync</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              Seamlessly sync with your existing Google Calendar. All your events, classes, and commitments automatically integrate for complete schedule optimization and task management.
            </p>
          </div>
        </div>
      </section>      {/* Make Your Calendar Work Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-mono">Make your Calendar Work as Hard as You Do</h2>
          <p className="text-xl text-gray-600 mb-16">StudyCal squeezes every drop of performance from your calendar, turning it into a precision-engineered productivity machine with intelligent time blocks and schedule management.</p>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-4xl mb-6">⚡</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-mono">Maximum Efficiency</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Every minute is optimized. StudyCal analyzes your energy patterns, deadlines, and commitments to create the most efficient schedule possible with dedicated focus time. No wasted time, no missed opportunities.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-6">🎯</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-mono">Precision Scheduling</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                StudyCal makes intelligent, split-second decisions about your time blocks. It knows when you&apos;re most productive, when you need breaks, and how to perfectly balance work and life through smart time management.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-6">🚀</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-mono">Performance Amplification</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Your calendar becomes a high-performance engine. StudyCal doesn&apos;t just organize your time—it amplifies your capabilities, turning ordinary schedules into extraordinary productivity systems.
              </p>
            </div>
          </div>
        </div>
      </section>      {/* CTA Section */}
      <section className="px-6 py-24 text-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-mono">
            Stop planning manually.
            <br />
            <span className="text-blue-600 font-mono">Start using AI Calendar optimization.</span>
          </h2>
          
          <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
            Completely free, no download, no signup. Experience the future of student life management with AI-powered schedule management and task organization.
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
            <Link 
              href="/blog"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Blog
            </Link>
            <a
              href="https://studycal.app/privacy-policy/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <Link 
              href="/how-to-use"
              className="text-gray-400 hover:text-white transition-colors"
            >
              How to use
            </Link>
            <a 
              href="https://forms.gle/AtnRLBGZjGq8h9eM7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Give Feedback
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}