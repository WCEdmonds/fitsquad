import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { z } from "zod";

const SendPushNotificationInputSchema = z.object({
  teamId: z.string(),
  type: z.string(), // e.g., 'schedule_update'
  title: z.string().optional(),
  body: z.string().optional(),
});

export const sendPushNotification = onRequest(
  { cors: true },
  async (request, response) => {
    logger.info("Function received request for sendPushNotification", request.body);

    try {
      // Validate input
      // Ideally we should also validate auth (check if caller is supervisor/admin)
      // For now we'll assume the same auth check as others or skip for simplicity of stub
      
      let input;
      try {
        input = SendPushNotificationInputSchema.parse(request.body);
      } catch (e) {
        // If body is { data: { ... } } wrapper like callable or some setups
        if (request.body.data) {
           input = SendPushNotificationInputSchema.parse(request.body.data);
        } else {
           throw e;
        }
      }

      const db = admin.firestore();

      // Get users in team
      const accountsSnap = await db.collection("accounts")
        .where("teamId", "==", input.teamId)
        .get();

      if (accountsSnap.empty) {
        logger.info(`No users found for team ${input.teamId}`);
        response.status(200).json({ success: true, message: "No users in team" });
        return;
      }

      const tokens: string[] = [];
      accountsSnap.forEach(doc => {
        const data = doc.data();
        // Collect tokens from array or single field
        if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
          tokens.push(...data.fcmTokens);
        } else if (data.fcmToken) {
          tokens.push(data.fcmToken);
        }
      });

      // Dedup
      const uniqueTokens = [...new Set(tokens)].filter(t => !!t && typeof t === "string" && t.length > 0);

      if (uniqueTokens.length === 0) {
        logger.info("No FCM tokens found for team users");
        response.status(200).json({ success: true, message: "No tokens found" });
        return;
      }

      const message = {
        notification: {
          title: input.title || "Plan Updated",
          body: input.body || "A new workout plan is available!",
        },
        data: {
          type: input.type,
          teamId: input.teamId,
          click_action: "FLUTTER_NOTIFICATION_CLICK" // Standard for hybrid apps often, or handle in app
        },
        tokens: uniqueTokens,
      };

      const result = await admin.messaging().sendEachForMulticast(message);
      
      logger.info(`Sent ${result.successCount} messages, failed ${result.failureCount}`);
      
      if (result.failureCount > 0) {
        const failedTokens: string[] = [];
        result.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(uniqueTokens[idx]);
             // Could cleanup invalid tokens here
             // if (resp.error?.code === 'messaging/invalid-registration-token') ...
          }
        });
        logger.warn("Failed tokens:", failedTokens);
      }

      response.status(200).json({ 
        success: true, 
        successCount: result.successCount, 
        failureCount: result.failureCount 
      });

    } catch (err) {
      logger.error("Error sending push:", err);
      if (err instanceof z.ZodError) {
        response.status(400).json({
          error: {
            message: "Invalid input",
            details: err.errors,
          },
        });
      } else {
        response.status(500).json({
          error: {
             message: err instanceof Error ? err.message : "Internal server error"
          }
        });
      }
    }
  }
);
