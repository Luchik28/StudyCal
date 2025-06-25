# Week Planner App

A modern, interactive week planner built with Next.js, React, and TypeScript. Plan your week with drag-and-drop calendar events.

## Features

- 📅 **Weekly Calendar View**: Navigate through weeks with an intuitive calendar interface
- ✨ **Drag & Drop**: Easily reschedule events by dragging them to different time slots
- ➕ **Event Management**: Create, edit, and delete events with a simple modal interface
- 🎨 **Modern UI**: Beautiful, responsive design built with Tailwind CSS
- ⚡ **Real-time Updates**: Instant feedback when creating or moving events
- 🔧 **TypeScript**: Fully typed for better development experience

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Creating Events**: Click the "New Event" button or click on any time slot to create a new event
2. **Moving Events**: Drag any event to a different day or time slot to reschedule it
3. **Deleting Events**: Click the X button on any event to delete it
4. **Navigation**: Use the arrow buttons to navigate between weeks

## Technical Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit library
- **Date Handling**: date-fns library
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                   # Next.js app directory
├── components/            # React components
│   ├── WeeklyCalendar.tsx    # Main calendar component
│   ├── DayColumn.tsx         # Individual day column
│   ├── EventCard.tsx         # Event display card
│   ├── TimeSlots.tsx         # Time slot sidebar
│   └── CreateEventModal.tsx  # Event creation modal
├── contexts/              # React contexts
│   └── EventsContext.tsx     # Event state management
├── types/                 # TypeScript type definitions
│   └── events.ts             # Event-related types
└── utils/                 # Utility functions
    └── calendar.ts           # Calendar helper functions
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
