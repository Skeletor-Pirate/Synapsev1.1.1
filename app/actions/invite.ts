'use server';

let resendClient: any = null;

async function getResend() {
  console.log('getResend called, apiKey exists:', !!process.env.RESEND_API_KEY);
  if (!resendClient) {
    const { Resend } = await import('resend');
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '' || apiKey === 're_123') {
      throw new Error('RESEND_API_KEY is not set or invalid in environment variables. Please set it in the Settings menu.');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendInvitation(email: string, orgName: string, token: string) {
  try {
    const resend = await getResend();
    const verificationLink = `${process.env.APP_URL}/verify?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: 'aryanarora26110@gmail.com', // MUST be a verified sender in your Resend dashboard
      to: email,
      subject: `Invitation to join ${orgName}`,
      html: `<p>You have been invited to join <strong>${orgName}</strong>. Click <a href="${verificationLink}">here</a> to accept and verify your email.</p>`
    });

    if (error) {
      console.error('Full Resend Error:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message || 'Unknown validation error' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
