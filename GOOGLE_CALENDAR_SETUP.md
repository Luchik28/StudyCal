# Google Calendar Integration Demo Setup

This file provides a quick setup guide for developers who want to test the Google Calendar integration.

## Quick Test Setup (5 minutes)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select an existing project
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click and enable it

### 2. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for testing
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your email to test users
4. For the OAuth client:
   - Application type: **Web application**
   - Name: `Week Planner Local Dev`
   - Authorized JavaScript origins: `http://localhost:3007` (or your dev port)
   - Authorized redirect URIs: `http://localhost:3007/auth/google/callback`

### 3. Configure Environment Variables

1. Copy the Client ID and Client Secret from Google Cloud Console
2. Create `.env.local` file in your project root:

```bash
# Copy these from Google Cloud Console
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

### 4. Test the Integration

1. Start the development server: `npm run dev`
2. Open the app in your browser
3. Go to Settings (⚙️ icon)
4. You should see Google Calendar integration is "configured"
5. Click "Connect" to test the OAuth flow
6. Create events and verify they sync to your Google Calendar

## Production Deployment

For production deployment:

1. **Update OAuth Settings**:
   - Add your production domain to authorized origins
   - Update redirect URI to your production callback URL
   - Consider getting your app verified by Google

2. **Environment Variables**:
   - Set the same environment variables in your hosting platform
   - Keep the client secret secure (server-side only)

3. **Domain Verification**:
   - For public apps, you may need domain verification
   - Consider the Google Cloud Console verification process

## Security Notes

- ✅ Client secret is kept server-side only
- ✅ Each user authenticates with their own Google account
- ✅ App only requests Google Calendar permissions
- ✅ Tokens are automatically refreshed
- ✅ Users can disconnect anytime

## Troubleshooting

**"redirect_uri_mismatch" error:**
- Check that the redirect URI in Google Cloud Console exactly matches
- Include the correct port number for development

**"invalid_client" error:**
- Verify the client ID and secret are correct
- Check that the Google Calendar API is enabled

**Popup blocked:**
- Allow popups for your site in browser settings
- Try testing in incognito mode

## Demo Video Script

Here's what you can show users:

1. "No setup required - just click connect!"
2. Click Settings → Google Calendar → Connect
3. Authenticate with Google (popup)
4. Create an event in the app
5. Open Google Calendar - the event appears!
6. Create an event in Google Calendar
7. Refresh the app - the event syncs over!

**User Experience**: One-click authentication, automatic syncing, no technical setup required.
