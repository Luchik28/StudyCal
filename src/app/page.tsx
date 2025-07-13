'use client';

import Link from 'next/link';
import { Calendar, Brain, Lightbulb, Clock, Star, Users, CheckCircle, ArrowRight, BarChart3, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Navigation */}
      <div className="absolute top-0 right-0 z-50 p-4">
        <Link 
          href="/privacy-policy"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>

      {/* Hero Section with 3D Effects */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full md:top-20 md:left-20 top-10 left-4 md:w-32 md:h-32 w-20 h-20"
            style={{ transform: `translateY(${scrollY * 0.3}px) rotate(${scrollY * 0.1}deg)` }}
          />
          <div 
            className="absolute top-40 right-32 w-24 h-24 bg-purple-200 rounded-lg md:top-40 md:right-32 top-20 right-4 md:w-24 md:h-24 w-16 h-16"
            style={{ transform: `translateY(${scrollY * -0.2}px) rotate(${scrollY * -0.1}deg)` }}
          />
          <div 
            className="absolute bottom-40 left-32 w-20 h-20 bg-green-200 rounded-full md:bottom-40 md:left-32 bottom-32 left-4 md:w-20 md:h-20 w-14 h-14"
            style={{ transform: `translateY(${scrollY * 0.4}px) rotate(${scrollY * 0.2}deg)` }}
          />
          <div 
            className="absolute bottom-20 right-20 w-28 h-28 bg-yellow-200 rounded-lg md:bottom-20 md:right-20 bottom-16 right-4 md:w-28 md:h-28 w-16 h-16"
            style={{ transform: `translateY(${scrollY * -0.3}px) rotate(${scrollY * -0.15}deg)` }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 md:px-6">
          <div 
            className="mb-6 md:mb-8"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          >
            <div className="inline-flex items-center gap-2 md:gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 mb-4 md:mb-6 shadow-lg">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              <span className="text-base md:text-lg font-semibold text-gray-800">StudyCal</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Your Student
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Calendar
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-2">
              The smart calendar designed for student life. Seamlessly manage academics, work, and personal time 
              with AI-powered insights that help you succeed.
            </p>

            <div className="bg-green-100 border border-green-300 rounded-lg px-3 md:px-4 py-2 inline-block mb-6 md:mb-8">
              <span className="text-green-800 font-medium text-sm md:text-base">💯 Completely Free Forever</span>
            </div>
          </div>

          {/* Main CTA */}
          <div 
            className="space-y-3 md:space-y-4 mb-16 md:mb-8"
            style={{ transform: `translateY(${scrollY * -0.05}px)` }}
          >
            <Link 
              href="/calendar"
              className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
              Start Organizing Now
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
            
            <p className="text-xs md:text-sm text-gray-500 px-4">No signup required • Works in your browser</p>
          </div>
        </div>

        {/* Scroll Indicator - Hidden on mobile to prevent overlap */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Students Choose This Calendar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for student life, balancing academics with everything else that matters
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Suggestions */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Suggestions</h3>
              <p className="text-gray-600 mb-6">
                Get personalized scheduling recommendations, exam prep timelines, and work-life balance tips 
                based on your schedule.
              </p>
              <Link 
                href="/calendar"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Try AI Suggestions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Google Calendar Integration */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Google Calendar Sync</h3>
              <p className="text-gray-600 mb-6">
                Seamlessly sync with your existing Google Calendar. All your events stay in sync across devices 
                while you get the AI-powered student features.
              </p>
              <Link 
                href="/calendar"
                className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Connect Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Smart Scheduling */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Exam Prep</h3>
              <p className="text-gray-600 mb-6">
                Automatically suggests optimal study sessions before exams using spaced repetition 
                and your available calendar slots.
              </p>
              <Link 
                href="/calendar"
                className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* AI Analytics */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Analytics</h3>
              <p className="text-gray-600 mb-6">
                AI automatically classifies your events and provides detailed insights into how you spend your time, 
                helping you optimize your student life balance.
              </p>
              <Link 
                href="/calendar"
                className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
              >
                View Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Everything You Need for Student Life
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                From academic deadlines to social events, we&apos;ve got your entire student life organized.
              </p>
              
              <div className="space-y-4">
                {[
                  'AI suggests optimal times for studying, work, and personal activities',
                  'Tracks your academic-life balance and suggests breaks',
                  'Helps you prepare for exams with intelligent scheduling',
                  'Works offline - all data stored securely in your browser',
                  'Optional Google Calendar sync for convenience'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link 
                  href="/calendar"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Star className="w-5 h-5" />
                  Start Your Organized Life
                </Link>
              </div>
            </div>

            <div className="relative">
              {/* Mock Calendar Preview with 3D effect */}
              <div 
                className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-1 transition-transform duration-300"
                style={{ transform: `rotateY(${scrollY * 0.01}deg) rotateX(${scrollY * 0.005}deg)` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-800">This Week</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-blue-100 text-blue-800 p-2 rounded text-sm">📚 Math Study Session</div>
                  <div className="bg-green-100 text-green-800 p-2 rounded text-sm">🧪 Chemistry Lab</div>
                  <div className="bg-purple-100 text-purple-800 p-2 rounded text-sm">📝 Essay Writing</div>
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-sm">⚽ Soccer Practice</div>
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lightbulb className="w-4 h-4" />
                    <span>AI Suggestion: Add 30min break after study session</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Student Life?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Experience the power of a calendar that truly understands student life and helps you thrive.
          </p>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 inline-block">
              <div className="flex items-center justify-center gap-6 text-white">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">2min</div>
                  <div className="text-sm text-blue-100">Setup Time</div>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">Free</div>
                  <div className="text-sm text-blue-100">Forever</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">AI</div>
                  <div className="text-sm text-blue-100">Powered</div>
                </div>
              </div>
            </div>

            <Link 
              href="/calendar"
              className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <Calendar className="w-6 h-6" />
              Launch Your Calendar Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <p className="text-sm text-blue-100 mt-4">
            Works instantly in your browser • No app download needed
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            <span className="text-white font-semibold">StudyCal</span>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Built with ❤️ for students who want to thrive • Free forever
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <span>No tracking • No data collection • Local-first</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
