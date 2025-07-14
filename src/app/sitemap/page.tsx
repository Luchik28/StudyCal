import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sitemap - StudyCal',
  description: 'Navigate all pages and features of StudyCal, your AI-powered schedule optimizer.',
};

export default function SitemapPage() {
  const pages = [
    {
      title: 'Home',
      href: '/',
      description: 'Main landing page with features and getting started'
    },
    {
      title: 'Calendar',
      href: '/calendar',
      description: 'The main calendar application'
    },
    {
      title: 'How to Use',
      href: '/how-to-use',
      description: 'Step-by-step guide to maximize your StudyCal experience'
    },
    {
      title: 'Privacy Policy',
      href: '/privacy-policy',
      description: 'How we protect and handle your data'
    },
    {
      title: 'Sitemap',
      href: '/sitemap',
      description: 'This page - overview of all site sections'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="px-6 py-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
            StudyCal
          </Link>
          <Link 
            href="/" 
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Site <span className="text-blue-400">Map</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Navigate all pages and features of StudyCal to optimize your academic schedule with AI.
            </p>
          </div>

          {/* Pages Grid */}
          <div className="grid gap-6 md:gap-8">
            {pages.map((page, index) => (
              <div
                key={page.href}
                className="group border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <Link href={page.href} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">
                        {page.title}
                      </h2>
                      <p className="text-gray-400 text-sm mb-3 sm:mb-0">
                        {page.description}
                      </p>
                    </div>
                    <div className="flex items-center text-gray-500 group-hover:text-blue-400 transition-colors">
                      <code className="text-xs bg-gray-800 px-2 py-1 rounded mr-3">
                        {page.href}
                      </code>
                      <svg 
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/calendar"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Planning →
              </Link>
              <Link
                href="/how-to-use"
                className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Learn How
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
