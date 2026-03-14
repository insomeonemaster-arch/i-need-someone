const { smsQueue } = require('../index');
const { send, sendOtp } = require('../../sms');

smsQueue.process('send', async (job) => {
  const { to, body } = job.data;
  await send(to, body);
});

smsQueue.process('otp', async (job) => {
  const { phone, otp } = job.data;
  await sendOtp(phone, otp);
});

smsQueue.on('failed', (job, err) => {
  console.error(`[SmsQueue] Job ${job.id} failed:`, err.message);
});

console.log('[Worker] SMS queue started');
