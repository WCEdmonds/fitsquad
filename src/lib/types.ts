export type Account = {
  id: string; // Firebase UID for claimed accounts, generated ID for unclaimed
  email: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  accountType: 'Soldier' | 'Supervisor' | 'Commander' | 'Admin';
  teamId: string | null;
  claimed?: boolean; // false for unclaimed profiles, true or undefined for claimed
  claimCode?: string; // Unique code to claim this profile
  createdBy?: string; // UID of supervisor/commander who created unclaimed profile
  createdAt?: string; // ISO timestamp
  emailVerified?: boolean; // Email verification status
  verificationCode?: string; // Code for email verification
  verificationCodeExpires?: string; // Expiration timestamp for verification code
  aiGenerationsThisWeek?: number; // Count of AI generations this week
  aiGenerationsWeekStart?: string; // ISO timestamp of when the current week started
};

export type Soldier = {
  id: string; // Changed to string to match Firestore UID
  email: string;
  firstName?: string;
  lastName?: string;
  rank: string;
  teamId?: string | null;
  teamName?: string;

  // ACFT Events
  mdl: number; // Max Deadlift
  hrp: number; // Hand-Release Pushups
  sdc: number; // Sprint-Drag-Carry
  plk: number; // Plank
  twoMileRun: number; // 2-Mile Run score

  // Vitals
  gender: 'Male' | 'Female' | 'Other';
  weight: number; // in lbs
  height: number; // in inches
  restingHeartRate?: number; // beats per minute
  bodyFatPercentage?: number; // percentage

  healthNotes: string;
};

export type SoldierData = {
  id: string;
  accountId: string;
  createdAt: string;

  // Vitals
  gender: 'Male' | 'Female' | 'Other';
  weight: number; // in lbs
  height: number; // in inches
  bodyFatPercentage?: number;
  restingHeartRate?: number;

  // ACFT Event Scores (0-100)
  mdl: number; // Max Deadlift
  hrp: number; // Hand-Release Pushups
  sdc: number; // Sprint-Drag-Carry
  plk: number; // Plank
  twoMileRun: number; // 2-Mile Run score

  healthInfo?: string;
};

export type WorkoutPlan = {
  id: string;
  title: string;
  unitType: string;
  trainingGoals: string;
  planContent: string;
  createdAt: string;
};

export type TeamInvitation = {
  id: string;
  teamId: string;
  teamName: string;
  soldierId: string;
  soldierEmail: string;
  invitedBy: string; // UID of supervisor/commander who sent invite
  status: 'pending' | 'accepted' | 'declined'; // pending, accepted, or declined
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp - 30 days from creation
  acceptedAt?: string; // ISO timestamp - when soldier accepted
  declinedAt?: string; // ISO timestamp - when soldier declined
};
