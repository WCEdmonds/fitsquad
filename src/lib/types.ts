export type Soldier = {
  id: number;
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
