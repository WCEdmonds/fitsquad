export type Soldier = {
  id: string; // Changed to string to match Firestore UID
  name: string; // email for now
  firstName?: string;
  lastName?: string;
  rank: string;
  
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
  
  healthNotes: string;
  avatar: string;
};

export type WorkoutPlan = {
  id: string;
  title: string;
  unitType: string;
  trainingGoals: string;
  planContent: string;
  createdAt: string;
};
