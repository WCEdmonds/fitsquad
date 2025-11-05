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
  days: z.array(z.string()).describe('The days of the week to generate the plan for.')
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

const FocusGroupSchema = z.object({
  name: z.string().describe('Name of the focus group (e.g., "Running Focus Group").'),
  description: z.string().describe('Who this group is for.'),
  modifications: z.string().describe('Specific modifications or additional exercises for this group for the week.')
});

const GenerateTailoredWorkoutPlanOutputSchema = z.object({
  title: z.string().describe("A title for the workout plan, e.g., 'Weekly Fitness Plan: Focus on Endurance'."),
  common_weaknesses: z.array(z.string()).describe('A list of common weaknesses identified from the data.'),
  focus_groups: z.array(FocusGroupSchema).describe('Suggested focus groups based on weaknesses.'),
  weekly_plan: z.array(DailyWorkoutSchema).describe('A workout plan for the selected days.'),
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

Your task is to create a structured, workout plan in JSON format for the specified days of the week.

1.  **Analyze Data**: Analyze the provided fitness data to identify 2-3 common weaknesses (e.g., 'Lower than average 2-mile run scores', 'Poor plank performance').
2.  **Define Focus Groups**: Based on the weaknesses, define 2 logical focus groups: a "Running Focus Group" and a "Strength Focus Group". For each group, provide a brief description of who it's for and suggest specific, actionable modifications or extra work for them to do throughout the week. For example, the running group might add an extra half-mile to their runs, while the strength group adds an extra set to their pushups.
3.  **Create Weekly Plan**: Generate a workout plan for the specified days: {{#each days}}{{{this}}} {{/each}}. For each day, provide:
    *   Day of the week.
    *   A clear focus (e.g., 'Upper Body Strength', 'Cardio & Endurance', 'Active Recovery').
    *   A simple warm-up routine.
    *   A list of main workout exercises for the whole unit, including name, sets, reps (or duration), rest time, and a brief (1-2 sentence) description of how to perform the exercise.
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
    try {
        const { output } = await prompt(input);
        return output!;
    } catch (error: any) {
        if (error.message.includes('503')) {
            console.warn('Default model unavailable, falling back to gemini-pro.');
            const { output } = await ai.generate({
                prompt: prompt.compile(input)!,
                model: 'googleai/gemini-pro',
                output: { schema: GenerateTailoredWorkoutPlanOutputSchema },
            });
            return output!;
        }
        // Re-throw other errors
        throw error;
    }
  }
);
