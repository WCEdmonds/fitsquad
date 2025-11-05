import { config } from 'dotenv';
config();

import '@/ai/flows/provide-workout-suggestions-based-on-performance.ts';
import '@/ai/flows/generate-tailored-workout-plan.ts';
// The send-invite-email is no longer a Genkit flow, so it does not need to be imported here.
