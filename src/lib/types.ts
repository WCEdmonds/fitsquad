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

export type WorkoutPlan = {
  id: string;
  title: string;
  unitType: string;
  trainingGoals: string;
  planContent: string;
  createdAt: string;
};
