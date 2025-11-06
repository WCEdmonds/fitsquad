// src/app/api/generate-plan/route.ts
// This file does NOT use 'use server'

import { NextResponse } from 'next/server';
import { z } from 'zod';

// --- All Zod schemas copied from your original file ---
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
  equipmentAccess: z.enum(['gym', 'bodyweight']).optional().describe("The user's access to equipment. Either 'gym' or 'bodyweight' only."),
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

// --- Your AI Logic (copied from your file) ---
async function generatePlanLogic(
  input: GenerateTailoredWorkoutPlanInput
): Promise<GenerateTailoredWorkoutPlanOutput> {
  
  // This is the logic from your original file:
  console.warn("AI functionality for generateTailoredWorkoutPlan is disabled.");
  throw new Error("Workout plan generation is currently disabled due to a build issue. The Genkit dependencies were removed. To re-enable this, please reinstall Genkit and its dependencies.");
  
  // ---------------------------------------------------
  // WHEN YOU ARE READY TO FIX THE AI:
  // 1. Remove the two lines above.
  // 2. Re-import your AI flow (e.g., import { yourGenkitFlow } from '@/ai/your-flow-file';)
  // 3. Call your flow here:
  // const result = await yourGenkitFlow(input);
  // return result;
  // ---------------------------------------------------
}


// --- The New API Route Handler ---
export async function POST(request: Request) {
  try {
    // 1. Get the JSON body from the request
    const inputBody = await request.json();
    
    // 2. (Optional but recommended) Validate the input
    const validatedInput = GenerateTailoredWorkoutPlanInputSchema.parse(inputBody);

    // 3. Run your logic
    const result = await generatePlanLogic(validatedInput);
    
    // 4. Return a successful JSON response
    return NextResponse.json(result);

  } catch (error: any) {
    // 5. Handle any errors (including Zod validation or your intentional error)
    console.error('Workout plan generation failed:', error);
    
    // Return a JSON error response
    return NextResponse.json(
      { error: error.message || "Failed to generate workout plan. Please try again." }, 
      { status: 500 }
    );
  }
}