/**
 * ExerciseDB API Types
 * Based on the actual ExerciseDB API structure
 */

export interface Exercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

export interface ExerciseAPIResponse {
  success: boolean;
  metadata: {
    totalPages: number;
    totalExercises: number;
    currentPage: number;
    previousPage: string | null;
    nextPage: string | null;
  };
  data: Exercise[];
}

export interface ExerciseFilters {
  bodyPart?: string;
  equipment?: string;
  muscle?: string;
  limit?: number;
  offset?: number;
}

export interface ExerciseSearchParams {
  q?: string; // query parameter for search
  limit?: number;
  offset?: number;
}
