'use server';

/**
 * @fileOverview Generates tailored workout plans for units based on aggregated fitness data and training goals.
 *
 * - generateTailoredWorkoutPlan - A function that generates tailored workout plans.
 * - GenerateTailoredWorkoutPlanInput - The input type for the generateTailoredWorkoutPlan function.
 * - GenerateTailoredWorkoutPlanOutput - The return type for the generateTailoredWorkoutPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTailoredWorkoutPlanInputSchema = z.object({
  fitnessData: z
    .string()
    .describe(
      'A collection of fitness data for all soldiers in the unit. Each entry includes AFT scores, run times, and other relevant health information.'
    ),
  trainingGoals: z
    .string()
    .describe(
      'Specific training goals for the unit, such as improving AFT scores, reducing run times, or increasing overall fitness levels.'
    ),
  additionalContext: z
    .string()
    .optional()
    .describe(
      'Additional context or specific needs for the unit, such as upcoming deployments or specific mission requirements.'
    ),
});
export type GenerateTailoredWorkoutPlanInput = z.infer<
  typeof GenerateTailoredWorkoutPlanInputSchema
>;

const GenerateTailoredWorkoutPlanOutputSchema = z.object({
  workoutPlan: z
    .string()
    .describe(
      'A detailed workout plan. It should identify common weaknesses, suggest focus groups (e.g., running, strength), and provide specific exercises, sets, and reps for each group.'
    ),
});
export type GenerateTailoredWorkoutPlanOutput = z.infer<
  typeof GenerateTailoredWorkoutPlanOutputSchema
>;

export async function generateTailoredWorkoutPlan(
  input: GenerateTailoredWorkoutPlanInput
): Promise<GenerateTailoredWorkoutPlanOutput> {
  return generateTailoredWorkoutPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTailoredWorkoutPlanPrompt',
  input: {schema: GenerateTailoredWorkoutPlanInputSchema},
  output: {schema: GenerateTailoredWorkoutPlanOutputSchema},
  prompt: `You are an expert fitness trainer specializing in designing workout plans for military units.

You will analyze the provided fitness data to identify common weaknesses and suggest logical focus groups (e.g., a "Running Focus Group" for slower runners, a "Strength Focus Group" for those needing to improve push-ups/sit-ups).

Based on this analysis and the training goals, generate a tailored workout plan. The plan must be structured to cater to the different focus groups you've identified, providing specific exercises, sets, reps, and goals for each.

Fitness Data:
{{{fitnessData}}}

Training Goals:
{{{trainingGoals}}}

Additional Context:
{{{additionalContext}}}

Generated Workout Plan:`,
});

const generateTailoredWorkoutPlanFlow = ai.defineFlow(
  {
    name: 'generateTailoredWorkoutPlanFlow',
    inputSchema: GenerateTailoredWorkoutPlanInputSchema,
    outputSchema: GenerateTailoredWorkoutPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
