'use client';

import Link from 'next/link';
import { Calendar, ArrowLeft, Play, Settings, Zap, Users, Clock, CheckCircle } from 'lucide-react';

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">StudyCal - How to Use</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Quick Start */}
        <section className="mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Getting Started with StudyCal</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your AI-powered student calendar is ready to help you organize your academic and personal life. 
            Here&apos;s how to get the most out of it in just a few minutes.
          </p>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Quick Start (2 minutes)</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">1</div>
                <div className="text-lg font-semibold mb-2">Open Calendar</div>
                <p className="text-blue-100">Click &quot;Calendar&quot; to access your weekly planner</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">2</div>
                <div className="text-lg font-semibold mb-2">Add Events</div>
                <p className="text-blue-100">Click any time slot to create study sessions, classes, or activities</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">3</div>
                <div className="text-lg font-semibold mb-2">Get AI Insights</div>
                <p className="text-blue-100">Let AI suggest optimal scheduling and balance recommendations</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link 
                href="/calendar"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                <Calendar className="w-5 h-5" />
                Launch Calendar Now
              </Link>
            </div>
          </div>
        </section>

        {/* Features Guide */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Key Features & How to Use Them</h2>
          
          <div className="space-y-8">
            {/* Creating Events */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Creating and Managing Events</h3>
                  <p className="text-gray-600 mb-4">
                    Add your classes, study sessions, work shifts, and personal activities to get a complete view of your schedule.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Click any time slot to create a new event</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Drag and drop events to reschedule them instantly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Use color coding to organize different types of activities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Add detailed descriptions and location information</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">AI-Powered Smart Suggestions</h3>
                  <p className="text-gray-600 mb-4">
                    Our AI analyzes your schedule patterns and provides personalized recommendations to optimize your student life.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Automatic study session scheduling before exams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Break recommendations to maintain productivity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Work-life balance insights and suggestions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Optimal time slots for different activities</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Calendar */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Google Calendar Integration</h3>
                  <p className="text-gray-600 mb-4">
                    Optionally connect your Google Calendar to sync existing events and keep everything in one place.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">One-click connection to your Google account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Automatic two-way sync of events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Keep using Google Calendar while getting AI insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Works across all your devices automatically</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tips for Students */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Student Life Tips</h2>
          
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-orange-600" />
              <h3 className="text-2xl font-bold text-gray-900">Maximize Your Success</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">📚 Academic Excellence</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Schedule study sessions immediately after creating them</li>
                  <li>• Use the AI to find optimal study times based on your energy levels</li>
                  <li>• Block time for exam prep 2-3 weeks in advance</li>
                  <li>• Set up recurring study sessions for consistent habits</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">⚖️ Work-Life Balance</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Schedule personal time and treat it as importantly as classes</li>
                  <li>• Use AI suggestions to find natural break times</li>
                  <li>• Plan social activities to maintain mental health</li>
                  <li>• Set boundaries by blocking off relaxation time</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Is StudyCal really free?</h3>
              <p className="text-gray-600">Yes! StudyCal is completely free forever. No hidden fees, no premium tiers, no tricks.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Do I need to create an account?</h3>
              <p className="text-gray-600">No account required! Your calendar works instantly in your browser. Optionally connect Google Calendar for syncing.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Is my data private and secure?</h3>
              <p className="text-gray-600">Absolutely. All data is stored locally in your browser by default. Google Calendar integration only accesses your calendar data when you explicitly connect it.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">How does the AI work?</h3>
              <p className="text-gray-600">Our AI analyzes your scheduling patterns and provides suggestions based on proven productivity research and student success strategies.</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Organizing Your Student Life?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Everything you need is just one click away. No signup, no hassle, just instant organization.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/calendar"
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Calendar className="w-6 h-6" />
                Launch Your Calendar
              </Link>
              
              <div className="flex items-center gap-2 text-blue-100">
                <Clock className="w-5 h-5" />
                <span>Setup takes less than 2 minutes</span>
              </div>
            </div>
          </div>
        </section>
      </main>

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
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
