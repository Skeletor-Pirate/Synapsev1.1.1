'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmailAction(to: string, subject: string, text: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Synapse OS" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
    });

    return { success: true, data: info };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
