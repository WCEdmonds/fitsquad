# Cloud Functions Setup Instructions

## Issue: 500 Internal Server Error when generating workout plans

The `generatePlan` Cloud Function is returning a 500 error because it requires the Google Generative AI API key to be configured as a secret in Firebase.

## Root Cause

The Cloud Function uses Google's Gemini AI (via Genkit) to generate workout plans. The function expects the `GOOGLE_GENAI_API_KEY` secret to be set in Google Secret Manager, but it's currently not configured.

## Solution

### Step 1: Get a Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Set the Secret in Firebase

Run the following command to set the secret:

```bash
firebase functions:secrets:set GOOGLE_GENAI_API_KEY
```

When prompted, paste your API key.

### Step 3: Deploy the Cloud Functions

1. Build and deploy the functions:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

2. Wait for the deployment to complete

### Step 4: Test the Function

1. Refresh your web app
2. Try generating a workout plan
3. The function should now work correctly

## Additional Configuration

The Cloud Function also uses these secrets for email functionality (optional):

- `MAILGUN_API_KEY` - For sending team invitation emails
- `MAILGUN_DOMAIN` - Your Mailgun domain
- `MAILGUN_FROM_EMAIL` - The "from" email address

To set these:

```bash
firebase functions:secrets:set MAILGUN_API_KEY
firebase functions:secrets:set MAILGUN_DOMAIN
firebase functions:secrets:set MAILGUN_FROM_EMAIL
```

## Files Modified

- `firebase.json` - Added functions configuration
- `src/lib/cloudFunctions.ts` - Improved error handling to show detailed error messages

## Verification

After deployment, you should see improved error messages in the browser console that will help identify any remaining issues.

If you still get errors, check the Firebase Functions logs:

```bash
firebase functions:log
```

Or view logs in the [Firebase Console](https://console.firebase.google.com/project/studio-7165447913-7fa8f/functions/logs).
