# Firebase Authentication Setup Fix

## Issue
**Error**: "Failed to send link: Firebase: Error (auth/operation-not-allowed)"

## Root Cause
Email/Password authentication provider is not enabled in your Firebase Console.

## Solution Steps

### 1. Enable Email/Password Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **Team Forge** project
3. Navigate to **Authentication** → **Sign-in method** tab
4. Click on **Email/Password** provider
5. Toggle **Enable** to ON
6. Check the box: **Enable email link (passwordless sign-in)** ✓
7. Click **Save**

### 2. Verify Custom Domain (Important for Email Links)

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domain:
   - **Local development**: `localhost` (should be auto-added)
   - **Production**: `team-forge-seven.vercel.app` (or your actual domain)
3. Click **Add URL** and **Save**

### 3. Update App Configuration (if needed)

Your `firebase-applet-config.json` should include your project credentials:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "measurementId": "YOUR_MEASUREMENT_ID",
  "firestoreDatabaseId": "(default)" // optional
}
```

### 4. Test the Fix

1. Restart your development server
2. Go to the **Welcome** screen
3. Enter an email and click **REQUEST SIGN-IN LINK**
4. You should receive an email with the sign-in link
5. Click the link to complete authentication

## Additional Notes

- If you're using **Google authentication** (visible in your code with `signInWithPopup`), make sure Google is also enabled in the same Sign-in method tab
- Email link authentication will send emails from Firebase (check spam folder)
- For production, configure a custom email template in Firebase Console under **Authentication** → **Templates** → **Email link sign-in**

## References

- [Firebase Email Link Authentication Docs](https://firebase.google.com/docs/auth/web/email-link-auth)
- [Firebase Console Setup Guide](https://firebase.google.com/docs/auth/web/start)
