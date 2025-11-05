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

const ExerciseSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().describe('Number of sets.'),
  reps: z.string().describe('Number of repetitions or duration.'),
  rest: z.string().describe('Rest period between sets.'),
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe('Day of the week (e.g., Monday).'),
  focus: z.string().describe('The main focus of the day (e.g., Strength, Endurance, Recovery).'),
  warmup: z.string().describe('A brief description of the warm-up routine.'),
  main_workout: z.array(ExerciseSchema).describe('A list of exercises for the main workout.'),
  cooldown: z.string().describe('A brief description of the cool-down routine.'),
});

const FocusGroupSchema = z.object({
  name: z.string().describe('Name of the focus group (e.g., "Running Focus Group").'),
  description: z.string().describe('Who this group is for.'),
  modifications: z.string().describe('Specific modifications or additional exercises for this group for the week.')
});

const GenerateTailoredWorkoutPlanOutputSchema = z.object({
  title: z.string().describe("A title for the workout plan, e.g., 'Weekly Fitness Plan: Focus on Endurance'."),
  common_weaknesses: z.array(z.string()).describe('A list of common weaknesses identified from the data.'),
  focus_groups: z.array(FocusGroupSchema).describe('Suggested focus groups based on weaknesses.'),
  weekly_plan: z.array(DailyWorkoutSchema).describe('A 5-day workout plan (Monday to Friday).'),
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

Your task is to create a structured, one-week (5-day, Monday-Friday) workout plan in JSON format.

1.  **Analyze Data**: Analyze the provided fitness data to identify 2-3 common weaknesses (e.g., 'Lower than average 2-mile run scores', 'Poor plank performance').
2.  **Define Focus Groups**: Based on the weaknesses, define 2-3 logical focus groups (e.g., a "Running Endurance Group" for slower runners, a "Core Strength Crew" for plank scores). Provide a brief description for each group and suggest specific modifications or extra work for them.
3.  **Create Weekly Plan**: Generate a 5-day (Monday to Friday) workout plan. For each day, provide:
    *   Day of the week.
    *   A clear focus (e.g., 'Upper Body Strength', 'Cardio & Endurance', 'Active Recovery').
    *   A simple warm-up routine.
    *   A list of main workout exercises, including name, sets, reps (or duration), and rest time.
    *   A simple cool-down routine.
4.  **Format**: The entire output must be a single, valid JSON object conforming to the output schema.

**Fitness Data:**
{{{fitnessData}}}

**Training Goals:**
{{{trainingGoals}}}

**Additional Context:**
{{{additionalContext}}}
`,
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
