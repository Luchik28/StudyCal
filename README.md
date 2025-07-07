# Week Planner App

A modern, interactive week planner built with Next.js, React, and TypeScript. Plan your week with drag-and-drop calendar events.

## Features

- 📅 **Weekly Calendar View**: Navigate through weeks with an intuitive calendar interface
- ✨ **Drag & Drop**: Easily reschedule events by dragging them to different time slots
- ➕ **Event Management**: Create, edit, and delete events with a simple modal interface
- 🎨 **Modern UI**: Beautiful, responsive design built with Tailwind CSS
- ⚡ **Real-time Updates**: Instant feedback when creating or moving events
- 🔧 **TypeScript**: Fully typed for better development experience
- 📊 **Analytics**: Pie chart showing time spent per category
- ⚙️ **Settings**: Customizable time format (12h/24h) and preferences
- 🔄 **Persistent Storage**: Auto-save events and settings using IndexedDB
- 📱 **Google Calendar Sync**: Two-way synchronization with Google Calendar (optional)
- 🤖 **Smart Task Scheduling**: AI-powered automatic task scheduling with constraint optimization
- 🧠 **Intelligent Categorization**: TensorFlow-based event classification for optimal scheduling
- ⏰ **Constraint-Based Optimization**: Respects working hours, prevents overlaps, and optimizes for productivity

## Google Calendar Integration

This app supports **seamless Google Calendar integration** for automatic synchronization between your local calendar and Google Calendar. **No setup required for users** - just click connect and authenticate!

### For Users (No Setup Required!)

1. **Connect Your Account**:
   - Open the app and go to Settings (⚙️ icon)
   - Click "Connect" in the Google Calendar section
   - Authenticate with your Google account in the popup
   - Enable automatic sync

That's it! Your events will automatically sync between the app and Google Calendar.

### For App Developers (One-Time Setup)

To enable Google Calendar integration for your users, you need to set up the app's Google Cloud Console project:

1. **Create Google API Project**:
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project for your app
   - Enable the Google Calendar API

2. **Create OAuth 2.0 Credentials**:
   - Go to "Credentials" in the sidebar
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Select "Web application" as the application type
   - Add your production domain to "Authorized JavaScript origins" (e.g., `https://yourapp.com`)
   - Add the redirect URI: `https://yourapp.com/auth/google/callback`

3. **Configure Environment Variables**:
   - Set environment variables in your deployment platform:
     ```
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_app_google_client_id
     GOOGLE_CLIENT_SECRET=your_app_google_client_secret
     ```

4. **Deploy Your App**:
   - Users can now connect their Google Calendar accounts
   - No additional setup required from users

### Security Features

- **Secure OAuth Flow**: Client secrets are kept server-side only
- **Token Management**: Automatic token refresh handled securely
- **User Privacy**: Each user authenticates with their own Google account
- **Scoped Access**: App only requests Google Calendar permissions

### Sync Features

- **Auto-sync on startup**: Events are automatically pulled from Google Calendar when you open the app
- **Real-time sync**: Local events are synced to Google Calendar when created/modified
- **Two-way sync**: Changes made in Google Calendar appear in the app
- **Manual sync**: Force sync anytime using the "Sync Now" button in settings
- **Selective sync**: Choose which events to sync (local events vs. Google Calendar events)

### Technical Implementation

The Google Calendar integration includes:

- **Authentication**: OAuth 2.0 flow with automatic token refresh
- **Event Mapping**: Converts between app events and Google Calendar events
- **Conflict Resolution**: Handles simultaneous edits and sync conflicts
- **Error Handling**: Graceful fallback when Google Calendar is unavailable
- **Privacy**: Google Calendar events are clearly marked and differentiated

### Troubleshooting

**For Users:**

1. **"Please allow popups for this site"**
   - Enable popups in your browser for this website
   - Try the connection process again

2. **"Google Calendar integration is not available"**
   - Contact the app developer - the integration needs to be configured

3. **Authentication popup doesn't open**
   - Check if popups are blocked
   - Try disabling browser extensions temporarily
   - Make sure JavaScript is enabled

**For Developers:**

1. **"Google Calendar integration is not configured"**
   - Ensure environment variables are set correctly
   - Check that the Google Calendar API is enabled
   - Verify OAuth 2.0 credentials are properly configured

2. **"Failed to exchange authorization code"**
   - Check the redirect URI matches exactly (including https/http)
   - Ensure the client secret is correct
   - Verify the domain is added to authorized origins

3. **Users can't authenticate**
   - Check that your app domain is properly configured in Google Cloud Console
   - For production, ensure your app is verified by Google (if required)
   - Test the OAuth flow in development mode first

## Smart Task Scheduling

The app features an advanced **AI-powered task scheduling system** that automatically converts your tasks into optimally scheduled calendar events.

### How It Works

1. **Add Tasks**: Add tasks to the sidebar with estimated durations and priorities
2. **AI Classification**: Each task is automatically classified using TensorFlow (Work, Education, Health, Personal)  
3. **Constraint Optimization**: The scheduler uses constraint programming principles to find optimal time slots:
   - **Prevents overlaps** with existing events
   - **Respects working hours** (9 AM - 5 PM for work/education tasks)
   - **Considers priorities** (high priority tasks get better time slots)
   - **Respects meal times** and break requirements
   - **Balances workload** across days for weekly scheduling

### Task Management Features

- **Duration Selection**: Choose from 15 minutes to 3+ hours
- **Priority Levels**: Set tasks as Low, Medium, or High priority
- **Automatic Categorization**: AI determines optimal scheduling based on task content
- **Flexible Scheduling**: 
  - **Today View**: Schedule tasks for the current day
  - **Week View**: Distribute tasks optimally across the week
  - **Month View**: Schedule tasks in the coming days

### Scheduling Intelligence

The scheduler considers multiple factors:
- **Task Category**: Work tasks prefer business hours, personal tasks are more flexible
- **Existing Events**: Automatically works around your current schedule
- **Break Requirements**: Ensures minimum breaks between tasks
- **Meal Times**: Avoids scheduling over lunch and dinner times
- **Workload Distribution**: Balances tasks across days for weekly scheduling

Simply add your tasks, set their priorities and durations, then click the scheduling button to watch your tasks transform into an optimized calendar!

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
