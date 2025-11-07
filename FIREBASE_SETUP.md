# Firebase Setup Guide for Password Reset

## Issue: Password Reset Emails Not Being Sent

If password reset emails are not being sent, you need to configure email authentication in the Firebase Console.

## Required Firebase Console Configuration

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `studio-7165447913-7fa8f`
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Email/Password**
5. Make sure **both toggles are enabled**:
   - ✅ Email/Password (main toggle)
   - ✅ Email link (passwordless sign-in) - Optional but recommended

### 2. Configure Email Templates

1. In **Authentication** > **Templates**
2. Click on **Password reset**
3. Configure the email template:
   - **Sender name**: FitSquad
   - **Sender email**: `noreply@studio-7165447913-7fa8f.firebaseapp.com` (default)
   - **Subject**: Reset your password for FitSquad
   - **Body**: Edit the HTML template if needed

### 3. Add Authorized Domains

1. Go to **Authentication** > **Settings**
2. Under **Authorized domains**, ensure these are added:
   - `localhost` (for development)
   - `studio-7165447913-7fa8f.firebaseapp.com` (Firebase hosting)
   - Your custom domain (if applicable)

### 4. Configure Email Provider (Optional - for custom domain)

If you want emails from a custom domain instead of Firebase's default:

1. Go to **Authentication** > **Templates** > **SMTP Settings**
2. Configure your SMTP provider (e.g., SendGrid, Mailgun)

## Testing Password Reset

1. **Enter your email** in the login page email field
2. **Click "Forgot Password?"**
3. **Check your inbox** (and spam folder)
4. The reset link is valid for **1 hour**

## Common Issues

### Email Not Arriving
- **Check spam folder** - Firebase emails often go to spam
- **Verify email address** - Must be a real, registered user
- **Check Firebase Console Logs** - Authentication > Usage for errors
- **Authorized domains** - Ensure your domain is authorized

### Error Messages
- `auth/user-not-found` - No account with that email exists
- `auth/invalid-email` - Email format is invalid
- `auth/too-many-requests` - Rate limited, wait and try again

## Debugging

Open browser console (F12) when clicking "Forgot Password?" to see detailed error logs.

The code now logs errors with `console.error('Password reset error:', err)` for debugging.

## Security Notes

- Password reset links expire after 1 hour
- Users can only reset their password 5 times per hour (rate limited)
- Email must match an existing account
- Firebase handles all security automatically
