# Demo Data for App Store Review

## Overview

FitSquad includes a built-in demo data system exclusively for the App Store review account. When logging in with **`appstorereview@qndary.com`**, the app automatically creates sample data that can be used for testing without affecting production data.

## What Gets Created

On first login with the review account, the following demo data is automatically initialized:

### 1. **Demo Team**
- **Team Name:** Demo Unit - 2nd Platoon
- **Team Code:** DEMO2024
- **Members:** 8 sample soldiers with realistic ACFT scores

### 2. **Sample Soldiers**
Eight unclaimed soldiers with varying fitness levels:

| Soldier | Rank | Status | Key Fitness Levels |
|---------|------|--------|-------------------|
| James Johnson | Sergeant | Excellent | MDL: 285, HRP: 68, 2MR: 18:00 |
| Maria Martinez | Corporal | Very Good | MDL: 245, HRP: 72, 2MR: 19:00 |
| Robert Thompson | PFC | Improving | MDL: 210, HRP: 45, 2MR: 23:00 |
| Sarah Williams | Specialist | Outstanding | MDL: 265, HRP: 80, 2MR: 17:00 |
| Michael Davis | Private | Novice | MDL: 190, HRP: 38, 2MR: 26:00 |
| Carlos Garcia | Sergeant | Peak | MDL: 310, HRP: 75, 2MR: 16:00 |
| Jennifer Lee | Corporal | Consistent | MDL: 235, HRP: 65, 2MR: 20:00 |
| David Clark | PFC | Developing | MDL: 220, HRP: 52, 2MR: 23:40 |

### 3. **Workout Plans**
Two pre-created plans to demonstrate the workout planning feature:

1. **ACFT Strength & Conditioning (2-Week)**
   - Manual plan with structured training schedule
   - Covers both strength and endurance components
   - Includes exercises for all ACFT events

2. **Smart-Generated: Balanced ACFT Prep**
   - AI-generated plan example
   - Includes unit analysis and recommendations
   - 4-week training block with specific exercises

## Features to Test

With the demo data, App Store reviewers can test:

### Dashboard
- ✅ View team metrics (total soldiers, average ACFT scores)
- ✅ See performance distribution charts
- ✅ Review recent activity logs
- ✅ Access different ACFT event descriptions

### Soldiers Tab
- ✅ View list of 8 unclaimed soldiers
- ✅ See detailed soldier profiles with ACFT scores
- ✅ Test filtering and sorting
- ✅ Export soldier data (if enabled)

### Workout Planning
- ✅ View pre-created workout plans
- ✅ Review plan details and exercises
- ✅ Test AI plan generation prompts (will use real API)
- ✅ Create new plans

### Analytics
- ✅ View performance charts and metrics
- ✅ See team-wide statistics
- ✅ Test progress tracking features

### Profile & Settings
- ✅ View and edit team settings
- ✅ Manage team members
- ✅ Access profile information

## Account Isolation

**Important Security Features:**

1. **Email-Based Isolation:** Demo data is only created for `appstorereview@qndary.com`
2. **Read-Only Verification:** The initialization function verifies the account email before creating any data
3. **No Real Data Impact:** Demo soldiers use test emails (`@demo.com` domain) and are separate from production accounts
4. **Firebase Security Rules:** All data is protected by Firestore security rules - demo data is only accessible to the review account

## How It Works

### Initialization Flow

```
App Store Reviewer logs in with appstorereview@qndary.com
         ↓
Dashboard Layout loads
         ↓
Check if user is demo account + demo data doesn't exist
         ↓
Automatically run initializeDemoData()
         ↓
Create team, soldiers, and workout plans
         ↓
Demo data available for testing
```

### Code Implementation

**Files Created:**

1. **`src/lib/demo-data.ts`**
   - Contains all demo data constants
   - Sample soldier profiles
   - Workout plan templates
   - Helper functions

2. **`src/lib/init-demo-data.ts`**
   - `initializeDemoData()` - Creates demo data in Firestore
   - `checkDemoDataExists()` - Verifies if data is already created
   - `isDemoAccount()` - Checks if email is review account

3. **`src/app/dashboard/layout.tsx`** (Updated)
   - Added useEffect to initialize demo data on login
   - Runs automatically for demo account
   - Skips if data already exists

## Testing Instructions

### First-Time Setup

1. Sign up/log in with email: `appstorereview@qndary.com`
2. Complete onboarding process
3. Check browser console for log messages:
   ```
   ✅ Created demo team: [teamId]
   ✅ Created soldier 1: James Johnson
   ✅ Created soldier 2: Maria Martinez
   ... (8 total)
   ✅ Created manual workout plan
   ✅ Created AI-generated workout plan
   ```
4. Navigate to Dashboard - should see team metrics for "Demo Unit - 2nd Platoon"

### Testing Different Features

**For Soldiers View:**
- Go to Soldiers tab
- Should see 8 soldiers with ACFT scores
- All soldiers are unclaimed (not yet registered)
- Click on any soldier to see full details

**For Workout Plans:**
- Go to Plan tab
- Should see 2 pre-created plans
- Click on plan to view details and exercises
- Use "Generate Workout Plan" for AI-generated plans

**For Analytics:**
- Go to Analytics tab
- Should see charts for all ACFT events
- Data aggregates across all 8 demo soldiers

**For Profile:**
- Profile menu (top-right) shows demo account info
- Can click "Settings" but note: team management is limited to demo team

## Notes for Developers

### Modifying Demo Data

To change demo soldiers or plans:

1. Edit `src/lib/demo-data.ts`
2. Update `DEMO_SOLDIERS` array or `DEMO_WORKOUT_PLAN`
3. Delete demo data from Firebase (or wait for next account setup)
4. Log back in to recreate with new data

### Adding More Data

Current demo data includes:
- 1 team
- 8 soldiers
- 2 workout plans

To add more:
- Edit `DEMO_SOLDIERS` array in `demo-data.ts`
- Update plan templates in the same file
- Modify `initializeDemoData()` function to create additional plans

### Security Considerations

1. **Email Verification:** Always verify `DEMO_ACCOUNT_EMAIL` constant
2. **Firestore Rules:** Ensure security rules protect demo data
3. **No Real Credentials:** Demo soldier emails use `@demo.com` domain
4. **Production Safety:** Code includes safety checks to prevent accidental creation

## Troubleshooting

### Demo Data Not Creating?

1. Check browser console for error messages
2. Verify you're logged in as `appstorereview@qndary.com`
3. Check Firebase Firestore quota (if using free tier)
4. Clear browser cache and refresh

### Want to Reset Demo Data?

Currently there's no delete function for safety. To reset:

1. Contact development team
2. Or manually delete documents from Firebase Console:
   - Delete team and associated collections
   - Delete soldier accounts and their data
3. Log back in to recreate

### Different Demo Data?

Edit `src/lib/demo-data.ts` with new soldiers and plans, then reset as above.

## Support

For issues or questions about demo data:
- Check console logs for detailed error messages
- Review Firebase Firestore for data structure
- Contact the development team for assistance

---

**Last Updated:** 2024
**For:** App Store Review Process
**Account:** appstorereview@qndary.com
