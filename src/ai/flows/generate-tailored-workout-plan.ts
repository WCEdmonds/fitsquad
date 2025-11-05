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
  unitType: z
    .string()
    .describe(
      'The type of unit (section, squad, platoon, or company) the workout plan is for.'
    ),
  fitnessData: z
    .string()
    .describe(
      'Aggregated fitness data for the unit, including AFT scores, run times, and other relevant health information.'
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
      'A detailed workout plan tailored to the unit, including specific exercises, sets, reps, and goals for each group within the unit.'
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

You will use the provided fitness data, training goals, and unit type to generate a tailored workout plan. The workout plan should include specific exercises, sets, reps, and goals for each group within the unit.

Unit Type: {{{unitType}}}
Fitness Data: {{{fitnessData}}}
Training Goals: {{{trainingGoals}}}
Additional Context: {{{additionalContext}}}

Workout Plan:`,
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
