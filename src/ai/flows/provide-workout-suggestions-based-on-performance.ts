'use server';
/**
 * @fileOverview Provides workout suggestions based on the soldier's performance and limitations.
 *
 * - suggestAlternativeExercises - A function that suggests alternative or modified exercises.
 * - SuggestAlternativeExercisesInput - The input type for the suggestAlternativeExercises function.
 * - SuggestAlternativeExercisesOutput - The return type for the suggestAlternativeExercises function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeExercisesInputSchema = z.object({
  soldierPerformanceData: z
    .string()
    .describe(
      'Data on the soldier’s past workout performance, including exercises, sets, reps, and any difficulties or limitations experienced.'
    ),
  personalLimitations: z
    .string()
    .describe(
      'Information about the soldier’s personal limitations, such as injuries, health conditions, or specific restrictions.'
    ),
  exerciseGoal: z.string().describe('The overall fitness goal for the exercise.'),
});
export type SuggestAlternativeExercisesInput = z.infer<
  typeof SuggestAlternativeExercisesInputSchema
>;

const SuggestAlternativeExercisesOutputSchema = z.object({
  suggestedExercises: z
    .string()
    .describe(
      'A list of suggested alternative or modified exercises tailored to the soldier’s performance and limitations.'
    ),
  explanation: z
    .string()
    .describe(
      'An explanation of why the suggested exercises are appropriate, considering the soldier’s performance data and limitations.'
    ),
});
export type SuggestAlternativeExercisesOutput = z.infer<
  typeof SuggestAlternativeExercisesOutputSchema
>;

export async function suggestAlternativeExercises(
  input: SuggestAlternativeExercisesInput
): Promise<SuggestAlternativeExercisesOutput> {
  return suggestAlternativeExercisesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAlternativeExercisesPrompt',
  input: {schema: SuggestAlternativeExercisesInputSchema},
  output: {schema: SuggestAlternativeExercisesOutputSchema},
  prompt: `You are a certified personal trainer who has experience working with soldiers to reach their fitness goals.

  Based on the soldier's performance data, personal limitations, and exercise goal, suggest alternative or modified exercises.

  Soldier Performance Data: {{{soldierPerformanceData}}}
  Personal Limitations: {{{personalLimitations}}}
  Exercise Goal: {{{exerciseGoal}}}

  Provide a detailed explanation of why the suggested exercises are appropriate, considering the soldier’s performance data and limitations.
`,
});

const suggestAlternativeExercisesFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeExercisesFlow',
    inputSchema: SuggestAlternativeExercisesInputSchema,
    outputSchema: SuggestAlternativeExercisesOutputSchema,
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
                output: { schema: SuggestAlternativeExercisesOutputSchema },
            });
            return output!;
        }
        // Re-throw other errors
        throw error;
    }
  }
);
