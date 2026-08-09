'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAction(to: string, subject: string, text: string) {
  try {
    const data = await resend.emails.send({
      from: 'Synapse OS <onboarding@resend.dev>', // Default testing domain for Resend
      to,
      subject,
      text,
    });

    if (data.error) {
      console.error('Resend error:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
