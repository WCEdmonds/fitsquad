export type Soldier = {
  id: string; // Changed to string to match Firestore UID
  name: string;
  rank: string;
  aftScore: number;
  runTime: number; // in seconds
  pushups: number;
  situps: number;
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
