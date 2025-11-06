/**
 * @fileOverview A server-side action to send email invitations using Mailgun via fetch.
 *
 * - sendInviteEmail - A function that sends an email.
 * - SendInviteEmailInput - The input type for the sendInviteEmail function.
 */

import { z } from 'zod';

const SendInviteEmailInputSchema = z.object({
  to: z.string().email().describe('The recipient\'s email address.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The HTML or text body of the email.'),
});
export type SendInviteEmailInput = z.infer<typeof SendInviteEmailInputSchema>;

export async function sendInviteEmail(input: SendInviteEmailInput): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.MAILGUN_FROM_EMAIL;
    
    if (!apiKey || !domain || !fromEmail) {
      const errorMsg = 'Mailgun environment variables are not configured.';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const form = new FormData();
    form.append('from', `FitSquad <${fromEmail}>`);
    form.append('to', input.to);
    form.append('subject', input.subject);
    form.append('html', input.body);

    try {
      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64')
        },
        body: form
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Mailgun API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      const result = await response.json();
      console.log('Mailgun send success:', result);
      return { success: true };

    } catch (err: any) {
      console.error('Mailgun send error:', err);
      return { success: false, error: err.message };
    }
}
