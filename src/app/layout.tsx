import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EventsProvider } from "@/contexts/EventsContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Student Calendar - Smart Calendar for Student Life",
  description: "The smart calendar designed for student life. Seamlessly manage academics, work, and personal time with AI-powered insights. Completely free forever.",
  keywords: "student calendar, academic calendar, AI calendar, school planner, university calendar, student life organizer, free",
  openGraph: {
    title: "AI Student Calendar - Smart Calendar for Student Life",
    description: "Your student calendar with AI-powered insights. Manage academics, work, and life balance effortlessly.",
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
        <SettingsProvider>
          <EventsProvider>
            {children}
          </EventsProvider>
        </SettingsProvider>
        <Analytics />
      </body>
    </html>
  );
}
