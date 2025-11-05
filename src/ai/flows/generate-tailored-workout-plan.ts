'use server';

/**
 * @fileOverview Generates tailored workout plans for units or individuals based on fitness data, goals, and equipment.
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
  planType: z.enum(['unit', 'individual']).describe("The type of plan to generate, either for a 'unit' or an 'individual' soldier.")
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
  // Conditionally return one of these
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
  return generateTailoredWorkoutPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTailoredWorkoutPlanPrompt',
  input: {schema: GenerateTailoredWorkoutPlanInputSchema},
  output: {schema: GenerateTailoredWorkoutPlanOutputSchema},
  helpers: {
    eq: (a: any, b: any) => a === b,
  },
  prompt: `You are an expert fitness trainer specializing in designing workout plans for military personnel.

Your task is to create a structured workout plan in JSON format based on the 'planType' provided.

**Plan Type: {{{planType}}}**

{{#if (eq planType "unit")}}
### UNIT PLAN INSTRUCTIONS
1.  **Analyze Data**: Analyze the provided unit fitness data to identify 2-3 common weaknesses (e.g., 'Lower than average 2-mile run scores', 'Poor plank performance').
2.  **Create Two Weekly Plans**: Generate two separate and complete workout plans for the specified days: {{#each days}}{{{this}}} {{/each}}.
    *   **Strength Focus Plan**: This plan should be designed for soldiers who need to improve their strength. It should emphasize strength-building exercises.
    *   **Running Focus Plan**: This plan should be for soldiers needing to improve their cardiovascular endurance and run times. It should include more running and endurance-focused activities.
3.  **For EACH of the two plans**, provide a complete schedule for the selected days. For each day, include:
    *   Day of the week.
    *   A clear focus (e.g., 'Upper Body Strength', 'Tempo Run', 'Active Recovery').
    *   A simple warm-up routine.
    *   A list of main workout exercises for that group, including name, sets, reps (or duration), rest time, and a brief (1-2 sentence) description of how to perform the exercise.
    *   A simple cool-down routine.
4.  **Format**: The entire output must be a single, valid JSON object conforming to the output schema. Populate both 'strength_focus_plan' and 'running_focus_plan' fields. Do not populate 'individual_plan'.
{{/if}}

{{#if (eq planType "individual")}}
### INDIVIDUAL PLAN INSTRUCTIONS
1.  **Analyze Data**: Analyze the provided individual soldier's fitness data to identify their personal weaknesses.
2.  **Consider Equipment**: The soldier has access to: **{{{equipmentAccess}}}**. Tailor all exercises accordingly. If 'bodyweight', do not include exercises requiring gym equipment. If 'gym', you can include a mix of both.
3.  **Create One Weekly Plan**: Generate a single, personalized workout plan for the specified days: {{#each days}}{{{this}}} {{/each}}.
4.  **For the plan**, provide a complete schedule for the selected days. For each day, include:
    *   Day of the week.
    *   A clear focus (e.g., 'Full Body Strength', 'Interval Training').
    *   A simple warm-up routine.
    *   A list of main workout exercises tailored to the soldier's needs and equipment, including name, sets, reps (or duration), rest time, and a brief (1-2 sentence) description of how to perform the exercise.
    *   A simple cool-down routine.
5.  **Format**: The entire output must be a single, valid JSON object conforming to the output schema. Populate the 'individual_plan' field. Do not populate 'strength_focus_plan' or 'running_focus_plan'.
{{/if}}

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
