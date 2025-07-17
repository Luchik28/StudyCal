'use client';

import TopBar from '../../components/TopBar';
import { Shield, Calendar } from 'lucide-react';
import { privacyPolicyContent } from './privacy-policy-content';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar />
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
        </div>
      </section>

      {/* Content Styles */}
      <style>{`
        [data-custom-class='body'], [data-custom-class='body'] * {
          background: transparent !important;
        }
        [data-custom-class='title'], [data-custom-class='title'] * {
          font-family: Arial !important;
          font-size: 26px !important;
          color: #000000 !important;
        }
        [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
          font-family: Arial !important;
          color: #595959 !important;
          font-size: 14px !important;
        }
        [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
          font-family: Arial !important;
          font-size: 19px !important;
          color: #000000 !important;
        }
        [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
          font-family: Arial !important;
          font-size: 17px !important;
          color: #000000 !important;
        }
        [data-custom-class='body_text'], [data-custom-class='body_text'] * {
          color: #595959 !important;
          font-size: 14px !important;
          font-family: Arial !important;
        }
        [data-custom-class='link'], [data-custom-class='link'] * {
          color: #3030F1 !important;
          font-size: 14px !important;
          font-family: Arial !important;
          word-break: break-word !important;
        }
        ul {
          list-style-type: square;
        }
        ul > li > ul {
          list-style-type: circle;
        }
        ul > li > ul > li > ul {
          list-style-type: square;
        }
        ol li {
          font-family: Arial;
        }
        .privacy-content {
          line-height: 1.6;
        }
        .privacy-content h1, .privacy-content h2, .privacy-content h3 {
          margin: 1.5rem 0 1rem 0;
        }
        .privacy-content p {
          margin: 1rem 0;
        }
        .privacy-content ul, .privacy-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        .privacy-content li {
          margin: 0.5rem 0;
        }
      `}</style>

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 bg-white/90 rounded-lg shadow-lg my-8 overflow-x-auto">
        <div
          className="privacy-content"
          data-custom-class="body"
          dangerouslySetInnerHTML={{ __html: privacyPolicyContent }}
        />
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-semibold">StudyCal</span>
          </div>
          <p className="text-gray-400 text-sm">
            Built with privacy in mind • No tracking • No data collection • Local-first
          </p>
        </div>
      </footer>
    </div>
  );
}
