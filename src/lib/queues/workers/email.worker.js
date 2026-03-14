const { emailQueue } = require('../index');
const { send, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendNewMessageEmail } = require('../../email');

emailQueue.process('send', async (job) => {
  const { to, subject, html, text } = job.data;
  await send({ to, subject, html, text });
});

emailQueue.process('verification', async (job) => {
  const { to, token, name } = job.data;
  await sendVerificationEmail(to, token, name);
});

emailQueue.process('password-reset', async (job) => {
  const { to, token, name } = job.data;
  await sendPasswordResetEmail(to, token, name);
});

emailQueue.process('welcome', async (job) => {
  const { to, name } = job.data;
  await sendWelcomeEmail(to, name);
});

emailQueue.process('new-message', async (job) => {
  const { to, name, senderName, preview } = job.data;
  await sendNewMessageEmail(to, name, senderName, preview);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[EmailQueue] Job ${job.id} (${job.name}) failed:`, err.message);
});

emailQueue.on('completed', (job) => {
  console.log(`[EmailQueue] Job ${job.id} (${job.name}) completed`);
});

console.log('[Worker] Email queue started');
