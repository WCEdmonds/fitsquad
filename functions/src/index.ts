// FIX: 'onCallGenkit' is in 'firebase-functions/https' (requires firebase-functions v6+)
// 'onRequest' is in 'firebase-functions/v2/https'
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Added 'defineSecret' for parameterized secret management
import { defineSecret } from "firebase-functions/params";
import { config } from "firebase-functions";

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

// Base URL for invitation links - configurable for different environments
// Set via: firebase functions:config:set app.base_url="https://yourdomain.com"
// For local development, use: firebase functions:config:set app.base_url="http://localhost:3000"
// Default to production domain
function getAppBaseUrl(): string {
  try {
    // Try to get from runtime config first
    const baseUrl = config()?.app?.base_url;
    if (baseUrl) {
      return baseUrl;
    }
  } catch (e) {
    logger.warn('Could not read Firebase config, using default', e);
  }
  // Fall back to environment variable or default
  return process.env.APP_BASE_URL || "https://mysquad.fit";
}

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
  perceivedExertion: z.string().optional().describe(
    "Rate of Perceived Exertion (RPE) on a scale of 1-10, where 1 is very easy and 10 is maximum effort.",
  ),
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

const VerifyEmailInputSchema = z.object({
  userId: z.string().describe("The user's Firebase UID."),
  code: z.string().describe("The 6-digit verification code."),
});

const SendTeamInvitationInputSchema = z.object({
  to: z.string().email().describe("The soldier's email address."),
  soldierName: z.string().describe("The soldier's full name."),
  teamName: z.string().describe("The team name."),
  inviterName: z.string().describe("The name of the person sending the invitation."),
  teamId: z.string().describe("The team document ID."),
  invitationId: z.string().describe("The invitation document ID."),
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
          - perceivedExertion: Rate of Perceived Exertion (RPE) as a string from "1" to "10", where 1 is very easy and 10 is maximum effort (e.g., "7", "8", "9")
          - description: A brief 1-2 sentence description of how to perform the exercise
      5.  Create a suitable title for the overall plan.
      6.  You MUST return a valid JSON object that strictly adheres to the schema. All string fields must be non-empty strings.
    `;

    logger.info("Generating AI plan with prompt...");

    // Try primary model first, fallback to lite if overloaded
    let result;
    let usedModel = "googleai/gemini-2.5-flash";

    try {
      logger.info("Attempting generation with gemini-2.5-flash...");
      result = await ai.generate({
        model: "googleai/gemini-2.5-flash",
        prompt: prompt,
        output: {
          format: "json",
          schema: GenerateTailoredWorkoutPlanOutputSchema,
        },
      });
    } catch (primaryError: any) {
      // Check if error is due to model overload (503, 429, or "overloaded" in message)
      const isOverloadError =
        primaryError.status === 503 ||
        primaryError.status === 429 ||
        primaryError.code === 503 ||
        primaryError.code === 429 ||
        (primaryError.message && primaryError.message.toLowerCase().includes("overload"));

      if (isOverloadError) {
        logger.warn("Primary model overloaded, falling back to gemini-2.5-flash-lite...", primaryError);
        usedModel = "googleai/gemini-2.5-flash-lite";

        // Retry with lighter model
        result = await ai.generate({
          model: "googleai/gemini-2.5-flash-lite",
          prompt: prompt,
          output: {
            format: "json",
            schema: GenerateTailoredWorkoutPlanOutputSchema,
          },
        });
      } else {
        // Not an overload error, rethrow
        logger.error("AI generation failed with non-overload error:", primaryError);
        throw primaryError;
      }
    }

    const output = result.output;

    if (!output) {
      throw new Error("AI failed to generate a valid plan.");
    }

    logger.info(`AI generation successful using ${usedModel}`);
    return output;
  },
);

// ============================================================================
//
//   FUNCTION 1: generatePlanV2 (HTTP Endpoint with Rate Limiting)
//
// ============================================================================

import * as admin from "firebase-admin";
admin.initializeApp();

export const generatePlanV2 = onRequest(
  {
    cors: true,
    secrets: [googleAIapiKey],
  },
  async (request, response) => {
    logger.info("Function received request for generatePlanV2", request.body);

    try {
      // Parse input data
      const inputData = GenerateTailoredWorkoutPlanInputSchema.parse(request.body.data);

      // For rate limiting, we need the user ID from the Authorization header
      // The frontend should send the Firebase ID token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({
          error: {
            message: "Authentication required. Please provide a valid Firebase ID token.",
          },
        });
        return;
      }

      // Verify the Firebase ID token
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Rate limiting: Check user's AI generation count
      const db = admin.firestore();
      const accountRef = db.collection("accounts").doc(userId);
      const accountSnap = await accountRef.get();

      if (!accountSnap.exists) {
        response.status(404).json({
          error: {
            message: "Account not found",
          },
        });
        return;
      }

      const accountData = accountSnap.data();
      const now = new Date();
      const weekStart = accountData?.aiGenerationsWeekStart
        ? new Date(accountData.aiGenerationsWeekStart)
        : null;

      // Check if we need to reset the weekly counter
      let aiGenerationsThisWeek = accountData?.aiGenerationsThisWeek || 0;
      let needsReset = false;

      if (!weekStart || (now.getTime() - weekStart.getTime()) > 7 * 24 * 60 * 60 * 1000) {
        // More than a week has passed, reset counter
        needsReset = true;
        aiGenerationsThisWeek = 0;
      }

      // Check if user has exceeded limit (5 per week)
      if (aiGenerationsThisWeek >= 5) {
        response.status(429).json({
          error: {
            message: "AI generation limit reached. You can generate up to 5 workout plans per week. Your limit will reset next week.",
          },
        });
        return;
      }

      // Increment counter
      const newCount = aiGenerationsThisWeek + 1;
      const updateData: any = {
        aiGenerationsThisWeek: newCount,
      };

      if (needsReset) {
        updateData.aiGenerationsWeekStart = now.toISOString();
      }

      await accountRef.update(updateData);

      logger.info(
        `User ${userId} has used ${newCount}/5 AI generations this week`,
      );

      // Call the actual generation flow
      const result = await generatePlanFlow(inputData);

      // Return the result
      response.status(200).json({ result });
    } catch (err) {
      logger.error("Error in generatePlanV2:", err);
      if (err instanceof z.ZodError) {
        response.status(400).json({
          error: {
            message: "Invalid input",
            details: err.errors,
          },
        });
      } else if (err instanceof Error) {
        response.status(500).json({
          error: {
            message: err.message,
          },
        });
      } else {
        response.status(500).json({
          error: {
            message: "An unknown error occurred",
          },
        });
      }
    }
  },
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

// ============================================================================
//
//   FUNCTION 3: sendVerificationEmail (HTTP Endpoint)
//
// ============================================================================

export const sendVerificationEmail = onRequest(
  {
    cors: true,
    secrets: [mailgunApiKey, mailgunDomain, mailgunFromEmail],
  },
  async (request, response) => {
    logger.info("Function received request for sendVerificationEmail", request.body);

    try {
      const { userId, email, firstName, code } = request.body;

      if (!userId || !email || !code) {
        response.status(400).json({
          success: false,
          error: "Missing required fields",
        });
        return;
      }

      // Get secrets
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

      // Create verification email HTML
      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName || "there"},</p>
              <p>Welcome to <strong>FitSquad</strong>! Please verify your email address to complete your account setup.</p>
              <p>Your verification code is:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 24 hours.</p>
              <p>If you didn't create a FitSquad account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FitSquad by Quandary Development</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Prepare form
      const form = new FormData();
      form.append("from", `FitSquad <${fromEmail}>`);
      form.append("to", email);
      form.append("subject", "Verify your FitSquad email");
      form.append("html", emailBody);

      // Send
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
      logger.info("Mailgun verification email sent:", result);

      response.status(200).json({ success: true });
    } catch (err) {
      logger.error("Error sending verification email:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      response.status(500).json({ success: false, error: errorMessage });
    }
  },
);

// ============================================================================
//
//   FUNCTION 4: verifyEmail (HTTP Endpoint)
//
// ============================================================================

export const verifyEmail = onRequest(
  {
    cors: true,
  },
  async (request, response) => {
    logger.info("Function received request for verifyEmail", request.body);

    try {
      const input = VerifyEmailInputSchema.parse(request.body);
      const db = admin.firestore();

      // Get user account
      const accountRef = db.collection("accounts").doc(input.userId);
      const accountSnap = await accountRef.get();

      if (!accountSnap.exists) {
        response.status(404).json({
          success: false,
          error: "Account not found",
        });
        return;
      }

      const accountData = accountSnap.data();

      // Check if already verified
      if (accountData?.emailVerified) {
        response.status(200).json({
          success: true,
          message: "Email already verified",
        });
        return;
      }

      // Check verification code
      if (accountData?.verificationCode !== input.code) {
        response.status(400).json({
          success: false,
          error: "Invalid verification code",
        });
        return;
      }

      // Check if code expired (24 hours)
      const expiresAt = accountData?.verificationCodeExpires
        ? new Date(accountData.verificationCodeExpires)
        : null;

      if (!expiresAt || new Date() > expiresAt) {
        response.status(400).json({
          success: false,
          error: "Verification code has expired",
        });
        return;
      }

      // Mark email as verified
      await accountRef.update({
        emailVerified: true,
        verificationCode: admin.firestore.FieldValue.delete(),
        verificationCodeExpires: admin.firestore.FieldValue.delete(),
      });

      logger.info(`Email verified for user ${input.userId}`);

      response.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (err) {
      logger.error("Error verifying email:", err);
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

// ============================================================================
//
//   FUNCTION 4: sendTeamInvitation (HTTP Endpoint)
//
// ============================================================================

export const sendTeamInvitation = onRequest(
  {
    cors: true,
    secrets: [mailgunApiKey, mailgunDomain, mailgunFromEmail],
  },
  async (request, response) => {
    logger.info("Function received request for sendTeamInvitation", {
      to: request.body.to,
      teamName: request.body.teamName,
    });

    try {
      // 1. Validate input
      const input = SendTeamInvitationInputSchema.parse(request.body);

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

      // 3. Create invitation email HTML
      const baseUrl = getAppBaseUrl();
      const acceptLink = `${baseUrl}/dashboard/invitations?teamId=${input.teamId}&invitationId=${input.invitationId}&action=accept`;
      const declineLink = `${baseUrl}/dashboard/invitations?teamId=${input.teamId}&invitationId=${input.invitationId}&action=decline`;

      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .greeting { font-size: 16px; margin-bottom: 20px; }
            .team-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .team-info p { margin: 5px 0; }
            .team-name { font-weight: bold; font-size: 18px; color: #667eea; }
            .inviter { color: #666; font-size: 14px; }
            .actions { margin: 30px 0; text-align: center; }
            .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; border-radius: 6px; text-decoration: none; font-weight: bold; transition: all 0.3s; }
            .btn-accept { background: #10b981; color: white; }
            .btn-accept:hover { background: #059669; }
            .btn-decline { background: #ef4444; color: white; }
            .btn-decline:hover { background: #dc2626; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
            .expires { background: #fef3c7; border: 1px solid #fcd34d; padding: 12px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ Team Invitation</h1>
              <p>You're invited to join a team on FitSquad</p>
            </div>
            <div class="content">
              <div class="greeting">
                <p>Hi <strong>${input.soldierName}</strong>,</p>
                <p><strong>${input.inviterName}</strong> has invited you to join <strong>"${input.teamName}"</strong> on FitSquad!</p>
              </div>

              <div class="team-info">
                <p class="team-name">📍 ${input.teamName}</p>
                <p class="inviter">Invited by: ${input.inviterName}</p>
              </div>

              <p>Once you accept, you'll be able to:</p>
              <ul>
                <li>Track your ACFT fitness scores</li>
                <li>View team performance metrics</li>
                <li>Access team-generated workout plans</li>
                <li>Collaborate with your team members</li>
              </ul>

              <div class="expires">
                ⏰ This invitation expires in 30 days
              </div>

              <div class="actions">
                <a href="${acceptLink}" class="btn btn-accept">✓ Accept Invitation</a>
                <a href="${declineLink}" class="btn btn-decline">✗ Decline Invitation</a>
              </div>

              <p style="font-size: 14px; color: #666;">
                If the buttons above don't work, you can also visit: <br>
                <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${baseUrl}/dashboard/invitations?teamId=${input.teamId}&invitationId=${input.invitationId}</code>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FitSquad. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // 4. Prepare form for Mailgun
      const form = new FormData();
      form.append("from", `FitSquad <${fromEmail}>`);
      form.append("to", input.to);
      form.append("subject", `You're invited to join "${input.teamName}" on FitSquad`);
      form.append("html", emailBody);

      // 5. Send email via Mailgun
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
      logger.info("Team invitation email sent successfully:", result);

      // 6. Respond
      response.status(200).json({ success: true });
    } catch (err) {
      logger.error("Team invitation send error:", err);
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