
/**
 * @fileOverview Generates tailored workout plans for units or individuals based on fitness data, goals, and equipment.
 * This file is currently not using Genkit and the AI functionality is disabled.
 *
 * - generateTailoredWorkoutPlan - A function that generates tailored workout plans.
 * - GenerateTailoredWorkoutPlanInput - The input type for the generateTailoredWorkoutPlan function.
 * - GenerateTailoredWorkoutPlanOutput - The return type for the generateTailoredWorkoutPlan function.
 */

import { z } from 'zod';

const GenerateTailoredWorkoutPlanInputSchema = z.object({
  fitnessData: z
    .string()
    .describe(
      'A collection of fitness data for all soldiers in the unit, or for a single soldier. Each entry includes AFT scores, run times, and other relevant health information.'
    ),
  trainingGoals: z
    .string()
    .describe(
      'Specific training goals for the unit or individual, such as improving AFT scores, reducing run times, or increasing overall fitness levels.'
    ),
  additionalContext: z
    .string()
    .optional()
    .describe(
      'Additional context or specific needs, such as upcoming deployments or specific mission requirements.'
    ),
  days: z.array(z.string()).describe('The days of the week to generate the plan for.'),
equipmentAccess: z.enum(['gym', 'bodyweight']).optional().nullable().describe("The user's access to equipment. Either 'gym' or 'bodyweight' only."),
isUnitPlan: z.boolean().optional().describe("Set to true if generating a plan for a unit."),
isIndividualPlan: z.boolean().optional().describe("Set to true if generating a plan for an individual soldier.")
});
export type GenerateTailoredWorkoutPlanInput = z.infer<
  typeof GenerateTailoredWorkoutPlanInputSchema
>;

const ExerciseSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().describe('Number of sets.'),
  reps: z.string().describe('Number of repetitions or duration.'),
  rest: z.string().describe('Rest period between sets.'),
  description: z.string().describe('A brief (1-2 sentence) description of how to perform the exercise.')
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe('Day of the week (e.g., Monday).'),
  focus: z.string().describe('The main focus of the day (e.g., Strength, Endurance, Recovery).'),
  warmup: z.string().describe('A brief description of the warm-up routine.'),
  main_workout: z.array(ExerciseSchema).describe('A list of exercises for the main workout.'),
  cooldown: z.string().describe('A brief description of the cool-down routine.'),
});


const GenerateTailoredWorkoutPlanOutputSchema = z.object({
  title: z.string().describe("A title for the workout plan, e.g., 'Weekly Fitness Plan: Focus on Endurance'."),
  common_weaknesses: z.array(z.string()).describe('A list of common weaknesses identified from the data.'),
  strength_focus_plan: z.array(DailyWorkoutSchema).optional().describe('A complete weekly workout plan for the Strength Focus Group. (For unit plans)'),
  running_focus_plan: z.array(DailyWorkoutSchema).optional().describe('A complete weekly workout plan for the Running Focus Group. (For unit plans)'),
  individual_plan: z.array(DailyWorkoutSchema).optional().describe('A complete weekly workout plan for an individual soldier. (For individual plans)'),
});

export type GenerateTailoredWorkoutPlanOutput = z.infer<
  typeof GenerateTailoredWorkoutPlanOutputSchema
>;

export async function generateTailoredWorkoutPlan(
  input: GenerateTailoredWorkoutPlanInput
): Promise<GenerateTailoredWorkoutPlanOutput> {
   // AI functionality is disabled due to dependency removal.
  // Returning a default response.
  console.warn("AI functionality for generateTailoredWorkoutPlan is disabled.");
  throw new Error("Workout plan generation is currently disabled due to a build issue. The Genkit dependencies were removed. To re-enable this, please reinstall Genkit and its dependencies.");
}
