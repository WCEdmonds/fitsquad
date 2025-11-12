/**
 * ExerciseDB API Types
 * Based on the ExerciseDB API structure
 */

export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string; // target muscle
  equipment: string;
  gifUrl: string;
  instructions: string[];
  secondaryMuscles?: string[];
}

export interface ExerciseFilters {
  bodyPart?: string;
  equipment?: string;
  target?: string;
  limit?: number;
  offset?: number;
}

export interface ExerciseSearchParams {
  name?: string;
  limit?: number;
  offset?: number;
}
