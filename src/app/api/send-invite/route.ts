import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * @fileOverview A Next.js API route (serverless function) to send email invitations using Mailgun.
 * This replaces the "use server" action.
 */

// Schema copied from your original file
const SendInviteEmailInputSchema = z.object({
  to: z.string().email().describe('The recipient\'s email address.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The HTML or text body of the email.'),
});

type SendInviteEmailInput = z.infer<typeof SendInviteEmailInputSchema>;

/**
 * API route handler for POST requests.
 */
export async function POST(request: Request) {
  let input: SendInviteEmailInput;

  // 1. Parse and validate the incoming JSON body
  try {
    const body = await request.json();
    input = SendInviteEmailInputSchema.parse(body);
  } catch (e: any) {
    return NextResponse.json({ success: false, error: "Invalid request body: " + e.message }, { status: 400 });
  }

  // 2. Retrieve environment variables
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;
  
  if (!apiKey || !domain || !fromEmail) {
    const errorMsg = 'Mailgun environment variables are not configured.';
    console.error(errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  // 3. Prepare the form data for Mailgun
  const form = new FormData();
  form.append('from', `FitSquad <${fromEmail}>`);
  form.append('to', input.to);
  form.append('subject', input.subject);
  form.append('html', input.body);

  // 4. Send the request to Mailgun
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
    
    // 5. Return a successful JSON response
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Mailgun send error:', err);
    // 6. Return an error JSON response
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}