import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { EventsProvider } from "@/contexts/EventsContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Analytics } from '@vercel/analytics/next';
import FeedbackWidget from "@/components/FeedbackWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyCal - Optimize Your Schedule",
  description: "StudyCal is an AI powered calendar for students that analyzes your schedule and offers suggestions to improve it.",
  keywords: "student calendar, academic calendar, AI calendar, school planner, university calendar, student life organizer, free, optimize schedule",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: "StudyCal - Optimize Your Schedule",
    description: "StudyCal is an AI powered calendar for students that analyzes your schedule and offers suggestions to improve it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-NKNLNMRBBW"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);} 
  gtag('js', new Date());

  gtag('config', 'G-NKNLNMRBBW');
          `}
        </Script>
        <SettingsProvider>
          <EventsProvider>
            {children}
          </EventsProvider>
        </SettingsProvider>
        <FeedbackWidget />
        <Analytics />
      </body>
    </html>
  );
}
