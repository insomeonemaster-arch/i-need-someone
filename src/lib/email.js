const { BrevoClient } = require('@getbrevo/brevo');

const brevo = process.env.BREVO_API_KEY 
  ? new BrevoClient({ apiKey: process.env.BREVO_API_KEY })
  : null;

const FROM = { name: process.env.BREVO_FROM_NAME || 'I Need Someone', email: process.env.BREVO_FROM_EMAIL };

const send = async ({ to, subject, html, text }) => {
  if (!process.env.BREVO_API_KEY) {
    console.log('[EMAIL SKIPPED - no API key]', { to, subject });
    return;
  }

  const sender = { name: FROM.name, email: FROM.email };
  const toRecipient = [{ email: to, name: to }];

  return brevo.transactionalEmails.sendTransacEmail({
    sender,
    to: toRecipient,
    subject,
    htmlContent: html,
    textContent: text,
  });
};

const sendVerificationEmail = (to, token, name) => send({
  to,
  subject: 'Verify your email — I Need Someone',
  html: `
    <h2>Hi ${name},</h2>
    <p>Click the link below to verify your email address:</p>
    <a href="${process.env.APP_URL}/api/v1/auth/verify-email?token=${token}" 
       style="background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
      Verify Email
    </a>
    <p>This link expires in 24 hours.</p>
  `,
});

const sendPasswordResetEmail = (to, token, name) => send({
  to,
  subject: 'Reset your password — I Need Someone',
  html: `
    <h2>Hi ${name},</h2>
    <p>You requested a password reset. Click the link below:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}"
       style="background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
      Reset Password
    </a>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `,
});

const sendWelcomeEmail = (to, name) => send({
  to,
  subject: 'Welcome to I Need Someone!',
  html: `<h2>Welcome, ${name}!</h2><p>Your account is ready. Start by posting your first request or setting up your provider profile.</p>`,
});

const sendNewMessageEmail = (to, name, senderName, preview) => send({
  to,
  subject: `New message from ${senderName}`,
  html: `<h2>Hi ${name},</h2><p><strong>${senderName}</strong> sent you a message:</p><blockquote>${preview}</blockquote><a href="${process.env.FRONTEND_URL}/messages">View Message</a>`,
});

module.exports = { send, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendNewMessageEmail };
