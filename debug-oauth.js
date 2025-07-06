// Debug script to check OAuth configuration
// Run this in your browser console when on http://localhost:3000

console.log('=== Google Calendar OAuth Debug Info ===');
console.log('Current origin:', window.location.origin);
console.log('Expected redirect URI:', `${window.location.origin}/auth/google/callback`);
console.log('Client ID from env:', process?.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'Not available in browser');

// Check what the actual auth URL would be
fetch('/api/auth/google/status')
  .then(r => r.json())
  .then(data => {
    console.log('Google Calendar status:', data);
  })
  .catch(e => console.error('Status check failed:', e));

console.log('=== Next Steps ===');
console.log('1. Make sure Google Cloud Console has EXACT redirect URI:', `${window.location.origin}/auth/google/callback`);
console.log('2. Make sure Authorized JavaScript origins includes:', window.location.origin);
console.log('3. Try the OAuth flow again');
