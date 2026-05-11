# StudyCal

StudyCal is an AI-assisted calendar and planning app for students. It combines a clean weekly planner with monthly planning, calendar organization, analytics, and smart suggestions to help you stay on top of classes, tasks, and long-term goals.

## Demo

Try it here: [studycal.app](https://studycal.app)

## What It Does

- Weekly and monthly calendar views for planning your schedule
- Drag-and-drop event rescheduling, plus quick create and edit flows
- Multiple calendars with color-coding and visibility controls
- Optional Google Calendar sync
- Time-based analytics to show how your schedule is distributed
- Smart suggestions to help balance workload, study time, and goals
- Long-term goals tracking in the monthly view
- Local persistence for events, settings, calendars, and goals

## Highlights

- Event management with inline editing and modal-based creation/editing
- Support for recurring events and calendar-specific organization
- Custom time format settings and other planning preferences
- An onboarding flow and feedback entry point for new users
- Student-focused AI features, including task prediction and schedule suggestions

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- DnD Kit
- IndexedDB for local persistence
- Google Calendar APIs
- TensorFlow.js and scheduling utilities

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Scripts

- npm run dev - start the development server
- npm run build - build the app for production
- npm run start - start the production server
- npm run lint - run lint checks

## Google Calendar

Google Calendar sync is optional. To use it in a deployed environment, configure the Google OAuth credentials described in the project setup docs and provide the required environment variables for your deployment.

## Feature Implementation

- The calendar experience is built with separate weekly and monthly views, shared event state, and drag-and-drop interactions for rescheduling.
- Event creation and editing are handled through a mix of modals and inline editors so quick updates stay fast without losing detail.
- Planning data is stored locally with IndexedDB, while goals and some preferences also persist through browser storage for lightweight state recovery.
- Calendar organization supports multiple calendars, color schemes, visibility toggles, and optional Google Calendar sync through OAuth-backed APIs.
- The suggestions and scheduling layer combines model-driven task prediction, event classification, and constraint-based scheduling utilities to surface planning help.
- Analytics are rendered from event data to show time distribution across categories and views, giving a quick read on schedule balance.
