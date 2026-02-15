import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  to: string,
  resetCode: string,
  firstName: string | null
): Promise<void> {
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  const mailOptions = {
    from: `"Paris Stories" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your Paris Stories password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #1A1F36; color: #FFFFFF; border-radius: 16px;">
        <h1 style="font-size: 24px; text-align: center; margin-bottom: 8px; color: #FFFFFF;">Paris Stories</h1>
        <p style="text-align: center; color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 32px;">Password Reset</p>
        
        <p style="color: #FFFFFF; font-size: 16px;">${greeting},</p>
        <p style="color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.6;">
          You requested a password reset. Use the code below in the app to set a new password. This code is valid for 1 hour.
        </p>
        
        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #C8A2FF;">${resetCode}</span>
        </div>
        
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email. Your password won't be changed.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
