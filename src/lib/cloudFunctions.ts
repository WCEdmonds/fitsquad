import { z } from 'zod';

// Cloud Functions base URL
const CLOUD_FUNCTIONS_BASE_URL = 'https://us-central1-studio-7165447913-7fa8f.cloudfunctions.net';

// ============================================================================
// Type definitions (copied from Cloud Functions)
// ============================================================================

const ExerciseSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().describe('Number of sets.'),
  reps: z.string().describe('Number of repetitions or duration.'),
  rest: z.string().describe('Rest period between sets.'),
  perceivedExertion: z.string().optional().describe('Rate of Perceived Exertion (RPE) on a scale of 1-10, where 1 is very easy and 10 is maximum effort.'),
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

export type GenerateTailoredWorkoutPlanOutput = z.infer<typeof GenerateTailoredWorkoutPlanOutputSchema>;

export interface GenerateTailoredWorkoutPlanInput {
  fitnessData: string;
  trainingGoals: string;
  additionalContext?: string;
  days: string[];
  equipmentAccess?: 'gym' | 'bodyweight';
  isUnitPlan?: boolean;
  isIndividualPlan?: boolean;
}

export interface SendInviteInput {
  to: string;
  subject: string;
  body: string;
}

export interface SendVerificationEmailInput {
  userId: string;
  email: string;
  firstName: string;
  code: string;
}

export interface VerifyEmailInput {
  userId: string;
  code: string;
}

// ============================================================================
// Cloud Functions API calls
// ============================================================================

/**
 * Call the generatePlan Cloud Function
 */
export async function callGeneratePlan(
  input: GenerateTailoredWorkoutPlanInput,
  idToken: string
): Promise<GenerateTailoredWorkoutPlanOutput> {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/generatePlan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data: input }),
  });

  if (!response.ok) {
    let errorMessage = `Cloud Function request failed: ${response.status}`;
    try {
      const errorData = await response.json();
      console.error('Cloud Function error details:', errorData);

      // Try to extract meaningful error message
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error.details) {
          errorMessage = JSON.stringify(errorData.error.details);
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.result;
}

/**
 * Call the sendInvite Cloud Function
 */
export async function callSendInvite(input: SendInviteInput): Promise<{ success: boolean }> {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/sendInvite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Cloud Function request failed: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Call the sendVerificationEmail Cloud Function
 */
export async function callSendVerificationEmail(input: SendVerificationEmailInput): Promise<{ success: boolean }> {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/sendVerificationEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Cloud Function request failed: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Call the verifyEmail Cloud Function
 */
export async function callVerifyEmail(input: VerifyEmailInput): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/verifyEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Cloud Function request failed: ${response.status}`);
  }

  const result = await response.json();
  return result;
}
