// FIX: 'onCallGenkit' is in 'firebase-functions/https' (requires firebase-functions v6+)
// 'onRequest' is in 'firebase-functions/v2/https'
import { onCallGenkit } from "firebase-functions/https";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Added 'defineSecret' for parameterized secret management
import { defineSecret } from "firebase-functions/params";

// --- Genkit and AI Imports ---
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { z } from "zod";

// Define secrets at the top level for Firebase
// These secrets must be set in Google Secret Manager, e.g.:
// firebase functions:secrets:set GOOGLE_GENAI_API_KEY
const googleAIapiKey = defineSecret("GOOGLE_GENAI_API_KEY");
const mailgunApiKey = defineSecret("MAILGUN_API_KEY");
const mailgunDomain = defineSecret("MAILGUN_DOMAIN");
const mailgunFromEmail = defineSecret("MAILGUN_FROM_EMAIL");

// --- Initialize Genkit (CORRECTED for v1.0+) ---
// Don't export the ai instance to avoid circular references
const ai = genkit({
  plugins: [googleAI()],
});

// ============================================================================
//   SCHEMAS (Unchanged)
// ============================================================================

const GenerateTailoredWorkoutPlanInputSchema = z.object({
  fitnessData: z.string(),
  trainingGoals: z.string(),
  additionalContext: z.string().optional(),
  days: z.array(z.string()),
  equipmentAccess: z.enum(["gym", "bodyweight"]).optional().nullable(),
  isUnitPlan: z.boolean().optional(),
  isIndividualPlan: z.boolean().optional(),
});

const ExerciseSchema = z.object({
  name: z.string().describe("Name of the exercise."),
  sets: z.string().describe("Number of sets."),
  reps: z.string().describe("Number of repetitions or duration."),
  rest: z.string().describe("Rest period between sets."),
  description: z.string().describe(
    "A brief (1-2 sentence) description of how to perform the exercise.",
  ),
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe("Day of the week (e.g., Monday)."),
  focus: z.string().describe(
    "The main focus of the day (e.g., Strength, Endurance, Recovery).",
  ),
  warmup: z.string().describe("A brief description of the warm-up routine."),
  main_workout: z.array(ExerciseSchema).describe(
    "A list of exercises for the main workout.",
  ),
  cooldown: z.string().describe("A brief description of the cool-down routine."),
});

const GenerateTailoredWorkoutPlanOutputSchema = z.object({
  title: z.string().describe(
    "A title for the workout plan, e.g., 'Weekly Fitness Plan: Focus on Endurance'.",
  ),
  common_weaknesses: z.array(z.string()).describe(
    "A list of common weaknesses identified from the data.",
  ),
  strength_focus_plan: z.array(DailyWorkoutSchema).optional().describe(
    "A complete weekly workout plan for the Strength Focus Group. (For unit plans)",
  ),
  running_focus_plan: z.array(DailyWorkoutSchema).optional().describe(
    "A complete weekly workout plan for the Running Focus Group. (For unit plans)",
  ),
  individual_plan: z.array(DailyWorkoutSchema).optional().describe(
    "A complete weekly workout plan for an individual soldier. (For individual plans)",
  ),
});
export type GenerateTailoredWorkoutPlanOutput = z.infer<
  typeof GenerateTailoredWorkoutPlanOutputSchema
>;

const SendInviteEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  subject: z.string().describe("The subject of the email."),
  body: z.string().describe("The HTML or text body of the email."),
});

// ============================================================================
//   AI FLOW DEFINITION (CORRECTED)
// ============================================================================

const generatePlanFlow = ai.defineFlow(
  {
    name: "generateTailoredWorkoutPlanFlow",
    inputSchema: GenerateTailoredWorkoutPlanInputSchema,
    outputSchema: GenerateTailoredWorkoutPlanOutputSchema,
  },
  async (input) => {
    const planType = input.isUnitPlan ? "a unit plan" : "an individual plan";
    const context = input.additionalContext ?? "No additional context provided.";
    const equipment = input.equipmentAccess ?? "Not specified.";

const prompt = `
      You are an expert military fitness planner for the FitSquad app. Your task is to generate ${planType} based on the provided data.

      **Input Data:**
      - **Fitness Data:** ${input.fitnessData}
      - **Training Goals:** ${input.trainingGoals}
      - **Additional Context:** ${context}
      - **Equipment Access:** ${equipment}
      - **Days to Plan:** ${input.days.join(", ")}

      **Instructions:**
      1.  Analyze the fitness data to identify 1-3 common weaknesses.
      2.  If this is a **Unit Plan** (isUnitPlan: true):
          - Create *two* separate weekly plans: 'strength_focus_plan' and 'running_focus_plan'.
          - Assign daily workouts *only* for the requested days: ${input.days.join(", ")}.
      3.  If this is an **Individual Plan** (isIndividualPlan: true):
          - Create a *single* weekly plan: 'individual_plan'.
          - Assign daily workouts *only* for the requested days: ${input.days.join(", ")}.
      4.  For each exercise, provide:
          - name: The exercise name (e.g., "Push-ups", "Squats")
          - sets: Number of sets as a string (e.g., "3", "4")
          - reps: Number of reps or duration as a string (e.g., "12", "10-15", "30 seconds", "2 minutes")
          - rest: Rest period as a string (e.g., "60 seconds", "90 seconds", "2 minutes")
          - description: A brief 1-2 sentence description of how to perform the exercise
      5.  Create a suitable title for the overall plan.
      6.  You MUST return a valid JSON object that strictly adheres to the schema. All string fields must be non-empty strings.
    `;

    logger.info("Generating AI plan with prompt...");

    const result = await ai.generate({
      model: "gemini-1.5-pro-latest",
      prompt: prompt,
      output: {
        format: "json",
        schema: GenerateTailoredWorkoutPlanOutputSchema,
      },
    });

    const output = result.output;

    if (!output) {
      throw new Error("AI failed to generate a valid plan.");
    }

    logger.info("AI generation successful.");
    return output;
  },
);

// ============================================================================
//
//   FUNCTION 1: generatePlan (HTTP Endpoint)
//
// ============================================================================

export const generatePlan = onCallGenkit(
  {
    cors: true,
    secrets: [googleAIapiKey],
  },
  generatePlanFlow,
);

// ============================================================================
//
//   FUNCTION 2: sendInvite (HTTP Endpoint)
//
// ============================================================================

export const sendInvite = onRequest(
  {
    cors: true,
    secrets: [mailgunApiKey, mailgunDomain, mailgunFromEmail],
  },
  async (request, response) => {
    logger.info("Function received request for sendInvite", request.body);

    try {
      // 1. Validate
      const input = SendInviteEmailInputSchema.parse(request.body);

      // 2. Get secrets
      const apiKey = process.env.MAILGUN_API_KEY;
      const domain = process.env.MAILGUN_DOMAIN;
      const fromEmail = process.env.MAILGUN_FROM_EMAIL;

      if (!apiKey || !domain || !fromEmail) {
        logger.error("Mailgun environment variables are not configured.");
        response.status(500).json({
          success: false,
          error: "Email server is not configured.",
        });
        return;
      }

      // 3. Prepare form
      const form = new FormData();
      form.append("from", `FitSquad <${fromEmail}>`);
      form.append("to", input.to);
      form.append("subject", input.subject);
      form.append("html", input.body);

      // 4. Send
      const mailgunResponse = await fetch(
        `https://api.mailgun.net/v3/${domain}/messages`,
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " + Buffer.from(`api:${apiKey}`).toString("base64"),
          },
          body: form,
        },
      );

      if (!mailgunResponse.ok) {
        const errorBody = await mailgunResponse.text();
        logger.error("Mailgun API Error:", errorBody);
        throw new Error(
          `Mailgun API Error: ${mailgunResponse.status} ${mailgunResponse.statusText}`,
        );
      }

      const result = await mailgunResponse.json();
      logger.info("Mailgun send success:", result);

      // 5. Respond
      response.status(200).json({ success: true });
    } catch (err) {
      logger.error("Mailgun send error:", err);
      if (err instanceof z.ZodError) {
        response.status(400).json({
          success: false,
          error: "Invalid input",
          details: err.errors,
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        response.status(500).json({ success: false, error: errorMessage });
      }
    }
  },
);